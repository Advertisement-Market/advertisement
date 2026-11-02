package com.theadbasket.backend.owner.dto;

import java.time.Instant;

import com.theadbasket.backend.owner.BillboardMedia;

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
    public static BillboardMediaDto from(BillboardMedia media, String baseUrl) {
        String cleanBase = baseUrl != null && baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        String url = (cleanBase != null ? cleanBase : "/api/media") + "/" + media.getStorageKey();
        return new BillboardMediaDto(
                media.getId(),
                media.getCategory() != null ? media.getCategory().name() : null,
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
