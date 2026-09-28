package com.architecturalthinking.mediaos.director;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DirectorAgentClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public DirectorAgentClient(
            ObjectMapper objectMapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${MEDIA_OS_DIRECTOR_MODEL:gpt-6-astra}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gpt-6-astra" : model.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    public boolean configured() {
        return !apiKey.isBlank();
    }

    public String model() {
        return model;
    }

    public DirectorReply generate(String mode, List<TranscriptMessage> transcript, Map<String, Object> context) {
        if (!configured()) {
            throw new IllegalStateException("Director intelligence is not configured. Add OPENAI_API_KEY to the Railway backend service.");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("max_output_tokens", 2200);
            payload.put("instructions", instructions(mode, context));

            List<Map<String, Object>> input = new ArrayList<>();
            for (TranscriptMessage message : transcript) {
                if (message.content() == null || message.content().isBlank()) continue;
                String role = switch (message.sender()) {
                    case "USER" -> "user";
                    case "AGENT" -> "assistant";
                    default -> null;
                };
                if (role == null) continue;
                input.add(Map.of("role", role, "content", message.content()));
            }
            payload.put("input", input);
            payload.put("text", Map.of("format", structuredOutputFormat()));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(100))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Director model request failed with HTTP " + response.statusCode() + ".");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String outputText = extractOutputText(root);
            if (outputText.isBlank()) {
                throw new IllegalStateException("Director model returned no usable text output.");
            }
            return objectMapper.readValue(outputText, DirectorReply.class);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Director model request was interrupted.", ex);
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("Director model request failed: " + ex.getMessage(), ex);
        }
    }

    private String instructions(String mode, Map<String, Object> context) throws Exception {
        return """
                You are MediaOS Director, the senior production-thinking agent for the Architectural Thinking YouTube production system.
                Talk naturally with the creator. Give substantive opinions, challenge weak assumptions, identify hidden production constraints, and improve ideas rather than merely agreeing.

                HARD OPERATING RULES:
                - The creator is the final decision maker.
                - Discussion never changes production state by itself.
                - Proposals must be explicit and remain reviewable until the creator locks them.
                - Never claim that a downstream scene, shot, asset, Spline object, render, or contract changed unless the production system actually reports that change.
                - Every implementation path must be cloud-first and must NOT require a Windows machine. Railway, server-side services, browser runtime, and on-demand GPU rendering are allowed. Do not propose a Windows runner dependency.
                - Preserve locked decisions and source-of-truth constraints. If an idea conflicts with them, explain the conflict clearly.
                - Prefer deterministic handoffs: exact object names, exact timing, exact contract fields, explicit dependencies, explicit risks.
                - Camera grammar: move when focus changes; stay still during reasoning; avoid constant drift, aggressive zooms, and decorative motion.
                - The architecture map is a persistent world. Full-map views are occasional overview/payoff shots; most shots intentionally focus on a subsystem.
                - If information is missing, say what is missing instead of inventing production facts.
                - Reply in the language used by the creator unless there is a strong reason not to.

                REQUEST MODE: %s
                DISCUSS = analyze and converse normally.
                CHALLENGE = actively search for technical, narrative, timing, cost, asset, camera, and pipeline weaknesses.
                IMPROVE = propose a materially better version while preserving the creator's intent.
                IMPACT = trace downstream effects across script, scenes, shots, assets, Spline, render, QA, and edit.

                RESPONSE CLASSIFICATION:
                - DISCUSSION when no concrete production change is being proposed.
                - PROPOSAL when you recommend a concrete change worth reviewing.
                - WARNING when a serious blocker or contradiction is the main point.
                - DECISION_READY only when the creator explicitly asks to approve, lock, or commit a concrete decision and you can state that decision precisely.

                For PROPOSAL or DECISION_READY, provide a concise proposalTitle, proposalSummary, riskLevel, affectedObjects, downstreamImpact, recommendedNextAction, and confidence.
                For DISCUSSION or WARNING, proposalTitle and proposalSummary may be empty strings and arrays may be empty.

                CURRENT MEDIAOS CONTEXT (authoritative runtime snapshot):
                %s
                """.formatted(mode, objectMapper.writeValueAsString(context));
    }

    private Map<String, Object> structuredOutputFormat() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("reply", Map.of("type", "string"));
        properties.put("responseType", Map.of(
                "type", "string",
                "enum", List.of("DISCUSSION", "PROPOSAL", "WARNING", "DECISION_READY")
        ));
        properties.put("proposalTitle", Map.of("type", "string"));
        properties.put("proposalSummary", Map.of("type", "string"));
        properties.put("riskLevel", Map.of(
                "type", "string",
                "enum", List.of("NONE", "LOW", "MEDIUM", "HIGH")
        ));
        properties.put("affectedObjects", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        properties.put("downstreamImpact", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        properties.put("recommendedNextAction", Map.of("type", "string"));
        properties.put("confidence", Map.of(
                "type", "number",
                "minimum", 0,
                "maximum", 1
        ));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of(
                "reply",
                "responseType",
                "proposalTitle",
                "proposalSummary",
                "riskLevel",
                "affectedObjects",
                "downstreamImpact",
                "recommendedNextAction",
                "confidence"
        ));
        schema.put("additionalProperties", false);

        Map<String, Object> format = new LinkedHashMap<>();
        format.put("type", "json_schema");
        format.put("name", "media_os_director_reply");
        format.put("strict", true);
        format.put("schema", schema);
        return format;
    }

    private String extractOutputText(JsonNode root) {
        StringBuilder result = new StringBuilder();
        JsonNode output = root.path("output");
        if (!output.isArray()) return "";
        for (JsonNode item : output) {
            JsonNode content = item.path("content");
            if (!content.isArray()) continue;
            for (JsonNode part : content) {
                JsonNode text = part.get("text");
                if (text != null && text.isTextual()) {
                    result.append(text.asText());
                }
            }
        }
        return result.toString().trim();
    }

    public record TranscriptMessage(String sender, String content) {}

    public record DirectorReply(
            String reply,
            String responseType,
            String proposalTitle,
            String proposalSummary,
            String riskLevel,
            List<String> affectedObjects,
            List<String> downstreamImpact,
            String recommendedNextAction,
            double confidence
    ) {}
}
