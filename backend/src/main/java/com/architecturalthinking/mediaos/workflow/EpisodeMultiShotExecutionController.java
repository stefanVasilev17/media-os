package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/execution-jobs")
public class EpisodeMultiShotExecutionController {
    private final EpisodeMultiShotExecutionService executions;

    public EpisodeMultiShotExecutionController(EpisodeMultiShotExecutionService executions) {
        this.executions=executions;
    }

    @GetMapping
    public List<EpisodeMultiShotExecutionService.Job> list(@PathVariable UUID packageId) {
        return executions.list(packageId);
    }

    @GetMapping("/{jobId}")
    public EpisodeMultiShotExecutionService.Job get(
            @PathVariable UUID packageId,@PathVariable UUID jobId) {
        return executions.get(packageId,jobId);
    }

    @PostMapping("/prepare")
    public EpisodeMultiShotExecutionService.Job prepare(
            @PathVariable UUID packageId,
            @RequestBody EpisodeMultiShotExecutionService.PrepareRequest input,
            HttpServletRequest request) {
        return executions.prepare(packageId,input,preflight(request));
    }

    @PostMapping("/{jobId}/cancel")
    public EpisodeMultiShotExecutionService.Job cancel(
            @PathVariable UUID packageId,@PathVariable UUID jobId,
            @RequestBody EpisodeMultiShotExecutionService.CancelRequest input,
            HttpServletRequest request) {
        return executions.cancel(packageId,jobId,input==null?null:input.confirmCancel(),
                preflight(request));
    }

    private static UUID preflight(HttpServletRequest request) {
        if(!(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> map)
                || !(map.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Director execution job requires an audited production preflight.");
        return id;
    }
}
