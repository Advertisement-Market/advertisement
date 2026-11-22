package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.util.TextUtil;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.owner.dto.PricingPackageRequest;

@Service
public class PricingPackageService {

    private static final BigDecimal MAX_ALLOWABLE_RATE = new BigDecimal("999999999999.99");
    private final LovService lovService;

    public PricingPackageService(LovService lovService) {
        this.lovService = lovService;
    }

    public void validateMinBooking(Integer minBookingValue, BookingDurationUnit minBookingUnit) {
        if (minBookingUnit != null && minBookingValue != null && !minBookingUnit.isValidDurationValue(minBookingValue)) {
            throw BadRequestException.forFieldErrors(ErrorCode.VALIDATION_FAILED, Map.of(
                    "minBookingValue", String.format("Minimum booking duration exceeds maximum allowed %d for unit %s",
                            minBookingUnit.maxDurationValue(), minBookingUnit.label())
            ));
        }
    }

    public List<BillboardPricingPackage> validateAndBuildPackages(
            List<PricingPackageRequest> requests,
            BillboardListing listing,
            BigDecimal effectiveStartPrice,
            Integer minBookingValue,
            BookingDurationUnit minBookingUnit) {

        // 1. Synthesize default base package if omitted on create
        if (requests == null || requests.isEmpty()) {
            int val = minBookingValue != null ? minBookingValue : 1;
            BookingDurationUnit unit = minBookingUnit != null ? minBookingUnit : BookingDurationUnit.MONTHS;
            int days = unit.toDays(val);
            BigDecimal rate = effectiveStartPrice != null && effectiveStartPrice.compareTo(BigDecimal.ZERO) > 0
                    ? effectiveStartPrice.multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.valueOf(days);
            BillboardPricingPackage basePkg = new BillboardPricingPackage(
                    listing,
                    val,
                    unit,
                    days,
                    rate,
                    "Base minimum duration",
                    true
            );
            return List.of(basePkg);
        }

        // 2. Bound check: max 10 packages
        if (requests.size() > 10) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Cannot specify more than 10 pricing packages.");
        }

        // 3. Validation across packages
        Set<Integer> seenDays = new HashSet<>();
        int baseCount = 0;
        List<BillboardPricingPackage> result = new ArrayList<>();

        for (PricingPackageRequest r : requests) {
            if (r == null) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Pricing package cannot be null.");
            }
            if (r.durationValue() == null || r.durationValue() <= 0) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Duration value must be a positive integer.");
            }
            BookingDurationUnit unit = lovService.parseBookingDurationUnit(r.durationUnit());
            if (!unit.isValidDurationValue(r.durationValue())) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED,
                        String.format("Duration value %d is invalid for unit %s (maximum is %d)",
                                r.durationValue(), unit.label(), unit.maxDurationValue()));
            }

            int days = unit.toDays(r.durationValue());
            if (!seenDays.add(days)) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED,
                        String.format("Duplicate package duration of %d days.", days));
            }

            boolean isBase = Boolean.TRUE.equals(r.isBase());
            if (isBase) {
                baseCount++;
            }

            BigDecimal rate;
            if (isBase && r.rate() == null) {
                if (effectiveStartPrice == null || effectiveStartPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Starting price is required to calculate base package rate.");
                }
                rate = effectiveStartPrice.multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP);
            } else {
                if (r.rate() == null) {
                    throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Rate is required for non-base pricing packages.");
                }
                if (r.rate().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Rate must be positive.");
                }
                rate = r.rate().setScale(2, RoundingMode.HALF_UP);
            }

            if (rate.compareTo(MAX_ALLOWABLE_RATE) > 0) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Package rate exceeds maximum allowable limit.");
            }

            String note = TextUtil.blankToNull(r.note());
            if (note != null && note.length() > 150) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "Note cannot exceed 150 characters.");
            }

            BillboardPricingPackage pkg = new BillboardPricingPackage(
                    listing,
                    r.durationValue(),
                    unit,
                    days,
                    rate,
                    note,
                    isBase
            );
            result.add(pkg);
        }

        if (baseCount != 1) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED,
                    String.format("Exactly one base pricing package is required (found %d).", baseCount));
        }

        result.sort(Comparator.comparingInt(BillboardPricingPackage::getDurationDays));
        return result;
    }
}
