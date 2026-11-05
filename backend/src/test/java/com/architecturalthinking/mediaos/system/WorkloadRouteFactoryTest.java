package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class WorkloadRouteFactoryTest {
    private static final String PREFIX = "/api/v1/remotion/renders/worker/";
    private static final String RENDER = "12345678-1234-4123-8123-123456789abc";
    private static final String SOURCE = "87654321-4321-4432-8432-cba987654321";
    private static final WorkloadRoute CPU = new WorkloadRoute("REMOTION_CPU", null);

    @Test
    void factoryCapabilityRequiresPostAndScopedCpuWorkerIdentity() {
        assertEquals(CPU, WorkloadRoute.resolve("POST", PREFIX + "factory-capability"));
        assertEquals(CPU, WorkloadRoute.resolve(PREFIX + "factory-capability"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + "factory-capability"));
        assertNull(WorkloadRoute.resolve("PUT", PREFIX + "factory-capability"));
        assertNull(WorkloadRoute.resolve("POST", PREFIX + "factory-capability/extra"));
    }

    @Test
    void selectedVoiceAllowsOnlyExactRenderGet() {
        String path = PREFIX + RENDER + "/factory-selected-voice";
        assertEquals(CPU, WorkloadRoute.resolve("GET", path));
        assertEquals(CPU, WorkloadRoute.resolve(path));
        assertNull(WorkloadRoute.resolve("POST", path));
        assertNull(WorkloadRoute.resolve("DELETE", path));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + "not-a-uuid/factory-selected-voice"));
        assertNull(WorkloadRoute.resolve("GET", path + "/extra"));
    }

    @Test
    void approvedFactorySourceRequiresTwoValidUuidSegmentsAndGet() {
        String path = PREFIX + RENDER + "/factory-source/" + SOURCE;
        assertEquals(CPU, WorkloadRoute.resolve("GET", path));
        assertEquals(CPU, WorkloadRoute.resolve(path));
        assertEquals(CPU, WorkloadRoute.resolve("GET",
                PREFIX + RENDER + "/factory-source/" + SOURCE.toUpperCase()));
        assertNull(WorkloadRoute.resolve("POST", path));
        assertNull(WorkloadRoute.resolve("PUT", path));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/factory-source/"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/factory-source/invalid"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/factory-source/" + SOURCE + "/extra"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + "invalid/factory-source/" + SOURCE));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/factory-source/" + SOURCE + "%2Fextra"));
    }

    @Test
    void oldCpuWorkerOperationsKeepTheirExactMethods() {
        assertEquals(CPU, WorkloadRoute.resolve("POST", PREFIX + "claim"));
        assertEquals(CPU, WorkloadRoute.resolve("POST", PREFIX + RENDER + "/progress"));
        assertEquals(CPU, WorkloadRoute.resolve("POST", PREFIX + RENDER + "/fail"));
        assertEquals(CPU, WorkloadRoute.resolve("PUT", PREFIX + RENDER + "/complete"));
        assertEquals(CPU, WorkloadRoute.resolve("GET", PREFIX + RENDER + "/ep002-selected-voice"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + "claim"));
        assertNull(WorkloadRoute.resolve("POST", PREFIX + RENDER + "/factory-selected-voice"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/complete"));
        assertNull(WorkloadRoute.resolve("GET", PREFIX + RENDER + "/unapproved"));
    }
}
