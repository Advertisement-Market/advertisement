package com.theadbasket.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Enables JPA auditing so {@code @CreatedDate} / {@code @LastModifiedDate} are populated. */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
