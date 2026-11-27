package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class EpisodePublishingDirectorRoutesTest {
    @Test void onlyExactPublishingWritesAreAllowlisted(){
        var paths=Arrays.stream(EpisodeFactoryDirectorRoutes.POST_PATHS)
            .filter(x->x.contains("/publishing")).toList();
        assertEquals(2,paths.size());
        assertTrue(paths.contains("/api/v1/episode-packages/{packageId}/publishing/items/{fieldKey}"));
        assertTrue(paths.contains("/api/v1/episode-packages/{packageId}/publishing/thumbnail"));
        assertTrue(paths.stream().noneMatch(x->x.contains("*")));
    }
}
