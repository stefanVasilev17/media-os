package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Ep004Shot03DirectorPostRouteTest {
    @Test
    void exactShot03DirectorRenderIsPermittedWithoutOpeningOtherShotRoutes() {
        List<String> allowed = Arrays.asList(EpisodeFactoryDirectorRoutes.POST_PATHS);
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT01/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT02/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT03/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT04/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT05/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT06/render"));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT07/render"));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/{shotKey}/render"));
    }
}
