package com.architecturalthinking.mediaos.workflow;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot08LockedShot07BoundaryContractTest {
    @Test
    void hardPinsDirectorsRealSuccessfulShot07V3RenderAndFullFrameCount()
            throws Exception {
        Field render=Ep002Shot08PreviewController.class
                .getDeclaredField("SHOT07_LOCKED_RENDER");
        Field source=Ep002Shot08PreviewController.class
                .getDeclaredField("SHOT07_LOCKED_SOURCE_SHA");
        Field frames=Ep002Shot08PreviewController.class
                .getDeclaredField("SHOT07_LOCKED_DURATION_FRAMES");
        render.setAccessible(true);
        source.setAccessible(true);
        frames.setAccessible(true);
        assertEquals(UUID.fromString("b2a335dd-cb71-48f2-bf47-0f8bdcdd969d"),
                render.get(null));
        assertEquals("d4fd0701f7298903dad2167e38bb7931edeae6bb",
                source.get(null));
        assertEquals(2674,frames.getInt(null));

        Method boundary=Ep002Shot08PreviewController.class
                .getDeclaredMethod("lockedShot07Boundary");
        assertEquals(Map.class,boundary.getReturnType());
        assertTrue(java.lang.reflect.Modifier.isPrivate(boundary.getModifiers()));
    }
}
