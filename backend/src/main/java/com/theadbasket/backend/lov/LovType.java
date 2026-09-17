package com.theadbasket.backend.lov;

/**
 * Contract for a config-driven list-of-values (LOV) enum.
 *
 * <p>The enum constant is the stable, machine-readable {@link #code()} that the API accepts and
 * persists; the human-readable label is <b>not</b> hardcoded on the constant but resolved from
 * {@code messages.properties} via {@link #messageKey()} (see {@link LovService}). Labels can
 * therefore be edited or localized without recompiling — the "config" in config-driven.
 */
public interface LovType {

    /** Stable code stored and returned by the API (the enum constant name). */
    String code();

    /** Resource-bundle key for this value's display label in {@code messages.properties}. */
    String messageKey();
}
