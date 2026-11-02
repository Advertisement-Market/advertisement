package com.theadbasket.backend.owner;

/**
 * Lifecycle status of a billboard inventory listing.
 */
public enum BillboardStatus {
    /**
     * Initial state when created or undergoing fixes after rejection; hidden from marketplace.
     */
    DRAFT,

    /**
     * Submitted by owner with valid metadata and >= 2 day photos; awaiting administrative review.
     */
    PENDING_APPROVAL,

    /**
     * Approved and publicly discoverable in marketplace search and browse views.
     */
    ACTIVE,

    /**
     * Rejected during moderation; owner can view rejectionReason, fix issues, and resubmit.
     */
    REJECTED,

    /**
     * Takedown or administrative suspension; hidden from marketplace and owner writes blocked.
     */
    SUSPENDED
}
