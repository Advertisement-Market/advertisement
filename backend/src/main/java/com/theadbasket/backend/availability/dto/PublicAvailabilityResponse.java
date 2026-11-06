package com.theadbasket.backend.availability.dto;

import java.time.LocalDate;

public record PublicAvailabilityResponse(
    LocalDate startDate,
    LocalDate endDate
) {}

