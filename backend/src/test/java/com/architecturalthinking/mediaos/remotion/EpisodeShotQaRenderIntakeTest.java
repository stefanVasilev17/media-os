package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.system.LocalDirectorPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class EpisodeShotQaRenderIntakeTest {
    private static final UUID PROJECT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SHOT = "SHOT 01";
    private JdbcClient jdbc;
    private UUID episode;
    private UUID voiceTake;
    private final UUID actor = UUID.randomUUID();

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        if (jdbc == null || episode == null) return;
        jdbc.sql("delete from episode_workspace_event where episode_id=:episode")
                .param("episode", episode).update();
        jdbc.sql("delete from remotion_render where episode_id=:episode")
                .param("episode", episode).update();
        jdbc.sql("delete from episode_revision_voice_take where episode_id=:episode")
                .param("episode", episode).update();
        jdbc.sql("delete from episode_shot_revision where episode_id=:episode")
                .param("episode", episode).update();
        jdbc.sql("delete from production_stage where episode_id=:episode")
                .param("episode", episode).update();
        jdbc.sql("delete from episode where id=:episode")
                .param("episode", episode).update();
    }

    @Test
    void lockedNewEpisodeWithApprovedVoiceQueuesOneAuditedReviewOnlyRender() {
        bootstrap();
        seedLockedEpisode();
        login();

        var controller = controller(true, true, true);
        var approval = request();
        var first = controller.queue(episode, SHOT, approval);
        var second = controller.queue(episode, SHOT, approval);

        UUID renderId = (UUID) first.get("renderId");
        assertEquals("QUEUED", first.get("status"));
        assertEquals(renderId, second.get("renderId"), "Identical approved render must be idempotent.");
        assertEquals(true, first.get("qaOnly"));
        assertEquals(1, jdbc.sql("""
                select count(*) from remotion_render
                where episode_id=:episode and composition_id='AT-EpisodeShot-QA'
                """).param("episode", episode).query(Integer.class).single());
        assertEquals(1, jdbc.sql("""
                select count(*) from episode_workspace_event
                where episode_id=:episode and event_type='REMOTION_QA_RENDER_QUEUED'
                  and actor_issuer='urn:mediaos:local' and actor_subject=:actor
                """).param("episode", episode).param("actor", actor.toString())
                .query(Integer.class).single());
        String payload = jdbc.sql("""
                select input_props::text from remotion_render where id=:render
                """).param("render", renderId).query(String.class).single();
        assertTrue(payload.contains(episode.toString()));
        assertTrue(payload.contains(voiceTake.toString()));
        assertTrue(payload.contains("Architectural flow to be reviewed"));
        assertFalse(payload.contains("EP001"));
    }

    @Test
    void noDirectorOrNoExplicitFlagsCanEverQueue() {
        bootstrap();
        seedLockedEpisode();
        var off = controller(false, true, true);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> off.queue(episode, SHOT, request())).getStatusCode());

        var noWrites = controller(true, false, true);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> noWrites.queue(episode, SHOT, request())).getStatusCode());

        var noLocal = controller(true, true, false);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> noLocal.queue(episode, SHOT, request())).getStatusCode());

        var enabled = controller(true, true, true);
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> enabled.queue(episode, SHOT, request())).getStatusCode());

        assertEquals(0, jdbc.sql("select count(*) from remotion_render where episode_id=:episode")
                .param("episode", episode).query(Integer.class).single());
    }

    @Test
    void legacyEp001IsRejectedBeforeAnyDatabaseMutation() {
        bootstrap();
        login();
        var controller = controller(true, true, true);
        UUID legacyId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> controller.queue(legacyId, SHOT, request())).getStatusCode());
        assertEquals(0, jdbc.sql("""
                select count(*) from remotion_render
                where project_id=:project and episode_id=:episode
                  and composition_id='AT-EpisodeShot-QA'
                """).param("project", PROJECT).param("episode", legacyId)
                .query(Integer.class).single());
    }

    @Test
    void lockedScriptSceneShotAndVoiceAreAllRequired() {
        bootstrap();
        seedLockedEpisode();
        login();
        var controller = controller(true, true, true);

        jdbc.sql("update production_stage set status='DRAFT' where episode_id=:episode and stage_key='SCENE'")
                .param("episode", episode).update();
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> controller.queue(episode, SHOT, request())).getStatusCode());
        jdbc.sql("update production_stage set status='LOCKED' where episode_id=:episode and stage_key='SCENE'")
                .param("episode", episode).update();

        jdbc.sql("update production_stage set current_revision=3 where episode_id=:episode and stage_key='SCRIPT'")
                .param("episode", episode).update();
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> controller.queue(episode, SHOT, request())).getStatusCode());
        jdbc.sql("update production_stage set current_revision=2 where episode_id=:episode and stage_key='SCRIPT'")
                .param("episode", episode).update();

        jdbc.sql("update episode_revision_voice_take set approved_at=null where id=:id")
                .param("id", voiceTake).update();
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> controller.queue(episode, SHOT, request())).getStatusCode());
        jdbc.sql("update episode_revision_voice_take set approved_at=now() where id=:id")
                .param("id", voiceTake).update();

        jdbc.sql("update episode_shot_revision set status='DRAFT' where episode_id=:episode")
                .param("episode", episode).update();
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> controller.queue(episode, SHOT, request())).getStatusCode());

        assertEquals(0, jdbc.sql("select count(*) from remotion_render where episode_id=:episode")
                .param("episode", episode).query(Integer.class).single());
    }

    private void bootstrap() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Disposable PostgreSQL only.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        jdbc = JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        episode = UUID.randomUUID();
        voiceTake = UUID.randomUUID();
    }

    private void seedLockedEpisode() {
        jdbc.sql("""
                insert into episode (id, project_id, episode_number, title, current_stage, status)
                values (:id,:project,:number,'Disposable QA render episode','VISUAL','DRAFT')
                """).param("id", episode).param("project", PROJECT)
                .param("number", "EP" + (100 + new java.security.SecureRandom().nextInt(800)))
                .update();
        stage("SCRIPT", 20, 2);
        stage("SCENE", 30, 1);
        jdbc.sql("""
                insert into episode_shot_revision(
                    id,episode_id,shot_key,revision,based_on_script_revision,
                    is_current,status,narration,voice_direction,visual_direction,
                    change_summary,locked_at,director_note)
                values (:id,:episode,:shot,1,2,true,'LOCKED','QA-only narration','',
                    'Architectural flow to be reviewed','QA preview',now(),'Approved for isolated QA')
                """)
                .param("id", UUID.randomUUID()).param("episode", episode).param("shot", SHOT).update();
        jdbc.sql("""
                insert into episode_revision_voice_take(
                    id,episode_id,shot_key,shot_revision,take_number,
                    audio,content_type,file_name,approved_at)
                values (:id,:episode,:shot,1,1,:audio,'audio/wav','qa-only.wav',now())
                """).param("id", voiceTake).param("episode", episode).param("shot", SHOT)
                .param("audio", new byte[]{1,2,3}).update();
    }

    private void stage(String key, int order, int revision) {
        jdbc.sql("""
                insert into production_stage(
                    id,episode_id,stage_key,display_name,sequence_no,status,
                    current_revision,locked_at)
                values (:id,:episode,:stage,:stage,:seq,'LOCKED',:revision,now())
                """)
                .param("id", UUID.randomUUID()).param("episode", episode)
                .param("stage", key).param("seq", order).param("revision", revision).update();
    }

    private void login() {
        var auth = new UsernamePasswordAuthenticationToken(
                new LocalDirectorPrincipal(actor, "qa-only"), null,
                List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private EpisodeShotQaRenderController controller(boolean enabled, boolean writes, boolean local) {
        return new EpisodeShotQaRenderController(
                jdbc, new ObjectMapper(), mock(StorageHealthService.class),
                enabled, writes, local);
    }

    private EpisodeShotQaRenderController.PreviewRequest request() {
        return new EpisodeShotQaRenderController.PreviewRequest(
                1, "DIRECTOR_APPROVE_QA_PREVIEW",
                "Explicit approval for disposable visual QA only.", 150);
    }
}
