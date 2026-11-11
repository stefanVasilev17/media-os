package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Read-only, zero-credit HEAR -> SEE mapping. Approved narration provides the
 * unique spoken anchors; the selected Take's REAL character alignment provides
 * every frame. No synthetic timing, DB write or Director approval is created.
 */
public final class Ep002AutomaticVoiceCues {
    public record Result(List<String> anchors, List<Ep002VoiceBeatResolver.BeatCue> frames,
                         String reason) {
        public boolean ready() { return !frames.isEmpty() && anchors.size()==frames.size(); }
    }
    private Ep002AutomaticVoiceCues() {}

    public static Result resolve(String shot, String narration, JsonNode visual,
                                 String alignment, BigDecimal seconds, ObjectMapper mapper) {
        List<String> anchors=anchors(shot,narration,visual);
        if(visual==null||!visual.path("beats").isArray()
                ||anchors.size()!=visual.path("beats").size())
            return new Result(List.of(),List.of(),"AUTOMATIC_SOURCE_CUES_UNAVAILABLE");
        if(alignment==null||alignment.isBlank()||seconds==null||seconds.signum()<=0)
            return new Result(anchors,List.of(),"SELECTED_TAKE_MISSING_REAL_CHARACTER_ALIGNMENT");
        try {
            var frames=Ep002VoiceBeatResolver.resolve(mapper,alignment,seconds,anchors,anchors.size());
            if(frames.size()!=anchors.size())
                return new Result(anchors,List.of(),"AUTOMATIC_REAL_ALIGNMENT_INCOMPLETE");
            return new Result(anchors,frames,"AUTO_VERIFIED_REAL_ELEVENLABS_ALIGNMENT");
        }catch(IllegalArgumentException invalid) {
            return new Result(anchors,List.of(),"AUTOMATIC_REAL_ALIGNMENT_UNRESOLVED");
        }
    }

    public static List<String> anchors(String shot,String narration,JsonNode visual) {
        if(narration==null||narration.isBlank()||visual==null||!visual.path("beats").isArray())
            return List.of();
        int size=visual.path("beats").size();
        List<List<String>> candidates=phrases(shot,visual);
        if(candidates.size()!=size)return List.of();
        String source=normalize(narration);
        List<String> out=new ArrayList<>();
        int previousEnd=-1;
        for(List<String> options:candidates) {
            String chosen=null;
            int end=-1;
            for(String phrase:options) {
                String query=normalize(phrase);
                if(query.length()<4)continue;
                String haystack=" "+source+" ";
                String needle=" "+query+" ";
                int first=haystack.indexOf(needle);
                if(first<0||haystack.indexOf(needle,first+1)>=0||first<=previousEnd)
                    continue;
                chosen=phrase;
                end=first+needle.length()-1;
                break;
            }
            if(chosen==null)return List.of();
            out.add(chosen);
            previousEnd=end;
        }
        return List.copyOf(out);
    }

    private static List<List<String>> phrases(String shot,JsonNode visual) {
        if(shot!=null&&shot.matches("SHOT(0[8-9]|1[0-1])")) {
            List<List<String>> result=new ArrayList<>();
            for(JsonNode beat:visual.path("beats")) {
                String anchor=beat.path("spokenAnchor").asText("");
                if(anchor.isBlank())return List.of();
                result.add(List.of(anchor));
            }
            return result;
        }
        return switch(shot==null?"":shot) {
            case "SHOT01" -> singleton(
                "tap Login","A few seconds pass. Then ten",
                "server responsible for signing you in is still running",
                "your login is still waiting","go back to nine o’clock");
            case "SHOT02" -> singleton(
                "nine o’clock","software hasn’t changed","API Gateway",
                "arrival rate","same User Database");
            case "SHOT03" -> List.of(
                List.of("five hundred"),
                List.of("six hundred and fifty new Login requests","six hundred and fifty"),
                List.of("That’s the arrival rate","arrival rate"),
                List.of("unfinished work starts piling up"),List.of("bottleneck"));
            case "SHOT04" -> singleton(
                "health checks","A liveness probe","a real Login needs an answer",
                "end-to-end check","Being alive is not the same as being available");
            case "SHOT05" -> singleton(
                "database connection pool","up to eight","replay the last few moments",
                "connection pool exhaustion","in-flight requests");
            case "SHOT06" -> singleton(
                "Look at this Login","Then the time runs out","Watch another Login",
                "cancellation matters","If the system can stop it");
            case "SHOT07" -> singleton(
                "Auth 01 tries again","first lookup may still be running",
                "New Login traffic","retry storm","cascading failure");
            default -> List.of();
        };
    }
    private static List<List<String>> singleton(String... phrases) {
        List<List<String>> result=new ArrayList<>();
        for(String phrase:phrases)result.add(List.of(phrase));
        return List.copyOf(result);
    }
    private static String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+"," ").trim();
    }
}
