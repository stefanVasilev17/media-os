package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ProductionUpgradeV85ToV105Test {
    private static final String USER = "media_os";
    private static final String PASSWORD = "media_os";
    private static final UUID EP001 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test
    void upgradesExistingEp001LockedFixtureWithoutRewritingIt() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null
                && url.matches("jdbc:postgresql://(?:127\\.0\\.0\\.1|localhost):[0-9]+/media_os(?:\\?.*)?"),
                "This rehearsal is restricted to local disposable CI PostgreSQL only");

        String schema = "ci_upgrade_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        try (Connection admin = DriverManager.getConnection(url, USER, PASSWORD);
             Statement statement = admin.createStatement()) {
            statement.execute("create schema " + schema);
        }

        try {
            Flyway baseline = Flyway.configure()
                    .dataSource(url, USER, PASSWORD)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .validateMigrationNaming(true)
                    .target(MigrationVersion.fromVersion("85"))
                    .load();
            baseline.migrate();
            assertEquals("85", baseline.info().current().getVersion().toString());

            UUID shotId = UUID.randomUUID();
            UUID clipId = UUID.randomUUID();
            byte[] audio = "disposable-ep001-lock-audio".getBytes(StandardCharsets.UTF_8);
            String originalEpisode;
            Timestamp lockedAt;
            Timestamp approvedAt;

            try (Connection db = DriverManager.getConnection(url, USER, PASSWORD)) {
                db.setSchema(schema);
                try (Statement statement = db.createStatement();
                     ResultSet result = statement.executeQuery(
                             "select row_to_json(episode)::text from episode where id='22222222-2222-2222-2222-222222222222'")) {
                    assertTrue(result.next());
                    originalEpisode = result.getString(1);
                    assertFalse(result.next());
                }

                try (PreparedStatement statement = db.prepareStatement("""
                        insert into studio_shot(id, episode_id, shot_number, title, visual_prompt)
                        values (?, ?, 999, 'CI-only locked fixture', 'DO NOT TOUCH')
                        """)) {
                    statement.setObject(1, shotId);
                    statement.setObject(2, EP001);
                    assertEquals(1, statement.executeUpdate());
                }
                try (PreparedStatement statement = db.prepareStatement("""
                        insert into studio_clip
                          (id, shot_id, sequence, narration, voice_direction,
                           locked_at, generated_audio, generated_at, approved_at)
                        values (?, ?, 1, 'CI-only approved EP001 narration', 'calm',
                                now(), ?, now(), now())
                        """)) {
                    statement.setObject(1, clipId);
                    statement.setObject(2, shotId);
                    statement.setBytes(3, audio);
                    assertEquals(1, statement.executeUpdate());
                }
                try (PreparedStatement statement = db.prepareStatement(
                        "select locked_at, approved_at from studio_clip where id=?")) {
                    statement.setObject(1, clipId);
                    try (ResultSet result = statement.executeQuery()) {
                        assertTrue(result.next());
                        lockedAt = result.getTimestamp(1);
                        approvedAt = result.getTimestamp(2);
                    }
                }
            }

            Flyway upgrade = Flyway.configure()
                    .dataSource(url, USER, PASSWORD)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .validateMigrationNaming(true)
                    .load();
            upgrade.migrate();
            upgrade.validate();
            assertTrue(Integer.parseInt(upgrade.info().current().getVersion().toString()) >= 106,
                    "Original V106 ledger and protected EP001 migration guarantees must survive later additive migrations.");

            try (Connection db = DriverManager.getConnection(url, USER, PASSWORD)) {
                db.setSchema(schema);
                try (Statement statement = db.createStatement();
                     ResultSet result = statement.executeQuery(
                             "select row_to_json(episode)::text from episode where id='22222222-2222-2222-2222-222222222222'")) {
                    assertTrue(result.next());
                    assertEquals(originalEpisode, result.getString(1),
                            "Existing EP001 episode fields must not change");
                    assertFalse(result.next());
                }
                try (PreparedStatement statement = db.prepareStatement("""
                        select narration, voice_direction, locked_at, approved_at, generated_audio
                        from studio_clip where id=?
                        """)) {
                    statement.setObject(1, clipId);
                    try (ResultSet result = statement.executeQuery()) {
                        assertTrue(result.next());
                        assertEquals("CI-only approved EP001 narration", result.getString(1));
                        assertEquals("calm", result.getString(2));
                        assertEquals(lockedAt, result.getTimestamp(3));
                        assertEquals(approvedAt, result.getTimestamp(4));
                        assertArrayEquals(audio, result.getBytes(5));
                        assertFalse(result.next());
                    }
                }
                try (Statement statement = db.createStatement();
                     ResultSet result = statement.executeQuery("""
                        select count(*) from flyway_schema_history
                        where version::integer between 86 and 106 and success=true
                        """)) {
                    assertTrue(result.next());
                    assertEquals(21, result.getInt(1));
                }
            }
        } finally {
            try (Connection admin = DriverManager.getConnection(url, USER, PASSWORD);
                 Statement statement = admin.createStatement()) {
                statement.execute("drop schema " + schema + " cascade");
            }
        }
    }
}
