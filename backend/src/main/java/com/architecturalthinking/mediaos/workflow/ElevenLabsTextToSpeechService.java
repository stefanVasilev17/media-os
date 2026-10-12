package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ElevenLabsTextToSpeechService {

    public record GenerationResult(
            byte[] audio,
            String contentType,
            String fileName,
            String voiceId,
            String modelId,
            String outputFormat,
            String requestId,
            Map<String, Object> alignmentResponse
    ) {}

    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String voiceId;
    private final String modelId;
    private final String outputFormat;
    private final double speed;
    private final double stability;
    private final double similarityBoost;
    private final double style;
    private final boolean useSpeakerBoost;

    public ElevenLabsTextToSpeechService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        this.apiKey = System.getenv().getOrDefault("ELEVENLABS_API_KEY", "").trim();
        this.voiceId = System.getenv().getOrDefault("ELEVENLABS_VOICE_ID", "").trim();
        this.modelId = System.getenv().getOrDefault("ELEVENLABS_MODEL_ID", "eleven_v4").trim();
        this.outputFormat = System.getenv().getOrDefault("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128").trim();
        this.speed = envDouble("ELEVENLABS_SPEED", 0.90, 0.7, 1.2);
        this.stability = envDouble("ELEVENLABS_STABILITY", 0.50, 0.0, 1.0);
        this.similarityBoost = envDouble("ELEVENLABS_SIMILARITY_BOOST", 0.80, 0.0, 1.0);
        this.style = envDouble("ELEVENLABS_STYLE", 0.0, 0.0, 1.0);
        this.useSpeakerBoost = Boolean.parseBoolean(
                System.getenv().getOrDefault("ELEVENLABS_USE_SPEAKER_BOOST", "true").trim()
        );
    }

    public boolean apiConfigured() {
        return StringUtils.hasText(apiKey);
    }

    public boolean configured() {
        return apiConfigured() && StringUtils.hasText(voiceId);
    }

    public String voiceId() {
        return voiceId;
    }

    public String modelId() {
        return modelId;
    }

    public String outputFormat() {
        return outputFormat;
    }

    public Map<String, Object> voiceSettings() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("stability", stability);
        settings.put("similarityBoost", similarityBoost);
        if (!isV4()) {
            settings.put("speed", speed);
            settings.put("style", style);
            settings.put("useSpeakerBoost", useSpeakerBoost);
        }
        return settings;
    }

    public boolean supportsAudioTags() {
        return isV4() || modelId.startsWith("eleven_v3");
    }

    private static final String SAFE_V4_DIRECTION = "calm, conversational, confident";

    private boolean isV4() {
        return modelId.startsWith("eleven_v4");
    }

    private String promptedText(String narration, String performanceDirection) {
        if (!supportsAudioTags() || !StringUtils.hasText(performanceDirection)) return narration;
        String direction = performanceDirection.trim()
                .replace("[", "")
                .replace("]", "")
                .replaceAll("\\s+", " ");
        if (isV4() && !SAFE_V4_DIRECTION.equals(direction)) {
            throw new IllegalArgumentException(
                    "Unsafe Eleven v4 performance direction blocked before API call. "
                            + "Allowed production tag: " + SAFE_V4_DIRECTION
            );
        }
        return "[" + direction + "] " + narration;
    }

    private static double overrideDouble(Map<String, Object> overrides, String key, double fallback, double min, double max) {
        if (overrides == null || !overrides.containsKey(key)) return fallback;
        Object raw = overrides.get(key);
        double value;
        if (raw instanceof Number number) value = number.doubleValue();
        else {
            try {
                value = Double.parseDouble(String.valueOf(raw));
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException(key + " must be a decimal number.", ex);
            }
        }
        if (!Double.isFinite(value) || value < min || value > max) {
            throw new IllegalArgumentException(key + " must be between " + min + " and " + max + ".");
        }
        return value;
    }

    private static boolean overrideBoolean(Map<String, Object> overrides, String key, boolean fallback) {
        if (overrides == null || !overrides.containsKey(key)) return fallback;
        Object raw = overrides.get(key);
        if (raw instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private static double envDouble(String key, double fallback, double min, double max) {
        String raw = System.getenv().getOrDefault(key, "").trim();
        if (raw.isBlank()) return fallback;
        try {
            double value = Double.parseDouble(raw);
            if (!Double.isFinite(value) || value < min || value > max) {
                throw new IllegalStateException(key + " must be between " + min + " and " + max + ".");
            }
            return value;
        } catch (NumberFormatException ex) {
            throw new IllegalStateException(key + " must be a valid decimal number.", ex);
        }
    }

    public GenerationResult generate(
            String shotKey,
            String text,
            String previousText,
            String nextText
    ) {
        return generate(shotKey, text, previousText, nextText, Map.of(), "");
    }

    public GenerationResult generate(
            String shotKey,
            String text,
            String previousText,
            String nextText,
            Map<String, Object> overrides
    ) {
        return generate(shotKey, text, previousText, nextText, overrides, "");
    }

    public GenerationResult generate(
            String shotKey,
            String text,
            String previousText,
            String nextText,
            Map<String, Object> overrides,
            String performanceDirection
    ) {
        if (!apiConfigured()) throw new IllegalStateException("ELEVENLABS_API_KEY is not configured.");
        if (!StringUtils.hasText(voiceId)) throw new IllegalStateException("ELEVENLABS_VOICE_ID is not configured.");
        if (!StringUtils.hasText(text)) throw new IllegalArgumentException("Locked narration is required.");

        double resolvedStability = overrideDouble(overrides, "stability", stability, 0.0, 1.0);
        double resolvedSimilarity = overrideDouble(overrides, "similarityBoost", similarityBoost, 0.0, 1.0);

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("text", promptedText(text, performanceDirection));
        request.put("model_id", modelId);
        Map<String, Object> voiceSettings = new LinkedHashMap<>();
        voiceSettings.put("stability", resolvedStability);
        voiceSettings.put("similarity_boost", resolvedSimilarity);
        if (!isV4()) {
            double resolvedSpeed = overrideDouble(overrides, "speed", speed, 0.7, 1.2);
            double resolvedStyle = overrideDouble(overrides, "style", style, 0.0, 1.0);
            boolean resolvedSpeakerBoost = overrideBoolean(overrides, "useSpeakerBoost", useSpeakerBoost);
            voiceSettings.put("speed", resolvedSpeed);
            voiceSettings.put("style", resolvedStyle);
            voiceSettings.put("use_speaker_boost", resolvedSpeakerBoost);
        }
        request.put("voice_settings", voiceSettings);
        if (StringUtils.hasText(previousText)) request.put("previous_text", previousText);
        if (StringUtils.hasText(nextText)) request.put("next_text", nextText);

        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId
                + "/with-timestamps?output_format=" + outputFormat;

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(url)
                    .header("xi-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toEntity(String.class);

            if (!StringUtils.hasText(response.getBody())) {
                throw new IllegalStateException("ElevenLabs returned an empty TTS response.");
            }

            Map<String, Object> payload = objectMapper.readValue(
                    response.getBody(),
                    new TypeReference<LinkedHashMap<String, Object>>() {}
            );
            String audioBase64 = String.valueOf(payload.getOrDefault("audio_base64", ""));
            if (!StringUtils.hasText(audioBase64)) {
                throw new IllegalStateException("ElevenLabs TTS response did not contain audio.");
            }

            byte[] audio = Base64.getDecoder().decode(audioBase64);
            Map<String, Object> alignment = new LinkedHashMap<>();
            alignment.put("alignment", payload.get("alignment"));
            alignment.put("normalized_alignment", payload.get("normalized_alignment"));

            String requestId = response.getHeaders().getFirst("request-id");
            String contentType = outputFormat.startsWith("mp3") ? "audio/mpeg"
                    : outputFormat.startsWith("wav") ? "audio/wav"
                    : "application/octet-stream";
            String extension = outputFormat.startsWith("mp3") ? "mp3"
                    : outputFormat.startsWith("wav") ? "wav"
                    : "audio";
            String fileName = "EP001_" + shotKey.replace(' ', '_') + "_voice." + extension;

            return new GenerationResult(
                    audio,
                    contentType,
                    fileName,
                    voiceId,
                    modelId,
                    outputFormat,
                    requestId == null ? "" : requestId,
                    alignment
            );
        } catch (IllegalStateException | IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("ElevenLabs TTS generation failed: " + ex.getMessage(), ex);
        }
    }
}
