package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EpisodeLockedScriptVoiceServiceTest {
    private final UUID episode = UUID.fromString("95b8a4a2-728e-47fe-ad4c-a16748773588");

    private EpisodeRevisionVoiceService routed(ShotRevisionService revisions,
                                               EpisodeLockedScriptVoiceService originals) {
        return new EpisodeRevisionVoiceService(mock(JdbcClient.class), revisions,
                mock(EpisodeWorkspaceService.class), mock(ElevenLabsTextToSpeechService.class),
                new ObjectMapper(), mock(PlatformTransactionManager.class), originals);
    }

    @Test
    void initialVoiceUsesOriginalLockedScriptWithoutCreatingAnyShotRevision() {
        ShotRevisionService revisions = mock(ShotRevisionService.class);
        EpisodeLockedScriptVoiceService originals = mock(EpisodeLockedScriptVoiceService.class);
        when(revisions.context(episode, "SHOT 01")).thenReturn(
                new ShotRevisionService.Context(1, "SHOT 01", "The Login That Keeps Waiting",
                        "You tap Login. A loading spinner appears… and keeps turning.", null, null));
        Map<String, Object> expected = Map.of("source", "DIRECTOR_LOCKED_ORIGINAL_SCRIPT",
                "shotRevision", 0, "voiceApproved", false);
        when(originals.state(episode, "SHOT 01")).thenReturn(expected);
        assertEquals(expected, routed(revisions, originals).state(episode, "SHOT 01"));
        verify(originals).state(episode, "SHOT 01");
        verifyNoMoreInteractions(originals);
    }

    @Test
    void originalVoiceGenerationIsNotTriggeredByGetAndNeedsExplicitGenerateAction() {
        ShotRevisionService revisions = mock(ShotRevisionService.class);
        EpisodeLockedScriptVoiceService originals = mock(EpisodeLockedScriptVoiceService.class);
        Map<String, Object> expected = Map.of("source", "DIRECTOR_LOCKED_ORIGINAL_SCRIPT");
        when(originals.generate(episode, "SHOT 01")).thenReturn(expected);
        assertEquals(expected, routed(revisions, originals).generate(episode, "SHOT 01", 0));
        verify(originals).generate(episode, "SHOT 01");
        verifyNoInteractions(revisions);
    }

    @Test
    void initialVoiceApprovalRequiresSelectedTakeAndDoesNotSilentlyApprove() {
        ShotRevisionService revisions = mock(ShotRevisionService.class);
        EpisodeLockedScriptVoiceService originals = mock(EpisodeLockedScriptVoiceService.class);
        UUID take = UUID.randomUUID();
        Map<String, Object> expected = Map.of("voiceApproved", true);
        when(originals.approve(episode, "SHOT 01", take)).thenReturn(expected);
        assertEquals(expected, routed(revisions, originals).approve(episode, "SHOT 01", 0, take));
        verify(originals).approve(episode, "SHOT 01", take);
    }

    @Test
    void narrationHashIsStableForOriginalEnglishTextAndSensitiveToChanges() {
        String source = "You tap Login. A loading spinner appears… and keeps turning.";
        String sha = EpisodeLockedScriptVoiceService.narrationHash(source);
        assertEquals(64, sha.length());
        assertTrue(sha.matches("[a-f0-9]{64}"));
        assertEquals(sha, EpisodeLockedScriptVoiceService.narrationHash(source));
        assertNotEquals(sha, EpisodeLockedScriptVoiceService.narrationHash(source + " "));
    }
    @Test
    void initialLockedScriptIsReadableWithoutAnyShotRevision() {
        ShotRevisionService.Context original = new ShotRevisionService.Context(
                1, "SHOT 01", "The Login That Keeps Waiting",
                "You tap Login. A loading spinner appears.", null, null);
        assertNull(EpisodeLockedScriptVoiceService.readinessBlocker(original, true));
    }

    @Test
    void missingVisualPlanDoesNotMakeReadinessLookLikeMissingRevision() {
        ShotRevisionService.Context original = new ShotRevisionService.Context(
                1, "SHOT 01", "The Login That Keeps Waiting",
                "You tap Login. A loading spinner appears.", null, null);
        assertTrue(EpisodeLockedScriptVoiceService.readinessBlocker(original, false)
                .contains("Visual Plan must be Director-LOCKED"));
    }

    @Test
    void unapprovedDraftDoesNotPermitGeneratingFromOriginalLockedScript() {
        ShotRevisionService.Revision draft = new ShotRevisionService.Revision(
                1, 1, "DRAFT", "Revised narration", "", "", "", null);
        ShotRevisionService.Context pending = new ShotRevisionService.Context(
                1, "SHOT 01", "The Login That Keeps Waiting",
                "You tap Login. A loading spinner appears.", draft, null);
        assertTrue(EpisodeLockedScriptVoiceService.readinessBlocker(pending, true)
                .contains("unapproved revision DRAFT"));
    }

    @Test
    void originalLockedScriptRequiresNonemptyNarration() {
        ShotRevisionService.Context empty = new ShotRevisionService.Context(
                1, "SHOT 01", "The Login That Keeps Waiting", "", null, null);
        assertTrue(EpisodeLockedScriptVoiceService.readinessBlocker(empty, true)
                .contains("narration is missing"));
    }

}
