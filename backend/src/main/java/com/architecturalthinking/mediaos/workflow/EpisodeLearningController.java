package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

/**
 * Learning Review is independent from episode Director stage locks.
 * A proposed correction is never global until a separately authorized decision.
 */
@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/learning")
public class EpisodeLearningController {
    private final EpisodeLearningService learning;

    public EpisodeLearningController(EpisodeLearningService learning) {
        this.learning = learning;
    }

    public record DecisionRequest(@NotBlank String action, @NotBlank String reviewNote,
                                  String reviewedBy,
                                  boolean comparedExistingRules,
                                  @NotBlank String expectedGlobalFingerprint) {}

    @GetMapping
    public Map<String, Object> review(@PathVariable UUID episodeId) {
        return learning.reviewContext(episodeId);
    }

    @PostMapping("/refresh")
    public Map<String, Object> refresh(@PathVariable UUID episodeId, HttpServletRequest request) {
        return learning.refresh(episodeId, audit(request));
    }

    @PostMapping("/{proposalId}/decision")
    public Map<String, Object> decide(@PathVariable UUID episodeId, @PathVariable UUID proposalId,
                                       @Valid @RequestBody DecisionRequest body,
                                       @RequestHeader(value = "X-MediaOS-Director-Approval", required = false)
                                       String directorCapability,
                                       HttpServletRequest request) {
        return learning.decide(episodeId, proposalId, body.action(), body.reviewNote(),
                null, body.comparedExistingRules(), body.expectedGlobalFingerprint(),
                directorCapability, audit(request));
    }

    private UUID audit(HttpServletRequest request) {
        Object raw = request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(raw instanceof Map<?, ?> m) || !(m.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Learning Review mutations require the canonical audited creation preflight.");
        return id;
    }
}
