package com.theadbasket.backend.lov;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only lookup endpoints that feed the config-driven billboard dropdowns on the owner
 * registration form. Public (no auth) so the form can populate before sign-in.
 */
@RestController
@RequestMapping("/api/lov")
public class LovController {

    private final LovService lovService;

    public LovController(LovService lovService) {
        this.lovService = lovService;
    }

    @GetMapping("/billboard-types")
    public List<LovOption> billboardTypes() {
        return lovService.billboardTypes();
    }

    @GetMapping("/traffic-types")
    public List<LovOption> trafficTypes() {
        return lovService.trafficTypes();
    }

    @GetMapping("/audience-types")
    public List<LovOption> audienceTypes() {
        return lovService.audienceTypes();
    }

    @GetMapping("/facing-directions")
    public List<LovOption> facingDirections() {
        return lovService.facingDirections();
    }

    @GetMapping("/booking-duration-units")
    public List<LovOption> bookingDurationUnits() {
        return lovService.bookingDurationUnits();
    }
}
