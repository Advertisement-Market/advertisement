package com.theadbasket.backend.availability.dto;

import com.theadbasket.backend.availability.AvailabilityDateValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkSyncRequest(
    @NotNull(message = "{error.availability.rangesRequired}")
    @Size(max = AvailabilityDateValidator.MAX_BULK_RANGES, message = "{error.availability.payloadTooLarge}")
    List<@NotNull(message = "{error.availability.rangeRequired}") @Valid AvailabilityRangeRequest> ranges
) {}
