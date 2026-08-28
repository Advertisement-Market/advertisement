package com.theadbasket.backend.agency;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Ad agency / service-provider profile — one per {@link User} with role AGENCY.
 */
@Entity
@Table(name = "agency_profiles")
@EntityListeners(AuditingEntityListener.class)
public class AgencyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "agency_name", nullable = false, length = 150)
    private String agencyName;

    @Column(name = "agency_type", nullable = false, length = 80)
    private String agencyType;

    @Column(name = "year_established", nullable = false)
    private Integer yearEstablished;

    @Column(name = "years_experience", length = 40)
    private String yearsExperience;

    @Column(length = 200)
    private String tagline;

    @Column(length = 2000)
    private String about;

    @Column(length = 255)
    private String website;

    @Column(length = 30)
    private String contactNo;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "headquarters_pincode", nullable = false, length = 6)
    private String headquartersPincode;

    @Column(name = "office_address", nullable = false, length = 500)
    private String officeAddress;

    @Column(name = "contact_designation", nullable = false, length = 120)
    private String contactDesignation;

    @Column(name = "campaigns_completed", length = 40)
    private String campaignsCompleted;

    @Column(name = "pricing_model", length = 80)
    private String pricingModel;

    @Column(name = "min_tender_budget", length = 60)
    private String minTenderBudget;

    @Column(name = "geo_coverage", length = 80)
    private String geoCoverage;

    @Column(name = "coverage_cities", length = 300)
    private String coverageCities;

    @Column(name = "reg_number", length = 60)
    private String regNumber;

    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @Column(name = "key_clients", length = 500)
    private String keyClients;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agency_services", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "service", nullable = false, length = 120)
    private List<String> services = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agency_industries", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "industry", nullable = false, length = 80)
    private List<String> industries = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agency_expertise_tags", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "tag", nullable = false, length = 80)
    private List<String> expertiseTags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agency_languages", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "language", nullable = false, length = 40)
    private List<String> languages = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agency_portfolio_items", joinColumns = @JoinColumn(name = "profile_id"))
    private List<PortfolioItem> portfolio = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_ts", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_ts", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getAgencyName() {
        return agencyName;
    }

    public void setAgencyName(String agencyName) {
        this.agencyName = agencyName;
    }

    public String getAgencyType() {
        return agencyType;
    }

    public void setAgencyType(String agencyType) {
        this.agencyType = agencyType;
    }

    public Integer getYearEstablished() {
        return yearEstablished;
    }

    public void setYearEstablished(Integer yearEstablished) {
        this.yearEstablished = yearEstablished;
    }

    public String getYearsExperience() {
        return yearsExperience;
    }

    public void setYearsExperience(String yearsExperience) {
        this.yearsExperience = yearsExperience;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public String getHeadquartersPincode() {
        return headquartersPincode;
    }

    public void setHeadquartersPincode(String headquartersPincode) {
        this.headquartersPincode = headquartersPincode;
    }

    public String getOfficeAddress() {
        return officeAddress;
    }

    public void setOfficeAddress(String officeAddress) {
        this.officeAddress = officeAddress;
    }

    public String getContactDesignation() {
        return contactDesignation;
    }

    public void setContactDesignation(String contactDesignation) {
        this.contactDesignation = contactDesignation;
    }

    public String getCampaignsCompleted() {
        return campaignsCompleted;
    }

    public void setCampaignsCompleted(String campaignsCompleted) {
        this.campaignsCompleted = campaignsCompleted;
    }

    public String getPricingModel() {
        return pricingModel;
    }

    public void setPricingModel(String pricingModel) {
        this.pricingModel = pricingModel;
    }

    public String getMinTenderBudget() {
        return minTenderBudget;
    }

    public void setMinTenderBudget(String minTenderBudget) {
        this.minTenderBudget = minTenderBudget;
    }

    public String getGeoCoverage() {
        return geoCoverage;
    }

    public void setGeoCoverage(String geoCoverage) {
        this.geoCoverage = geoCoverage;
    }

    public String getCoverageCities() {
        return coverageCities;
    }

    public void setCoverageCities(String coverageCities) {
        this.coverageCities = coverageCities;
    }

    public String getRegNumber() {
        return regNumber;
    }

    public void setRegNumber(String regNumber) {
        this.regNumber = regNumber;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getKeyClients() {
        return keyClients;
    }

    public void setKeyClients(String keyClients) {
        this.keyClients = keyClients;
    }

    public List<String> getServices() {
        return services;
    }

    public void setServices(List<String> services) {
        this.services = services;
    }

    public List<String> getIndustries() {
        return industries;
    }

    public void setIndustries(List<String> industries) {
        this.industries = industries;
    }

    public List<String> getExpertiseTags() {
        return expertiseTags;
    }

    public void setExpertiseTags(List<String> expertiseTags) {
        this.expertiseTags = expertiseTags;
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages;
    }

    public List<PortfolioItem> getPortfolio() {
        return portfolio;
    }

    public void setPortfolio(List<PortfolioItem> portfolio) {
        this.portfolio = portfolio;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
