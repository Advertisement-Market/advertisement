package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * A billboard inventory listing owned by a user (the first one is captured at
 * registration).
 */
@Entity
@Table(name = "billboard_listings")
@EntityListeners(AuditingEntityListener.class)
public class BillboardListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    // type / trafficType / audienceType all store a LovType code (longest is IT_TECH_PROFESSIONALS,
    // 20 chars). The three share length = 60 so an impossibly long future code can't slip in unnoticed.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private BillboardType type;

    /** Free-text description supplied when {@link #type} is {@link BillboardType#OTHER}. */
    @Column(name = "type_other", length = 120)
    private String typeOther;

    @Column(name = "width_ft", nullable = false, precision = 8, scale = 2)
    private BigDecimal widthFt;

    @Column(name = "height_ft", nullable = false, precision = 8, scale = 2)
    private BigDecimal heightFt;

    @Column(name = "ground_height_ft", precision = 8, scale = 2)
    private BigDecimal groundHeightFt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private FacingDirection facing;

    @Enumerated(EnumType.STRING)
    @Column(name = "traffic_type", nullable = false, length = 60)
    private TrafficType trafficType;

    /** Free-text description supplied when {@link #trafficType} is {@link TrafficType#OTHER}. */
    @Column(name = "traffic_type_other", length = 120)
    private String trafficTypeOther;

    @Enumerated(EnumType.STRING)
    @Column(name = "audience_type", nullable = false, length = 60)
    private AudienceType audienceType;

    /** Free-text description supplied when {@link #audienceType} is {@link AudienceType#OTHER}. */
    @Column(name = "audience_type_other", length = 120)
    private String audienceTypeOther;

    @Column(length = 60)
    private String footfall;

    @Column(name = "start_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal startPrice;

    /** Minimum booking duration as the owner entered it: a count of {@link #minBookingUnit}. */
    @Column(name = "min_booking_value", nullable = false)
    private Integer minBookingValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "min_booking_unit", nullable = false, length = 20)
    private BookingDurationUnit minBookingUnit;

    /** The minimum booking duration normalized to days ({@code value * unit.daysPerUnit}). */
    @Column(name = "min_booking_days", nullable = false)
    private Integer minBookingDays;

    @Column(name = "discount_note", length = 500)
    private String discountNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BillboardStatus status = BillboardStatus.DRAFT;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @jakarta.persistence.OneToMany(mappedBy = "billboard", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @jakarta.persistence.OrderBy("displayOrder ASC, createdTs ASC")
    private java.util.List<BillboardMedia> media = new java.util.ArrayList<>();

    @CreatedDate
    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public BillboardType getType() {
        return type;
    }

    public void setType(BillboardType type) {
        this.type = type;
    }

    public String getTypeOther() {
        return typeOther;
    }

    public void setTypeOther(String typeOther) {
        this.typeOther = typeOther;
    }

    public BigDecimal getWidthFt() {
        return widthFt;
    }

    public void setWidthFt(BigDecimal widthFt) {
        this.widthFt = widthFt;
    }

    public BigDecimal getHeightFt() {
        return heightFt;
    }

    public void setHeightFt(BigDecimal heightFt) {
        this.heightFt = heightFt;
    }

    public BigDecimal getGroundHeightFt() {
        return groundHeightFt;
    }

    public void setGroundHeightFt(BigDecimal groundHeightFt) {
        this.groundHeightFt = groundHeightFt;
    }

    public FacingDirection getFacing() {
        return facing;
    }

    public void setFacing(FacingDirection facing) {
        this.facing = facing;
    }

    public TrafficType getTrafficType() {
        return trafficType;
    }

    public void setTrafficType(TrafficType trafficType) {
        this.trafficType = trafficType;
    }

    public String getTrafficTypeOther() {
        return trafficTypeOther;
    }

    public void setTrafficTypeOther(String trafficTypeOther) {
        this.trafficTypeOther = trafficTypeOther;
    }

    public AudienceType getAudienceType() {
        return audienceType;
    }

    public void setAudienceType(AudienceType audienceType) {
        this.audienceType = audienceType;
    }

    public String getAudienceTypeOther() {
        return audienceTypeOther;
    }

    public void setAudienceTypeOther(String audienceTypeOther) {
        this.audienceTypeOther = audienceTypeOther;
    }

    public String getFootfall() {
        return footfall;
    }

    public void setFootfall(String footfall) {
        this.footfall = footfall;
    }

    public BigDecimal getStartPrice() {
        return startPrice;
    }

    public void setStartPrice(BigDecimal startPrice) {
        this.startPrice = startPrice;
    }

    public Integer getMinBookingValue() {
        return minBookingValue;
    }

    public void setMinBookingValue(Integer minBookingValue) {
        this.minBookingValue = minBookingValue;
    }

    public BookingDurationUnit getMinBookingUnit() {
        return minBookingUnit;
    }

    public void setMinBookingUnit(BookingDurationUnit minBookingUnit) {
        this.minBookingUnit = minBookingUnit;
    }

    public Integer getMinBookingDays() {
        return minBookingDays;
    }

    public void setMinBookingDays(Integer minBookingDays) {
        this.minBookingDays = minBookingDays;
    }

    public String getDiscountNote() {
        return discountNote;
    }

    public void setDiscountNote(String discountNote) {
        this.discountNote = discountNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public BillboardStatus getStatus() {
        return status;
    }

    public void setStatus(BillboardStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getSuspensionReason() {
        return suspensionReason;
    }

    public void setSuspensionReason(String suspensionReason) {
        this.suspensionReason = suspensionReason;
    }

    public java.util.List<BillboardMedia> getMedia() {
        return media;
    }

    public void setMedia(java.util.List<BillboardMedia> media) {
        this.media = media;
    }

    public void addMedia(BillboardMedia item) {
        media.add(item);
        item.setBillboard(this);
    }

    public void removeMedia(BillboardMedia item) {
        media.remove(item);
        item.setBillboard(null);
    }
}
