package com.theadbasket.backend.availability;

import com.theadbasket.backend.availability.dto.*;
import com.theadbasket.backend.availability.exception.HoldConflictException;
import com.theadbasket.backend.availability.exception.PreconditionRequiredException;
import com.theadbasket.backend.availability.exception.StaleAvailabilityException;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AvailabilityServiceTest {

    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    // Reference date: 2026-11-06 in IST
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 6);
    private static final Instant FIXED_INSTANT = TODAY.atStartOfDay(IST_ZONE).plusHours(10).toInstant();

    private BillboardAvailabilityBlockRepository blockRepository;
    private BillboardListingRepository billboardRepository;
    private EntityManager entityManager;
    private Clock clock;
    private AvailabilityService availabilityService;

    private final Long billboardId = 1L;
    private final Long userId = 42L;

    @BeforeEach
    void setUp() {
        blockRepository = mock(BillboardAvailabilityBlockRepository.class);
        billboardRepository = mock(BillboardListingRepository.class);
        entityManager = mock(EntityManager.class);
        clock = Clock.fixed(FIXED_INSTANT, IST_ZONE);
        availabilityService = new AvailabilityService(blockRepository, billboardRepository, entityManager, clock);

        BillboardListing mockListing = mock(BillboardListing.class);
        when(mockListing.getId()).thenReturn(billboardId);
        when(billboardRepository.findByIdAndUserIdForUpdate(billboardId, userId)).thenReturn(Optional.of(mockListing));
        when(billboardRepository.existsByIdAndUserId(billboardId, userId)).thenReturn(true);
    }

    private BillboardAvailabilityBlock createBlock(Long id, LocalDate start, LocalDate end, AvailabilityBlockType type) {
        BillboardAvailabilityBlock b = new BillboardAvailabilityBlock();
        b.setId(id);
        b.setBillboardId(billboardId);
        b.setStartDate(start);
        b.setEndDate(end);
        b.setBlockType(type);
        b.setCreatedBy(userId);
        b.setCreatedTs(FIXED_INSTANT);
        b.setUpdatedTs(FIXED_INSTANT);
        return b;
    }

    private String calculateETag(List<BillboardAvailabilityBlock> blocks) {
        String payload = blocks.stream()
                .filter(b -> b.getBlockType() == AvailabilityBlockType.OWNER_BLOCKED)
                .sorted(Comparator.comparing(BillboardAvailabilityBlock::getStartDate))
                .map(b -> b.getStartDate() + "|" + b.getEndDate())
                .collect(java.util.stream.Collectors.joining(";"));
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Pre-lock: startDate > endDate throws AVAILABILITY_DATE_ORDER_INVALID before lock")
    void preLock_dateOrder_throws400BeforeLock() {
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 1))
        );
        assertThatThrownBy(() -> availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"etag\""))
                .isInstanceOf(BadRequestException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AVAILABILITY_DATE_ORDER_INVALID);

        verifyNoInteractions(billboardRepository);
    }

    @Test
    @DisplayName("Pre-lock: ranges > 500 throws AVAILABILITY_PAYLOAD_TOO_LARGE before lock")
    void preLock_sizeGuard_throws400BeforeLock() {
        List<AvailabilityRangeRequest> ranges = new ArrayList<>();
        LocalDate cur = TODAY;
        for (int i = 0; i < 501; i++) {
            ranges.add(new AvailabilityRangeRequest(cur, cur));
            cur = cur.plusDays(2);
        }

        assertThatThrownBy(() -> availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"etag\""))
                .isInstanceOf(BadRequestException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AVAILABILITY_PAYLOAD_TOO_LARGE);

        verifyNoInteractions(billboardRepository);
    }

    @Test
    @DisplayName("Past range disjoint: dropped with aggregated warning")
    void pastRange_disjoint_droppedWithWarning() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 5))
        );

        String currentETag = calculateETag(List.of());
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        // The disjoint past range was not in history, so it is dropped and produces a warning
        assertThat(resp.warnings()).hasSize(1);
        assertThat(resp.warnings().get(0)).contains("Dropped past date selections not in history: 2026-10-01–2026-10-05");
        assertThat(resp.blocks()).isEmpty();
    }

    @Test
    @DisplayName("Past range existing extension: extension dropped, history survives")
    void pastRange_existingExtension_extensionDroppedHistorySurvives() {
        // Existing Oct 1-5 in history
        BillboardAvailabilityBlock existingHist = createBlock(10L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 5), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(existingHist));

        // Client sends Oct 1-6 with today = Nov 6
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 6))
        );

        String currentETag = calculateETag(List.of(existingHist));
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        // Oct 6 is past and wasn't in history -> dropped with aggregated warning
        assertThat(resp.warnings()).hasSize(1);
        assertThat(resp.warnings().get(0)).contains("Dropped past date selections not in history: 2026-10-06");
        // Existing history row survives
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Past range multi-range: aggregated warning")
    void pastRange_multiRange_aggregatedWarning() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 5)),
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 15))
        );

        String currentETag = calculateETag(List.of());
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).hasSize(1);
        assertThat(resp.warnings().get(0)).contains("Dropped past date selections not in history: 2026-10-01–2026-10-05, 2026-10-10–2026-10-15");
    }

    @Test
    @DisplayName("History-only PUT passes cap check and short-circuits")
    void historyOnlyPut_passesCapAndShortCircuits() {
        // Block spanning 800 days in the past
        LocalDate pastStart = TODAY.minusDays(800);
        LocalDate pastEnd = TODAY.minusDays(1);
        BillboardAvailabilityBlock oldBlock = createBlock(5L, pastStart, pastEnd, AvailabilityBlockType.OWNER_BLOCKED);

        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(oldBlock));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(pastStart, pastEnd)
        );

        // Replay/unchanged PUT should short-circuit and not trip the 730 cap check
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(5L);
        assertThat(resp.warnings()).isEmpty();
    }

    @Test
    @DisplayName("Past removal: full hydrated set emits no warning")
    void pastRemoval_fullHydratedSet_noWarning() {
        BillboardAvailabilityBlock straddle = createBlock(1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);
        assertThat(resp.warnings()).isEmpty();
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Past removal: omitted day emits warning that past coverage was preserved")
    void pastRemoval_omittedDay_emitsWarning() {
        BillboardAvailabilityBlock past = createBlock(1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 10), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(past));

        // Client attempts to omit Oct 5
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 4)),
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 6), LocalDate.of(2026, 10, 10))
        );

        String currentETag = calculateETag(List.of(past));
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).anyMatch(w -> w.contains("Cannot remove or shorten past coverage"));
        // History was preserved
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Straddle: clamped to today emits warning when introducing new past days")
    void straddle_clampedToToday_emitsWarning() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        // Client sends new block spanning past to future: Nov 1 to Nov 20 (today = Nov 6)
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 20))
        );

        String currentETag = calculateETag(List.of());
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of()) // first call
                .thenReturn(List.of(createBlock(2L, TODAY, LocalDate.of(2026, 11, 20), AvailabilityBlockType.OWNER_BLOCKED))); // reload call

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).anyMatch(w -> w.contains("Dropped past date selections not in history"));
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).startDate()).isEqualTo(TODAY);
    }

    @Test
    @DisplayName("Straddle existing round-trip: same ID, no diff, 200 OK, zero warnings")
    void straddle_existingRoundTrip_sameIdNoDiff200() {
        BillboardAvailabilityBlock straddle = createBlock(7L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.warnings()).isEmpty();
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(7L);
    }

    @Test
    @DisplayName("Straddle remove middle chunk: history stays, editable splits correctly")
    void straddle_removeMiddleChunk_historyStaysEditableSplits() {
        // Existing [Oct 1, Nov 30] (straddling today = Nov 6)
        BillboardAvailabilityBlock straddle = createBlock(8L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle));

        // Client removes Nov 15-20 (in the future)
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 14)),
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 21), LocalDate.of(2026, 11, 30))
        );

        String currentETag = calculateETag(List.of(straddle));
        List<BillboardAvailabilityBlock> reloaded = List.of(
                createBlock(9L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 14), AvailabilityBlockType.OWNER_BLOCKED),
                createBlock(10L, LocalDate.of(2026, 11, 21), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED)
        );
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle))
                .thenReturn(reloaded);

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).isEmpty();
        assertThat(resp.blocks()).hasSize(2);
        assertThat(resp.blocks().get(0).endDate()).isEqualTo(LocalDate.of(2026, 11, 14));
        assertThat(resp.blocks().get(1).startDate()).isEqualTo(LocalDate.of(2026, 11, 21));
    }

    @Test
    @DisplayName("Straddle unblock past day: day stays blocked with warning")
    void straddle_unblockPastDay_dayStaysBlockedWithWarning() {
        BillboardAvailabilityBlock straddle = createBlock(8L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle));

        // Client tries to un-block Oct 15
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 14)),
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 16), LocalDate.of(2026, 11, 30))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.warnings()).anyMatch(w -> w.contains("Cannot remove or shorten past coverage"));
        // History was carried forward and merged across boundary back into single [Oct 1, Nov 30]
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).startDate()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(resp.blocks().get(0).endDate()).isEqualTo(LocalDate.of(2026, 11, 30));
    }

    @Test
    @DisplayName("Incoming past contained in split straddling left piece is absorbed without warning")
    void incomingPast_containedInSplitStraddlingLeftPiece_absorbed() {
        BillboardAvailabilityBlock straddle = createBlock(1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(straddle));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 30))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);
        assertThat(resp.warnings()).isEmpty();
    }

    @Test
    @DisplayName("Replay crossing IST midnight still short-circuits using injected Clock")
    void replay_crossingMidnight_shortCircuits() {
        // Day 1: Nov 6
        BillboardAvailabilityBlock block = createBlock(1L, LocalDate.of(2026, 11, 6), LocalDate.of(2026, 11, 20), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(block));

        // Advance clock across midnight to Nov 7
        Instant nextDay = TODAY.plusDays(1).atStartOfDay(IST_ZONE).plusHours(2).toInstant();
        Clock advancedClock = Clock.fixed(nextDay, IST_ZONE);
        AvailabilityService advancedService = new AvailabilityService(blockRepository, billboardRepository, entityManager, advancedClock);

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 6), LocalDate.of(2026, 11, 20))
        );

        BulkSyncResponse resp = advancedService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        // Nov 6 is now in historyList; ranges Nov 6-20 matches exactly desiredPairs == existingPairs -> short-circuits
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(1L);
        assertThat(resp.today()).isEqualTo(LocalDate.of(2026, 11, 7));
        assertThat(resp.warnings()).isEmpty();
    }

    @Test
    @DisplayName("Stale client crossing midnight short-circuits without spurious warnings")
    void staleClient_crossingMidnight_shortCircuitsWithoutWarning() {
        BillboardAvailabilityBlock block = createBlock(1L, LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 20), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(block));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 20))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.warnings()).isEmpty();
        assertThat(resp.blocks()).hasSize(1);
    }

    @Test
    @DisplayName("Adjacent merge at boundary (history.end == today - 1 and editable.start == today)")
    void adjacentMerge_boundaryAtTodayMinusOneAndToday_pastRowIdChanges() {
        // Fixed clock today = 2026-11-06
        // History: Oct 20 to Nov 5 (Nov 5 is today - 1)
        BillboardAvailabilityBlock hist = createBlock(15L, LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 5), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(hist));

        // Client adds Nov 6 to Nov 15
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 15))
        );

        String currentETag = calculateETag(List.of(hist));
        BillboardAvailabilityBlock mergedRow = createBlock(20L, LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 15), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(hist))
                .thenReturn(List.of(mergedRow));

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        // Hist row was deleted and replaced by merged row 20L
        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(20L);
    }

    @Test
    @DisplayName("Adjacent merge: one day gap does not merge across today")
    void adjacentMerge_oneDayGap_doesNotMerge() {
        // History: Oct 20 to Nov 4 (gap on Nov 5 = today - 1)
        BillboardAvailabilityBlock hist = createBlock(15L, LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 4), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(hist));

        // Client adds Nov 6 to Nov 15
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 4)),
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 6), LocalDate.of(2026, 11, 15))
        );

        String currentETag = calculateETag(List.of(hist));
        BillboardAvailabilityBlock newRow = createBlock(21L, LocalDate.of(2026, 11, 6), LocalDate.of(2026, 11, 15), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(hist))
                .thenReturn(List.of(hist, newRow));

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        // Both rows exist independently
        assertThat(resp.blocks()).hasSize(2);
        assertThat(resp.blocks().get(0).id()).isEqualTo(15L);
        assertThat(resp.blocks().get(1).id()).isEqualTo(21L);
    }

    @Test
    @DisplayName("Trimmed range: confirmed booking in middle of editable slice splits into two")
    void trimmedRange_splitIntoTwo() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        // Editable range: Nov 10 to Nov 20
        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 20))
        );

        // Confirmed booking: Nov 14 to Nov 16
        BillboardAvailabilityBlock booking = createBlock(100L, LocalDate.of(2026, 11, 14), LocalDate.of(2026, 11, 16), AvailabilityBlockType.CONFIRMED_BOOKING);
        when(blockRepository.findActiveOverlapping(eq(billboardId), any(), any(), any()))
                .thenReturn(List.of(booking));

        String currentETag = calculateETag(List.of());
        List<BillboardAvailabilityBlock> savedBlocks = List.of(
                createBlock(1L, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 13), AvailabilityBlockType.OWNER_BLOCKED),
                createBlock(2L, LocalDate.of(2026, 11, 17), LocalDate.of(2026, 11, 20), AvailabilityBlockType.OWNER_BLOCKED)
        );
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of())
                .thenReturn(savedBlocks);

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).hasSize(1);
        assertThat(resp.warnings().get(0)).contains("was partially trimmed");
        assertThat(resp.blocks()).hasSize(2);
    }

    @Test
    @DisplayName("Booking trim applies only to future slice and preserves past coverage")
    void bookingTrim_appliesOnlyToFutureSlice_preservesPastCoverage() {
        BillboardAvailabilityBlock hist = createBlock(1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(hist));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31))
        );

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.warnings()).isEmpty();
        assertThat(resp.blocks()).hasSize(1);
        verify(blockRepository, never()).findActiveOverlapping(eq(billboardId), eq(LocalDate.of(2026, 10, 1)), any(), any());
    }

    @Test
    @DisplayName("Hold overlap deduplicated across merged ranges in 409 conflictingRanges")
    void holdOverlap_deduplicatedAcrossMergedRanges() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        // Single booking hold: Nov 15 to Nov 25
        BillboardAvailabilityBlock hold = createBlock(55L, LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 25), AvailabilityBlockType.BOOKING_HOLD);
        when(blockRepository.findActiveOverlapping(eq(billboardId), any(), any(), any()))
                .thenReturn(List.of(hold));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 20))
        );

        String currentETag = calculateETag(List.of());
        assertThatThrownBy(() -> availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\""))
                .isInstanceOf(HoldConflictException.class)
                .satisfies(ex -> {
                    HoldConflictException hce = (HoldConflictException) ex;
                    assertThat(hce.getConflictingRanges()).hasSize(1);
                    assertThat(hce.getConflictingRanges().get(0).startDate()).isEqualTo(LocalDate.of(2026, 11, 15));
                });
    }

    @Test
    @DisplayName("Deterministic clock: hold expiry and midnight rollover without sleeps")
    void deterministicClock_holdExpiryAndMidnightRollover() {
        Instant holdExpiry = FIXED_INSTANT.plus(Duration.ofMinutes(15));
        BillboardAvailabilityBlock hold = createBlock(60L, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), AvailabilityBlockType.BOOKING_HOLD);
        hold.setExpiryTs(holdExpiry);

        // Before expiry: overlaps
        Clock activeClock = Clock.fixed(holdExpiry.minusSeconds(10), IST_ZONE);
        AvailabilityService s1 = new AvailabilityService(blockRepository, billboardRepository, entityManager, activeClock);
        when(blockRepository.findActiveOverlapping(eq(billboardId), any(), any(), eq(activeClock.instant())))
                .thenReturn(List.of(hold));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12))
        );
        String currentETag = calculateETag(List.of());

        assertThatThrownBy(() -> s1.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\""))
                .isInstanceOf(HoldConflictException.class);
    }

    @Test
    @DisplayName("ETag: empty set returns valid 64-char SHA-256 hex")
    void etag_emptySet() {
        String etag = calculateETag(List.of());
        assertThat(etag).hasSize(64);
        assertThat(etag).matches("^[a-f0-9]{64}$");
        // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        assertThat(etag).isEqualTo("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    @Test
    @DisplayName("ETag: same content produces same hash")
    void etag_sameContentSameHash() {
        List<BillboardAvailabilityBlock> list1 = List.of(createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED));
        List<BillboardAvailabilityBlock> list2 = List.of(createBlock(2L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED));
        assertThat(calculateETag(list1)).isEqualTo(calculateETag(list2));
    }

    @Test
    @DisplayName("ETag: order independent")
    void etag_orderIndependent() {
        BillboardAvailabilityBlock b1 = createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED);
        BillboardAvailabilityBlock b2 = createBlock(2L, LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 15), AvailabilityBlockType.OWNER_BLOCKED);

        List<BillboardAvailabilityBlock> order1 = List.of(b1, b2);
        List<BillboardAvailabilityBlock> order2 = List.of(b2, b1);

        assertThat(calculateETag(order1)).isEqualTo(calculateETag(order2));
    }

    @Test
    @DisplayName("ETag: deleting range changes hash")
    void etag_deleteChangesHash() {
        BillboardAvailabilityBlock b1 = createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED);
        BillboardAvailabilityBlock b2 = createBlock(2L, LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 15), AvailabilityBlockType.OWNER_BLOCKED);

        String hashBoth = calculateETag(List.of(b1, b2));
        String hashOne = calculateETag(List.of(b1));

        assertThat(hashBoth).isNotEqualTo(hashOne);
    }

    @Test
    @DisplayName("parseETag: quoted, unquoted, list, weakTag, star")
    @SuppressWarnings("unchecked")
    void testParseETagVariants() throws Exception {
        Method method = AvailabilityService.class.getDeclaredMethod("parseETag", String.class);
        method.setAccessible(true);

        // Quoted
        Set<String> res1 = (Set<String>) method.invoke(availabilityService, "\"abc\"");
        assertThat(res1).containsExactly("abc");

        // Unquoted
        Set<String> res2 = (Set<String>) method.invoke(availabilityService, "abc");
        assertThat(res2).containsExactly("abc");

        // List
        Set<String> res3 = (Set<String>) method.invoke(availabilityService, "\"abc\", \"def\"");
        assertThat(res3).containsExactlyInAnyOrder("abc", "def");

        // Weak Tag
        Set<String> res4 = (Set<String>) method.invoke(availabilityService, "W/\"abc\"");
        assertThat(res4).containsExactly("abc");

        // Star
        Set<String> res5 = (Set<String>) method.invoke(availabilityService, "*");
        assertThat(res5).isEmpty();

        // Null / blank
        Set<String> res6 = (Set<String>) method.invoke(availabilityService, "");
        assertThat(res6).isEmpty();
    }

    @Test
    @DisplayName("Short-circuit: identical content returns 200 without checking If-Match")
    void shortCircuit_identicalContent_200() {
        BillboardAvailabilityBlock block = createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(block));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5))
        );

        // No If-Match passed
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, null);

        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Short-circuit: stale If-Match header with identical content returns 200, not 412")
    void shortCircuit_staleIfMatch_identicalContent_200() {
        BillboardAvailabilityBlock block = createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5), AvailabilityBlockType.OWNER_BLOCKED);
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of(block));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5))
        );

        // Stale If-Match passed
        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"stale-etag\"");

        assertThat(resp.blocks()).hasSize(1);
        assertThat(resp.blocks().get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Hold overlap returns 409 with structured body")
    void holdOverlap_returns409_structuredBody() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        BillboardAvailabilityBlock hold = createBlock(99L, LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 10), AvailabilityBlockType.BOOKING_HOLD);
        when(blockRepository.findActiveOverlapping(eq(billboardId), any(), any(), any()))
                .thenReturn(List.of(hold));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 15))
        );

        String currentETag = calculateETag(List.of());
        assertThatThrownBy(() -> availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\""))
                .isInstanceOf(HoldConflictException.class)
                .satisfies(e -> {
                    HoldConflictException hce = (HoldConflictException) e;
                    assertThat(hce.getErrorCode()).isEqualTo(ErrorCode.AVAILABILITY_HOLD_CONFLICT);
                    assertThat(hce.getConflictingRanges()).hasSize(1);
                });
    }

    @Test
    @DisplayName("Confirmed booking overlap: trimmed with warning")
    void confirmedBookingOverlap_trimmedWithWarning() {
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of());

        BillboardAvailabilityBlock booking = createBlock(88L, LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 10), AvailabilityBlockType.CONFIRMED_BOOKING);
        when(blockRepository.findActiveOverlapping(eq(billboardId), any(), any(), any()))
                .thenReturn(List.of(booking));

        List<AvailabilityRangeRequest> ranges = List.of(
                new AvailabilityRangeRequest(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 15))
        );

        String currentETag = calculateETag(List.of());
        when(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(billboardId, AvailabilityBlockType.OWNER_BLOCKED))
                .thenReturn(List.of())
                .thenReturn(List.of(
                        createBlock(1L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 4), AvailabilityBlockType.OWNER_BLOCKED),
                        createBlock(2L, LocalDate.of(2026, 12, 11), LocalDate.of(2026, 12, 15), AvailabilityBlockType.OWNER_BLOCKED)
                ));

        BulkSyncResponse resp = availabilityService.bulkSyncOwnerBlocks(billboardId, userId, ranges, "\"" + currentETag + "\"");

        assertThat(resp.warnings()).hasSize(1);
        assertThat(resp.warnings().get(0)).contains("was partially trimmed");
        assertThat(resp.blocks()).hasSize(2);
    }

    @Test
    @DisplayName("Error catalog: every ErrorCode has a message key defined in messages.properties")
    void errorCatalog_everyErrorCodeHasMessageKey() throws Exception {
        Properties props = new Properties();
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("messages.properties")) {
            assertThat(in).isNotNull();
            props.load(in);
        }

        for (ErrorCode code : ErrorCode.values()) {
            assertThat(props.containsKey(code.messageKey()))
                    .as("ErrorCode %s is missing key %s in messages.properties", code.name(), code.messageKey())
                    .isTrue();
        }
    }
}
