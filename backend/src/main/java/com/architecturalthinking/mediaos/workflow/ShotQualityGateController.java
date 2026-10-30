package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/quality-assertions")
public class ShotQualityGateController {
    private final ShotQualityGateService quality;
    private final ShotRevisionService revisions;

    public ShotQualityGateController(ShotQualityGateService quality, ShotRevisionService revisions) {
        this.quality = quality;
        this.revisions = revisions;
    }

    public record RegisterRequest(@NotNull UUID memoryRuleId,
                                  @NotBlank String target, @NotBlank String predicate,
                                  @NotBlank @Size(min=2,max=600) String literal,
                                  @NotBlank @Size(min=15,max=1500) String directorNote) {}

    @GetMapping
    public Map<String, Object> rules(@PathVariable UUID episodeId) {
        return Map.of(
                "fingerprint", quality.fingerprint(episodeId),
                "assertions", quality.assertions(episodeId),
                "semanticApproval", false,
                "description", "Exact deterministic checks linked to Director-reviewed Production Memory.");
    }

    @GetMapping("/shots/{shotKey}/report")
    public ShotQualityGateService.QualityReport report(@PathVariable UUID episodeId,
                                                        @PathVariable String shotKey) {
        var context = revisions.context(episodeId, shotKey);
        var item = context.draft() != null ? context.draft() : context.approved();
        String narration = item == null ? context.originalNarration() : item.narration();
        return quality.inspect(episodeId, narration,
                item == null ? "" : item.voiceDirection(),
                item == null ? "" : item.visualDirection());
    }

    @PostMapping
    public Map<String, Object> register(@PathVariable UUID episodeId,
                                        @Valid @RequestBody RegisterRequest request,
                                        @RequestHeader(value="X-MediaOS-Director-Approval",required=false)
                                        String directorCapability,
                                        HttpServletRequest http) {
        Object audit = http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(audit instanceof Map<?,?> map) || !(map.get("auditId") instanceof UUID)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A valid episode-scoped global creation preflight is required.");
        }
        return quality.register(episodeId, request.memoryRuleId(),
                request.target(), request.predicate(), request.literal(),
                request.directorNote(), directorCapability);
    }
}
