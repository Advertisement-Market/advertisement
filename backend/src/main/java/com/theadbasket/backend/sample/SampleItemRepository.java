package com.theadbasket.backend.sample;

import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository for {@link SampleItem}. */
public interface SampleItemRepository extends JpaRepository<SampleItem, Long> {
}
