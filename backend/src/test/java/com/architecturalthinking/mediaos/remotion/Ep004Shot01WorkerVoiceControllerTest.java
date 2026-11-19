package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep004Shot01WorkerVoiceControllerTest {
    private static final String SOURCE_COMMIT="26e71933a66fa36566b720e149cc1ada56b1c27b";

    @Test
    void rejectedWorkerCannotReadApprovedVoiceOrQueryItsPrivateManifest() {
        JdbcClient jdbc=mock(JdbcClient.class);
        MediaObjectStore store=mock(MediaObjectStore.class);
        var controller=new Ep004Shot01WorkerVoiceController(jdbc,store,"secret-key");
        UUID id=UUID.randomUUID();
        for(String candidate:new String[]{null,"","wrong-key"}) {
            assertThrows(ResponseStatusException.class,
                    ()->controller.approvedTake(id,candidate,"ep004-cpu-worker",SOURCE_COMMIT));
        }
        assertThrows(ResponseStatusException.class,
                ()->controller.approvedTake(id,"secret-key","ep004-cpu-worker","mismatched"));
        assertThrows(ResponseStatusException.class,
                ()->controller.approvedTake(id,"secret-key",null,SOURCE_COMMIT));
        verifyNoInteractions(jdbc,store);
    }
}
