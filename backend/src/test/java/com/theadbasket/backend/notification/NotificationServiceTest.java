package com.theadbasket.backend.notification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.notification.dto.NotificationSummaryDto;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);
        user = new User("Vikram", "Kumar", "owner@example.com", "hash", "9876543210", Role.OWNER);
    }

    @Test
    void getNotificationsForUser_returnsSummaryWithUnreadCount() {
        Notification n1 = new Notification(user, "New Quote", "FMCG Brand sent a quote",
                NotificationCategory.QUOTE_REQUEST, NotificationTone.TEAL, "/owners/dashboard?tab=quotes");
        Notification n2 = new Notification(user, "Welcome", "Welcome aboard",
                NotificationCategory.ONBOARDING, NotificationTone.INDIGO, "/owners/dashboard");
        n2.setRead(true);

        when(notificationRepository.findTop50ByUserIdOrderByCreatedTsDesc(1L)).thenReturn(List.of(n1, n2));
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(1L);

        NotificationSummaryDto summary = notificationService.getNotificationsForUser(1L);

        assertThat(summary.unreadCount()).isEqualTo(1L);
        assertThat(summary.notifications()).hasSize(2);
        assertThat(summary.notifications().get(0).title()).isEqualTo("New Quote");
        assertThat(summary.notifications().get(0).category()).isEqualTo(NotificationCategory.QUOTE_REQUEST);
        assertThat(summary.notifications().get(0).tone()).isEqualTo("teal");
        assertThat(summary.notifications().get(0).read()).isFalse();
    }

    @Test
    void markAsRead_whenNotificationExistsAndBelongsToUser_succeeds() {
        when(notificationRepository.markAsRead(10L, 1L)).thenReturn(1);

        notificationService.markAsRead(10L, 1L);

        verify(notificationRepository).markAsRead(10L, 1L);
    }

    @Test
    void markAsRead_whenNotificationNotFoundOrBelongsToOtherUser_throwsResourceNotFoundException() {
        when(notificationRepository.markAsRead(99L, 1L)).thenReturn(0);

        assertThatThrownBy(() -> notificationService.markAsRead(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllAsRead_callsRepositoryBulkUpdate() {
        notificationService.markAllAsRead(1L);

        verify(notificationRepository).markAllAsRead(1L);
    }

    @Test
    void createNotification_persistsNotificationWithCorrectFields() {
        Notification saved = new Notification(user, "Tender Match", "New tender in Mumbai",
                NotificationCategory.TENDER_MATCH, NotificationTone.GOLD, "/owners/dashboard?tab=tenders");
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.createNotification(
                user, "Tender Match", "New tender in Mumbai",
                NotificationCategory.TENDER_MATCH, NotificationTone.GOLD, "/owners/dashboard?tab=tenders"
        );

        assertThat(result.getTitle()).isEqualTo("Tender Match");
        assertThat(result.getCategory()).isEqualTo(NotificationCategory.TENDER_MATCH);
        assertThat(result.getTone()).isEqualTo(NotificationTone.GOLD);
    }
}
