package com.theadbasket.backend.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtService jwtService;

    private User owner1;
    private User owner2;
    private String token1;

    @BeforeEach
    void setUp() throws Exception {
        owner1 = userRepository.save(new User("Vikram", "Kumar", "owner1@example.com", "pass", "9876543210", Role.OWNER));
        owner2 = userRepository.save(new User("Rajesh", "Sharma", "owner2@example.com", "pass", "9876543211", Role.OWNER));

        token1 = jwtService.generateAccessToken(owner1);
    }

    @Test
    void getNotifications_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getNotifications_authenticated_returnsSummary() throws Exception {
        notificationRepository.save(new Notification(owner1, "Quote Request", "New quote",
                NotificationCategory.QUOTE_REQUEST, NotificationTone.TEAL, "/owners/dashboard?tab=quotes"));
        notificationRepository.save(new Notification(owner1, "Welcome", "Welcome aboard",
                NotificationCategory.ONBOARDING, NotificationTone.INDIGO, "/owners/dashboard"));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2))
                .andExpect(jsonPath("$.notifications.length()").value(2))
                .andExpect(jsonPath("$.notifications[*].tone").value(org.hamcrest.Matchers.hasItems("teal", "indigo")))
                .andExpect(jsonPath("$.notifications[0].read").value(false));
    }

    @Test
    void markAsRead_ownNotification_returns204AndMarksRead() throws Exception {
        Notification n = notificationRepository.save(new Notification(owner1, "Quote", "Msg",
                NotificationCategory.QUOTE_REQUEST, NotificationTone.TEAL, null));

        mockMvc.perform(patch("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isNoContent());

        Notification updated = notificationRepository.findById(n.getId()).orElseThrow();
        assertThat(updated.isRead()).isTrue();
    }

    @Test
    void markAsRead_otherUserNotification_returns404() throws Exception {
        Notification otherUserNotif = notificationRepository.save(new Notification(owner2, "Quote", "Msg",
                NotificationCategory.QUOTE_REQUEST, NotificationTone.TEAL, null));

        mockMvc.perform(patch("/api/notifications/" + otherUserNotif.getId() + "/read")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("NOTIFICATION_NOT_FOUND"));
    }

    @Test
    void markAsRead_nonexistentNotification_returns404() throws Exception {
        mockMvc.perform(patch("/api/notifications/999999/read")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("NOTIFICATION_NOT_FOUND"));
    }

    @Test
    void markAllAsRead_marksAllForCurrentUser() throws Exception {
        Notification n1 = notificationRepository.save(new Notification(owner1, "N1", "M1",
                NotificationCategory.QUOTE_REQUEST, NotificationTone.TEAL, null));
        Notification n2 = notificationRepository.save(new Notification(owner1, "N2", "M2",
                NotificationCategory.LISTING_VIEW, NotificationTone.INDIGO, null));
        Notification otherNotif = notificationRepository.save(new Notification(owner2, "N3", "M3",
                NotificationCategory.SYSTEM, NotificationTone.GOLD, null));

        mockMvc.perform(post("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isNoContent());

        assertThat(notificationRepository.findById(n1.getId()).orElseThrow().isRead()).isTrue();
        assertThat(notificationRepository.findById(n2.getId()).orElseThrow().isRead()).isTrue();
        assertThat(notificationRepository.findById(otherNotif.getId()).orElseThrow().isRead()).isFalse();
    }
}
