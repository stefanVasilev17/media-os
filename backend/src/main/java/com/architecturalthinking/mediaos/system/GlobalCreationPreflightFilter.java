package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Unified entry preflight for all state-changing MediaOS API requests.
 * This is context verification, not a replacement for semantic QA or Director approval.
 * Autonomous background jobs separately run the same preflight at execution time.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class GlobalCreationPreflightFilter extends OncePerRequestFilter {

    private final ProductionMemoryService memory;
    private final ObjectMapper mapper;

    public GlobalCreationPreflightFilter(ProductionMemoryService memory, ObjectMapper mapper) {
        this.memory = memory;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = apiPath(request);
        if (!path.startsWith("/api/v1/")) return true;
        // Telemetry and non-artifact worker progress must not grow the audit table
        // on every poll. The creation request and final render write remain guarded.
        if (path.equals("/api/v1/worker/runner/heartbeat")
                || path.equals("/api/v1/remotion/renders/worker/claim")
                || path.matches("^/api/v1/remotion/renders/worker/[^/]+/progress$")
                || path.matches("^/api/v1/worker/spline/jobs/[^/]+/started$")) return true;
        return switch (request.getMethod().toUpperCase(Locale.ROOT)) {
            case "POST", "PUT", "PATCH", "DELETE" -> false;
            default -> true;
        };
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = apiPath(request);
        String scope = scopeFor(path);
        String action = (request.getMethod() + "_" + path.replaceAll("[^A-Za-z0-9]+", "_"))
                .toUpperCase(Locale.ROOT);
        Map<String, Object> result;
        try {
            UUID episodeId = episodeFor(request);
            result = memory.preflight(scope, action, episodeId);
        } catch (ResponseStatusException ex) {
            reject(response, ex.getStatusCode().value(), "GLOBAL_CREATION_PREFLIGHT_BLOCKED", ex.getReason());
            return;
        } catch (Exception ex) {
            // Never continue on missing DB, missing policy, or a failed audit write.
            reject(response, HttpStatus.SERVICE_UNAVAILABLE.value(), "GLOBAL_CREATION_PREFLIGHT_UNAVAILABLE",
                    "Canonical rules and production memory could not be verified.");
            return;
        }
        request.setAttribute("MEDIA_OS_CREATION_PREFLIGHT", result);
        response.setHeader("X-MediaOS-Preflight", String.valueOf(result.get("auditId")));
        chain.doFilter(request, response);
    }

    private String apiPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String prefix = request.getContextPath();
        return prefix != null && !prefix.isEmpty() && uri.startsWith(prefix)
                ? uri.substring(prefix.length()) : uri;
    }

    private UUID episodeFor(HttpServletRequest request) {
        String path = apiPath(request);
        String raw = request.getHeader("X-MediaOS-Episode-Id");
        UUID headerId = null;
        if (raw != null && !raw.isBlank()) {
            try {
                headerId = UUID.fromString(raw.trim());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid episode ID.");
            }
        }

        // New episode workspace URLs are the source of identity. Never trust a
        // conflicting header and never let a missing header fall back to EP001.
        java.util.regex.Matcher match = java.util.regex.Pattern
                .compile("^/api/v1/episodes/([^/]+)(?:/.*)?$")
                .matcher(path);
        if (match.matches()) {
            UUID pathId;
            try {
                pathId = UUID.fromString(match.group(1));
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid episode ID in URL.");
            }
            if (headerId != null && !headerId.equals(pathId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode ID header and URL disagree.");
            }
            return pathId;
        }

        // Creating a new episode is a project-level creation event. EP001 is
        // only the audit anchor; the new episode is not present in the DB yet.
        if (path.equals("/api/v1/episodes")) {
            if (headerId != null && !headerId.equals(ProductionOverviewService.EPISODE_ID))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode catalog creation is project-scoped.");
            return ProductionOverviewService.EPISODE_ID;
        }

        // Legacy routes still write EP001. Explicitly deny alternate IDs.
        if (headerId != null) {
            if (!ProductionOverviewService.EPISODE_ID.equals(headerId))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Legacy route targets EP001; refusing cross-episode write.");
            return headerId;
        }
        if (!memory.hasSingleEpisode()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ambiguous episode routing. Explicit EP001 identity is required for legacy writes.");
        }
        return ProductionOverviewService.EPISODE_ID;
    }

    static String scopeFor(String path) {
        if (path.matches("^/api/v1/episodes/[^/]+/stages/(script|scene|research|voice|visual)(?:/.*)?$")) return "ALL";
        if (path.startsWith("/api/v1/voice") || path.startsWith("/api/v1/studio")) return "VOICE";
        if (path.startsWith("/api/v1/visual") || path.startsWith("/api/v1/remotion")
                || path.startsWith("/api/v1/spline") || path.startsWith("/api/v1/director-visual")) return "VISUAL";
        if (path.startsWith("/api/v1/creative/script") || path.startsWith("/api/v1/production-contract")
                || path.startsWith("/api/v1/locked-script") || path.startsWith("/api/v1/director-script")) return "SCRIPT";
        return "ALL";
    }

    private void reject(HttpServletResponse response, int status, String code, String detail) throws IOException {
        if (response.isCommitted()) return;
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getWriter(), Map.of(
                "error", code,
                "message", detail == null ? "Creation context check failed." : detail,
                "passed", false
        ));
    }
}
