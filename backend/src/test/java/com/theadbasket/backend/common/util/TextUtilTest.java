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

    @Test
    @DisplayName("executes all shared test fixtures with expected outputs")
    void sanitizeText_sharedFixtures() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        java.io.InputStream stream = getClass().getResourceAsStream("/fixtures/sanitization-fixtures.json");
        assertThat(stream).isNotNull();
        com.fasterxml.jackson.databind.JsonNode fixtures = mapper.readTree(stream);

        for (com.fasterxml.jackson.databind.JsonNode fixture : fixtures) {
            String input = fixture.get("input").asText();
            String expected = fixture.get("expected").asText();
            String actual = TextUtil.sanitizeText(input);
            assertThat(actual)
                    .as("Fixture failed: %s", fixture.get("name").asText())
                    .isEqualTo(expected);
        }
    }

    @Test
    @DisplayName("enforces idempotency: sanitizeText(sanitizeText(x)) == sanitizeText(x)")
    void sanitizeText_idempotency() {
        String[] samples = {
                "<<script>script>alert(1)</script>",
                "<img src=x onerror=alert(1) Main Road",
                "   \u200B<b>Hello World</b>\uFEFF  ",
                "10% off for > 3 months",
                "Clearance < 15 ft"
        };
        for (String sample : samples) {
            String pass1 = TextUtil.sanitizeText(sample);
            String pass2 = TextUtil.sanitizeText(pass1);
            assertThat(pass2).isEqualTo(pass1);
        }
    }

    @Test
    @DisplayName("satisfies invariant: output never contains < followed by a letter, /, or ! (property fuzz test)")
    void sanitizeText_invariantPropertyFuzzTest() {
        String[] tagStarts = {"a", "div", "SCRIPT", "img", "svg", "iframe", "/", "!doctype", "!--"};
        java.util.List<String> fuzzed = new java.util.ArrayList<>(java.util.List.of(
                "<b>bold</b>",
                "<script>alert(1)</script>",
                "<<<nested>>>",
                "<<</>>nested",
                "<img src=x onerror=alert(1)",
                "text <a href=\"test\">link</a> more",
                "10% off for > 3 months and < 5 days"
        ));

        for (int i = 0; i < 50; i++) {
            String tag = tagStarts[i % tagStarts.length];
            fuzzed.add("<" + tag + ">content<" + tag + "/>");
            fuzzed.add("prefix <" + tag + " attr=\"val\" dangling");
            fuzzed.add("<<<" + tag + ">>nested");
        }

        java.util.regex.Pattern invariantViolation = java.util.regex.Pattern.compile("<[a-zA-Z/!]");
        for (String input : fuzzed) {
            String sanitized = TextUtil.sanitizeText(input);
            assertThat(invariantViolation.matcher(sanitized).find())
                    .as("Invariant violated for input: '%s' -> got '%s'", input, sanitized)
                    .isFalse();
        }
    }
}

