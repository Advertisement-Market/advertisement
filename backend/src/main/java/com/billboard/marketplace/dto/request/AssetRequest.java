package com.billboard.marketplace.dto.request;

import com.billboard.marketplace.entity.Asset;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssetRequest {

    @NotNull(message = "Asset type is required")
    private Asset.AssetType assetType;

    @NotBlank(message = "Address is required")
    private String address;

    private String additionalInfo;
}
