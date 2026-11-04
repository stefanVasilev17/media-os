package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/batch-plan")
public class Ep002EpisodeBatchPlanController {
    private final Ep002EpisodeBatchPlanService plans;

    public Ep002EpisodeBatchPlanController(Ep002EpisodeBatchPlanService plans) {
        this.plans = plans;
    }

    public record PrepareRequest(UUID requestId,String expectedFingerprint,Boolean confirmNoExecution) {}

    @GetMapping
    public Ep002EpisodeBatchPlanService.Plan preview() {
        return plans.preview();
    }

    @GetMapping("/latest")
    public Map<String,Object> latest() {
        return plans.latest();
    }

    @PostMapping("/prepare")
    public Ep002EpisodeBatchPlanService.StoredPlan prepare(@RequestBody PrepareRequest request) {
        DirectorIdentity.requireDirector();
        if (request == null)
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,"Batch plan request is required.");
        return plans.prepare(request.requestId(),request.expectedFingerprint(),request.confirmNoExecution());
    }
}
