package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ShotPromptContextServiceTest {
    private static final UUID EP002 = UUID.fromString("33333333-3333-4333-8333-333333333332");

    private Map<String, Object> policy() {
        return Map.of("version", "canonical-v1", "payload",
                Map.of("canonicalCreationRules", Map.of(
                        "supersedesConflictingLegacyPolicy", true,
                        "engine", "Remotion-first",
                        "story", "Human action then evidence on one Living Architecture Map")));
    }

    private Map<String, Object> rule(String id, String scope, String severity, String content) {
        return Map.of("id", id, "scope", scope, "severity", severity,
                "type", "CORRECTION", "content", content);
    }

    @Test
    void firstPassIncludesCanonicalPolicyAndEveryMandatoryCorrection() {
        var rules = List.of(
                rule("R-001", "ALL", "REQUIRED", "Explain each technical term in simple spoken English."),
                rule("R-002", "SCRIPT", "REQUIRED", "A slow database is not necessarily offline."),
                rule("R-003", "VISUAL", "REQUIRED", "Preserve the Remotion Living Architecture Map."));
        var result = ShotPromptContextService.assemble(
                EP002, "SHOT 10", "Make the database explanation clearer.",
                "This Login request waited for a connection.", policy(), rules);

        assertEquals(3, result.mandatoryRuleCount());
        assertEquals(0, result.optionalRuleCount());
        assertTrue(result.appendix().contains("CANONICAL POLICY vcanonical-v1"));
        assertTrue(result.appendix().contains("Remotion-first"));
        assertTrue(result.appendix().contains("R-001"));
        assertTrue(result.appendix().contains("A slow database is not necessarily offline."));
        assertTrue(result.appendix().contains("Preserve the Remotion Living Architecture Map."));
        assertEquals(64, result.fingerprint().length());
    }

    @Test
    void optionalRulesAreTopicallySelectedAndDuplicateRulesAreNotReprompted() {
        var rules = List.of(
                rule("R-001", "ALL", "REQUIRED", "Never edit adjacent locked shots."),
                rule("R-002", "ALL", "REQUIRED", "Never edit adjacent locked shots."),
                rule("R-003", "SCRIPT", "PREFERENCE", "Explain database capacity visually."),
                rule("R-004", "SCRIPT", "PREFERENCE", "Use financial case study terminology."));
        var result = ShotPromptContextService.assemble(EP002, "SHOT 05",
                "Please make database capacity more clear.", "",
                policy(), rules);

        assertEquals(1, result.mandatoryRuleCount());
        assertEquals(1, result.optionalRuleCount());
        assertTrue(result.appendix().contains("Explain database capacity visually."));
        assertFalse(result.appendix().contains("financial case study"));
        assertEquals(2, result.memoryRuleIds().size());
    }

    @Test
    void approvedNewMemoryChangesPromptFingerprint() {
        var initial = List.of(rule("R-001", "ALL", "REQUIRED", "Never alter locked scenes."));
        var current = ShotPromptContextService.assemble(EP002, "SHOT 01", "Rewrite the intro.", "",
                policy(), initial);
        var updated = ShotPromptContextService.assemble(EP002, "SHOT 01", "Rewrite the intro.", "",
                policy(), List.of(initial.get(0),
                        rule("R-002", "SCRIPT", "REQUIRED", "Do not reveal the answer before the hook.")));
        assertNotEquals(current.fingerprint(), updated.fingerprint());
        assertEquals(2, updated.mandatoryRuleCount());
    }

    @Test
    void noMandatoryRulesFailsBeforePaidGeneration() {
        assertThrows(ResponseStatusException.class, () -> ShotPromptContextService.assemble(
                EP002, "SHOT 01", "Improve the opening.", "", policy(),
                List.of(rule("R-001", "SCRIPT", "PREFERENCE", "Keep it cinematic."))));
    }

    @Test
    void oversizedRequiredKnowledgeIsNotSilentlyDiscarded() {
        String enormous = "database ".repeat(5000);
        assertThrows(ResponseStatusException.class, () -> ShotPromptContextService.assemble(
                EP002, "SHOT 09", "Explain database.", "", policy(),
                List.of(rule("R-001", "ALL", "REQUIRED", enormous))));
    }

    @Test
    void topicAgentReceivesOnlyGlobalRulesNotShotSpecificScriptMemory() {
        var rules = List.of(
                rule("R-001", "ALL", "REQUIRED", "Evergreen viewer entry before depth."),
                rule("R-002", "SCRIPT", "REQUIRED", "Define latency within its scene."),
                rule("R-003", "VISUAL", "REQUIRED", "Only animate the failure path."));
        var prompt = ShotPromptContextService.assembleForStage(
                EP002, "TOPIC", "TOPIC_CANDIDATES", "Propose a user-focused topic.", "",
                policy(), rules);
        assertEquals(1, prompt.mandatoryRuleCount());
        assertTrue(prompt.appendix().contains("Evergreen viewer entry"));
        assertFalse(prompt.appendix().contains("Define latency"));
        assertFalse(prompt.appendix().contains("animate the failure"));
    }

    @Test
    void scriptAgentReceivesGlobalAndNarrationRulesButNotVisualOnlyRules() {
        var rules = List.of(
                rule("R-001", "ALL", "REQUIRED", "Use a clear viewer promise."),
                rule("R-002", "SCRIPT", "REQUIRED", "Every new term gets a plain explanation."),
                rule("R-003", "VOICE", "REQUIRED", "Audio must have a natural performance."),
                rule("R-004", "VISUAL", "REQUIRED", "Move the camera only at focus changes."));
        var script = ShotPromptContextService.assembleForStage(
                EP002, "SCRIPT", "SCRIPT", "Fix the causal explanation.", "",
                policy(), rules);
        assertEquals(2, script.mandatoryRuleCount());
        assertFalse(script.appendix().contains("Audio must"));
        assertFalse(script.appendix().contains("Move the camera"));
    }

    @Test
    void sceneAgentReceivesGlobalScriptVoiceAndVisualProductionRules() {
        var rules = List.of(
                rule("R-001", "ALL", "REQUIRED", "Protect existing Director LOCKs."),
                rule("R-002", "SCRIPT", "REQUIRED", "Preserve narration."),
                rule("R-003", "VOICE", "REQUIRED", "Align movement to word timing."),
                rule("R-004", "VISUAL", "REQUIRED", "Stay Remotion-first."));
        var scene = ShotPromptContextService.assembleForStage(
                EP002, "SCENE", "SCENE", "Create a scene for this narration.", "",
                policy(), rules);
        assertEquals(4, scene.mandatoryRuleCount());
        assertTrue(scene.appendix().contains("Stay Remotion-first."));
    }

    @Test
    void stageScopeChangesFingerprintEvenForSameGlobalRule() {
        var rules = List.of(rule("R-001", "ALL", "REQUIRED", "Keep the viewer in mind."));
        var topic = ShotPromptContextService.assembleForStage(
                EP002, "TOPIC", "TOPIC_CANDIDATES", "Propose topics.", "", policy(), rules);
        var script = ShotPromptContextService.assembleForStage(
                EP002, "SCRIPT", "SCRIPT", "Propose topics.", "", policy(), rules);
        assertNotEquals(topic.fingerprint(), script.fingerprint());
    }

    @Test
    void missingCanonicalPolicyBlocksPaidCall() {
        assertThrows(ResponseStatusException.class, () -> ShotPromptContextService.assemble(
                EP002, "SHOT 10", "Explain P95.", "",
                Map.of("version", "outdated", "payload", Map.of()),
                List.of(rule("R-001", "ALL", "REQUIRED", "Define every technical term."))));
    }
}
