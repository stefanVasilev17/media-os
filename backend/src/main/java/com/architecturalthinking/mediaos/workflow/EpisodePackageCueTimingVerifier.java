package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class EpisodePackageCueTimingVerifier {
    private static final double AUDIO_DURATION_TOLERANCE_SECONDS = 0.75;
    private final ObjectMapper mapper;

    public EpisodePackageCueTimingVerifier(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public record CueTime(String beatId, String cueAnchor, double startSeconds, double endSeconds) {}
    public record Result(boolean verified, String failureCode, List<CueTime> cues) {
        static Result fail(String code) { return new Result(false, code, List.of()); }
        static Result pass(List<CueTime> cues) { return new Result(true, "VERIFIED", List.copyOf(cues)); }
    }

    public Result verify(String narration, String visualStoryJson,
                         String providerAlignmentJson, BigDecimal measuredDuration) {
        if (measuredDuration == null || measuredDuration.signum() <= 0)
            return Result.fail("MEASURED_AUDIO_DURATION_MISSING");

        JsonNode story;
        JsonNode provider;
        try {
            story = mapper.readTree(visualStoryJson);
            provider = mapper.readTree(providerAlignmentJson);
        } catch (Exception ex) {
            return Result.fail("STORY_OR_PROVIDER_TIMING_MALFORMED");
        }
        JsonNode beats = story.path("visualBeats");
        if (!beats.isArray() || beats.isEmpty())
            return Result.fail("VISUAL_BEATS_MISSING");
        String spokenNarration = normalize(narration);
        if (spokenNarration.isBlank())
            return Result.fail("WORKING_NARRATION_MISSING");

        Result last = Result.fail("PROVIDER_ALIGNMENT_MISSING_OR_INVALID");
        for (String key : List.of("alignment", "normalized_alignment")) {
            Timeline timeline = parseTimeline(provider.path(key), measuredDuration.doubleValue());
            if (timeline == null) continue;
            last = compare(timeline, spokenNarration, beats);
            if (last.verified()) return last;
        }
        return last;
    }

    private Result compare(Timeline timeline, String narration, JsonNode beats) {
        int narrationStart = timeline.text().indexOf(narration);
        if (narrationStart < 0)
            return Result.fail("SPOKEN_AUDIO_DIFFERS_FROM_CURRENT_NARRATION");
        int cursor = narrationStart;
        int narrationEnd = narrationStart + narration.length();
        List<CueTime> out = new ArrayList<>();
        for (JsonNode beat : beats) {
            String id = beat.path("beatId").asText("");
            String source = beat.path("cueAnchor").asText("");
            String anchor = normalize(source);
            if (id.isBlank() || anchor.isBlank() || !narration.contains(anchor))
                return Result.fail("VISUAL_CUE_NOT_IN_CURRENT_NARRATION");
            int begin = timeline.text().indexOf(anchor, cursor);
            if (begin < 0 || begin + anchor.length() > narrationEnd)
                return Result.fail("VISUAL_CUE_NOT_ALIGNED_IN_AUDIO_ORDER");
            int startCharacter = timeline.indices().get(begin);
            int endCharacter = timeline.indices().get(begin + anchor.length() - 1);
            double start = timeline.starts().get(startCharacter);
            double end = timeline.ends().get(endCharacter);
            if (!Double.isFinite(start) || !Double.isFinite(end) || end < start)
                return Result.fail("INVALID_CUE_TIME_BOUNDS");
            out.add(new CueTime(id, source, round(start), round(end)));
            cursor = begin + anchor.length();
        }
        return Result.pass(out);
    }

    private Timeline parseTimeline(JsonNode payload, double duration) {
        if (!payload.isObject()) return null;
        JsonNode letters = payload.path("characters");
        JsonNode startTimes = payload.path("character_start_times_seconds");
        JsonNode endTimes = payload.path("character_end_times_seconds");
        if (!letters.isArray() || letters.isEmpty() || !startTimes.isArray()
                || !endTimes.isArray() || letters.size() != startTimes.size()
                || letters.size() != endTimes.size() || letters.size() > 30000) return null;
        List<Double> starts = new ArrayList<>();
        List<Double> ends = new ArrayList<>();
        StringBuilder normalized = new StringBuilder();
        List<Integer> offsets = new ArrayList<>();
        double previousStart = 0;
        for (int i = 0; i < letters.size(); i++) {
            JsonNode letter = letters.get(i);
            JsonNode start = startTimes.get(i);
            JsonNode end = endTimes.get(i);
            if (!letter.isTextual() || !start.isNumber() || !end.isNumber()) return null;
            double from = start.doubleValue();
            double to = end.doubleValue();
            if (!Double.isFinite(from) || !Double.isFinite(to) || from < 0
                    || to < from || to > duration + AUDIO_DURATION_TOLERANCE_SECONDS
                    || from + 0.0001 < previousStart) return null;
            starts.add(from);
            ends.add(to);
            previousStart = from;
            String raw = letter.asText();
            for (int cp : raw.codePoints().toArray()) {
                if (Character.isLetterOrDigit(cp)) {
                    String lower = new String(Character.toChars(cp)).toLowerCase(Locale.ROOT);
                    normalized.append(lower);
                    for (int p = 0; p < lower.length(); p++) offsets.add(i);
                } else if (Character.isWhitespace(cp) && normalized.length() > 0
                        && normalized.charAt(normalized.length()-1) != ' ') {
                    normalized.append(' ');
                    offsets.add(i);
                }
            }
        }
        return new Timeline(normalized.toString().trim(), offsets, starts, ends);
    }

    static String normalize(String source) {
        if (source == null) return "";
        StringBuilder result = new StringBuilder();
        source.codePoints().forEach(cp -> {
            if (Character.isLetterOrDigit(cp)) {
                result.append(new String(Character.toChars(cp)).toLowerCase(Locale.ROOT));
            } else if (Character.isWhitespace(cp) && result.length() > 0
                    && result.charAt(result.length()-1) != ' ') {
                result.append(' ');
            }
        });
        return result.toString().trim();
    }

    private static double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private record Timeline(String text, List<Integer> indices,
                            List<Double> starts, List<Double> ends) {}
}
