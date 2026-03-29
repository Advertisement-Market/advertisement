package com.billboard.marketplace.service;

import com.billboard.marketplace.dto.request.AssetRequest;
import com.billboard.marketplace.dto.response.AssetResponse;
import com.billboard.marketplace.entity.Asset;
import com.billboard.marketplace.entity.AssetImage;
import com.billboard.marketplace.entity.Company;
import com.billboard.marketplace.exception.ResourceNotFoundException;
import com.billboard.marketplace.repository.AssetImageRepository;
import com.billboard.marketplace.repository.AssetRepository;
import com.billboard.marketplace.repository.CompanyRepository;
import com.billboard.marketplace.repository.UserRepository;
import com.billboard.marketplace.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetService {

    private static final int MIN_IMAGES_FOR_ACTIVE = 3;

    private final AssetRepository assetRepository;
    private final AssetImageRepository assetImageRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public AssetResponse createAsset(AssetRequest request, String ownerEmail) {
        Company company = companyRepository.findByUserId(getUserIdByEmail(ownerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Company profile not found for this user"));

        Asset asset = Asset.builder()
                .company(company)
                .assetType(request.getAssetType())
                .address(request.getAddress().trim())
                .additionalInfo(request.getAdditionalInfo())
                .status(Asset.AssetStatus.PENDING_REVIEW)
                .build();
        assetRepository.save(asset);

        log.info("Asset created: {} for company {}", asset.getId(), company.getId());
        return toResponse(asset, List.of());
    }

    @Transactional
    public AssetResponse uploadImages(String assetId, List<MultipartFile> files, String ownerEmail) {
        Asset asset = getAssetOwnedBy(assetId, ownerEmail);

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No files provided");
        }

        List<AssetImage> existing = assetImageRepository.findByAssetIdOrderByDisplayOrderAsc(assetId);
        int startOrder = existing.size();

        List<String> imageUrls = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            String imageUrl = fileStorageService.storeAssetImage(files.get(i), assetId);

            AssetImage assetImage = AssetImage.builder()
                    .asset(asset)
                    .imageUrl(imageUrl)
                    .displayOrder(startOrder + i)
                    .build();
            assetImageRepository.save(assetImage);
            imageUrls.add(imageUrl);
        }

        // Promote to ACTIVE once at least 3 images exist
        long totalImages = assetImageRepository.countByAssetId(assetId);
        if (totalImages >= MIN_IMAGES_FOR_ACTIVE && asset.getStatus() == Asset.AssetStatus.PENDING_REVIEW) {
            asset.setStatus(Asset.AssetStatus.ACTIVE);
            assetRepository.save(asset);
            log.info("Asset {} is now ACTIVE after {} images uploaded", assetId, totalImages);
        }

        List<String> allUrls = assetImageRepository.findByAssetIdOrderByDisplayOrderAsc(assetId)
                .stream().map(AssetImage::getImageUrl).toList();

        return toResponse(asset, allUrls);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> listAssets(String ownerEmail) {
        String userId = getUserIdByEmail(ownerEmail);
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company profile not found"));

        List<Asset> assets = assetRepository.findByCompanyId(company.getId());
        return assets.stream().map(asset -> {
            List<String> urls = assetImageRepository.findByAssetIdOrderByDisplayOrderAsc(asset.getId())
                    .stream().map(AssetImage::getImageUrl).toList();
            return toResponse(asset, urls);
        }).toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse getAsset(String assetId, String ownerEmail) {
        Asset asset = getAssetOwnedBy(assetId, ownerEmail);
        List<String> urls = assetImageRepository.findByAssetIdOrderByDisplayOrderAsc(assetId)
                .stream().map(AssetImage::getImageUrl).toList();
        return toResponse(asset, urls);
    }

    // ---------- helpers ----------

    private Asset getAssetOwnedBy(String assetId, String ownerEmail) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + assetId));

        String userId = getUserIdByEmail(ownerEmail);
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        if (!asset.getCompany().getId().equals(company.getId())) {
            throw new ResourceNotFoundException("Asset not found: " + assetId);
        }
        return asset;
    }

    private String getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return user.getId();
    }

    private AssetResponse toResponse(Asset asset, List<String> imageUrls) {
        return AssetResponse.builder()
                .assetId(asset.getId())
                .assetType(asset.getAssetType())
                .address(asset.getAddress())
                .additionalInfo(asset.getAdditionalInfo())
                .status(asset.getStatus())
                .imageUrls(imageUrls)
                .createdAt(asset.getCreatedAt())
                .build();
    }
}
