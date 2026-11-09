package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class Ep002EpisodeBatchPlanService {
    static final String EPISODE = "EP002";
    static final String VERSION = "EPISODE_BATCH_PLAN_V1";
    static final String PREPARED = "PREPARED_NOT_EXECUTING";
    static final String VISUAL_SHA = Ep002ProductionContractService.VISUAL_SHA;

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final JsonNode scripts;
    private final JsonNode visuals;
    private final JsonNode recoveryVisuals;

    record Script(int revision, String narration) {}
    record Voice(UUID takeId, BigDecimal measuredSeconds, boolean hasAlignment) {}

    public record ShotPlan(
            String shotKey, String title, int beatCount, int editorialSeconds,
            int scriptRevision, String narrationSha256, String visualSourceSha,
            String preferredTakeId, BigDecimal measuredVoiceSeconds, String voiceStatus,
            String action, String renderStatus, boolean directorVisualLocked,
            String visualGoal
    ) {}

    public record BatchWave(String phase, String operation, boolean executionAvailable,
                            boolean paidOperation, String gate) {}

    public record Plan(
            String schemaVersion, String episodeKey, String title, String inputFingerprint,
            int shotCount, int visualBeatCount, int editorialSeconds,
            int scenesToPrepare, int protectedScenes, int preferredVoiceCount,
            int missingPreferredVoiceCount, int reusableRenders,
            String state, List<ShotPlan> shots, List<BatchWave> waves
    ) {}

    public record StoredPlan(UUID planId, UUID requestId, String status,
                             String inputFingerprint, Plan manifest, String createdAt,
                             @com.fasterxml.jackson.annotation.JsonIgnore String directorIssuer,
                             @com.fasterxml.jackson.annotation.JsonIgnore String directorSubject) {}

    public Ep002EpisodeBatchPlanService(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        try {
            this.scripts = mapper.readTree(
                    new ClassPathResource(Ep002RecoverySource.SCRIPT_PATH).getInputStream());
            this.visuals = mapper.readTree(
                    new ClassPathResource("episode-production/ep002-approved-visual-source.json").getInputStream());
        } catch (IOException ex) {
            throw new IllegalStateException("EP002 approved batch sources cannot be loaded.", ex);
        }
        this.recoveryVisuals=Ep002RecoverySource.load(mapper,Ep002RecoverySource.VISUAL_PATH);
        Ep002RecoverySource.verify(scripts,visuals,recoveryVisuals);
        if (!"EP002".equals(scripts.path("episodeKey").asText())
                || !"EP002".equals(visuals.path("episodeKey").asText())
                || !"DIRECTOR_LOCKED".equals(scripts.path("directorFullScriptStatus").asText())
                || scripts.path("shotCount").asInt() != 11
                || visuals.path("shotCount").asInt() != 11
                || visuals.path("beatCount").asInt() != 59
                || !VISUAL_SHA.equals(visuals.path("gitBlobSha").asText())) {
            throw new IllegalStateException("EP002 batch source integrity check failed.");
        }
    }

    public Plan preview() {
        DirectorIdentity.requireDirector();
        return snapshot();
    }

    Plan snapshot() {
        List<ShotPlan> shots = new ArrayList<>();
        int beats = 0;
        int editorial = 0;
        int voiceReady = 0;
        int reusable = 0;

        for (int index = 0; index < 11; index++) {
            JsonNode source = scripts.path("shots").path(index);
            JsonNode visual = Ep002RecoverySource.visual(visuals,recoveryVisuals,index);
            String key = String.format(java.util.Locale.ROOT, "SHOT%02d", index + 1);
            if (!key.equals(source.path("shotKey").asText())
                    || !key.equals(visual.path("shotKey").asText())) {
                throw new IllegalStateException("Approved EP002 batch shot keys do not agree: " + key);
            }
            int count = visual.path("beats").size();
            if (count < 1) throw new IllegalStateException("Missing approved beats: " + key);
            beats += count;
            int seconds = source.path("editorialDurationSeconds").asInt();
            if (seconds <= 0) throw new IllegalStateException("Invalid editorial duration: " + key);
            editorial += seconds;
            Script script = currentScript(key, source.path("englishNarration").asText());
            Voice voice = currentVoice(key, script.revision());
            String narrationHash = Ep002ProductionContractService.sha256(script.narration());
            String preferred = voice == null ? null : voice.takeId().toString();
            if (preferred != null) voiceReady++;

            boolean protectedVisual = "SHOT01".equals(key);
            boolean hasRender = protectedVisual && voice != null
                    && hasReusableShot01Render(key, script.revision(), narrationHash, voice);
            if (hasRender) reusable++;
            String voiceState = voice == null ? "PREFERRED_VOICE_REQUIRED"
                    : voice.measuredSeconds() == null ? "VOICE_DURATION_REQUIRED"
                    : protectedVisual && voice.hasAlignment() ? "VOICE_MEASURED_WITH_SHOT01_CUES"
                    : voice.hasAlignment() ? "VOICE_MEASURED_ALIGNMENT_NEEDS_SHOT_MAPPING"
                    : "VOICE_MEASURED_CUES_NOT_VERIFIED";

            shots.add(new ShotPlan(
                    key, source.path("title").asText(), count, seconds,
                    script.revision(), narrationHash, VISUAL_SHA,
                    preferred, voice == null ? null : voice.measuredSeconds(), voiceState,
                    protectedVisual ? "PRESERVE_DIRECTOR_LOCKED_SCENE" : "BATCH_SCENE_CODE_CANDIDATE",
                    protectedVisual ? (hasRender ? "REUSABLE_SUCCESSFUL_PREVIEW" : "LOCKED_SOURCE_RENDER_NOT_VERIFIED")
                            : "NO_REGISTERED_BATCH_RENDERER",
                    protectedVisual, visual.path("visualGoal").asText()
            ));
        }

        if (beats != 59 || editorial != scripts.path("editorialTotalDurationSeconds").asInt()) {
            throw new IllegalStateException("EP002 batch totals differ from the approved original.");
        }

        StringBuilder materials = new StringBuilder();
        materials.append(VERSION).append('|').append(EPISODE).append('|')
                .append(VISUAL_SHA).append('|').append(editorial).append('|').append(beats);
        for (ShotPlan shot : shots) {
            materials.append('|').append(shot.shotKey())
                    .append('|').append(shot.scriptRevision())
                    .append('|').append(shot.narrationSha256())
                    .append('|').append(shot.preferredTakeId() == null ? "NONE" : shot.preferredTakeId())
                    .append('|').append(shot.measuredVoiceSeconds() == null ? "UNKNOWN" : shot.measuredVoiceSeconds())
                    .append('|').append(shot.action());
        }

        return new Plan(
                VERSION, EPISODE, scripts.path("title").asText(),
                Ep002ProductionContractService.sha256(materials.toString()),
                11, beats, editorial, 10, 1, voiceReady, 11 - voiceReady, reusable,
                "READ_ONLY_PLAN_NO_EXECUTION",
                List.copyOf(shots),
                List.of(
                        new BatchWave("01", "PROTECT_SHOT01_AND_REUSE_EXISTING_COMPONENTS", false, false,
                                "Director-LOCKED SHOT01 must not be modified."),
                        new BatchWave("02", "PROPOSE_REMOTION_SCENES_FOR_SHOT02_TO_SHOT11", false, false,
                                "Requires future scoped multi-shot agent executor, tests and Director PR review."),
                        new BatchWave("03", "VERIFY_SELECTED_VOICE_AND_AUDIO_CUES", false, false,
                                "Missing voice must be explicitly selected; any paid ElevenLabs action needs separate approval."),
                        new BatchWave("04", "RENDER_ONLY_CHANGED_APPROVED_SHOTS", false, true,
                                "Requires separate Director-approved Railway CPU cost and completed render adapters."),
                        new BatchWave("05", "ASSEMBLE_AND_REVIEW_ENTIRE_EPISODE", false, false,
                                "Requires assembled-master implementation and final Director creative approval.")
                )
        );
    }

    private Script currentScript(String key, String approvedNarration) {
        return jdbc.sql("""
                select revision,narration from ep002_creative_script_revision
                where shot_key=:shot order by revision desc limit 1
                """).param("shot", key)
                .query((rs, n) -> new Script(rs.getInt("revision"), rs.getString("narration")))
                .optional().orElse(new Script(0, approvedNarration));
    }

    private Voice currentVoice(String key, int revision) {
        if (revision < 1) return null;
        return jdbc.sql("""
                select take.id,take.duration_seconds,take.elevenlabs_alignment is not null as has_alignment
                from ep002_creative_voice_choice choice
                join ep002_creative_voice_take take on take.id=choice.take_id
                  and take.shot_key=choice.shot_key and take.revision=choice.revision
                where choice.shot_key=:shot and choice.revision=:revision
                order by choice.selected_at desc,choice.id desc limit 1
                """).param("shot", key).param("revision", revision)
                .query((rs,n) -> new Voice(rs.getObject("id", UUID.class),
                        rs.getBigDecimal("duration_seconds"),rs.getBoolean("has_alignment")))
                .optional().orElse(null);
    }

    private boolean hasReusableShot01Render(String key,int revision,String narrationHash,Voice voice) {
        String dependency = Ep002ProductionContractService.fingerprint(
                EPISODE,key,revision,narrationHash,voice.takeId(),VISUAL_SHA);
        return jdbc.sql("""
                select exists (
                    select 1 from episode_shot_render_lineage lineage
                    join remotion_render render on render.id=lineage.remotion_render_id
                    where lineage.episode_key='EP002' and lineage.shot_key='SHOT01'
                      and lineage.script_revision=:revision
                      and lineage.preferred_take_id=:take
                      and lineage.dependency_sha256=:dependency
                      and render.status='SUCCEEDED'
                      and render.input_props->>'shotKey'='EP002_SHOT01'
                      and render.input_props->>'voiceTakeId'=:takeText
                )
                """).param("revision",revision).param("take",voice.takeId())
                .param("takeText",voice.takeId().toString()).param("dependency",dependency)
                .query(Boolean.class).single();
    }

    @Transactional
    public StoredPlan prepare(UUID requestId, String expectedFingerprint, Boolean confirmNoExecution) {
        DirectorIdentity.Actor actor = DirectorIdentity.requireDirector();
        if (requestId == null || expectedFingerprint == null
                || !expectedFingerprint.matches("[a-f0-9]{64}")
                || !Boolean.TRUE.equals(confirmNoExecution)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Director must confirm a non-executing whole-episode batch plan with its current fingerprint.");
        }

        StoredPlan previous = find(requestId);
        if (previous != null) return matchedReplay(previous, expectedFingerprint, actor);

        Plan plan = snapshot();
        if (!plan.inputFingerprint().equals(expectedFingerprint))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode script or voice selections changed. Refresh the entire batch plan.");

        try {
            jdbc.sql("""
                    insert into ep002_episode_batch_plan(
                        id,episode_key,request_id,input_fingerprint,manifest,status,
                        director_issuer,director_subject
                    ) values(
                        :id,'EP002',:request,:fingerprint,cast(:manifest as jsonb),
                        'PREPARED_NOT_EXECUTING',:issuer,:subject
                    ) on conflict (request_id) do nothing
                    """)
                    .param("id",UUID.randomUUID()).param("request",requestId)
                    .param("fingerprint",plan.inputFingerprint())
                    .param("manifest",mapper.writeValueAsString(plan))
                    .param("issuer",actor.issuer()).param("subject",actor.subject())
                    .update();
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalStateException("Cannot serialize verified batch plan.", ex);
        }

        StoredPlan saved = find(requestId);
        if (saved == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Batch plan could not be stored.");
        return matchedReplay(saved,expectedFingerprint,actor);
    }

    static StoredPlan matchedReplay(StoredPlan stored,String expectedFingerprint,
                                    DirectorIdentity.Actor actor) {
        if (!stored.inputFingerprint().equals(expectedFingerprint)
                || !stored.directorIssuer().equals(actor.issuer())
                || !stored.directorSubject().equals(actor.subject()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This batch request ID belongs to another plan or Director.");
        return stored;
    }

    public Map<String,Object> latest() {
        DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select id,request_id,status,input_fingerprint,manifest::text,created_at::text,
                       director_issuer,director_subject
                from ep002_episode_batch_plan where episode_key='EP002'
                order by created_at desc,id desc limit 1
                """).query((rs,n)->Map.<String,Object>of("status",rs.getString("status"),
                        "plan",mapStored(rs))).optional()
                .orElse(Map.of("status","NOT_PREPARED"));
    }

    private StoredPlan find(UUID requestId) {
        return jdbc.sql("""
                select id,request_id,status,input_fingerprint,manifest::text,created_at::text,
                       director_issuer,director_subject
                from ep002_episode_batch_plan where request_id=:request
                """).param("request",requestId)
                .query((rs,n)->mapStored(rs)).optional().orElse(null);
    }

    private StoredPlan mapStored(java.sql.ResultSet rs) throws java.sql.SQLException {
        try {
            return new StoredPlan(rs.getObject("id",UUID.class),
                    rs.getObject("request_id",UUID.class),rs.getString("status"),
                    rs.getString("input_fingerprint"),
                    mapper.readValue(rs.getString("manifest"),Plan.class),
                    rs.getString("created_at"),
                    rs.getString("director_issuer"),rs.getString("director_subject"));
        } catch (IOException ex) {
            throw new java.sql.SQLException("Stored batch plan could not be parsed.",ex);
        }
    }
}
