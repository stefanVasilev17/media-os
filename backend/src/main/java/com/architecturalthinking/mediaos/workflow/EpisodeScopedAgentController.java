package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

/**
 * Explicit episode ID in URL; global creation filter audits and verifies it.
 * These endpoints never route through the legacy EP001 creative controllers.
 */
@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/agents/{stageKey}")
public class EpisodeScopedAgentController {
    private final EpisodeScopedAgentService agents;

    public EpisodeScopedAgentController(EpisodeScopedAgentService agents) {
        this.agents = agents;
    }

    public record Request(@NotBlank String action, @NotNull @Min(0) Integer expectedRevision,
                          @Size(max = 6000) String message) {}

    @PostMapping("/preview")
    public Map<String, Object> preview(@PathVariable UUID episodeId, @PathVariable String stageKey,
                                       @Valid @RequestBody Request request) {
        return agents.preview(episodeId, stageKey, request.action(),
                request.message(), request.expectedRevision());
    }

    @PostMapping("/run")
    public Map<String, Object> run(@PathVariable UUID episodeId, @PathVariable String stageKey,
                                   @Valid @RequestBody Request request, HttpServletRequest httpRequest) {
        Object attr = httpRequest.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(attr instanceof Map<?, ?> audited) || !(audited.get("auditId") instanceof UUID audit))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An audited episode-specific preflight is required.");
        return agents.run(episodeId, stageKey, request.action(),
                request.message(), request.expectedRevision(), audit);
    }
}
