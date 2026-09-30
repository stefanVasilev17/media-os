package com.architecturalthinking.mediaos.director;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/director/build")
public class EpisodeBuildController {

    private final EpisodeBuildService buildService;

    public EpisodeBuildController(EpisodeBuildService buildService) {
        this.buildService = buildService;
    }

    public record StartRequest(
            @Min(15) @Max(30) Integer budgetMinutes
    ) {}

    @GetMapping
    public Map<String, Object> state() {
        return buildService.state();
    }

    @PostMapping("/topics/generate")
    public Map<String, Object> generateTopics() {
        return buildService.generateTopics();
    }

    @PostMapping("/start")
    public Map<String, Object> start(@Valid @RequestBody(required = false) StartRequest request) {
        int budget = request == null || request.budgetMinutes() == null ? 20 : request.budgetMinutes();
        return buildService.startCurrentEpisode(budget);
    }

    @PostMapping("/retry")
    public Map<String, Object> retry() {
        return buildService.retryLatest();
    }
}
