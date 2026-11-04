package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}")
public class EpisodeFactoryRenderController {
    private final EpisodeFactoryRenderCoordinator coordinator;
    private final EpisodeFactoryPostCodeService runs;

    public EpisodeFactoryRenderController(EpisodeFactoryRenderCoordinator coordinator,
                                          EpisodeFactoryPostCodeService runs) {
        this.coordinator=coordinator;this.runs=runs;
    }

    @GetMapping("/build-evidence")
    public EpisodeFactoryRenderCoordinator.BuildEvidence buildEvidence(
            @PathVariable UUID packageId,@PathVariable UUID runId) {
        return coordinator.buildEvidence(runs.get(packageId,runId));
    }

    @PostMapping("/queue-shots")
    public EpisodeFactoryRenderCoordinator.QueueReceipt shots(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryRenderCoordinator.CpuApprovalRequest request,
            HttpServletRequest http) {
        return coordinator.queueShots(packageId,runId,request,auditId(http));
    }

    @PostMapping("/approve-shots")
    public EpisodeFactoryPostCodeService.Run approveShots(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryRenderCoordinator.ReviewRequest request,
            HttpServletRequest http) {
        return coordinator.approveAllShots(packageId,runId,request,auditId(http));
    }

    @PostMapping("/queue-master")
    public EpisodeFactoryRenderCoordinator.QueueReceipt master(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryRenderCoordinator.CpuApprovalRequest request,
            HttpServletRequest http) {
        return coordinator.queueMaster(packageId,runId,request,auditId(http));
    }

    @PostMapping("/queue-shorts")
    public EpisodeFactoryRenderCoordinator.QueueReceipt shorts(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryRenderCoordinator.CpuApprovalRequest request,
            HttpServletRequest http) {
        return coordinator.queueShorts(packageId,runId,request,auditId(http));
    }

    @PostMapping("/approve-final")
    public EpisodeFactoryPostCodeService.Run approveFinal(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryRenderCoordinator.ReviewRequest request,
            HttpServletRequest http) {
        return coordinator.approveFinal(packageId,runId,request,auditId(http));
    }

    private static UUID auditId(HttpServletRequest request) {
        if(!(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> data)
                || !(data.get("auditId") instanceof UUID audit))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Render/approval operations require an audited Director production preflight.");
        return audit;
    }
}
