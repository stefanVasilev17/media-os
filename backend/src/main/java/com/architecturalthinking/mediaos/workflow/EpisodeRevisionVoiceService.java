package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodeRevisionVoiceService {
    private final JdbcClient jdbc;
    private final ShotRevisionService revisions;
    private final EpisodeWorkspaceService episodes;
    private final ElevenLabsTextToSpeechService elevenLabs;
    private final ObjectMapper mapper;
    private final TransactionTemplate transaction;
    private final EpisodeLockedScriptVoiceService originals;

    public EpisodeRevisionVoiceService(JdbcClient jdbc, ShotRevisionService revisions,
                                       EpisodeWorkspaceService episodes, ElevenLabsTextToSpeechService elevenLabs,
                                       ObjectMapper mapper, PlatformTransactionManager transactionManager,
                                       EpisodeLockedScriptVoiceService originals) {
        this.jdbc = jdbc;
        this.revisions = revisions;
        this.episodes = episodes;
        this.elevenLabs = elevenLabs;
        this.mapper = mapper;
        this.transaction = new TransactionTemplate(transactionManager);
        this.originals = originals;
    }

    public Map<String, Object> state(UUID episodeId, String shotKey) {
        if (revisions.context(episodeId, shotKey).approved() == null)
            return originals.state(episodeId, shotKey);
        ShotRevisionService.Revision approved = requiredLockedRevision(episodeId, shotKey);
        List<Map<String, Object>> takes = jdbc.sql("""
                select id,take_number,content_type,file_name,model_id,voice_id,
                       generated_at,approved_at
                from episode_revision_voice_take
                where episode_id=:episode and shot_key=:shot and shot_revision=:revision
                order by take_number desc
                """)
                .param("episode", episodeId).param("shot", shotKey).param("revision", approved.revision())
                .query((rs, row) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class).toString());
                    item.put("takeNumber", rs.getInt("take_number"));
                    item.put("contentType", rs.getString("content_type"));
                    item.put("fileName", rs.getString("file_name"));
                    item.put("modelId", rs.getString("model_id"));
                    item.put("voiceId", rs.getString("voice_id"));
                    item.put("generatedAt", rs.getObject("generated_at", OffsetDateTime.class).toString());
                    Object approvedAt = rs.getObject("approved_at", OffsetDateTime.class);
                    item.put("approvedAt", approvedAt == null ? null : approvedAt.toString());
                    return item;
                }).list();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId.toString());
        result.put("episodeNumber", episodes.episode(episodeId).get("episodeNumber"));
        result.put("shotKey", shotKey);
        result.put("shotRevision", approved.revision());
        result.put("narration", approved.narration());
        result.put("voiceDirection", approved.voiceDirection());
        result.put("canGenerate", episodes.writesEnabled() && elevenLabs.configured()
                && takes.stream().noneMatch(take -> take.get("approvedAt") != null));
        result.put("configured", elevenLabs.configured());
        result.put("takes", takes);
        result.put("voiceApproved", takes.stream().anyMatch(take -> take.get("approvedAt") != null));
        result.put("voiceModel", elevenLabs.modelId());
        return result;
    }

    public Map<String, Object> generate(UUID episodeId, String shotKey, int expectedRevision) {
        if (expectedRevision == 0) return originals.generate(episodeId, shotKey);
        requireWrites();
        ShotRevisionService.Revision shot = requiredLockedRevision(episodeId, shotKey);
        if (shot.revision() != expectedRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shot revision changed. Reload before ElevenLabs generation.");
        if (!elevenLabs.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ElevenLabs voice is not configured.");
        if (alreadyApproved(episodeId, shotKey, expectedRevision))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voice is already approved for this revision.");
        // The TTS client may add an allowed performance tag, but it never modifies the stored narration.
        ElevenLabsTextToSpeechService.GenerationResult generated;
        try {
            generated = elevenLabs.generate(shotKey, shot.narration(), "", "", Map.of(),
                    "calm, conversational, confident");
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
        } catch (IllegalStateException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ElevenLabs generation failed.", error);
        }
        transaction.executeWithoutResult(status -> saveTake(episodeId, shotKey, expectedRevision, generated));
        return state(episodeId, shotKey);
    }

    private void saveTake(UUID episodeId, String shotKey, int expectedRevision,
                            ElevenLabsTextToSpeechService.GenerationResult generated) {
        // Changes during an external paid TTS request must never attach the result to a newer revision.
        jdbc.sql("select id from episode where id=:episode for update")
                .param("episode", episodeId).query(UUID.class).single();
        ShotRevisionService.Revision latest = requiredLockedRevision(episodeId, shotKey);
        if (latest.revision() != expectedRevision || alreadyApproved(episodeId, shotKey, expectedRevision))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Shot revision or voice approval changed during generation. Stale audio was not saved.");

        int number = jdbc.sql("""
                select coalesce(max(take_number),0)+1 from episode_revision_voice_take
                where episode_id=:episode and shot_key=:shot and shot_revision=:revision
                """).param("episode", episodeId).param("shot", shotKey)
                .param("revision", expectedRevision).query(Integer.class).single();
        String episodeNumber = String.valueOf(episodes.episode(episodeId).get("episodeNumber"));
        String extension = generated.contentType().equals("audio/wav") ? "wav" : "mp3";
        String filename = episodeNumber + "_" + shotKey.replace(' ', '_')
                + "_rev" + expectedRevision + "_take" + number + "." + extension;
        String alignment;
        try {
            alignment = mapper.writeValueAsString(generated.alignmentResponse());
        } catch (JsonProcessingException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ElevenLabs alignment serialization failed.", error);
        }
        jdbc.sql("""
                insert into episode_revision_voice_take(
                    id,episode_id,shot_key,shot_revision,take_number,audio,content_type,
                    file_name,generated_alignment,model_id,voice_id
                ) values(
                    :id,:episode,:shot,:revision,:take,:audio,:type,
                    :filename,cast(:alignment as jsonb),:model,:voice
                )
                """)
                .param("id", UUID.randomUUID()).param("episode", episodeId).param("shot", shotKey)
                .param("revision", expectedRevision).param("take", number).param("audio", generated.audio())
                .param("type", generated.contentType()).param("filename", filename)
                .param("alignment", alignment).param("model", generated.modelId())
                .param("voice", generated.voiceId()).update();
    }

    @Transactional
    public Map<String, Object> approve(UUID episodeId, String shotKey, int expectedRevision, UUID takeId) {
        if (expectedRevision == 0) return originals.approve(episodeId, shotKey, takeId);
        requireWrites();
        jdbc.sql("select id from episode where id=:episode for update")
                .param("episode", episodeId).query(UUID.class).single();
        ShotRevisionService.Revision shot = requiredLockedRevision(episodeId, shotKey);
        if (shot.revision() != expectedRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shot revision changed. Old audio cannot be approved.");
        if (alreadyApproved(episodeId, shotKey, expectedRevision))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voice for this revision is already approved.");
        int changed = jdbc.sql("""
                update episode_revision_voice_take set approved_at=now()
                where id=:id and episode_id=:episode and shot_key=:shot
                  and shot_revision=:revision and approved_at is null
                """)
                .param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .param("revision", expectedRevision).update();
        if (changed != 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Take does not belong to the active shot revision.");
        return state(episodeId, shotKey);
    }

    public byte[] audio(UUID episodeId, String shotKey, UUID takeId) {
        if (originals.ownsTake(episodeId, shotKey, takeId))
            return originals.audio(episodeId, shotKey, takeId);
        requiredLockedRevision(episodeId, shotKey);
        return jdbc.sql("""
                select audio from episode_revision_voice_take
                where id=:id and episode_id=:episode and shot_key=:shot
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .query(byte[].class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown voice take."));
    }

    public String audioContentType(UUID episodeId, String shotKey, UUID takeId) {
        if (originals.ownsTake(episodeId, shotKey, takeId))
            return originals.audioContentType(episodeId, shotKey, takeId);
        requiredLockedRevision(episodeId, shotKey);
        return jdbc.sql("""
                select content_type from episode_revision_voice_take
                where id=:id and episode_id=:episode and shot_key=:shot
                """).param("id", takeId).param("episode", episodeId).param("shot", shotKey)
                .query(String.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown voice take."));
    }

    private boolean alreadyApproved(UUID episodeId, String shotKey, int revision) {
        return jdbc.sql("""
                select exists(select 1 from episode_revision_voice_take
                              where episode_id=:episode and shot_key=:shot and shot_revision=:revision
                                and approved_at is not null)
                """).param("episode", episodeId).param("shot", shotKey).param("revision", revision)
                .query(Boolean.class).single();
    }

    private ShotRevisionService.Revision requiredLockedRevision(UUID episodeId, String shotKey) {
        var context = revisions.context(episodeId, shotKey);
        if (context.approved() == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Approve the proposed text in Revision Chat before opening Voice generation.");
        return context.approved();
    }

    private void requireWrites() {
        if (!episodes.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode Voice writes are disabled until the safety rollout gate is approved.");
    }
}
