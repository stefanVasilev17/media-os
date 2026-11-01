package com.architecturalthinking.mediaos.workflow;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class Ep002VoiceIdentityGuard {
    private static final UUID EP001_ID = ProductionOverviewService.EPISODE_ID;
    private final JdbcClient jdbc;
    private final ElevenLabsTextToSpeechService elevenLabs;

    public record Identity(String voiceId, String modelId) {}
    public record Check(boolean verified, String blockedReason) {}

    public Ep002VoiceIdentityGuard(JdbcClient jdbc, ElevenLabsTextToSpeechService elevenLabs) {
        this.jdbc = jdbc;
        this.elevenLabs = elevenLabs;
    }

    public Check inspect(String episodeNumber) {
        if (!"EP002".equals(episodeNumber)) return new Check(true, null);
        List<Identity> approved = approvedEp001VoiceIdentities();
        return compare(approved, elevenLabs.voiceId(), elevenLabs.modelId());
    }

    public void requireVerified(String episodeNumber) {
        Check check = inspect(episodeNumber);
        if (!check.verified()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, check.blockedReason());
        }
    }

    private List<Identity> approvedEp001VoiceIdentities() {
        List<Identity> clips = jdbc.sql("""
                select distinct generated_voice_id, generated_model_id
                from voice_clip_workflow
                where episode_id=:episode and voice_approved_at is not null
                  and generated_audio is not null
                  and nullif(trim(generated_voice_id), '') is not null
                  and nullif(trim(generated_model_id), '') is not null
                """)
                .param("episode", EP001_ID)
                .query((rs, n) -> new Identity(
                        rs.getString("generated_voice_id"), rs.getString("generated_model_id")))
                .list();
        if (!clips.isEmpty()) return clips;
        return jdbc.sql("""
                select distinct generated_voice_id, generated_model_id
                from voice_shot_workflow
                where episode_id=:episode and voice_approved_at is not null
                  and generated_audio is not null
                  and nullif(trim(generated_voice_id), '') is not null
                  and nullif(trim(generated_model_id), '') is not null
                """)
                .param("episode", EP001_ID)
                .query((rs, n) -> new Identity(
                        rs.getString("generated_voice_id"), rs.getString("generated_model_id")))
                .list();
    }

    static Check compare(List<Identity> approved, String activeVoiceId, String activeModelId) {
        if (approved == null || approved.isEmpty()) {
            return new Check(false,
                    "EP001 has no approved ElevenLabs voice/model metadata. Compare the final EP001 recording and explicitly confirm its source before EP002 generation.");
        }
        List<Identity> distinct = new ArrayList<>(approved.stream().distinct().toList());
        if (distinct.size() != 1) {
            return new Check(false,
                    "EP001 approved audio references multiple voice/model profiles. A Director must identify the final EP001 reference before EP002 generation.");
        }
        Identity reference = distinct.get(0);
        if (!reference.voiceId().equals(activeVoiceId) || !reference.modelId().equals(activeModelId)) {
            return new Check(false,
                    "The current ElevenLabs voice or model differs from approved EP001. Restore the EP001 identity before spending credits on EP002.");
        }
        return new Check(true, null);
    }
}
