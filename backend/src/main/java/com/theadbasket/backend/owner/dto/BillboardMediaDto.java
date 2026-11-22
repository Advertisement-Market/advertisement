package com.theadbasket.backend.owner.dto;

import java.time.Instant;

import com.theadbasket.backend.owner.BillboardMedia;
import com.theadbasket.backend.owner.MediaCategory;

/**
 * Representation of an uploaded media asset attached to a billboard listing.
 */
public record BillboardMediaDto(
        Long id,
        String category,
        String fileUrl,
        String originalName,
        String contentType,
        Long fileSizeBytes,
        boolean isCover,
        Integer displayOrder,
        Instant createdTs
) {
    public static BillboardMediaDto from(BillboardMedia media, String baseUrl, Long listingId) {
        MediaCategory category = media.getCategory();
        boolean isPublic = category == null || category.isPublic();

        String url;
        if (isPublic) {
            String cleanBase = baseUrl != null && baseUrl.endsWith("/")
                    ? baseUrl.substring(0, baseUrl.length() - 1)
                    : baseUrl;
            url = (cleanBase != null ? cleanBase : "/api/media") + "/" + media.getStorageKey();
        } else {
            // Private legal documents are never exposed on the public media path; they are
            // served only through the authenticated, ownership-checked owner endpoint.
            url = "/api/owner/listings/" + listingId + "/media/" + media.getId() + "/raw";
        }

        return new BillboardMediaDto(
                media.getId(),
                category != null ? category.name() : null,
                url,
                media.getOriginalName(),
                media.getContentType(),
                media.getFileSizeBytes(),
                media.isCover(),
                media.getDisplayOrder(),
                media.getCreatedTs()
        );
    }
}
