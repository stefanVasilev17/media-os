package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;

import static org.mockito.Mockito.*;

class Ep002Shot08UserRequestedRenderLaunchTest {
    private final Ep002DirectorVoiceCueService cues=mock(Ep002DirectorVoiceCueService.class);
    private final Ep002FactoryReadinessBridgeService bridge=mock(Ep002FactoryReadinessBridgeService.class);
    private final RemotionRenderController renders=mock(RemotionRenderController.class);
    private final JdbcClient jdbc=mock(JdbcClient.class);

    @Test
    void neverStartsPaidCpuWithoutExplicitOneTimeUserFlag(){
        var launcher=new Ep002Shot08UserRequestedRenderLaunch(cues,bridge,renders,jdbc,
                false,true,true,"a".repeat(40));
        launcher.run(null);
        verifyNoInteractions(cues,bridge,renders,jdbc);
    }

    @Test
    void refusesUnreleasedVisualsOrUnpinnedWorkerBeforeReadingVoice(){
        for(String sha:new String[]{"","invalid","a".repeat(39)}){
            var launcher=new Ep002Shot08UserRequestedRenderLaunch(cues,bridge,renders,jdbc,
                    true,true,true,sha);
            launcher.run(null);
        }
        new Ep002Shot08UserRequestedRenderLaunch(cues,bridge,renders,jdbc,
                true,false,true,"a".repeat(40)).run(null);
        new Ep002Shot08UserRequestedRenderLaunch(cues,bridge,renders,jdbc,
                true,true,false,"a".repeat(40)).run(null);
        verifyNoInteractions(cues,bridge,renders,jdbc);
    }

    @Test
    void rejectsMissingCurrentApprovedAlignedTakeWithoutQueuingRender(){
        when(cues.shot08InternalReadiness()).thenReturn(
                new Ep002DirectorVoiceCueService.Shot08RenderReadiness(
                        "SHOT08","a".repeat(64),null,0,
                        "ELEVENLABS_CHARACTER_TIMESTAMPS",
                        java.util.List.of(),java.util.List.of(),
                        false,"MISSING_APPROVED_CURRENT_TAKE"));
        var launcher=new Ep002Shot08UserRequestedRenderLaunch(cues,bridge,renders,jdbc,
                true,true,true,"a".repeat(40));
        launcher.run(null);
        verify(cues).shot08InternalReadiness();
        verifyNoInteractions(bridge,renders,jdbc);
    }
}
