package com.theadbasket.backend.availability;

import com.theadbasket.backend.availability.dto.PublicAvailabilityDto;
import com.theadbasket.backend.availability.exception.ListingNotActiveException;
import com.theadbasket.backend.common.web.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/listings/{billboardId}/availability")
public class PublicAvailabilityController {

    private final AvailabilityService availabilityService;
    private final MessageSource messageSource;

    public PublicAvailabilityController(AvailabilityService availabilityService, MessageSource messageSource) {
        this.availabilityService = availabilityService;
        this.messageSource = messageSource;
    }

    @GetMapping
    public ResponseEntity<List<PublicAvailabilityDto>> getPublicAvailability(
            @PathVariable("billboardId") Long billboardId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<PublicAvailabilityDto> blocks = availabilityService.getPublicBlocks(billboardId, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
                .body(blocks);
    }

    @ExceptionHandler(ListingNotActiveException.class)
    public ResponseEntity<ApiError> handleListingNotActive(ListingNotActiveException ex, HttpServletRequest request) {
        String message = messageSource.getMessage(ex.getErrorCode().messageKey(), ex.getArgs(), LocaleContextHolder.getLocale());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=60")
                .body(ApiError.of(
                        HttpStatus.NOT_FOUND.value(),
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        ex.getErrorCode().name(),
                        message,
                        request.getRequestURI()
                ));
    }
}

