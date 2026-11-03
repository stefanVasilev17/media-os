package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002Shot01PreviewControllerTest {
    @Test
    void nullRequestDoesNotCreateUnverifiedRender() {
        var scene=mock(Ep002RemotionSceneContractService.class);
        var render=mock(RemotionRenderController.class);
        var controller=new Ep002Shot01PreviewController(scene,render,mock(JdbcClient.class));
        assertThrows(RuntimeException.class,()->controller.create(null));
        verifyNoInteractions(render);
    }

    @Test
    void separateConfirmedVisualPreviewRequestsGetDistinctIdempotentRenderInputs() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();

        var firstProps = new LinkedHashMap<String,Object>();
        firstProps.put("voiceTakeId","take-two");
        Ep002Shot01PreviewController.addExplicitRenderRequestId(firstProps,first);
        assertEquals(first.toString(),firstProps.get("renderRequestId"));

        var repeatedProps = new LinkedHashMap<String,Object>();
        repeatedProps.put("voiceTakeId","take-two");
        Ep002Shot01PreviewController.addExplicitRenderRequestId(repeatedProps,first);
        assertEquals(firstProps,repeatedProps);

        var nextVersionProps = new LinkedHashMap<String,Object>();
        nextVersionProps.put("voiceTakeId","take-two");
        Ep002Shot01PreviewController.addExplicitRenderRequestId(nextVersionProps,second);
        assertNotEquals(firstProps,nextVersionProps);
        assertEquals("take-two",nextVersionProps.get("voiceTakeId"));

        var legacyProps = new LinkedHashMap<String,Object>();
        Ep002Shot01PreviewController.addExplicitRenderRequestId(legacyProps,null);
        assertFalse(legacyProps.containsKey("renderRequestId"));
    }

    @Test
    void readOnlyLatestStatusRefusesToInventPreviewWithoutChosenVoice() {
        var scene=mock(Ep002RemotionSceneContractService.class);
        var render=mock(RemotionRenderController.class);
        var source=mock(Ep002RemotionSceneContractService.SceneContract.class);
        var inputs=mock(Ep002RemotionSceneContractService.Inputs.class);
        when(scene.contract("SHOT01")).thenReturn(source);
        when(source.inputs()).thenReturn(inputs);
        when(inputs.productionDependencySha256()).thenReturn(null);
        var controller=new Ep002Shot01PreviewController(scene,render,mock(JdbcClient.class));
        assertEquals("NO_SELECTED_VOICE",controller.latest().get("status"));
        verifyNoInteractions(render);
    }
}
