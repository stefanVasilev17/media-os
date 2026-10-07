package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ElevenLabsForcedAlignmentService {

    private static final String ENDPOINT = "https://api.elevenlabs.io/v1/forced-alignment";

    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;

    public ElevenLabsForcedAlignmentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        this.apiKey = System.getenv().getOrDefault("ELEVENLABS_API_KEY", "").trim();
    }

    public boolean configured() {
        return StringUtils.hasText(apiKey);
    }

    public Map<String, Object> align(MultipartFile file, String transcript) {
        if (!configured()) {
            throw new IllegalStateException("ELEVENLABS_API_KEY is not configured.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is required.");
        }
        if (!StringUtils.hasText(transcript)) {
            throw new IllegalArgumentException("Locked narration is required.");
        }

        try {
            byte[] bytes = file.getBytes();
            String fileName = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "shot-audio.wav";
            MediaType fileType = StringUtils.hasText(file.getContentType())
                    ? MediaType.parseMediaType(file.getContentType())
                    : MediaType.APPLICATION_OCTET_STREAM;

            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            MultipartBodyBuilder body = new MultipartBodyBuilder();
            body.part("file", resource).contentType(fileType);
            body.part("text", transcript, MediaType.TEXT_PLAIN);

            String response = restClient.post()
                    .uri(ENDPOINT)
                    .header("xi-api-key", apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body.build())
                    .retrieve()
                    .body(String.class);

            if (!StringUtils.hasText(response)) {
                throw new IllegalStateException("ElevenLabs returned an empty forced-alignment response.");
            }

            return objectMapper.readValue(response, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read the uploaded audio file.", ex);
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException || ex instanceof IllegalArgumentException) throw ex;
            throw new IllegalStateException("ElevenLabs forced alignment failed: " + ex.getMessage(), ex);
        }
    }
}
