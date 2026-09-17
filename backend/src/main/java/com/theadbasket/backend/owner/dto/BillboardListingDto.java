package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.owner.BillboardListing;

/**
 * Payload representing a billboard inventory listing for owners and marketplace views.
 */
public record BillboardListingDto(
        Long id,
        String name,
        String addressLine1,
        String addressLine2,
        String landmark,
        String city,
        String state,
        String pincode,
        String type,
        BigDecimal widthFt,
        BigDecimal heightFt,
        BigDecimal groundHeightFt,
        String facing,
        String trafficType,
        String audienceType,
        String footfall,
        BigDecimal startPrice,
        String minBooking,
        String discountNote,
        Instant createdAt
) {
    public static BillboardListingDto from(BillboardListing listing) {
        Address addr = listing.getAddress();
        return new BillboardListingDto(
                listing.getId(),
                listing.getName(),
                addr != null ? addr.getLine1() : null,
                addr != null ? addr.getLine2() : null,
                addr != null ? addr.getLandmark() : null,
                addr != null ? addr.getCity() : null,
                addr != null ? addr.getState() : null,
                addr != null ? addr.getPincode() : null,
                listing.getType(),
                listing.getWidthFt(),
                listing.getHeightFt(),
                listing.getGroundHeightFt(),
                listing.getFacing(),
                listing.getTrafficType(),
                listing.getAudienceType(),
                listing.getFootfall(),
                listing.getStartPrice(),
                listing.getMinBooking(),
                listing.getDiscountNote(),
                listing.getCreatedAt()
        );
    }
}
