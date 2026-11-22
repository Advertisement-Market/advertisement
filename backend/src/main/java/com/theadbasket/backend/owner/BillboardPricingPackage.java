package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.theadbasket.backend.lov.BookingDurationUnit;

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
import jakarta.persistence.Table;

@Entity
@Table(name = "billboard_pricing_packages")
@EntityListeners(AuditingEntityListener.class)
public class BillboardPricingPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "billboard_id", nullable = false)
    private BillboardListing billboard;

    @Column(name = "duration_value", nullable = false)
    private Integer durationValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit", nullable = false, length = 20)
    private BookingDurationUnit durationUnit;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal rate;

    @Column(length = 150)
    private String note;

    @Column(name = "is_base", nullable = false)
    private boolean isBase;

    @CreatedDate
    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdTs;

    @LastModifiedDate
    @Column(name = "updated_ts", nullable = false)
    private Instant updatedTs;

    public BillboardPricingPackage() {}

    public BillboardPricingPackage(
            BillboardListing billboard,
            Integer durationValue,
            BookingDurationUnit durationUnit,
            Integer durationDays,
            BigDecimal rate,
            String note,
            boolean isBase) {
        this.billboard = billboard;
        this.durationValue = durationValue;
        this.durationUnit = durationUnit;
        this.durationDays = durationDays;
        this.rate = rate;
        this.note = note;
        this.isBase = isBase;
    }

    public Long getId() {
        return id;
    }

    public BillboardListing getBillboard() {
        return billboard;
    }

    public void setBillboard(BillboardListing billboard) {
        this.billboard = billboard;
    }

    public Integer getDurationValue() {
        return durationValue;
    }

    public void setDurationValue(Integer durationValue) {
        this.durationValue = durationValue;
    }

    public BookingDurationUnit getDurationUnit() {
        return durationUnit;
    }

    public void setDurationUnit(BookingDurationUnit durationUnit) {
        this.durationUnit = durationUnit;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isBase() {
        return isBase;
    }

    public void setBase(boolean base) {
        isBase = base;
    }

    public Instant getCreatedTs() {
        return createdTs;
    }

    public Instant getUpdatedTs() {
        return updatedTs;
    }
}
