package com.theadbasket.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.theadbasket.backend.config.JpaConfig;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies the {@code deleteByCreatedAtBefore} predicate on H2 (the same DELETE the pg_cron job
 * runs in production). Backdates one token's {@code created_at} past the cutoff and asserts only it
 * is removed.
 */
@DataJpaTest
@Import(JpaConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class RefreshTokenRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private RefreshTokenRepository repository;

    @Test
    void deletesOnlyTokensOlderThanCutoff() {
        User user = em.persist(new User("Test", "User", "cleanup@example.com", "hash", "+911234567890", Role.OWNER));
        Instant expiry = Instant.now().plus(Duration.ofDays(7));
        Long oldId = em.persist(new RefreshToken(user, "old-token", expiry)).getId();
        Long freshId = em.persist(new RefreshToken(user, "fresh-token", expiry)).getId();
        em.flush();

        // created_at is @CreatedDate (set to now on persist); backdate the old token past retention.
        em.getEntityManager()
                .createNativeQuery("update refresh_tokens set created_at = ?1 where id = ?2")
                .setParameter(1, Timestamp.from(Instant.now().minus(Duration.ofDays(40))))
                .setParameter(2, oldId)
                .executeUpdate();
        em.clear();

        int deleted = repository.deleteByCreatedAtBefore(Instant.now().minus(Duration.ofDays(30)));

        assertThat(deleted).isEqualTo(1);
        assertThat(repository.findById(oldId)).isEmpty();
        assertThat(repository.findById(freshId)).isPresent();
    }
}
