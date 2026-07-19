package com.theadbasket.backend.sample;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Thin service layer over {@link SampleItemRepository} (demonstrates the wiring + a unit-test seam). */
@Service
public class SampleService {

    private final SampleItemRepository repository;

    public SampleService(SampleItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SampleItem> findAll() {
        return repository.findAll();
    }
}
