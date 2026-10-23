package com.theadbasket.backend.owner;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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

/**
 * Persisted media asset (photo or video) attached to a billboard listing.
 */
@Entity
@Table(name = "billboard_media")
@EntityListeners(AuditingEntityListener.class)
public class BillboardMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "billboard_id", nullable = false)
    private BillboardListing billboard;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private MediaCategory category;

    @Column(name = "storage_key", nullable = false, length = 300)
    private String storageKey;

    @Column(name = "upload_id", nullable = false, length = 64)
    private String uploadId;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "is_cover")
    private Boolean isCover;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @CreatedDate
    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdTs;

    public BillboardMedia() {
    }

    public BillboardMedia(BillboardListing billboard,
                          MediaCategory category,
                          String storageKey,
                          String uploadId,
                          String originalName,
                          String contentType,
                          Long fileSizeBytes,
                          Boolean isCover,
                          Integer displayOrder) {
        this.billboard = billboard;
        this.category = category;
        this.storageKey = storageKey;
        this.uploadId = uploadId;
        this.originalName = originalName;
        this.contentType = contentType;
        this.fileSizeBytes = fileSizeBytes;
        this.isCover = isCover;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
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

    public MediaCategory getCategory() {
        return category;
    }

    public void setCategory(MediaCategory category) {
        this.category = category;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getUploadId() {
        return uploadId;
    }

    public void setUploadId(String uploadId) {
        this.uploadId = uploadId;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public Boolean getIsCover() {
        return isCover;
    }

    public boolean isCover() {
        return Boolean.TRUE.equals(isCover);
    }

    public void setIsCover(Boolean isCover) {
        this.isCover = isCover;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Instant getCreatedTs() {
        return createdTs;
    }

    public void setCreatedTs(Instant createdTs) {
        this.createdTs = createdTs;
    }
}
