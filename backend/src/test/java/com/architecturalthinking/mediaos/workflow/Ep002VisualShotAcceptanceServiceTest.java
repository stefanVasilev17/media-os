package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002VisualShotAcceptanceServiceTest {
    private Ep002SequentialVisualPreflightService.Preflight blocked() {
        JdbcClient jdbc=mock(JdbcClient.class,RETURNS_DEEP_STUBS);
        var mapper=new ObjectMapper();
        var batch=new Ep002EpisodeBatchPlanService(jdbc,mapper);
        var bridge=new Ep002FactoryReadinessBridgeService(jdbc,batch,mapper);
        return Ep002SequentialVisualPreflightService.project(
                bridge.project(batch.snapshot(),Map.of(),Set.of()),Set.of("SHOT01"));
    }

    @Test
    void refusesToApproveBeforeActualVerifiedVoiceCues() {
        var state=blocked();
        var request=new Ep002VisualShotAcceptanceService.Request(
                UUID.randomUUID(),state.inputFingerprint(),"SHOT02",
                UUID.randomUUID(),42,"a".repeat(40),"b".repeat(40),
                "c".repeat(64),true);
        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class,
                        ()->Ep002VisualShotAcceptanceService.requireInput(request,state))
                        .getStatusCode());
        assertEquals("SHOT02",state.nextShotKey());
    }

    @Test
    void rejectsAttemptToSkipShot02OrApproveLockedShot01() {
        var state=blocked();
        for(String key:new String[]{"SHOT01","SHOT03"}) {
            var request=new Ep002VisualShotAcceptanceService.Request(
                    UUID.randomUUID(),state.inputFingerprint(),key,
                    UUID.randomUUID(),42,"a".repeat(40),"b".repeat(40),
                    "c".repeat(64),true);
            assertEquals(HttpStatus.CONFLICT,
                    assertThrows(ResponseStatusException.class,
                            ()->Ep002VisualShotAcceptanceService.requireInput(request,state))
                            .getStatusCode());
        }
    }

    @Test
    void requiresRealDirectorConfirmationAndMatchingCurrentFingerprint() {
        var state=blocked();
        var unconfirmed=new Ep002VisualShotAcceptanceService.Request(
                UUID.randomUUID(),state.inputFingerprint(),"SHOT02",
                UUID.randomUUID(),42,"a".repeat(40),"b".repeat(40),
                "c".repeat(64),false);
        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class,
                        ()->Ep002VisualShotAcceptanceService.requireInput(unconfirmed,state))
                        .getStatusCode());
        var stale=new Ep002VisualShotAcceptanceService.Request(
                UUID.randomUUID(),"0".repeat(64),"SHOT02",
                UUID.randomUUID(),42,"a".repeat(40),"b".repeat(40),
                "c".repeat(64),true);
        assertEquals(HttpStatus.CONFLICT,
                assertThrows(ResponseStatusException.class,
                        ()->Ep002VisualShotAcceptanceService.requireInput(stale,state))
                        .getStatusCode());
    }
}
