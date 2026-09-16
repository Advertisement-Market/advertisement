package com.theadbasket.backend.notification;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.notification.dto.NotificationDto;
import com.theadbasket.backend.notification.dto.NotificationSummaryDto;
import com.theadbasket.backend.user.User;

/**
 * Service managing notification feeds, read state persistence, and event-driven creation.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Fetches the top 50 notifications for the given user along with the total unread count.
     * Strictly read-only and idempotent.
     */
    @Transactional(readOnly = true)
    public NotificationSummaryDto getNotificationsForUser(Long userId) {
        List<Notification> items = notificationRepository.findTop50ByUserIdOrderByCreatedTsDesc(userId);
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        List<NotificationDto> dtos = items.stream().map(NotificationDto::from).toList();
        return new NotificationSummaryDto(unreadCount, dtos);
    }

    /**
     * Marks a single notification as read, ensuring row-level ownership isolation.
     * Throws {@link ResourceNotFoundException} if the notification does not exist or does not belong to the user.
     */
    @Transactional
    public void markAsRead(Long id, Long userId) {
        int updated = notificationRepository.markAsRead(id, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
    }

    /**
     * Marks all unread notifications for the user as read. Idempotent.
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    /**
     * Creates and persists a new notification for the specified user.
     */
    @Transactional
    public Notification createNotification(User user, String title, String message,
                                          NotificationCategory category, NotificationTone tone,
                                          String targetUrl) {
        Notification notification = new Notification(user, title, message, category, tone, targetUrl);
        return notificationRepository.save(notification);
    }
}
