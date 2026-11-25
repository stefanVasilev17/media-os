package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class WorkloadRouteEp004Shot11Test {
    private static final String WORKER="/api/v1/remotion/renders/worker/";

    @Test
    void shot11PrivateMediaIsAvailableOnlyToExactCpuGetRoute() {
        String renderId=UUID.randomUUID().toString();
        for(String op:List.of("/ep004-shot11-selected-voice",
                "/ep004-shot11-previous-video")) {
            String path=WORKER+renderId+op;
            WorkloadRoute match=WorkloadRoute.resolve("GET",path);
            assertNotNull(match);
            assertEquals("REMOTION_CPU",match.scope());
            assertEquals("REMOTION_CPU",WorkloadRoute.resolve(path).scope());
            for(String method:List.of("POST","PUT","PATCH","DELETE","HEAD"))
                assertNull(WorkloadRoute.resolve(method,path));
            assertNull(WorkloadRoute.resolve("GET",path+"/other"));
            assertNull(WorkloadRoute.resolve("GET",WORKER+"invalid"+op));
        }
        assertNull(WorkloadRoute.resolve("GET",
            WORKER+renderId+"/ep004-shot11-unapproved-media"));
    }
}
