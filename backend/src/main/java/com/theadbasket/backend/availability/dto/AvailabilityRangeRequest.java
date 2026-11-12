package com.theadbasket.backend.availability.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AvailabilityRangeRequest(
    @NotNull(message = "{error.availability.startDateRequired}")
    LocalDate startDate,

    @NotNull(message = "{error.availability.endDateRequired}")
    LocalDate endDate
) {}

