package com.billboard.marketplace.dto.response;

import com.billboard.marketplace.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private User.Role role;
    private String userId;
    private String email;
}
