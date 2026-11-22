package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.theadbasket.backend.owner.BillboardPricingPackage;

public record PricingPackageResponse(
    Long id,
    Integer durationValue,
    String durationUnit,
    Integer durationDays,
    BigDecimal rate,
    String note,
    @JsonProperty("isBase")
    boolean isBase
) {
    public static PricingPackageResponse from(BillboardPricingPackage p) {
        if (p == null) {
            return null;
        }
        return new PricingPackageResponse(
            p.getId(),
            p.getDurationValue(),
            p.getDurationUnit() != null ? p.getDurationUnit().name() : null,
            p.getDurationDays(),
            p.getRate(),
            p.getNote(),
            p.isBase()
        );
    }
}
