package com.theadbasket.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.auth.dto.GoogleTokenInfo;
import com.theadbasket.backend.auth.dto.LoginRequest;
import com.theadbasket.backend.auth.dto.RegisterRequest;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.config.AuthPolicyProperties;
import com.theadbasket.backend.config.AuthProviderPolicyProperties;
import com.theadbasket.backend.config.RolePolicyProperties;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit tests for {@link AuthService} using Mockito (no Spring context). */
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
    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    private AuthProviderPolicyProperties authProviderPolicy;
    private RolePolicyProperties rolePolicy;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authProviderPolicy = new AuthProviderPolicyProperties();
        rolePolicy = new RolePolicyProperties();
        rolePolicy.setEnabled(List.of(Role.MEMBER, Role.ADVERTISER, Role.OWNER, Role.AGENCY));

        authService = new AuthService(userRepository, passwordEncoder, authenticationManager,
                jwtService, refreshTokenService, googleTokenVerifier,
                new AuthPolicyProperties(8, 72, Role.MEMBER),
                authProviderPolicy,
                rolePolicy);
    }

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

    @Test
    void register_whenLocalProviderDisabled_throwsBadRequestException() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.GOOGLE));

        RegisterRequest request = new RegisterRequest(
                "Rahul", "Sharma", "rahul@example.com", "", Role.ADVERTISER, "Passw0rd!");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Local registration is currently unavailable");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_whenTargetRoleDisabled_throwsBadRequestException() {
        rolePolicy.setEnabled(List.of(Role.MEMBER));

        RegisterRequest request = new RegisterRequest(
                "Rahul", "Sharma", "rahul@example.com", "", Role.ADVERTISER, "Passw0rd!");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Registration for role ADVERTISER is currently unavailable");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_whenLocalProviderDisabled_throwsBadRequestException() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.GOOGLE));

        LoginRequest request = new LoginRequest("rahul@example.com", "Passw0rd!");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Local sign-in is currently unavailable");

        verify(authenticationManager, never()).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_whenLocalProviderEnabled_authenticatesAndReturnsTokens() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL));

        User user = new User("Rahul", "Sharma", "rahul@example.com", "hashed", null, Role.MEMBER);
        when(userRepository.findByEmailIgnoreCase("rahul@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(jwtService.getAccessTokenExpiresInSeconds()).thenReturn(900L);
        when(refreshTokenService.create(user)).thenReturn(
                new RefreshToken(user, "refresh-token", Instant.now().plusSeconds(1000)));

        LoginRequest request = new LoginRequest("rahul@example.com", "Passw0rd!");
        AuthResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.user().email()).isEqualTo("rahul@example.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void loginWithGoogle_whenGoogleProviderDisabled_throwsBadRequestException() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL));

        assertThatThrownBy(() -> authService.loginWithGoogle("some-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Google sign-in is currently unavailable");

        verify(googleTokenVerifier, never()).verify(anyString());
    }

    @Test
    void loginWithGoogle_whenNewUserAndDefaultRoleDisabled_throwsBadRequestException() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL, AuthProvider.GOOGLE));
        rolePolicy.setEnabled(List.of(Role.ADVERTISER)); // Role.MEMBER (default role) is disabled

        GoogleTokenInfo tokenInfo = new GoogleTokenInfo(
                "client-id", "google-sub-123", "newuser@example.com",
                true, "New", "User", "New User"
        );
        when(googleTokenVerifier.verify("valid-token")).thenReturn(tokenInfo);
        when(userRepository.findByGoogleSubjectId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("newuser@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.loginWithGoogle("valid-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Registration is currently unavailable");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginWithGoogle_whenGoogleProviderEnabled_createsUserAndReturnsTokens() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL, AuthProvider.GOOGLE));

        GoogleTokenInfo tokenInfo = new GoogleTokenInfo(
                "client-id", "google-sub-123", "googleuser@example.com",
                true, "Google", "User", "Google User"
        );
        when(googleTokenVerifier.verify("valid-token")).thenReturn(tokenInfo);
        when(userRepository.findByGoogleSubjectId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("googleuser@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.getAccessTokenExpiresInSeconds()).thenReturn(900L);
        when(refreshTokenService.create(any(User.class))).thenAnswer(inv ->
                new RefreshToken(inv.getArgument(0), "refresh-token", Instant.now().plusSeconds(1000)));

        AuthResponse response = authService.loginWithGoogle("valid-token");

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.user().email()).isEqualTo("googleuser@example.com");
        verify(userRepository).save(any(User.class));
    }
}
