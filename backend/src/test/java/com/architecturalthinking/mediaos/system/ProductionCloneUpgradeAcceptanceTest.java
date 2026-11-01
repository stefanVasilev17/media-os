package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ProductionCloneUpgradeAcceptanceTest {
    private static final String CI_URL = "jdbc:postgresql://127.0.0.1:5432/media_os";
    private static final String USER = "media_os";
    private static final String PASSWORD = "media_os";
    private static final String EP001 = "22222222-2222-2222-2222-222222222222";

    @Test
    void migratesOnlyLocalRestoredCopyAndPreservesEp001LocksAndMedia() throws Exception {
        Assumptions.assumeTrue("true".equals(System.getenv("CI_PRODUCTION_CLONE_REHEARSAL")),
                "Production copy acceptance is opt-in and never runs in normal CI");
        String url = System.getenv("CI_PRODUCTION_CLONE_URL");
        assertEquals(CI_URL, url, "Refuse any non-loopback PostgreSQL URL");
        Flyway flyway = Flyway.configure()
                .dataSource(url, USER, PASSWORD)
                .locations("classpath:db/migration")
                .validateMigrationNaming(true)
                .load();
        assertNotNull(flyway.info().current(), "Restored baseline must already exist");
        assertEquals("85", flyway.info().current().getVersion().toString(),
                "Unexpected production Flyway version: stop before migration");

        Map<String, String> before = snapshots(url);
        assertEquals("1", before.get("ep001_count"), "Exactly one protected EP001 is required");

        flyway.migrate();
        flyway.validate();
        assertEquals("105", flyway.info().current().getVersion().toString());
        Map<String, String> after = snapshots(url);
        assertEquals(before, after, "EP001 episode, visuals and approved audio must not be rewritten");

        try (Connection connection = DriverManager.getConnection(url, USER, PASSWORD);
             Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("""
                     select count(*) from flyway_schema_history
                     where version::integer between 86 and 105 and success=true
                     """)) {
            assertTrue(result.next());
            assertEquals(20, result.getInt(1));
        }
    }

    private Map<String, String> snapshots(String url) throws Exception {
        Map<String, String> result = new LinkedHashMap<>();
        try (Connection connection = DriverManager.getConnection(url, USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            result.put("ep001_count", scalar(statement, """
                    select count(*)::text from episode
                    where id='22222222-2222-2222-2222-222222222222'
                      and episode_number='EP001'
                    """));
            result.put("episode", scalar(statement, """
                    select md5(to_jsonb(e)::text) from episode e
                    where id='22222222-2222-2222-2222-222222222222'
                    """));
            result.put("studio_shot", scalar(statement, """
                    select coalesce(md5(string_agg(md5(to_jsonb(s)::text), ','
                              order by md5(to_jsonb(s)::text))), 'EMPTY')
                    from studio_shot s
                    where episode_id='22222222-2222-2222-2222-222222222222'
                    """));
            result.put("studio_clip", scalar(statement, """
                    select coalesce(md5(string_agg(md5(to_jsonb(c)::text), ','
                              order by md5(to_jsonb(c)::text))), 'EMPTY')
                    from studio_clip c join studio_shot s on s.id=c.shot_id
                    where s.episode_id='22222222-2222-2222-2222-222222222222'
                    """));
            result.put("studio_clip_revision_history", scalar(statement, """
                    select coalesce(md5(string_agg(md5(to_jsonb(h)::text), ','
                              order by md5(to_jsonb(h)::text))), 'EMPTY')
                    from studio_clip_revision_history h
                    join studio_clip c on c.id=h.clip_id
                    join studio_shot s on s.id=c.shot_id
                    where s.episode_id='22222222-2222-2222-2222-222222222222'
                    """));
            result.put("studio_visual_revision_history", scalar(statement, """
                    select coalesce(md5(string_agg(md5(to_jsonb(h)::text), ','
                              order by md5(to_jsonb(h)::text))), 'EMPTY')
                    from studio_visual_revision_history h
                    join studio_shot s on s.id=h.shot_id
                    where s.episode_id='22222222-2222-2222-2222-222222222222'
                    """));
        }
        return result;
    }

    private String scalar(Statement statement, String sql) throws Exception {
        try (ResultSet result = statement.executeQuery(sql)) {
            assertTrue(result.next());
            String value = result.getString(1);
            assertFalse(result.next());
            return value;
        }
    }
}
