package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002VoiceSpendGateTest {
    private final UUID ep002 = UUID.fromString("95b8a4a2-728e-47fe-ad4c-a16748773588");
    private final UUID ep001 = ProductionOverviewService.EPISODE_ID;

    @Test
    void ep002DoesNotInheritGlobalEpisodeWritesAndRequiresDedicatedGate() {
        var episodes = mock(EpisodeWorkspaceService.class);
        when(episodes.episode(ep002)).thenReturn(Map.of("episodeNumber", "EP002"));
        when(episodes.writesEnabled()).thenReturn(true);
        var gate = new Ep002VoiceSpendGate(mock(JdbcClient.class), episodes, false);
        var decision = gate.inspect(ep002, "SHOT 01", "Do not spend anything.");
        assertFalse(decision.allowed());
        assertTrue(decision.blockedReason().contains("OFF"));
        verifyNoInteractionsWithDatabase(episodes);
    }

    @Test
    void ep001DoesNotBecomeWritableWithEp002VoiceGate() {
        var episodes = mock(EpisodeWorkspaceService.class);
        when(episodes.episode(ep001)).thenReturn(Map.of("episodeNumber", "EP001"));
        when(episodes.writesEnabled()).thenReturn(false);
        var gate = new Ep002VoiceSpendGate(mock(JdbcClient.class), episodes, true);
        assertFalse(gate.inspect(ep001, "SHOT 01", "Locked").allowed());
    }

    private void verifyNoInteractionsWithDatabase(EpisodeWorkspaceService episodes) {
        verify(episodes, never()).stages(any());
    }
}
