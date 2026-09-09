package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Shared account provisioning for the role-specific registration services:
 * attaches a role to the signed-in account (promoting a MEMBER) or creates a
 * new account when the caller is anonymous.
 */
@Component
public class AccountRegistrar {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public AccountRegistrar(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    /**
     * <ul>
     * <li><b>Signed in:</b> promotes a {@code MEMBER} to {@code role}; sets an
     * optional password when the account has none (Google). An
     * already-onboarded account is rejected.</li>
     * <li><b>Anonymous:</b> requires email + password (length-checked) and
     * creates a LOCAL account.</li>
     * </ul>
     */
    public User attachOrCreate(Long currentUserId, String firstName, String lastName, String rawEmail,
            String rawPassword, String phone, Role role) {
        if (currentUserId != null) {
            User user = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new BadRequestException("Your session is no longer valid. Please sign in again."));
            if (user.getRole() != null && user.getRole().isOnboarded()) {
                throw new BadRequestException(
                        "This account is already registered as " + user.getRole().name().toLowerCase() + ".");
            }
            user.setRole(role);
            if (!user.hasPassword() && rawPassword != null && !rawPassword.isBlank()) {
                authService.validateNewPassword(rawPassword);
                user.setPassword(passwordEncoder.encode(rawPassword));
            }
            return userRepository.save(user);
        }

        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BadRequestException("Login email is required to create an account.");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Password is required to create an account.");
        }
        authService.validateNewPassword(rawPassword);
        String email = rawEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        User user = new User(firstName, blankToNull(lastName), email,
                passwordEncoder.encode(rawPassword), blankToNull(phone), role);
        user.setAuthProvider(AuthProvider.LOCAL);
        return userRepository.save(user);
    }

    public static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    public static <T> List<T> nullToEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }
}
