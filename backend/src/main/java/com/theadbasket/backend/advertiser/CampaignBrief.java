package com.theadbasket.backend.advertiser;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.theadbasket.backend.user.User;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A campaign/requirement brief posted by an advertiser (the first one is
 * captured at registration).
 */
@Entity
@Table(name = "campaign_briefs")
@EntityListeners(AuditingEntityListener.class)
public class CampaignBrief {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "target_audience", nullable = false, length = 500)
    private String targetAudience;

    @Column(name = "target_location", nullable = false, length = 300)
    private String targetLocation;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 50)
    private String duration;

    @Column(name = "budget_min_value", precision = 14, scale = 2)
    private BigDecimal budgetMinValue;

    @Column(name = "budget_min_unit", length = 20)
    private String budgetMinUnit;

    @Column(name = "budget_max_value", precision = 14, scale = 2)
    private BigDecimal budgetMaxValue;

    @Column(name = "budget_max_unit", length = 20)
    private String budgetMaxUnit;

    @Column(name = "flexible_budget", nullable = false)
    private boolean flexibleBudget = false;

    @Column(name = "quotations_required", length = 20)
    private String quotationsRequired;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "campaign_brief_agency_prefs", joinColumns = @JoinColumn(name = "brief_id"))
    @Column(name = "preference", nullable = false, length = 80)
    private List<String> agencyPreferences = new ArrayList<>();

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(String targetAudience) {
        this.targetAudience = targetAudience;
    }

    public String getTargetLocation() {
        return targetLocation;
    }

    public void setTargetLocation(String targetLocation) {
        this.targetLocation = targetLocation;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public BigDecimal getBudgetMinValue() {
        return budgetMinValue;
    }

    public void setBudgetMinValue(BigDecimal budgetMinValue) {
        this.budgetMinValue = budgetMinValue;
    }

    public String getBudgetMinUnit() {
        return budgetMinUnit;
    }

    public void setBudgetMinUnit(String budgetMinUnit) {
        this.budgetMinUnit = budgetMinUnit;
    }

    public BigDecimal getBudgetMaxValue() {
        return budgetMaxValue;
    }

    public void setBudgetMaxValue(BigDecimal budgetMaxValue) {
        this.budgetMaxValue = budgetMaxValue;
    }

    public String getBudgetMaxUnit() {
        return budgetMaxUnit;
    }

    public void setBudgetMaxUnit(String budgetMaxUnit) {
        this.budgetMaxUnit = budgetMaxUnit;
    }

    public boolean isFlexibleBudget() {
        return flexibleBudget;
    }

    public void setFlexibleBudget(boolean flexibleBudget) {
        this.flexibleBudget = flexibleBudget;
    }

    public String getQuotationsRequired() {
        return quotationsRequired;
    }

    public void setQuotationsRequired(String quotationsRequired) {
        this.quotationsRequired = quotationsRequired;
    }

    public List<String> getAgencyPreferences() {
        return agencyPreferences;
    }

    public void setAgencyPreferences(List<String> agencyPreferences) {
        this.agencyPreferences = agencyPreferences;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
