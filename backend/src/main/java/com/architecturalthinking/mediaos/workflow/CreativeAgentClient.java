package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.AiUsageCapture;
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
public class CreativeAgentClient {

    private static final Logger log = LoggerFactory.getLogger(CreativeAgentClient.class);
    private static final String DEFAULT_MODEL = "gpt-5.6-sol";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public CreativeAgentClient(
            ObjectMapper objectMapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${MEDIA_OS_CREATIVE_MODEL:gpt-5.6-sol}") String model
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

    public AgentReply generate(
            String stageKey,
            String action,
            List<TranscriptMessage> transcript,
            Map<String, Object> context
    ) {
        if (!configured()) {
            throw new IllegalStateException("Creative agents are not configured. Add OPENAI_API_KEY to the Railway backend service.");
        }
        if (!List.of("SCRIPT", "SCENE").contains(stageKey)) {
            throw new IllegalArgumentException("Unsupported creative stage: " + stageKey);
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("max_output_tokens", "SCENE".equals(stageKey) ? 12000 : 14000);
            payload.put("reasoning", Map.of("effort", "medium"));
            payload.put("instructions", instructions(stageKey, action, context));

            List<Map<String, Object>> input = new ArrayList<>();
            if (transcript.isEmpty()) {
                input.add(Map.of(
                        "role", "user",
                        "content", "GENERATE".equals(action)
                                ? "Create the complete production artifact now from the authoritative context."
                                : "Revise the current production artifact using the authoritative context."
                ));
            } else {
                for (TranscriptMessage message : transcript) {
                    if (message.content() == null || message.content().isBlank()) continue;
                    String role = switch (message.sender()) {
                        case "USER" -> "user";
                        case "AGENT" -> "assistant";
                        default -> null;
                    };
                    if (role != null) input.add(Map.of("role", role, "content", message.content()));
                }
            }
            payload.put("input", input);
            payload.put("text", Map.of("format", structuredOutputFormat(stageKey)));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(220))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String upstream = extractUpstreamError(response.body());
                log.warn("Creative OpenAI request failed stage={} status={} model={} message={}", stageKey, response.statusCode(), model, upstream);
                throw new IllegalStateException(humanReadableUpstreamError(response.statusCode(), upstream));
            }

            JsonNode root = objectMapper.readTree(response.body());
            AiUsageCapture.capture(root);
            String outputText = extractOutputText(root);
            if (outputText.isBlank()) {
                throw new IllegalStateException("The creative agent answered, but returned no usable structured artifact. Please retry once.");
            }
            return objectMapper.readValue(outputText, AgentReply.class);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Creative agent request was interrupted.", ex);
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("Creative agent request failed: " + ex.getMessage(), ex);
        }
    }

    private String instructions(String stageKey, String action, Map<String, Object> context) throws Exception {
        String stageInstructions = "SCRIPT".equals(stageKey) ? """
                You are the Script Agent. Produce the COMPLETE narration contract for the episode, not notes, an outline, or a technology catalogue.

                SCRIPT LENGTH AND EDITING HEADROOM
                - Write a working draft around 20 minutes. Aim for 1200 seconds and keep targetDurationSeconds inside 1140–1260 seconds.
                - This is intentionally longer than the expected final edit so the creator can cut the strongest 16–18 minute episode without losing causal continuity.
                - At a calm English narration pace, write enough actual narration to plausibly fill that runtime. Do not fake a 20-minute timeline with a short script.

                NARRATION STYLE
                - Narration is English. Creator-facing chat replies follow the creator's language.
                - Sound like a calm senior software architect explaining one causal journey clearly.
                - Keep the English simple and professional, but the reasoning senior. Minimize jargon and define a term only when it becomes necessary.
                - Prefer flowing paragraphs and causal transitions. Use no more than two list-style narration passages in the entire episode.
                - Never introduce more than one genuinely new concept at a time.
                - Human action first. Architecture explains the hidden journey. Every major technical conflict must return to a human or business consequence.
                - Do not widen scope into adjacent identity topics unless the authoritative source explicitly requires them. Never imply that a database returns a plaintext password.

                TIMELINE CONTRACT
                - The artifact MUST contain one continuous, gap-free timeline. The first item begins at second 0 and the final item ends exactly at targetDurationSeconds.
                - Prefer 20–45 second timeline blocks. No block may exceed 60 seconds.
                - Every block must contain exact start/end seconds, complete narration, voice direction, purpose, a concise handoff note for Scene Agent, and the internal retention markers required by the schema.
                - Keep the visual handoff note conceptual. The Scene Agent will decide exact visual movement after Script is LOCKED.

                RETENTION CONTRACT
                - Create a meaningful new value event at least every 45–60 seconds: a new node, architectural question, reveal, failure, consequence, scale change, trade-off, or surprising reversal. Mark the block with newValueEvent=true and describe the value in newValueSummary.
                - Insert a natural micro-tension question or unresolved consequence roughly every 60–90 seconds. Mark that block microTension=true. It must arise from the architecture, not from clickbait language.
                - After roughly 40–60 seconds of normal explanation, periodically use a slower, stronger sentence that crystallizes the idea. Use '(pause)' deliberately after strong ideas where the voice should breathe.
                - Every 3–4 minutes include a cognitive-relief sentence that summarizes what the viewer now understands before the next layer begins. Mark cognitiveRelief=true.
                - Avoid rapid topic jumps and terminology spikes. Clarity over speed.

                AHA AND REEL CONTRACT
                - Every episode MUST contain at least three genuine Aha moments. They must change the viewer's mental model, not merely restate a fact. Mark them ahaMoment=true.
                - Every episode MUST contain at least three reel-ready passages. Each should contain its own mini-hook, visible mechanism or causal insight, and payoff so it can stand alone. Mark them reelCandidate=true.
                - Aha moments and reel candidates may overlap when the moment genuinely satisfies both conditions.
                - Preserve canonical Aha moments already present in the authoritative source instead of inventing weaker replacements.

                EPISODE RHYTHM
                - Open with expectation versus reality in roughly the first minute.
                - Move linearly from the human illusion into what actually happens, then the hidden layer, then why the architecture matters.
                - Use cognitive relief between dense sections and finish with a natural forward architectural question, not a forced cliffhanger.

                REVISION BEHAVIOR
                - When the creator asks to change a specific time range or idea, rewrite the affected narration, then reflow every downstream timestamp so the complete timeline remains contiguous.
                - After every revision, re-audit duration, Aha count, reel count, retention cadence, list-style count, and handoff integrity before returning the COMPLETE artifact.

                Finish with a precise handoffPrompt telling Scene Agent to preserve the locked narration and timings while translating each block into scene behavior, camera focus, objects, and controlled shots without changing the story.
                """ : """
                You are the Scene Agent. Consume the LOCKED Script handoff as authoritative. Do not rewrite the episode into a different story.
                The upper timeline MUST combine narration, voice direction, visual focus, every scene move, camera behavior, and the relevant architecture objects in the same timed records.
                The lower shots MUST divide the entire episode into contiguous controlled shot segments. Shot 1 begins at second 0, shots do not overlap or leave gaps, and the final shot ends at the locked script duration.
                Every shot must repeat the exact script segment it serves, voice direction, concrete scene moves, camera behavior, visual goal, and a deterministic promptForSpline that the Spline Agent can execute without guessing.
                Camera grammar is strict: move when focus changes; stay still during reasoning; no decorative drift, aggressive zooming, or flashy rotations.
                Preserve the persistent Living Architecture Map. Phone is the human anchor; client context remains compact; backend services dominate after the request leaves the client.
                Do not modify or invent existing Spline implementation facts. Describe desired scene behavior and required objects; the Spline Agent resolves execution against its actual catalog.
                """;

        return """
                You are a senior production agent inside MediaOS for the Architectural Thinking YouTube channel.
                The creator is the final decision maker. Discussion and revisions may change the current draft, but only the explicit LOCK action makes an immutable handoff to the next production stage.
                Work from the supplied source snapshot, locked upstream handoff, current artifact, creator memory, and conversation. Never invent a locked fact that is absent from them.
                Creator conversation is Bulgarian when the creator writes Bulgarian. Narration, voice direction intended for production, scene labels, object names, and downstream production prompts are English.
                Return the COMPLETE revised artifact on every generation or correction. Never return a partial patch.
                Avoid meta commentary, generic encouragement, implementation tags, and UI-facing noise.

                STAGE: %s
                ACTION: %s

                %s

                MEMORY CLASSIFICATION:
                - CORRECTION when the creator says something is wrong, asks to change an existing choice, or establishes a corrective rule.
                - PRAISE when the creator clearly approves or praises a result in a way useful for future style decisions.
                - PREFERENCE for a durable working preference that should guide later outputs.
                - NONE for ordinary questions or temporary discussion.
                memoryNote should state the durable lesson in one concise sentence, not copy the whole conversation.

                AUTHORITATIVE MEDIAOS CONTEXT:
                %s
                """.formatted(stageKey, action, stageInstructions, objectMapper.writeValueAsString(context));
    }

    private Map<String, Object> structuredOutputFormat(String stageKey) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("reply", stringSchema());
        properties.put("summary", stringSchema());
        properties.put("nextAction", stringSchema());
        properties.put("changeSummary", stringSchema());
        properties.put("memoryType", Map.of("type", "string", "enum", List.of("NONE", "CORRECTION", "PRAISE", "PREFERENCE")));
        properties.put("memoryNote", stringSchema());
        properties.put("confidence", numberSchema());
        properties.put("artifact", "SCRIPT".equals(stageKey) ? scriptArtifactSchema() : sceneArtifactSchema());

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of("reply", "summary", "nextAction", "changeSummary", "memoryType", "memoryNote", "confidence", "artifact"));
        schema.put("additionalProperties", false);

        Map<String, Object> format = new LinkedHashMap<>();
        format.put("type", "json_schema");
        format.put("name", "media_os_" + stageKey.toLowerCase() + "_artifact");
        format.put("strict", true);
        format.put("schema", schema);
        return format;
    }

    private Map<String, Object> scriptArtifactSchema() {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("type", "object");
        Map<String, Object> itemProps = new LinkedHashMap<>();
        itemProps.put("sectionId", stringSchema());
        itemProps.put("sectionTitle", stringSchema());
        itemProps.put("startSecond", integerSchema());
        itemProps.put("endSecond", integerSchema());
        itemProps.put("narration", stringSchema());
        itemProps.put("voiceDirection", stringSchema());
        itemProps.put("purpose", stringSchema());
        itemProps.put("newValueEvent", Map.of("type", "boolean"));
        itemProps.put("newValueSummary", stringSchema());
        itemProps.put("microTension", Map.of("type", "boolean"));
        itemProps.put("cognitiveRelief", Map.of("type", "boolean"));
        itemProps.put("listPassage", Map.of("type", "boolean"));
        itemProps.put("ahaMoment", Map.of("type", "boolean"));
        itemProps.put("reelCandidate", Map.of("type", "boolean"));
        itemProps.put("handoffNotes", stringSchema());
        item.put("properties", itemProps);
        item.put("required", new ArrayList<>(itemProps.keySet()));
        item.put("additionalProperties", false);

        Map<String, Object> artifact = new LinkedHashMap<>();
        artifact.put("type", "object");
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("overview", stringSchema());
        props.put("targetDurationSeconds", integerSchema());
        props.put("timeline", Map.of("type", "array", "minItems", 24, "items", item));
        props.put("handoffPrompt", stringSchema());
        artifact.put("properties", props);
        artifact.put("required", new ArrayList<>(props.keySet()));
        artifact.put("additionalProperties", false);
        return artifact;
    }

    private Map<String, Object> sceneArtifactSchema() {
        Map<String, Object> timelineItem = new LinkedHashMap<>();
        timelineItem.put("type", "object");
        Map<String, Object> timelineProps = new LinkedHashMap<>();
        timelineProps.put("sceneId", stringSchema());
        timelineProps.put("sectionTitle", stringSchema());
        timelineProps.put("startSecond", integerSchema());
        timelineProps.put("endSecond", integerSchema());
        timelineProps.put("narration", stringSchema());
        timelineProps.put("voiceDirection", stringSchema());
        timelineProps.put("visualFocus", stringSchema());
        timelineProps.put("sceneMoves", stringArraySchema());
        timelineProps.put("camera", stringSchema());
        timelineProps.put("objects", stringArraySchema());
        timelineItem.put("properties", timelineProps);
        timelineItem.put("required", new ArrayList<>(timelineProps.keySet()));
        timelineItem.put("additionalProperties", false);

        Map<String, Object> shotItem = new LinkedHashMap<>();
        shotItem.put("type", "object");
        Map<String, Object> shotProps = new LinkedHashMap<>();
        shotProps.put("shotKey", stringSchema());
        shotProps.put("sceneId", stringSchema());
        shotProps.put("startSecond", integerSchema());
        shotProps.put("endSecond", integerSchema());
        shotProps.put("script", stringSchema());
        shotProps.put("voiceDirection", stringSchema());
        shotProps.put("moves", stringArraySchema());
        shotProps.put("camera", stringSchema());
        shotProps.put("visualGoal", stringSchema());
        shotProps.put("promptForSpline", stringSchema());
        shotItem.put("properties", shotProps);
        shotItem.put("required", new ArrayList<>(shotProps.keySet()));
        shotItem.put("additionalProperties", false);

        Map<String, Object> artifact = new LinkedHashMap<>();
        artifact.put("type", "object");
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("overview", stringSchema());
        props.put("timeline", Map.of("type", "array", "minItems", 8, "items", timelineItem));
        props.put("shots", Map.of("type", "array", "minItems", 8, "items", shotItem));
        props.put("handoffPrompt", stringSchema());
        artifact.put("properties", props);
        artifact.put("required", new ArrayList<>(props.keySet()));
        artifact.put("additionalProperties", false);
        return artifact;
    }

    private Map<String, Object> stringSchema() {
        return Map.of("type", "string");
    }

    private Map<String, Object> integerSchema() {
        return Map.of("type", "integer", "minimum", 0);
    }

    private Map<String, Object> numberSchema() {
        return Map.of("type", "number", "minimum", 0, "maximum", 1);
    }

    private Map<String, Object> stringArraySchema() {
        return Map.of("type", "array", "items", stringSchema());
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
            return "OpenAI rejected the creative-agent API credential or project permission. Verify OPENAI_API_KEY and its project permissions.";
        }
        if (status == 429) {
            if (normalized.contains("quota") || normalized.contains("billing") || normalized.contains("credit")) {
                return "OpenAI API quota or billing is not active for this API project. Enable API billing or add credits, then retry.";
            }
            return "OpenAI is rate-limiting the creative-agent request. Wait briefly and retry.";
        }
        if ((status == 400 || status == 404) && normalized.contains("model")) {
            return "The configured creative-agent model is not available to this API project. Current model: " + model + ".";
        }
        if (status >= 500) return "OpenAI returned a temporary upstream error. Retry in a moment.";
        if (upstreamMessage != null && !upstreamMessage.isBlank()) return "OpenAI rejected the creative-agent request: " + upstreamMessage;
        return "Creative-agent request failed with HTTP " + status + ".";
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

    public record TranscriptMessage(String sender, String content) {}

    public record AgentReply(
            String reply,
            String summary,
            String nextAction,
            String changeSummary,
            String memoryType,
            String memoryNote,
            double confidence,
            Map<String, Object> artifact
    ) {}
}
