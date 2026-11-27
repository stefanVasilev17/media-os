package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/distribution")
public class EpisodeDistributionController {
    private final EpisodeDistributionService service;
    public EpisodeDistributionController(EpisodeDistributionService service){this.service=service;}
    @GetMapping
    public EpisodeDistributionService.View get(@PathVariable UUID packageId){return service.get(packageId);}
    @GetMapping("/items/{itemId}/history")
    public List<EpisodeDistributionService.Item> history(@PathVariable UUID packageId,@PathVariable UUID itemId){return service.history(packageId,itemId);}
    @PostMapping("/items")
    public EpisodeDistributionService.View change(@PathVariable UUID packageId,@RequestBody EpisodeDistributionService.Change change,HttpServletRequest request){
        EpisodePublishingStudioController.requirePreflight(request);return service.change(packageId,change);
    }
    @PostMapping("/launch")
    public EpisodeDistributionService.View launch(@PathVariable UUID packageId,@RequestBody EpisodeDistributionService.LaunchChange change,HttpServletRequest request){
        EpisodePublishingStudioController.requirePreflight(request);return service.recordLaunch(packageId,change);
    }
}
