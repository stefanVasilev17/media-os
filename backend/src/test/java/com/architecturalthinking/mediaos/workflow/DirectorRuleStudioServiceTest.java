package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DirectorRuleStudioServiceTest {
    @Test
    void onlyExplicitProductionScopesCanBePublished() {
        for (String allowed : new String[]{"ALL","SCRIPT","VOICE","VISUAL","VOICE_VISUAL"})
            assertDoesNotThrow(() -> DirectorRuleStudioService.validateScope(allowed));
        assertThrows(ResponseStatusException.class,
                () -> DirectorRuleStudioService.validateScope("UNSCOPED"));
        assertThrows(ResponseStatusException.class,
                () -> DirectorRuleStudioService.validateScope("VOICE_VISUAL_SCRIPT"));
    }

    @Test
    void voiceVideoRuleAppliesToBothMediaButNotScript() {
        assertTrue(DirectorRuleStudioService.applies("VOICE", "VOICE_VISUAL"));
        assertTrue(DirectorRuleStudioService.applies("VISUAL", "VOICE_VISUAL"));
        assertFalse(DirectorRuleStudioService.applies("SCRIPT", "VOICE_VISUAL"));
        assertTrue(DirectorRuleStudioService.applies("VOICE", "ALL"));
        assertTrue(DirectorRuleStudioService.applies("VISUAL", "ALL"));
        assertFalse(DirectorRuleStudioService.applies("SCRIPT", "VISUAL"));
    }

    @Test
    void paidPreviewIsBoundToExactMessageScopeEpisodeAndParentDraft() {
        UUID episodeTwo = UUID.fromString("33333333-3333-4333-8333-333333333332");
        UUID episodeThree = UUID.fromString("33333333-3333-4333-8333-333333333333");
        UUID parent = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
        Map<String, Object> policy = Map.of(
                "rulesFingerprint", "abc","currentRulesFingerprint","xyz");
        var original = new DirectorRuleStudioController.RuleRequest(
                episodeTwo, "VOICE_VISUAL", parent, "Explain retries as read-only.");
        String prepared = DirectorRuleStudioController.authorizationPayload(original, policy);
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                new DirectorRuleStudioController.RuleRequest(
                        episodeThree,"VOICE_VISUAL",parent,"Explain retries as read-only."),policy));
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                new DirectorRuleStudioController.RuleRequest(
                        episodeTwo,"SCRIPT",parent,"Explain retries as read-only."),policy));
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                new DirectorRuleStudioController.RuleRequest(
                        episodeTwo,"VOICE_VISUAL",null,"Explain retries as read-only."),policy));
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                new DirectorRuleStudioController.RuleRequest(
                        episodeTwo,"VOICE_VISUAL",parent,"Explain all retries."),policy));
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                original, Map.of("rulesFingerprint","updated","currentRulesFingerprint","xyz")));
        assertNotEquals(prepared, DirectorRuleStudioController.authorizationPayload(
                original, Map.of("rulesFingerprint","abc","currentRulesFingerprint","updated")));
    }
}
