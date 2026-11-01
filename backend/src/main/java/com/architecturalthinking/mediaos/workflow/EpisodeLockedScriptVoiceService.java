package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodeLockedScriptVoiceService {
    private final JdbcClient jdbc;
    private final ShotRevisionService revisions;
    private final EpisodeWorkspaceService episodes;
    private final ElevenLabsTextToSpeechService elevenLabs;
    private final ObjectMapper mapper;
    private final TransactionTemplate transaction;
    private final Ep002VoiceIdentityGuard identityGuard;

    public EpisodeLockedScriptVoiceService(JdbcClient jdbc, ShotRevisionService revisions,
                                           EpisodeWorkspaceService episodes,
                                           ElevenLabsTextToSpeechService elevenLabs,
                                           ObjectMapper mapper,
                                           PlatformTransactionManager transactionManager,
                                           Ep002VoiceIdentityGuard identityGuard) {
        this.jdbc = jdbc;
        this.revisions = revisions;
        this.episodes = episodes;
        this.elevenLabs = elevenLabs;
        this.mapper = mapper;
        this.transaction = new TransactionTemplate(transactionManager);
        this.identityGuard = identityGuard;
    }

    public record Source(int scriptRevision, String narration, String voiceDirection,
                         String narrationHash) {}

    public static String narrationHash(String narration) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(narration.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is unavailable", error);
        }
    }

    private record SourceInspection(Source source, String blockedReason) {}

    static String readinessBlocker(ShotRevisionService.Context context, boolean visualPlanLocked) {
        if (context.approved() != null)
            return "This shot has an approved revision. Open Voice for the approved revision.";
        if (context.draft() != null)
            return "This shot has an unapproved revision DRAFT. Finish Director review in Revision Chat before generating original-script audio.";
        if (!visualPlanLocked)
            return "The episode-level Visual Plan must be Director-LOCKED before Voice generation.";
        if (context.originalNarration() == null || context.originalNarration().isBlank())
            return "Original locked narration is missing.";
        return null;
    }

    private SourceInspection inspectSource(UUID episodeId, String shotKey) {
        ShotRevisionService.Context context = revisions.context(episodeId, shotKey);
        boolean visualPlanLocked = episodes.stages(episodeId).stream().anyMatch(stage ->
                "SCENE".equals(stage.get("stageKey")) && "LOCKED".equals(stage.get("status")));
        String narration = context.originalNarration() == null ? "" : context.originalNarration();
        Source source = new Source(context.scriptRevision(), narration,
                voiceDirection(episodeId, shotKey), narrationHash(narration));
        return new SourceInspection(source, readinessBlocker(context, visualPlanLocked));
    }

    private Source requireSource(UUID episodeId, String shotKey) {
        SourceInspection inspection = inspectSource(episodeId, shotKey);
        if (inspection.blockedReason() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, inspection.blockedReason());
        return inspection.source();
    }

    private String voiceDirection(UUID episodeId, String shotKey) {
        Object artifact = episodes.stages(episodeId).stream()
                .filter(stage -> "SCRIPT".equals(stage.get("stageKey")))
                .findFirst().map(stage -> stage.get("artifact")).orElse(null);
        if (artifact instanceof Map<?, ?> script && script.get("timeline") instanceof List<?> timeline) {
            for (Object entry : timeline) {
                if (!(entry instanceof Map<?, ?> data)) continue;
                if (!shotKey.equals(EpisodeDirectorOverviewController.shotKey(data.get("shotKey")))) continue;
                Object raw = data.get("voiceDirection");
                if (raw instanceof String text && !text.isBlank()) return text;
            }
        }
        return "calm, conversational, confident";
    }

    public Map<String, Object> state(UUID episodeId, String shotKey) {
        SourceInspection inspection = inspectSource(episodeId, shotKey);
        Source src = inspection.source();
        Ep002VoiceIdentityGuard.Check continuity = identityGuard.inspect(
                String.valueOf(episodes.episode(episodeId).get("episodeNumber")));
        List<Map<String, Object>> takes = jdbc.sql("""
                select id,take_number,content_type,file_name,model_id,voice_id,generated_at,approved_at
                from episode_locked_script_voice_take
                where episode_id=:episode and shot_key=:shot and script_revision=:revision
                  and narration_sha256=:hash
                order by take_number desc
                """)
                .param("episode", episodeId).param("shot", shotKey)
                .param("revision", src.scriptRevision()).param("hash", src.narrationHash())
                .query((rs, n) -> {
                    Map<String, Object> take = new LinkedHashMap<>();
                    take.put("id", rs.getObject("id", UUID.class).toString());
                    take.put("takeNumber", rs.getInt("take_number"));
                    take.put("contentType", rs.getString("content_type"));
                    take.put("fileName", rs.getString("file_name"));
                    take.put("modelId", rs.getString("model_id"));
                    take.put("voiceId", rs.getString("voice_id"));
                    take.put("generatedAt", rs.getObject("generated_at", OffsetDateTime.class).toString());
                    var approved = rs.getObject("approved_at", OffsetDateTime.class);
                    take.put("approvedAt", approved == null ? null : approved.toString());
                    return take;
                }).list();
        boolean approved = takes.stream().anyMatch(item -> item.get("approvedAt") != null);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId.toString());
        result.put("episodeNumber", episodes.episode(episodeId).get("episodeNumber"));
        result.put("shotKey", shotKey);
        result.put("shotRevision", 0);
        result.put("baseScriptRevision", src.scriptRevision());
        result.put("source", "DIRECTOR_LOCKED_ORIGINAL_SCRIPT");
        result.put("narration", src.narration());
        result.put("voiceDirection", src.voiceDirection());
        result.put("blockedReason", inspection.blockedReason() != null
                ? inspection.blockedReason() : continuity.blockedReason());
        result.put("ep001VoiceIdentityVerified", continuity.verified());
        result.put("canGenerate", inspection.blockedReason() == null
                && continuity.verified() && episodes.writesEnabled() && elevenLabs.configured() && !approved);
        result.put("configured", elevenLabs.configured());
        result.put("takes", takes);
        result.put("voiceApproved", approved);
        result.put("voiceModel", elevenLabs.modelId());
        return result;
    }

    public Map<String, Object> generate(UUID episodeId, String shotKey) {
        if (!episodes.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode Voice writes are disabled.");
        Source src = requireSource(episodeId, shotKey);
        identityGuard.requireVerified(String.valueOf(episodes.episode(episodeId).get("episodeNumber")));
        if (!elevenLabs.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ElevenLabs is not configured.");
        if (approved(episodeId, shotKey, src))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Original Voice is already approved.");
        ElevenLabsTextToSpeechService.GenerationResult generated;
        try {
            // The saved narration remains byte-for-byte unchanged; the permitted v4 tone tag
            // is only applied to the outgoing TTS request by the existing ElevenLabs service.
            generated = elevenLabs.generate(shotKey, src.narration(), "", "", Map.of(),
                    ElevenLabsTextToSpeechService.EP001_LOCKED_DELIVERY_TAG);
        } catch (IllegalArgumentException invalid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, invalid.getMessage(), invalid);
        } catch (IllegalStateException failed) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ElevenLabs generation failed.", failed);
        }
        transaction.executeWithoutResult(status -> saveTake(episodeId, shotKey, src, generated));
        return state(episodeId, shotKey);
    }

    private void saveTake(UUID episodeId, String shotKey, Source expected,
                          ElevenLabsTextToSpeechService.GenerationResult audio) {
        jdbc.sql("select id from episode where id=:episode for update")
                .param("episode", episodeId).query(UUID.class).single();
        Source current = requireSource(episodeId, shotKey);
        if (!current.equals(expected) || approved(episodeId, shotKey, expected))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The locked Script or voice approval changed during generation. Stale audio was not stored.");
        int number = jdbc.sql("""
                select coalesce(max(take_number),0)+1 from episode_locked_script_voice_take
                where episode_id=:episode and shot_key=:shot and script_revision=:revision
                """).param("episode", episodeId).param("shot", shotKey)
                .param("revision", expected.scriptRevision()).query(Integer.class).single();
        String extension = "audio/wav".equals(audio.contentType()) ? "wav" : "mp3";
        String episodeNumber = String.valueOf(episodes.episode(episodeId).get("episodeNumber"));
        String filename = episodeNumber + "_" + shotKey.replace(' ', '_')
                + "_script" + expected.scriptRevision() + "_take" + number + "." + extension;
        String alignment;
        try {
            alignment = mapper.writeValueAsString(audio.alignmentResponse());
        } catch (JsonProcessingException problem) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Voice alignment serialization failed.", problem);
        }
        jdbc.sql("""
                insert into episode_locked_script_voice_take
                    (id,episode_id,shot_key,script_revision,narration_sha256,take_number,
                     audio,content_type,file_name,generated_alignment,model_id,voice_id)
                values (:id,:episode,:shot,:script,:hash,:take,:audio,:type,:file,
                        cast(:alignment as jsonb),:model,:voice)
                """)
                .param("id", UUID.randomUUID()).param("episode", episodeId).param("shot", shotKey)
                .param("script", expected.scriptRevision()).param("hash", expected.narrationHash())
                .param("take", number).param("audio", audio.audio())
                .param("type", audio.contentType()).param("file", filename)
                .param("alignment", alignment).param("model", audio.modelId())
                .param("voice", audio.voiceId()).update();
    }

    @Transactional
    public Map<String, Object> approve(UUID episodeId, String shotKey, UUID takeId) {
        if (!episodes.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode Voice writes are disabled.");
        jdbc.sql("select id from episode where id=:episode for update")
                .param("episode", episodeId).query(UUID.class).single();
        Source src = requireSource(episodeId, shotKey);
        if (approved(episodeId, shotKey, src))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Original Voice is already approved.");
        int changed = jdbc.sql("""
                update episode_locked_script_voice_take set approved_at=now()
                where id=:id and episode_id=:episode and shot_key=:shot
                  and script_revision=:script and narration_sha256=:hash and approved_at is null
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .param("script", src.scriptRevision()).param("hash", src.narrationHash()).update();
        if (changed != 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Take does not match the current Director-LOCKED Script.");
        return state(episodeId, shotKey);
    }

    public boolean ownsTake(UUID episodeId, String shotKey, UUID takeId) {
        return jdbc.sql("""
                select exists (select 1 from episode_locked_script_voice_take
                               where id=:id and episode_id=:episode and shot_key=:shot)
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .query(Boolean.class).single();
    }

    public byte[] audio(UUID episodeId, String shotKey, UUID takeId) {
        return jdbc.sql("""
                select audio from episode_locked_script_voice_take
                where id=:id and episode_id=:episode and shot_key=:shot
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .query(byte[].class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown original voice take."));
    }

    public String audioContentType(UUID episodeId, String shotKey, UUID takeId) {
        return jdbc.sql("""
                select content_type from episode_locked_script_voice_take
                where id=:id and episode_id=:episode and shot_key=:shot
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .query(String.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown original voice take."));
    }

    private boolean approved(UUID episodeId, String shotKey, Source src) {
        return jdbc.sql("""
                select exists (select 1 from episode_locked_script_voice_take
                    where episode_id=:episode and shot_key=:shot
                      and script_revision=:script and narration_sha256=:hash
                      and approved_at is not null)
                """).param("episode", episodeId).param("shot", shotKey)
                .param("script", src.scriptRevision()).param("hash", src.narrationHash())
                .query(Boolean.class).single();
    }
}
