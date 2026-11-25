package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Ep004Shot05RenderSecurityRegressionTest {
    private static final String SHOT05="/api/v1/episode-packages/{packageId}/shots/SHOT05/render";

    @Test
    void exactDirectorRenderPostIsAllowedWithoutWildcardOrFutureShots() {
        List<String> allowed=Arrays.asList(EpisodeFactoryDirectorRoutes.POST_PATHS);
        assertTrue(allowed.contains(SHOT05));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/{shotKey}/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT07/render"));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT08/render"));
        assertEquals(1,allowed.stream().filter(SHOT05::equals).count());
    }

    @Test
    void finalCpuCallbackRequiresSameSourceAndDirectorLockedShot04WithVerifiedSha() throws Exception {
        String source=Files.readString(Path.of(
                "src/main/java/com/architecturalthinking/mediaos/system/GlobalCreationPreflightFilter.java"));
        assertTrue(source.contains("'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL',"));
        assertTrue(source.contains(
                "and (r.composition_id<>'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL'"));
        assertTrue(source.contains("and r.input_props->>'expectedSourceCommit'=:sourceSha"));
        assertTrue(source.contains("and r.input_props->>'breathFrames'='72'"));
        assertTrue(source.contains("and jsonb_typeof(r.input_props->'previousShot04Props')='object'"));
        assertTrue(source.contains("and previousLock.shot_key='SHOT04'"));
        assertTrue(source.contains("and previousLock.render_id::text=r.input_props->>'previousRenderId'"));
        assertTrue(source.contains("and previous.status='SUCCEEDED'"));
        assertTrue(source.contains(
                "and previous.video_sha256=r.input_props->>'previousVideoSha256'"));
        assertTrue(source.contains("and previous.duration_in_frames::text="));
        assertTrue(source.contains("and previous.input_props->>'worldStartFrame'="));
    }
}
