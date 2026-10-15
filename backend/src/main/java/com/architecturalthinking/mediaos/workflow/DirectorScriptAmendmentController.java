package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
public class DirectorScriptAmendmentController {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;

    public DirectorScriptAmendmentController(JdbcClient jdbc, ObjectMapper mapper, ProductionOverviewService overview) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.overview = overview;
    }

    @Transactional
    @PostMapping("/api/v1/locked-script/director-amendment")
    public Map<String, Object> apply(@Valid @RequestBody LockedScriptImportController.LockedScriptImport request) {
        if (!LockedScriptImportController.SCHEMA_VERSION.equals(request.schemaVersion())) {
            throw conflict("Wrong script format.");
        }
        if (!"FULLY_LOCKED".equalsIgnoreCase(request.status())) {
            throw conflict("Only a Director-approved FULLY_LOCKED revision is allowed.");
        }
        Map<String, Object> episode = overview.episode();
        if (!norm(request.episodeNumber()).equals(norm(String.valueOf(episode.get("episodeNumber"))))
                || !norm(request.title()).equals(norm(String.valueOf(episode.get("title"))))) {
            throw conflict("The file belongs to a different episode.");
        }

        Map<String, Object> current = jdbc.sql("""
                select current_revision, status, artifact::text
                from production_stage where episode_id=:episodeId and stage_key='SCRIPT' for update
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, row) -> {
                    Map<String, Object> found = new LinkedHashMap<>();
                    found.put("revision", rs.getInt("current_revision"));
                    found.put("status", rs.getString("status"));
                    found.put("artifact", read(rs.getString("artifact")));
                    return found;
                }).single();

        if (!"LOCKED".equals(current.get("status"))) {
            throw conflict("The original script must remain LOCKED.");
        }
        int revision = ((Number) current.get("revision")).intValue();
        String previousPayload = jdbc.sql("""
                select payload::text from episode_script_director_amendment
                where episode_id=:episodeId and script_revision=:revision
                for update
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query(String.class)
                .optional().orElse(null);
        @SuppressWarnings("unchecked")
        Map<String, Object> base = (Map<String, Object>) current.get("artifact");
        List<Map<String, Object>> before = rows(base.get("timeline"));
        List<LockedScriptImportController.TimelineBlock> after = request.timeline();
        List<LockedScriptImportController.TimelineBlock> approvedShot = scopedApprovedShot05(before, after);
        String requestedVersion = approvedNarrationVersion(approvedShot);
        String previousVersion = previousPayload == null ? null : approvedNarrationVersionFromArtifact(read(previousPayload));
        if (previousVersion != null && !previousVersion.equals(requestedVersion)
                && !("V1".equals(previousVersion) && "V2".equals(requestedVersion))
                && !("V2".equals(previousVersion) && "V3".equals(requestedVersion))) {
            throw conflict("Only the approved SHOT 05 v1 → v2 → v3 progression is allowed.");
        }
        boolean upgradingV1ToV2 = "V1".equals(previousVersion) && "V2".equals(requestedVersion);
        if (previousPayload == null) {
            long downstreamVisualLocks = jdbc.sql("""
                    select count(*) from visual_shot_lock
                    where episode_id=:episodeId and script_revision=:revision
                      and shot_key not in ('SHOT 01','SHOT 02','SHOT 03','SHOT 04')
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                    .query(Long.class).single();
            if (downstreamVisualLocks > 0) {
                throw conflict("A later shot is already Director LOCKED; a larger migration is required.");
            }
            long downstreamApprovedVoice = jdbc.sql("""
                    select count(*) from voice_clip_workflow
                    where episode_id=:episodeId and script_revision=:revision
                      and (
                        shot_key not in ('SHOT 01','SHOT 02','SHOT 03','SHOT 04','SHOT 05')
                        or (shot_key='SHOT 05' and clip_key in ('SHOT 05-C01','SHOT 05-C07'))
                      )
                      and voice_approved_at is not null
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                    .query(Long.class).single();
            if (downstreamApprovedVoice > 0) {
                throw conflict("An affected voice clip or a later shot has approved audio. Versioned replacement is unsafe.");
            }
            long shot05AggregateApproval = jdbc.sql("""
                    select count(*) from voice_shot_workflow
                    where episode_id=:episodeId and script_revision=:revision
                      and shot_key='SHOT 05' and voice_approved_at is not null
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                    .query(Long.class).single();
            if (shot05AggregateApproval > 0) {
                throw conflict("SHOT 05 aggregate voice is approved. Review the voice approval before upgrading.");
            }

        } else if (upgradingV1ToV2 || ("V2".equals(previousVersion) && "V3".equals(requestedVersion))) {
            long shot05DirectorLocks = jdbc.sql("""
                    select count(*) from visual_shot_lock
                    where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                    """).param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", revision).query(Long.class).single();
            if (shot05DirectorLocks > 0) {
                throw conflict("SHOT 05 video is Director LOCKED. Its voice/video must not be altered.");
            }
            if (upgradingV1ToV2) {
                archiveAndResetV1Shot05Voice(revision, approvedShot);
            } else {
                archiveAndResetV2Shot05C01(revision, approvedShot.get(0));
            }
        }
        int originalStart = number(grouped(before).get("SHOT 05").get(0).get("startSecond"));
        int suppliedStart = approvedShot.get(0).startSecond();
        int effectiveTarget = number(base.get("targetDurationSeconds")) + 50;

        Map<String, List<Map<String, Object>>> oldByShot = grouped(before);
        Map<String, Object> amended = new LinkedHashMap<>(base);
        List<Map<String, Object>> effectiveTimeline = new ArrayList<>();
        for (int shotIndex = 1; shotIndex <= 16; shotIndex++) {
            String shotKey = shot(shotIndex);
            if (shotIndex == 5) {
                for (var block : approvedShot) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("sectionId", block.sectionId());
                    row.put("sectionTitle", block.sectionTitle());
                    row.put("shotKey", shotKey);
                    row.put("startSecond", originalStart + block.startSecond() - suppliedStart);
                    row.put("endSecond", originalStart + block.endSecond() - suppliedStart);
                    row.put("narration", block.narration());
                    row.put("voiceDirection", block.voiceDirection());
                    row.put("purpose", "Director-approved SHOT 05 amendment; Concept First, Term Second.");
                    row.put("newValueEvent", false);
                    row.put("newValueSummary", "");
                    row.put("microTension", false);
                    row.put("cognitiveRelief", false);
                    row.put("listPassage", false);
                    row.put("ahaMoment", false);
                    row.put("reelCandidate", false);
                    row.put("handoffNotes", "Approved SHOT 05 voice; preserve existing SHOT 01–04.");
                    effectiveTimeline.add(row);
                }
            } else {
                for (Map<String, Object> original : oldByShot.getOrDefault(shotKey, List.of())) {
                    Map<String, Object> copy = new LinkedHashMap<>(original);
                    if (shotIndex > 5) {
                        copy.put("startSecond", number(original.get("startSecond")) + 50);
                        copy.put("endSecond", number(original.get("endSecond")) + 50);
                    }
                    effectiveTimeline.add(copy);
                }
            }
        }
        amended.put("timeline", effectiveTimeline);
        amended.put("targetDurationSeconds", effectiveTarget);
        amended.put("directorAmendment", "SHOT 05 | Concept First, Term Second | +50s downstream planning clock");
        String json = write(amended);
        if (previousPayload == null) {
            jdbc.sql("""
                    insert into episode_script_director_amendment(id,episode_id,script_revision,payload)
                    values(:id,:episodeId,:revision,cast(:payload as jsonb))
                    """)
                    .param("id", UUID.randomUUID())
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", revision)
                    .param("payload", json)
                    .update();
        } else if (!previousVersion.equals(requestedVersion)) {
            snapshotAmendment(revision, previousVersion, previousPayload);
            jdbc.sql("""
                    update episode_script_director_amendment
                    set payload=cast(:payload as jsonb)
                    where episode_id=:episodeId and script_revision=:revision
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", revision)
                    .param("payload", json)
                    .update();
        }
        snapshotAmendment(revision, requestedVersion, json);

        return Map.of(
                "ready", true,
                "scriptRevision", revision,
                "amendmentVersion", requestedVersion,
                "targetDurationSeconds", effectiveTarget,
                "effectiveShot05StartSecond", originalStart,
                "effectiveShot05EndSecond", originalStart + 130,
                "timelineBlocks", effectiveTimeline.size(),
                "preservedDirectorLockedShots", List.of("SHOT 01", "SHOT 02", "SHOT 03", "SHOT 04"),
                "message", "Director SHOT 05 amendment accepted. Import SHOT 05 HEAR/SEE next."
        );
    }

    public Map<String, Object> effectiveArtifact(int revision, Map<String, Object> original) {
        return jdbc.sql("""
                select payload::text from episode_script_director_amendment
                where episode_id=:episodeId and script_revision=:revision
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query(String.class)
                .optional()
                .map(this::read)
                .orElse(original);
    }

    private static final String APPROVED_NARRATION_SHA256 =
            "a7d4ddce77e70013b8a9ab384bc2baba5f80440f4a5d911dd0799c34355e58d8";
    private static final String APPROVED_STORYTELLING_V2_SHA256 =
            "003ee78105dd0f331a0cd0784374b38e4a4d3778141f784ad072f2944b253d3c";
    private static final String APPROVED_GATEWAY_FIRST_V3_SHA256 =
            "ad757b71e1d2ca418a09f83c81581cf49699220b0c94b8d246a74848c51bc16a";

    static List<LockedScriptImportController.TimelineBlock> scopedApprovedShot05(
            List<Map<String, Object>> canonical,
            List<LockedScriptImportController.TimelineBlock> supplied
    ) {
        Map<String, List<Map<String, Object>>> oldByShot = grouped(canonical);
        List<Map<String, Object>> original = oldByShot.getOrDefault("SHOT 05", List.of());
        if (original.isEmpty() || original.get(0).get("startSecond") == null) {
            throw conflict("The current LOCKED Script has no SHOT 05. Import stopped.");
        }
        int start = number(original.get(0).get("startSecond"));
        int end = number(original.get(original.size() - 1).get("endSecond"));
        if (end - start != 80) {
            throw conflict("Current SHOT 05 is " + (end-start) + " seconds, expected 80. Review required.");
        }
        List<LockedScriptImportController.TimelineBlock> shot = supplied.stream()
                .filter(x -> "SHOT 05".equals(x.shotKey())).toList();
        if (shot.size() != 7) {
            throw conflict("The approved SHOT 05 must contain exactly seven voice blocks.");
        }
        int cursor = shot.get(0).startSecond();
        int origin = cursor;
        StringBuilder narration = new StringBuilder();
        for (int i = 0; i < shot.size(); i++) {
            var block = shot.get(i);
            if (block.startSecond() != cursor || block.endSecond() <= cursor
                    || block.narration() == null || block.narration().isBlank()) {
                throw conflict("SHOT 05 contains a gap, overlap, or empty narration at clip " + (i+1) + ".");
            }
            cursor = block.endSecond();
            if (i > 0) narration.append('\n');
            narration.append(block.narration());
        }
        if (cursor - origin != 130) {
            throw conflict("The seven approved SHOT 05 blocks must total 130 seconds.");
        }
        try {
            byte[] checksum = MessageDigest.getInstance("SHA-256")
                    .digest(narration.toString().getBytes(StandardCharsets.UTF_8));
            String hash = HexFormat.of().formatHex(checksum);
            if (!APPROVED_NARRATION_SHA256.equals(hash) && !APPROVED_STORYTELLING_V2_SHA256.equals(hash)
                    && !APPROVED_GATEWAY_FIRST_V3_SHA256.equals(hash)) {
                throw conflict("SHOT 05 text does not match an approved immutable narration revision.");
            }
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
        return shot;
    }

    private void archiveAndResetV1Shot05Voice(
            int revision,
            List<LockedScriptImportController.TimelineBlock> newShot
    ) {
        String oldC01 = "When you press Login, your request reaches the first stop on the server side. Here, a few rules are checked before the password. This stop is called the API Gateway.";
        String oldC07 = "Those were examples of what can go wrong. Our real request passes every check. Next, the load balancer picks a healthy server.";

        long customized = jdbc.sql("""
                select count(*) from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                  and clip_key in ('SHOT 05-C01','SHOT 05-C07')
                  and coalesce(director_narration_override,narration) not in (:oldC01,:oldC07)
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("oldC01", oldC01).param("oldC07", oldC07)
                .query(Long.class).single();
        if (customized > 0) {
            throw conflict("SHOT 05 C01/C07 has a separate Director override. Refusing to replace customized approved voice.");
        }

        jdbc.sql("""
                insert into episode_shot05_voice_revision_archive(
                    id,episode_id,script_revision,source_version,record_type,record_key,snapshot,audio
                )
                select gen_random_uuid(),c.episode_id,c.script_revision,'V1','CLIP',c.clip_key,
                       to_jsonb(c)-'generated_audio',c.generated_audio
                from voice_clip_workflow c
                where c.episode_id=:episodeId and c.script_revision=:revision and c.shot_key='SHOT 05'
                on conflict (episode_id,script_revision,source_version,record_type,record_key) do nothing
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();

        jdbc.sql("""
                insert into episode_shot05_voice_revision_archive(
                    id,episode_id,script_revision,source_version,record_type,record_key,
                    snapshot,audio,remotion_render_id
                )
                select gen_random_uuid(),v.episode_id,v.script_revision,'V1','SHOT',v.shot_key,
                       to_jsonb(v)-'generated_audio',v.generated_audio,v.remotion_render_id
                from voice_shot_workflow v
                where v.episode_id=:episodeId and v.script_revision=:revision and v.shot_key='SHOT 05'
                on conflict (episode_id,script_revision,source_version,record_type,record_key) do nothing
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();

        for (int i : new int[]{0, 6}) {
            var clip = newShot.get(i);
            jdbc.sql("""
                    update voice_clip_workflow
                    set narration=:narration,voice_direction=:voiceDirection,
                        director_narration_override=null,
                        generated_audio=null,generated_audio_content_type=null,
                        generated_audio_file_name=null,generated_alignment=null,
                        voice_generated_at=null,voice_approved_at=null,
                        updated_at=now()
                    where episode_id=:episodeId and script_revision=:revision
                      and clip_key=:clipKey and shot_key='SHOT 05'
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", revision)
                    .param("clipKey", "SHOT 05-C0" + (i + 1))
                    .param("narration", clip.narration())
                    .param("voiceDirection", clip.voiceDirection()).update();
        }

        jdbc.sql("""
                update voice_shot_workflow
                set voice_approved_at=null,recorded_at=null,alignment=null,aligned_at=null,
                    generated_audio=null,generated_alignment=null,voice_generated_at=null,
                    visual_sync_spec=null,visual_sync_markdown=null,visual_sync_ready_at=null,
                    remotion_synced_at=null,remotion_render_id=null,
                    rendered_generation_revision=null,rendered_at=null,updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();
    }

    private void archiveAndResetV2Shot05C01(
            int revision,
            LockedScriptImportController.TimelineBlock approvedC01
    ) {
        String existingV2C01 = "Now we know where the request is going. Follow it to the server. Before the password is checked, the request meets its first server-side checkpoint: the API Gateway.";
        long unexpectedNarration = jdbc.sql("""
                select count(*) from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                  and clip_key='SHOT 05-C01'
                  and coalesce(director_narration_override,narration)<>:expected
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("expected", existingV2C01)
                .query(Long.class).single();
        if (unexpectedNarration > 0) {
            throw conflict("SHOT 05-C01 has a separate Director voice edit. Manual review required.");
        }
        long existingRender = jdbc.sql("""
                select count(*) from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                  and remotion_render_id is not null
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).query(Long.class).single();
        if (existingRender > 0) {
            throw conflict("SHOT 05 has an existing render. Preserve and review the old preview before replacing C01.");
        }
        jdbc.sql("""
                insert into episode_shot05_voice_revision_archive(
                    id,episode_id,script_revision,source_version,record_type,record_key,snapshot,audio
                )
                select gen_random_uuid(),c.episode_id,c.script_revision,'V2','CLIP',c.clip_key,
                       to_jsonb(c)-'generated_audio',c.generated_audio
                from voice_clip_workflow c
                where c.episode_id=:episodeId and c.script_revision=:revision and c.shot_key='SHOT 05'
                  and c.clip_key='SHOT 05-C01'
                on conflict (episode_id,script_revision,source_version,record_type,record_key) do nothing
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();

        jdbc.sql("""
                insert into episode_shot05_voice_revision_archive(
                    id,episode_id,script_revision,source_version,record_type,record_key,
                    snapshot,audio,remotion_render_id
                )
                select gen_random_uuid(),v.episode_id,v.script_revision,'V2','SHOT',v.shot_key,
                       to_jsonb(v)-'generated_audio',v.generated_audio,v.remotion_render_id
                from voice_shot_workflow v
                where v.episode_id=:episodeId and v.script_revision=:revision and v.shot_key='SHOT 05'
                on conflict (episode_id,script_revision,source_version,record_type,record_key) do nothing
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();

        jdbc.sql("""
                update voice_clip_workflow
                set narration=:narration,voice_direction=:voiceDirection,
                    director_narration_override=null,
                    generated_audio=null,generated_audio_content_type=null,generated_audio_file_name=null,
                    generated_alignment=null,voice_generated_at=null,voice_approved_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:revision
                  and shot_key='SHOT 05' and clip_key='SHOT 05-C01'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("narration", approvedC01.narration())
                .param("voiceDirection", approvedC01.voiceDirection()).update();

        jdbc.sql("""
                update voice_shot_workflow
                set voice_approved_at=null,recorded_at=null,alignment=null,aligned_at=null,
                    visual_sync_spec=null,visual_sync_markdown=null,visual_sync_ready_at=null,
                    remotion_synced_at=null,remotion_render_id=null,
                    rendered_generation_revision=null,rendered_at=null,updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key='SHOT 05'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision).update();
    }

    private static String approvedNarrationVersion(List<LockedScriptImportController.TimelineBlock> blocks) {
        StringBuilder text = new StringBuilder();
        for (var block : blocks) {
            if (!text.isEmpty()) text.append('\n');
            text.append(block.narration());
        }
        return approvedNarrationVersionForText(text.toString());
    }

    private static String approvedNarrationVersionFromArtifact(Map<String, Object> artifact) {
        StringBuilder text = new StringBuilder();
        for (Map<String, Object> block : groupedFromArtifact(artifact).getOrDefault("SHOT 05", List.of())) {
            if (!text.isEmpty()) text.append('\n');
            text.append(String.valueOf(block.get("narration")));
        }
        return approvedNarrationVersionForText(text.toString());
    }

    private static Map<String, List<Map<String, Object>>> groupedFromArtifact(Map<String, Object> artifact) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        if (artifact.get("timeline") instanceof List<?> rows) {
            for (Object item : rows) {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    m.forEach((key, value) -> row.put(String.valueOf(key), value));
                    timeline.add(row);
                }
            }
        }
        return grouped(timeline);
    }

    private static String approvedNarrationVersionForText(String text) {
        try {
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(text.getBytes(StandardCharsets.UTF_8)));
            if (APPROVED_NARRATION_SHA256.equals(hash)) return "V1";
            if (APPROVED_STORYTELLING_V2_SHA256.equals(hash)) return "V2";
            if (APPROVED_GATEWAY_FIRST_V3_SHA256.equals(hash)) return "V3";
            throw conflict("Active SHOT 05 amendment differs from both Director-approved versions. Manual review required.");
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is unavailable.", error);
        }
    }

    private void snapshotAmendment(int revision, String version, String payload) {
        jdbc.sql("""
                insert into episode_script_director_amendment_history(
                    id,episode_id,script_revision,amendment_version,payload
                ) values (
                    :id,:episodeId,:revision,:version,cast(:payload as jsonb)
                )
                on conflict (episode_id,script_revision,amendment_version) do nothing
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("version", version)
                .param("payload", payload)
                .update();
    }

    static void validate(
            List<Map<String, Object>> before,
            List<LockedScriptImportController.TimelineBlock> after,
            int newTarget,
            int oldTarget
    ) {
        if (newTarget != oldTarget + 50) throw conflict("SHOT 05 revision must add exactly 50 seconds.");
        Map<String, List<Map<String, Object>>> oldByShot = grouped(before);
        Map<String, List<LockedScriptImportController.TimelineBlock>> newByShot = new LinkedHashMap<>();
        int cursor = 0;
        for (var block : after) {
            if (block.startSecond() != cursor || block.endSecond() <= cursor) {
                throw conflict("The amended script must be contiguous and ordered.");
            }
            if (!block.shotKey().matches("SHOT (0[1-9]|1[0-6])")) {
                throw conflict("Unknown SHOT identifier.");
            }
            cursor = block.endSecond();
            newByShot.computeIfAbsent(block.shotKey(), key -> new ArrayList<>()).add(block);
        }
        if (cursor != newTarget) throw conflict("The new script does not end at the target time.");

        for (int index = 1; index <= 16; index++) {
            String key = shot(index);
            var oldBlocks = oldByShot.getOrDefault(key, List.of());
            var newBlocks = newByShot.getOrDefault(key, List.of());
            if (oldBlocks.isEmpty() || newBlocks.isEmpty()) throw conflict("Missing " + key + " in the script.");
            if (index == 5) {
                int oldStart = number(oldBlocks.get(0).get("startSecond"));
                int oldEnd = number(oldBlocks.get(oldBlocks.size() - 1).get("endSecond"));
                if (newBlocks.get(0).startSecond() != oldStart
                        || newBlocks.get(newBlocks.size() - 1).endSecond() != oldEnd + 50
                        || newBlocks.size() != 7) {
                    throw conflict("SHOT 05 must have the seven approved voice blocks and +50 seconds.");
                }
                continue;
            }
            if (oldBlocks.size() != newBlocks.size()) {
                throw conflict(key + " changed its narration block count.");
            }
            for (int j = 0; j < oldBlocks.size(); j++) {
                var old = oldBlocks.get(j);
                var next = newBlocks.get(j);
                int delta = index < 5 ? 0 : 50;
                if (next.startSecond() != number(old.get("startSecond")) + delta
                        || next.endSecond() != number(old.get("endSecond")) + delta
                        || !norm(next.narration()).equals(norm(String.valueOf(old.get("narration"))))) {
                    throw conflict(key + " must keep its original narration and only the approved clock shift.");
                }
            }
        }
    }

    private static Map<String, List<Map<String, Object>>> grouped(List<Map<String, Object>> rows) {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        for (var row : rows) {
            result.computeIfAbsent(String.valueOf(row.get("shotKey")), x -> new ArrayList<>()).add(row);
        }
        return result;
    }

    private static String shot(int i) { return String.format(Locale.ROOT, "SHOT %02d", i); }
    private static int number(Object value) { return value instanceof Number n ? n.intValue() : 0; }
    private static String norm(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT); }
    private static ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }

    private List<Map<String, Object>> rows(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof Map<?, ?> map) {
                Map<String, Object> converted = new LinkedHashMap<>();
                map.forEach((key, item) -> converted.put(String.valueOf(key), item));
                result.add(converted);
            }
        }
        return result;
    }

    private Map<String, Object> read(String json) {
        try { return mapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception ex) { throw new IllegalStateException("Invalid saved script amendment.", ex); }
    }

    private String write(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (Exception ex) { throw new IllegalStateException("Could not store script amendment.", ex); }
    }
}
