package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeCodeWorkerPreflightTest {
    private final RemotionReusableAssetRegistry catalog=
            new RemotionReusableAssetRegistry(new ObjectMapper());

    @Test
    void verifiedCatalogKnowsActualReusableArchitecturePrimitives() {
        assertEquals("mediaos.remotion-reuse-registry.v1",catalog.catalog().schemaVersion());
        assertEquals(15,catalog.catalog().assets().size());
        assertTrue(catalog.catalog().sourceGitCommit().matches("[a-f0-9]{40}"));
        assertTrue(catalog.fingerprint().matches("[a-f0-9]{64}"));
        assertEquals(15,new HashSet<>(catalog.catalog().assets().stream()
                .map(RemotionReusableAssetRegistry.Asset::assetId).toList()).size());

        var phone=catalog.resolve("PHONE_LOGIN");
        assertNotNull(phone);
        assertEquals("ATPhone",phone.component());
        assertEquals("DIRECTOR_LOCKED_REUSE_ONLY",phone.status());
        assertEquals("f815c849d1b77c7cbe609f74a15b8104e88a2ffe",
                phone.gitBlobSha());
        assertEquals("ATCameraRig",catalog.resolve("camera-rig").component());
        assertEquals("ATBackendNode",catalog.resolve("BACKEND_NODE").component());
        assertEquals("EXISTING_REQUIRES_DIRECTOR_REVIEW",
                catalog.resolve("BACKEND_NODE").status());
    }

    @Test
    void missingAssetKeyIsNeverInventedAsAReusableComponent() {
        assertNull(catalog.resolve("REDIS"));
        assertNull(catalog.resolve("PAYMENT_GATEWAY"));
        assertNull(catalog.resolve("../../protected/Root.tsx"));
        assertNull(catalog.resolve("api.example.com"));
        assertNull(catalog.resolve("A".repeat(81)));
        assertNull(catalog.resolve(null));
    }

    @Test
    void protectedExistingEpisodesCannotBeOutputTargets() {
        for(String ep:new String[]{"EP001","EP002","../ep003","EP003/../../EP001","ep003"}) {
            assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                    ()->EpisodeCodeWorkerPreflightService.safePrefix(
                            ep,"stefanVasilev17/media-os",
                            "remotion-engine/src/episodes/"+ep.toLowerCase()+"/"))
                    .getStatusCode());
        }
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.safePrefix(
                        "EP003","other/repo","remotion-engine/src/episodes/ep003/"))
                .getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.safePrefix(
                        "EP003","stefanVasilev17/media-os",
                        "remotion-engine/src/episodes/ep001/"))
                .getStatusCode());
    }

    @Test
    void proposedCodePathsAreStrictlyEpisodeLocalAndShotNumbered() {
        String safe=EpisodeCodeWorkerPreflightService.safePrefix(
                "EP003","stefanVasilev17/media-os",
                "remotion-engine/src/episodes/ep003/");
        assertEquals("remotion-engine/src/episodes/ep003/Shot07GeneratedScene.tsx",
                EpisodeCodeWorkerPreflightService.proposalFilePath(safe,7));
        assertEquals("remotion-engine/src/episodes/ep003/Shot40GeneratedScene.tsx",
                EpisodeCodeWorkerPreflightService.proposalFilePath(safe,40));
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.proposalFilePath(
                        "remotion-engine/src/episodes/ep002/",1)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.proposalFilePath(safe,41)).getStatusCode());
    }

    @Test
    void verifiedVoiceSecondsDetermineExactThirtyFpsFrameCount() {
        assertEquals(980,EpisodeCodeWorkerPreflightService.framesForDuration(
                new BigDecimal("32.640")));
        assertEquals(1,EpisodeCodeWorkerPreflightService.framesForDuration(
                new BigDecimal("0.001")));
        assertEquals(1200,EpisodeCodeWorkerPreflightService.framesForDuration(
                new BigDecimal("40.000")));
        assertEquals(146,EpisodeCodeWorkerPreflightService.frameFromSeconds(
                4.8666666667,false,1000));
        assertEquals(147,EpisodeCodeWorkerPreflightService.frameFromSeconds(
                4.8666666667,true,1000));
    }

    @Test
    void invalidOrInventedVoiceTimesFailClosed() {
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.framesForDuration(BigDecimal.ZERO))
                .getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.framesForDuration(null))
                .getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.frameFromSeconds(
                        Double.NaN,false,150)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerPreflightService.frameFromSeconds(
                        10.0,true,150)).getStatusCode());
    }
}
