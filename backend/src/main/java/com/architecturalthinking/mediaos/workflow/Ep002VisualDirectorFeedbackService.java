package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class Ep002VisualDirectorFeedbackService {
    private static final Set<String> CHANGE_AREAS=Set.of(
            "CAMERA","MOTION","LAYOUT","COLOR","TEXT",
            "TIMING","AUDIO","TRANSITION","OTHER");
    private final JdbcClient jdbc;
    private final Ep002SequentialVisualPreflightService preflight;

    public Ep002VisualDirectorFeedbackService(
            JdbcClient jdbc,Ep002SequentialVisualPreflightService preflight) {
        this.jdbc=jdbc;
        this.preflight=preflight;
    }

    public record SubmitRequest(
            UUID requestId,String expectedEpisodeFingerprint,String shotKey,
            String changeArea,String problemObserved,String requestedCorrection,
            Boolean confirmDirectorFeedback) {}

    public record Feedback(
            UUID id,UUID requestId,String shotKey,String state,
            String episodeInputFingerprint,int scriptRevision,String narrationSha256,
            String selectedTakeId,String changeArea,String problemObserved,
            String requestedCorrection,String createdAt,
            @com.fasterxml.jackson.annotation.JsonIgnore String directorIssuer,
            @com.fasterxml.jackson.annotation.JsonIgnore String directorSubject) {}

    static void validate(SubmitRequest input) {
        if(input==null || input.requestId()==null
                || !Boolean.TRUE.equals(input.confirmDirectorFeedback())
                || input.shotKey()==null
                || !input.shotKey().matches("SHOT(0[2-9]|1[01])")
                || input.expectedEpisodeFingerprint()==null
                || !input.expectedEpisodeFingerprint().matches("[a-f0-9]{64}")
                || !CHANGE_AREAS.contains(input.changeArea())
                || input.problemObserved()==null
                || input.problemObserved().trim().length()<12
                || input.problemObserved().trim().length()>2000
                || input.requestedCorrection()==null
                || input.requestedCorrection().trim().length()<12
                || input.requestedCorrection().trim().length()>4000) {
            throw bad("EP002 visual feedback requires one valid current SHOT, "
                    +"explicit Director confirmation and a concrete problem/correction.");
        }
    }

    static void assertCurrentTarget(
            SubmitRequest input,Ep002SequentialVisualPreflightService.Preflight current) {
        if(current==null || current.candidate()==null
                || !"EP002".equals(current.episodeKey())
                || !input.expectedEpisodeFingerprint().equals(current.inputFingerprint())
                || !input.shotKey().equals(current.nextShotKey())
                || !input.shotKey().equals(current.candidate().shotKey())) {
            throw conflict("EP002 episode inputs changed, or this is not the next unaccepted SHOT.");
        }
    }

    static Feedback replay(Feedback stored,SubmitRequest request,
                           DirectorIdentity.Actor actor) {
        if(stored==null || !Objects.equals(stored.requestId(),request.requestId())
                || !stored.directorIssuer().equals(actor.issuer())
                || !stored.directorSubject().equals(actor.subject())
                || !stored.episodeInputFingerprint().equals(request.expectedEpisodeFingerprint())
                || !stored.shotKey().equals(request.shotKey())
                || !stored.changeArea().equals(request.changeArea())
                || !stored.problemObserved().equals(request.problemObserved().trim())
                || !stored.requestedCorrection().equals(request.requestedCorrection().trim())) {
            throw conflict("Visual feedback request UUID was reused with changed inputs or actor.");
        }
        return stored;
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public List<Feedback> list() {
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select id,request_id,shot_key,state,episode_input_fingerprint,
                       script_revision,narration_sha256,selected_take_id::text,
                       change_area,problem_observed,requested_correction,
                       created_at::text,director_issuer,director_subject
                  from ep002_visual_director_feedback
                 where episode_key='EP002' and director_issuer=:issuer
                   and director_subject=:subject
                 order by created_at desc,id desc limit 100
                """)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Feedback(
                        rs.getObject("id",UUID.class),
                        rs.getObject("request_id",UUID.class),
                        rs.getString("shot_key"),rs.getString("state"),
                        rs.getString("episode_input_fingerprint"),
                        rs.getInt("script_revision"),rs.getString("narration_sha256"),
                        rs.getString("selected_take_id"),rs.getString("change_area"),
                        rs.getString("problem_observed"),
                        rs.getString("requested_correction"),
                        rs.getString("created_at"),rs.getString("director_issuer"),
                        rs.getString("director_subject")))
                .list();
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public Feedback submit(SubmitRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        validate(request);
        if(auditId==null)throw conflict("Audited Director production preflight is required.");

        Feedback previous=find(request.requestId());
        if(previous!=null)return replay(previous,request,actor);

        var current=preflight.preview();
        assertCurrentTarget(request,current);
        var shot=current.candidate();
        try {
            jdbc.sql("""
                    insert into ep002_visual_director_feedback(
                        id,request_id,shot_key,episode_input_fingerprint,
                        script_revision,narration_sha256,selected_take_id,
                        change_area,problem_observed,requested_correction,
                        director_issuer,director_subject,preflight_audit_id
                    ) values(
                        :id,:request,:shot,:fingerprint,:revision,:narration,:take,
                        :area,:problem,:correction,:issuer,:subject,:audit
                    ) on conflict(request_id) do nothing
                    """)
                    .param("id",UUID.randomUUID())
                    .param("request",request.requestId())
                    .param("shot",shot.shotKey())
                    .param("fingerprint",current.inputFingerprint())
                    .param("revision",shot.narrationRevision())
                    .param("narration",shot.narrationSha256())
                    .param("take",shot.approvedTakeId()==null?null
                            :UUID.fromString(shot.approvedTakeId()))
                    .param("area",request.changeArea())
                    .param("problem",request.problemObserved().trim())
                    .param("correction",request.requestedCorrection().trim())
                    .param("issuer",actor.issuer())
                    .param("subject",actor.subject())
                    .param("audit",auditId)
                    .update();
        } catch(IllegalArgumentException invalid) {
            throw conflict("Current selected voice Take ID is invalid.");
        }
        Feedback result=find(request.requestId());
        if(result==null)throw conflict("Director feedback could not be stored.");
        return replay(result,request,actor);
    }

    private Feedback find(UUID requestId) {
        return jdbc.sql("""
                select id,request_id,shot_key,state,episode_input_fingerprint,
                       script_revision,narration_sha256,selected_take_id::text,
                       change_area,problem_observed,requested_correction,
                       created_at::text,director_issuer,director_subject
                  from ep002_visual_director_feedback
                 where request_id=:request
                """).param("request",requestId)
                .query((rs,n)->new Feedback(
                        rs.getObject("id",UUID.class),
                        rs.getObject("request_id",UUID.class),
                        rs.getString("shot_key"),rs.getString("state"),
                        rs.getString("episode_input_fingerprint"),
                        rs.getInt("script_revision"),rs.getString("narration_sha256"),
                        rs.getString("selected_take_id"),rs.getString("change_area"),
                        rs.getString("problem_observed"),
                        rs.getString("requested_correction"),
                        rs.getString("created_at"),rs.getString("director_issuer"),
                        rs.getString("director_subject")))
                .optional().orElse(null);
    }

    private static ResponseStatusException bad(String detail) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,detail);
    }

    private static ResponseStatusException conflict(String detail) {
        return new ResponseStatusException(HttpStatus.CONFLICT,detail);
    }
}
