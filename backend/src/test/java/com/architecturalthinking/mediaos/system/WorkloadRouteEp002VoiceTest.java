package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class WorkloadRouteEp002VoiceTest {
    @Test
    void onlyExactGetOperationCanReadWorkerOwnedEp002Voice() {
        String id = UUID.randomUUID().toString();
        String base = "/api/v1/remotion/renders/worker/" + id;
        WorkloadRoute allowed = WorkloadRoute.resolve("GET", base + "/ep002-selected-voice");
        assertNotNull(allowed);
        assertEquals("REMOTION_CPU", allowed.scope());
        assertNull(allowed.jobId());
        assertNull(WorkloadRoute.resolve("POST", base + "/ep002-selected-voice"));
        assertNull(WorkloadRoute.resolve("PUT", base + "/ep002-selected-voice"));
        assertNull(WorkloadRoute.resolve("GET", base + "/complete"));
        assertNull(WorkloadRoute.resolve("GET", base + "/unexpected-audio"));
        assertNull(WorkloadRoute.resolve("GET",
                "/api/v1/remotion/renders/worker/not-a-uuid/ep002-selected-voice"));
    }
}
