package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot08RenderReadinessRouteTest {
    @Test
    void shot08HasOwnDirectorProtectedReadOnlyGetMapping() throws Exception {
        var root=Ep002DirectorVoiceCueController.class.getAnnotation(RequestMapping.class);
        assertNotNull(root);
        assertArrayEquals(new String[]{"/api/v1/creative/episodes/EP002/voice-cue-review"},root.value());
        var endpoint=Ep002DirectorVoiceCueController.class.getDeclaredMethod("shot08RenderReadiness");
        var mapping=endpoint.getAnnotation(GetMapping.class);
        assertNotNull(mapping,"SHOT08 GET must not be mistaken for dynamic /{shotKey}");
        assertArrayEquals(new String[]{"/SHOT08/render-readiness"},mapping.value());
        assertEquals(Ep002DirectorVoiceCueService.Shot08RenderReadiness.class,endpoint.getReturnType());
        var service=Ep002DirectorVoiceCueService.class.getDeclaredMethod("shot08RenderReadiness");
        var readOnly=service.getAnnotation(Transactional.class);
        assertNotNull(readOnly);
        assertTrue(readOnly.readOnly());
        assertEquals(Isolation.REPEATABLE_READ,readOnly.isolation());
        var previous=Ep002DirectorVoiceCueController.class.getDeclaredMethod("shot07RenderReadiness");
        assertNotEquals(previous.getAnnotation(GetMapping.class).value()[0],mapping.value()[0]);
    }
}
