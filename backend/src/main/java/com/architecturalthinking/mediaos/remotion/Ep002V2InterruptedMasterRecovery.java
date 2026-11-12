package com.architecturalthinking.mediaos.remotion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public final class Ep002V2InterruptedMasterRecovery {
    private static final Logger log=LoggerFactory.getLogger(Ep002V2InterruptedMasterRecovery.class);
    private static final UUID TARGET=UUID.fromString("6f5957be-26e4-45b8-b680-e250dcd134a0");
    private static final String ORIGINAL_WORKER_SHA="a283e67496191d15efbdaed9b363f5fed3e32c0b";
    private static final String AUTHORIZATION="DIRECTOR_CHAT_2026_11_12_EP002_V2_FINAL_EXACT_FRAME_QA_REPAIR_ONE_TIME";
    private static final String SHOT10="96e427d2-b518-47c0-a287-59ea42cfab52";

    private final JdbcClient jdbc;
    private final boolean directorApproved;
    private final String backendReleaseSha;

    public Ep002V2InterruptedMasterRecovery(JdbcClient jdbc,
        @Value("${MEDIAOS_EP002_V2_INTERRUPTED_WORKER_RECOVERY_ONCE:false}") boolean directorApproved,
        @Value("${MEDIAOS_EP002_V2_RECOVERY_RELEASE_SHA:}") String backendReleaseSha) {
        this.jdbc=jdbc;
        this.directorApproved=directorApproved;
        this.backendReleaseSha=backendReleaseSha;
    }

    @Scheduled(initialDelay=15000,fixedDelay=60000)
    public void recoverOneKnownInterruptedDirectorJob() {
        if(!directorApproved||!backendReleaseSha.matches("[a-f0-9]{40}")
            ||!backendReleaseSha.equals(System.getenv("RAILWAY_GIT_COMMIT_SHA")))
            return;
        try {
            int updated=jdbc.sql("""
                update remotion_render r
                   set status='QUEUED',
                       progress=0,
                       worker_id=null,
                       claimed_at=null,
                       started_at=null,
                       error='EP002 V2 one-time exact interrupted Railway worker recovery',
                       updated_at=now(),
                       input_props=jsonb_set(r.input_props::jsonb,
                            '{interruptedWorkerRecoveryOnce}', 'true'::jsonb, true)
                 where r.id=:id and r.project_id=:project
                   and r.status='RUNNING'
                   and r.worker_id is not null
                   and r.updated_at < now() - interval '120 seconds'
                   and r.composition_id='EP002-DIRECTOR-MASTER'
                   and r.profile='REVIEW'
                   and r.width=1920 and r.height=1080 and r.fps=30
                   and r.duration_in_frames=24046
                   and r.input_props->>'authorizationSource'=:auth
                   and r.input_props->>'expectedSourceCommit'=:workerSha
                   and r.input_props->>'shot10RenderId'=:shot10
                   and r.input_props->>'masterMode'='DIRECTOR_V2_60_FRAME_BREATHS'
                   and r.input_props->>'directorPaidCpuConfirmed'='true'
                   and r.input_props->>'breathingFramesPerSeam'='60'
                   and r.input_props->>'breathingSeams'='10'
                   and jsonb_array_length(r.input_props::jsonb->'sourceRenderIds')=11
                   and r.input_props::jsonb->'sourceRenderIds'->>9=:shot10
                   and coalesce(r.input_props->>'interruptedWorkerRecoveryOnce','false')='false'
                """).param("id",TARGET)
                .param("project",Ep002DirectorMasterController.PROJECT_ID)
                .param("auth",AUTHORIZATION)
                .param("workerSha",ORIGINAL_WORKER_SHA)
                .param("shot10",SHOT10)
                .update();
            if(updated==1)
                log.info("EP002_V2_INTERRUPTED_MASTER_REQUEUED renderId={} exactSourceSha={} originalElevenSources=11 breathingSeams=10",
                    TARGET,ORIGINAL_WORKER_SHA);
        } catch(Exception e) {
            log.error("EP002_V2_EXACT_INTERRUPTED_MASTER_RECOVERY_BLOCKED {}",
                e.getClass().getSimpleName());
        }
    }
}
