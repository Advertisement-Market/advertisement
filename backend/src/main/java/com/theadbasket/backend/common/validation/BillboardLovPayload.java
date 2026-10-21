package com.theadbasket.backend.common.validation;

/**
 * Common payload interface for billboard DTOs providing LOV codes and companion free-text fields.
 *
 * <p>Implemented by {@link com.theadbasket.backend.registration.dto.BillboardListingRequest}
 * and {@link com.theadbasket.backend.owner.dto.BillboardListingCreateRequest} so that
 * {@link RequiredOtherTextValidator} can validate both uniformly.
 */
public interface BillboardLovPayload {

    String type();

    String typeOther();

    String trafficType();

    String trafficTypeOther();

    String audienceType();

    String audienceTypeOther();
}
