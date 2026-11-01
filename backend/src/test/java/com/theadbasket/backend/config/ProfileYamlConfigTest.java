package com.theadbasket.backend.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.PropertySourcesPropertyResolver;
import org.springframework.core.io.ClassPathResource;

class ProfileYamlConfigTest {

    private final YamlPropertySourceLoader loader = new YamlPropertySourceLoader();

    @Test
    @DisplayName("application-prod.yml resolves when DB_PASSWORD environment variable is completely absent")
    void prodProfileResolvesWhenPasswordAbsent() throws IOException {
        verifyProfileYamlWithUnsetEnv("application-prod.yml");
    }

    @Test
    @DisplayName("application-staging.yml resolves when DB_PASSWORD environment variable is completely absent")
    void stagingProfileResolvesWhenPasswordAbsent() throws IOException {
        verifyProfileYamlWithUnsetEnv("application-staging.yml");
    }

    @Test
    @DisplayName("application-prod.yml resolves Hikari and Flyway properties with empty password")
    void prodProfileResolvesWithEmptyPassword() throws IOException {
        verifyProfileYaml("application-prod.yml", "");
    }

    @Test
    @DisplayName("application-prod.yml resolves with non-empty DB_PASSWORD")
    void prodProfileResolvesWithNonEmptyPassword() throws IOException {
        verifyProfileYaml("application-prod.yml", "superSecret123!");
    }

    @Test
    @DisplayName("application-staging.yml resolves Hikari and Flyway properties with empty password")
    void stagingProfileResolvesWithEmptyPassword() throws IOException {
        verifyProfileYaml("application-staging.yml", "");
    }

    @Test
    @DisplayName("application-staging.yml resolves with non-empty DB_PASSWORD")
    void stagingProfileResolvesWithNonEmptyPassword() throws IOException {
        verifyProfileYaml("application-staging.yml", "stagingSecret456!");
    }

    private void verifyProfileYamlWithUnsetEnv(String filename) throws IOException {
        // Simulates an environment where DB_PASSWORD is completely absent
        Map<String, Object> envMap = new HashMap<>();
        envMap.put("DB_URL", "jdbc:postgresql://db.adbasket.internal:5432/adbasket");
        envMap.put("DB_USERNAME", "adbasket_user");
        // No DB_PASSWORD key in the map

        runResolverAssertions(filename, envMap, "");
    }

    private void verifyProfileYaml(String filename, String dbPassword) throws IOException {
        Map<String, Object> envMap = Map.of(
                "DB_URL", "jdbc:postgresql://db.adbasket.internal:5432/adbasket",
                "DB_USERNAME", "adbasket_user",
                "DB_PASSWORD", dbPassword
        );
        runResolverAssertions(filename, envMap, dbPassword);
    }

    private void runResolverAssertions(String filename, Map<String, Object> envMap, String expectedPassword) throws IOException {
        List<PropertySource<?>> sources = loader.load(filename, new ClassPathResource(filename));
        assertThat(sources).isNotEmpty();

        MutablePropertySources propertySources = new MutablePropertySources();
        // Environment map source simulates OS environment variables
        propertySources.addFirst(new MapPropertySource("env", envMap));
        sources.forEach(propertySources::addLast);

        PropertySourcesPropertyResolver resolver = new PropertySourcesPropertyResolver(propertySources);
        resolver.setIgnoreUnresolvableNestedPlaceholders(false);

        // Verify datasource properties
        String dsUrl = resolver.getProperty("spring.datasource.url");
        String dsUser = resolver.getProperty("spring.datasource.username");
        String dsPass = resolver.getProperty("spring.datasource.password");
        String initSql = resolver.getProperty("spring.datasource.hikari.connection-init-sql");

        assertThat(dsUrl).isEqualTo("jdbc:postgresql://db.adbasket.internal:5432/adbasket");
        assertThat(dsUser).isEqualTo("adbasket_user");
        assertThat(dsPass).isEqualTo(expectedPassword);
        assertThat(initSql).isEqualTo("SET lock_timeout = '5s'");

        // Verify dedicated Flyway datasource properties resolve to matching coordinates
        String flywayUrl = resolver.getProperty("spring.flyway.url");
        String flywayUser = resolver.getProperty("spring.flyway.user");
        String flywayPass = resolver.getProperty("spring.flyway.password");
        String flywayInitSql = resolver.getProperty("spring.flyway.init-sqls[0]");

        assertThat(flywayUrl).isEqualTo(dsUrl);
        assertThat(flywayUser).isEqualTo(dsUser);
        assertThat(flywayPass).isEqualTo(expectedPassword);
        assertThat(flywayInitSql).isEqualTo("SET lock_timeout = 0");
    }
}
