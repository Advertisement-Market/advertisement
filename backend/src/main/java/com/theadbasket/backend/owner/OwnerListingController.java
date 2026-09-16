package com.theadbasket.backend.owner;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.theadbasket.backend.owner.dto.BillboardListingCreateRequest;
import com.theadbasket.backend.owner.dto.BillboardListingDto;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;
import com.theadbasket.backend.security.AuthenticatedUser;

import jakarta.validation.Valid;

/**
 * REST controller for billboard owners to manage their inventory listings.
 */
@RestController
@RequestMapping("/api/owner/listings")
public class OwnerListingController {

    private final OwnerListingService ownerListingService;

    public OwnerListingController(OwnerListingService ownerListingService) {
        this.ownerListingService = ownerListingService;
    }

    @GetMapping
    public List<BillboardListingDto> getListings(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerListingService.getOwnerListings(principal.id());
    }

    @GetMapping("/{id}")
    public BillboardListingDto getListing(@PathVariable Long id,
                                          @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerListingService.getListingById(id, principal.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BillboardListingDto createListing(@Valid @RequestBody BillboardListingCreateRequest request,
                                            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerListingService.createListing(principal.id(), request);
    }

    @PatchMapping("/{id}")
    public BillboardListingDto updateListing(@PathVariable Long id,
                                            @Valid @RequestBody BillboardListingUpdateRequest request,
                                            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerListingService.updateListing(id, principal.id(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteListing(@PathVariable Long id,
                              @AuthenticationPrincipal AuthenticatedUser principal) {
        ownerListingService.deleteListing(id, principal.id());
    }
}
