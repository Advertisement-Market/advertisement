package com.theadbasket.backend.owner;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.theadbasket.backend.user.User;

import jakarta.persistence.Column;
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
 * Billboard owner business profile — one per {@link User} with role OWNER.
 */
@Entity
@Table(name = "owner_profiles")
@EntityListeners(AuditingEntityListener.class)
public class OwnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(name = "company_phone", length = 20)
    private String companyPhone;

    @Column(name = "company_reg_number", length = 60)
    private String companyRegNumber;

    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Column(name = "business_address_line1", nullable = false, length = 300)
    private String businessAddressLine1;

    @Column(name = "business_address_line2", length = 300)
    private String businessAddressLine2;

    @Column(name = "business_pincode", nullable = false, length = 6)
    private String businessPincode;

    @Column(name = "trade_license_no", length = 80)
    private String tradeLicenseNo;

    @Column(name = "ownership_type", length = 60)
    private String ownershipType;

    @Column(name = "regulatory_approvals", length = 120)
    private String regulatoryApprovals;

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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyPhone() {
        return companyPhone;
    }

    public void setCompanyPhone(String companyPhone) {
        this.companyPhone = companyPhone;
    }

    public String getCompanyRegNumber() {
        return companyRegNumber;
    }

    public void setCompanyRegNumber(String companyRegNumber) {
        this.companyRegNumber = companyRegNumber;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getBusinessAddressLine1() {
        return businessAddressLine1;
    }

    public void setBusinessAddressLine1(String businessAddressLine1) {
        this.businessAddressLine1 = businessAddressLine1;
    }

    public String getBusinessAddressLine2() {
        return businessAddressLine2;
    }

    public void setBusinessAddressLine2(String businessAddressLine2) {
        this.businessAddressLine2 = businessAddressLine2;
    }

    public String getBusinessPincode() {
        return businessPincode;
    }

    public void setBusinessPincode(String businessPincode) {
        this.businessPincode = businessPincode;
    }

    public String getTradeLicenseNo() {
        return tradeLicenseNo;
    }

    public void setTradeLicenseNo(String tradeLicenseNo) {
        this.tradeLicenseNo = tradeLicenseNo;
    }

    public String getOwnershipType() {
        return ownershipType;
    }

    public void setOwnershipType(String ownershipType) {
        this.ownershipType = ownershipType;
    }

    public String getRegulatoryApprovals() {
        return regulatoryApprovals;
    }

    public void setRegulatoryApprovals(String regulatoryApprovals) {
        this.regulatoryApprovals = regulatoryApprovals;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
