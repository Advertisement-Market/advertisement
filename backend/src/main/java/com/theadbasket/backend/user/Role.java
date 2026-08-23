package com.theadbasket.backend.user;

/**
 * Account type on the marketplace.
 *
 * <p>{@link #MEMBER} is a basic identity account (signed up via the quick modal or Google) that
 * has not yet onboarded into a marketplace role. Completing an advertiser / owner / agency
 * registration promotes the account to the matching role.
 */
public enum Role {
    MEMBER,
    ADVERTISER,
    OWNER,
    AGENCY;

    /** True for the three marketplace roles that own a role profile + dashboard. */
    public boolean isOnboarded() {
        return this != MEMBER;
    }
}
