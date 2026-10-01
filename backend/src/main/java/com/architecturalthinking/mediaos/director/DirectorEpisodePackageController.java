package com.architecturalthinking.mediaos.director;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director/package")
public class DirectorEpisodePackageController {

    private final EpisodeExecutionPackageService packageService;

    public DirectorEpisodePackageController(EpisodeExecutionPackageService packageService) {
        this.packageService = packageService;
    }

    public record PreviewRequest(
            @NotBlank @Size(max = 255) String filename,
            @NotBlank @Size(max = 2_000_000) String content
    ) {}

    public record ApplyRequest(UUID packageId) {}

    @PostMapping("/preview")
    public Map<String, Object> preview(@Valid @RequestBody PreviewRequest request) {
        return packageService.preview(request.filename(), request.content());
    }

    @PostMapping("/apply")
    public Map<String, Object> apply(@Valid @RequestBody ApplyRequest request) {
        if (request.packageId() == null) {
            throw new IllegalArgumentException("packageId is required.");
        }
        return packageService.apply(request.packageId());
    }

    @GetMapping("/current")
    public Map<String, Object> current() {
        return packageService.current();
    }
}
