package com.theadbasket.backend.notification;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.theadbasket.backend.notification.dto.NotificationSummaryDto;
import com.theadbasket.backend.security.AuthenticatedUser;

/**
 * Endpoints for managing user notifications across all dashboard personas.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationSummaryDto getNotifications(@AuthenticationPrincipal AuthenticatedUser principal) {
        return notificationService.getNotificationsForUser(principal.id());
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(@PathVariable Long id,
                           @AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.markAsRead(id, principal.id());
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead(@AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.markAllAsRead(principal.id());
    }
}
