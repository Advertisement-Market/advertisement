package com.theadbasket.backend.owner;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.theadbasket.backend.owner.dto.BillboardListingCreateRequest;
import com.theadbasket.backend.owner.dto.BillboardListingDto;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;
import com.theadbasket.backend.owner.dto.BillboardMediaDto;
import com.theadbasket.backend.owner.dto.ReorderMediaRequest;
import com.theadbasket.backend.owner.dto.SyncManifest;
import com.theadbasket.backend.security.AuthenticatedUser;

import jakarta.validation.Valid;

/**
 * REST controller for billboard owners to manage their inventory listings and attached media.
 */
@RestController
@RequestMapping("/api/owner/listings")
public class OwnerListingController {

    private final OwnerListingService ownerListingService;
    private final OwnerMediaSyncService ownerMediaSyncService;

    public OwnerListingController(
            OwnerListingService ownerListingService,
            OwnerMediaSyncService ownerMediaSyncService) {
        this.ownerListingService = ownerListingService;
        this.ownerMediaSyncService = ownerMediaSyncService;
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

    @PostMapping("/{id}/submit")
    public BillboardListingDto submitListing(@PathVariable Long id,
                                             @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerListingService.submitListing(id, principal.id());
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

    // ── Media Management ──

    @GetMapping("/{id}/media")
    public List<BillboardMediaDto> getListingMedia(@PathVariable Long id,
                                                   @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerMediaSyncService.getListingMedia(id, principal.id());
    }

    @PostMapping(value = "/{id}/media/sync", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<BillboardMediaDto> syncMedia(
            @PathVariable Long id,
            @RequestPart("manifest") @Valid SyncManifest manifest,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerMediaSyncService.syncMedia(id, principal.id(), manifest, files);
    }

    @PostMapping(value = "/{id}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public BillboardMediaDto uploadSingleMedia(
            @PathVariable Long id,
            @RequestParam("category") MediaCategory category,
            @RequestParam(value = "uploadId", required = false) String uploadId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerMediaSyncService.uploadSingleMedia(id, principal.id(), category, uploadId, file);
    }

    @PutMapping("/{id}/media/{mediaId}/cover")
    public BillboardMediaDto setCover(
            @PathVariable Long id,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerMediaSyncService.setCover(id, principal.id(), mediaId);
    }

    @PutMapping("/{id}/media/reorder")
    public List<BillboardMediaDto> reorderMedia(
            @PathVariable Long id,
            @Valid @RequestBody ReorderMediaRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerMediaSyncService.reorderMedia(id, principal.id(), request.mediaIds());
    }

    @DeleteMapping("/{id}/media/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        ownerMediaSyncService.deleteMedia(id, principal.id(), mediaId);
    }
}
