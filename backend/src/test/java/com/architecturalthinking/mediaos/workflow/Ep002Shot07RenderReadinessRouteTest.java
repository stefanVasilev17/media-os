package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot07RenderReadinessRouteTest {
    @Test
    void shot07ReadOnlyRenderPreflightIsExposedAndBoundToApprovedVoiceService() throws Exception {
        RequestMapping root = Ep002DirectorVoiceCueController.class.getAnnotation(RequestMapping.class);
        assertNotNull(root);
        assertArrayEquals(new String[]{"/api/v1/creative/episodes/EP002/voice-cue-review"}, root.value());

        var method = Ep002DirectorVoiceCueController.class.getDeclaredMethod("shot07RenderReadiness");
        GetMapping endpoint = method.getAnnotation(GetMapping.class);
        assertNotNull(endpoint, "SHOT07 readiness must have its own GET route, not fall through to /{shotKey}");
        assertArrayEquals(new String[]{"/SHOT07/render-readiness"}, endpoint.value());
        assertEquals(Ep002DirectorVoiceCueService.Shot07RenderReadiness.class, method.getReturnType());

        var serviceMethod = Ep002DirectorVoiceCueService.class.getDeclaredMethod("shot07RenderReadiness");
        Transactional readOnly = serviceMethod.getAnnotation(Transactional.class);
        assertNotNull(readOnly);
        assertTrue(readOnly.readOnly(), "Render readiness must never enqueue paid work or change voice cues");
        assertEquals(Isolation.REPEATABLE_READ, readOnly.isolation());
    }

    @Test
    void shot07PreflightCannotBeConfusedWithExistingProtectedShot06() throws Exception {
        var shot06 = Ep002DirectorVoiceCueController.class.getDeclaredMethod("shot06RenderReadiness");
        assertArrayEquals(new String[]{"/SHOT06/render-readiness"}, shot06.getAnnotation(GetMapping.class).value());
        var shot07 = Ep002DirectorVoiceCueController.class.getDeclaredMethod("shot07RenderReadiness");
        assertNotEquals(shot06.getAnnotation(GetMapping.class).value()[0],
                shot07.getAnnotation(GetMapping.class).value()[0]);
    }
}
