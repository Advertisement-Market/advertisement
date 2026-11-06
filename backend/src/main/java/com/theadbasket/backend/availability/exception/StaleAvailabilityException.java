package com.theadbasket.backend.availability.exception;

import com.theadbasket.backend.availability.dto.AvailabilityBlockDto;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;

import java.time.LocalDate;
import java.util.List;

public class StaleAvailabilityException extends AppException {
    private final List<AvailabilityBlockDto> currentBlocks;
    private final String etag;
    private final LocalDate today;

    public StaleAvailabilityException(List<AvailabilityBlockDto> currentBlocks, String etag, LocalDate today) {
        super(ErrorCode.AVAILABILITY_STALE);
        this.currentBlocks = currentBlocks;
        this.etag = etag;
        this.today = today;
    }

    public List<AvailabilityBlockDto> getCurrentBlocks() {
        return currentBlocks;
    }

    public String getEtag() {
        return etag;
    }

    public LocalDate getToday() {
        return today;
    }
}
