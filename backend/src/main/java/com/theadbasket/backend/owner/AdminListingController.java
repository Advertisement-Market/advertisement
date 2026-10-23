package com.theadbasket.backend.owner;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.theadbasket.backend.owner.dto.AdminReviewRequest;
import com.theadbasket.backend.owner.dto.BillboardListingDto;

import jakarta.validation.Valid;

/**
 * Administrative endpoints for reviewing, approving, rejecting, and suspending billboard listings.
 */
@RestController
@RequestMapping("/api/admin/listings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final OwnerListingService ownerListingService;

    public AdminListingController(OwnerListingService ownerListingService) {
        this.ownerListingService = ownerListingService;
    }

    @PostMapping("/{id}/approve")
    public BillboardListingDto approveListing(@PathVariable Long id) {
        return ownerListingService.approveListing(id);
    }

    @PostMapping("/{id}/reject")
    public BillboardListingDto rejectListing(@PathVariable Long id,
                                            @Valid @RequestBody AdminReviewRequest request) {
        return ownerListingService.rejectListing(id, request.reason());
    }

    @PostMapping("/{id}/suspend")
    public BillboardListingDto suspendListing(@PathVariable Long id,
                                             @Valid @RequestBody AdminReviewRequest request) {
        return ownerListingService.suspendListing(id, request.reason());
    }

    @PostMapping("/{id}/unsuspend")
    public BillboardListingDto unsuspendListing(@PathVariable Long id) {
        return ownerListingService.unsuspendListing(id);
    }
}
