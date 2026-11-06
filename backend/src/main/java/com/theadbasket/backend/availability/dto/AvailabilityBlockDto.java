package com.theadbasket.backend.availability.dto;

import com.theadbasket.backend.availability.AvailabilityBlockType;
import com.theadbasket.backend.availability.BillboardAvailabilityBlock;

import java.time.Instant;
import java.time.LocalDate;

public record AvailabilityBlockDto(
    Long id,
    LocalDate startDate,
    LocalDate endDate,
    AvailabilityBlockType blockType,
    Instant expiryTs
) {
    public static AvailabilityBlockDto from(BillboardAvailabilityBlock b) {
        return new AvailabilityBlockDto(
            b.getId(),
            b.getStartDate(),
            b.getEndDate(),
            b.getBlockType(),
            b.getExpiryTs()
        );
    }
}

