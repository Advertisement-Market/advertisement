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

    /** Facing directions never change, so the option list is built once and shared across requests. */
    private static final List<LovOption> FACING_DIRECTIONS = buildStaticOptions(
            FacingDirection.values(), FacingDirection::code, FacingDirection::label);

    private final MessageSource messageSource;

    public LovService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    private static <E> List<LovOption> buildStaticOptions(E[] values,
            java.util.function.Function<E, String> code, java.util.function.Function<E, String> label) {
        List<LovOption> out = new ArrayList<>(values.length);
        for (E value : values) {
            out.add(new LovOption(code.apply(value), label.apply(value)));
        }
        return List.copyOf(out);
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
     * Facing directions for the owner form dropdown. This is a <b>static</b> LOV — labels are baked
     * into {@link FacingDirection}, not resolved from config.
     */
    public List<LovOption> facingDirections() {
        return FACING_DIRECTIONS;
    }

    /**
     * Resolve a client-supplied facing to its {@link FacingDirection}, accepting either the code or
     * the fixed label, case-insensitively.
     *
     * @throws BadRequestException {@code INVALID_FACING_DIRECTION} when blank or unknown
     */
    public FacingDirection parseFacing(String input) {
        if (input != null) {
            String trimmed = input.trim();
            if (!trimmed.isEmpty()) {
                for (FacingDirection direction : FacingDirection.values()) {
                    if (direction.code().equalsIgnoreCase(trimmed) || direction.label().equalsIgnoreCase(trimmed)) {
                        return direction;
                    }
                }
            }
        }
        throw new BadRequestException(ErrorCode.INVALID_FACING_DIRECTION, input);
    }

    /**
     * Minimum-booking duration units for the owner form dropdown. A <b>static</b> LOV — labels are
     * baked into {@link BookingDurationUnit}.
     */
    public List<LovOption> bookingDurationUnits() {
        List<LovOption> out = new ArrayList<>(BookingDurationUnit.values().length);
        for (BookingDurationUnit unit : BookingDurationUnit.values()) {
            out.add(new LovOption(unit.code(), unit.label()));
        }
        return out;
    }

    /**
     * Resolve a client-supplied booking-duration unit to its {@link BookingDurationUnit}, accepting
     * either the code or the fixed label, case-insensitively.
     *
     * @throws BadRequestException {@code INVALID_BOOKING_DURATION_UNIT} when blank or unknown
     */
    public BookingDurationUnit parseBookingDurationUnit(String input) {
        if (input != null) {
            String trimmed = input.trim();
            if (!trimmed.isEmpty()) {
                for (BookingDurationUnit unit : BookingDurationUnit.values()) {
                    if (unit.code().equalsIgnoreCase(trimmed) || unit.label().equalsIgnoreCase(trimmed)) {
                        return unit;
                    }
                }
            }
        }
        throw new BadRequestException(ErrorCode.INVALID_BOOKING_DURATION_UNIT, input);
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
