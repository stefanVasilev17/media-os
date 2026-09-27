package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class RunpodGpuRenderDispatcher {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String endpointId;
    private final String apiKey;
    private final String publicUrl;

    public RunpodGpuRenderDispatcher(
            ObjectMapper objectMapper,
            @Value("${RUNPOD_RENDER_ENDPOINT_ID:}") String endpointId,
            @Value("${RUNPOD_API_KEY:}") String apiKey,
            @Value("${MEDIA_OS_PUBLIC_URL:}") String publicUrl
    ) {
        this.objectMapper = objectMapper;
        this.endpointId = endpointId == null ? "" : endpointId.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.publicUrl = publicUrl == null ? "" : publicUrl.trim().replaceAll("/+$", "");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return !endpointId.isBlank() && !apiKey.isBlank() && !publicUrl.isBlank();
    }

    public String dispatch(UUID renderId, String callbackToken) {
        if (!isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud GPU rendering is not configured yet."
            );
        }

        try {
            Map<String, Object> input = new LinkedHashMap<>();
            input.put("renderId", renderId.toString());
            input.put("callbackToken", callbackToken);
            input.put("backendUrl", publicUrl);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("input", input);
            body.put("policy", Map.of(
                    "executionTimeout", 300_000,
                    "ttl", 900_000
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.runpod.ai/v2/" + endpointId + "/run"))
                    .timeout(Duration.ofSeconds(25))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String detail = response.body() == null ? "" : response.body().trim();
                if (detail.length() > 800) detail = detail.substring(0, 800);
                throw new IllegalStateException("Runpod rejected the render job: HTTP " + response.statusCode() + " " + detail);
            }

            Map<String, Object> result = objectMapper.readValue(
                    response.body(),
                    new TypeReference<LinkedHashMap<String, Object>>() {}
            );
            String jobId = String.valueOf(result.getOrDefault("id", "")).trim();
            if (jobId.isBlank()) {
                throw new IllegalStateException("Runpod accepted the request without returning a job id.");
            }
            return jobId;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    ex.getMessage() == null || ex.getMessage().isBlank()
                            ? "Could not dispatch the GPU render job."
                            : ex.getMessage(),
                    ex
            );
        }
    }
}
