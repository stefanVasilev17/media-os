package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodePackageValidatorTest {
    private final EpisodePackageValidator validator=new EpisodePackageValidator(new ObjectMapper());

    private static String valid() {
        return """
                {
                  "schemaVersion":"mediaos.episode-package.v1",
                  "episode":{"episodeKey":"EP003","title":"What Really Happens During Payment?",
                    "language":"en","audience":"US and UK software architects",
                    "targetDurationSeconds":60},
                  "sourceApproval":{"script":"DIRECTOR_APPROVED",
                    "visualStoryline":"DIRECTOR_APPROVED"},
                  "visualIdentity":{"styleReference":"EP001 architecture world",
                    "continuityRules":"Use only the established cinematic architecture visual grammar."},
                  "shots":[{
                    "shotKey":"SHOT01","title":"First payment request",
                    "editorialDurationSeconds":60,
                    "narration":"A payment request begins at the phone, but the result remains unresolved.",
                    "voiceDirection":"Calm, clear and focused documentary delivery.",
                    "visualGoal":"Follow the first request through the architecture.",
                    "cameraDirection":"Track the phone then move right to the backend.",
                    "transition":"Fade from the existing phone into an API path.",
                    "visualBeats":[{"beatId":"B1","cueAnchor":"A payment request begins",
                      "direction":"Reveal a single request leaving the phone UI."}]
                  }],
                  "shortsCandidates":[
                    {"title":"Payment loop","shotKeys":["SHOT01"],
                      "hook":"A payment can appear stuck before anything fails."},
                    {"title":"Network request","shotKeys":["SHOT01"],
                      "hook":"Your phone waits while the backend moves."},
                    {"title":"The first request","shotKeys":["SHOT01"],
                      "hook":"The first payment request is not a confirmation."}
                  ]
                }
                """;
    }

    private EpisodePackageValidator.Validated parse(String raw) {
        return validator.validate("episode-003.json",raw,EpisodePackageValidator.sha256(raw));
    }

    @Test
    void importsAllApprovedShotVoiceTasksWithoutCalls() {
        var result=parse(valid());
        assertEquals("EP003",result.episodeKey());
        assertEquals(1,result.shotCount());
        assertEquals(1,result.beatCount());
        assertEquals("What Really Happens During Payment?",result.title());
        assertEquals(EpisodePackageValidator.sha256(valid()),result.sha256());
    }

    @Test
    void bundledEp003IntakeHasElevenLockedShotNarrationsAndDraftVisuals() throws Exception {
        String raw;
        try(var input=EpisodePackageValidatorTest.class.getResourceAsStream(
                "/ep003-director-locked-voice-package-v1.json")) {
            assertNotNull(input,"EP003 production voice package resource must exist.");
            raw=new String(input.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
        }
        var source=validator.validate("EP003_Director_Locked_Voice_v04.json",raw,
                EpisodePackageValidator.sha256(raw));
        assertEquals("EP003",source.episodeKey());
        assertEquals("What Happens When One Database Is No Longer Enough?",source.title());
        assertEquals(11,source.shotCount());
        assertEquals(33,source.beatCount());
        assertEquals("VOICE_ONLY_DRAFT",
                source.document().path("sourceApproval").path("visualStoryline").asText());
        assertEquals("DIRECTOR_APPROVED",
                source.document().path("sourceApproval").path("script").asText());
        for(int i=0;i<11;i++){
            var shot=source.document().path("shots").get(i);
            assertEquals("SHOT"+String.format("%02d",i+1),shot.path("shotKey").asText());
            assertTrue(shot.path("voiceDirection").asText().contains("SLOW_NATURAL"));
            assertTrue(shot.path("narration").asText().length()>300);
        }
    }

    @Test
    void voiceOnlyDraftMustNotBeAcceptedForUnrelatedEpisodesOrDifferentEp003Title() {
        String voiceOnly=valid().replace("\"DIRECTOR_APPROVED\"}",
                "\"VOICE_ONLY_DRAFT\"}");
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->parse(voiceOnly)).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->parse(voiceOnly.replace("EP003","EP004"))).getStatusCode());
    }

    @Test
    void rejectsExistingProtectedEpisodes() {
        for(String key:new String[]{"EP001","EP002"}) {
            String text=valid().replace("EP003",key);
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,()->parse(text)).getStatusCode());
        }
    }

    @Test
    void rejectsMissingDirectorApprovalOrNarration() {
        for(String source:new String[]{
                valid().replace("DIRECTOR_APPROVED","DRAFT"),
                valid().replace("A payment request begins at the phone, but the result remains unresolved.",""),
                valid().replace("Reveal a single request leaving the phone UI.","short")
        }) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,()->parse(source)).getStatusCode());
        }
    }

    @Test
    void rejectsInventedVoiceCueAndInvalidShortsReferences() {
        for(String source:new String[]{
                valid().replace("\"cueAnchor\":\"A payment request begins\"", "\"cueAnchor\":\"The rocket is on fire\""),
                valid().replace("\"shotKeys\":[\"SHOT01\"]","\"shotKeys\":[\"SHOT03\"]"),
                valid().replace("\"shotKey\":\"SHOT01\"","\"shotKey\":\"SHOT03\"")
        }) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,()->parse(source)).getStatusCode());
        }
    }

    @Test
    void rejectsTamperedFileAndOversizePayload() {
        String text=valid();
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->validator.validate("episode-003.json",text,"0".repeat(64))).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->validator.validate("../bad.json",text,EpisodePackageValidator.sha256(text)))
                .getStatusCode());
        String large="a".repeat(EpisodePackageValidator.MAX_BYTES+1);
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->validator.validate("episode-003.json",large,EpisodePackageValidator.sha256(large)))
                .getStatusCode());
    }

    @Test
    void rejectsDuplicateJsonKeysAndUnexpectedCommands() {
        String duplicated=valid().replace("\"schemaVersion\":",
                "\"schemaVersion\":\"mediaos.episode-package.v1\",\"schemaVersion\":");
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,()->parse(duplicated)).getStatusCode());
        String injected=valid().replace("\"visualIdentity\":",
                "\"agentCommand\":\"run a paid model\",\"visualIdentity\":");
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,()->parse(injected)).getStatusCode());
    }

    @Test
    void sourceApprovalDoesNotAutomaticallyAuthorizeProduction() {
        EpisodePackageImportService.requireConfirmed(true);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodePackageImportService.requireConfirmed(false)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodePackageImportService.requireConfirmed(null)).getStatusCode());
    }
}
