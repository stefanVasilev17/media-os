package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodePackageVoiceStudioServiceTest {

    @Test
    void workingNarrationAllowsValidImportedSchemaLengths() {
        assertEquals("Hello world this is a narration!",
                EpisodePackageVoiceStudioService.validatedNarration(
                        "  Hello world this is a narration!  "));
        assertEquals(12000,
                EpisodePackageVoiceStudioService.validatedNarration("x".repeat(12000)).length());
    }

    @Test
    void savedNarrationAndDirectionRejectMissingOrOversizedValues() {
        for(String narration:new String[]{null,"","short","x".repeat(12001)}) {
            ResponseStatusException ex=assertThrows(ResponseStatusException.class,
                    ()->EpisodePackageVoiceStudioService.validatedNarration(narration));
            assertEquals(HttpStatus.BAD_REQUEST,ex.getStatusCode());
        }
        assertEquals("Speak slowly",
                EpisodePackageVoiceStudioService.validatedVoiceDirection(" Speak slowly "));
        for(String direction:new String[]{null,"","short","x".repeat(1201)}) {
            ResponseStatusException ex=assertThrows(ResponseStatusException.class,
                    ()->EpisodePackageVoiceStudioService.validatedVoiceDirection(direction));
            assertEquals(HttpStatus.BAD_REQUEST,ex.getStatusCode());
        }
    }

    @Test
    void paidGenerationMustHaveUniqueIdExactHashAndExplicitConsent() {
        UUID requestId=UUID.randomUUID();
        String sha=EpisodePackageValidator.sha256("Sample safe narration source");
        EpisodePackageVoiceStudioService.requireDirectorPaidConfirmation(true,requestId,sha);
        for(Boolean value:new Boolean[]{null,false}) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                            ()->EpisodePackageVoiceStudioService.requireDirectorPaidConfirmation(
                                    value,requestId,sha)).getStatusCode());
        }
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->EpisodePackageVoiceStudioService.requireDirectorPaidConfirmation(
                        true,null,sha)).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->EpisodePackageVoiceStudioService.requireDirectorPaidConfirmation(
                        true,requestId,"unknown")).getStatusCode());
    }

    @Test
    void requiresRealElevenLabsCharacterTimingArraysBeforeMarkingAlignmentPresent() {
        assertFalse(EpisodePackageVoiceStudioService.hasRealProviderAlignment(null));
        assertFalse(EpisodePackageVoiceStudioService.hasRealProviderAlignment("{}"));
        assertFalse(EpisodePackageVoiceStudioService.hasRealProviderAlignment("{\"alignment\":null}"));
        assertFalse(EpisodePackageVoiceStudioService.hasRealProviderAlignment(
                "{\"alignment\":{\"characters\":[\"H\"]}}"));
        assertTrue(EpisodePackageVoiceStudioService.hasRealProviderAlignment(
                "{\"alignment\":{\"characters\":[\"H\"],"
                + "\"character_start_times_seconds\":[0.0],"
                + "\"character_end_times_seconds\":[0.2]}}"));
    }

    @Test
    void audioDurationIsMeasuredOnlyFromPlausibleProviderResults() {
        assertEquals(new BigDecimal("32.640"),EpisodePackageAudioDurationProbe.parse("32.64"));
        for(String duration:new String[]{null,"","0","-1","NaN","Infinity","abc","86400"}) {
            assertNull(EpisodePackageAudioDurationProbe.parse(duration));
        }
    }
}
