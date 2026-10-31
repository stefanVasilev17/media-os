package com.architecturalthinking.mediaos.system;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public final class WorkloadIdentityFilter extends OncePerRequestFilter {
    public static final String VERIFIED_WORKER =
            WorkloadIdentityFilter.class.getName() + ".verified";
    private final WorkloadCredentialService credentials;

    public WorkloadIdentityFilter(WorkloadCredentialService credentials) {
        this.credentials = credentials;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        WorkloadRoute route = WorkloadRoute.resolve(request.getRequestURI());
        if (route == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        String id = request.getHeader("X-Worker-Id");
        if (id == null && "REMOTION_CPU".equals(route.scope()))
            id = request.getHeader("X-Media-OS-Worker");

        WorkloadCredentialService.Identity verified = credentials.verify(
                request.getHeader("X-MediaOS-Workload-Token"),
                id, route.scope(), route.jobId());
        if (verified == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        request.setAttribute(VERIFIED_WORKER, verified);
        chain.doFilter(request, response);
    }
}
