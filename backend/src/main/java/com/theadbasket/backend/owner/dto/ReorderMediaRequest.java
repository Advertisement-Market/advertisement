package com.theadbasket.backend.owner.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record ReorderMediaRequest(
        @NotEmpty(message = "mediaIds cannot be empty")
        List<Long> mediaIds
) {
}
