package com.theadbasket.backend.agency;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** A single portfolio/case-study entry on an {@link AgencyProfile}. */
@Embeddable
public class PortfolioItem {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 300)
    private String meta;

    protected PortfolioItem() {
        // for JPA
    }

    public PortfolioItem(String title, String meta) {
        this.title = title;
        this.meta = meta;
    }

    public String getTitle() { return title; }
    public String getMeta() { return meta; }
}
