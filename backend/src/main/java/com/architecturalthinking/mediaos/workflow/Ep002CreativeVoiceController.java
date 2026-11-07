package com.architecturalthinking.mediaos.workflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/{shotKey}")
public class Ep002CreativeVoiceController {
    private final Ep002CreativeVoiceService voices;

    public Ep002CreativeVoiceController(Ep002CreativeVoiceService voices) {
        this.voices=voices;
    }

    public record SaveRequest(@NotNull @Min(0) Integer expectedRevision,
                              @NotNull String narration,String voiceDirection) {}
    public record GenerateRequest(@NotNull @Min(1) Integer expectedRevision,
                                  @NotNull UUID requestId) {}
    public record GenerateSlowRequest(@NotNull @Min(1) Integer expectedRevision,
                                      @NotNull UUID requestId,
                                      @NotNull Boolean confirmPaidGeneration) {}
    public record ApproveRequest(@NotNull @Min(1) Integer revision,
                                 @NotNull UUID takeId) {}

    @GetMapping
    public Map<String,Object> state(@PathVariable String shotKey) {
        return voices.state(shotKey);
    }

    @PutMapping
    public Map<String,Object> save(@PathVariable String shotKey,
                                   @Valid @RequestBody SaveRequest request) {
        return voices.save(shotKey,request.expectedRevision(),request.narration(),request.voiceDirection());
    }

    @PostMapping("/generate")
    public Map<String,Object> generate(@PathVariable String shotKey,
                                       @Valid @RequestBody GenerateRequest request) {
        return voices.generate(shotKey,request.expectedRevision(),request.requestId());
    }

    @PostMapping("/generate-slow")
    public Map<String,Object> generateSlow(@PathVariable String shotKey,
                                           @Valid @RequestBody GenerateSlowRequest request) {
        return voices.generateSlow(shotKey,request.expectedRevision(),request.requestId(),
                Boolean.TRUE.equals(request.confirmPaidGeneration()));
    }

    @PostMapping("/approve")
    public Map<String,Object> approve(@PathVariable String shotKey,
                                      @Valid @RequestBody ApproveRequest request) {
        return voices.approve(shotKey,request.revision(),request.takeId());
    }

    @GetMapping("/takes/{takeId}/audio")
    public ResponseEntity<byte[]> audio(@PathVariable String shotKey,@PathVariable UUID takeId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(voices.audioContentType(shotKey,takeId)))
                .body(voices.audio(shotKey,takeId));
    }
}
