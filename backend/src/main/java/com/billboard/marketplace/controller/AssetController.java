package com.billboard.marketplace.controller;

import com.billboard.marketplace.dto.request.AssetRequest;
import com.billboard.marketplace.dto.response.AssetResponse;
import com.billboard.marketplace.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    /**
     * POST /api/v1/assets
     * Creates a new asset record. BILLBOARD_OWNER only.
     */
    @PreAuthorize("hasRole('BILLBOARD_OWNER')")
    @PostMapping
    public ResponseEntity<AssetResponse> createAsset(
            @Valid @RequestBody AssetRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AssetResponse response = assetService.createAsset(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/assets/{id}/images
     * Uploads images to local storage and saves URLs. BILLBOARD_OWNER only.
     * Accepts multipart/form-data with field name "files".
     */
    @PreAuthorize("hasRole('BILLBOARD_OWNER')")
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetResponse> uploadImages(
            @PathVariable String assetId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AssetResponse response = assetService.uploadImages(assetId, files, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/assets
     * Lists all assets belonging to the logged-in billboard owner.
     */
    @PreAuthorize("hasRole('BILLBOARD_OWNER')")
    @GetMapping
    public ResponseEntity<List<AssetResponse>> listAssets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<AssetResponse> assets = assetService.listAssets(userDetails.getUsername());
        return ResponseEntity.ok(assets);
    }

    /**
     * GET /api/v1/assets/{id}
     * Returns details of a single asset owned by the logged-in user.
     */
    @PreAuthorize("hasRole('BILLBOARD_OWNER')")
    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getAsset(
            @PathVariable String assetId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AssetResponse response = assetService.getAsset(assetId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
