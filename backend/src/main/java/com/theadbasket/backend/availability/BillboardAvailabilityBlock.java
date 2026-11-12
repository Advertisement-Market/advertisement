package com.theadbasket.backend.availability;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "billboard_availability_blocks")
public class BillboardAvailabilityBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "billboard_id", nullable = false)
    private Long billboardId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 30)
    private AvailabilityBlockType blockType = AvailabilityBlockType.OWNER_BLOCKED;

    @Column(name = "booking_ref_id")
    private Long bookingRefId;

    @Column(name = "expiry_ts")
    private Instant expiryTs;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdTs;

    @Column(name = "updated_ts", nullable = false)
    private Instant updatedTs;

    public BillboardAvailabilityBlock() {}

    public BillboardAvailabilityBlock(Long billboardId, LocalDate startDate, LocalDate endDate,
                                      AvailabilityBlockType blockType, Long createdBy) {
        this.billboardId = billboardId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.blockType = blockType != null ? blockType : AvailabilityBlockType.OWNER_BLOCKED;
        this.createdBy = createdBy;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdTs == null) {
            createdTs = now;
        }
        if (updatedTs == null) {
            updatedTs = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedTs = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBillboardId() { return billboardId; }
    public void setBillboardId(Long billboardId) { this.billboardId = billboardId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public AvailabilityBlockType getBlockType() { return blockType; }
    public void setBlockType(AvailabilityBlockType blockType) { this.blockType = blockType; }

    public Long getBookingRefId() { return bookingRefId; }
    public void setBookingRefId(Long bookingRefId) { this.bookingRefId = bookingRefId; }

    public Instant getExpiryTs() { return expiryTs; }
    public void setExpiryTs(Instant expiryTs) { this.expiryTs = expiryTs; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedTs() { return createdTs; }
    public void setCreatedTs(Instant createdTs) { this.createdTs = createdTs; }

    public Instant getUpdatedTs() { return updatedTs; }
    public void setUpdatedTs(Instant updatedTs) { this.updatedTs = updatedTs; }
}

