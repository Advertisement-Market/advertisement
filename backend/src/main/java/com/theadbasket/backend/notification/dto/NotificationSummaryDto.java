package com.theadbasket.backend.notification.dto;

import java.util.List;

/**
 * Summary wrapper containing unread count and top notification items.
 *
 * @param unreadCount   Total unread notifications count for the user
 * @param notifications Top notification items ordered chronologically descending
 */
public record NotificationSummaryDto(
        long unreadCount,
        List<NotificationDto> notifications
) {
}
