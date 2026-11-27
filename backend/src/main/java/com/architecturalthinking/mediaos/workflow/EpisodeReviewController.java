package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/review")
public class EpisodeReviewController {
    private final EpisodeReviewService service;
    public EpisodeReviewController(EpisodeReviewService service){this.service=service;}
    @GetMapping public EpisodeReviewService.View get(@PathVariable UUID packageId){return service.get(packageId);}
    @GetMapping("/previous") public List<EpisodeReviewService.Previous> previous(@PathVariable UUID packageId,@RequestParam(required=false) String category){
        return service.previous(packageId,category);
    }
    @GetMapping("/items/{itemId}/history") public List<EpisodeReviewService.Item> history(@PathVariable UUID packageId,@PathVariable UUID itemId){
        return service.history(packageId,itemId);
    }
    @PostMapping("/items") public EpisodeReviewService.View change(@PathVariable UUID packageId,@RequestBody EpisodeReviewService.Change change,HttpServletRequest request){
        EpisodePublishingStudioController.requirePreflight(request);
        return service.change(packageId,change,(UUID)((Map<?,?>)request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT")).get("auditId"));
    }
}
