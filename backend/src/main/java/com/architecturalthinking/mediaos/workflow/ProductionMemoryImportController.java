package com.architecturalthinking.mediaos.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/production-memory/imports")
public class ProductionMemoryImportController {
    private final ProductionMemoryImportService imports;

    public ProductionMemoryImportController(ProductionMemoryImportService imports) {
        this.imports = imports;
    }

    public record ReviewRequest(@NotBlank String action,
                                @NotBlank @Size(min=15,max=2000) String directorNote,
                                @NotBlank @Size(min=3,max=120) String reviewer,
                                boolean comparedExistingRules,
                                @NotBlank String expectedFingerprint) {}

    @GetMapping
    public Map<String, Object> batches() {
        return Map.of("batches", imports.batches(), "writesEnabled", imports.writesAvailable(),
                "automaticActivation", false);
    }

    @GetMapping("/{batchId}")
    public Map<String, Object> batch(@PathVariable UUID batchId) {
        return imports.batch(batchId);
    }

    @PostMapping(value="/stage", consumes=MediaType.TEXT_PLAIN_VALUE)
    public Map<String, Object> stage(@RequestBody String rawJson,
                                     @RequestHeader(value="X-MediaOS-Director-Approval",required=false)
                                     String approval) {
        return imports.stage(rawJson, approval);
    }

    @PostMapping("/{batchId}/candidates/{candidateKey}/review")
    public Map<String, Object> review(@PathVariable UUID batchId,
                                       @PathVariable String candidateKey,
                                       @Valid @RequestBody ReviewRequest request,
                                       @RequestHeader(value="X-MediaOS-Director-Approval",required=false)
                                       String approval) {
        if (!candidateKey.matches("[A-Za-z0-9_-]{4,90}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid candidate key.");
        return imports.decide(batchId, candidateKey, request.action(), request.directorNote(),
                request.reviewer(), request.comparedExistingRules(),
                request.expectedFingerprint(), approval);
    }
}
