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
            return remotionCpuRoute(path);
        if (path.startsWith("/api/v1/remotion/gpu-renders/"))
            return gpu(path, "/api/v1/remotion/gpu-renders/", "REMOTION_GPU");
        if (path.startsWith("/api/v1/spline/gpu-renders/"))
            return gpu(path, "/api/v1/spline/gpu-renders/", "SPLINE_GPU");
        return null;
    }

    public static WorkloadRoute resolve(String method, String path) {
        if (method == null || path == null) return null;

        if (path.startsWith("/api/v1/remotion/renders/worker/")) {
            String part = path.substring("/api/v1/remotion/renders/worker/".length());
            if (part.equals("claim")) return "POST".equals(method) ? new WorkloadRoute("REMOTION_CPU", null) : null;
            int separator = part.indexOf('/');
            if (separator < 1) return null;
            try {
                UUID.fromString(part.substring(0, separator));
            } catch (IllegalArgumentException invalid) {
                return null;
            }
            String operation = part.substring(separator);
            return ("POST".equals(method) && (operation.equals("/progress") || operation.equals("/fail")))
                    || ("PUT".equals(method) && operation.equals("/complete"))
                    || ("GET".equals(method) && operation.equals("/ep002-selected-voice"))
                    ? new WorkloadRoute("REMOTION_CPU", null) : null;
        }

        WorkloadRoute route = resolve(path);
        if (route == null) return null;
        if ("REMOTION_GPU".equals(route.scope()) || "SPLINE_GPU".equals(route.scope())) {
            String operation = path.substring(path.lastIndexOf('/'));
            if ("/work".equals(operation) && "GET".equals(method))
                return route;
            if (("/start".equals(operation) || "/fail".equals(operation)) && "POST".equals(method))
                return route;
            if ("/complete".equals(operation) && "PUT".equals(method))
                return route;
            return null;
        }
        return route;
    }

    private static WorkloadRoute remotionCpuRoute(String path) {
        String remainder = path.substring("/api/v1/remotion/renders/worker/".length());
        if ("claim".equals(remainder)) return new WorkloadRoute("REMOTION_CPU", null);
        int separator = remainder.indexOf('/');
        if (separator < 1) return null;
        try {
            UUID.fromString(remainder.substring(0, separator));
        } catch (IllegalArgumentException invalid) {
            return null;
        }
        if (!List.of("/progress", "/complete", "/fail", "/ep002-selected-voice").contains(remainder.substring(separator)))
            return null;
        return new WorkloadRoute("REMOTION_CPU", null);
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
