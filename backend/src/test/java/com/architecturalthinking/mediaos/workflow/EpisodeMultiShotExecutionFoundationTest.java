package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeMultiShotExecutionFoundationTest {
    private static final String HASH="a".repeat(64);

    @Test
    void prepareRequiresExplicitDirectorNoDispatchConsentAndCurrentInput() {
        EpisodeMultiShotExecutionService.validatePrepare(
                new EpisodeMultiShotExecutionService.PrepareRequest(
                        UUID.randomUUID(),UUID.randomUUID(),HASH,true));
        for(var value:List.of(
                new EpisodeMultiShotExecutionService.PrepareRequest(
                        UUID.randomUUID(),UUID.randomUUID(),HASH,false),
                new EpisodeMultiShotExecutionService.PrepareRequest(
                        UUID.randomUUID(),UUID.randomUUID(),"stale",true),
                new EpisodeMultiShotExecutionService.PrepareRequest(
                        UUID.randomUUID(),null,HASH,true),
                new EpisodeMultiShotExecutionService.PrepareRequest(
                        null,UUID.randomUUID(),HASH,true))) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                            ()->EpisodeMultiShotExecutionService.validatePrepare(value)).getStatusCode());
        }
    }

    @Test
    void currentUnexpiredSingleUseGrantMatchesFullOrderedShotScope() {
        var now=OffsetDateTime.now();
        var shots=List.of("SHOT01","SHOT02","SHOT03");
        EpisodeMultiShotExecutionService.requireCurrentGrant(
                "AUTHORIZED_PENDING_EXECUTOR",now.plusMinutes(15),
                now,true,shots,shots);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotExecutionService.requireCurrentGrant(
                        "CONSUMED",now.plusMinutes(15),now,true,shots,shots)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotExecutionService.requireCurrentGrant(
                        "REVOKED",now.plusMinutes(15),now,true,shots,shots)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotExecutionService.requireCurrentGrant(
                        "AUTHORIZED_PENDING_EXECUTOR",now.minusMinutes(1),
                        now,true,shots,shots)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotExecutionService.requireCurrentGrant(
                        "AUTHORIZED_PENDING_EXECUTOR",now.plusMinutes(15),
                        now,false,shots,shots)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotExecutionService.requireCurrentGrant(
                        "AUTHORIZED_PENDING_EXECUTOR",now.plusMinutes(15),
                        now,true,List.of("SHOT02","SHOT01","SHOT03"),shots)).getStatusCode());
    }

    private static EpisodeMultiShotOpenAiUsageLedger.Limits limits(String state) {
        return new EpisodeMultiShotOpenAiUsageLedger.Limits(
                state,new BigDecimal("5.00"),10000,3);
    }

    @Test
    void actualTokenAndUsdReservationsAreBoundedBeforeAnyExternalCall() {
        var totals=new EpisodeMultiShotOpenAiUsageLedger.Totals(
                new BigDecimal("1.0000"),2000,1,false);
        EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                limits("RUNNING"),totals,new BigDecimal("4.0000"),8000);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("RUNNING"),totals,new BigDecimal("4.0001"),8000)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("RUNNING"),totals,new BigDecimal("1.0000"),8001)).getStatusCode());
    }

    @Test
    void providerCostsRemainBlockedUntilActualExecutorIsConnected() {
        var totals=new EpisodeMultiShotOpenAiUsageLedger.Totals(
                BigDecimal.ZERO,0,0,false);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("PREPARED_NO_DISPATCH"),totals,
                        new BigDecimal("1.0000"),1000)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("CANCELLED"),totals,
                        new BigDecimal("1.0000"),1000)).getStatusCode());
    }

    @Test
    void unresolvedProviderCallPreventsAccidentalPaidRetry() {
        var unresolved=new EpisodeMultiShotOpenAiUsageLedger.Totals(
                new BigDecimal("1.0000"),2000,1,true);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("RUNNING"),unresolved,
                        new BigDecimal("1.0000"),500)).getStatusCode());
    }

    @Test
    void attemptCountIncludesNoChargeAndFailedAttempts() {
        var exhausted=new EpisodeMultiShotOpenAiUsageLedger.Totals(
                BigDecimal.ZERO,0,3,false);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("RUNNING"),exhausted,
                        new BigDecimal("1.0000"),1000)).getStatusCode());
    }

    @Test
    void rejectsUnboundedOrUnquantifiedUsageReservations() {
        var totals=new EpisodeMultiShotOpenAiUsageLedger.Totals(
                BigDecimal.ZERO,0,0,false);
        for(BigDecimal amount:List.of(BigDecimal.ZERO,new BigDecimal("-1.00"),
                new BigDecimal("1.00001"))){
            assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                    ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                            limits("RUNNING"),totals,amount,1000)).getStatusCode());
        }
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotOpenAiUsageLedger.assertCanReserve(
                        limits("RUNNING"),totals,new BigDecimal("1.00"),0)).getStatusCode());
    }
}
