package com.architecturalthinking.mediaos.system;

import java.util.List;
import java.util.UUID;

public record WorkloadRoute(String scope, UUID jobId) {
    public static WorkloadRoute resolve(String path) {
        if (path.startsWith("/api/v1/worker/verification/"))
            return verificationRoute(null,path);
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

        if (path.startsWith("/api/v1/worker/verification/"))
            return verificationRoute(method,path);

        if (path.startsWith("/api/v1/remotion/renders/worker/")) {
            String part = path.substring("/api/v1/remotion/renders/worker/".length());
            if (part.equals("claim") || part.equals("factory-capability"))
                return "POST".equals(method) ? new WorkloadRoute("REMOTION_CPU", null) : null;
            int separator = part.indexOf('/');
            if (separator < 1) return null;
            try {
                UUID.fromString(part.substring(0, separator));
            } catch (IllegalArgumentException invalid) {
                return null;
            }
            String operation = part.substring(separator);
            boolean allowed = ("POST".equals(method) && (operation.equals("/progress") || operation.equals("/fail")))
                    || ("PUT".equals(method) && operation.equals("/complete"))
                    || ("GET".equals(method) && (operation.equals("/ep002-selected-voice")
                        || operation.equals("/factory-selected-voice")
                        || factorySourceOperation(operation)));
            return allowed ? new WorkloadRoute("REMOTION_CPU", null) : null;
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

    private static WorkloadRoute verificationRoute(String method,String path) {
        String prefix="/api/v1/worker/verification/";
        if (!path.startsWith(prefix))return null;
        String remaining=path.substring(prefix.length());
        if ("claim".equals(remaining))
            return method==null||"POST".equals(method)
                    ?new WorkloadRoute("VERIFICATION",null):null;
        int end=remaining.indexOf('/');
        if(end<1 || !remaining.substring(end).equals("/complete"))
            return null;
        String run=remaining.substring(0,end);
        try {
            if(!UUID.fromString(run).toString().equalsIgnoreCase(run))return null;
        }catch(IllegalArgumentException invalid) {return null;}
        return method==null||"POST".equals(method)
                ?new WorkloadRoute("VERIFICATION",null):null;
    }

    private static WorkloadRoute remotionCpuRoute(String path) {
        String remainder = path.substring("/api/v1/remotion/renders/worker/".length());
        if ("claim".equals(remainder) || "factory-capability".equals(remainder))
            return new WorkloadRoute("REMOTION_CPU", null);
        int separator = remainder.indexOf('/');
        if (separator < 1) return null;
        try {
            UUID.fromString(remainder.substring(0, separator));
        } catch (IllegalArgumentException invalid) {
            return null;
        }
        String operation = remainder.substring(separator);
        if (!List.of("/progress", "/complete", "/fail", "/ep002-selected-voice",
                "/factory-selected-voice").contains(operation) && !factorySourceOperation(operation))
            return null;
        return new WorkloadRoute("REMOTION_CPU", null);
    }

    private static boolean factorySourceOperation(String operation) {
        if (!operation.startsWith("/factory-source/")) return false;
        String sourceId = operation.substring("/factory-source/".length());
        try {
            return UUID.fromString(sourceId).toString().equalsIgnoreCase(sourceId);
        } catch (IllegalArgumentException invalid) {
            return false;
        }
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
