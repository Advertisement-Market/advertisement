package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.config.AuthProviderPolicyProperties;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountRegistrarTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthService authService;

    private AuthProviderPolicyProperties authProviderPolicy;
    private AccountRegistrar accountRegistrar;

    @BeforeEach
    void setUp() {
        authProviderPolicy = new AuthProviderPolicyProperties();
        authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL));
        accountRegistrar = new AccountRegistrar(userRepository, passwordEncoder, authService, authProviderPolicy);
    }

    @Test
    @DisplayName("Anonymous registration throws BadRequestException when LOCAL auth provider is disabled")
    void attachOrCreate_whenAnonymousAndLocalProviderDisabled_throwsBadRequestException() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.GOOGLE));

        assertThatThrownBy(() -> accountRegistrar.attachOrCreate(
                null, "Rohan", "Kapoor", "rohan@example.com", "Passw0rd!", "+91 98765 43210", Role.ADVERTISER
        ))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.LOCAL_REGISTRATION_UNAVAILABLE);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Anonymous registration creates local user when LOCAL auth provider is enabled")
    void attachOrCreate_whenAnonymousAndLocalProviderEnabled_createsLocalUser() {
        when(userRepository.existsByEmailIgnoreCase("rohan@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Passw0rd!")).thenReturn("hashed-pwd");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User user = accountRegistrar.attachOrCreate(
                null, "Rohan", "Kapoor", "rohan@example.com", "Passw0rd!", "+91 98765 43210", Role.ADVERTISER
        );

        assertThat(user.getEmail()).isEqualTo("rohan@example.com");
        assertThat(user.getRole()).isEqualTo(Role.ADVERTISER);
        assertThat(user.getAuthProvider()).isEqualTo(AuthProvider.LOCAL);
        verify(authService).validateNewPassword("Passw0rd!");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Signed-in user attaches role successfully even if LOCAL auth provider is disabled")
    void attachOrCreate_whenSignedIn_attachesRoleSuccessfully() {
        authProviderPolicy.setEnabled(List.of(AuthProvider.GOOGLE));

        User existingUser = new User("Jane", "Doe", "jane@example.com", null, null, Role.MEMBER);
        when(userRepository.findById(100L)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("NewPass123!")).thenReturn("hashed-new");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User updatedUser = accountRegistrar.attachOrCreate(
                100L, "Jane", "Doe", "jane@example.com", "NewPass123!", null, Role.ADVERTISER
        );

        assertThat(updatedUser.getRole()).isEqualTo(Role.ADVERTISER);
        verify(authService).validateNewPassword("NewPass123!");
        verify(userRepository).save(existingUser);
    }

    @Test
    @DisplayName("Signed-in user who is already onboarded throws BadRequestException")
    void attachOrCreate_whenSignedInAndAlreadyOnboarded_throwsBadRequestException() {
        User onboardedUser = new User("Jane", "Doe", "jane@example.com", "pass", null, Role.ADVERTISER);
        when(userRepository.findById(100L)).thenReturn(Optional.of(onboardedUser));

        assertThatThrownBy(() -> accountRegistrar.attachOrCreate(
                100L, "Jane", "Doe", "jane@example.com", null, null, Role.AGENCY
        ))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_REGISTERED);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Anonymous registration with existing email throws EmailAlreadyExistsException")
    void attachOrCreate_whenAnonymousEmailExists_throwsException() {
        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> accountRegistrar.attachOrCreate(
                null, "Dup", "User", "dup@example.com", "Passw0rd!", null, Role.OWNER
        ))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any(User.class));
    }
}
