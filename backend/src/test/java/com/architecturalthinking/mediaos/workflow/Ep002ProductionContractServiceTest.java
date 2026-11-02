package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class Ep002ProductionContractServiceTest {
    private Ep002ProductionContractService service() {
        return new Ep002ProductionContractService(mock(JdbcClient.class),new ObjectMapper());
    }

    @Test
    void validatesAllElevenApprovedShotsAndExactly59Beats() {
        var production=service();
        int total=0;
        for(int i=0;i<11;i++) {
            String expected=String.format("SHOT%02d",i+1);
            assertEquals(expected,production.sourceScript(i).path("shotKey").asText());
            var visual=production.sourceVisual(i);
            assertEquals(expected,visual.path("shotKey").asText());
            assertTrue(visual.path("beats").size()>=5);
            assertFalse(visual.path("cameraDirection").asText().isBlank());
            assertFalse(visual.path("truthContinuity").asText().isBlank());
            total+=visual.path("beats").size();
        }
        assertEquals(59,total);
        assertEquals("The Login That Keeps Waiting",
                production.sourceVisual(0).path("title").asText());
        assertEquals(5,production.sourceVisual(0).path("beats").size());
        assertEquals(40,production.sourceScript(0).path("editorialDurationSeconds").asInt());
    }

    @Test
    void neverAcceptsInvalidEpisodeShotKeys() {
        var production=service();
        for(String invalid : new String[]{"SHOT 01","SHOT00","SHOT12","SHOT01/../EP001","EP001"}) {
            assertThrows(ResponseStatusException.class,()->production.contract(invalid));
        }
    }

    @Test
    void calculatesStableButVersionAwareRenderDependencyHash() {
        UUID takeA=UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID takeB=UUID.fromString("00000000-0000-0000-0000-000000000002");
        String script=Ep002ProductionContractService.sha256("The real saved narration");
        String a=Ep002ProductionContractService.fingerprint("EP002","SHOT01",2,
                script,takeA,Ep002ProductionContractService.VISUAL_SHA);
        assertEquals(64,a.length());
        assertEquals(a,Ep002ProductionContractService.fingerprint("EP002","SHOT01",2,
                script,takeA,Ep002ProductionContractService.VISUAL_SHA));
        assertNotEquals(a,Ep002ProductionContractService.fingerprint("EP002","SHOT01",3,
                script,takeA,Ep002ProductionContractService.VISUAL_SHA));
        assertNotEquals(a,Ep002ProductionContractService.fingerprint("EP002","SHOT01",2,
                script,takeB,Ep002ProductionContractService.VISUAL_SHA));
        assertNotEquals(a,Ep002ProductionContractService.fingerprint("EP002","SHOT02",2,
                script,takeA,Ep002ProductionContractService.VISUAL_SHA));
    }

    @Test
    void rejectsInvalidOrUnmeasuredAudioDurationsInsteadOfInventingTimings() {
        assertEquals(new BigDecimal("42.347"),Ep002ProductionContractService.parseDuration("42.34671\n"));
        assertNull(Ep002ProductionContractService.parseDuration("N/A"));
        assertNull(Ep002ProductionContractService.parseDuration("0"));
        assertNull(Ep002ProductionContractService.parseDuration("-1"));
        assertNull(Ep002ProductionContractService.parseDuration("NaN"));
    }
}
