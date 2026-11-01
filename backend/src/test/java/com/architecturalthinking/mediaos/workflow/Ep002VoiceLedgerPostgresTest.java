package com.architecturalthinking.mediaos.workflow;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class Ep002VoiceLedgerPostgresTest {
    private static final String URL = "jdbc:postgresql://127.0.0.1:5432/media_os";
    private static final UUID EP001_FIXTURE = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test
    void unresolvedRequestsAreUniqueAcrossInstancesAndUncertainOnesCannotBeRetried() throws Exception {
        Assumptions.assumeTrue(URL.equals(System.getenv("CI_POSTGRES_URL")),
                "Never run ledger integration test against production PostgreSQL");

        String schema = "ci_voice_ledger_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        try (Connection connection = DriverManager.getConnection(URL, "media_os", "media_os");
             Statement statement = connection.createStatement()) {
            statement.execute("create schema " + schema);
        }
        try {
            String isolatedUrl = URL + "?currentSchema=" + schema;
            Flyway flyway = Flyway.configure()
                    .dataSource(isolatedUrl, "media_os", "media_os")
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .validateMigrationNaming(true)
                    .load();
            flyway.migrate();
            flyway.validate();
            assertEquals("106", flyway.info().current().getVersion().toString());

            UUID first = UUID.randomUUID();
            UUID second = UUID.randomUUID();
            UUID third = UUID.randomUUID();
            try (Connection connection = DriverManager.getConnection(isolatedUrl, "media_os", "media_os")) {
                insert(connection, first, "SHOT 01");
                SQLException simultaneous = assertThrows(SQLException.class,
                        () -> insert(connection, second, "SHOT 01"));
                assertEquals("23505", simultaneous.getSQLState(),
                        "The database, not an in-process lock, blocks duplicate paid requests.");
                insert(connection, third, "SHOT 02");
                try (Statement sql = connection.createStatement()) {
                    assertEquals(1, sql.executeUpdate("""
                            update ep002_voice_generation_ledger
                            set status='COMPLETED',completed_at=now()
                            where request_id='""" + first + "'"));
                }
                insert(connection, second, "SHOT 01");
                try (Statement sql = connection.createStatement()) {
                    assertEquals(1, sql.executeUpdate("""
                            update ep002_voice_generation_ledger
                            set status='UNCERTAIN' where request_id='""" + second + "'"));
                }
                SQLException unresolved = assertThrows(SQLException.class,
                        () -> insert(connection, UUID.randomUUID(), "SHOT 01"));
                assertEquals("23505", unresolved.getSQLState());
                SQLException replay = assertThrows(SQLException.class,
                        () -> insert(connection, first, "SHOT 03"));
                assertEquals("23505", replay.getSQLState(),
                        "Request IDs cannot be reused even when a prior take succeeded.");
            }
        } finally {
            try (Connection connection = DriverManager.getConnection(URL, "media_os", "media_os");
                 Statement statement = connection.createStatement()) {
                statement.execute("drop schema " + schema + " cascade");
            }
        }
    }

    private void insert(Connection connection, UUID id, String shot) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                insert into ep002_voice_generation_ledger
                    (request_id,episode_id,shot_key,revision,narration_sha256,
                     actor_issuer,actor_subject,status)
                values (?,?,?,0,?,'urn:mediaos:local','ci-actor','IN_FLIGHT')
                """)) {
            statement.setObject(1, id);
            statement.setObject(2, EP001_FIXTURE);
            statement.setString(3, shot);
            statement.setString(4, "a".repeat(64));
            statement.executeUpdate();
        }
    }
}
