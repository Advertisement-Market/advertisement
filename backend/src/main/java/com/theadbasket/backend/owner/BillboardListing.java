package com.theadbasket.backend.owner;

import com.theadbasket.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** A billboard inventory listing owned by a user (the first one is captured at registration). */
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

    @Column(nullable = false, length = 6)
    private String pincode;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(length = 200)
    private String landmark;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(name = "width_ft", nullable = false, precision = 8, scale = 2)
    private BigDecimal widthFt;

    @Column(name = "height_ft", nullable = false, precision = 8, scale = 2)
    private BigDecimal heightFt;

    @Column(name = "ground_height_ft", precision = 8, scale = 2)
    private BigDecimal groundHeightFt;

    @Column(nullable = false, length = 60)
    private String facing;

    @Column(name = "traffic_type", nullable = false, length = 80)
    private String trafficType;

    @Column(name = "audience_type", nullable = false, length = 120)
    private String audienceType;

    @Column(length = 60)
    private String footfall;

    @Column(name = "start_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal startPrice;

    @Column(name = "min_booking", nullable = false, length = 50)
    private String minBooking;

    @Column(name = "discount_note", length = 500)
    private String discountNote;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public BigDecimal getWidthFt() { return widthFt; }
    public void setWidthFt(BigDecimal widthFt) { this.widthFt = widthFt; }
    public BigDecimal getHeightFt() { return heightFt; }
    public void setHeightFt(BigDecimal heightFt) { this.heightFt = heightFt; }
    public BigDecimal getGroundHeightFt() { return groundHeightFt; }
    public void setGroundHeightFt(BigDecimal groundHeightFt) { this.groundHeightFt = groundHeightFt; }
    public String getFacing() { return facing; }
    public void setFacing(String facing) { this.facing = facing; }
    public String getTrafficType() { return trafficType; }
    public void setTrafficType(String trafficType) { this.trafficType = trafficType; }
    public String getAudienceType() { return audienceType; }
    public void setAudienceType(String audienceType) { this.audienceType = audienceType; }
    public String getFootfall() { return footfall; }
    public void setFootfall(String footfall) { this.footfall = footfall; }
    public BigDecimal getStartPrice() { return startPrice; }
    public void setStartPrice(BigDecimal startPrice) { this.startPrice = startPrice; }
    public String getMinBooking() { return minBooking; }
    public void setMinBooking(String minBooking) { this.minBooking = minBooking; }
    public String getDiscountNote() { return discountNote; }
    public void setDiscountNote(String discountNote) { this.discountNote = discountNote; }
    public Instant getCreatedAt() { return createdAt; }
}
