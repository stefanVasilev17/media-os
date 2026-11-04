package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeAiProductionAuthorizationServiceTest {
    private static final String HASH="a".repeat(64);

    private static EpisodeAiProductionAuthorizationService.AuthorizeRequest request(
            BigDecimal amount,Integer tokens,Integer attempts,Integer minutes,Boolean approved) {
        return new EpisodeAiProductionAuthorizationService.AuthorizeRequest(
                UUID.randomUUID(),HASH,amount,tokens,attempts,minutes,approved);
    }

    private static EpisodePackageVoiceReadinessService.EpisodeReadiness readiness(
            int ready,int total,String fingerprint,boolean eligible) {
        return new EpisodePackageVoiceReadinessService.EpisodeReadiness(
                UUID.randomUUID(),"EP003","b".repeat(64),fingerprint,
                eligible?"READY_FOR_DIRECTOR_AI_AUTHORIZATION":"PARTIALLY_READY",
                total,ready,ready,total-ready,0,eligible,false,false,
                "No paid call.",List.of());
    }

    @Test
    void directorMustApproveExactFingerprintAndBoundedUsdTokensAndAttempts() {
        EpisodeAiProductionAuthorizationService.validateConsent(
                request(new BigDecimal("5.00"),100000,3,60,true));
        for(var invalid:List.of(
                request(new BigDecimal("0.99"),100000,3,60,true),
                request(new BigDecimal("50.01"),100000,3,60,true),
                request(new BigDecimal("10.999"),100000,3,60,true),
                request(new BigDecimal("5.00"),999,3,60,true),
                request(new BigDecimal("5.00"),1000001,3,60,true),
                request(new BigDecimal("5.00"),100000,0,60,true),
                request(new BigDecimal("5.00"),100000,11,60,true),
                request(new BigDecimal("5.00"),100000,3,14,true),
                request(new BigDecimal("5.00"),100000,3,241,true),
                request(new BigDecimal("5.00"),100000,3,60,false)
        )) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                            ()->EpisodeAiProductionAuthorizationService.validateConsent(invalid))
                            .getStatusCode());
        }
    }

    @Test
    void absentConsentAndMalformedFingerprintAreNotAccepted() {
        var normal=request(new BigDecimal("3.00"),15000,2,30,true);
        var missingId=new EpisodeAiProductionAuthorizationService.AuthorizeRequest(
                null,HASH,new BigDecimal("3.00"),15000,2,30,true);
        var wrongHash=new EpisodeAiProductionAuthorizationService.AuthorizeRequest(
                normal.requestId(),"invalid",new BigDecimal("3.00"),15000,2,30,true);
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                        ()->EpisodeAiProductionAuthorizationService.validateConsent(null)).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                        ()->EpisodeAiProductionAuthorizationService.validateConsent(missingId)).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                        ()->EpisodeAiProductionAuthorizationService.validateConsent(wrongHash)).getStatusCode());
    }

    @Test
    void anyNotReadyShotBlocksBudgetAuthorization() {
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeAiProductionAuthorizationService.requireReady(
                        readiness(10,11,HASH,false),HASH)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeAiProductionAuthorizationService.requireReady(
                        readiness(0,11,HASH,false),HASH)).getStatusCode());
    }

    @Test
    void changingSelectedTakeOrNarrationFingerprintBlocksStaleConsent() {
        var verified=readiness(11,11,HASH,true);
        EpisodeAiProductionAuthorizationService.requireReady(verified,HASH);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeAiProductionAuthorizationService.requireReady(
                        verified,"f".repeat(64))).getStatusCode());
    }

    @Test
    void expiryAndStaleInputCannotRetainActiveApproval() {
        OffsetDateTime now=OffsetDateTime.now(ZoneOffset.UTC);
        assertEquals("AUTHORIZED_PENDING_EXECUTOR",
                EpisodeAiProductionAuthorizationService.effectiveStatus(
                        "AUTHORIZED_PENDING_EXECUTOR",now.plusMinutes(30),now,true));
        assertEquals("STALE_READINESS",
                EpisodeAiProductionAuthorizationService.effectiveStatus(
                        "AUTHORIZED_PENDING_EXECUTOR",now.plusMinutes(30),now,false));
        assertEquals("EXPIRED",
                EpisodeAiProductionAuthorizationService.effectiveStatus(
                        "AUTHORIZED_PENDING_EXECUTOR",now.minusSeconds(1),now,true));
        assertEquals("REVOKED",
                EpisodeAiProductionAuthorizationService.effectiveStatus(
                        "REVOKED",now.plusMinutes(30),now,true));
        assertEquals("CONSUMED",
                EpisodeAiProductionAuthorizationService.effectiveStatus(
                        "CONSUMED",now.plusMinutes(30),now,true));
    }
}
