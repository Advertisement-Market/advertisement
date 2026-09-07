package com.theadbasket.backend.common.address;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "addresses")
@EntityListeners(AuditingEntityListener.class)
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "line1", nullable = false, length = 300)
    private String line1;

    @Column(name = "line2", length = 300)
    private String line2;

    @Column(name = "landmark", length = 200)
    private String landmark;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "pincode", nullable = false, length = 6)
    private String pincode;

    @CreatedDate
    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdTs;

    @LastModifiedDate
    @Column(name = "updated_ts", nullable = false)
    private Instant updatedTs;

    public Address() {
    }

    public Address(String line1, String line2, String landmark, String city, String state, String pincode) {
        this.line1 = line1;
        this.line2 = line2;
        this.landmark = landmark;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
    }

    /**
     * Shared factory method to construct and sanitize an Address instance.
     */
    public static Address of(String line1, String line2, String landmark,
            String city, String state, String pincode) {
        Address a = new Address();
        a.line1 = line1 != null ? line1.trim() : null;
        a.line2 = blankToNull(line2);
        a.landmark = blankToNull(landmark);
        a.city = city != null ? city.trim() : null;
        a.state = state != null ? state.trim() : null;
        a.pincode = pincode != null ? pincode.trim() : null;
        return a;
    }

    private static String blankToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }

    public Long getId() {
        return id;
    }

    public String getLine1() {
        return line1;
    }

    public void setLine1(String line1) {
        this.line1 = line1;
    }

    public String getLine2() {
        return line2;
    }

    public void setLine2(String line2) {
        this.line2 = line2;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Instant getCreatedTs() {
        return createdTs;
    }

    public void setCreatedTs(Instant createdTs) {
        this.createdTs = createdTs;
    }

    public Instant getUpdatedTs() {
        return updatedTs;
    }

    public void setUpdatedTs(Instant updatedTs) {
        this.updatedTs = updatedTs;
    }
}
