package com.theadbasket.backend.availability.exception;

import com.theadbasket.backend.availability.dto.DateRangeDto;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;

import java.time.Instant;
import java.util.List;

public class HoldConflictException extends AppException {
    private final List<DateRangeDto> conflictingRanges;
    private final Instant retryAfter;

    public HoldConflictException(List<DateRangeDto> conflictingRanges) {
        this(conflictingRanges, null);
    }

    public HoldConflictException(List<DateRangeDto> conflictingRanges, Instant retryAfter) {
        super(ErrorCode.AVAILABILITY_HOLD_CONFLICT);
        this.conflictingRanges = conflictingRanges;
        this.retryAfter = retryAfter;
    }

    public List<DateRangeDto> getConflictingRanges() {
        return conflictingRanges;
    }

    public Instant getRetryAfter() {
        return retryAfter;
    }
}
