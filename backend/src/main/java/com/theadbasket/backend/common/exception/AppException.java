package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/**
 * Base for application exceptions that carry a machine-readable {@link ErrorCode} and the
 * positional arguments its message template needs. The user-facing text is resolved centrally
 * (via {@code MessageSource}) in the exception handler — never hardcoded here.
 *
 * <p>{@code getMessage()} returns the error code name, which is safe to log and never leaks
 * localized copy.
 */
public abstract class AppException extends RuntimeException {

    private final ErrorCode errorCode;
    private final transient Object[] args;

    protected AppException(ErrorCode errorCode, Object... args) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.args = args;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    /** Positional arguments ({@code {0}}, {@code {1}}, ...) for the message template; may be empty. */
    public Object[] getArgs() {
        return args == null ? new Object[0] : args.clone();
    }
}
