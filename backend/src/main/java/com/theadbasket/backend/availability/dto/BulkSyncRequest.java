package com.theadbasket.backend.availability.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkSyncRequest(
    @NotNull(message = "{error.availability.rangesRequired}")
    @Size(max = 500, message = "{error.availability.payloadTooLarge}")
    List<@Valid AvailabilityRangeRequest> ranges
) {}
