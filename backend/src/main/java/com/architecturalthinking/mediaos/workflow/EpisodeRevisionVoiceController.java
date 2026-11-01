package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/voice")
public class EpisodeRevisionVoiceController {
    private final EpisodeRevisionVoiceService voices;

    public EpisodeRevisionVoiceController(EpisodeRevisionVoiceService voices) {
        this.voices = voices;
    }

    public record GenerateRequest(@NotNull @Min(0) Integer expectedRevision, UUID requestId) {
        public GenerateRequest(Integer expectedRevision) {
            this(expectedRevision, null);
        }
    }
    public record ApproveRequest(@NotNull @Min(0) Integer expectedRevision,
                                 @NotNull UUID takeId,
                                 String decision) {}

    @GetMapping
    public Map<String, Object> state(@PathVariable UUID episodeId, @PathVariable String shotKey) {
        return voices.state(episodeId, shotKey);
    }

    @PostMapping("/generate")
    public Map<String, Object> generate(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                        @Valid @RequestBody GenerateRequest request, HttpServletRequest http) {
        requirePreflight(http);
        return voices.generate(episodeId, shotKey, request.expectedRevision(), request.requestId());
    }

    @PostMapping("/approve")
    public Map<String, Object> approve(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                       @Valid @RequestBody ApproveRequest request, HttpServletRequest http) {
        requirePreflight(http);
        if (!"DIRECTOR_APPROVE".equals(request.decision()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voice approval requires explicit Director approval.");
        return voices.approve(episodeId, shotKey, request.expectedRevision(), request.takeId());
    }

    @GetMapping("/takes/{takeId}/audio")
    public ResponseEntity<byte[]> audio(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                        @PathVariable UUID takeId) {
        String mime = voices.audioContentType(episodeId, shotKey, takeId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(mime))
                .body(voices.audio(episodeId, shotKey, takeId));
    }

    private void requirePreflight(HttpServletRequest http) {
        if (!(http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?, ?> row)
                || !(row.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Audited episode-specific creation preflight required.");
    }
}
