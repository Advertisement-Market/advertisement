package com.theadbasket.backend.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminReviewRequest(
        @NotBlank(message = "Review reason cannot be blank")
        @Size(max = 500, message = "Review reason cannot exceed 500 characters")
        String reason
) {
}
