package com.theadbasket.backend.availability;

import com.theadbasket.backend.availability.dto.AvailabilityRangeRequest;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Shared availability date-window constants and stateless validation rules used across
 * DTO constraints, service pre-lock checks, and public calendar queries.
 */
public final class AvailabilityDateValidator {

    public static final int MAX_RANGE_DAYS = 730;
    public static final int DEFAULT_PUBLIC_WINDOW_DAYS = 365;
    public static final int MAX_BULK_RANGES = 500;
    public static final LocalDate MIN_SUPPORTED_DATE = LocalDate.of(1970, 1, 1);
    public static final LocalDate MAX_SUPPORTED_DATE = LocalDate.of(9999, 12, 31);

    private AvailabilityDateValidator() {
    }

    public static boolean isOutOfDateBounds(LocalDate date) {
        return date == null || date.isBefore(MIN_SUPPORTED_DATE) || date.isAfter(MAX_SUPPORTED_DATE);
    }

    public static void validatePublicWindow(LocalDate from, LocalDate to) {
        if ((from != null && isOutOfDateBounds(from)) || (to != null && isOutOfDateBounds(to))) {
            throw new BadRequestException(ErrorCode.AVAILABILITY_DATE_OUT_OF_BOUNDS);
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException(ErrorCode.AVAILABILITY_WINDOW_INVALID);
        }
    }

    public static List<AvailabilityRangeRequest> validateBulkSyncRanges(
            List<AvailabilityRangeRequest> incomingRanges, LocalDate today) {
        if (incomingRanges == null) {
            return List.of();
        }
        if (incomingRanges.size() > MAX_BULK_RANGES) {
            throw new BadRequestException(ErrorCode.AVAILABILITY_PAYLOAD_TOO_LARGE);
        }
        for (AvailabilityRangeRequest range : incomingRanges) {
            if (range == null || range.startDate() == null || range.endDate() == null) {
                throw new BadRequestException(ErrorCode.VALIDATION_FAILED);
            }
            if (isOutOfDateBounds(range.startDate()) || isOutOfDateBounds(range.endDate())) {
                throw new BadRequestException(ErrorCode.AVAILABILITY_DATE_OUT_OF_BOUNDS);
            }
            if (range.startDate().isAfter(range.endDate())) {
                throw new BadRequestException(ErrorCode.AVAILABILITY_DATE_ORDER_INVALID);
            }
            if (!range.endDate().isBefore(today)) {
                LocalDate editableStart = range.startDate().isBefore(today) ? today : range.startDate();
                long editableDays = ChronoUnit.DAYS.between(editableStart, range.endDate()) + 1;
                if (editableDays > MAX_RANGE_DAYS
                        || ChronoUnit.DAYS.between(today, range.endDate()) > MAX_RANGE_DAYS) {
                    throw new BadRequestException(ErrorCode.AVAILABILITY_RANGE_TOO_LONG);
                }
            }
        }
        return incomingRanges;
    }
}

