package com.theadbasket.backend.availability.dto;

import java.time.LocalDate;

public record PublicAvailabilityDto(
    LocalDate startDate,
    LocalDate endDate
) {}

