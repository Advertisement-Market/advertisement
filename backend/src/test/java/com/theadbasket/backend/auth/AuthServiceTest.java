package com.theadbasket.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.auth.dto.RegisterRequest;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit tests for {@link AuthService#register} using Mockito (no Spring context). */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_hashesPassword_persistsUser_andReturnsTokens() {
        when(userRepository.existsByEmailIgnoreCase("rahul@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Passw0rd!")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.getAccessTokenExpiresInSeconds()).thenReturn(900L);
        when(refreshTokenService.create(any(User.class))).thenAnswer(inv ->
                new RefreshToken(inv.getArgument(0), "refresh-token", Instant.now().plusSeconds(1000)));

        RegisterRequest request = new RegisterRequest(
                "Rahul", "Sharma", "rahul@example.com", "", Role.ADVERTISER, "Passw0rd!");

        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);
        assertThat(response.user().email()).isEqualTo("rahul@example.com");
        assertThat(response.user().role()).isEqualTo(Role.ADVERTISER);
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("Passw0rd!");
    }

    @Test
    void register_withTakenEmail_throws_andDoesNotSave() {
        when(userRepository.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest(
                "A", "B", "taken@example.com", "", Role.OWNER, "password1");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class);
        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
    }
}
