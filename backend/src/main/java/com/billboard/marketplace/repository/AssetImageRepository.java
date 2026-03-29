package com.billboard.marketplace.repository;

import com.billboard.marketplace.entity.AssetImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetImageRepository extends JpaRepository<AssetImage, String> {

    long countByAssetId(String assetId);

    List<AssetImage> findByAssetIdOrderByDisplayOrderAsc(String assetId);
}
