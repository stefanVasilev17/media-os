package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class Ep002FactoryReadinessBridgeService {
    static final String VERSION = "EP002_FACTORY_READINESS_BRIDGE_V1";
    static final String GENERATED_PREFIX = "remotion-engine/src/episodes/ep002/";
    static final String PROTECTED_SHOT01 = GENERATED_PREFIX + "Shot01LoginWaiting.tsx";

    private final JdbcClient jdbc;
    private final Ep002EpisodeBatchPlanService batch;
    private final JsonNode scripts;
    private final JsonNode visuals;
    private final JsonNode recoveryVisuals;

    record WorkingScript(int revision, String narration, String voiceDirection) {}

    public record ShotReadiness(
            String shotKey, String title, int shotIndex, int beatCount,
            int editorialSeconds, String action, boolean directorVisualLocked,
            String existingScenePath, String proposedScenePath,
            int scriptRevision, String narration, String voiceDirection,
            String narrationSha256, String preferredTakeId,
            BigDecimal measuredVoiceSeconds, Integer durationFrames,
            boolean currentVoiceApproved, boolean hearSeeTimingVerified,
            String timingAuthority, String renderStatus,
            JsonNode approvedVisualStory, List<String> blockers,
            JsonNode verifiedCueFrames
    ) {}

    public record Snapshot(
            String schemaVersion, String episodeKey, String scriptVersion,
            String visualPassVersion, String originalVisualGitBlobSha,
            String inputFingerprint, int shotCount, int approvedBeatCount,
            int editorialSeconds, int protectedScenes, int sceneCandidates,
            int selectedVoiceTakes, int measuredVoiceTakes, int verifiedTimedShots,
            boolean sourceVerified, boolean eligibleForCodexCloud,
            boolean canRender, boolean startsPaidOperation,
            List<String> blockers, List<ShotReadiness> shots
    ) {}

    public Ep002FactoryReadinessBridgeService(
            JdbcClient jdbc, Ep002EpisodeBatchPlanService batch, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.batch = batch;
        try (var original = new ClassPathResource(
                    Ep002RecoverySource.SCRIPT_PATH).getInputStream();
             var approved = new ClassPathResource(
                    "episode-production/ep002-approved-visual-source.json").getInputStream()) {
            this.scripts = mapper.readTree(original);
            this.visuals = mapper.readTree(approved);
        } catch (IOException error) {
            throw new IllegalStateException("EP002 factory source cannot be read.", error);
        }
        this.recoveryVisuals=Ep002RecoverySource.load(mapper,Ep002RecoverySource.VISUAL_PATH);
        Ep002RecoverySource.verify(scripts,visuals,recoveryVisuals);
        if (!"EP002".equals(scripts.path("episodeKey").asText())
                || !"DIRECTOR_LOCKED".equals(scripts.path("directorFullScriptStatus").asText())
                || !"v5.0".equals(scripts.path("scriptVersion").asText())
                || !"EP002".equals(visuals.path("episodeKey").asText())
                || !"v1.0".equals(visuals.path("visualPassVersion").asText())
                || !"DIRECTOR_APPROVED_GITHUB".equals(visuals.path("approval").asText())
                || !Ep002ProductionContractService.VISUAL_SHA.equals(
                    visuals.path("gitBlobSha").asText())
                || scripts.path("shotCount").asInt() != 11
                || visuals.path("shotCount").asInt() != 11
                || visuals.path("beatCount").asInt() != 59) {
            throw new IllegalStateException("EP002 approved source integrity check failed.");
        }
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Snapshot preview() {
        DirectorIdentity.requireDirector();
        return snapshot();
    }

    Snapshot snapshot() {
        Ep002EpisodeBatchPlanService.Plan current = batch.snapshot();
        Map<String, WorkingScript> revisions = new HashMap<>();
        Set<String> uncertainRequests = new HashSet<>();
        for (var shot : current.shots()) {
            if (shot.scriptRevision() > 0) {
                WorkingScript revision = jdbc.sql("""
                        select revision,narration,voice_direction
                          from ep002_creative_script_revision
                         where shot_key=:shot and revision=:revision
                        """)
                        .param("shot", shot.shotKey())
                        .param("revision", shot.scriptRevision())
                        .query((rs, n) -> new WorkingScript(
                                rs.getInt("revision"),
                                rs.getString("narration"),
                                rs.getString("voice_direction")))
                        .optional().orElseThrow(() -> stale());
                revisions.put(shot.shotKey(), revision);
            }
            boolean uncertain = Boolean.TRUE.equals(jdbc.sql("""
                    select exists (
                        select 1 from ep002_creative_voice_request
                         where shot_key=:shot and status in ('IN_FLIGHT','UNCERTAIN')
                    )
                    """).param("shot", shot.shotKey())
                    .query(Boolean.class).single());
            if (uncertain) uncertainRequests.add(shot.shotKey());
        }
        return withVerifiedCues(project(current, revisions, uncertainRequests));
    }

    Snapshot project(Ep002EpisodeBatchPlanService.Plan plan,
                     Map<String, WorkingScript> revisions,
                     Set<String> uncertainRequests) {
        if (plan == null || !Ep002EpisodeBatchPlanService.EPISODE.equals(plan.episodeKey())
                || plan.shotCount() != 11 || plan.shots().size() != 11
                || plan.visualBeatCount() != 59 || plan.editorialSeconds() != 810
                || plan.scenesToPrepare() != 10 || plan.protectedScenes() != 1
                || !plan.inputFingerprint().matches("[a-f0-9]{64}")) {
            throw new IllegalStateException("Current EP002 batch plan does not match locked sources.");
        }
        List<ShotReadiness> out = new ArrayList<>();
        int selected = 0;
        int measured = 0;
        int totalBeats = 0;
        for (int i = 0; i < 11; i++) {
            Ep002EpisodeBatchPlanService.ShotPlan shot = plan.shots().get(i);
            String key = String.format(java.util.Locale.ROOT, "SHOT%02d", i + 1);
            JsonNode approvedScript = scripts.path("shots").path(i);
            JsonNode approvedVisual = Ep002RecoverySource.visual(visuals,recoveryVisuals,i);
            int beats = approvedVisual.path("beats").size();
            if (!key.equals(shot.shotKey())
                    || !key.equals(approvedScript.path("shotKey").asText())
                    || !key.equals(approvedVisual.path("shotKey").asText())
                    || shot.beatCount() != beats || beats < 1
                    || shot.editorialSeconds() != approvedScript.path("editorialDurationSeconds").asInt()
                    || !Ep002ProductionContractService.VISUAL_SHA.equals(shot.visualSourceSha())
                    || shot.directorVisualLocked() != (i == 0)
                    || !shot.action().equals(i == 0
                        ? "PRESERVE_DIRECTOR_LOCKED_SCENE" : "BATCH_SCENE_CODE_CANDIDATE")) {
                throw new IllegalStateException("EP002 protected visual/source plan changed: " + key);
            }
            totalBeats += beats;
            WorkingScript current = shot.scriptRevision() == 0
                    ? new WorkingScript(0, approvedScript.path("englishNarration").asText(),
                        approvedScript.path("voiceDirection").asText())
                    : revisions.get(key);
            if (current == null || current.revision() != shot.scriptRevision()
                    || current.narration() == null || current.narration().isBlank()
                    || !Ep002ProductionContractService.sha256(current.narration())
                        .equals(shot.narrationSha256())) {
                throw stale();
            }
            boolean chosen = shot.preferredTakeId() != null;
            boolean hasDuration = chosen && positiveDuration(shot.measuredVoiceSeconds());
            if (chosen) selected++;
            if (hasDuration) measured++;
            List<String> blockers = new ArrayList<>();
            if (shot.scriptRevision() == 0)
                blockers.add("CURRENT_NARRATION_REVISION_NOT_SAVED_FOR_VOICE");
            if (!chosen) blockers.add("DIRECTOR_SELECTED_TAKE_REQUIRED");
            else if (!hasDuration) blockers.add("MEASURED_AUDIO_DURATION_REQUIRED");
            if (uncertainRequests.contains(key))
                blockers.add("ELEVENLABS_IN_FLIGHT_OR_UNCERTAIN_MUST_BE_RECONCILED");
            // The v1.0 visual beats are editorial descriptions, not measured cue anchors.
            // Even an ElevenLabs alignment blob does not establish 59 verified beat times.
            blockers.add(i == 0 ? "SHOT01_CUE_AND_EXISTING_RENDER_REVIEW_REQUIRED"
                    : "APPROVED_HEAR_SEE_BEATS_NEED_VERIFIED_AUDIO_CUE_MAPPING");
            out.add(new ShotReadiness(key, shot.title(), i + 1, beats,
                    shot.editorialSeconds(), shot.action(), i == 0,
                    i == 0 ? PROTECTED_SHOT01 : null,
                    i == 0 ? null : GENERATED_PREFIX + "Shot"
                        + String.format(java.util.Locale.ROOT, "%02d", i + 1)
                        + "GeneratedScene.tsx",
                    current.revision(), current.narration(), current.voiceDirection(),
                    shot.narrationSha256(), shot.preferredTakeId(),
                    shot.measuredVoiceSeconds(),
                    hasDuration ? shot.measuredVoiceSeconds().multiply(BigDecimal.valueOf(30))
                            .setScale(0, RoundingMode.CEILING).intValueExact() : null,
                    chosen, false, "EDITORIAL_ONLY_NOT_AUDIO_ALIGNED",
                    shot.renderStatus(), approvedVisual.deepCopy(), List.copyOf(blockers), null));
        }
        if (totalBeats != 59) {
            throw new IllegalStateException("EP002 visual beat total differs from approved source.");
        }
        List<String> blockers = new ArrayList<>();
        if (selected < 11) blockers.add("DIRECTOR_SELECTED_TAKES_MISSING");
        if (measured < 11) blockers.add("MEASURED_VOICE_DURATIONS_MISSING");
        if (!uncertainRequests.isEmpty()) blockers.add("UNRESOLVED_PAID_VOICE_REQUESTS");
        blockers.add("REAL_HEAR_SEE_CUE_TIMINGS_NOT_YET_VERIFIED_FOR_ALL_11_SHOTS");
        blockers.add("EP002_FACTORY_CODE_RENDER_AND_SHOT01_REUSE_NOT_YET_CONNECTED");
        return new Snapshot(VERSION, "EP002", "v5.0", "v1.0+RECOVERY",
                Ep002ProductionContractService.VISUAL_SHA, plan.inputFingerprint(),
                11, 59, 810, 1, 10, selected, measured, 0,
                true, false, false, false, List.copyOf(blockers), List.copyOf(out));
    }


    private record ReviewedCue(
            String shotKey,String originalEpisodeFingerprint,
            String takeId,int revision,String narrationSha,
            BigDecimal measuredSeconds,String alignmentSha,String alignmentJson,
            String resolvedJson,String resolvedDigest) {}

    private Snapshot withVerifiedCues(Snapshot base) {
        List<ReviewedCue> records=jdbc.sql("""
                select c.shot_key,c.episode_fingerprint,
                       c.selected_take_id::text as take_id,
                       c.script_revision,c.narration_sha256,
                       c.measured_duration_seconds,c.alignment_sha256,
                       t.elevenlabs_alignment::text as alignment_json,
                       c.resolved_frames_json::text as resolved_json,
                       c.cue_digest_sha256
                  from ep002_director_voice_cue_review c
                  join ep002_creative_voice_take t on t.id=c.selected_take_id
                 where c.episode_key='EP002'
                 order by c.created_at desc
                """)
                .query((rs,n)->new ReviewedCue(rs.getString("shot_key"),
                        rs.getString("episode_fingerprint"),rs.getString("take_id"),rs.getInt("script_revision"),
                        rs.getString("narration_sha256"),
                        rs.getBigDecimal("measured_duration_seconds"),
                        rs.getString("alignment_sha256"),rs.getString("alignment_json"),
                        rs.getString("resolved_json"),rs.getString("cue_digest_sha256")))
                .list();
        Map<String,ReviewedCue> index=new HashMap<>();
        for(ReviewedCue row:records)index.putIfAbsent(
                row.shotKey()+"|"+row.takeId()+"|"+row.revision()+"|"+row.narrationSha(),
                row);

        int verified=0;
        List<ShotReadiness> revised=new ArrayList<>();
        for(ShotReadiness shot:base.shots()) {
            ReviewedCue record=index.get(
                    shot.shotKey()+"|"+shot.preferredTakeId()+"|"+
                    shot.scriptRevision()+"|"+shot.narrationSha256());
            JsonNode frames=null;
            if(record!=null && shot.currentVoiceApproved()
                    && shot.preferredTakeId()!=null
                    && shot.preferredTakeId().equals(record.takeId())
                    && shot.scriptRevision()==record.revision()
                    && shot.narrationSha256().equals(record.narrationSha())
                    && shot.measuredVoiceSeconds()!=null
                    && record.measuredSeconds().compareTo(shot.measuredVoiceSeconds())==0
                    && record.alignmentJson()!=null
                    && record.alignmentSha().equals(
                            Ep002ProductionContractService.sha256(record.alignmentJson()))) {
                try {
                    JsonNode raw=mapperForCues.readTree(record.resolvedJson());
                    if(validCueFrames(raw,shot.beatCount(),shot.durationFrames())) {
                        var type=mapperForCues.getTypeFactory().constructCollectionType(
                                List.class,Ep002VoiceBeatResolver.BeatCue.class);
                        List<Ep002VoiceBeatResolver.BeatCue> decoded=
                                mapperForCues.readValue(record.resolvedJson(),type);
                        String digest=Ep002ProductionContractService.sha256(
                                shot.shotKey()+"|"+record.originalEpisodeFingerprint()+"|"+
                                record.takeId()+"|"+mapperForCues.writeValueAsString(decoded));
                        if(digest.equals(record.resolvedDigest())) frames=raw;
                    }
                }catch(Exception invalid) {
                    frames=null;
                }
            }
            boolean ready=frames!=null;
            if(ready)verified++;
            List<String> blockers=new ArrayList<>(shot.blockers());
            if(ready) {
                blockers.remove("APPROVED_HEAR_SEE_BEATS_NEED_VERIFIED_AUDIO_CUE_MAPPING");
                blockers.remove("SHOT01_CUE_AND_EXISTING_RENDER_REVIEW_REQUIRED");
                if("SHOT01".equals(shot.shotKey()))
                    blockers.add("SHOT01_LOCKED_PREVIEW_REVIEW_REQUIRED");
            }
            revised.add(new ShotReadiness(
                    shot.shotKey(),shot.title(),shot.shotIndex(),shot.beatCount(),
                    shot.editorialSeconds(),shot.action(),shot.directorVisualLocked(),
                    shot.existingScenePath(),shot.proposedScenePath(),
                    shot.scriptRevision(),shot.narration(),shot.voiceDirection(),
                    shot.narrationSha256(),shot.preferredTakeId(),shot.measuredVoiceSeconds(),
                    shot.durationFrames(),shot.currentVoiceApproved(),ready,
                    ready?"DIRECTOR_REVIEWED_ELEVENLABS_CHARACTER_ALIGNMENT":shot.timingAuthority(),
                    shot.renderStatus(),shot.approvedVisualStory(),List.copyOf(blockers),
                    frames));
        }
        List<String> blockers=new ArrayList<>(base.blockers());
        if(verified==11)blockers.remove("REAL_HEAR_SEE_CUE_TIMINGS_NOT_YET_VERIFIED_FOR_ALL_11_SHOTS");
        return new Snapshot(base.schemaVersion(),base.episodeKey(),
                base.scriptVersion(),base.visualPassVersion(),
                base.originalVisualGitBlobSha(),base.inputFingerprint(),
                base.shotCount(),base.approvedBeatCount(),base.editorialSeconds(),
                base.protectedScenes(),base.sceneCandidates(),
                base.selectedVoiceTakes(),base.measuredVoiceTakes(),verified,
                base.sourceVerified(),verified==11&&base.selectedVoiceTakes()==11
                    &&base.measuredVoiceTakes()==11
                    &&!blockers.contains("UNRESOLVED_PAID_VOICE_REQUESTS"),
                base.canRender(),base.startsPaidOperation(),List.copyOf(blockers),
                List.copyOf(revised));
    }

    private final ObjectMapper mapperForCues = new ObjectMapper();

    private static boolean validCueFrames(JsonNode frames,int expected,Integer durationFrames) {
        if(!frames.isArray()||frames.size()!=expected||durationFrames==null)return false;
        int prior=0;
        for(int i=0;i<frames.size();i++){
            JsonNode beat=frames.path(i);
            int start=beat.path("startFrame").asInt(-1);
            int end=beat.path("endFrame").asInt(-1);
            if(beat.path("beatNumber").asInt()!=i+1 || start<prior
                    || end<=start || end>durationFrames
                    || (i>0 && start!=prior))return false;
            prior=end;
        }
        return prior==durationFrames;
    }

    private static boolean positiveDuration(BigDecimal seconds) {
        return seconds != null && seconds.signum() > 0
                && seconds.compareTo(BigDecimal.valueOf(3600)) <= 0;
    }

    private static ResponseStatusException stale() {
        return new ResponseStatusException(HttpStatus.CONFLICT,
                "EP002 narration changed while building the factory bridge. Refresh and review again.");
    }
}
