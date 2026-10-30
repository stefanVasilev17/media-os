package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episodes")
public class EpisodeWorkspaceController {
    private final EpisodeWorkspaceService workspace;
    private final ProductionMemoryService memory;
    private final EpisodeDirectorOverviewController director;

    public EpisodeWorkspaceController(EpisodeWorkspaceService workspace, ProductionMemoryService memory,
                                      EpisodeDirectorOverviewController director) {
        this.workspace = workspace;
        this.memory = memory;
        this.director = director;
    }

    public record CreateRequest(@NotBlank String episodeNumber,
                                @NotBlank String title,
                                @NotBlank String brief,
                                String sources) {}
    public record BriefRevisionRequest(@NotBlank String brief, String sources,
                                       @NotNull @Min(1) Integer expectedRevision) {}
    public record DraftRequest(@NotNull Map<String, Object> artifact, @NotBlank String summary,
                               @NotNull @Min(0) Integer expectedRevision) {}
    public record LockRequest(@NotNull @Min(1) Integer expectedRevision,
                              @NotBlank String decision, @NotBlank String directorNote) {}
    public record AssetReferenceRequest(String notes) {}
    public record CorrectionRequest(@NotBlank String scope, @NotBlank String content,
                                    String source) {}

    @GetMapping
    public List<Map<String, Object>> episodes() {
        return workspace.episodes().stream().map(source -> {
            Map<String, Object> result = new java.util.LinkedHashMap<>(source);
            boolean allStagesLocked = Boolean.TRUE.equals(result.remove("allStagesLocked"));
            boolean complete = allStagesLocked
                    && allShotsLocked(director.overview((UUID) result.get("id")));
            result.put("fullyLocked", complete);
            return result;
        }).toList();
    }

    static boolean fullyLocked(boolean allStagesLocked, Map<String, Object> overview) {
        return allStagesLocked && allShotsLocked(overview);
    }

    static boolean allShotsLocked(Map<String, Object> overview) {
        Object shots = overview.get("shots");
        if (!(shots instanceof List<?> items) || items.isEmpty()) return false;
        return items.stream().allMatch(shot -> {
            if (!(shot instanceof Map<?, ?> details)) return false;
            return "LOCKED".equals(details.get("voiceStatus"))
                    && "LOCKED".equals(details.get("videoStatus"));
        });
    }

    @GetMapping("/next-number")
    public Map<String,String> nextNumber() {
        return Map.of("episodeNumber", workspace.nextEpisodeNumber());
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody CreateRequest req, HttpServletRequest request) {
        return workspace.create(req.episodeNumber(), req.title(), req.brief(),
                req.sources(), auditId(request));
    }

    @GetMapping("/{episodeId}/brief")
    public Map<String,Object> brief(@PathVariable UUID episodeId) {
        return workspace.brief(episodeId);
    }

    @PutMapping("/{episodeId}/brief")
    public Map<String,Object> reviseBrief(@PathVariable UUID episodeId,
                     @Valid @RequestBody BriefRevisionRequest req,
                     HttpServletRequest request) {
        return workspace.reviseBrief(episodeId, req.brief(), req.sources(),
                req.expectedRevision(), auditId(request));
    }

    @GetMapping("/{episodeId}")
    public Map<String, Object> episode(@PathVariable UUID episodeId) {
        return workspace.episode(episodeId);
    }

    @GetMapping("/{episodeId}/context")
    public Map<String, Object> context(@PathVariable UUID episodeId,
                                       @RequestParam(defaultValue = "ALL") String scope) {
        return workspace.context(episodeId, scope);
    }

    @GetMapping("/{episodeId}/stages")
    public List<Map<String, Object>> stages(@PathVariable UUID episodeId) {
        return workspace.stages(episodeId);
    }

    @PostMapping("/{episodeId}/stages/{stageKey}/draft")
    public Map<String, Object> draft(@PathVariable UUID episodeId, @PathVariable String stageKey,
                                     @Valid @RequestBody DraftRequest req, HttpServletRequest request) {
        return workspace.draft(episodeId, stageKey, req.artifact(), req.summary(),
                req.expectedRevision(), auditId(request));
    }

    @PostMapping("/{episodeId}/stages/{stageKey}/director-lock")
    public Map<String, Object> directorLock(@PathVariable UUID episodeId, @PathVariable String stageKey,
                                            @Valid @RequestBody LockRequest req, HttpServletRequest request) {
        return workspace.directorLock(episodeId, stageKey, req.expectedRevision(), req.decision(),
                req.directorNote(), auditId(request));
    }

    @GetMapping("/{episodeId}/assets")
    public List<Map<String, Object>> assets(@PathVariable UUID episodeId) {
        return workspace.assets(episodeId);
    }

    @PostMapping("/{episodeId}/assets/{assetKey}/reuse")
    public Map<String, Object> reuse(@PathVariable UUID episodeId, @PathVariable String assetKey,
                                     @RequestBody(required = false) AssetReferenceRequest req,
                                     HttpServletRequest request) {
        return workspace.referenceAsset(episodeId, assetKey, req == null ? "" : req.notes(), auditId(request));
    }

    @GetMapping("/{episodeId}/memory")
    public List<Map<String, Object>> memory(@PathVariable UUID episodeId,
                                             @RequestParam(defaultValue = "ALL") String scope) {
        workspace.episode(episodeId);
        return memory.rulesFor(scope, episodeId);
    }

    @PostMapping("/{episodeId}/memory")
    public Map<String, Object> correction(@PathVariable UUID episodeId,
                                          @Valid @RequestBody CorrectionRequest req, HttpServletRequest request) {
        return workspace.rememberEpisodeCorrection(episodeId, req.scope(), req.content(), req.source(), auditId(request));
    }

    @SuppressWarnings("unchecked")
    private UUID auditId(HttpServletRequest request) {
        Object attr = request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(attr instanceof Map<?, ?> map) || !(map.get("auditId") instanceof UUID id))
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "An audited creation preflight is required.");
        return id;
    }
}
