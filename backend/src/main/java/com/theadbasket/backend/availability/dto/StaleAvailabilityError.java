package com.theadbasket.backend.availability.dto;

import com.theadbasket.backend.common.error.ErrorCode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record StaleAvailabilityError(
    Instant timestamp,
    int status,
    String error,
    String errorCode,
    String message,
    String path,
    List<AvailabilityBlockDto> currentBlocks,
    String etag,
    LocalDate today
) {
    public static StaleAvailabilityError of(String path, String message, List<AvailabilityBlockDto> currentBlocks, String etag, LocalDate today) {
        return new StaleAvailabilityError(
            Instant.now(),
            412,
            "Precondition Failed",
            ErrorCode.AVAILABILITY_STALE.name(),
            message,
            path,
            currentBlocks,
            etag,
            today
        );
    }
}
