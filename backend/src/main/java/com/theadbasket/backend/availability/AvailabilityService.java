package com.theadbasket.backend.availability;

import com.theadbasket.backend.availability.dto.AvailabilityBlockDto;
import com.theadbasket.backend.availability.dto.AvailabilityRangeRequest;
import com.theadbasket.backend.availability.dto.BulkSyncResponse;
import com.theadbasket.backend.availability.dto.DateRangeDto;
import com.theadbasket.backend.availability.dto.OwnerAvailabilityResponse;
import com.theadbasket.backend.availability.dto.PublicAvailabilityDto;
import com.theadbasket.backend.availability.exception.AvailabilityBusyException;
import com.theadbasket.backend.availability.exception.HoldConflictException;
import com.theadbasket.backend.availability.exception.ListingNotActiveException;
import com.theadbasket.backend.availability.exception.PreconditionRequiredException;
import com.theadbasket.backend.availability.exception.StaleAvailabilityException;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.BillboardStatus;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityService.class);

    /**
     * Canonical business timezone for billboard calendar boundaries ("today" / past cutoff).
     * Anchored deliberately to IST (Asia/Kolkata) and returned as {@code today} in owner API
     * responses so client calendars and server validation agree across client timezones.
     */
    public static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    private final BillboardAvailabilityBlockRepository blockRepository;
    private final BillboardListingRepository billboardRepository;
    private final EntityManager entityManager;
    private final Clock clock;

    public AvailabilityService(
            BillboardAvailabilityBlockRepository blockRepository,
            BillboardListingRepository billboardRepository,
            EntityManager entityManager,
            @Autowired(required = false) Clock clock) {
        this.blockRepository = blockRepository;
        this.billboardRepository = billboardRepository;
        this.entityManager = entityManager;
        this.clock = (clock != null) ? clock : Clock.system(IST_ZONE);
    }

    public boolean isPubliclyVisible(Long billboardId) {
        return billboardRepository.existsByIdAndStatus(billboardId, BillboardStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public OwnerAvailabilityResponse getOwnerBlocks(Long billboardId, Long userId) {
        if (!billboardRepository.existsByIdAndUserId(billboardId, userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND);
        }
        Instant now = clock.instant();
        LocalDate today = now.atZone(IST_ZONE).toLocalDate();
        List<BillboardAvailabilityBlock> ownerBlocks = blockRepository
                .findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED);
        String etag = computeETag(ownerBlocks);
        List<AvailabilityBlockDto> dtos = buildOwnerCalendarDtos(billboardId, ownerBlocks, today, now);
        return new OwnerAvailabilityResponse(dtos, etag, today);
    }

    @Transactional(readOnly = true)
    public List<PublicAvailabilityDto> getPublicBlocks(Long billboardId, LocalDate from, LocalDate to) {
        AvailabilityDateValidator.validatePublicWindow(from, to);

        // Visibility check runs before the past-window short-circuit so non-active or missing
        // listings consistently return 404 LISTING_NOT_ACTIVE instead of cacheable 200 [].
        if (!isPubliclyVisible(billboardId)) {
            throw new ListingNotActiveException();
        }

        final Instant now = clock.instant();
        final LocalDate today = now.atZone(IST_ZONE).toLocalDate();

        // Privacy: If the query window ends before today, it is entirely past -> return empty list immediately
        if (to != null && to.isBefore(today)) {
            return List.of();
        }

        // Privacy: Clamp effective window start to today (never leak historical owner blocks or past bookings)
        LocalDate effectiveFrom = (from != null && from.isAfter(today)) ? from : today;
        LocalDate defaultTo = effectiveFrom.plusDays(AvailabilityDateValidator.DEFAULT_PUBLIC_WINDOW_DAYS);
        LocalDate effectiveTo = (to != null)
                ? to
                : (defaultTo.isAfter(AvailabilityDateValidator.MAX_SUPPORTED_DATE)
                        ? AvailabilityDateValidator.MAX_SUPPORTED_DATE
                        : defaultTo);

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new BadRequestException(ErrorCode.AVAILABILITY_WINDOW_INVALID);
        }
        if (ChronoUnit.DAYS.between(effectiveFrom, effectiveTo) + 1 > AvailabilityDateValidator.MAX_RANGE_DAYS) {
            throw new BadRequestException(ErrorCode.AVAILABILITY_WINDOW_TOO_LARGE);
        }

        List<BillboardAvailabilityBlock> activeBlocks = blockRepository.findPublicActiveBlocks(
                billboardId, effectiveFrom, effectiveTo, now);

        // Merge contiguous and overlapping ranges across all block types
        List<DateRangeDto> merged = new ArrayList<>();
        for (BillboardAvailabilityBlock b : activeBlocks) {
            if (merged.isEmpty()) {
                merged.add(new DateRangeDto(b.getStartDate(), b.getEndDate()));
                continue;
            }
            DateRangeDto last = merged.get(merged.size() - 1);
            boolean overlapsOrAdjacent = !b.getStartDate().isAfter(last.endDate().plusDays(1));
            if (overlapsOrAdjacent) {
                LocalDate maxEnd = b.getEndDate().isAfter(last.endDate()) ? b.getEndDate() : last.endDate();
                merged.set(merged.size() - 1, new DateRangeDto(last.startDate(), maxEnd));
            } else {
                merged.add(new DateRangeDto(b.getStartDate(), b.getEndDate()));
            }
        }

        // Clip each merged block to the queried [effectiveFrom, effectiveTo] window
        List<PublicAvailabilityDto> clipped = new ArrayList<>();
        for (DateRangeDto m : merged) {
            LocalDate clippedStart = m.startDate().isBefore(effectiveFrom) ? effectiveFrom : m.startDate();
            LocalDate clippedEnd   = m.endDate().isAfter(effectiveTo)      ? effectiveTo   : m.endDate();
            if (!clippedStart.isAfter(clippedEnd)) {
                clipped.add(new PublicAvailabilityDto(clippedStart, clippedEnd));
            }
        }
        return clipped;
    }

    @Transactional
    public void createInitialOwnerBlocks(
            Long billboardId, Long userId, List<AvailabilityRangeRequest> incomingRanges) {
        if (incomingRanges == null || incomingRanges.isEmpty()) {
            return;
        }
        final Instant now = clock.instant();
        final LocalDate today = now.atZone(IST_ZONE).toLocalDate();
        List<AvailabilityRangeRequest> validated = AvailabilityDateValidator.validateBulkSyncRanges(incomingRanges, today);

        List<DateRangeDto> editableList = new ArrayList<>();
        for (AvailabilityRangeRequest range : validated) {
            if (range.endDate().isBefore(today)) {
                continue;
            }
            LocalDate start = range.startDate().isBefore(today) ? today : range.startDate();
            editableList.add(new DateRangeDto(start, range.endDate()));
        }
        if (editableList.isEmpty()) {
            return;
        }

        editableList.sort(Comparator.comparing(DateRangeDto::startDate).thenComparing(DateRangeDto::endDate));
        List<DateRangeDto> merged = mergeContiguousRanges(editableList);
        for (DateRangeDto range : merged) {
            long days = ChronoUnit.DAYS.between(range.startDate(), range.endDate()) + 1;
            if (days > AvailabilityDateValidator.MAX_RANGE_DAYS
                    || ChronoUnit.DAYS.between(today, range.endDate()) > AvailabilityDateValidator.MAX_RANGE_DAYS) {
                throw new BadRequestException(ErrorCode.AVAILABILITY_RANGE_TOO_LONG);
            }
        }

        List<BillboardAvailabilityBlock> blocks = new ArrayList<>(merged.size());
        for (DateRangeDto range : merged) {
            BillboardAvailabilityBlock block = new BillboardAvailabilityBlock();
            block.setBillboardId(billboardId);
            block.setStartDate(range.startDate());
            block.setEndDate(range.endDate());
            block.setBlockType(AvailabilityBlockType.OWNER_BLOCKED);
            block.setCreatedBy(userId);
            block.setCreatedTs(now);
            block.setUpdatedTs(now);
            blocks.add(block);
        }
        blockRepository.saveAll(blocks);
        entityManager.flush();
    }

    @Transactional
    public BulkSyncResponse bulkSyncOwnerBlocks(
            Long billboardId, Long userId, List<AvailabilityRangeRequest> incomingRanges, String ifMatchHeader) {

        // Step 0: Pre-Lock Fast Validation (Stateless, Zero DB State)
        // Capture a single instant and server today once per request from the injected Clock so pre-lock and post-lock phases stay consistent.
        final Instant now = clock.instant();
        final LocalDate today = now.atZone(IST_ZONE).toLocalDate();
        incomingRanges = AvailabilityDateValidator.validateBulkSyncRanges(incomingRanges, today);

        // Step 1: Acquire PESSIMISTIC_WRITE lock via existing repository method
        BillboardListing listing;
        try {
            listing = billboardRepository.findByIdAndUserIdForUpdate(billboardId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND));
        } catch (PessimisticLockingFailureException e) {
            log.warn("Lock acquisition timed out for billboard id={}: {}", billboardId, e.getMessage());
            throw new AvailabilityBusyException();
        }
        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        // Step 2: Load existing OWNER_BLOCKED and compute current ETag
        List<BillboardAvailabilityBlock> existing = blockRepository
                .findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED);
        String currentETag = computeETag(existing);

        // Step 3: Two-List Split at Today & Past Coverage Checks ⟳ Rev2
        List<String> warnings = new ArrayList<>();

        // 3a. Extract canonical immutable historyList from existing pre-today DB rows
        List<DateRangeDto> historyList = new ArrayList<>();
        for (BillboardAvailabilityBlock b : existing) {
            if (b.getEndDate().isBefore(today)) {
                historyList.add(new DateRangeDto(b.getStartDate(), b.getEndDate()));
            } else if (b.getStartDate().isBefore(today)) {
                historyList.add(new DateRangeDto(b.getStartDate(), today.minusDays(1)));
            }
        }
        historyList.sort(Comparator.comparing(DateRangeDto::startDate).thenComparing(DateRangeDto::endDate));
        historyList = mergeContiguousRanges(historyList);

        // 3b. Extract incomingPast: all incoming coverage clipped to (-inf, today - 1]
        List<DateRangeDto> incomingPast = new ArrayList<>();
        for (AvailabilityRangeRequest range : incomingRanges) {
            if (range.startDate().isBefore(today)) {
                LocalDate pastEnd = range.endDate().isBefore(today) ? range.endDate() : today.minusDays(1);
                incomingPast.add(new DateRangeDto(range.startDate(), pastEnd));
            }
        }
        incomingPast.sort(Comparator.comparing(DateRangeDto::startDate));
        List<DateRangeDto> mergedIncomingPast = mergeContiguousRanges(incomingPast);

        // 3c. Rule 1: Warn if any part of historyList is missing from incomingPast
        for (DateRangeDto hist : historyList) {
            List<DateRangeDto> uncoveredPieces = subtractRanges(hist, mergedIncomingPast);
            if (!uncoveredPieces.isEmpty()) {
                warnings.add("Cannot remove or shorten past coverage " + hist.startDate() + "–" + hist.endDate()
                        + ": past date coverage is read-only and was preserved");
            }
        }

        // 3d. Rule 2: Single aggregated warning for incoming pre-today days not in history
        List<DateRangeDto> uncoveredPast = subtractRangesList(mergedIncomingPast, historyList);
        if (!uncoveredPast.isEmpty()) {
            String droppedList = uncoveredPast.stream()
                    .map(r -> r.startDate().equals(r.endDate()) ? r.startDate().toString() : r.startDate() + "–" + r.endDate())
                    .collect(Collectors.joining(", "));
            warnings.add("Dropped past date selections not in history: " + droppedList + "; past dates cannot be modified.");
        }

        // 3e. Build editableList from incoming ranges clamped to [today, endDate]
        List<DateRangeDto> editableList = new ArrayList<>();
        for (AvailabilityRangeRequest range : incomingRanges) {
            if (range.endDate().isBefore(today)) {
                // Entirely past incoming range: dropped from editableList
                continue;
            }
            if (range.startDate().isBefore(today)) {
                // Straddling range: clamp editable portion from today onward
                editableList.add(new DateRangeDto(today, range.endDate()));
            } else {
                // Purely future range: kept in full
                editableList.add(new DateRangeDto(range.startDate(), range.endDate()));
            }
        }

        // Step 4: Process editableList in isolation ⟳ Rev2
        editableList.sort(Comparator.comparing(DateRangeDto::startDate));
        List<DateRangeDto> mergedEditable = mergeContiguousRanges(editableList);

        // 4a. 730-day cap check strictly on editableList (cannot trip on history)
        for (DateRangeDto range : mergedEditable) {
            long days = ChronoUnit.DAYS.between(range.startDate(), range.endDate()) + 1;
            if (days > AvailabilityDateValidator.MAX_RANGE_DAYS
                    || ChronoUnit.DAYS.between(today, range.endDate()) > AvailabilityDateValidator.MAX_RANGE_DAYS) {
                throw new BadRequestException(ErrorCode.AVAILABILITY_RANGE_TOO_LONG);
            }
        }

        // 4b. Replay safe content-equality short-circuit before blocker queries
        List<DateRangeDto> proposedRanges = new ArrayList<>(historyList);
        if (!mergedEditable.isEmpty()) {
            if (!proposedRanges.isEmpty()) {
                DateRangeDto lastHistory = proposedRanges.get(proposedRanges.size() - 1);
                DateRangeDto firstEditable = mergedEditable.get(0);
                if (lastHistory.endDate().plusDays(1).equals(firstEditable.startDate())) {
                    proposedRanges.set(proposedRanges.size() - 1, new DateRangeDto(lastHistory.startDate(), firstEditable.endDate()));
                    proposedRanges.addAll(mergedEditable.subList(1, mergedEditable.size()));
                } else {
                    proposedRanges.addAll(mergedEditable);
                }
            } else {
                proposedRanges.addAll(mergedEditable);
            }
        }

        Set<String> proposedPairs = proposedRanges.stream()
                .map(r -> r.startDate() + "|" + r.endDate())
                .collect(Collectors.toSet());
        Set<String> existingPairs = existing.stream()
                .map(b -> b.getStartDate() + "|" + b.getEndDate())
                .collect(Collectors.toSet());

        if (proposedRanges.size() == existing.size() && proposedPairs.equals(existingPairs)) {
            List<AvailabilityBlockDto> dtos = buildOwnerCalendarDtos(billboardId, existing, today, now);
            return new BulkSyncResponse(dtos, warnings, currentETag, today);
        }

        // 4c. ETag optimistic concurrency check (fail fast before querying blockers or holds)
        if (ifMatchHeader == null || ifMatchHeader.isBlank()) {
            throw new PreconditionRequiredException();
        }
        Set<String> parsedIfMatch = parseETag(ifMatchHeader);
        if (!parsedIfMatch.contains(currentETag)) {
            List<AvailabilityBlockDto> currentDtos = buildOwnerCalendarDtos(billboardId, existing, today, now);
            throw new StaleAvailabilityException(currentDtos, currentETag, today);
        }

        // 4d. Check active holds and confirmed bookings strictly against editableList
        Map<Long, BillboardAvailabilityBlock> conflictingHoldsById = new LinkedHashMap<>();
        List<DateRangeDto> trimmedEditable = new ArrayList<>();

        List<BillboardAvailabilityBlock> allActiveBlockers = Collections.emptyList();
        if (!mergedEditable.isEmpty()) {
            LocalDate minStart = mergedEditable.get(0).startDate();
            LocalDate maxEnd = mergedEditable.get(mergedEditable.size() - 1).endDate();
            allActiveBlockers = blockRepository
                    .findActiveOverlapping(billboardId, minStart, maxEnd, now)
                    .stream()
                    .filter(b -> b.getBlockType() != AvailabilityBlockType.OWNER_BLOCKED)
                    .toList();
        }

        for (DateRangeDto range : mergedEditable) {
            List<BillboardAvailabilityBlock> blockers = allActiveBlockers.stream()
                    .filter(b -> !b.getStartDate().isAfter(range.endDate()) && !b.getEndDate().isBefore(range.startDate()))
                    .toList();

            for (BillboardAvailabilityBlock b : blockers) {
                if (b.getBlockType() == AvailabilityBlockType.BOOKING_HOLD) {
                    conflictingHoldsById.putIfAbsent(b.getId(), b);
                }
            }

            List<BillboardAvailabilityBlock> bookings = blockers.stream()
                    .filter(b -> b.getBlockType() == AvailabilityBlockType.CONFIRMED_BOOKING)
                    .toList();

            List<DateRangeDto> pieces = subtract(range, bookings);
            for (BillboardAvailabilityBlock booking : bookings) {
                warnings.add("Range " + range.startDate() + "–" + range.endDate() + " was partially trimmed: "
                        + booking.getStartDate() + "–" + booking.getEndDate() + " is confirmed-booked");
            }
            trimmedEditable.addAll(pieces);
        }

        if (!conflictingHoldsById.isEmpty()) {
            List<DateRangeDto> conflictingRanges = conflictingHoldsById.values().stream()
                    .map(h -> new DateRangeDto(h.getStartDate(), h.getEndDate()))
                    .toList();
            throw new HoldConflictException(conflictingRanges);
        }

        // Step 5: Concatenate historyList + trimmedEditable and run narrow boundary merge ⟳ Rev2
        List<DateRangeDto> finalRanges = new ArrayList<>(historyList);
        if (!trimmedEditable.isEmpty()) {
            if (!finalRanges.isEmpty()) {
                DateRangeDto lastHistory = finalRanges.get(finalRanges.size() - 1);
                DateRangeDto firstEditable = trimmedEditable.get(0);
                if (lastHistory.endDate().plusDays(1).equals(firstEditable.startDate())) {
                    finalRanges.set(finalRanges.size() - 1, new DateRangeDto(lastHistory.startDate(), firstEditable.endDate()));
                    finalRanges.addAll(trimmedEditable.subList(1, trimmedEditable.size()));
                } else {
                    finalRanges.addAll(trimmedEditable);
                }
            } else {
                finalRanges.addAll(trimmedEditable);
            }
        }

        // Step 6: Content-equality short-circuit (Replay safe after trimming)
        Set<String> desiredPairs = finalRanges.stream()
                .map(r -> r.startDate() + "|" + r.endDate())
                .collect(Collectors.toSet());

        if (finalRanges.size() == existing.size() && desiredPairs.equals(existingPairs)) {
            List<AvailabilityBlockDto> dtos = buildOwnerCalendarDtos(billboardId, existing, today, now);
            return new BulkSyncResponse(dtos, warnings, currentETag, today);
        }

        // Step 8: In-batch diff update without clearing persistence context ⟳ Rev2
        List<Long> toDeleteIds = existing.stream()
                .filter(b -> !desiredPairs.contains(b.getStartDate() + "|" + b.getEndDate()))
                .map(BillboardAvailabilityBlock::getId)
                .toList();

        if (!toDeleteIds.isEmpty()) {
            blockRepository.deleteAllByIdInBatch(toDeleteIds);
        }

        List<BillboardAvailabilityBlock> toInsert = new ArrayList<>();
        for (DateRangeDto range : finalRanges) {
            String key = range.startDate() + "|" + range.endDate();
            if (!existingPairs.contains(key)) {
                BillboardAvailabilityBlock block = new BillboardAvailabilityBlock();
                block.setBillboardId(billboardId);
                block.setStartDate(range.startDate());
                block.setEndDate(range.endDate());
                block.setBlockType(AvailabilityBlockType.OWNER_BLOCKED);
                block.setCreatedBy(userId);
                block.setCreatedTs(now);
                block.setUpdatedTs(now);
                toInsert.add(block);
            }
        }
        if (!toInsert.isEmpty()) {
            blockRepository.saveAll(toInsert);
        }
        entityManager.flush();

        // Step 9: Reload strictly from DB to preserve unchanged row IDs and generated new IDs ⟳ Rev2
        List<BillboardAvailabilityBlock> savedBlocks = blockRepository
                .findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED);
        String newETag = computeETag(savedBlocks);
        List<AvailabilityBlockDto> savedDtos = buildOwnerCalendarDtos(billboardId, savedBlocks, today, now);

        return new BulkSyncResponse(savedDtos, warnings, newETag, today);
    }

    private List<AvailabilityBlockDto> buildOwnerCalendarDtos(
            Long billboardId,
            List<BillboardAvailabilityBlock> ownerBlocks,
            LocalDate today,
            Instant now) {
        List<BillboardAvailabilityBlock> nonOwnerBlocks =
                blockRepository.findOwnerActiveNonOwnerBlocks(billboardId, today, now);
        if (nonOwnerBlocks == null || nonOwnerBlocks.isEmpty()) {
            return ownerBlocks.stream().map(AvailabilityBlockDto::from).toList();
        }
        List<BillboardAvailabilityBlock> combined = new ArrayList<>(ownerBlocks.size() + nonOwnerBlocks.size());
        combined.addAll(ownerBlocks);
        combined.addAll(nonOwnerBlocks);
        combined.sort(Comparator.comparing(BillboardAvailabilityBlock::getStartDate)
                .thenComparing(BillboardAvailabilityBlock::getEndDate)
                .thenComparing(b -> b.getId() != null ? b.getId() : Long.MAX_VALUE));
        return combined.stream().map(AvailabilityBlockDto::from).toList();
    }

    private List<DateRangeDto> mergeContiguousRanges(List<DateRangeDto> ranges) {
        List<DateRangeDto> merged = new ArrayList<>();
        for (DateRangeDto current : ranges) {
            if (merged.isEmpty()) {
                merged.add(current);
                continue;
            }
            DateRangeDto last = merged.get(merged.size() - 1);
            if (!current.startDate().isAfter(last.endDate().plusDays(1))) {
                LocalDate maxEnd = current.endDate().isAfter(last.endDate()) ? current.endDate() : last.endDate();
                merged.set(merged.size() - 1, new DateRangeDto(last.startDate(), maxEnd));
            } else {
                merged.add(current);
            }
        }
        return merged;
    }

    private List<DateRangeDto> subtractRangesList(List<DateRangeDto> source, List<DateRangeDto> blockers) {
        List<DateRangeDto> result = new ArrayList<>();
        for (DateRangeDto s : source) {
            result.addAll(subtractRanges(s, blockers));
        }
        return result;
    }

    private List<DateRangeDto> subtractRanges(DateRangeDto target, List<DateRangeDto> blockers) {
        List<DateRangeDto> pieces = new ArrayList<>();
        pieces.add(target);
        for (DateRangeDto blocker : blockers) {
            List<DateRangeDto> next = new ArrayList<>();
            for (DateRangeDto piece : pieces) {
                boolean noOverlap = blocker.endDate().isBefore(piece.startDate())
                        || blocker.startDate().isAfter(piece.endDate());
                if (noOverlap) {
                    next.add(piece);
                    continue;
                }
                if (piece.startDate().isBefore(blocker.startDate())) {
                    next.add(new DateRangeDto(piece.startDate(), blocker.startDate().minusDays(1)));
                }
                if (piece.endDate().isAfter(blocker.endDate())) {
                    next.add(new DateRangeDto(blocker.endDate().plusDays(1), piece.endDate()));
                }
            }
            pieces = next;
        }
        return pieces;
    }

    private String computeETag(List<BillboardAvailabilityBlock> blocks) {
        String payload = blocks.stream()
                .filter(b -> b.getBlockType() == AvailabilityBlockType.OWNER_BLOCKED)
                .sorted(Comparator.comparing(BillboardAvailabilityBlock::getStartDate)
                        .thenComparing(BillboardAvailabilityBlock::getEndDate))
                .map(b -> b.getStartDate() + "|" + b.getEndDate())
                .collect(Collectors.joining(";"));
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private Set<String> parseETag(String header) {
        if (header == null || header.isBlank() || "*".equals(header.trim())) return Set.of();
        return Arrays.stream(header.split(","))
                .map(String::trim)
                .map(s -> s.startsWith("W/") ? s.substring(2).trim() : s)
                .map(s -> s.length() >= 2 && s.startsWith("\"") && s.endsWith("\"")
                        ? s.substring(1, s.length() - 1)
                        : s)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    private List<DateRangeDto> subtract(DateRangeDto owner, List<BillboardAvailabilityBlock> blockers) {
        List<DateRangeDto> pieces = new ArrayList<>();
        pieces.add(owner);
        for (BillboardAvailabilityBlock blocker : blockers) {
            List<DateRangeDto> next = new ArrayList<>();
            for (DateRangeDto piece : pieces) {
                boolean noOverlap = blocker.getEndDate().isBefore(piece.startDate())
                        || blocker.getStartDate().isAfter(piece.endDate());
                if (noOverlap) {
                    next.add(piece);
                    continue;
                }
                if (piece.startDate().isBefore(blocker.getStartDate())) {
                    next.add(new DateRangeDto(piece.startDate(), blocker.getStartDate().minusDays(1)));
                }
                if (piece.endDate().isAfter(blocker.getEndDate())) {
                    next.add(new DateRangeDto(blocker.getEndDate().plusDays(1), piece.endDate()));
                }
            }
            pieces = next;
        }
        return pieces;
    }
}
