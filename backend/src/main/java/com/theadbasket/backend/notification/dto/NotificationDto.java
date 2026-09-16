package com.theadbasket.backend.notification.dto;

import java.time.Instant;

import com.theadbasket.backend.notification.Notification;
import com.theadbasket.backend.notification.NotificationCategory;

/**
 * Payload representing a single notification item.
 *
 * @param id         Unique identifier
 * @param title      Short summary header
 * @param message    Detailed notification text
 * @param category   Domain category enum
 * @param tone       Lowercase color tone for CSS classes (e.g. "teal", "indigo")
 * @param targetUrl  Optional target URL/path to navigate to
 * @param read       Whether notification has been marked as read
 * @param createdAt  Creation timestamp
 */
public record NotificationDto(
        Long id,
        String title,
        String message,
        NotificationCategory category,
        String tone,
        String targetUrl,
        boolean read,
        Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getCategory(),
                n.getTone() != null ? n.getTone().name().toLowerCase() : "teal",
                n.getTargetUrl(),
                n.isRead(),
                n.getCreatedTs()
        );
    }
}
