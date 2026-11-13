package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages")
public class EpisodePackageImportController {
    private final EpisodePackageImportService packages;

    public EpisodePackageImportController(EpisodePackageImportService packages) {
        this.packages=packages;
    }

    @GetMapping
    public List<Map<String,Object>> all() {
        return packages.list();
    }

    @GetMapping("/{packageId}")
    public EpisodePackageImportService.ImportedEpisode details(@PathVariable UUID packageId) {
        return packages.get(packageId);
    }

    @PostMapping("/prepare-ep003")
    public EpisodePackageImportService.ImportedEpisode prepareEp003(HttpServletRequest request) {
        Object attr=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(attr instanceof Map<?,?> values)
                || !(values.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP003 voice source setup requires audited Director preflight.");
        return packages.prepareEp003(auditId);
    }

    @PostMapping("/import")
    public EpisodePackageImportService.ImportedEpisode importFile(
            @RequestBody EpisodePackageImportService.ImportRequest input,
            HttpServletRequest request) {
        Object attr=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(attr instanceof Map<?,?> values)
                || !(values.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode source import requires audited Director preflight.");
        return packages.importFile(input,auditId);
    }
}
