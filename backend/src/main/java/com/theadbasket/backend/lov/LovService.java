package com.theadbasket.backend.lov;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;

/**
 * Serves the config-driven billboard lists-of-values and validates submitted values against them.
 *
 * <p>The canonical set of values is defined by the {@link LovType} enums; their display labels are
 * resolved from {@code messages.properties} via {@link MessageSource}, so the wording (and any
 * locale variant) can change without a recompile. {@link #parse} accepts either the stable code
 * (e.g. {@code STATIC_HOARDING}) or a resolved label (e.g. {@code "Static Hoarding"}),
 * case-insensitively, and rejects anything else — the marketplace only stores known values.
 */
@Service
public class LovService {

    private final MessageSource messageSource;

    public LovService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /** Billboard structure types for the owner form dropdown. */
    public List<LovOption> billboardTypes() {
        return options(BillboardType.values());
    }

    /** Traffic profiles for the owner form dropdown. */
    public List<LovOption> trafficTypes() {
        return options(TrafficType.values());
    }

    /** Audience types for the owner form dropdown. */
    public List<LovOption> audienceTypes() {
        return options(AudienceType.values());
    }

    /**
     * Resolve a client-supplied value to its enum constant, accepting either the code or the
     * (localized) label, case-insensitively.
     *
     * @throws BadRequestException with {@code invalidCode} when the value is blank or unknown
     */
    public <E extends Enum<E> & LovType> E parse(Class<E> enumType, String input, ErrorCode invalidCode) {
        if (input != null) {
            String trimmed = input.trim();
            if (!trimmed.isEmpty()) {
                for (E value : enumType.getEnumConstants()) {
                    if (value.code().equalsIgnoreCase(trimmed)) {
                        return value;
                    }
                }
                for (E value : enumType.getEnumConstants()) {
                    if (label(value).equalsIgnoreCase(trimmed)) {
                        return value;
                    }
                }
            }
        }
        throw new BadRequestException(invalidCode, input);
    }

    private <E extends Enum<E> & LovType> List<LovOption> options(E[] values) {
        List<LovOption> out = new ArrayList<>(values.length);
        for (E value : values) {
            out.add(new LovOption(value.code(), label(value)));
        }
        return out;
    }

    private String label(LovType value) {
        // Fall back to the code if a label key is missing so lookups never fail.
        return messageSource.getMessage(value.messageKey(), null, value.code(), LocaleContextHolder.getLocale());
    }
}
