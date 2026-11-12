package com.theadbasket.backend.availability.dto;

import com.theadbasket.backend.availability.AvailabilityBlockType;
import java.time.Instant;
import java.time.LocalDate;

public record AvailabilityBlockResponse(
    Long id,
    LocalDate startDate,
    LocalDate endDate,
    AvailabilityBlockType blockType,
    Instant expiryTs
) {}

