package com.theadbasket.backend.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class TextUtilTest {

    @Test
    @DisplayName("isBlank returns true for null, empty, and regular whitespace")
    void isBlank_standardWhitespace() {
        assertThat(TextUtil.isBlank(null)).isTrue();
        assertThat(TextUtil.isBlank("")).isTrue();
        assertThat(TextUtil.isBlank("   ")).isTrue();
        assertThat(TextUtil.isBlank("\t\n\r")).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "\u00A0",         // Non-breaking space
            "\u200B",         // Zero-width space
            "\u200C",         // Zero-width non-joiner
            "\u200D",         // Zero-width joiner
            "\u2060",         // Word joiner
            "\uFEFF",         // Zero-width no-break space / BOM
            " \u00A0 \u200B \t " // Mixed whitespace and invisible chars
    })
    @DisplayName("isBlank returns true for Unicode spaces and invisible characters")
    void isBlank_unicodeSpacesAndInvisible(String input) {
        assertThat(TextUtil.isBlank(input)).isTrue();
    }

    @Test
    @DisplayName("isBlank returns false when non-whitespace content is present")
    void isBlank_nonEmptyContent() {
        assertThat(TextUtil.isBlank("Skywalk")).isFalse();
        assertThat(TextUtil.isBlank(" \u200B Skywalk \u00A0 ")).isFalse();
    }

    @Test
    @DisplayName("blankToNull trims whitespace and invisible characters, returning null if empty")
    void blankToNull_trimsAndConverts() {
        assertThat(TextUtil.blankToNull(null)).isNull();
        assertThat(TextUtil.blankToNull("   ")).isNull();
        assertThat(TextUtil.blankToNull(" \u200B \u00A0 ")).isNull();
        assertThat(TextUtil.blankToNull("  \u200BSkywalk\u00A0  ")).isEqualTo("Skywalk");
        assertThat(TextUtil.blankToNull("Skywalk")).isEqualTo("Skywalk");
    }
}
