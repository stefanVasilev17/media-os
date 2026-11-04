package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/factory-production")
public class EpisodeFactoryPostCodeController {
    private final EpisodeFactoryPostCodeService pipeline;

    public EpisodeFactoryPostCodeController(EpisodeFactoryPostCodeService pipeline) {
        this.pipeline=pipeline;
    }

    @GetMapping("/runs")
    public List<EpisodeFactoryPostCodeService.Run> list(@PathVariable UUID packageId) {
        return pipeline.list(packageId);
    }

    @GetMapping("/runs/{runId}")
    public EpisodeFactoryPostCodeService.Run get(
            @PathVariable UUID packageId,@PathVariable UUID runId) {
        return pipeline.get(packageId,runId);
    }

    @PostMapping("/runs")
    public EpisodeFactoryPostCodeService.Run create(
            @PathVariable UUID packageId,
            @RequestBody EpisodeFactoryPostCodeService.CreateRequest request,
            HttpServletRequest http) {
        return pipeline.create(packageId,request,auditId(http));
    }

    @PostMapping("/runs/{runId}/verify-github")
    public EpisodeFactoryPostCodeService.SourceAuditResult verifyGitHub(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            HttpServletRequest http) {
        return pipeline.verifyCode(packageId,runId,auditId(http));
    }

    @PostMapping("/runs/{runId}/feedback")
    public EpisodeFactoryPostCodeService.Run feedback(
            @PathVariable UUID packageId,@PathVariable UUID runId,
            @RequestBody EpisodeFactoryPostCodeService.FeedbackRequest request,
            HttpServletRequest http) {
        return pipeline.feedback(packageId,runId,request,auditId(http));
    }

    private static UUID auditId(HttpServletRequest request) {
        if(!(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> data)
                || !(data.get("auditId") instanceof UUID audit))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Whole-episode factory changes require an audited Director production preflight.");
        return audit;
    }
}
