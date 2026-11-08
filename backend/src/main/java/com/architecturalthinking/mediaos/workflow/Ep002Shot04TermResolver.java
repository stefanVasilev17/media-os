package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class Ep002Shot04TermResolver {
    private Ep002Shot04TermResolver() {}

    public record TermCue(String id,String spokenAnchor,int startFrame,int endFrame) {}
    private record TermSpec(String id,String phrase) {}
    private record Speech(String normalized,List<Double> start,List<Double> end) {}

    private static final List<TermSpec> TERMS=List.of(
            new TermSpec("USER_DATABASE","User Database"),
            new TermSpec("HEALTH_CHECKS","health checks"),
            new TermSpec("LIVENESS_PROBE","liveness probe"),
            new TermSpec("READINESS_PROBE","readiness probe"),
            new TermSpec("REAL_LOGIN","real Login"),
            new TermSpec("SERVICE_AVAILABILITY","service availability"),
            new TermSpec("END_TO_END_CHECK","end-to-end check"),
            new TermSpec("SPINNER","spinner"),
            new TermSpec("ALIVE_NOT_AVAILABLE","Being alive is not the same as being available")
    );
    public static List<TermCue> resolve(
            ObjectMapper mapper,String rawAlignment,BigDecimal duration,
            List<Ep002VoiceBeatResolver.BeatCue> beats) {
        if(mapper==null||rawAlignment==null||rawAlignment.isBlank()
                ||duration==null||duration.signum()<=0||beats==null||beats.size()!=5)
            throw new IllegalArgumentException("SHOT04_VERIFIED_VOICE_ALIGNMENT_REQUIRED");
        try {
            JsonNode root=mapper.readTree(rawAlignment);
            JsonNode alignment=root.path("normalized_alignment");
            if(!valid(alignment))alignment=root.path("alignment");
            if(!valid(alignment))
                throw new IllegalArgumentException("SHOT04_REAL_CHARACTER_ALIGNMENT_MISSING");
            Speech speech=map(alignment);
            int frames=(int)Math.ceil(duration.doubleValue()*30);
            if(frames<150||frames>108000)
                throw new IllegalArgumentException("SHOT04_MEASURED_VOICE_DURATION_INVALID");
            List<TermCue> output=new ArrayList<>();
            int cursor=0;
            for(TermSpec spec:TERMS) {
                String normalized=normalize(spec.phrase());
                int found=nextWholePhrase(speech.normalized(),normalized,cursor);
                if(found<0)
                    throw new IllegalArgumentException("SHOT04_TERM_NOT_SPOKEN_IN_ORDER_"+spec.id());
                double s=speech.start().get(found);
                double e=speech.end().get(found+normalized.length()-1);
                if(!Double.isFinite(s)||!Double.isFinite(e)||s<0||e<=s
                        ||e>duration.doubleValue()+.25)
                    throw new IllegalArgumentException("SHOT04_TERM_TIMES_INVALID_"+spec.id());
                int first=(int)Math.floor(s*30d);
                int last=Math.min(frames,(int)Math.ceil(e*30d));
                if(first<0||last<=first||last>frames
                        ||(!output.isEmpty()&&first<output.getLast().endFrame()))
                    throw new IllegalArgumentException("SHOT04_REAL_TERM_FRAMES_INVALID");
                output.add(new TermCue(spec.id(),spec.phrase(),first,last));
                cursor=found+normalized.length();
            }
            if(output.get(0).startFrame()<beats.getFirst().startFrame()
                    ||output.getLast().endFrame()>beats.getLast().endFrame())
                throw new IllegalArgumentException("SHOT04_TERMS_OUTSIDE_VERIFIED_VOICE_BEATS");
            return List.copyOf(output);
        }catch(IllegalArgumentException invalid){
            throw invalid;
        }catch(Exception invalid){
            throw new IllegalArgumentException("SHOT04_CHARACTER_ALIGNMENT_UNREADABLE",invalid);
        }
    }

    private static int nextWholePhrase(String text,String phrase,int cursor) {
        int found=text.indexOf(phrase,cursor);
        while(found>=0){
            int after=found+phrase.length();
            if((found==0||text.charAt(found-1)==' ')
                    &&(after==text.length()||text.charAt(after)==' '))
                return found;
            found=text.indexOf(phrase,found+1);
        }
        return -1;
    }

    private static String normalize(String text) {
        StringBuilder output=new StringBuilder();
        for(char value:text.toLowerCase(Locale.ROOT).toCharArray()){
            if(Character.isLetterOrDigit(value))output.append(value);
            else if(!output.isEmpty()&&output.charAt(output.length()-1)!=' ')
                output.append(' ');
        }
        return output.toString().trim();
    }

    private static boolean valid(JsonNode node){
        return node.path("characters").isArray()
                &&node.path("characters").size()>0
                &&node.path("character_start_times_seconds").isArray()
                &&node.path("character_end_times_seconds").isArray()
                &&node.path("characters").size()==node.path("character_start_times_seconds").size()
                &&node.path("characters").size()==node.path("character_end_times_seconds").size();
    }

    private static Speech map(JsonNode alignment) {
        StringBuilder words=new StringBuilder();
        List<Double> start=new ArrayList<>();
        List<Double> end=new ArrayList<>();
        double previous=-1d;
        for(int i=0;i<alignment.path("characters").size();i++) {
            String glyph=alignment.path("characters").path(i).asText();
            double s=alignment.path("character_start_times_seconds").path(i).asDouble(Double.NaN);
            double e=alignment.path("character_end_times_seconds").path(i).asDouble(Double.NaN);
            if(glyph.isEmpty()||glyph.length()>8||!Double.isFinite(s)||!Double.isFinite(e)
                    ||s<0||e<s||s<previous)
                throw new IllegalArgumentException("SHOT04_CHARACTER_TIMESTAMPS_INVALID");
            previous=s;
            for(int j=0;j<glyph.length();j++) {
                char ch=Character.toLowerCase(glyph.charAt(j));
                if(Character.isLetterOrDigit(ch)) {
                    words.append(ch);
                    start.add(s);
                    end.add(e);
                } else if(!words.isEmpty()&&words.charAt(words.length()-1)!=' ') {
                    words.append(' ');
                    start.add(s);
                    end.add(e);
                }
            }
        }
        while(!words.isEmpty()&&words.charAt(words.length()-1)==' ') {
            words.setLength(words.length()-1);
            start.remove(start.size()-1);
            end.remove(end.size()-1);
        }
        if(words.isEmpty())throw new IllegalArgumentException("SHOT04_SPOKEN_TEXT_EMPTY");
        return new Speech(words.toString(),start,end);
    }
}
