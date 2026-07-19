package com.theadbasket.backend.sample;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Sample REST endpoint that returns the Flyway-seeded {@link SampleItem} rows. */
@RestController
@RequestMapping("/api/samples")
public class SampleController {

    private final SampleService service;

    public SampleController(SampleService service) {
        this.service = service;
    }

    @GetMapping
    public List<SampleItem> all() {
        return service.findAll();
    }
}
