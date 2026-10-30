package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.AiSpendGuardAspect;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/research")
public class EpisodeResearchAgentController {
    private final EpisodeResearchAgentService agent;

    public EpisodeResearchAgentController(EpisodeResearchAgentService agent) {
        this.agent = agent;
    }

    public record Request(@NotNull @Min(0) Integer expectedRevision) {}

    @PostMapping("/preview")
    public Map<String,Object> preview(@PathVariable UUID episodeId,
                                      @Valid @RequestBody Request request) {
        return agent.preview(episodeId, request.expectedRevision());
    }

    @PostMapping("/run")
    public Map<String,Object> generate(@PathVariable UUID episodeId,
                                       @Valid @RequestBody Request request,
                                       HttpServletRequest http) {
        Object preflight = http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(preflight instanceof Map<?,?> audit) || !(audit.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Audited episode preflight required.");
        return agent.generate(episodeId, request.expectedRevision(),
                http.getHeader(AiSpendGuardAspect.PREVIEW_AUTHORIZATION_HEADER), auditId);
    }
}
