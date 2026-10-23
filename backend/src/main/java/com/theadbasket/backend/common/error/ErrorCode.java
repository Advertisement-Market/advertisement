package com.theadbasket.backend.common.error;

/**
 * Stable, machine-readable identifier for every user-facing error.
 *
 * <p>The enum name (e.g. {@code INVALID_CREDENTIALS}) is what the API returns in
 * {@code ApiError.errorCode} so clients can branch on a code rather than on display text.
 * {@link #messageKey()} points at the human-readable text in {@code messages.properties},
 * resolved via {@code MessageSource} — no error text is hardcoded at throw sites.
 */
public enum ErrorCode {

    // Auth / credentials
    INVALID_CREDENTIALS("error.auth.invalidCredentials"),
    AUTHENTICATION_REQUIRED("error.auth.authenticationRequired"),
    PASSWORD_LENGTH("error.auth.passwordLength"),
    PASSWORD_REQUIRED("error.auth.passwordRequired"),
    LOGIN_EMAIL_REQUIRED("error.auth.loginEmailRequired"),
    SESSION_INVALID("error.auth.sessionInvalid"),

    // Registration
    EMAIL_ALREADY_EXISTS("error.email.alreadyExists"),
    ALREADY_REGISTERED("error.registration.alreadyRegistered"),

    // Account / resources
    ACCOUNT_NOT_FOUND("error.account.notFound"),
    NOTIFICATION_NOT_FOUND("error.notification.notFound"),
    BILLBOARD_NOT_FOUND("error.billboard.notFound"),

    // Google sign-in
    GOOGLE_NOT_CONFIGURED("error.google.notConfigured"),
    GOOGLE_CREDENTIAL_MISSING("error.google.credentialMissing"),
    GOOGLE_VERIFICATION_FAILED("error.google.verificationFailed"),
    GOOGLE_INCOMPLETE_PROFILE("error.google.incompleteProfile"),
    GOOGLE_AUDIENCE_MISMATCH("error.google.audienceMismatch"),

    // Refresh tokens
    TOKEN_INVALID("error.token.invalid"),
    TOKEN_REVOKED("error.token.revoked"),
    TOKEN_EXPIRED("error.token.expired"),

    // Feature availability (config-driven policy guards)
    LOCAL_REGISTRATION_UNAVAILABLE("error.policy.localRegistrationUnavailable"),
    LOCAL_SIGNIN_UNAVAILABLE("error.policy.localSigninUnavailable"),
    GOOGLE_SIGNIN_UNAVAILABLE("error.policy.googleSigninUnavailable"),
    REGISTRATION_UNAVAILABLE("error.policy.registrationUnavailable"),
    ROLE_REGISTRATION_UNAVAILABLE("error.policy.roleRegistrationUnavailable"),
    ADVERTISER_REGISTRATION_UNAVAILABLE("error.policy.advertiserRegistrationUnavailable"),
    OWNER_REGISTRATION_UNAVAILABLE("error.policy.ownerRegistrationUnavailable"),
    AGENCY_REGISTRATION_UNAVAILABLE("error.policy.agencyRegistrationUnavailable"),

    // Billboard lookup values (config-driven LOVs)
    INVALID_BILLBOARD_TYPE("error.billboard.invalidType"),
    INVALID_TRAFFIC_TYPE("error.billboard.invalidTrafficType"),
    INVALID_AUDIENCE_TYPE("error.billboard.invalidAudienceType"),
    INVALID_FACING_DIRECTION("error.billboard.invalidFacing"),
    INVALID_BOOKING_DURATION_UNIT("error.billboard.invalidBookingUnit"),

    // Media and Storage
    INVALID_FILE("error.media.invalidFile"),
    FILE_TOO_LARGE("error.media.fileTooLarge"),
    UNSUPPORTED_MEDIA_TYPE("error.media.unsupportedType"),
    IMAGE_DIMENSIONS_EXCEEDED("error.media.dimensionsExceeded"),
    MEDIA_NOT_FOUND("error.media.notFound"),
    MINIMUM_DAY_PHOTOS_REQUIRED("error.media.minDayPhotosRequired"),
    MEDIA_CAP_EXCEEDED("error.media.capExceeded"),
    LISTING_CAP_EXCEEDED("error.listing.capExceeded"),
    LISTING_SUSPENDED("error.listing.suspended"),
    INVALID_STATUS_TRANSITION("error.listing.invalidTransition"),
    SERVICE_UNAVAILABLE("error.service.unavailable"),

    // Generic
    VALIDATION_FAILED("error.validation.failed"),
    INTERNAL_ERROR("error.internal");

    private final String messageKey;

    ErrorCode(String messageKey) {
        this.messageKey = messageKey;
    }

    /** Resource-bundle key for this error's human-readable text. */
    public String messageKey() {
        return messageKey;
    }
}
