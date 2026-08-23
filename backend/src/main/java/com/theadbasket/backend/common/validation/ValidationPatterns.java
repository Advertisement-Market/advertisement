package com.theadbasket.backend.common.validation;

/** Shared regex constants for Bean Validation {@code @Pattern} annotations. */
public final class ValidationPatterns {

    public static final String PHONE = "^[0-9+\\-\\s]{10,15}$";
    public static final String PHONE_OPTIONAL = "^$|^[0-9+\\-\\s]{10,15}$";
    public static final String PINCODE = "^[0-9]{6}$";
    public static final String GST_OPTIONAL = "^$|^[0-9A-Za-z]{15}$";
    public static final String PAN_OPTIONAL = "^$|^[0-9A-Za-z]{10}$";

    private ValidationPatterns() {
    }
}
