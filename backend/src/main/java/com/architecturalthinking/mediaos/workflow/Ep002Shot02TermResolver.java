package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class Ep002Shot02TermResolver {
    private Ep002Shot02TermResolver() {}

    public record TermCue(String id, String spokenAnchor, int startFrame, int endFrame) {}
    private record TermSpec(String id, String phrase) {}
    private record Speech(String text, List<Double> starts, List<Double> ends) {}

    private static final List<TermSpec> TERMS = List.of(
            new TermSpec("LOGIN_REQUEST", "Login request"),
            new TermSpec("API_GATEWAY", "API Gateway"),
            new TermSpec("LOAD_BALANCER", "Load Balancer"),
            new TermSpec("AUTH_SERVERS", "Auth servers"),
            new TermSpec("ARRIVAL_RATE", "arrival rate"),
            new TermSpec("AUTH_SERVERS_REPRISE", "Auth servers"),
            new TermSpec("USER_DATABASE", "User Database"));

    public static List<TermCue> resolve(ObjectMapper mapper, String rawAlignment,
            BigDecimal measuredSeconds, List<Ep002VoiceBeatResolver.BeatCue> beats) {
        if (mapper == null || rawAlignment == null || rawAlignment.isBlank()
                || measuredSeconds == null || measuredSeconds.signum() <= 0
                || beats == null || beats.size() != 5) {
            throw new IllegalArgumentException("SHOT02_TERM_ALIGNMENT_SOURCE_MISSING");
        }
        try {
            JsonNode root = mapper.readTree(rawAlignment);
            JsonNode block = root.path("normalized_alignment");
            if (!validArrays(block)) block = root.path("alignment");
            if (!validArrays(block)) {
                throw new IllegalArgumentException("SHOT02_TERM_CHARACTER_TIMES_MISSING");
            }
            Speech speech = map(block);
            int duration = (int) Math.ceil(measuredSeconds.doubleValue() * 30d);
            if (duration < 6 || duration > 108000) {
                throw new IllegalArgumentException("SHOT02_TERM_DURATION_INVALID");
            }
            List<TermCue> result = new ArrayList<>();
            int cursor = 0;
            for (TermSpec spec : TERMS) {
                String phrase = normalize(spec.phrase());
                int found = nextWholePhrase(speech.text(), phrase, cursor);
                if (found < 0) {
                    throw new IllegalArgumentException("SHOT02_TERM_NOT_SPOKEN_IN_EXPECTED_ORDER");
                }
                double startSeconds = speech.starts().get(found);
                double endSeconds = speech.ends().get(found + phrase.length() - 1);
                if (!Double.isFinite(startSeconds) || !Double.isFinite(endSeconds)
                        || startSeconds < 0 || startSeconds >= endSeconds
                        || endSeconds > measuredSeconds.doubleValue() + 0.25d) {
                    throw new IllegalArgumentException("SHOT02_TERM_CHARACTER_TIME_INVALID");
                }
                int start = (int) Math.floor(startSeconds * 30d);
                int end = Math.min(duration, (int) Math.ceil(endSeconds * 30d));
                if (start < 0 || end <= start || end > duration
                        || (!result.isEmpty()
                            && start < result.getLast().endFrame())) {
                    throw new IllegalArgumentException("SHOT02_TERM_FRAMES_OVERLAP");
                }
                result.add(new TermCue(spec.id(), spec.phrase(), start, end));
                cursor = found + phrase.length();
            }
            if (result.get(0).startFrame() < beats.get(1).startFrame()
                    || result.get(0).startFrame() >= beats.get(2).startFrame()
                    || result.get(1).startFrame() != beats.get(2).startFrame()
                    || result.get(3).startFrame() >= beats.get(3).startFrame()
                    || result.get(4).startFrame() != beats.get(3).startFrame()
                    || result.get(5).startFrame() < beats.get(3).startFrame()
                    || result.get(6).startFrame() < beats.get(4).startFrame()
                    || result.get(6).startFrame() >= beats.get(4).endFrame()) {
                throw new IllegalArgumentException("SHOT02_TERMS_DISAGREE_WITH_DIRECTOR_BEATS");
            }
            return List.copyOf(result);
        } catch (IllegalArgumentException invalid) {
            throw invalid;
        } catch (Exception unreadable) {
            throw new IllegalArgumentException("SHOT02_TERM_ALIGNMENT_UNREADABLE", unreadable);
        }
    }

    private static int nextWholePhrase(String speech, String phrase, int cursor) {
        int index = speech.indexOf(phrase, cursor);
        while (index >= 0) {
            int after = index + phrase.length();
            if ((index == 0 || speech.charAt(index - 1) == ' ')
                    && (after == speech.length() || speech.charAt(after) == ' ')) {
                return index;
            }
            index = speech.indexOf(phrase, index + 1);
        }
        return -1;
    }

    private static String normalize(String value) {
        StringBuilder output = new StringBuilder();
        for (char letter : value.toLowerCase(Locale.ROOT).toCharArray()) {
            if (Character.isLetterOrDigit(letter)) output.append(letter);
            else if (!output.isEmpty() && output.charAt(output.length() - 1) != ' ') {
                output.append(' ');
            }
        }
        return output.toString().trim();
    }

    private static boolean validArrays(JsonNode block) {
        return block.path("characters").isArray()
                && block.path("character_start_times_seconds").isArray()
                && block.path("character_end_times_seconds").isArray()
                && block.path("characters").size() > 0
                && block.path("characters").size() == block.path("character_start_times_seconds").size()
                && block.path("characters").size() == block.path("character_end_times_seconds").size();
    }

    private static Speech map(JsonNode alignment) {
        StringBuilder letters = new StringBuilder();
        List<Double> starts = new ArrayList<>();
        List<Double> ends = new ArrayList<>();
        double previousStart = -1;
        for (int i = 0; i < alignment.path("characters").size(); i++) {
            String glyph = alignment.path("characters").path(i).asText();
            double start = alignment.path("character_start_times_seconds").path(i).asDouble(Double.NaN);
            double end = alignment.path("character_end_times_seconds").path(i).asDouble(Double.NaN);
            if (glyph.isEmpty() || glyph.length() > 8 || !Double.isFinite(start)
                    || !Double.isFinite(end) || start < 0 || end < start || start < previousStart) {
                throw new IllegalArgumentException("SHOT02_CHARACTER_ALIGNMENT_INVALID");
            }
            previousStart = start;
            for (int j = 0; j < glyph.length(); j++) {
                char letter = Character.toLowerCase(glyph.charAt(j));
                if (Character.isLetterOrDigit(letter)) {
                    letters.append(letter);
                    starts.add(start);
                    ends.add(end);
                } else if (!letters.isEmpty() && letters.charAt(letters.length() - 1) != ' ') {
                    letters.append(' ');
                    starts.add(start);
                    ends.add(end);
                }
            }
        }
        while (!letters.isEmpty() && letters.charAt(letters.length() - 1) == ' ') {
            letters.setLength(letters.length() - 1);
            starts.remove(starts.size() - 1);
            ends.remove(ends.size() - 1);
        }
        if (letters.isEmpty()) throw new IllegalArgumentException("SHOT02_ALIGNED_SPEECH_EMPTY");
        return new Speech(letters.toString(), starts, ends);
    }
}
