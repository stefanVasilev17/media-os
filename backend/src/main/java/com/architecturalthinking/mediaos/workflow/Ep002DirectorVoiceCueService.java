package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class Ep002DirectorVoiceCueService {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final Ep002FactoryReadinessBridgeService episode;

    public Ep002DirectorVoiceCueService(JdbcClient jdbc,ObjectMapper mapper,
                                        Ep002FactoryReadinessBridgeService episode) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.episode=episode;
    }

    public record ReviewRequest(UUID requestId,String expectedEpisodeFingerprint,
                                String expectedTakeId,List<String> spokenAnchors,
                                Boolean confirmHeardAndReviewed) {}
    public record CueReview(String shotKey,String inputFingerprint,String selectedTakeId,
                            int narrationRevision,int requiredBeatCount,
                            List<String> anchors,List<Ep002VoiceBeatResolver.BeatCue> frames,
                            boolean verified,String reason,String reviewTime) {}
    private record Selected(UUID id,int revision,String narrationSha,
                            BigDecimal seconds,String alignment) {}

    public record Shot02RenderReadiness(
            String shotKey, String inputFingerprint, String voiceTakeId,
            int durationInFrames, String timingMode,
            List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
            List<Ep002Shot02TermResolver.TermCue> termCues,
            boolean ready, String reason) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Shot02RenderReadiness shot02RenderReadiness() {
        DirectorIdentity.requireDirector();
        CueReview review=preview("SHOT02");
        var current=episode.snapshot();
        var shot=current.shots().stream()
                .filter(s->"SHOT02".equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("SHOT02 source is unavailable."));
        int duration=shot.durationFrames()==null?0:shot.durationFrames();
        String takeId=shot.preferredTakeId();
        if(!review.verified() || !review.inputFingerprint().equals(current.inputFingerprint())
                || !shot.currentVoiceApproved() || !shot.hearSeeTimingVerified()
                || takeId==null || !takeId.equals(review.selectedTakeId())
                || duration<6 || review.frames().size()!=5) {
            return new Shot02RenderReadiness("SHOT02",current.inputFingerprint(),takeId,
                    duration,"ELEVENLABS_CHARACTER_TIMESTAMPS",
                    List.of(),List.of(),false,"CURRENT_DIRECTOR_VOICE_CUE_REVIEW_REQUIRED");
        }
        Selected take=selected(shot);
        if(take==null || take.alignment()==null || take.alignment().isBlank()
                || take.seconds()==null
                || take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                || (int)Math.ceil(take.seconds().doubleValue()*30d)!=duration
                || !take.id().toString().equals(takeId)
                || !take.narrationSha().equals(shot.narrationSha256())
                || take.revision()!=shot.scriptRevision()) {
            return new Shot02RenderReadiness("SHOT02",current.inputFingerprint(),takeId,
                    duration,"ELEVENLABS_CHARACTER_TIMESTAMPS",
                    List.of(),List.of(),false,"CURRENT_SELECTED_TAKE_ALIGNMENT_INVALID");
        }
        try {
            var terms=Ep002Shot02TermResolver.resolve(
                    mapper,take.alignment(),take.seconds(),review.frames());
            return new Shot02RenderReadiness("SHOT02",current.inputFingerprint(),takeId,
                    duration,"ELEVENLABS_CHARACTER_TIMESTAMPS",
                    review.frames(),terms,true,"VERIFIED_SAME_TAKE_REAL_CHARACTER_TIMESTAMPS");
        } catch(IllegalArgumentException invalid) {
            return new Shot02RenderReadiness("SHOT02",current.inputFingerprint(),takeId,
                    duration,"ELEVENLABS_CHARACTER_TIMESTAMPS",
                    List.of(),List.of(),false,invalid.getMessage());
        }
    }



    public record Shot03RenderReadiness(
            String shotKey,String inputFingerprint,String voiceTakeId,
            int durationInFrames,String timingMode,
            List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
            List<Ep002Shot03TermResolver.TermCue> termCues,
            boolean ready,String reason) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Shot03RenderReadiness shot03RenderReadiness() {
        DirectorIdentity.requireDirector();
        CueReview review=preview("SHOT03");
        var current=episode.snapshot();
        var shot=current.shots().stream()
                .filter(s->"SHOT03".equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("SHOT03 source unavailable."));
        int duration=shot.durationFrames()==null?0:shot.durationFrames();
        String takeId=shot.preferredTakeId();
        final String mode="ELEVENLABS_CHARACTER_TIMESTAMPS";
        if(!review.verified()||!review.inputFingerprint().equals(current.inputFingerprint())
                ||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                ||takeId==null||!takeId.equals(review.selectedTakeId())
                ||duration<150||review.frames().size()!=5) {
            return new Shot03RenderReadiness("SHOT03",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "CURRENT_DIRECTOR_SHOT03_HEAR_SEE_CUE_VERIFICATION_REQUIRED");
        }
        Selected take=selected(shot);
        if(take==null||take.alignment()==null||take.alignment().isBlank()
                ||take.seconds()==null||shot.measuredVoiceSeconds()==null
                ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=duration
                ||!take.id().toString().equals(takeId)
                ||!take.narrationSha().equals(shot.narrationSha256())
                ||take.revision()!=shot.scriptRevision()) {
            return new Shot03RenderReadiness("SHOT03",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "SHOT03_SELECTED_TAKE_DURATION_OR_ALIGNMENT_CHANGED");
        }
        try {
            var terms=Ep002Shot03TermResolver.resolve(
                    mapper,take.alignment(),take.seconds(),review.frames());
            return new Shot03RenderReadiness("SHOT03",current.inputFingerprint(),
                    takeId,duration,mode,review.frames(),terms,true,
                    "DIRECTOR_APPROVED_TAKE_REAL_11_TERMS_AND_5_BEATS");
        } catch(IllegalArgumentException invalid) {
            return new Shot03RenderReadiness("SHOT03",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    invalid.getMessage());
        }
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public boolean matchesCurrentShot03Render(String fingerprint,String takeId,
                                              int scriptRevision,int durationFrames) {
        if(fingerprint==null||!fingerprint.matches("[a-f0-9]{64}")
                ||takeId==null||!takeId.matches(
                    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                ||scriptRevision<1||durationFrames<150)return false;
        try {
            var current=episode.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT03".equals(s.shotKey()))
                    .findFirst().orElse(null);
            if(!current.sourceVerified()||!current.inputFingerprint().equals(fingerprint)
                    ||shot==null||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                    ||!takeId.equals(shot.preferredTakeId())
                    ||scriptRevision!=shot.scriptRevision()
                    ||shot.durationFrames()==null||durationFrames!=shot.durationFrames())
                return false;
            Selected take=selected(shot);
            if(take==null||take.alignment()==null||take.seconds()==null
                    ||shot.measuredVoiceSeconds()==null
                    ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                    ||!take.narrationSha().equals(shot.narrationSha256())
                    ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=durationFrames)
                return false;
            return jdbc.sql("""
                    select exists(
                        select 1 from ep002_director_voice_cue_review review
                        where review.episode_key='EP002' and review.shot_key='SHOT03'
                          and review.selected_take_id=:take
                          and review.script_revision=:revision
                          and review.episode_fingerprint=:fingerprint
                          and review.narration_sha256=:narration
                          and review.alignment_sha256=:alignment
                          and review.preflight_audit_id is not null
                    )
                    """)
                    .param("take",UUID.fromString(takeId))
                    .param("revision",scriptRevision)
                    .param("fingerprint",fingerprint)
                    .param("narration",take.narrationSha())
                    .param("alignment",Ep002ProductionContractService.sha256(take.alignment()))
                    .query(Boolean.class).optional().orElse(false);
        }catch(RuntimeException invalid){return false;}
    }

    public record Shot04RenderReadiness(
            String shotKey,String inputFingerprint,String voiceTakeId,
            int durationInFrames,String timingMode,
            List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
            List<Ep002Shot04TermResolver.TermCue> termCues,
            boolean ready,String reason) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Shot04RenderReadiness shot04RenderReadiness() {
        DirectorIdentity.requireDirector();
        CueReview review=preview("SHOT04");
        var current=episode.snapshot();
        var shot=current.shots().stream()
                .filter(s->"SHOT04".equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("SHOT04 source unavailable."));
        int duration=shot.durationFrames()==null?0:shot.durationFrames();
        String takeId=shot.preferredTakeId();
        final String mode="ELEVENLABS_CHARACTER_TIMESTAMPS";
        if(!review.verified()||!review.inputFingerprint().equals(current.inputFingerprint())
                ||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                ||takeId==null||!takeId.equals(review.selectedTakeId())
                ||duration<150||review.frames().size()!=5) {
            return new Shot04RenderReadiness("SHOT04",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "CURRENT_DIRECTOR_SHOT04_HEAR_SEE_CUE_VERIFICATION_REQUIRED");
        }
        Selected take=selected(shot);
        if(take==null||take.alignment()==null||take.alignment().isBlank()
                ||take.seconds()==null||shot.measuredVoiceSeconds()==null
                ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=duration
                ||!take.id().toString().equals(takeId)
                ||!take.narrationSha().equals(shot.narrationSha256())
                ||take.revision()!=shot.scriptRevision()) {
            return new Shot04RenderReadiness("SHOT04",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "SHOT04_SELECTED_TAKE_DURATION_OR_ALIGNMENT_CHANGED");
        }
        try {
            var terms=Ep002Shot04TermResolver.resolve(
                    mapper,take.alignment(),take.seconds(),review.frames());
            return new Shot04RenderReadiness("SHOT04",current.inputFingerprint(),
                    takeId,duration,mode,review.frames(),terms,true,
                    "DIRECTOR_APPROVED_TAKE_REAL_9_TERMS_AND_5_BEATS");
        } catch(IllegalArgumentException invalid) {
            return new Shot04RenderReadiness("SHOT04",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    invalid.getMessage());
        }
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public boolean matchesCurrentShot04Render(String fingerprint,String takeId,
                                              int scriptRevision,int durationFrames) {
        if(fingerprint==null||!fingerprint.matches("[a-f0-9]{64}")
                ||takeId==null||!takeId.matches(
                    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                ||scriptRevision<1||durationFrames<150)return false;
        try {
            var current=episode.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT04".equals(s.shotKey()))
                    .findFirst().orElse(null);
            if(!current.sourceVerified()||!current.inputFingerprint().equals(fingerprint)
                    ||shot==null||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                    ||!takeId.equals(shot.preferredTakeId())
                    ||scriptRevision!=shot.scriptRevision()
                    ||shot.durationFrames()==null||durationFrames!=shot.durationFrames())
                return false;
            Selected take=selected(shot);
            if(take==null||take.alignment()==null||take.seconds()==null
                    ||shot.measuredVoiceSeconds()==null
                    ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                    ||!take.narrationSha().equals(shot.narrationSha256())
                    ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=durationFrames)
                return false;
            return jdbc.sql("""
                    select exists(
                        select 1 from ep002_director_voice_cue_review review
                        where review.episode_key='EP002' and review.shot_key='SHOT04'
                          and review.selected_take_id=:take
                          and review.script_revision=:revision
                          and review.episode_fingerprint=:fingerprint
                          and review.narration_sha256=:narration
                          and review.alignment_sha256=:alignment
                          and review.preflight_audit_id is not null
                    )
                    """)
                    .param("take",UUID.fromString(takeId))
                    .param("revision",scriptRevision)
                    .param("fingerprint",fingerprint)
                    .param("narration",take.narrationSha())
                    .param("alignment",Ep002ProductionContractService.sha256(take.alignment()))
                    .query(Boolean.class).optional().orElse(false);
        }catch(RuntimeException invalid){return false;}
    }

    public record Shot05RenderReadiness(
            String shotKey,String inputFingerprint,String voiceTakeId,
            int durationInFrames,String timingMode,
            List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
            List<Ep002Shot05TermResolver.TermCue> termCues,
            boolean ready,String reason) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Shot05RenderReadiness shot05RenderReadiness() {
        DirectorIdentity.requireDirector();
        CueReview review=preview("SHOT05");
        var current=episode.snapshot();
        var shot=current.shots().stream()
                .filter(s->"SHOT05".equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("SHOT05 source unavailable."));
        int duration=shot.durationFrames()==null?0:shot.durationFrames();
        String takeId=shot.preferredTakeId();
        final String mode="ELEVENLABS_CHARACTER_TIMESTAMPS";
        if(!review.verified()||!review.inputFingerprint().equals(current.inputFingerprint())
                ||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                ||takeId==null||!takeId.equals(review.selectedTakeId())
                ||duration<150||review.frames().size()!=5) {
            return new Shot05RenderReadiness("SHOT05",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "CURRENT_DIRECTOR_SHOT05_HEAR_SEE_CUE_VERIFICATION_REQUIRED");
        }
        Selected take=selected(shot);
        if(take==null||take.alignment()==null||take.alignment().isBlank()
                ||take.seconds()==null||shot.measuredVoiceSeconds()==null
                ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=duration
                ||!take.id().toString().equals(takeId)
                ||!take.narrationSha().equals(shot.narrationSha256())
                ||take.revision()!=shot.scriptRevision()) {
            return new Shot05RenderReadiness("SHOT05",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "SHOT05_SELECTED_TAKE_DURATION_OR_ALIGNMENT_CHANGED");
        }
        try {
            var terms=Ep002Shot05TermResolver.resolve(
                    mapper,take.alignment(),take.seconds(),review.frames());
            return new Shot05RenderReadiness("SHOT05",current.inputFingerprint(),
                    takeId,duration,mode,review.frames(),terms,true,
                    "DIRECTOR_APPROVED_TAKE_REAL_15_TERMS_AND_5_BEATS");
        } catch(IllegalArgumentException invalid) {
            return new Shot05RenderReadiness("SHOT05",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    invalid.getMessage());
        }
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public boolean matchesCurrentShot05Render(String fingerprint,String takeId,
                                              int scriptRevision,int durationFrames) {
        if(fingerprint==null||!fingerprint.matches("[a-f0-9]{64}")
                ||takeId==null||!takeId.matches(
                    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                ||scriptRevision<1||durationFrames<150)return false;
        try {
            var current=episode.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT05".equals(s.shotKey()))
                    .findFirst().orElse(null);
            if(!current.sourceVerified()||!current.inputFingerprint().equals(fingerprint)
                    ||shot==null||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                    ||!takeId.equals(shot.preferredTakeId())
                    ||scriptRevision!=shot.scriptRevision()
                    ||shot.durationFrames()==null||durationFrames!=shot.durationFrames())
                return false;
            Selected take=selected(shot);
            if(take==null||take.alignment()==null||take.seconds()==null
                    ||shot.measuredVoiceSeconds()==null
                    ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                    ||!take.narrationSha().equals(shot.narrationSha256())
                    ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=durationFrames)
                return false;
            return jdbc.sql("""
                    select exists(
                        select 1 from ep002_director_voice_cue_review review
                        where review.episode_key='EP002' and review.shot_key='SHOT05'
                          and review.selected_take_id=:take
                          and review.script_revision=:revision
                          and review.episode_fingerprint=:fingerprint
                          and review.narration_sha256=:narration
                          and review.alignment_sha256=:alignment
                          and review.preflight_audit_id is not null
                    )
                    """)
                    .param("take",UUID.fromString(takeId))
                    .param("revision",scriptRevision)
                    .param("fingerprint",fingerprint)
                    .param("narration",take.narrationSha())
                    .param("alignment",Ep002ProductionContractService.sha256(take.alignment()))
                    .query(Boolean.class).optional().orElse(false);
        }catch(RuntimeException invalid){return false;}
    }

    public record Shot06RenderReadiness(
            String shotKey,String inputFingerprint,String voiceTakeId,
            int durationInFrames,String timingMode,
            List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
            List<Ep002Shot06TermResolver.TermCue> termCues,
            boolean ready,String reason) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Shot06RenderReadiness shot06RenderReadiness() {
        DirectorIdentity.requireDirector();
        CueReview review=preview("SHOT06");
        var current=episode.snapshot();
        var shot=current.shots().stream()
                .filter(s->"SHOT06".equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("SHOT06 source unavailable."));
        int duration=shot.durationFrames()==null?0:shot.durationFrames();
        String takeId=shot.preferredTakeId();
        final String mode="ELEVENLABS_CHARACTER_TIMESTAMPS";
        if(!review.verified()||!review.inputFingerprint().equals(current.inputFingerprint())
                ||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                ||takeId==null||!takeId.equals(review.selectedTakeId())
                ||duration<150||review.frames().size()!=5) {
            return new Shot06RenderReadiness("SHOT06",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "CURRENT_DIRECTOR_SHOT06_HEAR_SEE_CUE_VERIFICATION_REQUIRED");
        }
        Selected take=selected(shot);
        if(take==null||take.alignment()==null||take.alignment().isBlank()
                ||take.seconds()==null||shot.measuredVoiceSeconds()==null
                ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=duration
                ||!take.id().toString().equals(takeId)
                ||!take.narrationSha().equals(shot.narrationSha256())
                ||take.revision()!=shot.scriptRevision()) {
            return new Shot06RenderReadiness("SHOT06",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    "SHOT06_SELECTED_TAKE_DURATION_OR_ALIGNMENT_CHANGED");
        }
        try {
            var terms=Ep002Shot06TermResolver.resolve(
                    mapper,take.alignment(),take.seconds(),review.frames());
            return new Shot06RenderReadiness("SHOT06",current.inputFingerprint(),
                    takeId,duration,mode,review.frames(),terms,true,
                    "DIRECTOR_APPROVED_TAKE_REAL_15_TERMS_AND_5_BEATS");
        } catch(IllegalArgumentException invalid) {
            return new Shot06RenderReadiness("SHOT06",current.inputFingerprint(),
                    takeId,duration,mode,List.of(),List.of(),false,
                    invalid.getMessage());
        }
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public boolean matchesCurrentShot06Render(String fingerprint,String takeId,
                                              int scriptRevision,int durationFrames) {
        if(fingerprint==null||!fingerprint.matches("[a-f0-9]{64}")
                ||takeId==null||!takeId.matches(
                    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                ||scriptRevision<1||durationFrames<150)return false;
        try {
            var current=episode.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT06".equals(s.shotKey()))
                    .findFirst().orElse(null);
            if(!current.sourceVerified()||!current.inputFingerprint().equals(fingerprint)
                    ||shot==null||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                    ||!takeId.equals(shot.preferredTakeId())
                    ||scriptRevision!=shot.scriptRevision()
                    ||shot.durationFrames()==null||durationFrames!=shot.durationFrames())
                return false;
            Selected take=selected(shot);
            if(take==null||take.alignment()==null||take.seconds()==null
                    ||shot.measuredVoiceSeconds()==null
                    ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                    ||!take.narrationSha().equals(shot.narrationSha256())
                    ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=durationFrames)
                return false;
            return jdbc.sql("""
                    select exists(
                        select 1 from ep002_director_voice_cue_review review
                        where review.episode_key='EP002' and review.shot_key='SHOT06'
                          and review.selected_take_id=:take
                          and review.script_revision=:revision
                          and review.episode_fingerprint=:fingerprint
                          and review.narration_sha256=:narration
                          and review.alignment_sha256=:alignment
                          and review.preflight_audit_id is not null
                    )
                    """)
                    .param("take",UUID.fromString(takeId))
                    .param("revision",scriptRevision)
                    .param("fingerprint",fingerprint)
                    .param("narration",take.narrationSha())
                    .param("alignment",Ep002ProductionContractService.sha256(take.alignment()))
                    .query(Boolean.class).optional().orElse(false);
        }catch(RuntimeException invalid){return false;}
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Ep002Shot02EditorialPausePlan.Plan editorialPlan(
            Shot02RenderReadiness verified) {
        DirectorIdentity.requireDirector();
        if(verified==null||!verified.ready()||verified.voiceTakeId()==null
                ||verified.verifiedCues().size()!=5||verified.termCues().size()!=7)
            throw conflict("SHOT02_EDITORIAL_REQUIRES_CURRENT_VERIFIED_TAKE");
        record Voice(BigDecimal seconds,String alignment) {}
        Voice take=jdbc.sql("""
                select duration_seconds,elevenlabs_alignment::text as alignment
                from ep002_creative_voice_take where id=:id and shot_key='SHOT02'
                """).param("id",UUID.fromString(verified.voiceTakeId()))
                .query((rs,n)->new Voice(rs.getBigDecimal("duration_seconds"),
                        rs.getString("alignment")))
                .optional().orElseThrow(() -> conflict(
                    "SHOT02_CURRENT_SELECTED_SOURCE_TAKE_NOT_FOUND"));
        var plan=Ep002Shot02EditorialPausePlan.fromVerified(
                mapper,take.alignment(),take.seconds(),
                verified.verifiedCues(),verified.termCues());
        if(plan.sourceDurationInFrames()!=verified.durationInFrames())
            throw conflict("SHOT02_EDITORIAL_SOURCE_DURATION_CHANGED");
        return plan;
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public boolean matchesCurrentShot02Render(String fingerprint, String takeId,
                                               int scriptRevision, int durationFrames) {
        if (fingerprint==null || !fingerprint.matches("[a-f0-9]{64}")
                || takeId==null || !takeId.matches(
                    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                || scriptRevision<1 || durationFrames<6) {
            return false;
        }
        try {
            var current=episode.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT02".equals(s.shotKey()))
                    .findFirst().orElse(null);
            return current.sourceVerified()
                    && current.inputFingerprint().equals(fingerprint)
                    && shot!=null
                    && shot.currentVoiceApproved() && shot.hearSeeTimingVerified()
                    && takeId.equals(shot.preferredTakeId())
                    && scriptRevision==shot.scriptRevision()
                    && shot.durationFrames()!=null
                    && durationFrames==shot.durationFrames();
        } catch (RuntimeException staleOrUnavailable) {
            return false;
        }
    }

    private static void validateShot(String shot) {
        if(shot==null||!shot.matches("SHOT(0[1-9]|1[01])"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only EP002 SHOT01–SHOT11 have approved source visuals.");
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public CueReview preview(String shotKey) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        validateShot(shotKey);
        var source=episode.snapshot();
        var shot=source.shots().stream().filter(s->shotKey.equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("Unknown approved EP002 SHOT."));
        Selected take=selected(shot);
        if(take==null)
            return new CueReview(shotKey,source.inputFingerprint(),null,
                    shot.scriptRevision(),shot.beatCount(),List.of(),List.of(),
                    false,"SELECT_AND_MEASURE_CURRENT_VOICE_TAKE",null);
        return existing(shotKey,source.inputFingerprint(),shot,take,actor);
    }

    @Transactional(isolation=Isolation.SERIALIZABLE)
    public CueReview approve(String shotKey,ReviewRequest request,UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        validateShot(shotKey);
        if(request==null||request.requestId()==null||auditId==null
                || !Boolean.TRUE.equals(request.confirmHeardAndReviewed())
                || request.expectedEpisodeFingerprint()==null
                || !request.expectedEpisodeFingerprint().matches("[a-f0-9]{64}")
                || request.expectedTakeId()==null
                || !request.expectedTakeId().matches(
                      "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
                || request.spokenAnchors()==null)
            throw bad("Explicit Director-confirmed current selected Take and spoken beat anchors required.");

        jdbc.sql("select pg_advisory_xact_lock(hashtext('ep002-cue:' || :shot)::bigint)")
                .param("shot",shotKey).query((rs,n)->true).single();
        var source=episode.snapshot();
        var shot=source.shots().stream().filter(s->shotKey.equals(s.shotKey()))
                .findFirst().orElseThrow(()->conflict("Unknown approved SHOT."));
        if(!source.inputFingerprint().equals(request.expectedEpisodeFingerprint())
                || !request.expectedTakeId().equals(shot.preferredTakeId())
                || shot.scriptRevision()<1||shot.measuredVoiceSeconds()==null
                || request.spokenAnchors().size()!=shot.beatCount())
            throw conflict("Selected Take, working narration, audio duration or beat count changed.");

        Selected take=selected(shot);
        if(take==null||take.alignment()==null||take.alignment().isBlank()
                || take.seconds()==null||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                || take.revision()!=shot.scriptRevision()
                || !take.narrationSha().equals(shot.narrationSha256()))
            throw conflict("Existing selected Take has no matching real ElevenLabs character timing.");
        List<Ep002VoiceBeatResolver.BeatCue> frames;
        try {
            frames=Ep002VoiceBeatResolver.resolve(mapper,take.alignment(),
                    take.seconds(),request.spokenAnchors(),shot.beatCount());
        } catch(IllegalArgumentException failure) {
            throw bad(failure.getMessage());
        }
        String anchorJson=json(request.spokenAnchors());
        String frameJson=json(frames);
        String alignmentSha=Ep002ProductionContractService.sha256(take.alignment());
        String frameSha=Ep002ProductionContractService.sha256(
                shotKey+"|"+source.inputFingerprint()+"|"+take.id()+"|"+frameJson);

        CueReview previously=existing(shotKey,source.inputFingerprint(),shot,take,actor);
        if(previously.verified()) {
            if(previously.anchors().equals(request.spokenAnchors())
                    && previously.frames().equals(frames))
                return previously;
            throw conflict("Director voice cue review already exists for this selected Take; "
                    +"changing anchors needs a new reviewed narration/Take version.");
        }

        int inserted=jdbc.sql("""
                insert into ep002_director_voice_cue_review(
                    id,request_id,shot_key,episode_fingerprint,script_revision,
                    narration_sha256,selected_take_id,measured_duration_seconds,
                    alignment_sha256,anchors_json,resolved_frames_json,cue_digest_sha256,
                    director_issuer,director_subject,preflight_audit_id
                ) values(:id,:request,:shot,:fingerprint,:revision,:narration,
                    :take,:seconds,:alignment,cast(:anchors as jsonb),
                    cast(:frames as jsonb),:digest,:issuer,:subject,:audit)
                on conflict do nothing
                """)
                .param("id",UUID.randomUUID()).param("request",request.requestId())
                .param("shot",shotKey).param("fingerprint",source.inputFingerprint())
                .param("revision",shot.scriptRevision())
                .param("narration",shot.narrationSha256()).param("take",take.id())
                .param("seconds",take.seconds()).param("alignment",alignmentSha)
                .param("anchors",anchorJson).param("frames",frameJson)
                .param("digest",frameSha).param("issuer",actor.issuer())
                .param("subject",actor.subject()).param("audit",auditId).update();
        if(inserted!=1)throw conflict("A voice cue review already exists; reload and compare.");
        return existing(shotKey,source.inputFingerprint(),shot,take,actor);
    }

    private CueReview existing(String shot,String fingerprint,
                               Ep002FactoryReadinessBridgeService.ShotReadiness source,
                               Selected take,DirectorIdentity.Actor actor) {
        return jdbc.sql("""
                select anchors_json::text as anchors,
                       resolved_frames_json::text as frames,
                       episode_fingerprint as original_fingerprint,
                       alignment_sha256,cue_digest_sha256,
                       created_at::text as reviewed_at
                  from ep002_director_voice_cue_review
                 where shot_key=:shot and episode_key='EP002'
                   and selected_take_id=:take and script_revision=:revision
                   and narration_sha256=:narration
                   and director_issuer=:issuer and director_subject=:subject
                 order by created_at desc limit 1
                """)
                .param("shot",shot)
                .param("take",take.id()).param("revision",source.scriptRevision())
                .param("narration",source.narrationSha256())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->{
                    try {
                        String anchorsJson=rs.getString("anchors");
                        String framesJson=rs.getString("frames");
                        JsonNode array=mapper.readTree(anchorsJson);
                        List<String> anchors=new java.util.ArrayList<>();
                        for(JsonNode entry:array)anchors.add(entry.asText());
                        var type=mapper.getTypeFactory().constructCollectionType(
                                List.class,Ep002VoiceBeatResolver.BeatCue.class);
                        List<Ep002VoiceBeatResolver.BeatCue> cues=mapper.readValue(framesJson,type);
                        String canonical=mapper.writeValueAsString(cues);
                        String cueDigest=Ep002ProductionContractService.sha256(
                                shot+"|"+rs.getString("original_fingerprint")+
                                "|"+take.id()+"|"+canonical);
                        boolean verified=fingerprint.equals(rs.getString("original_fingerprint"))
                                && rs.getString("alignment_sha256").equals(
                                    Ep002ProductionContractService.sha256(take.alignment()))
                                && rs.getString("cue_digest_sha256").equals(cueDigest)
                                && source.measuredVoiceSeconds().compareTo(take.seconds())==0
                                && cues.equals(Ep002VoiceBeatResolver.resolve(
                                    mapper,take.alignment(),take.seconds(),anchors,source.beatCount()));
                        return new CueReview(shot,fingerprint,take.id().toString(),
                                source.scriptRevision(),source.beatCount(),
                                List.copyOf(anchors),List.copyOf(cues),
                                verified,verified?"DIRECTOR_REVIEWED_REAL_ALIGNMENT":"CUE_SOURCE_STALE",
                                rs.getString("reviewed_at"));
                    }catch(Exception invalid) {
                        return new CueReview(shot,fingerprint,take.id().toString(),
                                source.scriptRevision(),source.beatCount(),List.of(),List.of(),
                                false,"STORED_CUE_REVIEW_INVALID",null);
                    }
                }).optional().orElseGet(()->new CueReview(
                        shot,fingerprint,take.id().toString(),source.scriptRevision(),
                        source.beatCount(),List.of(),List.of(),false,
                        take.alignment()==null?"TAKE_MISSING_CHARACTER_ALIGNMENT"
                                :"DIRECTOR_CUE_REVIEW_REQUIRED",null));
    }

    private Selected selected(Ep002FactoryReadinessBridgeService.ShotReadiness source) {
        if(source.preferredTakeId()==null)return null;
        try {
            return jdbc.sql("""
                    select id,revision,narration_sha256,
                           duration_seconds,elevenlabs_alignment::text as alignment
                      from ep002_creative_voice_take
                     where id=:id and shot_key=:shot and revision=:revision
                    """).param("id",UUID.fromString(source.preferredTakeId()))
                    .param("shot",source.shotKey()).param("revision",source.scriptRevision())
                    .query((rs,n)->new Selected(
                            rs.getObject("id",UUID.class),rs.getInt("revision"),
                            rs.getString("narration_sha256"),
                            rs.getBigDecimal("duration_seconds"),rs.getString("alignment")))
                    .optional().orElse(null);
        }catch(IllegalArgumentException invalid) {
            return null;
        }
    }

    private String json(Object value) {
        try{return mapper.writeValueAsString(value);}
        catch(Exception failed){throw conflict("Cannot serialize verified voice timings.");}
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);
    }
    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
