package com.architecturalthinking.mediaos.director;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class EpisodeBuildAgentClient {

    private static final Logger log = LoggerFactory.getLogger(EpisodeBuildAgentClient.class);
    private static final String DEFAULT_MODEL = "gpt-5.6-sol";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public EpisodeBuildAgentClient(
            ObjectMapper objectMapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${MEDIA_OS_EPISODE_BUILD_MODEL:gpt-5.6-sol}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? DEFAULT_MODEL : model.trim();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    }

    public boolean configured() {
        return !apiKey.isBlank();
    }

    public String model() {
        return model;
    }

    public TopicBatch suggestTopics(Map<String, Object> context) {
        return request(
                "topic_candidates",
                topicInstructions(context),
                topicFormat(),
                TopicBatch.class,
                9000
        );
    }

    public TruthAudit auditTruth(Map<String, Object> context) {
        return request(
                "truth_audit",
                truthInstructions(context),
                truthFormat(),
                TruthAudit.class,
                9000
        );
    }

    private <T> T request(
            String operation,
            String instructions,
            Map<String, Object> format,
            Class<T> resultType,
            int maxOutputTokens
    ) {
        if (!configured()) {
            throw new IllegalStateException("Episode build intelligence is not configured. Add OPENAI_API_KEY to the Railway backend service.");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("max_output_tokens", maxOutputTokens);
            payload.put("reasoning", Map.of("effort", "medium"));
            payload.put("instructions", instructions);
            payload.put("input", List.of(Map.of(
                    "role", "user",
                    "content", "Produce the complete structured result now. Do not return commentary outside the schema."
            )));
            payload.put("text", Map.of("format", format));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(180))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String upstream = extractUpstreamError(response.body());
                log.warn("Episode build OpenAI request failed operation={} status={} model={} message={}", operation, response.statusCode(), model, upstream);
                throw new IllegalStateException(humanReadableUpstreamError(response.statusCode(), upstream));
            }

            JsonNode root = objectMapper.readTree(response.body());
            String outputText = extractOutputText(root);
            if (outputText.isBlank()) {
                throw new IllegalStateException("The episode build model answered, but returned no usable structured result. Please retry once.");
            }
            return objectMapper.readValue(outputText, resultType);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Episode build model request was interrupted.", ex);
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("Episode build model request failed: " + ex.getMessage(), ex);
        }
    }

    private String topicInstructions(Map<String, Object> context) {
        try {
            return """
                    You are the Topic Strategy Agent inside MediaOS for the Architectural Thinking YouTube channel.
                    Your job is to produce a SMALL set of unusually strong evergreen episode candidates, not a generic brainstorm.

                    Every candidate must satisfy the channel's production strategy:
                    - broad human or production entry point before deep architecture;
                    - evergreen search intent and clear click promise;
                    - meaningful senior engineering depth without turning into a beginner tutorial or technology catalogue;
                    - a concrete central question and one visible human/business consequence;
                    - at least three plausible Aha moments that can genuinely change the viewer's mental model;
                    - a failure, trade-off, scale, trust, cost, reliability, or correctness angle where appropriate;
                    - a natural Entry -> Bridge -> Depth series path;
                    - strong reuse potential from the Living Architecture World while still introducing a distinct new lesson;
                    - plausible 16–18 minute final episode after a ~20-minute working script;
                    - simple English title language. Avoid internal jargon in titles.

                    Do not rank candidates with winner labels or scores. Give six viable options with different systems or tensions when possible.
                    estimatedComplexity must be LOW, MEDIUM, or HIGH and describes production complexity, not topic quality.
                    recommendedBuildMinutes should normally be 20, but may be 15–30 when production complexity clearly warrants it.
                    Keep thumbnailIdea conceptual and instantly readable; do not describe tiny UI text.

                    AUTHORITATIVE CHANNEL / PROJECT CONTEXT:
                    %s
                    """.formatted(objectMapper.writeValueAsString(context));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize topic planning context.", ex);
        }
    }

    private String truthInstructions(Map<String, Object> context) {
        try {
            return """
                    You are the Research & Truth Agent inside MediaOS for Architectural Thinking.
                    Build a production truth map before Script and Scene work. Truth is more important than beauty.

                    Your result must answer exactly what the downstream agents need to avoid inventing system behavior:
                    - who initiates the action;
                    - who sends the meaningful request;
                    - who receives and routes it;
                    - who decides;
                    - who waits;
                    - where state exists;
                    - which steps are synchronous versus asynchronous at this abstraction level;
                    - which systems are dependencies;
                    - what conceptual data is returned;
                    - where failure becomes visible to the human;
                    - which implementation details vary enough that the video must stay conceptual rather than claim one universal implementation.

                    Preserve the episode's declared scope and out-of-scope boundaries. Do not silently expand into adjacent protocols or internals.
                    If the source contains a canonical path or Aha moments, preserve them unless they are internally inconsistent; if inconsistent, list the issue in unresolvedQuestions instead of rewriting history.
                    Never imply that a database returns an original plaintext password. Never manufacture packet-level or vendor-specific details when the episode is teaching architecture.
                    The output should be detailed enough for a senior Script Agent to write without guessing, but it should still be architecture-level rather than implementation trivia.

                    AUTHORITATIVE EPISODE CONTEXT:
                    %s
                    """.formatted(objectMapper.writeValueAsString(context));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize truth-audit context.", ex);
        }
    }

    private Map<String, Object> topicFormat() {
        Map<String, Object> candidateProps = new LinkedHashMap<>();
        candidateProps.put("title", stringSchema());
        candidateProps.put("centralQuestion", stringSchema());
        candidateProps.put("viewerPromise", stringSchema());
        candidateProps.put("evergreenReason", stringSchema());
        candidateProps.put("massEntry", stringSchema());
        candidateProps.put("seniorLesson", stringSchema());
        candidateProps.put("systemBoundary", stringSchema());
        candidateProps.put("coreTension", stringSchema());
        candidateProps.put("ahaCandidates", stringArraySchema(3));
        candidateProps.put("failureTradeoff", stringSchema());
        candidateProps.put("reusePlan", stringSchema());
        candidateProps.put("newAssets", stringArraySchema(0));
        candidateProps.put("seriesPath", stringSchema());
        candidateProps.put("thumbnailIdea", stringSchema());
        candidateProps.put("estimatedComplexity", Map.of("type", "string", "enum", List.of("LOW", "MEDIUM", "HIGH")));
        candidateProps.put("recommendedBuildMinutes", Map.of("type", "integer", "minimum", 15, "maximum", 30));

        Map<String, Object> candidate = objectSchema(candidateProps);
        Map<String, Object> rootProps = new LinkedHashMap<>();
        rootProps.put("candidates", Map.of("type", "array", "minItems", 6, "maxItems", 6, "items", candidate));
        return jsonSchemaFormat("media_os_topic_candidates", objectSchema(rootProps));
    }

    private Map<String, Object> truthFormat() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("summary", stringSchema());
        props.put("systemBoundary", stringSchema());
        props.put("initiator", stringSchema());
        props.put("requestOwner", stringSchema());
        props.put("actors", stringArraySchema(3));
        props.put("decisionPoints", stringArraySchema(1));
        props.put("waitingPoints", stringArraySchema(1));
        props.put("stateLocations", stringArraySchema(1));
        props.put("dependencies", stringArraySchema(1));
        props.put("synchronousFlow", stringArraySchema(1));
        props.put("asynchronousOrDeferredFlow", stringArraySchema(0));
        props.put("returnPath", stringArraySchema(1));
        props.put("failureVisibility", stringArraySchema(1));
        props.put("implementationVariability", stringArraySchema(0));
        props.put("canonicalAhaMoments", stringArraySchema(3));
        props.put("outOfScope", stringArraySchema(0));
        props.put("unresolvedQuestions", stringArraySchema(0));
        props.put("scriptGuardrails", stringArraySchema(3));
        props.put("confidence", Map.of("type", "number", "minimum", 0, "maximum", 1));
        return jsonSchemaFormat("media_os_truth_audit", objectSchema(props));
    }

    private Map<String, Object> stringSchema() {
        return Map.of("type", "string");
    }

    private Map<String, Object> stringArraySchema(int minItems) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "array");
        schema.put("minItems", minItems);
        schema.put("items", stringSchema());
        return schema;
    }

    private Map<String, Object> objectSchema(Map<String, Object> properties) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", new ArrayList<>(properties.keySet()));
        schema.put("additionalProperties", false);
        return schema;
    }

    private Map<String, Object> jsonSchemaFormat(String name, Map<String, Object> schema) {
        Map<String, Object> format = new LinkedHashMap<>();
        format.put("type", "json_schema");
        format.put("name", name);
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
                if (text != null && text.isTextual()) result.append(text.asText());
            }
        }
        return result.toString().trim();
    }

    private String humanReadableUpstreamError(int status, String upstreamMessage) {
        String normalized = upstreamMessage == null ? "" : upstreamMessage.toLowerCase();
        if (status == 401 || status == 403) {
            return "OpenAI rejected the episode-build API credential or project permission. Verify OPENAI_API_KEY and its project permissions.";
        }
        if (status == 429) {
            if (normalized.contains("quota") || normalized.contains("billing") || normalized.contains("credit")) {
                return "OpenAI API quota or billing is not active for this API project. Enable API billing or add credits, then retry.";
            }
            return "OpenAI is rate-limiting the episode-build request. Wait briefly and retry.";
        }
        if ((status == 400 || status == 404) && normalized.contains("model")) {
            return "The configured episode-build model is not available to this API project. Current model: " + model + ".";
        }
        if (status >= 500) return "OpenAI returned a temporary upstream error. Retry in a moment.";
        if (upstreamMessage != null && !upstreamMessage.isBlank()) return "OpenAI rejected the episode-build request: " + upstreamMessage;
        return "Episode-build request failed with HTTP " + status + ".";
    }

    private String extractUpstreamError(String body) {
        if (body == null || body.isBlank()) return "No error details returned.";
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode error = root.path("error");
            String message = error.path("message").asText("");
            String code = error.path("code").asText("");
            String type = error.path("type").asText("");
            String combined = message;
            if (!type.isBlank()) combined += (combined.isBlank() ? "" : " | ") + "type=" + type;
            if (!code.isBlank()) combined += (combined.isBlank() ? "" : " | ") + "code=" + code;
            if (!combined.isBlank()) return truncate(combined, 900);
        } catch (Exception ignored) {
        }
        return truncate(body.replaceAll("\\s+", " ").trim(), 900);
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength) + "…";
    }

    public record TopicCandidate(
            String title,
            String centralQuestion,
            String viewerPromise,
            String evergreenReason,
            String massEntry,
            String seniorLesson,
            String systemBoundary,
            String coreTension,
            List<String> ahaCandidates,
            String failureTradeoff,
            String reusePlan,
            List<String> newAssets,
            String seriesPath,
            String thumbnailIdea,
            String estimatedComplexity,
            int recommendedBuildMinutes
    ) {}

    public record TopicBatch(List<TopicCandidate> candidates) {}

    public record TruthAudit(
            String summary,
            String systemBoundary,
            String initiator,
            String requestOwner,
            List<String> actors,
            List<String> decisionPoints,
            List<String> waitingPoints,
            List<String> stateLocations,
            List<String> dependencies,
            List<String> synchronousFlow,
            List<String> asynchronousOrDeferredFlow,
            List<String> returnPath,
            List<String> failureVisibility,
            List<String> implementationVariability,
            List<String> canonicalAhaMoments,
            List<String> outOfScope,
            List<String> unresolvedQuestions,
            List<String> scriptGuardrails,
            double confidence
    ) {}
}
