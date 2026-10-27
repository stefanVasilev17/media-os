package com.architecturalthinking.mediaos.remotion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class RemotionRenderRetentionService {

    private static final Logger log = LoggerFactory.getLogger(RemotionRenderRetentionService.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DIRECTOR_LOCKED_EP001_SHOT01_TO_09_MASTER_ID = UUID.fromString("fd1046d0-6b20-4267-8135-8b67add2ca33");
    private static final UUID DIRECTOR_LOCKED_EP001_SHOT10_PRESENTATION_V8_ID = UUID.fromString("7e55c59a-3102-4d4c-b23e-96c68ad1f286");
    private static final UUID DIRECTOR_LOCKED_EP001_SHOT11_PRESENTATION_V5_ID = UUID.fromString("3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0");
    private static final UUID DIRECTOR_LOCKED_EP001_SHOT12_RECAP_V5_ID = UUID.fromString("5d8c7db2-b34e-4781-af1a-2aa236691ea5");
    private static final UUID EP001_PROVISIONAL_AUDIO_MASTER_REVIEW_ID = UUID.fromString("e03c87c6-3f68-40cb-adba-24020bca28af");
    private static final UUID EP001_AUDIO_HEADROOM_QA_REVIEW_ID = UUID.fromString("96699a27-7615-4ce1-a092-53cdf1e9d1af");
    private static final UUID EP001_SOUND_DESIGN_V1_REVIEW_ID = UUID.fromString("904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8");
    private static final int MAX_DELETIONS_PER_RUN = 200;
    private static final int BATCH_SIZE = 8;

    private final JdbcClient jdbc;
    private volatile boolean pausedForStorageExhaustion;

    public RemotionRenderRetentionService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    private void logStorageFootprint() {
        try {
            jdbc.sql("""
                    select pg_database_size(current_database()) as database_bytes,
                           pg_total_relation_size('remotion_render') as remotion_bytes,
                           pg_total_relation_size('spline_shot_render') as spline_bytes,
                           pg_total_relation_size('voice_clip_workflow') as voice_clip_bytes
                    """)
                    .query((rs, index) -> {
                        log.info("MediaOS storage: postgres={} MB; Remotion={} MB; legacy Spline={} MB; voice clips={} MB. These are allocated database sizes, not remaining volume space.",
                                rs.getLong("database_bytes") / 1048576,
                                rs.getLong("remotion_bytes") / 1048576,
                                rs.getLong("spline_bytes") / 1048576,
                                rs.getLong("voice_clip_bytes") / 1048576);
                        return 1;
                    }).single();
        } catch (Exception error) {
            log.warn("MediaOS storage metrics unavailable: {}", error.getMessage());
        }
    }

    private record Candidate(UUID id, long sizeBytes) {}

    @Scheduled(
            initialDelayString = "${mediaos.render.retention.initial-delay-ms:20000}",
            fixedDelayString = "${mediaos.render.retention.interval-ms:60000}"
    )
    public void pruneObsoleteRenderVersions() {
        if (pausedForStorageExhaustion) return;
        logStorageFootprint();
        long reclaimedVideoBytes = 0;
        int removed = 0;

        try {
            while (removed < MAX_DELETIONS_PER_RUN) {
                List<Candidate> candidates = jdbc.sql("""
                        select r.id, coalesce(r.size_bytes, 0) as size_bytes
                        from remotion_render r
                        where r.project_id=:projectId
                          and r.status='SUCCEEDED'
                          and r.video_data is not null
                          and r.id <> :directorLockedCumulativeMasterId
                          and r.id <> :directorLockedShot10MasterId
                          and r.id <> :directorLockedShot11MasterId
                          and r.id <> :directorLockedShot12MasterId
                          and r.id <> :provisionalEpisodeAudioReviewId
                          and r.id <> :audioHeadroomReviewId
                          and r.id <> :soundDesignV1ReviewId
                          and not exists (
                            select 1 from visual_shot_lock l where l.render_id=r.id
                          )
                          and not exists (
                            select 1 from voice_shot_workflow v where v.remotion_render_id=r.id
                          )
                          and not exists (
                            select 1 from episode_shot05_voice_revision_archive archive
                            where archive.remotion_render_id=r.id
                          )
                          and not exists (
                            select 1 from remotion_render running
                            where running.project_id=r.project_id
                              and running.status in ('QUEUED', 'RUNNING')
                              and running.input_props::text like ('%' || r.id::text || '%')
                          )
                          and exists (
                            select 1 from remotion_render newer
                            where newer.project_id=r.project_id
                              and newer.episode_id is not distinct from r.episode_id
                              and newer.composition_id=r.composition_id
                              and newer.status='SUCCEEDED'
                              and newer.video_data is not null
                              and (
                                r.composition_id='EP001-Voice-CurrentPreview'
                                or (
                                    newer.input_props->>'shotKey'=r.input_props->>'shotKey'
                                    and exists (
                                      select 1 from visual_shot_lock approved
                                      where approved.render_id=newer.id
                                    )
                                  )
                              )
                              and (
                                newer.created_at > r.created_at
                                or (newer.created_at=r.created_at and newer.id > r.id)
                              )
                          )
                        order by r.created_at, r.id
                        limit :batchSize
                        """)
                        .param("projectId", PROJECT_ID)
                        .param("directorLockedCumulativeMasterId", DIRECTOR_LOCKED_EP001_SHOT01_TO_09_MASTER_ID)
                        .param("directorLockedShot10MasterId", DIRECTOR_LOCKED_EP001_SHOT10_PRESENTATION_V8_ID)
                        .param("directorLockedShot11MasterId", DIRECTOR_LOCKED_EP001_SHOT11_PRESENTATION_V5_ID)
                        .param("directorLockedShot12MasterId", DIRECTOR_LOCKED_EP001_SHOT12_RECAP_V5_ID)
                        .param("provisionalEpisodeAudioReviewId", EP001_PROVISIONAL_AUDIO_MASTER_REVIEW_ID)
                        .param("audioHeadroomReviewId", EP001_AUDIO_HEADROOM_QA_REVIEW_ID)
                        .param("soundDesignV1ReviewId", EP001_SOUND_DESIGN_V1_REVIEW_ID)
                        .param("batchSize", Math.min(BATCH_SIZE, MAX_DELETIONS_PER_RUN - removed))
                        .query((rs, index) -> new Candidate(
                                rs.getObject("id", UUID.class), rs.getLong("size_bytes")
                        ))
                        .list();

                if (candidates.isEmpty()) break;
                for (Candidate candidate : candidates) {
                    int affected = jdbc.sql("""
                            update remotion_render r
                            set video_data=null, size_bytes=null, updated_at=now()
                            where r.id=:id
                              and r.project_id=:projectId
                              and r.status='SUCCEEDED'
                              and r.video_data is not null
                              and r.id <> :directorLockedCumulativeMasterId
                              and r.id <> :directorLockedShot10MasterId
                          and r.id <> :directorLockedShot11MasterId
                          and r.id <> :directorLockedShot12MasterId
                          and r.id <> :provisionalEpisodeAudioReviewId
                          and r.id <> :audioHeadroomReviewId
                          and r.id <> :soundDesignV1ReviewId
                              and not exists (
                                select 1 from visual_shot_lock l where l.render_id=r.id
                              )
                              and not exists (
                                select 1 from voice_shot_workflow v where v.remotion_render_id=r.id
                              )
                              and not exists (
                                select 1 from episode_shot05_voice_revision_archive archive
                                where archive.remotion_render_id=r.id
                              )
                              and not exists (
                                select 1 from remotion_render running
                                where running.project_id=r.project_id
                                  and running.status in ('QUEUED', 'RUNNING')
                                  and running.input_props::text like ('%' || r.id::text || '%')
                              )
                              and exists (
                                select 1 from remotion_render newer
                                where newer.project_id=r.project_id
                                  and newer.episode_id is not distinct from r.episode_id
                                  and newer.composition_id=r.composition_id
                                  and newer.status='SUCCEEDED'
                                  and newer.video_data is not null
                                  and (
                                    r.composition_id='EP001-Voice-CurrentPreview'
                                    or (
                                    newer.input_props->>'shotKey'=r.input_props->>'shotKey'
                                    and exists (
                                      select 1 from visual_shot_lock approved
                                      where approved.render_id=newer.id
                                    )
                                  )
                                  )
                                  and (
                                    newer.created_at > r.created_at
                                    or (newer.created_at=r.created_at and newer.id > r.id)
                                  )
                              )
                            """)
                            .param("id", candidate.id())
                            .param("projectId", PROJECT_ID)
                            .param("directorLockedCumulativeMasterId", DIRECTOR_LOCKED_EP001_SHOT01_TO_09_MASTER_ID)
                        .param("directorLockedShot10MasterId", DIRECTOR_LOCKED_EP001_SHOT10_PRESENTATION_V8_ID)
                        .param("directorLockedShot11MasterId", DIRECTOR_LOCKED_EP001_SHOT11_PRESENTATION_V5_ID)
                        .param("directorLockedShot12MasterId", DIRECTOR_LOCKED_EP001_SHOT12_RECAP_V5_ID)
                        .param("provisionalEpisodeAudioReviewId", EP001_PROVISIONAL_AUDIO_MASTER_REVIEW_ID)
                        .param("audioHeadroomReviewId", EP001_AUDIO_HEADROOM_QA_REVIEW_ID)
                        .param("soundDesignV1ReviewId", EP001_SOUND_DESIGN_V1_REVIEW_ID)
                            .update();
                    if (affected > 0) {
                        removed++;
                        reclaimedVideoBytes += candidate.sizeBytes();
                    }
                }
            }
            if (removed > 0) {
                log.info("Remotion retention released {} obsolete MP4 payloads ({} source bytes). Render metadata and QA history were preserved; Director LOCKED and current shot videos remain protected.",
                        removed, reclaimedVideoBytes);
            }
        } catch (Exception error) {
            pausedForStorageExhaustion = true;
            log.error("Automatic render retention paused until the backend is restarted after storage recovery. Preserved all Director-LOCKED assets. Database cleanup must not retry on a full PostgreSQL volume: {}",
                    error.getMessage());
        }
    }
}
