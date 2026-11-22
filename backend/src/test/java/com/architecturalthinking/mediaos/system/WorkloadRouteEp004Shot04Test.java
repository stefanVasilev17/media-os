package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class WorkloadRouteEp004Shot04Test {
    private static final String WORKER = "/api/v1/remotion/renders/worker/";

    @Test
    void shot04ApprovedMediaRequiresExactGetOperationAndCpuScope() {
        String renderId = UUID.randomUUID().toString();
        for (String operation : List.of(
                "/ep004-shot04-selected-voice",
                "/ep004-shot04-previous-video")) {
            String route = WORKER + renderId + operation;
            WorkloadRoute authorized = WorkloadRoute.resolve("GET", route);
            assertNotNull(authorized, "Selected Shot 04 media must be readable by scoped CPU worker");
            assertEquals("REMOTION_CPU", authorized.scope());
            assertNull(authorized.jobId());
            assertEquals("REMOTION_CPU", WorkloadRoute.resolve(route).scope());

            for (String wrongMethod : List.of("POST", "PUT", "PATCH", "DELETE", "HEAD")) {
                assertNull(WorkloadRoute.resolve(wrongMethod, route),
                        "Wrong HTTP method must not read protected Shot 04 media");
            }
        }
    }

    @Test
    void invalidRenderIdAndUnknownMediaOperationsRemainForbidden() {
        String renderId = UUID.randomUUID().toString();
        assertNull(WorkloadRoute.resolve("GET",
                WORKER + "not-a-uuid/ep004-shot04-selected-voice"));
        assertNull(WorkloadRoute.resolve("GET",
                WORKER + "not-a-uuid/ep004-shot04-previous-video"));
        assertNull(WorkloadRoute.resolve("GET",
                WORKER + renderId + "/ep004-shot04-selected-voice/other"));
        assertNull(WorkloadRoute.resolve("GET",
                WORKER + renderId + "/ep004-shot04-previous-video/other"));
        assertNull(WorkloadRoute.resolve("GET",
                "/api/v1/episodes/" + renderId + "/ep004-shot04-selected-voice"));
    }
}
