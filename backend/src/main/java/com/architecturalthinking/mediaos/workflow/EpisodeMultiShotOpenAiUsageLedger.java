package com.architecturalthinking.mediaos.workflow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class EpisodeMultiShotOpenAiUsageLedger {
    private final JdbcClient jdbc;
    private final boolean providerDispatchEnabled;

    public EpisodeMultiShotOpenAiUsageLedger(
            JdbcClient jdbc,
            @Value("${mediaos.episode-executor.provider-dispatch-enabled:false}")
            boolean providerDispatchEnabled) {
        this.jdbc=jdbc;
        this.providerDispatchEnabled=providerDispatchEnabled;
    }

    record Limits(String state,BigDecimal usd,int tokens,int attempts) {}
    record Totals(BigDecimal atRiskUsd,long atRiskTokens,long attempts,boolean hasUnresolved) {}
    record Reservation(UUID requestId,UUID jobId,int attemptNumber,
                       String shotKey,BigDecimal reservedUsd,int reservedTokens) {}

    static void assertCanReserve(Limits limits,Totals totals,
                                 BigDecimal reserveUsd,int reserveTokens) {
        if(!"RUNNING".equals(limits.state()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No verified running agent job is connected to the paid provider.");
        if(totals.hasUnresolved())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Prior paid OpenAI attempt is unresolved. Never auto-retry.");
        if(reserveUsd==null || reserveUsd.scale()>4 || reserveUsd.signum()<=0
                || reserveTokens<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A bounded maximum USD and token reservation is required.");
        if(totals.attempts()>=limits.attempts()
                || totals.atRiskUsd().add(reserveUsd).compareTo(limits.usd())>0
                || totals.atRiskTokens()+reserveTokens>limits.tokens())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "OpenAI USD, token or total-attempt ceiling reached; no paid call permitted.");
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    Reservation reserve(UUID jobId,UUID requestId,String shotKey,
                        BigDecimal estimatedMaxUsd,int estimatedMaxTokens) {
        if(!providerDispatchEnabled)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "OpenAI provider dispatch is disabled by the backend; no tokens can be spent.");
        if(jobId==null || requestId==null || shotKey==null
                || !shotKey.matches("SHOT(0[1-9]|[1-3][0-9]|40)"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Verified job, request and SHOT identity are required.");

        Limits limits=jdbc.sql("""
                select state,max_budget_usd,max_total_tokens,max_attempts
                  from episode_multi_shot_execution_job
                 where id=:job for update
                """).param("job",jobId)
                .query((rs,n)->new Limits(rs.getString("state"),
                        rs.getBigDecimal("max_budget_usd"),
                        rs.getInt("max_total_tokens"),rs.getInt("max_attempts")))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "OpenAI job does not exist."));

        boolean validShot=jdbc.sql("""
                select exists(select 1 from episode_multi_shot_execution_task
                  where job_id=:job and shot_key=:shot and task_state='RUNNING')
                """).param("job",jobId).param("shot",shotKey).query(Boolean.class).single();
        if(!validShot)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only a vetted running SHOT task can reserve OpenAI usage.");
        boolean previouslyUsed=jdbc.sql("""
                select exists(select 1 from episode_multi_shot_openai_usage
                  where request_id=:request)
                """).param("request",requestId).query(Boolean.class).single();
        if(previouslyUsed)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Paid request ID was already recorded; never repeat the OpenAI call.");

        Totals totals=totals(jobId);
        assertCanReserve(limits,totals,estimatedMaxUsd,estimatedMaxTokens);

        int attempt=Math.toIntExact(totals.attempts()+1);
        jdbc.sql("""
                insert into episode_multi_shot_openai_usage(
                    request_id,job_id,attempt_number,shot_key,
                    reserved_usd,reserved_tokens,status
                ) values(:id,:job,:attempt,:shot,:usd,:tokens,'RESERVED')
                """).param("id",requestId).param("job",jobId)
                .param("attempt",attempt).param("shot",shotKey)
                .param("usd",estimatedMaxUsd).param("tokens",estimatedMaxTokens).update();
        return new Reservation(requestId,jobId,attempt,shotKey,estimatedMaxUsd,
                estimatedMaxTokens);
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    void settle(UUID requestId,BigDecimal actualUsd,int actualTokens,
                String providerRequestId,boolean verifiedNoCharge) {
        if(requestId==null || actualUsd==null || actualUsd.signum()<0
                || actualUsd.scale()>4 || actualTokens<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Real provider usage must be measured before settlement.");
        if(verifiedNoCharge && (actualUsd.signum()!=0 || actualTokens!=0))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No-charge settlement requires verified zero provider usage.");

        UUID jobId=jobFor(requestId);
        Limits job=lockJob(jobId);
        record Pending(String status,BigDecimal reservedUsd,int reservedTokens) {}
        Pending attempt=jdbc.sql("""
                select status,reserved_usd,reserved_tokens
                  from episode_multi_shot_openai_usage
                 where request_id=:id for update
                """).param("id",requestId)
                .query((rs,n)->new Pending(rs.getString("status"),
                        rs.getBigDecimal("reserved_usd"),rs.getInt("reserved_tokens")))
                .single();
        if(!"RESERVED".equals(attempt.status()) && !"UNCERTAIN".equals(attempt.status()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This OpenAI attempt has already been settled.");

        jdbc.sql("""
                update episode_multi_shot_openai_usage
                   set status=:state,measured_usd=:usd,measured_tokens=:tokens,
                       provider_request_id=:provider,reconciled_at=now()
                 where request_id=:id and status in ('RESERVED','UNCERTAIN')
                """).param("id",requestId).param("state",verifiedNoCharge?"NO_CHARGE":"SETTLED")
                .param("usd",actualUsd).param("tokens",actualTokens)
                .param("provider",providerRequestId).update();

        Totals totals=totals(jobId);
        if(actualUsd.compareTo(attempt.reservedUsd())>0
                || actualTokens>attempt.reservedTokens()
                || totals.atRiskUsd().compareTo(job.usd())>0
                || totals.atRiskTokens()>job.tokens()) {
            jdbc.sql("""
                    update episode_multi_shot_execution_job
                       set state='STOPPED_BUDGET'
                     where id=:job and state in ('RUNNING','STOPPED_UNCERTAIN')
                    """).param("job",jobId).update();
        }
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    void markUncertain(UUID requestId) {
        UUID jobId=jobFor(requestId);
        lockJob(jobId);
        jdbc.sql("""
                update episode_multi_shot_openai_usage set status='UNCERTAIN'
                 where request_id=:id and status='RESERVED'
                """).param("id",requestId).update();
        jdbc.sql("""
                update episode_multi_shot_execution_job set state='STOPPED_UNCERTAIN'
                 where id=:job and state='RUNNING'
                """).param("job",jobId).update();
    }

    private UUID jobFor(UUID requestId) {
        if(requestId==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Request ID required.");
        return jdbc.sql("""
                select job_id from episode_multi_shot_openai_usage where request_id=:id
                """).param("id",requestId).query(UUID.class)
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "OpenAI attempt was never reserved."));
    }

    private Limits lockJob(UUID jobId) {
        return jdbc.sql("""
                select state,max_budget_usd,max_total_tokens,max_attempts
                  from episode_multi_shot_execution_job where id=:job for update
                """).param("job",jobId)
                .query((rs,n)->new Limits(rs.getString("state"),
                        rs.getBigDecimal("max_budget_usd"),
                        rs.getInt("max_total_tokens"),rs.getInt("max_attempts")))
                .single();
    }

    private Totals totals(UUID jobId) {
        return jdbc.sql("""
                select coalesce(sum(case when status='NO_CHARGE' then 0
                        else coalesce(measured_usd,reserved_usd) end),0) as at_risk_usd,
                       coalesce(sum(case when status='NO_CHARGE' then 0
                        else coalesce(measured_tokens,reserved_tokens) end),0) as at_risk_tokens,
                       count(*) as attempts,
                       coalesce(bool_or(status in ('RESERVED','UNCERTAIN')),false) as unresolved
                  from episode_multi_shot_openai_usage where job_id=:job
                """).param("job",jobId)
                .query((rs,n)->new Totals(
                        rs.getBigDecimal("at_risk_usd"),
                        rs.getLong("at_risk_tokens"),rs.getLong("attempts"),
                        rs.getBoolean("unresolved"))).single();
    }
}
