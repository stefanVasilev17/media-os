package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/execution-jobs/{jobId}/director-start")
public class EpisodeMultiShotDirectorStartController {
    private final EpisodeMultiShotDirectorStartService starts;

    public EpisodeMultiShotDirectorStartController(EpisodeMultiShotDirectorStartService starts) {
        this.starts=starts;
    }

    @GetMapping
    public EpisodeMultiShotDirectorStartService.StartApproval read(
            @PathVariable UUID packageId,@PathVariable UUID jobId) {
        return starts.get(packageId,jobId);
    }

    @PostMapping("/approve")
    public EpisodeMultiShotDirectorStartService.StartApproval approve(
            @PathVariable UUID packageId,@PathVariable UUID jobId,
            @RequestBody EpisodeMultiShotDirectorStartService.StartRequest request,
            HttpServletRequest http) {
        if (!(http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> map)
                || !(map.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Director Start requires an audited creation preflight.");
        return starts.approve(packageId,jobId,request,auditId);
    }
}
