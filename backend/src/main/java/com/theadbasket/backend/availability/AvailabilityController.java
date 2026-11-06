package com.theadbasket.backend.availability;

import com.theadbasket.backend.availability.dto.BulkSyncRequest;
import com.theadbasket.backend.availability.dto.BulkSyncResponse;
import com.theadbasket.backend.availability.dto.OwnerAvailabilityResponse;
import com.theadbasket.backend.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/listings/{billboardId}/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public ResponseEntity<OwnerAvailabilityResponse> getAvailability(
            @PathVariable("billboardId") Long billboardId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        OwnerAvailabilityResponse response = availabilityService.getOwnerBlocks(billboardId, principal.id());
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.etag() + "\"")
                .body(response);
    }

    @PutMapping
    public ResponseEntity<BulkSyncResponse> syncAvailability(
            @PathVariable("billboardId") Long billboardId,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatchHeader,
            @Valid @RequestBody BulkSyncRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        BulkSyncResponse response = availabilityService.bulkSyncOwnerBlocks(
                billboardId, principal.id(), request.ranges(), ifMatchHeader);
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.etag() + "\"")
                .body(response);
    }
}

