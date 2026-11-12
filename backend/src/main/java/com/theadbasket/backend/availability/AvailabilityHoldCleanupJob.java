package com.theadbasket.backend.availability;

import com.theadbasket.backend.config.DateTimeConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

/**
 * Periodically purges expired {@link AvailabilityBlockType#BOOKING_HOLD} rows from
 * {@code billboard_availability_blocks}.
 *
 * <p>Active queries already ignore expired holds via {@code expiryTs > :now}, so this job
 * performs storage hygiene and removes stale hold rows without holding listing locks.
 */
@Component
public class AvailabilityHoldCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityHoldCleanupJob.class);

    private final BillboardAvailabilityBlockRepository blockRepository;
    private final Clock clock;

    public AvailabilityHoldCleanupJob(
            BillboardAvailabilityBlockRepository blockRepository,
            @Autowired(required = false) Clock clock) {
        this.blockRepository = blockRepository;
        this.clock = (clock != null) ? clock : Clock.system(DateTimeConfig.IST_ZONE);
    }

    @Scheduled(fixedDelayString = "${app.availability.hold-cleanup-interval-ms:300000}")
    @Transactional
    public void scheduledCleanup() {
        purgeExpiredHolds();
    }

    @Transactional
    public int purgeExpiredHolds() {
        Instant now = clock.instant();
        int deleted = blockRepository.deleteExpiredHolds(AvailabilityBlockType.BOOKING_HOLD, now);
        if (deleted > 0) {
            log.info("Purged {} expired booking hold(s) at {}", deleted, now);
        }
        return deleted;
    }
}

