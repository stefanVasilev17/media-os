package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Executes the entire Flyway history against an isolated CI PostgreSQL instance.
 * In local environments without CI_POSTGRES_URL, this test is skipped.
 */
class GlobalCreationPreflightMigrationTest {

    @Test
    void freshDatabaseContainsEveryRequiredCanonicalCreationPrerequisite() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Requires isolated CI PostgreSQL");

        Flyway flyway = Flyway.configure()
                .dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration")
                .validateMigrationNaming(true)
                .load();
        flyway.migrate();
        flyway.validate();

        ProductionMemoryService memory = new ProductionMemoryService(
                JdbcClient.create(new DriverManagerDataSource(url, "media_os", "media_os")), new ObjectMapper());
        List<Map<String, Object>> visualRules = memory.rulesFor("VISUAL");
        assertThat(visualRules).extracting(rule -> String.valueOf(rule.get("scope")))
                .contains("ALL", "SCRIPT", "VOICE", "VISUAL");
        assertThat(memory.rulesFor("ALL").size()).isGreaterThanOrEqualTo(visualRules.size());

        Map<String, Object> preflight = memory.preflight(
                "VISUAL", "CI_REAL_POSTGRES_CONTEXT_CHECK", ProductionOverviewService.EPISODE_ID);
        assertThat(preflight.get("status")).isEqualTo("CONTEXT_READY");
        assertThat(preflight.get("semanticApproval")).isEqualTo(false);
        assertThat(((Number) preflight.get("approvedAssetCount")).intValue()).isGreaterThanOrEqualTo(12);

        try (Connection connection = DriverManager.getConnection(url, "media_os", "media_os");
             Statement statement = connection.createStatement()) {

            assertThat(number(statement, "select count(*) from production_memory_rule where active=true and content like 'GLOBAL_CREATION_PREFLIGHT:%'")).isEqualTo(1);
            assertThat(number(statement, "select count(*) from production_asset_catalog where status='LOCKED'")).isGreaterThanOrEqualTo(12);
            assertThat(number(statement, "select count(*) from production_memory_rule where id::text like '90000000-0000-4000-8000-0000000091%'")).isEqualTo(7);
            assertThat(number(statement, "select count(*) from information_schema.columns where table_name='production_preflight_audit' and column_name in ('policy_version','approved_asset_count')")).isEqualTo(2);

            try (ResultSet rows = statement.executeQuery("""
                    select payload->'creationPreflight'->>'contract' as contract,
                           payload->'cameraSystem'->>'tool' as tool,
                           payload->'splineShotWorkflow'->>'status' as legacy_status
                    from project_creative_policy
                    where project_id='11111111-1111-1111-1111-111111111111'
                    """)) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString("contract")).isEqualTo("GLOBAL_CREATION_PREFLIGHT");
                assertThat(rows.getString("tool")).isEqualTo("Remotion-first");
                assertThat(rows.getString("legacy_status")).isEqualTo("LEGACY_ONLY");
            }
        }
    }

    private int number(Statement statement, String sql) throws Exception {
        try (ResultSet rows = statement.executeQuery(sql)) {
            assertThat(rows.next()).isTrue();
            return rows.getInt(1);
        }
    }
}
