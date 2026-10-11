package com.architecturalthinking.mediaos.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/production-memory")
public class ProductionMemoryController {

    private final ProductionMemoryService memory;

    public ProductionMemoryController(ProductionMemoryService memory) {
        this.memory = memory;
    }

    public record PreflightRequest(@NotBlank String scope, @NotBlank String action) {}
    public record CorrectionRequest(@NotBlank String scope, @NotBlank String content, String source) {}

    @GetMapping("/rules")
    public List<Map<String, Object>> rules(@RequestParam(defaultValue = "ALL") String scope) {
        return memory.rulesFor(scope);
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
