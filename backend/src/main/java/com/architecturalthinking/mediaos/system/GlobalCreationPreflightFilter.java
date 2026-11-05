package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
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
// Spring Security must authorize the request before this filter writes an audit record.
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class GlobalCreationPreflightFilter extends OncePerRequestFilter {

    private static final UUID RENDER_PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final java.util.regex.Pattern FINAL_REMOTION_CALLBACK = java.util.regex.Pattern.compile(
            "^/api/v1/remotion/(?:renders/worker|gpu-renders)/([0-9a-fA-F-]{36})/(complete|fail|start)$");
    private static final java.util.regex.Pattern LEGACY_SPLINE_GPU_CALLBACK = java.util.regex.Pattern.compile(
            "^/api/v1/spline/gpu-renders/([0-9a-fA-F-]{36})/(start|complete|fail)$");
    private final ProductionMemoryService memory;
    private final ObjectMapper mapper;
    private final JdbcClient jdbc;

    @Autowired
    public GlobalCreationPreflightFilter(ProductionMemoryService memory, ObjectMapper mapper,
                                         JdbcClient jdbc) {
        this.memory = memory;
        this.mapper = mapper;
        this.jdbc = jdbc;
    }

    GlobalCreationPreflightFilter(ProductionMemoryService memory, ObjectMapper mapper) {
        this(memory, mapper, null);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = apiPath(request);
        if (!path.startsWith("/api/v1/")) return true;
        if (path.startsWith("/api/v1/auth/")) return true;
        // Telemetry and non-artifact worker progress must not grow the audit table
        // on every poll. The creation request and final render write remain guarded.
        if (path.equals("/api/v1/worker/runner/heartbeat")
                || path.equals("/api/v1/remotion/renders/worker/claim")
                || path.equals("/api/v1/remotion/renders/worker/factory-capability")
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
        // EP002 creative preview jobs have an immutable, Director-created SHOT lineage,
        // but do not yet have an episode row. Their authenticated worker completion is a
        // continuation of the original approved creation, not a new episode creation.
        // Do not invent EP001 episode identity or skip preflight for unlinked jobs.
        if (isVerifiedEp002WorkerContinuation(request)) {
            request.setAttribute("MEDIA_OS_CREATION_PREFLIGHT",
                    Map.of("continuation", "EP002_SHOT01_VERIFIED_RENDER"));
            chain.doFilter(request, response);
            return;
        }
        if (isVerifiedFactoryWorkerContinuation(request)) {
            request.setAttribute("MEDIA_OS_CREATION_PREFLIGHT",
                    Map.of("continuation", "FACTORY_DIRECTOR_AUTHORIZED_RENDER"));
            chain.doFilter(request, response);
            return;
        }
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

    private boolean isVerifiedEp002WorkerContinuation(HttpServletRequest request) {
        if (jdbc == null) return false;
        String path = apiPath(request);
        if (!path.startsWith("/api/v1/remotion/renders/worker/")) return false;
        java.util.regex.Matcher callback = FINAL_REMOTION_CALLBACK.matcher(path);
        if (!callback.matches()) return false;
        String operation = callback.group(2);
        if (!(("complete".equals(operation) && "PUT".equals(request.getMethod()))
                || ("fail".equals(operation) && "POST".equals(request.getMethod())))) return false;
        if (request.getHeader("X-MediaOS-Episode-Id") != null) return false;
        String worker = request.getHeader("X-Media-OS-Worker");
        if (worker == null || worker.isBlank()) return false;
        UUID renderId = UUID.fromString(callback.group(1));
        return jdbc.sql("""
                select exists (
                    select 1 from remotion_render r
                    join episode_shot_render_lineage lineage on lineage.remotion_render_id=r.id
                    where r.id=:render and r.project_id=:project
                      and r.episode_id is null
                      and r.composition_id='EP002-SHOT01-DRAFT'
                      and r.status='RUNNING' and r.worker_id=:worker
                      and lineage.episode_key='EP002' and lineage.shot_key='SHOT01'
                      and r.input_props->>'shotKey'='EP002_SHOT01'
                      and r.input_props->>'contractId' is not null
                      and r.input_props->>'voiceTakeId'=lineage.preferred_take_id::text
                      and r.input_props->>'scriptRevision'=lineage.script_revision::text
                      and r.input_props->>'dependencySha256'=lineage.dependency_sha256
                      and r.input_props->>'visualSourceSha'=lineage.visual_source_git_blob_sha
                )
                """)
                .param("render", renderId)
                .param("project", RENDER_PROJECT_ID)
                .param("worker", worker.trim())
                .query(Boolean.class).single();
    }

    private boolean isVerifiedFactoryWorkerContinuation(HttpServletRequest request) {
        if (jdbc == null) return false;
        java.util.regex.Matcher callback = FINAL_REMOTION_CALLBACK.matcher(apiPath(request));
        if (!callback.matches()) return false;
        String operation = callback.group(2);
        if (!(("complete".equals(operation) && "PUT".equals(request.getMethod()))
                || ("fail".equals(operation) && "POST".equals(request.getMethod())))) return false;
        if (request.getHeader("X-MediaOS-Episode-Id") != null) return false;
        String worker = request.getHeader("X-Media-OS-Worker");
        if (worker == null || worker.isBlank()) return false;
        UUID render = UUID.fromString(callback.group(1));
        return Boolean.TRUE.equals(jdbc.sql("""
                select exists(
                    select 1
                    from remotion_render r
                    join episode_factory_production_run run
                      on run.id::text = r.input_props->>'runId'
                    where r.id=:render and r.project_id=:project
                      and r.episode_id is null
                      and r.status='RUNNING' and r.worker_id=:worker
                      and r.composition_id in ('AT-FACTORY-SHOT',
                             'AT-FACTORY-MASTER','AT-FACTORY-SHORT')
                      and run.verified_pr_commit=r.input_props->>'expectedSourceCommit'
                      and run.verified_source_digest=r.input_props->>'sourceDigest'
                      and (
                          (r.composition_id='AT-FACTORY-SHOT' and exists(
                              select 1 from episode_factory_shot shot
                              where shot.run_id=run.id
                                and shot.last_requested_render=r.id
                                and shot.shot_key=r.input_props->>'shotKey'
                                and shot.selected_take_id::text=r.input_props->>'voiceTakeId'
                          ))
                          or (r.composition_id in ('AT-FACTORY-MASTER','AT-FACTORY-SHORT')
                              and exists(
                                  select 1 from episode_factory_output_plan output
                                  where output.run_id=run.id and output.render_id=r.id
                                    and output.kind=case
                                        when r.composition_id='AT-FACTORY-MASTER'
                                          then 'MASTER' else 'SHORT' end
                              ))
                      )
                )
                """)
                .param("render",render)
                .param("project",RENDER_PROJECT_ID)
                .param("worker",worker.trim())
                .query(Boolean.class).single());
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

        // Worker final callbacks must use their persisted render's episode, not the
        // old single-episode fallback. A forged episode header cannot override it.
        java.util.regex.Matcher finalCpu = FINAL_REMOTION_CALLBACK.matcher(path);
        if (finalCpu.matches()) {
            if (jdbc == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Worker render episode lookup is unavailable.");
            }
            UUID renderId = UUID.fromString(finalCpu.group(1));
            UUID episodeId = jdbc.sql("""
                    select episode_id from remotion_render
                    where id=:render and project_id=:project
                    """)
                    .param("render", renderId)
                    .param("project", RENDER_PROJECT_ID)
                    .query(UUID.class)
                    .optional()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "Remotion worker callback requires a stored episode-scoped render."));
            if (headerId != null && !headerId.equals(episodeId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Worker render episode and header disagree.");
            }
            return episodeId;
        }

        java.util.regex.Matcher splineGpu = LEGACY_SPLINE_GPU_CALLBACK.matcher(path);
        if (splineGpu.matches()) {
            if (jdbc == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Spline GPU episode lookup is unavailable.");
            }
            UUID renderId = UUID.fromString(splineGpu.group(1));
            boolean legacyShot = jdbc.sql("""
                    select exists (
                      select 1 from spline_shot_render r
                      join production_job p on p.id=r.shot_id and p.project_id=r.project_id
                      where r.id=:render and r.project_id=:project
                        and p.task_type='CREATE_RUNTIME_SHOT_V1'
                    )
                    """)
                    .param("render", renderId)
                    .param("project", RENDER_PROJECT_ID)
                    .query(Boolean.class).single();
            if (!legacyShot) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Spline GPU callback is not linked to a verified legacy EP001 render.");
            }
            if (headerId != null && !headerId.equals(ProductionOverviewService.EPISODE_ID)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Legacy Spline GPU callback cannot target another episode.");
            }
            return ProductionOverviewService.EPISODE_ID;
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
        if (path.equals("/api/v1/episodes")
                || path.startsWith("/api/v1/episode-packages/")) {
            if (headerId != null && !headerId.equals(ProductionOverviewService.EPISODE_ID))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode catalog creation is project-scoped.");
            return ProductionOverviewService.EPISODE_ID;
        }

        // EP002 fixed-source creative feedback is a project-scoped Director review,
        // not an EP001 episode edit. The existing project audit anchor is used
        // only for global production-memory preflight; the stored feedback remains EP002.
        if (path.matches("^/api/v1/creative/episodes/EP002/voice-cue-review/SHOT(0[1-9]|1[01])$")
                || path.equals("/api/v1/creative/episodes/EP002/visual-feedback")
                || path.equals("/api/v1/creative/episodes/EP002/visual-approvals")
                || path.equals("/api/v1/creative/episodes/EP002/codex-automation/arm")
                || path.equals("/api/v1/creative/episodes/EP002/codex-automation/pause")
                || path.equals("/api/v1/creative/episodes/EP002/codex-automation/resume")) {
            if (headerId != null && !headerId.equals(ProductionOverviewService.EPISODE_ID))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "EP002 creative feedback uses the project audit identity, not another episode UUID.");
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
