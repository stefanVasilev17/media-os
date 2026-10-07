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

    public ElevenLabsTextToSpeechService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        this.apiKey = System.getenv().getOrDefault("ELEVENLABS_API_KEY", "").trim();
        this.voiceId = System.getenv().getOrDefault("ELEVENLABS_VOICE_ID", "").trim();
        this.modelId = System.getenv().getOrDefault("ELEVENLABS_MODEL_ID", "eleven_v4").trim();
        this.outputFormat = System.getenv().getOrDefault("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128").trim();
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

    public GenerationResult generate(
            String shotKey,
            String text,
            String previousText,
            String nextText
    ) {
        if (!apiConfigured()) throw new IllegalStateException("ELEVENLABS_API_KEY is not configured.");
        if (!StringUtils.hasText(voiceId)) throw new IllegalStateException("ELEVENLABS_VOICE_ID is not configured.");
        if (!StringUtils.hasText(text)) throw new IllegalArgumentException("Locked narration is required.");

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("text", text);
        request.put("model_id", modelId);
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
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException || ex instanceof IllegalArgumentException) throw ex;
            throw new IllegalStateException("ElevenLabs TTS generation failed: " + ex.getMessage(), ex);
        }
    }
}
