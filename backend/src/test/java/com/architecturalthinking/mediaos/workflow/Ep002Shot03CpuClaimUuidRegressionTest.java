package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class Ep002Shot03CpuClaimUuidRegressionTest {
    private static final String EPISODE_FINGERPRINT="a".repeat(64);
    private static final String REAL_TAKE_ID="32e02d0c-acff-4dbb-8bde-81dd41901474";

    @Test
    void validFiveGroupTakeIdPassesSyntaxAndReachesLiveSourceCheck() {
        var episode=mock(Ep002FactoryReadinessBridgeService.class);
        when(episode.snapshot()).thenThrow(new IllegalStateException("Source must be rechecked"));
        var service=new Ep002DirectorVoiceCueService(
                mock(JdbcClient.class),new ObjectMapper(),episode);

        assertFalse(service.matchesCurrentShot03Render(
                EPISODE_FINGERPRINT,REAL_TAKE_ID,1,2076));

        verify(episode,times(1)).snapshot();
    }

    @Test
    void invalidFourGroupTakeIdIsRejectedBeforeSourceOrDatabaseAccess() {
        var episode=mock(Ep002FactoryReadinessBridgeService.class);
        var jdbc=mock(JdbcClient.class);
        var service=new Ep002DirectorVoiceCueService(jdbc,new ObjectMapper(),episode);

        assertFalse(service.matchesCurrentShot03Render(
                EPISODE_FINGERPRINT,"32e02d0c-acff-4dbb-81dd41901474",1,2076));

        verifyNoInteractions(episode,jdbc);
    }

    @Test
    void emptyFingerprintOrInvalidFramesFailBeforeSourceAccess() {
        var episode=mock(Ep002FactoryReadinessBridgeService.class);
        var jdbc=mock(JdbcClient.class);
        var service=new Ep002DirectorVoiceCueService(jdbc,new ObjectMapper(),episode);

        assertFalse(service.matchesCurrentShot03Render(
                "invalid",REAL_TAKE_ID,1,2076));
        assertFalse(service.matchesCurrentShot03Render(
                EPISODE_FINGERPRINT,REAL_TAKE_ID,0,2076));
        assertFalse(service.matchesCurrentShot03Render(
                EPISODE_FINGERPRINT,REAL_TAKE_ID,1,0));

        verifyNoInteractions(episode,jdbc);
    }
}
