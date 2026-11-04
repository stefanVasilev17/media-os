package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/shots/{shotKey}/voice")
public class EpisodePackageVoiceStudioController {
    private final EpisodePackageVoiceStudioService voices;

    public EpisodePackageVoiceStudioController(EpisodePackageVoiceStudioService voices) {
        this.voices=voices;
    }

    public record SaveRequest(int expectedRevision,String narration,String voiceDirection) {}
    public record GenerateRequest(int expectedRevision,String expectedNarrationSha256,
                                  UUID requestId,Boolean confirmPaidElevenLabs) {}
    public record ApproveRequest(int expectedRevision,UUID takeId,String decision) {}

    @GetMapping
    public EpisodePackageVoiceStudioService.VoiceState state(
            @PathVariable UUID packageId,@PathVariable String shotKey) {
        return voices.state(packageId,shotKey);
    }

    @PutMapping("/script")
    public EpisodePackageVoiceStudioService.VoiceState save(
            @PathVariable UUID packageId,@PathVariable String shotKey,
            @RequestBody SaveRequest request,HttpServletRequest http) {
        requirePreflight(http);
        if(request==null || request.expectedRevision()<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Expected working narration revision is required.");
        return voices.save(packageId,shotKey,request.expectedRevision(),
                request.narration(),request.voiceDirection());
    }

    @PostMapping("/generate")
    public EpisodePackageVoiceStudioService.VoiceState generate(
            @PathVariable UUID packageId,@PathVariable String shotKey,
            @RequestBody GenerateRequest request,HttpServletRequest http) {
        requirePreflight(http);
        if(request==null || request.expectedRevision()<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current revision is required for paid generation.");
        return voices.generate(packageId,shotKey,request.expectedRevision(),
                request.expectedNarrationSha256(),request.requestId(),
                request.confirmPaidElevenLabs());
    }

    @PostMapping("/approve")
    public EpisodePackageVoiceStudioService.VoiceState approve(
            @PathVariable UUID packageId,@PathVariable String shotKey,
            @RequestBody ApproveRequest request,HttpServletRequest http) {
        requirePreflight(http);
        if(request==null || request.expectedRevision()<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current revision is required for Director voice approval.");
        return voices.approve(packageId,shotKey,request.expectedRevision(),
                request.takeId(),request.decision());
    }

    @GetMapping("/takes/{takeId}/audio")
    public ResponseEntity<byte[]> audio(
            @PathVariable UUID packageId,@PathVariable String shotKey,
            @PathVariable UUID takeId) {
        String content=voices.audioContentType(packageId,shotKey,takeId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(content))
                .body(voices.audio(packageId,shotKey,takeId));
    }

    private static void requirePreflight(HttpServletRequest request) {
        if (!(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> value)
                || !(value.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited Director voice action preflight required.");
    }
}
