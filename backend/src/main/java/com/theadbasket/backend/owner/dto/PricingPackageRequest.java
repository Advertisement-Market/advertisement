package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PricingPackageRequest(
    @NotNull(message = "Duration value is required.")
    @Positive(message = "Duration value must be positive.")
    Integer durationValue,

    @NotBlank(message = "Duration unit is required.")
    @Size(max = 20, message = "Duration unit cannot exceed 20 characters.")
    String durationUnit,

    @Positive(message = "Rate must be positive.")
    @Digits(integer = 12, fraction = 2, message = "Rate must have at most 12 integer digits and 2 decimal places.")
    BigDecimal rate,

    @Size(max = 150, message = "Note cannot exceed 150 characters.")
    String note,

    @JsonProperty("isBase")
    Boolean isBase
) {}
