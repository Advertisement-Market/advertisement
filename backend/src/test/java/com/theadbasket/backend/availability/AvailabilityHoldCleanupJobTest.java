package com.theadbasket.backend.availability;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AvailabilityHoldCleanupJobTest {

    @Test
    void purgeExpiredHolds_delegatesWithClockInstant() {
        BillboardAvailabilityBlockRepository blockRepository = mock(BillboardAvailabilityBlockRepository.class);
        Instant fixedNow = Instant.parse("2026-11-06T08:30:00Z");
        Clock fixedClock = Clock.fixed(fixedNow, ZoneId.of("Asia/Kolkata"));

        when(blockRepository.deleteExpiredHolds(AvailabilityBlockType.BOOKING_HOLD, fixedNow)).thenReturn(3);

        AvailabilityHoldCleanupJob job = new AvailabilityHoldCleanupJob(blockRepository, fixedClock);
        int deleted = job.purgeExpiredHolds();

        assertThat(deleted).isEqualTo(3);
        verify(blockRepository, times(1)).deleteExpiredHolds(AvailabilityBlockType.BOOKING_HOLD, fixedNow);
    }

    @Test
    void scheduledCleanup_handlesZeroExpiredHoldsCleanly() {
        BillboardAvailabilityBlockRepository blockRepository = mock(BillboardAvailabilityBlockRepository.class);
        Instant fixedNow = Instant.parse("2026-11-06T08:30:00Z");
        Clock fixedClock = Clock.fixed(fixedNow, ZoneId.of("Asia/Kolkata"));

        when(blockRepository.deleteExpiredHolds(AvailabilityBlockType.BOOKING_HOLD, fixedNow)).thenReturn(0);

        AvailabilityHoldCleanupJob job = new AvailabilityHoldCleanupJob(blockRepository, fixedClock);
        job.scheduledCleanup();

        verify(blockRepository, times(1)).deleteExpiredHolds(AvailabilityBlockType.BOOKING_HOLD, fixedNow);
    }
}

