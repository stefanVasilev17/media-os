package com.architecturalthinking.mediaos.workflow;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(
        named="CI_POSTGRES_URL",
        matches="jdbc:postgresql://(localhost|127\\.0\\.0\\.1):5432/media_os")
class Ep002VisualDirectorFeedbackV121MigrationTest {
    @Test
    void isolatedPostgresCreatesAppendOnlyEp002VisualFeedbackTable() {
        String url=System.getenv("CI_POSTGRES_URL");
        Flyway flyway=Flyway.configure()
                .dataSource(url,"media_os","media_os")
                .locations("classpath:db/migration").load();
        flyway.migrate();
        JdbcClient jdbc=JdbcClient.create(
                new DriverManagerDataSource(url,"media_os","media_os"));
        Boolean applied=jdbc.sql("""
                select exists(select 1 from flyway_schema_history
                              where version='121' and success=true)
                """).query(Boolean.class).single();
        assertTrue(Boolean.TRUE.equals(applied),"EP002 review migration must be applied.");
        String table=jdbc.sql("select to_regclass('public.ep002_visual_director_feedback')::text")
                .query(String.class).single();
        assertEquals("ep002_visual_director_feedback",table);
        Long count=jdbc.sql("""
                select count(*) from information_schema.columns
                 where table_schema='public'
                   and table_name='ep002_visual_director_feedback'
                   and column_name in ('request_id','shot_key','episode_input_fingerprint',
                                       'script_revision','narration_sha256','selected_take_id',
                                       'problem_observed','requested_correction',
                                       'director_issuer','director_subject','preflight_audit_id')
                """).query(Long.class).single();
        assertEquals(11L,count);
        Boolean acceptedMigration=jdbc.sql("""
                select exists(select 1 from flyway_schema_history
                              where version='122' and success=true)
                """).query(Boolean.class).single();
        assertTrue(Boolean.TRUE.equals(acceptedMigration),
                "EP002 evidence-bound acceptance schema must be applied.");
        String approvals=jdbc.sql(
                "select to_regclass('public.ep002_visual_shot_acceptance')::text")
                .query(String.class).single();
        assertEquals("ep002_visual_shot_acceptance",approvals);
        Boolean codexAutomationApplied=jdbc.sql("""
                select exists(select 1 from flyway_schema_history
                              where version='123' and success=true)
                """).query(Boolean.class).single();
        assertTrue(Boolean.TRUE.equals(codexAutomationApplied),
                "Persistent Codex automation queue migration V123 must apply.");
        for(String name: new String[]{"ep002_codex_automation",
                                     "ep002_codex_automation_task"}) {
            String actual=jdbc.sql("select to_regclass(:table)::text")
                    .param("table","public."+name).query(String.class).single();
            assertEquals(name,actual);
        }
        flyway.validate();
    }
}
