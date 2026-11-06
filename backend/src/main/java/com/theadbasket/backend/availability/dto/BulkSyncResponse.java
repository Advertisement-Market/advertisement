package com.theadbasket.backend.availability.dto;

import java.time.LocalDate;
import java.util.List;

public record BulkSyncResponse(
    List<AvailabilityBlockDto> blocks,
    List<String> warnings,
    String etag,
    LocalDate today
) {
    public BulkSyncResponse(List<AvailabilityBlockDto> blocks, String etag, List<String> warnings, LocalDate today) {
        this(blocks, warnings, etag, today);
    }
}
