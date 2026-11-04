package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class EpisodeAiProductionAuthorizationService {
    public static final String PURPOSE = "SCOPED_REMOTION_SCENE_PROPOSALS";
    public static final String REPOSITORY = "stefanVasilev17/media-os";
    private final JdbcClient jdbc;
    private final EpisodePackageVoiceReadinessService readiness;
    private final ObjectMapper mapper;

    public EpisodeAiProductionAuthorizationService(
            JdbcClient jdbc, EpisodePackageVoiceReadinessService readiness,
            ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.readiness = readiness;
        this.mapper = mapper;
    }

    public record AuthorizeRequest(UUID requestId, String expectedReadinessFingerprint,
                                   BigDecimal maxBudgetUsd, Integer maxTotalTokens,
                                   Integer maxAttempts, Integer validityMinutes,
                                   Boolean confirmDirectorAiBudget) {}

    public record Authorization(UUID authorizationId, UUID requestId, UUID packageId,
                                String state, String effectiveStatus, String sourceSha256,
                                String readinessFingerprint, List<String> shotKeys,
                                String repository, String codePathPrefix, String purpose,
                                BigDecimal maxBudgetUsd, int maxTotalTokens,
                                int maxAttempts, int validityMinutes, String createdAt,
                                String expiresAt, boolean matchesCurrentReadiness,
                                boolean canStartAgent, boolean executorConnected) {}

    public record Overview(UUID packageId,String episodeKey,String voiceReadinessState,
                           int readyShots,int totalShots,String currentReadinessFingerprint,
                           boolean eligibleForBudgetApproval,boolean executorConnected,
                           boolean canStartAgent,List<Authorization> authorizations) {}

    record Stored(UUID id,UUID requestId,UUID packageId,String state,
                  String sourceSha256,String fingerprint,String jsonShotKeys,
                  String repo,String path,String purpose,BigDecimal budget,
                  int tokens,int attempts,int minutes,OffsetDateTime created,
                  OffsetDateTime expires,String issuer,String subject) {}

    public static void validateConsent(AuthorizeRequest request) {
        if (request==null || request.requestId()==null ||
                !Boolean.TRUE.equals(request.confirmDirectorAiBudget()) ||
                request.expectedReadinessFingerprint()==null ||
                !request.expectedReadinessFingerprint().matches("[a-f0-9]{64}"))
            throw bad("A unique request ID, current readiness fingerprint and explicit Director approval are required.");
        BigDecimal amount=request.maxBudgetUsd();
        if(amount==null || amount.scale()>2 || amount.compareTo(new BigDecimal("1.00"))<0 ||
                amount.compareTo(new BigDecimal("50.00"))>0)
            throw bad("OpenAI budget must be between $1.00 and $50.00 with at most two decimal places.");
        if(request.maxTotalTokens()==null || request.maxTotalTokens()<1000 ||
                request.maxTotalTokens()>1000000)
            throw bad("Maximum total tokens must be between 1,000 and 1,000,000.");
        if(request.maxAttempts()==null || request.maxAttempts()<1 || request.maxAttempts()>10)
            throw bad("Maximum OpenAI agent attempts must be between 1 and 10.");
        if(request.validityMinutes()==null || request.validityMinutes()<15 ||
                request.validityMinutes()>240)
            throw bad("Authorization must expire in 15 to 240 minutes.");
    }

    static void requireReady(EpisodePackageVoiceReadinessService.EpisodeReadiness current,
                             String expectedFingerprint) {
        if(current==null || current.totalShots()<1 || !current.eligibleForAiBudgetReview()
                || current.readyShots()!=current.totalShots() ||
                current.unresolvedPaidAttempts()!=0 ||
                !"READY_FOR_DIRECTOR_AI_AUTHORIZATION".equals(current.state()))
            throw conflict("Every active SHOT must have an approved current Take and verified audio cues.");
        if(!current.readinessFingerprint().equals(expectedFingerprint))
            throw conflict("Voice/readiness inputs changed. Refresh the episode before authorizing a budget.");
    }

    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    public Overview overview(UUID packageId) {
        var current=readiness.report(packageId);
        var actor=DirectorIdentity.requireDirector();
        List<Authorization> history=jdbc.sql("""
                select * from episode_ai_production_authorization
                 where package_id=:package and director_issuer=:issuer
                   and director_subject=:subject
                 order by created_at desc,id desc limit 10
                """).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->view(mapRow(rs),current)).list();
        boolean alreadyPending=history.stream()
                .anyMatch(a->"AUTHORIZED_PENDING_EXECUTOR".equals(a.effectiveStatus()));
        return new Overview(packageId,current.episodeKey(),current.state(),
                current.readyShots(),current.totalShots(),current.readinessFingerprint(),
                current.eligibleForAiBudgetReview()&&!alreadyPending,
                false,false,history);
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public Authorization authorize(UUID packageId, AuthorizeRequest input, UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        validateConsent(input);
        if(auditId==null)throw conflict("An audited Director preflight is required.");

        lockAllShotRows(packageId);
        var current=readiness.report(packageId);
        requireReady(current,input.expectedReadinessFingerprint());

        Stored replay=jdbc.sql("""
                select * from episode_ai_production_authorization
                 where request_id=:request
                """).param("request",input.requestId())
                .query((rs,n)->mapRow(rs)).optional().orElse(null);
        if(replay!=null) {
            requireMatchingReplay(replay,input,packageId,actor);
            return view(replay,current);
        }

        jdbc.sql("""
                update episode_ai_production_authorization set state='EXPIRED'
                 where package_id=:package and state='AUTHORIZED_PENDING_EXECUTOR'
                   and expires_at<=now()
                """).param("package",packageId).update();
        boolean hasActive=jdbc.sql("""
                select exists(select 1 from episode_ai_production_authorization
                 where package_id=:package and state='AUTHORIZED_PENDING_EXECUTOR')
                """).param("package",packageId).query(Boolean.class).single();
        if(hasActive)throw conflict("An authorization already exists. Revoke it before approving a new one.");

        String jsonShots=json(current.shots().stream()
                .map(EpisodePackageVoiceReadinessService.ShotReadiness::shotKey).toList());
        String sourceDir=codePrefix(current.episodeKey());
        UUID id=UUID.randomUUID();
        jdbc.sql("""
                insert into episode_ai_production_authorization(
                    id,request_id,package_id,source_sha256,readiness_fingerprint,
                    shot_keys,repository_full_name,code_path_prefix,purpose,
                    max_budget_usd,max_total_tokens,max_attempts,validity_minutes,
                    state,director_issuer,director_subject,preflight_audit_id,expires_at
                ) values(
                    :id,:request,:package,:source,:fingerprint,cast(:shots as jsonb),
                    :repo,:prefix,:purpose,:usd,:tokens,:attempts,:minutes,
                    'AUTHORIZED_PENDING_EXECUTOR',:issuer,:subject,:audit,
                    now() + (:minutes * interval '1 minute')
                )
                """)
                .param("id",id).param("request",input.requestId())
                .param("package",packageId)
                .param("source",current.sourceSha256())
                .param("fingerprint",current.readinessFingerprint())
                .param("shots",jsonShots).param("repo",REPOSITORY)
                .param("prefix",sourceDir).param("purpose",PURPOSE)
                .param("usd",input.maxBudgetUsd()).param("tokens",input.maxTotalTokens())
                .param("attempts",input.maxAttempts())
                .param("minutes",input.validityMinutes())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .param("audit",auditId)
                .update();

        Stored stored=jdbc.sql("""
                select * from episode_ai_production_authorization where id=:id
                """).param("id",id).query((rs,n)->mapRow(rs)).single();
        return view(stored,current);
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public Authorization revoke(UUID packageId,UUID authorizationId,UUID auditId,
                                Boolean confirmRevoke) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        if(auditId==null || !Boolean.TRUE.equals(confirmRevoke))
            throw bad("Director confirmation and audited preflight are required to revoke.");
        lockAllShotRows(packageId);
        var current=readiness.report(packageId);
        Stored stored=jdbc.sql("""
                select * from episode_ai_production_authorization
                 where id=:id and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                 for update
                """).param("id",authorizationId).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->mapRow(rs))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Director authorization was not found."));
        if("AUTHORIZED_PENDING_EXECUTOR".equals(stored.state())) {
            jdbc.sql("""
                    update episode_ai_production_authorization
                    set state='REVOKED',revoked_at=now()
                    where id=:id and state='AUTHORIZED_PENDING_EXECUTOR'
                    """).param("id",authorizationId).update();
        } else if(!"REVOKED".equals(stored.state()))
            throw conflict("This authorization can no longer be revoked.");
        Stored updated=jdbc.sql("""
                select * from episode_ai_production_authorization where id=:id
                """).param("id",authorizationId).query((rs,n)->mapRow(rs)).single();
        return view(updated,current);
    }

    private void lockAllShotRows(UUID packageId) {
        jdbc.sql("""
                select s.id from episode_package_shot s
                 where s.package_id=:package order by s.shot_index for update
                """).param("package",packageId).query(UUID.class).list();
    }

    private static String codePrefix(String episodeKey) {
        if(episodeKey==null || !episodeKey.matches("EP[0-9]{3,}"))
            throw conflict("Invalid episode key for protected Remotion source scope.");
        return "remotion-engine/src/episodes/"+episodeKey.toLowerCase(Locale.ROOT)+"/";
    }

    private static void requireMatchingReplay(Stored prior,AuthorizeRequest input,
                                              UUID packageId,DirectorIdentity.Actor actor) {
        if(!prior.packageId().equals(packageId) ||
                !prior.issuer().equals(actor.issuer()) ||
                !prior.subject().equals(actor.subject()) ||
                !prior.fingerprint().equals(input.expectedReadinessFingerprint()) ||
                prior.budget().compareTo(input.maxBudgetUsd())!=0 ||
                prior.tokens()!=input.maxTotalTokens() ||
                prior.attempts()!=input.maxAttempts() ||
                prior.minutes()!=input.validityMinutes())
            throw conflict("This Director request ID was already used for another budget or episode.");
    }

    private Authorization view(Stored s,EpisodePackageVoiceReadinessService.EpisodeReadiness current) {
        boolean same=s.fingerprint().equals(current.readinessFingerprint())
                && s.sourceSha256().equals(current.sourceSha256())
                && current.eligibleForAiBudgetReview();
        String status=effectiveStatus(s.state(),s.expires(),OffsetDateTime.now(ZoneOffset.UTC),same);
        List<String> keys;
        try {keys=mapper.readValue(s.jsonShotKeys(),mapper.getTypeFactory()
                .constructCollectionType(List.class,String.class));}
        catch(JsonProcessingException badJson) {throw new IllegalStateException("Stored scope is invalid.",badJson);}
        return new Authorization(s.id(),s.requestId(),s.packageId(),
                s.state(),status,s.sourceSha256(),s.fingerprint(),keys,s.repo(),
                s.path(),s.purpose(),s.budget(),s.tokens(),s.attempts(),
                s.minutes(),s.created().toString(),s.expires().toString(),
                same,false,false);
    }

    static String effectiveStatus(String state,OffsetDateTime expires,
                                  OffsetDateTime now,boolean fingerprintMatches) {
        if(!"AUTHORIZED_PENDING_EXECUTOR".equals(state))return state;
        if(!now.isBefore(expires))return "EXPIRED";
        if(!fingerprintMatches)return "STALE_READINESS";
        return "AUTHORIZED_PENDING_EXECUTOR";
    }

    private String json(List<String> values) {
        try {return mapper.writeValueAsString(values);}
        catch(JsonProcessingException impossible) {throw new IllegalStateException(impossible);}
    }

    private static Stored mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Stored(rs.getObject("id",UUID.class),
                rs.getObject("request_id",UUID.class),
                rs.getObject("package_id",UUID.class),
                rs.getString("state"),rs.getString("source_sha256"),
                rs.getString("readiness_fingerprint"),
                rs.getString("shot_keys"),rs.getString("repository_full_name"),
                rs.getString("code_path_prefix"),rs.getString("purpose"),
                rs.getBigDecimal("max_budget_usd"),rs.getInt("max_total_tokens"),
                rs.getInt("max_attempts"),rs.getInt("validity_minutes"),
                rs.getObject("created_at",OffsetDateTime.class),
                rs.getObject("expires_at",OffsetDateTime.class),
                rs.getString("director_issuer"),rs.getString("director_subject"));
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
