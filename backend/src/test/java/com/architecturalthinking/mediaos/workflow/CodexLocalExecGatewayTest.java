package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CodexLocalExecGatewayTest {
    private final ObjectMapper mapper=new ObjectMapper();

    @Test
    void disabledWorkerNeverSubmitsOrAsksForPaidApiCredentials() {
        var driver=new CodexLocalExecGateway(false,false,"",900,mapper);
        assertEquals("LOCAL_CODEX_WORKER_DISABLED",driver.probe().blocker());
        assertEquals("NOT_SUBMITTED",driver.submit("Build one Remotion SHOT",
                "remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx").outcome());
    }

    @Test
    void onlyDocumentedBoundedWorkspaceWriteCliFlagsAreUsed() {
        assertEquals(List.of("codex","exec","--json","--sandbox","workspace-write",
                "--cd","/tmp/mediaos-codex-worktree","-"),
                CodexLocalExecGateway.argv(Path.of("/tmp/mediaos-codex-worktree")));
        assertThrows(IllegalArgumentException.class,
                ()->CodexLocalExecGateway.argv(Path.of("relative")));
    }

    @Test
    void localTaskCanChangeExactlyOneEp002GeneratedScene() {
        assertTrue(CodexLocalExecGateway.allowedScene(
                "remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx"));
        assertTrue(CodexLocalExecGateway.allowedScene(
                "remotion-engine/src/episodes/ep002/Shot11GeneratedScene.tsx"));
        assertFalse(CodexLocalExecGateway.allowedScene(
                "remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx"));
        assertFalse(CodexLocalExecGateway.allowedScene(
                "remotion-engine/src/episodes/ep001/Shot02GeneratedScene.tsx"));
        assertFalse(CodexLocalExecGateway.allowedScene(
                "../remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx"));
    }

    @Test
    void requiresProviderTerminalEvidenceForSuccessfulCodingTurn() throws Exception {
        assertTrue(CodexLocalExecGateway.completedEvent(
                mapper.readTree("{\"type\":\"turn.completed\",\"turn\":{\"status\":\"completed\"}}")));
        assertFalse(CodexLocalExecGateway.completedEvent(
                mapper.readTree("{\"type\":\"turn.failed\",\"turn\":{\"status\":\"failed\"}}")));
        assertFalse(CodexLocalExecGateway.completedEvent(
                mapper.readTree("{\"type\":\"turn.completed\",\"turn\":{\"status\":\"interrupted\"}}")));
        assertFalse(CodexLocalExecGateway.completedEvent(
                mapper.readTree("{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\"}}")));
    }

    @Test
    void missingIsolatedCheckoutCannotStartAgent() {
        var driver=new CodexLocalExecGateway(true,true,
                "/not-a-real-mediaos-private-checkout-278398",900,mapper);
        assertEquals("ISOLATED_GIT_CHECKOUT_AND_AGENT_RULES_REQUIRED",
                driver.probe().blocker());
        assertEquals("NOT_SUBMITTED",driver.submit("Remotion SHOT02 only",
                "remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx").outcome());
    }
}
