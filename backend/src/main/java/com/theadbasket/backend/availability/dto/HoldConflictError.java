package com.theadbasket.backend.availability.dto;

import com.theadbasket.backend.common.error.ErrorCode;
import java.time.Instant;
import java.util.List;

public record HoldConflictError(
    Instant timestamp,
    int status,
    String error,
    String errorCode,
    String message,
    String path,
    List<DateRangeDto> conflictingRanges
) {
    public static HoldConflictError of(String path, String message, List<DateRangeDto> conflictingRanges) {
        return new HoldConflictError(
            Instant.now(),
            409,
            "Conflict",
            ErrorCode.AVAILABILITY_HOLD_CONFLICT.name(),
            message,
            path,
            conflictingRanges
        );
    }
}
