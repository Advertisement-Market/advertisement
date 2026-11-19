package com.theadbasket.backend.common.validation;

/** Shared regex constants for Bean Validation {@code @Pattern} annotations. */
public final class ValidationPatterns {

    // Allows up to 20 chars so formatted numbers with a country code and spaces
    // (e.g. "+91 20 2222 3333") pass. Keep in sync with frontend MSG.phoneLoose / telephone().
    public static final String PHONE = "^[0-9+\\-\\s]{10,20}$";
    public static final String PHONE_OPTIONAL = "^$|^[0-9+\\-\\s]{10,20}$";
    // Matches a well-formed 6-digit Indian PIN code: a first digit of 1-9 followed by five digits (0-9)
    public static final String PINCODE = "^[1-9][0-9]{5}$";
    // Keep in sync with frontend MSG.pincode in validators.js
    public static final String PINCODE_MESSAGE = "Enter a valid 6-digit PIN code (cannot start with 0).";
    public static final String GST_OPTIONAL = "^$|^[0-9A-Za-z]{15}$";
    public static final String PAN_OPTIONAL = "^$|^[0-9A-Za-z]{10}$";

    private ValidationPatterns() {
    }
}
