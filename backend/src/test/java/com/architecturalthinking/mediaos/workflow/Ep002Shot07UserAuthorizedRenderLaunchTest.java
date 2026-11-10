package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;

import static org.mockito.Mockito.*;

class Ep002Shot07UserAuthorizedRenderLaunchTest {
    private final Ep002DirectorVoiceCueService cues=mock(Ep002DirectorVoiceCueService.class);
    private final Ep002FactoryReadinessBridgeService bridge=mock(Ep002FactoryReadinessBridgeService.class);
    private final RemotionRenderController renders=mock(RemotionRenderController.class);
    private final JdbcClient jdbc=mock(JdbcClient.class);
    private final ObjectMapper mapper=new ObjectMapper();
    private final String worker="fa4a0d534f8e091fe9d68587e210a574bcd1e854";

    @Test
    void neverStartsPaidCpuWithoutExplicitOneTimeUserAuthorization(){
        new Ep002Shot07UserAuthorizedRenderLaunch(cues,bridge,renders,jdbc,mapper,
                false,true,worker).run(null);
        verifyNoInteractions(cues,bridge,renders,jdbc);
    }

    @Test
    void preventsAnyWorkWithoutMatchingV2WorkerAndPaidScope(){
        new Ep002Shot07UserAuthorizedRenderLaunch(cues,bridge,renders,jdbc,mapper,
                true,false,worker).run(null);
        new Ep002Shot07UserAuthorizedRenderLaunch(cues,bridge,renders,jdbc,mapper,
                true,true,"650e3d64a481de851efdd0e233ab7ca780030b43").run(null);
        new Ep002Shot07UserAuthorizedRenderLaunch(cues,bridge,renders,jdbc,mapper,
                true,true,"").run(null);
        verifyNoInteractions(cues,bridge,renders,jdbc);
    }

    @Test
    void neverQueuesWhenCurrentApprovedVoiceAndCuesCannotBeVerified(){
        new Ep002Shot07UserAuthorizedRenderLaunch(cues,bridge,renders,jdbc,mapper,
                true,true,worker).run(null);
        verify(bridge).snapshot();
        verifyNoInteractions(cues,renders,jdbc);
    }
}
