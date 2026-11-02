package com.theadbasket.backend.common.validation;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.theadbasket.backend.common.util.TextUtil;

/**
 * Jackson deserializer that sanitizes string input by stripping HTML/XML tags,
 * disarming unclosed markup markers, and removing invisible Unicode code points.
 *
 * <p>Preserves empty string {@code ""} (rather than converting to {@code null})
 * so that PATCH clearing semantics are preserved for optional fields.
 */
public class SanitizingTextDeserializer extends StdDeserializer<String> {

    public SanitizingTextDeserializer() {
        super(String.class);
    }

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String raw = p.getValueAsString();
        return TextUtil.sanitizeText(raw);
    }
}
