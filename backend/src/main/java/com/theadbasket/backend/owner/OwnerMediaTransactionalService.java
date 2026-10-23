package com.theadbasket.backend.owner;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ConflictException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.storage.FileStorageService;
import com.theadbasket.backend.owner.dto.BillboardMediaDto;
import com.theadbasket.backend.owner.dto.SyncFileMapping;
import com.theadbasket.backend.owner.dto.SyncManifest;

@Service
public class OwnerMediaTransactionalService {

    private static final Logger log = LoggerFactory.getLogger(OwnerMediaTransactionalService.class);

    private final BillboardListingRepository billboardListingRepository;
    private final BillboardMediaRepository billboardMediaRepository;
    private final FileStorageService fileStorageService;
    private final String mediaBaseUrl;

    public record IngestedMedia(
            SyncFileMapping mapping,
            FileStorageService.StoredFile storedFile
    ) {
    }

    public OwnerMediaTransactionalService(
            BillboardListingRepository billboardListingRepository,
            BillboardMediaRepository billboardMediaRepository,
            FileStorageService fileStorageService,
            @Value("${app.media.base-url:/api/media}") String mediaBaseUrl) {
        this.billboardListingRepository = billboardListingRepository;
        this.billboardMediaRepository = billboardMediaRepository;
        this.fileStorageService = fileStorageService;
        this.mediaBaseUrl = mediaBaseUrl;
    }

    @Transactional
    public List<BillboardMediaDto> executeSync(
            Long listingId,
            Long userId,
            SyncManifest manifest,
            List<IngestedMedia> ingestedFiles) {

        BillboardListing listing = billboardListingRepository.findByIdForUpdate(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        List<BillboardMedia> existingMedia = billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listingId);
        Map<Long, BillboardMedia> existingById = new HashMap<>();
        Set<String> existingUploadIds = new HashSet<>();
        Map<MediaCategory, Integer> categoryCounts = new HashMap<>();

        for (BillboardMedia m : existingMedia) {
            existingById.put(m.getId(), m);
            existingUploadIds.add(m.getUploadId());
            categoryCounts.put(m.getCategory(), categoryCounts.getOrDefault(m.getCategory(), 0) + 1);
        }

        // 1. Process staged deletes (load with findByIdAndBillboardId, ignore if already gone)
        List<BillboardMedia> toDelete = new ArrayList<>();
        List<Path> pathsToDeleteOnCommit = new ArrayList<>();
        boolean coverDeleted = false;

        for (Long deleteId : manifest.stagedDeleteIds()) {
            BillboardMedia m = existingById.get(deleteId);
            if (m != null) {
                toDelete.add(m);
                existingById.remove(deleteId);
                categoryCounts.put(m.getCategory(), Math.max(0, categoryCounts.getOrDefault(m.getCategory(), 0) - 1));
                if (m.isCover()) {
                    coverDeleted = true;
                }
                pathsToDeleteOnCommit.add(fileStorageService.resolvePath(m.getStorageKey()));
            }
        }

        // 2. Filter out duplicate uploadIds under lock (Idempotency)
        List<IngestedMedia> toInsert = new ArrayList<>();
        for (IngestedMedia item : ingestedFiles) {
            if (!existingUploadIds.contains(item.mapping().uploadId())) {
                toInsert.add(item);
                categoryCounts.put(item.mapping().category(), categoryCounts.getOrDefault(item.mapping().category(), 0) + 1);
            }
        }

        // 3. Enforce caps
        for (MediaCategory cat : MediaCategory.values()) {
            int count = categoryCounts.getOrDefault(cat, 0);
            if (count > cat.getMaxCount()) {
                throw new BadRequestException(ErrorCode.MEDIA_CAP_EXCEEDED,
                        String.format("Limit exceeded for %s: maximum allowed is %d", cat.name(), cat.getMaxCount()));
            }
        }

        // 4. If listing is PENDING_APPROVAL or ACTIVE, enforce post-sync dayPhotos >= 2
        int effectiveDayPhotos = categoryCounts.getOrDefault(MediaCategory.DAY_PHOTO, 0);
        if ((listing.getStatus() == BillboardStatus.PENDING_APPROVAL || listing.getStatus() == BillboardStatus.ACTIVE)
                && effectiveDayPhotos < MediaCategory.DAY_PHOTO.getMinCount()) {
            throw new ConflictException(ErrorCode.MINIMUM_DAY_PHOTOS_REQUIRED,
                    "An active or pending listing must have at least 2 day photos");
        }

        // 5. Delete staged rows
        if (!toDelete.isEmpty()) {
            billboardMediaRepository.deleteAll(toDelete);
        }

        // 6. Check existing cover
        boolean hasCover = !coverDeleted && existingById.values().stream().anyMatch(BillboardMedia::isCover);

        // 7. Insert new files in clientIndex order
        int maxDisplayOrder = billboardMediaRepository.findMaxDisplayOrderByBillboardIdAndCategory(listingId, MediaCategory.DAY_PHOTO);

        for (IngestedMedia item : toInsert) {
            maxDisplayOrder++;
            boolean makeCover = false;
            if (!hasCover && item.mapping().category() == MediaCategory.DAY_PHOTO) {
                makeCover = true;
                hasCover = true;
            }

            BillboardMedia entity = new BillboardMedia(
                    listing,
                    item.mapping().category(),
                    item.storedFile().storageKey(),
                    item.mapping().uploadId(),
                    item.storedFile().originalName(),
                    item.storedFile().contentType(),
                    item.storedFile().fileSizeBytes(),
                    makeCover ? Boolean.TRUE : null,
                    maxDisplayOrder
            );
            BillboardMedia saved = billboardMediaRepository.save(entity);
            existingById.put(saved.getId(), saved);
        }

        // 8. If cover was deleted and no new day photo claimed it, auto-promote lowest display_order day photo
        if (!hasCover) {
            existingById.values().stream()
                    .filter(m -> m.getCategory() == MediaCategory.DAY_PHOTO)
                    .min((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                    .ifPresent(m -> {
                        m.setIsCover(Boolean.TRUE);
                        billboardMediaRepository.save(m);
                    });
        }

        // 9. Re-queue rule: if listing is ACTIVE and changes were made (files inserted or deleted), move to PENDING_APPROVAL
        boolean changesMade = !toDelete.isEmpty() || !toInsert.isEmpty();
        if (changesMade && listing.getStatus() == BillboardStatus.ACTIVE) {
            listing.setStatus(BillboardStatus.PENDING_APPROVAL);
            billboardListingRepository.save(listing);
        }

        // 10. Register afterCommit disk deletion for staged deleted files
        if (!pathsToDeleteOnCommit.isEmpty() && TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    for (Path p : pathsToDeleteOnCommit) {
                        try {
                            java.nio.file.Files.deleteIfExists(p);
                        } catch (IOException e) {
                            log.warn("Failed to delete physical media file {}: {}", p, e.getMessage());
                        }
                    }
                }
            });
        }

