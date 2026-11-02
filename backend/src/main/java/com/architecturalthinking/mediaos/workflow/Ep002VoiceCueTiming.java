package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class Ep002VoiceCueTiming {
    private static final List<String> SHOT01_PHRASES = List.of(
        "tap login",
        "a few seconds pass then ten",
        "server responsible for signing you in is still running",
        "your login is still waiting",
        "go back to nine o clock"
    );

    public record TimedBeat(int number, String anchor, double startSeconds, double endSeconds,
                            int startFrame, int endFrame) {}
    private record Word(String value, double start, double end) {}

    private Ep002VoiceCueTiming() {}

    public static List<TimedBeat> resolveShot01(String alignmentJson,
                                                BigDecimal measuredDuration, ObjectMapper json) {
        if (alignmentJson == null || alignmentJson.isBlank() || measuredDuration == null) return List.of();
        try {
            JsonNode raw=json.readTree(alignmentJson);
            JsonNode alignment=raw.path("normalized_alignment");
            if (!validArray(alignment)) alignment=raw.path("alignment");
            if (!validArray(alignment)) return List.of();
            var chars=alignment.path("characters");
            var starts=alignment.path("character_start_times_seconds");
            var ends=alignment.path("character_end_times_seconds");
            List<Word> words=new ArrayList<>();
            StringBuilder current=new StringBuilder();
            double first=0,last=0;
            for (int i=0;i<chars.size();i++) {
                String glyph=chars.path(i).asText();
                double s=starts.path(i).asDouble(Double.NaN);
                double e=ends.path(i).asDouble(Double.NaN);
                if (!Double.isFinite(s)||!Double.isFinite(e)||s<0||e<s) return List.of();
                for (int j=0;j<glyph.length();j++) {
                    char ch=Character.toLowerCase(glyph.charAt(j));
                    if (ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9') {
                        if (current.isEmpty()) first=s;
                        current.append(ch);
                        last=e;
                    } else if (!current.isEmpty()) {
                        words.add(new Word(current.toString(),first,last));
                        current.setLength(0);
                    }
                }
            }
            if (!current.isEmpty()) words.add(new Word(current.toString(),first,last));
            if (words.isEmpty()) return List.of();
            double audioSeconds=measuredDuration.doubleValue();
            List<TimedBeat> result=new ArrayList<>();
            for (int beat=0;beat<SHOT01_PHRASES.size();beat++) {
                String anchor=SHOT01_PHRASES.get(beat);
                String[] keys=anchor.split(" ");
                Word firstWord=null,lastWord=null;
                search:for(int i=0;i+keys.length<=words.size();i++) {
                    for(int k=0;k<keys.length;k++) {
                        if (!words.get(i+k).value().equals(keys[k])) continue search;
                    }
                    firstWord=words.get(i);
                    lastWord=words.get(i+keys.length-1);
                    break;
                }
                if(firstWord==null || lastWord==null) return List.of();
                if (lastWord.end() > audioSeconds+0.25 || firstWord.start() < 0
                        || firstWord.start() >= lastWord.end()
                        || (!result.isEmpty() && firstWord.start() <= result.get(result.size()-1).startSeconds()))
                    return List.of();
                int startFrame=(int)Math.floor(firstWord.start()*30);
                int endFrame=(int)Math.ceil(lastWord.end()*30);
                if(startFrame<0 || endFrame<=startFrame || endFrame>Math.ceil((audioSeconds+0.25)*30))
                    return List.of();
                result.add(new TimedBeat(beat+1,anchor,firstWord.start(),lastWord.end(),
                        startFrame,endFrame));
            }
            return List.copyOf(result);
        } catch (Exception invalid) {
            return List.of();
        }
    }

    private static boolean validArray(JsonNode block) {
        JsonNode c=block.path("characters");
        JsonNode s=block.path("character_start_times_seconds");
        JsonNode e=block.path("character_end_times_seconds");
        return c.isArray() && s.isArray() && e.isArray() && c.size()==s.size() && c.size()==e.size()
                && c.size()>0;
    }
}
