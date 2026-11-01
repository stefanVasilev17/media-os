package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ShotQualityGateServiceTest {
    private ShotQualityGateService.Assertion rule(
            String target, String predicate, String needle) {
        return new ShotQualityGateService.Assertion(
                UUID.randomUUID(), UUID.randomUUID(), target, predicate, needle,
                "Director rejected this previously", "SCRIPT");
    }

    @Test
    void knownRejectedExplanationMustNotAppearAgain() {
        var banned = rule("NARRATION", "FORBIDDEN_LITERAL", "the database is offline");
        var failed = ShotQualityGateService.evaluate(List.of(banned),
                Map.of("NARRATION", "The database is offline.",
                        "VOICE_DIRECTION", "", "VISUAL_DIRECTION", ""));
        assertFalse(failed.passed());
        assertEquals(1, failed.violations().size());
        assertEquals("FORBIDDEN_LITERAL", failed.violations().get(0).predicate());

        var corrected = ShotQualityGateService.evaluate(List.of(banned),
                Map.of("NARRATION", "The database is overloaded but still responds.",
                        "VOICE_DIRECTION", "", "VISUAL_DIRECTION", ""));
        assertTrue(corrected.passed());
    }

    @Test
    void requiredTechnicalExplanationIsCheckedWithoutAiCalls() {
        var required = rule("NARRATION", "REQUIRED_LITERAL", "shared database");
        assertFalse(ShotQualityGateService.evaluate(List.of(required),
                Map.of("NARRATION", "We have six auth servers.",
                        "VOICE_DIRECTION", "", "VISUAL_DIRECTION", "")).passed());
        assertTrue(ShotQualityGateService.evaluate(List.of(required),
                Map.of("NARRATION", "All requests share the same SHARED  DATABASE.",
                        "VOICE_DIRECTION", "", "VISUAL_DIRECTION", "")).passed());
    }

    @Test
    void checkTargetsAreNotMixed() {
        var forbiddenVisual = rule("VISUAL_DIRECTION", "FORBIDDEN_LITERAL", "full browser screenshot");
        assertTrue(ShotQualityGateService.evaluate(List.of(forbiddenVisual),
                Map.of("NARRATION", "A full browser screenshot is not needed.",
                        "VOICE_DIRECTION", "", "VISUAL_DIRECTION", "Show the Living Architecture Map.")).passed());
        assertFalse(ShotQualityGateService.evaluate(List.of(forbiddenVisual),
                Map.of("NARRATION", "Use the map.", "VOICE_DIRECTION", "",
                        "VISUAL_DIRECTION", "Create a full browser screenshot.")).passed());
    }

    @Test
    void fingerprintChangesWhenDirectorApprovesANewCheck() {
        var first = rule("NARRATION", "FORBIDDEN_LITERAL", "database crashed");
        var second = rule("NARRATION", "REQUIRED_LITERAL", "connection pool");
        String one = ShotQualityGateService.evaluate(List.of(first), Map.of()).ruleFingerprint();
        String two = ShotQualityGateService.evaluate(List.of(first, second), Map.of()).ruleFingerprint();
        assertNotEquals(one, two);
        assertEquals(64, one.length());
    }

    @Test
    void emptyAssertionSetIsNotSemanticProof() {
        var report = ShotQualityGateService.evaluate(List.of(), Map.of());
        assertTrue(report.passed());
        assertEquals(0, report.assertionCount());
        assertEquals(0, report.violations().size());
    }
}
