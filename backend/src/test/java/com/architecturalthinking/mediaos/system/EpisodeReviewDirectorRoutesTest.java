package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class EpisodeReviewDirectorRoutesTest {
    @Test void onlyExactAuditedReviewWriteIsAllowlisted(){
        assertEquals(List.of("/api/v1/episode-packages/{packageId}/review/items"),
            Arrays.stream(EpisodeFactoryDirectorRoutes.POST_PATHS).filter(p->p.contains("/review")).toList());
    }
}
