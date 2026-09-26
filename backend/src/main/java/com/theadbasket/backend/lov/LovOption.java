package com.theadbasket.backend.lov;

/**
 * A single selectable option in a list-of-values, as served to the frontend dropdowns.
 *
 * @param code  the stable value the client sends back and the server persists
 * @param label the localized display text (resolved from {@code messages.properties})
 */
public record LovOption(String code, String label) {
}
