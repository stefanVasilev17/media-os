package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    public ElevenLabsForcedAlignmentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        this.apiKey = System.getenv().getOrDefault("ELEVENLABS_API_KEY", "").trim();
    }

    ElevenLabsForcedAlignmentService(ObjectMapper objectMapper,RestClient restClient,String apiKey) {
        this.objectMapper=objectMapper;
        this.restClient=restClient;
        this.apiKey=apiKey;
    }

    public boolean configured() {
        return StringUtils.hasText(apiKey);
    }

    public Map<String, Object> align(MultipartFile file, String transcript) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is required.");
        }
        try {
            return alignSavedAudio(file.getBytes(),file.getContentType(),file.getOriginalFilename(),transcript);
        } catch (IOException problem) {
            throw new IllegalStateException("Could not read the audio file.",problem);
        }
    }

    public Map<String,Object> alignSavedAudio(byte[] bytes,String contentType,
                                              String fileName,String transcript) {
        if (!configured()) {
            throw new IllegalStateException("ELEVENLABS_API_KEY is not configured.");
        }
        if (bytes == null || bytes.length == 0 || bytes.length > 24*1024*1024) {
            throw new IllegalArgumentException("Saved audio must be nonempty and at most 24 MB.");
        }
        if (!StringUtils.hasText(transcript)) {
            throw new IllegalArgumentException("Saved narration is required.");
        }
        MediaType fileType=StringUtils.hasText(contentType)
                ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        String safeFileName=StringUtils.hasText(fileName)?fileName:"saved-shot-audio.mp3";
        try {
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() { return safeFileName; }
            };
            HttpHeaders fileHeaders=new HttpHeaders();
            fileHeaders.setContentType(fileType);
            MultiValueMap<String,Object> body=new LinkedMultiValueMap<>();
            body.add("file",new HttpEntity<>(resource,fileHeaders));
            body.add("text",transcript);

            String response=restClient.post()
                    .uri(ENDPOINT)
                    .header("xi-api-key",apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body.build())
                    .retrieve().body(String.class);
            if (!StringUtils.hasText(response))
                throw new IllegalStateException("ElevenLabs returned empty forced-alignment data.");
            return objectMapper.readValue(response,new TypeReference<LinkedHashMap<String,Object>>() {});
        } catch (Exception cause) {
            if (cause instanceof IllegalArgumentException argument) throw argument;
            if (cause instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("ElevenLabs forced alignment failed.",cause);
        }
    }


}
