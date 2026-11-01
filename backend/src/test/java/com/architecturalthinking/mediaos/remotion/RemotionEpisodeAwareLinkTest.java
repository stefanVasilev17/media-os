package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class RemotionEpisodeAwareLinkTest {
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void completionLinksOnlyItsOwnEpisodeAndNeverTheOtherEpisode() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Temporary PostgreSQL is required.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();

        var jdbc = JdbcClient.create(new DriverManagerDataSource(url, "media_os", "media_os"));
        UUID episodeA = UUID.randomUUID();
        UUID episodeB = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID otherRender = UUID.randomUUID();
        UUID rejectedRender = UUID.randomUUID();
        UUID technicalRender = UUID.randomUUID();
        String shot = "SHOT_CI_01";
        var controller = new RemotionCpuWorkerController(
                jdbc, new ObjectMapper(), mock(StorageHealthService.class), "ci-only-worker-key");

        createEpisode(jdbc, episodeA);
        createEpisode(jdbc, episodeB);
        try {
            createShot(jdbc, episodeA, shot, 2);
            createShot(jdbc, episodeA, shot, 3);
            createShot(jdbc, episodeB, shot, 2);

            createRender(jdbc, render, episodeA, "SUCCEEDED",
                    "{\"shotKey\":\"SHOT_CI_01\",\"scriptRevision\":2,\"generationRevision\":7}");
            controller.linkVoiceWorkflowRender(render);

            assertEquals(render, linkedRender(jdbc, episodeA, shot, 2));
            assertNull(linkedRender(jdbc, episodeB, shot, 2),
                    "Another episode with the same shot and revision must never be linked.");
            assertNull(linkedRender(jdbc, episodeA, shot, 3),
                    "Other script revisions must not be linked.");

            createRender(jdbc, otherRender, null, "SUCCEEDED",
                    "{\"shotKey\":\"SHOT_CI_01\",\"scriptRevision\":2}");
            controller.linkVoiceWorkflowRender(otherRender);
            assertEquals(render, linkedRender(jdbc, episodeA, shot, 2),
                    "Render without a stored episode must not overwrite an existing link.");

            createRender(jdbc, rejectedRender, episodeB, "FAILED",
                    "{\"shotKey\":\"SHOT_CI_01\",\"scriptRevision\":2}");
            controller.linkVoiceWorkflowRender(rejectedRender);
            assertNull(linkedRender(jdbc, episodeB, shot, 2),
                    "Only successfully completed renders are eligible for linking.");

            createRender(jdbc, technicalRender, episodeB, "SUCCEEDED",
                    "{\"shotKey\":\"SHOT_CI_01\",\"scriptRevision\":2,\"technicalRerender\":true}");
            controller.linkVoiceWorkflowRender(technicalRender);
            assertNull(linkedRender(jdbc, episodeB, shot, 2),
                    "Technical-only renders must not change Shot/Voice workflow state.");

            int generation = jdbc.sql("""
                    select rendered_generation_revision
                    from voice_shot_workflow
                    where episode_id=:episode and script_revision=2 and shot_key=:shot
                    """).param("episode", episodeA).param("shot", shot)
                    .query(Integer.class).single();
            assertEquals(7, generation);
        } finally {
            jdbc.sql("delete from voice_shot_workflow where episode_id in (:a,:b)")
                    .param("a", episodeA).param("b", episodeB).update();
            jdbc.sql("delete from remotion_render where id in (:r1,:r2,:r3,:r4)")
                    .param("r1", render).param("r2", otherRender)
                    .param("r3", rejectedRender).param("r4", technicalRender).update();
            jdbc.sql("delete from episode where id in (:a,:b)")
                    .param("a", episodeA).param("b", episodeB).update();
        }
    }

    private void createEpisode(JdbcClient jdbc, UUID id) {
        jdbc.sql("""
                insert into episode(id, project_id, episode_number, title, current_stage, status)
                values (:id,:project,:number,'Disposable CI episode','QA','DRAFT')
                """).param("id", id).param("project", PROJECT_ID)
                .param("number", "CI-" + id.toString().substring(0, 18)).update();
    }

    private void createShot(JdbcClient jdbc, UUID episode, String shot, int revision) {
        jdbc.sql("""
                insert into voice_shot_workflow(
                    id,episode_id,script_revision,shot_key,shot_title,
                    start_second,end_second,narration)
                values (:id,:episode,:revision,:shot,'Disposable shot',0,5,'CI only')
                """)
                .param("id", UUID.randomUUID()).param("episode", episode)
                .param("revision", revision).param("shot", shot).update();
    }

    private void createRender(JdbcClient jdbc, UUID id, UUID episode,
                              String status, String props) {
        jdbc.sql("""
                insert into remotion_render(
                    id,project_id,episode_id,composition_id,render_key,
                    engine_version,input_props,render_hash,profile,status,
                    width,height,fps,duration_in_frames)
                values (
                    :id,:project,:episode,'CI-ONLY','CI-RENDER',
                    'CI',cast(:props as jsonb),:hash,'REVIEW',:status,
                    1920,1080,30,150)
                """)
                .param("id", id).param("project", PROJECT_ID)
                .param("episode", episode).param("props", props)
                .param("hash", id.toString()).param("status", status).update();
    }

    private UUID linkedRender(JdbcClient jdbc, UUID episode, String shot, int revision) {
        return jdbc.sql("""
                select remotion_render_id from voice_shot_workflow
                where episode_id=:episode and shot_key=:shot and script_revision=:revision
                """).param("episode", episode).param("shot", shot)
                .param("revision", revision)
                .query((rs, row) -> java.util.Optional.ofNullable(
                        rs.getObject("remotion_render_id", UUID.class)))
                .single()
                .orElse(null);
    }
}
