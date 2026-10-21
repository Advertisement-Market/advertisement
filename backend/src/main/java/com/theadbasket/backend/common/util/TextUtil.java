package com.theadbasket.backend.common.util;

/**
 * String and character utilities supporting Unicode space separators and invisible code points.
 */
public final class TextUtil {

    private TextUtil() {}

    /**
     * Determines whether a character is standard ASCII whitespace, Unicode space separator
     * (such as non-breaking space {@code \u00A0}), or an invisible code point (such as zero-width
     * space, zero-width non-joiner, zero-width joiner, word joiner, or byte-order mark).
     */
    public static boolean isWhitespaceOrInvisible(char c) {
        if (Character.isWhitespace(c) || Character.isSpaceChar(c)) {
            return true;
        }
        return switch (c) {
            case '\u200B', // ZERO WIDTH SPACE
                 '\u200C', // ZERO WIDTH NON-JOINER
                 '\u200D', // ZERO WIDTH JOINER
                 '\u2060', // WORD JOINER
                 '\uFEFF'  // ZERO WIDTH NO-BREAK SPACE / BYTE ORDER MARK
                 -> true;
            default -> false;
        };
    }

    /**
     * Checks if a CharSequence is null, empty, or consists exclusively of whitespace or
     * invisible characters.
     */
    public static boolean isBlank(CharSequence cs) {
        if (cs == null) {
            return true;
        }
        int len = cs.length();
        for (int i = 0; i < len; i++) {
            if (!isWhitespaceOrInvisible(cs.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Trims leading and trailing whitespace and invisible characters from the string.
     * Returns {@code null} if the result is empty or if the input is null.
     */
    public static String blankToNull(String s) {
        if (s == null) {
            return null;
        }
        int start = 0;
        int end = s.length();
        while (start < end && isWhitespaceOrInvisible(s.charAt(start))) {
            start++;
        }
        while (end > start && isWhitespaceOrInvisible(s.charAt(end - 1))) {
            end--;
        }
        if (start >= end) {
            return null;
        }
        return s.substring(start, end);
    }
}
