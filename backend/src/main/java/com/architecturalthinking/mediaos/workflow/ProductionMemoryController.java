package com.architecturalthinking.mediaos.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/production-memory")
public class ProductionMemoryController {

    private final ProductionMemoryService memory;
    private final CreativePolicyService policy;

    public ProductionMemoryController(ProductionMemoryService memory, CreativePolicyService policy) {
        this.memory = memory;
        this.policy = policy;
    }

    public record PreflightRequest(@NotBlank String scope, @NotBlank String action) {}
    public record CorrectionRequest(@NotBlank String scope, @NotBlank String content, String source) {}

    @GetMapping("/rules")
    public List<Map<String, Object>> rules(@RequestParam(defaultValue = "ALL") String scope) {
        return memory.rulesFor(scope);
    }

    @GetMapping("/context")
    public Map<String, Object> context(@RequestParam(defaultValue = "ALL") String scope) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", ProductionOverviewService.EPISODE_ID);
        result.put("policy", policy.current());
        result.put("rules", memory.rulesFor(scope));
        result.put("approvedAssets", memory.approvedAssets());
        result.put("directorLockedShots", memory.directorLockedShots(ProductionOverviewService.EPISODE_ID));
        result.put("semanticApproval", false);
        result.put("note", "Read-only context preview. An actual creation must pass an audited global preflight.");
        return result;
    }

    @PostMapping("/preflight")
    public Map<String, Object> preflight(@Valid @RequestBody PreflightRequest request) {
        return memory.preflight(request.scope(), request.action());
    }

    @PostMapping("/corrections")
    public Map<String, Object> correction(@Valid @RequestBody CorrectionRequest request) {
        try {
            return memory.rememberCorrection(request.scope(), request.content(), request.source());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
