package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class Ep002VoiceSpendGate {
    private static final int MAX_TAKES_PER_SHOT = 3;
    private static final int MAX_CHARS_PER_REQUEST = 5000;
    private final JdbcClient jdbc;
    private final EpisodeWorkspaceService episodes;
    private final boolean ep002VoiceEnabled;

    public record Decision(boolean allowed, String blockedReason) {}

    public Ep002VoiceSpendGate(JdbcClient jdbc, EpisodeWorkspaceService episodes,
                              @Value("${mediaos.ep002.voice.writes-enabled:false}") boolean ep002VoiceEnabled) {
        this.jdbc = jdbc;
        this.episodes = episodes;
        this.ep002VoiceEnabled = ep002VoiceEnabled;
    }

    public Decision inspect(UUID episodeId, String shotKey, String narration) {
        String number = String.valueOf(episodes.episode(episodeId).get("episodeNumber"));
        if (!"EP002".equals(number)) {
            return episodes.writesEnabled() ? new Decision(true, null)
                    : new Decision(false, "Episode Voice writes are disabled.");
        }
        if (!ep002VoiceEnabled) {
            return new Decision(false, "EP002 Voice-only production gate is OFF.");
        }
        if (narration == null || narration.isBlank() || narration.length() > MAX_CHARS_PER_REQUEST) {
            return new Decision(false, "EP002 narration must contain 1 to 5000 characters.");
        }
        boolean unresolved = jdbc.sql("""
                select exists (select 1 from ep002_voice_generation_ledger
                    where episode_id=:episode and shot_key=:shot
                      and status in ('IN_FLIGHT', 'UNCERTAIN'))
                """).param("episode", episodeId).param("shot", shotKey).query(Boolean.class).single();
        if (unresolved) {
            return new Decision(false,
                    "A previous ElevenLabs request is still in flight or its charge is uncertain. "
                    + "Do not retry until the Director reconciles that request.");
        }
        Long takes = jdbc.sql("""
                select
                  (select count(*) from episode_locked_script_voice_take
                    where episode_id=:episode and shot_key=:shot)
                 +(select count(*) from episode_revision_voice_take
                    where episode_id=:episode and shot_key=:shot)
                """).param("episode", episodeId).param("shot", shotKey).query(Long.class).single();
        if (takes >= MAX_TAKES_PER_SHOT) {
            return new Decision(false, "EP002 safety limit: maximum 3 recorded takes per SHOT.");
        }
        return new Decision(true, null);
    }

    public void requireWrite(UUID episodeId) {
        DirectorIdentity.requireDirector();
        String number = String.valueOf(episodes.episode(episodeId).get("episodeNumber"));
        boolean allowed = "EP002".equals(number) ? ep002VoiceEnabled : episodes.writesEnabled();
        if (!allowed) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Voice writes are disabled for this episode.");
    }

    public void reserve(UUID episodeId, String shotKey, int revision,
                        String narration, UUID requestId) {
        requireWrite(episodeId);
        String number = String.valueOf(episodes.episode(episodeId).get("episodeNumber"));
        if (!"EP002".equals(number)) return;
        if (requestId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A unique requestId is required for every paid EP002 voice attempt.");
        }
        Decision decision = inspect(episodeId, shotKey, narration);
        if (!decision.allowed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, decision.blockedReason());
        }
        var actor = DirectorIdentity.requireDirector();
        String hash = EpisodeLockedScriptVoiceService.narrationHash(narration);
        try {
            jdbc.sql("""
                    insert into ep002_voice_generation_ledger
                      (request_id,episode_id,shot_key,revision,narration_sha256,
                       actor_issuer,actor_subject,status)
                    values (:id,:episode,:shot,:revision,:hash,:issuer,:subject,'IN_FLIGHT')
                    """)
                    .param("id", requestId).param("episode", episodeId).param("shot", shotKey)
                    .param("revision", revision).param("hash", hash)
                    .param("issuer", actor.issuer()).param("subject", actor.subject())
                    .update();
        } catch (DataIntegrityViolationException conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Duplicate or unresolved EP002 voice request. No additional ElevenLabs call was made.", conflict);
        }
    }

    public void completed(UUID requestId) {
        if (requestId == null) return;
        int count = jdbc.sql("""
                update ep002_voice_generation_ledger
                set status='COMPLETED',completed_at=now()
                where request_id=:id and status='IN_FLIGHT'
                """).param("id", requestId).update();
        if (count != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP002 paid voice request is no longer in flight; refusing untracked audio.");
        }
    }

    public void uncertain(UUID requestId) {
        if (requestId == null) return;
        jdbc.sql("""
                update ep002_voice_generation_ledger
                set status='UNCERTAIN'
                where request_id=:id and status='IN_FLIGHT'
                """).param("id", requestId).update();
    }

    public String status(UUID episodeId, String shotKey) {
        return jdbc.sql("""
                select status from ep002_voice_generation_ledger
                where episode_id=:episode and shot_key=:shot
                order by started_at desc limit 1
                """).param("episode", episodeId).param("shot", shotKey)
                .query(String.class).optional().orElse("NONE");
    }
}
