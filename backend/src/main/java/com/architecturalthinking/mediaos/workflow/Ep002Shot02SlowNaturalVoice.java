package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.List;

public final class Ep002Shot02SlowNaturalVoice {
    public static final String DELIVERY_MODE = "ELEVEN_V4_SLOW_NATURAL_PAUSES_V1";
    public static final String REQUIRED_SHOT = "SHOT02";
    private static final String LOCKED_SOURCE = "episode-production/ep002-locked-script-v4.json";

    public record PauseAnchor(String exactSpokenText, String tag) {}

    private static final List<PauseAnchor> ANCHORS = List.of(
        new PauseAnchor("At nine o’clock, tickets for a major concert go on sale.", "[pause]"),
        new PauseAnchor("before the seats are gone.", "[long pause]"),
        new PauseAnchor("The software hasn’t changed.", "[pause]"),
        new PauseAnchor("The number of people arriving has.", "[long pause]"),
        new PauseAnchor("Each tap sends a Login request", "[pause]"),
        new PauseAnchor("through the API Gateway", "[pause]"),
        new PauseAnchor("the platform’s entry point.", "[long pause]"),
        new PauseAnchor("A Load Balancer", "[pause]"),
        new PauseAnchor("across several Auth servers.", "[long pause]"),
        new PauseAnchor("At first, answers return quickly.", "[pause]"),
        new PauseAnchor("But the stream keeps growing.", "[pause]"),
        new PauseAnchor("the arrival rate:", "[pause]"),
        new PauseAnchor("entering the system each second.", "[long pause]"),
        new PauseAnchor("The Auth servers share the traffic.", "[long pause]"),
        new PauseAnchor("the same User Database.", "[long pause]")
    );

    private Ep002Shot02SlowNaturalVoice() {}

    public static int pauseCount() {
        return ANCHORS.size();
    }

    public static int longPauseCount() {
        return (int) ANCHORS.stream().filter(x -> "[long pause]".equals(x.tag())).count();
    }

    public static boolean matchesLockedNarration(String narration) {
        return narration != null && narration.equals(lockedNarration());
    }

    public static String prompt(String shot, String narration, String modelId) {
        if (!REQUIRED_SHOT.equals(shot) || modelId == null
                || !modelId.startsWith("eleven_v4")) {
            throw new IllegalArgumentException("SHOT02_SLOW_NATURAL_REQUIRES_LOCKED_SHOT_AND_ELEVEN_V4");
        }
        if (!matchesLockedNarration(narration)) {
            throw new IllegalArgumentException("SHOT02_SLOW_NATURAL_REQUIRES_EXACT_UNCHANGED_V4_NARRATION");
        }
        StringBuilder tts = new StringBuilder(narration.length() + ANCHORS.size() * 20);
        int cursor = 0;
        for (PauseAnchor anchor : ANCHORS) {
            int position = narration.indexOf(anchor.exactSpokenText(), cursor);
            if (position < 0 || narration.indexOf(anchor.exactSpokenText(), position + 1) >= 0) {
                throw new IllegalArgumentException("SHOT02_SLOW_NATURAL_PAUSE_ANCHOR_MISSING_OR_AMBIGUOUS");
            }
            int end = position + anchor.exactSpokenText().length();
            tts.append(narration, cursor, end);
            tts.append(' ').append(anchor.tag());
            cursor = end;
        }
        tts.append(narration, cursor, narration.length());
        return tts.toString();
    }

    private static String lockedNarration() {
        try (var input = new ClassPathResource(LOCKED_SOURCE).getInputStream()) {
            JsonNode root = new ObjectMapper().readTree(input);
            for (JsonNode shot : root.path("shots")) {
                if (REQUIRED_SHOT.equals(shot.path("shotKey").asText())
                        && "DIRECTOR_LOCKED".equals(shot.path("scriptStatus").asText())) {
                    String text = shot.path("englishNarration").asText();
                    if (!text.isBlank()) return text;
                }
            }
            throw new IllegalStateException("LOCKED_EP002_SHOT02_NARRATION_MISSING");
        } catch (IOException brokenSource) {
            throw new IllegalStateException("LOCKED_EP002_SHOT02_SOURCE_UNAVAILABLE", brokenSource);
        }
    }
}
