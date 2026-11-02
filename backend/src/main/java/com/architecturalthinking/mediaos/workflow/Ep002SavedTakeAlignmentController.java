package com.architecturalthinking.mediaos.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/{shotKey}/align-existing-take")
public class Ep002SavedTakeAlignmentController {
    private final Ep002SavedTakeAlignmentService alignment;

    public Ep002SavedTakeAlignmentController(Ep002SavedTakeAlignmentService alignment) {
        this.alignment=alignment;
    }

    public record AlignRequest(@NotNull UUID preferredTakeId,
                               @NotNull @Min(1) Integer expectedRevision,
                               @NotNull UUID requestId,
                               boolean confirmPaidAlignment) {}

    @GetMapping
    public Map<String,Object> state(@PathVariable String shotKey) {
        return alignment.status(shotKey);
    }

    @PostMapping
    public Map<String,Object> align(@PathVariable String shotKey,
                                    @Valid @RequestBody AlignRequest request) {
        return alignment.align(shotKey,request.preferredTakeId(),request.expectedRevision(),
                request.requestId(),request.confirmPaidAlignment());
    }
}
