package com.theadbasket.backend.availability.dto;

import java.time.LocalDate;

public record DateRangeDto(
    LocalDate startDate,
    LocalDate endDate
) {}

