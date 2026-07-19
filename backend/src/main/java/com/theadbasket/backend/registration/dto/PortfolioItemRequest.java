package com.theadbasket.backend.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A portfolio / case-study entry for an agency. */
public record PortfolioItemRequest(

        @NotBlank(message = "Portfolio title is required.")
        @Size(max = 200)
        String title,

        @Size(max = 300)
        String meta
) {
}
