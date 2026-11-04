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
