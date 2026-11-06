package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CodexCloudCliGatewayTest {
    @Test
    void constructsOneAttemptCloudCommandWithoutShellExecution() {
        List<String> args=CodexCloudCliGateway.commandFor(
                "owner/media-os","Develop only EP002 SHOT02 using Remotion");
        assertEquals(List.of("codex","cloud","exec","--env","owner/media-os",
                "--attempts","1",
                "Develop only EP002 SHOT02 using Remotion"),args);
    }

    @Test
    void rejectsInvalidEnvironmentAndOverlongTask() {
        assertThrows(IllegalArgumentException.class,
                ()->CodexCloudCliGateway.commandFor("; rm -rf /","test"));
        assertThrows(IllegalArgumentException.class,
                ()->CodexCloudCliGateway.commandFor("owner/media-os"," "));
        assertThrows(IllegalArgumentException.class,
                ()->CodexCloudCliGateway.commandFor("owner/media-os","a".repeat(30001)));
    }

    @Test
    void defaultsToNoRemoteProviderWithoutAuthorizedCheckout() {
        var absent=new CodexCloudCliGateway(true,"published-env","");
        assertEquals("TRUSTED_PRIVATE_GIT_CHECKOUT_MISSING",absent.probe().reason());
        assertEquals("NOT_SUBMITTED",absent.submit("Remotion only").state());
    }
}
