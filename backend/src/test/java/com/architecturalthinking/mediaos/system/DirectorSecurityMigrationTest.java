package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DirectorSecurityMigrationTest {
    private static final String USER = "media_os";
    private static final String PASSWORD = "media_os";
    private static final String ISSUER = "https://ci-only-id.example";

    @Test
    void freshIsolatedPostgresAppliesSecurityMigrationsWithoutAutoProvisioningDirector()
            throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(),
                "Only executes against an isolated CI PostgreSQL database");

        Flyway flyway = Flyway.configure()
                .dataSource(url, USER, PASSWORD)
                .locations("classpath:db/migration")
                .validateMigrationNaming(true)
                .load();
        flyway.migrate();
        flyway.validate();

        try (Connection connection = DriverManager.getConnection(url, USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            assertEquals(1, count(statement,
                    "select count(*) from flyway_schema_history where version='97' and success=true"));
            assertEquals(0, count(statement,
                    "select count(*) from mediaos_director_membership"));
            assertEquals(8, count(statement, """
                    select count(*) from information_schema.columns
                    where (table_name='episode_workspace_event'
                           or table_name='episode_learning_proposal'
                           or table_name='ai_preview_authorization'
                           or table_name='ai_runtime_policy_change_audit')
                      and column_name in ('actor_issuer','actor_subject')
                    """));
            assertEquals(0, count(statement,
                    "select count(*) from ai_runtime_policy_change_audit"));
        }
    }

    @Test
    void membershipRequiresExactIssuerSubjectProjectAndActiveStatus() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(),
                "Only executes against an isolated CI PostgreSQL database");
        Flyway.configure().dataSource(url, USER, PASSWORD)
                .locations("classpath:db/migration").load().migrate();
        String subject = "temporary-ci-" + UUID.randomUUID();
        DriverManagerDataSource datasource = new DriverManagerDataSource(url, USER, PASSWORD);
        DirectorMembershipService membership = new DirectorMembershipService(JdbcClient.create(datasource));

        try (Connection connection = DriverManager.getConnection(url, USER, PASSWORD)) {
            try (PreparedStatement insert = connection.prepareStatement("""
                    insert into mediaos_director_membership
                        (project_id,issuer,subject,role,active)
                    values (?,?,?,?,false)
                    """)) {
                insert.setObject(1, ProductionOverviewService.PROJECT_ID);
                insert.setString(2, ISSUER);
                insert.setString(3, subject);
                insert.setString(4, "DIRECTOR");
                assertEquals(1, insert.executeUpdate());
            }

            try {
                assertTrue(membership.authorities(ISSUER, subject).isEmpty(),
                        "An inactive row must never grant Director");
                try (PreparedStatement activate = connection.prepareStatement("""
                        update mediaos_director_membership set active=true
                        where issuer=? and subject=?
                        """)) {
                    activate.setString(1, ISSUER);
                    activate.setString(2, subject);
                    assertEquals(1, activate.executeUpdate());
                }
                assertEquals(List.of("ROLE_DIRECTOR"),
                        membership.authorities(ISSUER, subject).stream()
                                .map(authority -> authority.getAuthority()).toList());
                assertTrue(membership.authorities("https://other-issuer.example", subject).isEmpty());
                assertTrue(membership.authorities(ISSUER, "someone-else").isEmpty());
            } finally {
                try (PreparedStatement delete = connection.prepareStatement("""
                        delete from mediaos_director_membership
                        where project_id=? and issuer=? and subject=?
                        """)) {
                    delete.setObject(1, ProductionOverviewService.PROJECT_ID);
                    delete.setString(2, ISSUER);
                    delete.setString(3, subject);
                    delete.executeUpdate();
                }
            }
        }
    }

    private int count(Statement statement, String sql) throws Exception {
        try (ResultSet rows = statement.executeQuery(sql)) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }
}
