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

    private static final java.util.regex.Pattern TAG = java.util.regex.Pattern.compile("</?[a-zA-Z][^>]*>|<!--[\\s\\S]*?-->");
    private static final java.util.regex.Pattern TAG_START = java.util.regex.Pattern.compile("<+(?=[a-zA-Z/!])");
    private static final java.util.regex.Pattern INVISIBLE_OR_BIDI = java.util.regex.Pattern.compile("[\\u200B\\u200C\\u200D\\u2060\\uFEFF\\u202A-\\u202E\\u2066-\\u2069]");
    private static final int MAX_RAW_LENGTH = 10_000;

    /**
     * Strips HTML/XML tags and comments iteratively up to 10 passes.
     * Truncates raw inputs exceeding 10,000 characters to prevent quadratic ReDoS regex scanning.
     * Neutralizes zero-width code points and bidi overrides before tag scanning to prevent evasion (e.g. <s\u200Bcript>).
     * Fails closed by disarming any unclosed tag markers (< followed by a tag start character [a-zA-Z/!]).
     */
    public static String stripHtmlTags(String s) {
        if (s == null) {
            return null;
        }
        String str = s;
        if (str.length() > MAX_RAW_LENGTH) {
            str = str.substring(0, MAX_RAW_LENGTH);
        }
        str = INVISIBLE_OR_BIDI.matcher(str).replaceAll("");
        for (int i = 0; i < 10; i++) {
            String next = TAG.matcher(str).replaceAll("");
            if (next.equals(str)) {
                break;
            }
            str = next;
        }
        return TAG_START.matcher(str).replaceAll("");
    }

    /**
     * Trims leading and trailing whitespace and invisible Unicode characters.
     * Returns empty string {@code ""} if empty; returns {@code null} if input is null.
     */
    public static String cleanText(String s) {
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
        return s.substring(start, end);
    }

    /**
     * Combines HTML tag stripping, invisible Unicode stripping, and whitespace trimming.
     * Preserves empty string {@code ""} if non-null, ensuring PATCH optional field clearing signals are retained.
     */
    public static String sanitizeText(String s) {
        if (s == null) {
            return null;
        }
        return cleanText(stripHtmlTags(s));
    }
}

