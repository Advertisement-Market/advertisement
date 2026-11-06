package com.theadbasket.backend.availability.dto;

import java.time.LocalDate;
import java.util.List;

public record OwnerAvailabilityResponse(
    List<AvailabilityBlockDto> blocks,
    String etag,
    LocalDate today
) {}