        return billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listingId)
                .stream()
                .map(m -> BillboardMediaDto.from(m, mediaBaseUrl))
                .toList();
    }

    @Transactional
    public BillboardMediaDto setCover(Long listingId, Long userId, Long mediaId) {
        BillboardListing listing = billboardListingRepository.findByIdForUpdate(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        BillboardMedia target = billboardMediaRepository.findByIdAndBillboardId(mediaId, listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MEDIA_NOT_FOUND, "Media asset not found"));

        if (target.getCategory() != MediaCategory.DAY_PHOTO) {
            throw new BadRequestException(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Only Day Photos can be set as the cover image");
        }

        // Clear existing cover
        billboardMediaRepository.findCoverByBillboardId(listingId).ifPresent(c -> {
            c.setIsCover(null);
            billboardMediaRepository.save(c);
        });

        target.setIsCover(Boolean.TRUE);
        BillboardMedia saved = billboardMediaRepository.save(target);
        return BillboardMediaDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public List<BillboardMediaDto> reorderMedia(Long listingId, Long userId, List<Long> mediaIds) {
        BillboardListing listing = billboardListingRepository.findByIdForUpdate(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        List<BillboardMedia> allMedia = billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listingId);
        Set<Long> existingIds = new HashSet<>();
        Map<Long, BillboardMedia> mediaMap = new HashMap<>();
        for (BillboardMedia m : allMedia) {
            existingIds.add(m.getId());
            mediaMap.put(m.getId(), m);
        }

        if (mediaIds.size() != existingIds.size() || !existingIds.containsAll(mediaIds)) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "mediaIds must contain exactly all media IDs belonging to this listing");
        }

        int order = 1;
        for (Long id : mediaIds) {
            BillboardMedia m = mediaMap.get(id);
            m.setDisplayOrder(order++);
            billboardMediaRepository.save(m);
        }

        return billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listingId)
                .stream()
                .map(m -> BillboardMediaDto.from(m, mediaBaseUrl))
                .toList();
    }

    @Transactional
    public void deleteSingleMedia(Long listingId, Long userId, Long mediaId) {
        BillboardListing listing = billboardListingRepository.findByIdForUpdate(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        BillboardMedia target = billboardMediaRepository.findByIdAndBillboardId(mediaId, listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MEDIA_NOT_FOUND, "Media asset not found"));

        // If listing is PENDING_APPROVAL or ACTIVE and target is DAY_PHOTO, enforce min 2
        if ((listing.getStatus() == BillboardStatus.PENDING_APPROVAL || listing.getStatus() == BillboardStatus.ACTIVE)
                && target.getCategory() == MediaCategory.DAY_PHOTO) {
            long dayCount = billboardMediaRepository.countByBillboardIdAndCategory(listingId, MediaCategory.DAY_PHOTO);
            if (dayCount <= MediaCategory.DAY_PHOTO.getMinCount()) {
                throw new ConflictException(ErrorCode.MINIMUM_DAY_PHOTOS_REQUIRED,
                        "An active or pending listing must have at least 2 day photos");
            }
        }

        boolean wasCover = target.isCover();
        String storageKey = target.getStorageKey();

        billboardMediaRepository.delete(target);

        // If deleted was cover, auto-promote next lowest display_order day photo
        if (wasCover) {
            billboardMediaRepository.findFirstByBillboardIdAndCategoryOrderByDisplayOrderAsc(listingId, MediaCategory.DAY_PHOTO)
                    .ifPresent(next -> {
                        next.setIsCover(Boolean.TRUE);
                        billboardMediaRepository.save(next);
                    });
        }

        // If listing was ACTIVE, re-queue to PENDING_APPROVAL
        if (listing.getStatus() == BillboardStatus.ACTIVE) {
            listing.setStatus(BillboardStatus.PENDING_APPROVAL);
            billboardListingRepository.save(listing);
        }

        Path filePath = fileStorageService.resolvePath(storageKey);
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        java.nio.file.Files.deleteIfExists(filePath);
                    } catch (IOException e) {
                        log.warn("Failed to delete physical media file {}: {}", filePath, e.getMessage());
                    }
                }
            });
        }
    }
}
