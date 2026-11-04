package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeCodexCloudHandoffServiceTest {
    private static EpisodePackageVoiceReadinessService.ShotReadiness shot(String key) {
        return new EpisodePackageVoiceReadinessService.ShotReadiness(
                key,"Some SHOT",2,UUID.randomUUID().toString(),
                new BigDecimal("12.700"),true,false,"VOICE_READY",
                "HEAR_SEE_CUES_VERIFIED",List.of(),
                List.of(new EpisodePackageCueTimingVerifier.CueTime(
                        "BEAT01","The login request",0.500,2.200)));
    }

    private static EpisodePackageVoiceReadinessService.EpisodeReadiness current(
            String episode,int ready,int unresolved) {
        return new EpisodePackageVoiceReadinessService.EpisodeReadiness(
                UUID.randomUUID(),episode,"a".repeat(64),"b".repeat(64),
                ready==2?"READY_FOR_DIRECTOR_AI_AUTHORIZATION":"PARTIALLY_READY",
                2,2,ready,2-ready,unresolved,ready==2,false,false,
                "No provider requested",List.of(shot("SHOT01"),shot("SHOT02")));
    }

    @Test
    void allApprovedEpisodeShotsAreEligibleWithoutAnOpenAiApiGrant() {
        EpisodeCodexCloudHandoffService.requireWholeEpisode(current("EP003",2,0));
    }

    @Test
    void rejectsMissingOrStaleVoiceEvidenceBeforeAnyCloudTaskHandoff() {
        for(var status:List.of(current("EP003",1,0),current("EP003",0,0),
                current("EP003",2,1))) {
            var error=assertThrows(ResponseStatusException.class,
                    ()->EpisodeCodexCloudHandoffService.requireWholeEpisode(status));
            assertEquals(HttpStatus.CONFLICT,error.getStatusCode());
        }
    }

    @Test
    void excludesDirectorLockedOriginalEpisodesFromGenericCloudGeneration() {
        for(var key:List.of("EP001","EP002","../../foo","EP003/../../EP002")) {
            assertThrows(ResponseStatusException.class,
                    ()->EpisodeCodexCloudHandoffService.requireWholeEpisode(current(key,2,0)));
        }
    }

    @Test
    void subscriptionHandoffNeedsExplicitConsentAndPinnedExactManifestSha() {
        var valid=new EpisodeCodexCloudHandoffService.CreateRequest(
                UUID.randomUUID(),"a".repeat(64),true);
        EpisodeCodexCloudHandoffService.validateCreate(valid);
        for(var broken:List.of(
                new EpisodeCodexCloudHandoffService.CreateRequest(UUID.randomUUID(),
                        "a".repeat(64),false),
                new EpisodeCodexCloudHandoffService.CreateRequest(UUID.randomUUID(),"x",true),
                new EpisodeCodexCloudHandoffService.CreateRequest(null,"a".repeat(64),true))) {
            var err=assertThrows(ResponseStatusException.class,
                    ()->EpisodeCodexCloudHandoffService.validateCreate(broken));
            assertEquals(HttpStatus.BAD_REQUEST,err.getStatusCode());
        }
    }

    @Test
    void onlyExactOwnedGithubPrUrlsCanBeRecordedAsUnverifiedEvidence() {
        assertEquals(174,EpisodeCodexCloudHandoffService.verifiedPullRequestNumber(
                "https://github.com/stefanVasilev17/media-os/pull/174"));
        for(var url:List.of(
                "http://github.com/stefanVasilev17/media-os/pull/174",
                "https://github.com/evil/media-os/pull/174",
                "https://github.com/stefanVasilev17/media-os/pull/174/files",
                "https://github.com/stefanVasilev17/media-os/pull/0",
                "https://github.com/stefanVasilev17/media-os/pull/174?redirect=https://evil",
                "https://github.com/stefanVasilev17/media-os/pull/174#diff",
                "javascript:alert(1)")) {
            assertThrows(ResponseStatusException.class,
                    ()->EpisodeCodexCloudHandoffService.verifiedPullRequestNumber(url),url);
        }
    }

    @Test
    void malformedOrOversizedPrNumbersAreRejected() {
        assertThrows(ResponseStatusException.class,()->
                EpisodeCodexCloudHandoffService.verifiedPullRequestNumber(
                        "https://github.com/stefanVasilev17/media-os/pull/9999999999"));
        assertThrows(ResponseStatusException.class,()->
                EpisodeCodexCloudHandoffService.verifiedPullRequestNumber(null));
    }
}
