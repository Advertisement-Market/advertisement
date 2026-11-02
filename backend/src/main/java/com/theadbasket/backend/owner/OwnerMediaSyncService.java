package com.theadbasket.backend.owner;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.storage.FileStorageService;
import com.theadbasket.backend.owner.dto.BillboardMediaDto;
import com.theadbasket.backend.owner.dto.SyncFileMapping;
import com.theadbasket.backend.owner.dto.SyncManifest;

@Service
public class OwnerMediaSyncService {

    private static final Logger log = LoggerFactory.getLogger(OwnerMediaSyncService.class);

    private static final int MAX_BATCH_FILES = 10;
    private static final long MAX_BATCH_BYTES = 60 * 1024 * 1024L; // 60 MB

    private final BillboardListingRepository billboardListingRepository;
    private final BillboardMediaRepository billboardMediaRepository;
    private final FileStorageService fileStorageService;
    private final OwnerMediaTransactionalService transactionalService;
    private final String mediaBaseUrl;

    public OwnerMediaSyncService(
            BillboardListingRepository billboardListingRepository,
            BillboardMediaRepository billboardMediaRepository,
            FileStorageService fileStorageService,
            OwnerMediaTransactionalService transactionalService,
            @Value("${app.media.base-url:/api/media}") String mediaBaseUrl) {
        this.billboardListingRepository = billboardListingRepository;
        this.billboardMediaRepository = billboardMediaRepository;
        this.fileStorageService = fileStorageService;
        this.transactionalService = transactionalService;
        this.mediaBaseUrl = mediaBaseUrl;
    }

    public List<BillboardMediaDto> getListingMedia(Long listingId, Long userId) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        return billboardMediaRepository.findByBillboardIdOrderByDisplayOrderAscCreatedTsAsc(listing.getId())
                .stream()
                .map(m -> BillboardMediaDto.from(m, mediaBaseUrl))
                .toList();
    }

    @SuppressWarnings("null")
    public List<BillboardMediaDto> syncMedia(
            Long listingId,
            Long userId,
            SyncManifest manifest,
            List<MultipartFile> files) {

        if (files == null) {
            files = Collections.emptyList();
        }
        if (manifest == null) {
            manifest = new SyncManifest(Collections.emptyList(), Collections.emptyList());
        }

        // ── Step 0: Cheap pre-checks ──
        if (files.size() > MAX_BATCH_FILES) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Cannot upload more than " + MAX_BATCH_FILES + " files in a single batch");
        }

        long totalBytes = 0;
        for (MultipartFile f : files) {
            if (f != null) {
                totalBytes += f.getSize();
            }
        }
        if (totalBytes > MAX_BATCH_BYTES) {
            throw new BadRequestException(ErrorCode.FILE_TOO_LARGE, "Total batch size exceeds 60MB limit");
        }

        // Validate manifest mappings
        List<SyncFileMapping> mappings = manifest.fileMappings();
        Set<Integer> seenIndices = new HashSet<>();
        Set<String> manifestUploadIds = new HashSet<>();

        for (SyncFileMapping m : mappings) {
            if (m.clientIndex() == null || m.clientIndex() < 0 || m.clientIndex() >= files.size()) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Invalid clientIndex in file mappings: " + m.clientIndex());
            }
            if (!seenIndices.add(m.clientIndex())) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Duplicate clientIndex in file mappings: " + m.clientIndex());
            }
            if (m.uploadId() == null || m.uploadId().isBlank()) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "uploadId is required for all uploaded files");
            }
            if (!manifestUploadIds.add(m.uploadId())) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Duplicate uploadId in manifest: " + m.uploadId());
            }
        }

        if (seenIndices.size() != files.size()) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Every uploaded file must have an entry in fileMappings");
        }

        // Verify listing exists, owned by user, and not suspended
        BillboardListing listing = billboardListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        // Lock-free check for already-inserted uploadIds (idempotency optimization)
        Set<String> alreadyStoredUploadIds = new HashSet<>();
        if (!manifestUploadIds.isEmpty()) {
            List<BillboardMedia> existingUploads = billboardMediaRepository.findByBillboardIdAndUploadIdIn(listingId, manifestUploadIds);
            for (BillboardMedia em : existingUploads) {
                alreadyStoredUploadIds.add(em.getUploadId());
            }
        }

        // ── Step 1: Ingestion & Disk writes ──
        List<Path> newlyWrittenFiles = new ArrayList<>();
        List<OwnerMediaTransactionalService.IngestedMedia> ingestedFiles = new ArrayList<>();

        try {
            for (SyncFileMapping m : mappings) {
                if (alreadyStoredUploadIds.contains(m.uploadId())) {
                    log.info("Skipping already processed uploadId {} during ingestion", m.uploadId());
                    continue;
                }

                MultipartFile file = files.get(m.clientIndex());
                String subDir = "billboards/" + listingId;
                String preferredFilename = UUID.randomUUID().toString();

                FileStorageService.StoredFile stored;
                if (m.category() == MediaCategory.VIDEO) {
                    stored = fileStorageService.storeVideo(subDir, file, preferredFilename);
                } else {
                    stored = fileStorageService.storeImage(subDir, file, preferredFilename);
                }

                Path writtenPath = fileStorageService.resolvePath(stored.storageKey());
                newlyWrittenFiles.add(writtenPath);
                ingestedFiles.add(new OwnerMediaTransactionalService.IngestedMedia(m, stored));
            }

            // ── Step 2: Inner Transactional Call ──
            return transactionalService.executeSync(listingId, userId, manifest, ingestedFiles);

        } catch (Exception ex) {
            // Rollback catch: delete newly written files immediately on any error
            log.warn("Media sync failed for listing {}. Cleaning up {} written files: {}",
                    listingId, newlyWrittenFiles.size(), ex.getMessage());
            for (Path p : newlyWrittenFiles) {
                try {
                    java.nio.file.Files.deleteIfExists(p);
                } catch (IOException e) {
                    log.warn("Failed to delete orphaned file {}: {}", p, e.getMessage());
                }
            }
            throw ex;
        }
    }

    public BillboardMediaDto uploadSingleMedia(
            Long listingId,
            Long userId,
            MediaCategory category,
            String uploadId,
            MultipartFile file) {

        final String finalUploadId = (uploadId == null || uploadId.isBlank())
                ? UUID.randomUUID().toString()
                : uploadId;

        SyncFileMapping mapping = new SyncFileMapping(0, category, finalUploadId);
        SyncManifest manifest = new SyncManifest(Collections.emptyList(), List.of(mapping));

        List<BillboardMediaDto> result = syncMedia(listingId, userId, manifest, List.of(file));

        return result.stream()
                .filter(m -> finalUploadId.equals(billboardMediaRepository.findById(m.id()).map(BillboardMedia::getUploadId).orElse(null)))
                .findFirst()
                .orElseGet(() -> result.isEmpty() ? null : result.get(result.size() - 1));
    }

    public BillboardMediaDto setCover(Long listingId, Long userId, Long mediaId) {
        return transactionalService.setCover(listingId, userId, mediaId);
    }

    public List<BillboardMediaDto> reorderMedia(Long listingId, Long userId, List<Long> mediaIds) {
        return transactionalService.reorderMedia(listingId, userId, mediaIds);
    }

    public void deleteMedia(Long listingId, Long userId, Long mediaId) {
        transactionalService.deleteSingleMedia(listingId, userId, mediaId);
    }
}
