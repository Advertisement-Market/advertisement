package com.billboard.marketplace.repository;

import com.billboard.marketplace.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, String> {

    List<Asset> findByCompanyId(String companyId);
}
