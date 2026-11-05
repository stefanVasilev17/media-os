package com.architecturalthinking.mediaos.workflow;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(
        named = "CI_POSTGRES_URL",
        matches = "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):5432/media_os")
class EpisodeFactoryV120MigrationTest {
    @Test
    void latestFactoryMigrationAppliesOnIsolatedPostgresAndCreatesAllTables() {
        String url = System.getenv("CI_POSTGRES_URL");
        Flyway flyway = Flyway.configure()
                .dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration")
                .load();
        flyway.migrate();

        JdbcClient jdbc = JdbcClient.create(
                new DriverManagerDataSource(url, "media_os", "media_os"));
        Boolean applied = jdbc.sql("""
                select exists (
                    select 1 from flyway_schema_history
                    where version = '120' and success = true
                )
                """).query(Boolean.class).single();
        assertTrue(Boolean.TRUE.equals(applied), "Flyway V120 must be applied.");

        for (String table : List.of(
                "episode_factory_production_run",
                "episode_factory_shot",
                "episode_factory_director_feedback",
                "episode_factory_output_plan",
                "episode_factory_worker_capability",
                "episode_factory_cpu_authorization",
                "episode_factory_code_revision",
                "episode_factory_shot_review_approval",
                "episode_factory_final_review_approval")) {
            String actual = jdbc.sql("select to_regclass(:name)::text")
                    .param("name", "public." + table)
                    .query(String.class).single();
            assertEquals(table, actual, "V120 missing table: " + table);
        }

        flyway.validate();
    }
}
