package com.theadbasket.backend.owner.dto;

import com.theadbasket.backend.owner.MediaCategory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SyncFileMapping(
        @NotNull(message = "clientIndex is required")
        @Min(value = 0, message = "clientIndex must be >= 0")
        @Max(value = 9, message = "clientIndex must be < 10")
        Integer clientIndex,

        @NotNull(message = "category is required")
        MediaCategory category,

        @NotBlank(message = "uploadId is required")
        @Size(max = 64, message = "uploadId cannot exceed 64 characters")
        @Pattern(regexp = "^[a-fA-F0-9\\-]+$", message = "uploadId must be a valid UUID string")
        String uploadId
) {
}
