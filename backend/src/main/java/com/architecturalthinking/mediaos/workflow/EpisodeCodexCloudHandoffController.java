package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/codex-cloud-handoffs")
public class EpisodeCodexCloudHandoffController {
    private final EpisodeCodexCloudHandoffService handoffs;

    public EpisodeCodexCloudHandoffController(EpisodeCodexCloudHandoffService handoffs) {
        this.handoffs=handoffs;
    }

    @GetMapping("/preview")
    public EpisodeCodexCloudHandoffService.Preview preview(@PathVariable UUID packageId) {
        return handoffs.preview(packageId);
    }

    @GetMapping
    public List<EpisodeCodexCloudHandoffService.Handoff> list(
            @PathVariable UUID packageId) {
        return handoffs.list(packageId);
    }

    @GetMapping("/{handoffId}")
    public EpisodeCodexCloudHandoffService.Handoff get(
            @PathVariable UUID packageId,@PathVariable UUID handoffId) {
        return handoffs.get(packageId,handoffId);
    }

    @PostMapping
    public EpisodeCodexCloudHandoffService.Handoff create(
            @PathVariable UUID packageId,
            @RequestBody EpisodeCodexCloudHandoffService.CreateRequest request,
            HttpServletRequest http) {
        return handoffs.create(packageId,request,preflight(http));
    }

    @PostMapping("/{handoffId}/record-pr")
    public EpisodeCodexCloudHandoffService.Handoff recordPr(
            @PathVariable UUID packageId,@PathVariable UUID handoffId,
            @RequestBody EpisodeCodexCloudHandoffService.LinkPrRequest request,
            HttpServletRequest http) {
        return handoffs.linkPr(packageId,handoffId,request,preflight(http));
    }

    private static UUID preflight(HttpServletRequest http) {
        if(!(http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> context)
                || !(context.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Subscription-only Codex handoff changes require an audited Director production preflight.");
        return auditId;
    }
}
