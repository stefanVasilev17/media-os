package com.architecturalthinking.mediaos.system;

import java.util.List;
import java.util.UUID;

public record WorkloadRoute(String scope, UUID jobId) {
    public static WorkloadRoute resolve(String path) {
        if (path.startsWith("/api/v1/worker/spline/snapshot/"))
            return new WorkloadRoute("SPLINE_SNAPSHOT", null);
        if (path.startsWith("/api/v1/worker/spline-shot/"))
            return new WorkloadRoute("SPLINE_SHOT", null);
        if (path.startsWith("/api/v1/worker/spline/"))
            return new WorkloadRoute("SPLINE", null);
        if (path.equals("/api/v1/worker/runner/heartbeat"))
            return new WorkloadRoute("RUNNER", null);
        if (path.startsWith("/api/v1/remotion/renders/worker/"))
            return new WorkloadRoute("REMOTION_CPU", null);
        if (path.startsWith("/api/v1/remotion/gpu-renders/"))
            return gpu(path, "/api/v1/remotion/gpu-renders/", "REMOTION_GPU");
        if (path.startsWith("/api/v1/spline/gpu-renders/"))
            return gpu(path, "/api/v1/spline/gpu-renders/", "SPLINE_GPU");
        return null;
    }

    private static WorkloadRoute gpu(String path, String prefix, String scope) {
        String remainder = path.substring(prefix.length());
        int separator = remainder.indexOf('/');
        if (separator <= 0 || !List.of("/work", "/start", "/complete", "/fail")
                .contains(remainder.substring(separator))) return null;
        try {
            return new WorkloadRoute(scope, UUID.fromString(remainder.substring(0, separator)));
        } catch (IllegalArgumentException invalid) {
            return null;
        }
    }
}
