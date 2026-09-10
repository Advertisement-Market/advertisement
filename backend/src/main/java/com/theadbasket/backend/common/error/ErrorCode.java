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
