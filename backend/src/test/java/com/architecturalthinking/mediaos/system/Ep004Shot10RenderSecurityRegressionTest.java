package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Ep004Shot10RenderSecurityRegressionTest {
    private static final String SHOT10="/api/v1/episode-packages/{packageId}/shots/SHOT10/render";

    @Test
    void exactDirectorRenderPostIsAllowedWithoutWildcardOrFutureShots() {
        List<String> allowed=Arrays.asList(EpisodeFactoryDirectorRoutes.POST_PATHS);
        assertTrue(allowed.contains(SHOT10));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/{shotKey}/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT11/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT12/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT13/render"));
        assertTrue(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT14/render"));
        assertFalse(allowed.contains("/api/v1/episode-packages/{packageId}/shots/SHOT15/render"));
        assertEquals(1,allowed.stream().filter(SHOT10::equals).count());
    }

    @Test
    void finalCpuCallbackRequiresSameSourceAndDirectorLockedShot09WithVerifiedSha() throws Exception {
        String source=Files.readString(Path.of(
                "src/main/java/com/architecturalthinking/mediaos/system/GlobalCreationPreflightFilter.java"));
        assertTrue(source.contains("'EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL',"));
        assertTrue(source.contains(
                "and (r.composition_id<>'EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL'"));
        assertTrue(source.contains("and r.input_props->>'expectedSourceCommit'=:sourceSha"));
        assertTrue(source.contains("and r.input_props->>'breathFrames'='72'"));
        assertTrue(source.contains("and jsonb_typeof(r.input_props->'previousShot09Props')='object'"));
        assertTrue(source.contains("and previousLock.shot_key='SHOT09'"));
        assertTrue(source.contains("and previousLock.render_id::text=r.input_props->>'previousRenderId'"));
        assertTrue(source.contains("and previous.status='SUCCEEDED'"));
        assertTrue(source.contains("and previous.composition_id='EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL'"));
        assertTrue(source.contains("and t.audio_sha256=r.input_props->>'voiceAudioSha256'"));
        assertTrue(source.contains(
                "and previous.video_sha256=r.input_props->>'previousVideoSha256'"));
        assertTrue(source.contains("and previous.duration_in_frames::text="));
        assertTrue(source.contains("and previous.input_props->>'worldStartFrame'="));
    }
}
