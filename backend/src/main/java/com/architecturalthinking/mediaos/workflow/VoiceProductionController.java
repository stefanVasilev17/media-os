package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/voice")
public class VoiceProductionController {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ElevenLabsForcedAlignmentService elevenLabsAlignment;
    private final ElevenLabsTextToSpeechService elevenLabsTts;

    public VoiceProductionController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ElevenLabsForcedAlignmentService elevenLabsAlignment,
            ElevenLabsTextToSpeechService elevenLabsTts
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.elevenLabsAlignment = elevenLabsAlignment;
        this.elevenLabsTts = elevenLabsTts;
    }

    public record ShotRequest(
            @Positive int scriptRevision,
            @NotBlank String title,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String narration,
            String voiceDirection,
            boolean recorded
    ) {}

    public record AlignmentRequest(
            @Positive int scriptRevision,
            @Positive double durationSeconds,
            @NotBlank String audioFileName,
            @NotNull Map<String, Double> anchors
    ) {}

    public record GenerateVoiceRequest(
            @Positive int scriptRevision,
            String previousText,
            String nextText
    ) {}

    public record ApproveVoiceRequest(@Positive int scriptRevision) {}

    public record RemotionSyncRequest(@Positive int scriptRevision, boolean synced) {}

    @GetMapping("/shots")
    public List<Map<String, Object>> shots(@RequestParam int scriptRevision) {
        assertLockedScriptRevision(scriptRevision);
        return jdbc.sql("""
                select shot_key, shot_title, start_second, end_second, narration, voice_direction,
                       recorded_at, audio_file_name, alignment::text, aligned_at,
                       visual_sync_spec::text, visual_sync_markdown, visual_sync_ready_at,
                       remotion_synced_at, generated_audio is not null as voice_generated,
                       generated_audio_content_type, generated_audio_file_name,
                       generated_alignment::text, generated_voice_id, generated_model_id,
                       generation_revision, voice_generated_at, voice_approved_at,
                       remotion_render_id, rendered_generation_revision, rendered_at, updated_at
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:scriptRevision
                order by start_second, shot_key
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", scriptRevision)
                .query((rs, rowNum) -> row(rs))
                .list();
    }

    @PutMapping("/shots/{shotKey}")
    public Map<String, Object> upsertShot(@PathVariable String shotKey, @Valid @RequestBody ShotRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        if (request.endSecond() <= request.startSecond()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shot endSecond must be greater than startSecond.");
        }

        String key = normalizeShotKey(shotKey);
        jdbc.sql("""
                insert into voice_shot_workflow(
                    id, episode_id, script_revision, shot_key, shot_title, start_second, end_second,
                    narration, voice_direction, recorded_at, updated_at
                ) values (
                    :id, :episodeId, :scriptRevision, :shotKey, :title, :startSecond, :endSecond,
                    :narration, :voiceDirection, case when :recorded then now() else null end, now()
                )
                on conflict (episode_id, script_revision, shot_key) do update
                set shot_title=excluded.shot_title,
                    start_second=excluded.start_second,
                    end_second=excluded.end_second,
                    narration=excluded.narration,
                    voice_direction=excluded.voice_direction,
                    recorded_at=case when :recorded then coalesce(voice_shot_workflow.recorded_at, now()) else null end,
                    audio_file_name=case when :recorded then voice_shot_workflow.audio_file_name else null end,
                    alignment=case when :recorded then voice_shot_workflow.alignment else null end,
                    aligned_at=case when :recorded then voice_shot_workflow.aligned_at else null end,
                    visual_sync_spec=case when :recorded then voice_shot_workflow.visual_sync_spec else null end,
                    visual_sync_markdown=case when :recorded then voice_shot_workflow.visual_sync_markdown else null end,
                    visual_sync_ready_at=case when :recorded then voice_shot_workflow.visual_sync_ready_at else null end,
                    remotion_synced_at=case when :recorded then voice_shot_workflow.remotion_synced_at else null end,
                    remotion_render_id=case when :recorded then voice_shot_workflow.remotion_render_id else null end,
                    rendered_generation_revision=case when :recorded then voice_shot_workflow.rendered_generation_revision else null end,
                    rendered_at=case when :recorded then voice_shot_workflow.rendered_at else null end,
                    updated_at=now()
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", request.scriptRevision())
                .param("shotKey", key)
                .param("title", request.title().trim())
                .param("startSecond", request.startSecond())
                .param("endSecond", request.endSecond())
                .param("narration", request.narration().trim())
                .param("voiceDirection", request.voiceDirection() == null ? "" : request.voiceDirection().trim())
                .param("recorded", request.recorded())
                .update();

        return shotState(request.scriptRevision(), key);
    }

    @PostMapping("/shots/{shotKey}/alignment")
    public Map<String, Object> align(@PathVariable String shotKey, @Valid @RequestBody AlignmentRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeShotKey(shotKey);
        Map<String, Object> shot = shotState(request.scriptRevision(), key);
        if (!Boolean.TRUE.equals(shot.get("recorded"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mark the shot Recorded before creating alignment.");
        }
        if (request.anchors().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one semantic anchor is required.");
        }

        LinkedHashMap<String, Double> anchors = new LinkedHashMap<>();
        request.anchors().entrySet().stream()
                .sorted(Comparator.comparingDouble(entry -> entry.getValue() == null ? Double.MAX_VALUE : entry.getValue()))
                .forEach(entry -> {
                    String anchor = normalizeAnchor(entry.getKey());
                    Double seconds = entry.getValue();
                    if (seconds == null || !Double.isFinite(seconds) || seconds < 0 || seconds > request.durationSeconds()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Anchor " + anchor + " must be inside the audio duration.");
                    }
                    anchors.put(anchor, seconds);
                });

        Map<String, Object> spec = buildVisualSyncSpec(shot, request, anchors);
        String markdown = buildVisualSyncMarkdown(shot, request, anchors);

        jdbc.sql("""
                update voice_shot_workflow
                set audio_file_name=:audioFileName,
                    alignment=cast(:alignment as jsonb),
                    aligned_at=now(),
                    visual_sync_spec=cast(:spec as jsonb),
                    visual_sync_markdown=:markdown,
                    visual_sync_ready_at=now(),
                    remotion_synced_at=null,
                    remotion_render_id=null,
                    rendered_generation_revision=null,
                    rendered_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("audioFileName", request.audioFileName().trim())
                .param("alignment", writeJson(Map.of("durationSeconds", request.durationSeconds(), "anchors", anchors)))
                .param("spec", writeJson(spec))
                .param("markdown", markdown)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", request.scriptRevision())
                .param("shotKey", key)
                .update();

        return shotState(request.scriptRevision(), key);
    }

    @GetMapping("/tts-provider")
    public Map<String, Object> ttsProvider() {
        return Map.of(
                "provider", "ELEVENLABS_TTS_WITH_TIMESTAMPS",
                "apiConfigured", elevenLabsTts.apiConfigured(),
                "voiceConfigured", !elevenLabsTts.voiceId().isBlank(),
                "configured", elevenLabsTts.configured(),
                "voiceId", elevenLabsTts.voiceId(),
                "modelId", elevenLabsTts.modelId(),
                "outputFormat", elevenLabsTts.outputFormat()
        );
    }

    @PostMapping("/shots/{shotKey}/generate-voice")
    public Map<String, Object> generateVoice(
            @PathVariable String shotKey,
            @Valid @RequestBody GenerateVoiceRequest request
    ) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeShotKey(shotKey);
        Map<String, Object> shot = shotState(request.scriptRevision(), key);

        if (!elevenLabsTts.configured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "ElevenLabs TTS needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID."
            );
        }

        ElevenLabsTextToSpeechService.GenerationResult generated;
        try {
            generated = elevenLabsTts.generate(
                    key,
                    String.valueOf(shot.get("narration")),
                    request.previousText(),
                    request.nextText()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }

        Map<String, Object> generatedAlignment = new LinkedHashMap<>(generated.alignmentResponse());
        generatedAlignment.put("provider", "ELEVENLABS_TTS_WITH_TIMESTAMPS");
        generatedAlignment.put("requestId", generated.requestId());
        generatedAlignment.put("outputFormat", generated.outputFormat());

        jdbc.sql("""
                update voice_shot_workflow
                set generated_audio=:audio,
                    generated_audio_content_type=:contentType,
                    generated_audio_file_name=:fileName,
                    generated_alignment=cast(:generatedAlignment as jsonb),
                    generated_voice_id=:voiceId,
                    generated_model_id=:modelId,
                    generation_revision=generation_revision + 1,
                    voice_generated_at=now(),
                    voice_approved_at=null,
                    recorded_at=null,
                    audio_file_name=null,
                    alignment=null,
                    aligned_at=null,
                    visual_sync_spec=null,
                    visual_sync_markdown=null,
                    visual_sync_ready_at=null,
                    remotion_synced_at=null,
                    remotion_render_id=null,
                    rendered_generation_revision=null,
                    rendered_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("audio", generated.audio())
                .param("contentType", generated.contentType())
                .param("fileName", generated.fileName())
                .param("generatedAlignment", writeJson(generatedAlignment))
                .param("voiceId", generated.voiceId())
                .param("modelId", generated.modelId())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", request.scriptRevision())
                .param("shotKey", key)
                .update();

        return shotState(request.scriptRevision(), key);
    }

    @GetMapping("/shots/{shotKey}/generated-audio")
    public ResponseEntity<byte[]> generatedAudio(
            @PathVariable String shotKey,
            @RequestParam int scriptRevision,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range
    ) {
        assertLockedScriptRevision(scriptRevision);
        String key = normalizeShotKey(shotKey);

        return jdbc.sql("""
                select generated_audio, generated_audio_content_type, generated_audio_file_name
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", scriptRevision)
                .param("shotKey", key)
                .query((rs, rowNum) -> {
                    byte[] audio = rs.getBytes("generated_audio");
                    if (audio == null || audio.length == 0) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Generated voice audio not found.");
                    }
                    String contentType = rs.getString("generated_audio_content_type");
                    String fileName = rs.getString("generated_audio_file_name");
                    MediaType mediaType;
                    try {
                        mediaType = MediaType.parseMediaType(contentType == null ? "audio/mpeg" : contentType);
                    } catch (Exception ignored) {
                        mediaType = MediaType.APPLICATION_OCTET_STREAM;
                    }

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(mediaType);
                    headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
                    headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (fileName == null ? "voice.mp3" : fileName) + "\"");
                    headers.setCacheControl("private, max-age=31536000, immutable");

                    if (range == null || !range.startsWith("bytes=")) {
                        headers.setContentLength(audio.length);
                        return new ResponseEntity<>(audio, headers, HttpStatus.OK);
                    }

                    long[] parsed = parseByteRange(range, audio.length);
                    int start = (int) parsed[0];
                    int end = (int) parsed[1];
                    byte[] slice = java.util.Arrays.copyOfRange(audio, start, end + 1);
                    headers.setContentLength(slice.length);
                    headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + audio.length);
                    return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
                })
                .single();
    }

    @PostMapping("/shots/{shotKey}/approve-generated-voice")
    public Map<String, Object> approveGeneratedVoice(
            @PathVariable String shotKey,
            @Valid @RequestBody ApproveVoiceRequest request
    ) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeShotKey(shotKey);
        Map<String, Object> shot = shotState(request.scriptRevision(), key);
        Map<String, Object> generatedAlignment = asMap(shot.get("generatedAlignment"));

        if (!Boolean.TRUE.equals(shot.get("voiceGenerated")) || generatedAlignment.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Generate voice audio before approving it.");
        }

        List<Map<String, Object>> words = wordRowsFromTtsAlignment(generatedAlignment);
        double durationSeconds = words.stream()
                .map(row -> numberValue(row.get("end")))
                .filter(value -> value >= 0)
                .max(Double::compareTo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Generated TTS timing data is incomplete."));

        LinkedHashMap<String, String> anchorPhrases = Ep001SemanticAnchorCatalog.anchorsFor(key);
        LinkedHashMap<String, Double> anchors = resolveSemanticAnchors(words, anchorPhrases);
        LinkedHashMap<String, String> unresolved = new LinkedHashMap<>();
        anchorPhrases.forEach((anchor, phrase) -> {
            if (!anchors.containsKey(anchor)) unresolved.put(anchor, phrase);
        });

        if (anchors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Generated speech has timing data, but no semantic anchors could be matched.");
        }

        String audioFileName = String.valueOf(shot.getOrDefault("generatedAudioFileName", key.replace(' ', '_') + "_voice.mp3"));
        AlignmentRequest generated = new AlignmentRequest(request.scriptRevision(), durationSeconds, audioFileName, anchors);
        Map<String, Object> spec = new LinkedHashMap<>(buildVisualSyncSpec(shot, generated, anchors));
        spec.put("alignmentProvider", "ELEVENLABS_TTS_WITH_TIMESTAMPS");
        spec.put("anchorPhrases", anchorPhrases);
        spec.put("unresolvedAnchors", unresolved);
        spec.put("generationRevision", shot.get("generationRevision"));
        spec.put("voiceId", shot.get("generatedVoiceId"));
        spec.put("modelId", shot.get("generatedModelId"));

        String markdown = buildVisualSyncMarkdown(shot, generated, anchors);
        if (!unresolved.isEmpty()) {
            StringBuilder warnings = new StringBuilder(markdown);
            warnings.append("\n## Alignment warnings\n\n");
            warnings.append("These semantic anchors were not matched automatically and should be reviewed before Remotion sync:\n\n");
            unresolved.forEach((anchor, phrase) ->
                    warnings.append("- ").append(anchor).append(" → expected phrase: ").append(phrase).append("\n")
            );
            markdown = warnings.toString();
        }

        Map<String, Object> alignmentPayload = new LinkedHashMap<>();
        alignmentPayload.put("provider", "ELEVENLABS_TTS_WITH_TIMESTAMPS");
        alignmentPayload.put("durationSeconds", round3(durationSeconds));
        alignmentPayload.put("words", words);
        alignmentPayload.put("anchors", anchors);
        alignmentPayload.put("anchorPhrases", anchorPhrases);
        alignmentPayload.put("unresolvedAnchors", unresolved);
        alignmentPayload.put("generationRevision", shot.get("generationRevision"));

        jdbc.sql("""
                update voice_shot_workflow
                set voice_approved_at=now(),
                    recorded_at=now(),
                    audio_file_name=generated_audio_file_name,
                    alignment=cast(:alignment as jsonb),
                    aligned_at=now(),
                    visual_sync_spec=cast(:spec as jsonb),
                    visual_sync_markdown=:markdown,
                    visual_sync_ready_at=now(),
                    remotion_synced_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("alignment", writeJson(alignmentPayload))
                .param("spec", writeJson(spec))
                .param("markdown", markdown)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", request.scriptRevision())
                .param("shotKey", key)
                .update();

        return shotState(request.scriptRevision(), key);
    }

    @GetMapping("/alignment-provider")
    public Map<String, Object> alignmentProvider() {
        return Map.of(
                "provider", "ELEVENLABS_FORCED_ALIGNMENT",
                "configured", elevenLabsAlignment.configured(),
                "mode", "AUDIO_PLUS_LOCKED_TRANSCRIPT",
                "semanticAnchorCatalog", "EP001_V1"
        );
    }

    @PostMapping(value = "/shots/{shotKey}/auto-align", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> autoAlign(
            @PathVariable String shotKey,
            @RequestParam int scriptRevision,
            @RequestPart("file") MultipartFile file
    ) {
        assertLockedScriptRevision(scriptRevision);
        String key = normalizeShotKey(shotKey);
        Map<String, Object> shot = shotState(scriptRevision, key);

        if (!Boolean.TRUE.equals(shot.get("recorded"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mark the shot Recorded before uploading audio for alignment.");
        }
        if (!elevenLabsAlignment.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ELEVENLABS_API_KEY is not configured in MediaOS.");
        }

        Map<String, Object> providerResponse;
        try {
            providerResponse = elevenLabsAlignment.align(file, String.valueOf(shot.get("narration")));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }

        List<Map<String, Object>> words = wordRows(providerResponse.get("words"));
        double durationSeconds = words.stream()
                .map(row -> numberValue(row.get("end")))
                .filter(value -> value >= 0)
                .max(Double::compareTo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ElevenLabs returned no usable word timings."));

        LinkedHashMap<String, String> anchorPhrases = Ep001SemanticAnchorCatalog.anchorsFor(key);
        LinkedHashMap<String, Double> anchors = resolveSemanticAnchors(words, anchorPhrases);
        LinkedHashMap<String, String> unresolved = new LinkedHashMap<>();
        anchorPhrases.forEach((anchor, phrase) -> {
            if (!anchors.containsKey(anchor)) unresolved.put(anchor, phrase);
        });

        if (anchors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Alignment succeeded, but no EP001 semantic anchors could be matched.");
        }

        String audioFileName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? key.replace(' ', '_') + "_audio"
                : file.getOriginalFilename();

        AlignmentRequest generated = new AlignmentRequest(scriptRevision, durationSeconds, audioFileName, anchors);
        Map<String, Object> spec = new LinkedHashMap<>(buildVisualSyncSpec(shot, generated, anchors));
        spec.put("alignmentProvider", "ELEVENLABS_FORCED_ALIGNMENT");
        spec.put("anchorPhrases", anchorPhrases);
        spec.put("unresolvedAnchors", unresolved);
        spec.put("alignmentLoss", providerResponse.get("loss"));

        String markdown = buildVisualSyncMarkdown(shot, generated, anchors);
        if (!unresolved.isEmpty()) {
            StringBuilder warnings = new StringBuilder(markdown);
            warnings.append("\n## Alignment warnings\n\n");
            warnings.append("The following semantic anchors were not matched automatically and should be reviewed before Remotion sync:\n\n");
            unresolved.forEach((anchor, phrase) ->
                    warnings.append("- ").append(anchor).append(" → expected phrase: ").append(phrase).append("\n")
            );
            markdown = warnings.toString();
        }

        Map<String, Object> alignmentPayload = new LinkedHashMap<>();
        alignmentPayload.put("provider", "ELEVENLABS_FORCED_ALIGNMENT");
        alignmentPayload.put("durationSeconds", round3(durationSeconds));
        alignmentPayload.put("loss", providerResponse.get("loss"));
        alignmentPayload.put("words", words);
        alignmentPayload.put("anchors", anchors);
        alignmentPayload.put("anchorPhrases", anchorPhrases);
        alignmentPayload.put("unresolvedAnchors", unresolved);

        jdbc.sql("""
                update voice_shot_workflow
                set audio_file_name=:audioFileName,
                    alignment=cast(:alignment as jsonb),
                    aligned_at=now(),
                    visual_sync_spec=cast(:spec as jsonb),
                    visual_sync_markdown=:markdown,
                    visual_sync_ready_at=now(),
                    remotion_synced_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("audioFileName", audioFileName)
                .param("alignment", writeJson(alignmentPayload))
                .param("spec", writeJson(spec))
                .param("markdown", markdown)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", scriptRevision)
                .param("shotKey", key)
                .update();

        return shotState(scriptRevision, key);
    }

    @PostMapping("/shots/{shotKey}/remotion-synced")
    public Map<String, Object> remotionSynced(@PathVariable String shotKey, @Valid @RequestBody RemotionSyncRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeShotKey(shotKey);
        Map<String, Object> shot = shotState(request.scriptRevision(), key);
        if (request.synced() && !Boolean.TRUE.equals(shot.get("visualSyncReady"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Create the Visual Sync Spec before marking Remotion Synced.");
        }

        jdbc.sql("""
                update voice_shot_workflow
                set remotion_synced_at=case when :synced then now() else null end,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("synced", request.synced())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", request.scriptRevision())
                .param("shotKey", key)
                .update();

        return shotState(request.scriptRevision(), key);
    }

    private Map<String, Object> shotState(int scriptRevision, String shotKey) {
        return jdbc.sql("""
                select shot_key, shot_title, start_second, end_second, narration, voice_direction,
                       recorded_at, audio_file_name, alignment::text, aligned_at,
                       visual_sync_spec::text, visual_sync_markdown, visual_sync_ready_at,
                       remotion_synced_at, generated_audio is not null as voice_generated,
                       generated_audio_content_type, generated_audio_file_name,
                       generated_alignment::text, generated_voice_id, generated_model_id,
                       generation_revision, voice_generated_at, voice_approved_at,
                       remotion_render_id, rendered_generation_revision, rendered_at, updated_at
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:scriptRevision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scriptRevision", scriptRevision)
                .param("shotKey", shotKey)
                .query((rs, rowNum) -> row(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Voice workflow shot not found."));
    }

    private Map<String, Object> row(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("shotKey", rs.getString("shot_key"));
        row.put("title", rs.getString("shot_title"));
        row.put("startSecond", rs.getInt("start_second"));
        row.put("endSecond", rs.getInt("end_second"));
        row.put("narration", rs.getString("narration"));
        row.put("voiceDirection", rs.getString("voice_direction"));
        OffsetDateTime recordedAt = rs.getObject("recorded_at", OffsetDateTime.class);
        OffsetDateTime alignedAt = rs.getObject("aligned_at", OffsetDateTime.class);
        OffsetDateTime visualSyncReadyAt = rs.getObject("visual_sync_ready_at", OffsetDateTime.class);
        OffsetDateTime remotionSyncedAt = rs.getObject("remotion_synced_at", OffsetDateTime.class);
        row.put("recorded", recordedAt != null);
        row.put("recordedAt", recordedAt);
        row.put("audioFileName", rs.getString("audio_file_name"));
        row.put("alignment", readMap(rs.getString("alignment")));
        row.put("aligned", alignedAt != null);
        row.put("alignedAt", alignedAt);
        row.put("visualSyncSpec", readMap(rs.getString("visual_sync_spec")));
        row.put("visualSyncMarkdown", rs.getString("visual_sync_markdown"));
        row.put("visualSyncReady", visualSyncReadyAt != null);
        row.put("visualSyncReadyAt", visualSyncReadyAt);
        row.put("remotionSynced", remotionSyncedAt != null);
        row.put("remotionSyncedAt", remotionSyncedAt);
        OffsetDateTime voiceGeneratedAt = rs.getObject("voice_generated_at", OffsetDateTime.class);
        OffsetDateTime voiceApprovedAt = rs.getObject("voice_approved_at", OffsetDateTime.class);
        row.put("voiceGenerated", rs.getBoolean("voice_generated"));
        row.put("voiceGeneratedAt", voiceGeneratedAt);
        row.put("voiceApproved", voiceApprovedAt != null);
        row.put("voiceApprovedAt", voiceApprovedAt);
        row.put("generatedAudioContentType", rs.getString("generated_audio_content_type"));
        row.put("generatedAudioFileName", rs.getString("generated_audio_file_name"));
        row.put("generatedAlignment", readMap(rs.getString("generated_alignment")));
        row.put("generatedVoiceId", rs.getString("generated_voice_id"));
        row.put("generatedModelId", rs.getString("generated_model_id"));
        row.put("generationRevision", rs.getInt("generation_revision"));
        UUID remotionRenderId = rs.getObject("remotion_render_id", UUID.class);
        OffsetDateTime renderedAt = rs.getObject("rendered_at", OffsetDateTime.class);
        row.put("remotionRenderId", remotionRenderId);
        row.put("renderedGenerationRevision", rs.getObject("rendered_generation_revision"));
        row.put("rendered", remotionRenderId != null && renderedAt != null);
        row.put("renderedAt", renderedAt);
        row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
        return row;
    }

    private Map<String, Object> buildVisualSyncSpec(Map<String, Object> shot, AlignmentRequest request, LinkedHashMap<String, Double> anchors) {
        List<Map<String, Object>> events = anchors.entrySet().stream().map(entry -> {
            double time = entry.getValue();
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("anchor", entry.getKey());
            event.put("timeSeconds", round3(time));
            event.put("frame30fps", Math.round(time * 30.0d));
            event.put("prepareAtSeconds", round3(Math.max(0.0d, time - 0.6d)));
            event.put("rule", "Prepare visual focus before the spoken anchor; activate on the anchor; let voice timing win.");
            return event;
        }).toList();

        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("schemaVersion", "1.0");
        spec.put("episodeId", ProductionOverviewService.EPISODE_ID.toString());
        spec.put("scriptRevision", currentScriptRevision());
        spec.put("shotKey", shot.get("shotKey"));
        spec.put("shotTitle", shot.get("title"));
        spec.put("oldScriptRange", Map.of("startSecond", shot.get("startSecond"), "endSecond", shot.get("endSecond")));
        spec.put("audio", Map.of("fileName", request.audioFileName().trim(), "durationSeconds", request.durationSeconds()));
        spec.put("narration", shot.get("narration"));
        spec.put("voiceDirection", shot.get("voiceDirection"));
        spec.put("semanticEvents", events);
        spec.put("syncRule", "Voice timing wins. Remotion events bind to semantic anchors, not the old approximate script seconds.");
        spec.put("generatedAt", OffsetDateTime.now().toString());
        return spec;
    }

    private String buildVisualSyncMarkdown(Map<String, Object> shot, AlignmentRequest request, LinkedHashMap<String, Double> anchors) {
        StringBuilder md = new StringBuilder();
        md.append("# ").append(shot.get("shotKey")).append(" — ").append(shot.get("title")).append(" — Visual Sync Spec\n\n");
        md.append("- Script revision: ").append(currentScriptRevision()).append("\n");
        md.append("- Audio: ").append(request.audioFileName().trim()).append("\n");
        md.append("- Audio duration: ").append(String.format(Locale.ROOT, "%.3fs", request.durationSeconds())).append("\n");
        md.append("- Old script range: ").append(formatClock(((Number) shot.get("startSecond")).intValue()))
                .append("–").append(formatClock(((Number) shot.get("endSecond")).intValue())).append("\n\n");
        md.append("Voice timing wins. Use these semantic anchors for Remotion timing instead of forcing the recording into the old approximate seconds.\n\n");
        md.append("## Semantic timeline\n\n");
        md.append("| Spoken time | Frame @30fps | Semantic anchor | Visual handoff |\n");
        md.append("| ---: | ---: | --- | --- |\n");
        for (Map.Entry<String, Double> entry : anchors.entrySet()) {
            double time = entry.getValue();
            md.append("| ").append(formatSeconds(time))
                    .append(" | ").append(Math.round(time * 30.0d))
                    .append(" | ").append(entry.getKey())
                    .append(" | Prepare at ").append(formatSeconds(Math.max(0.0d, time - 0.6d)))
                    .append("; activate/focus on spoken anchor. |\n");
        }
        md.append("\n## LOCKED narration\n\n").append(shot.get("narration")).append("\n\n");
        String voice = String.valueOf(shot.getOrDefault("voiceDirection", ""));
        if (!voice.isBlank()) md.append("## Voice direction\n\n").append(voice).append("\n\n");
        md.append("## Remotion handoff rule\n\n");
        md.append("Bind visual events to the semantic anchors above. Camera preparation may begin shortly before an anchor, but the visible semantic activation should land on the spoken concept. Preserve already LOCKED visual decisions unless explicitly unlocked.\n");
        return md.toString();
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, val) -> result.put(String.valueOf(key), val));
            return result;
        }
        return new LinkedHashMap<>();
    }

    private List<Map<String, Object>> wordRowsFromTtsAlignment(Map<String, Object> generatedAlignment) {
        Map<String, Object> normalized = asMap(generatedAlignment.get("normalized_alignment"));
        Map<String, Object> alignment = normalized.isEmpty()
                ? asMap(generatedAlignment.get("alignment"))
                : normalized;

        List<?> characters = alignment.get("characters") instanceof List<?> list ? list : List.of();
        List<?> starts = alignment.get("character_start_times_seconds") instanceof List<?> list ? list : List.of();
        List<?> ends = alignment.get("character_end_times_seconds") instanceof List<?> list ? list : List.of();
        int count = Math.min(characters.size(), Math.min(starts.size(), ends.size()));
        if (count == 0) return List.of();

        List<Map<String, Object>> words = new ArrayList<>();
        StringBuilder token = new StringBuilder();
        double tokenStart = -1.0d;
        double tokenEnd = -1.0d;

        for (int i = 0; i < count; i++) {
            String character = String.valueOf(characters.get(i));
            double start = numberValue(starts.get(i));
            double end = numberValue(ends.get(i));
            boolean wordChar = character.matches("[A-Za-z0-9']");

            if (wordChar) {
                if (token.length() == 0) tokenStart = start;
                token.append(character);
                tokenEnd = end;
            } else if (token.length() > 0) {
                words.add(Map.of("text", token.toString(), "start", tokenStart, "end", tokenEnd));
                token.setLength(0);
                tokenStart = -1.0d;
                tokenEnd = -1.0d;
            }
        }

        if (token.length() > 0) {
            words.add(Map.of("text", token.toString(), "start", tokenStart, "end", tokenEnd));
        }
        return words;
    }

    private record TimedToken(String token, double start, double end) {}

    private List<Map<String, Object>> wordRows(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Map<String, Object> row = new LinkedHashMap<>();
                map.forEach((key, val) -> row.put(String.valueOf(key), val));
                result.add(row);
            }
        }
        return result;
    }

    private LinkedHashMap<String, Double> resolveSemanticAnchors(
            List<Map<String, Object>> words,
            LinkedHashMap<String, String> anchorPhrases
    ) {
        List<TimedToken> tokens = new ArrayList<>();
        for (Map<String, Object> word : words) {
            String text = String.valueOf(word.getOrDefault("text", ""));
            double start = numberValue(word.get("start"));
            double end = numberValue(word.get("end"));
            for (String part : normalizedTokens(text)) {
                tokens.add(new TimedToken(part, start, end));
            }
        }

        LinkedHashMap<String, Double> resolved = new LinkedHashMap<>();
        for (Map.Entry<String, String> definition : anchorPhrases.entrySet()) {
            List<String> phrase = normalizedTokens(definition.getValue());
            if (phrase.isEmpty()) continue;

            for (int startIndex = 0; startIndex <= tokens.size() - phrase.size(); startIndex++) {
                boolean matches = true;
                for (int offset = 0; offset < phrase.size(); offset++) {
                    if (!tokens.get(startIndex + offset).token().equals(phrase.get(offset))) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    resolved.put(definition.getKey(), round3(tokens.get(startIndex).start()));
                    break;
                }
            }
        }
        return resolved;
    }

    private List<String> normalizedTokens(String value) {
        if (value == null || value.isBlank()) return List.of();
        String normalized = value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
        if (normalized.isBlank()) return List.of();
        return List.of(normalized.split("\\s+"));
    }

    private double numberValue(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        if (value == null) return -1.0d;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return -1.0d;
        }
    }

    private void assertLockedScriptRevision(int requestedRevision) {
        Map<String, Object> script = jdbc.sql("""
                select status, current_revision
                from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "status", rs.getString("status"),
                        "revision", rs.getInt("current_revision")
                ))
                .single();
        if (!"LOCKED".equals(script.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Script must be LOCKED before voice production begins.");
        }
        int revision = ((Number) script.get("revision")).intValue();
        if (revision != requestedRevision) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voice workflow belongs to locked Script revision " + revision + ".");
        }
    }

    private int currentScriptRevision() {
        return jdbc.sql("select current_revision from production_stage where episode_id=:episodeId and stage_key='SCRIPT'")
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query(Integer.class)
                .single();
    }

    private long[] parseByteRange(String range, int length) {
        try {
            String value = range.substring("bytes=".length()).split(",", 2)[0].trim();
            String[] parts = value.split("-", 2);
            long start = parts[0].isBlank() ? 0 : Long.parseLong(parts[0]);
            long end = parts.length < 2 || parts[1].isBlank() ? length - 1L : Long.parseLong(parts[1]);
            start = Math.max(0, Math.min(start, length - 1L));
            end = Math.max(start, Math.min(end, length - 1L));
            return new long[]{start, end};
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Invalid audio range.");
        }
    }

    private String normalizeShotKey(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('_', ' ');
        if (!normalized.matches("SHOT \\d{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shot key must use the canonical format SHOT 01.");
        }
        return normalized;
    }

    private String normalizeAnchor(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semantic anchor names cannot be blank.");
        }
        return normalized;
    }

    private double round3(double value) {
        return Math.round(value * 1000.0d) / 1000.0d;
    }

    private String formatSeconds(double seconds) {
        int whole = (int) Math.floor(seconds);
        int minutes = whole / 60;
        double remainder = seconds - minutes * 60;
        return String.format(Locale.ROOT, "%02d:%06.3f", minutes, remainder);
    }

    private String formatClock(int seconds) {
        return String.format(Locale.ROOT, "%02d:%02d", seconds / 60, seconds % 60);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize voice workflow payload.", ex);
        }
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }
}
