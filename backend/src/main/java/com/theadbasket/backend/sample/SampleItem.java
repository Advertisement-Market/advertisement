package com.theadbasket.backend.sample;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Placeholder entity that exercises the JPA + Flyway wiring end-to-end.
 * Replace this package with the real AdBasket domain (users, billboards,
 * agencies, tenders, bids, campaigns…) as it is built out.
 */
@Entity
@Table(name = "sample_item")
public class SampleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected SampleItem() {
        // for JPA
    }

    public SampleItem(String name) {
        this.name = name;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
