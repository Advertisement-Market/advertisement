package com.theadbasket.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Smoke test: the Spring context boots (H2 + Flyway) under the test profile. */
@SpringBootTest
@ActiveProfiles("test")
class TheAdBasketApplicationTests {

    @Test
    void contextLoads() {
    }
}
