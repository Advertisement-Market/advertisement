package com.billboard.marketplace.dto.response;

import com.billboard.marketplace.entity.Asset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {

    private String assetId;
    private Asset.AssetType assetType;
    private String address;
    private String additionalInfo;
    private Asset.AssetStatus status;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
}
