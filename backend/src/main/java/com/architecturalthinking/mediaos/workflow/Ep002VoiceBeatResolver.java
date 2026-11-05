package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class Ep002VoiceBeatResolver {
    private Ep002VoiceBeatResolver() {}

    public record BeatCue(int beatNumber,String spokenAnchor,int startFrame,
                          int endFrame,double spokenStartSeconds,double spokenEndSeconds) {}
    private record Mapped(String speech,List<Double> start,List<Double> end) {}

    public static List<BeatCue> resolve(ObjectMapper mapper,String rawAlignment,
                                        BigDecimal measuredDuration,List<String> spokenAnchors,
                                        int expectedBeats) {
        if(mapper==null || rawAlignment==null || rawAlignment.isBlank()
                || measuredDuration==null || measuredDuration.signum()<=0
                || spokenAnchors==null || spokenAnchors.size()!=expectedBeats
                || expectedBeats<1 || expectedBeats>24)
            throw new IllegalArgumentException("Current measured audio and one phrase per beat are required.");
        try {
            JsonNode root=mapper.readTree(rawAlignment);
            JsonNode alignment=root.path("normalized_alignment");
            if(!hasArrays(alignment))alignment=root.path("alignment");
            if(!hasArrays(alignment))
                throw new IllegalArgumentException("Existing selected Take has no genuine character alignment.");
            Mapped speech=map(alignment);
            int totalFrames=(int)Math.ceil(measuredDuration.doubleValue()*30);
            if(totalFrames<2 || totalFrames>108000)
                throw new IllegalArgumentException("Measured Take duration is unsupported.");
            List<BeatCue> cues=new ArrayList<>();
            for(int i=0;i<spokenAnchors.size();i++) {
                String raw=spokenAnchors.get(i);
                String exact=normalize(raw);
                if(raw==null || raw.isBlank() || raw.length()>200 || exact.length()<3)
                    throw new IllegalArgumentException("Each cue needs a real, readable spoken phrase.");
                int begin=speech.speech().indexOf(exact);
                if(begin<0 || (begin>0 && speech.speech().charAt(begin-1)!=' ')
                        || (begin+exact.length()<speech.speech().length()
                        && speech.speech().charAt(begin+exact.length())!=' '))
                    throw new IllegalArgumentException("Beat "+(i+1)+" anchor was not spoken in the selected Take.");
                int other=speech.speech().indexOf(exact,begin+1);
                if(other>=0)
                    throw new IllegalArgumentException("Beat "+(i+1)+" phrase is repeated; select a longer unique quote.");
                double start=speech.start().get(begin);
                double end=speech.end().get(begin+exact.length()-1);
                if(!Double.isFinite(start)||!Double.isFinite(end)||start<0
                        || start>=end || end>measuredDuration.doubleValue()+0.25)
                    throw new IllegalArgumentException("Alignment boundaries disagree with the measured Take.");
                int startFrame=(int)Math.floor(start*30);
                if(startFrame<0 || startFrame>=totalFrames)
                    throw new IllegalArgumentException("Anchor exceeds measured audio frames.");
                if(!cues.isEmpty()) {
                    BeatCue previous=cues.remove(cues.size()-1);
                    if(startFrame<=previous.startFrame()
                            || start<previous.spokenEndSeconds())
                        throw new IllegalArgumentException("Beat anchors must follow the spoken order.");
                    cues.add(new BeatCue(previous.beatNumber(),previous.spokenAnchor(),
                            previous.startFrame(),startFrame,
                            previous.spokenStartSeconds(),previous.spokenEndSeconds()));
                }
                cues.add(new BeatCue(i+1,raw.trim(),startFrame,totalFrames,start,end));
            }
            if(cues.getLast().endFrame()<=cues.getLast().startFrame())
                throw new IllegalArgumentException("The last beat has no playable frames.");
            return List.copyOf(cues);
        }catch(IllegalArgumentException problem) {
            throw problem;
        }catch(Exception error) {
            throw new IllegalArgumentException("The selected Take alignment cannot be verified.",error);
        }
    }

    private static boolean hasArrays(JsonNode node) {
        return node.path("characters").isArray()
                && node.path("character_start_times_seconds").isArray()
                && node.path("character_end_times_seconds").isArray()
                && node.path("characters").size()>0
                && node.path("characters").size()==node.path("character_start_times_seconds").size()
                && node.path("characters").size()==node.path("character_end_times_seconds").size();
    }

    private static Mapped map(JsonNode node) {
        StringBuilder text=new StringBuilder();
        List<Double> start=new ArrayList<>(),end=new ArrayList<>();
        double last=-1;
        for(int i=0;i<node.path("characters").size();i++) {
            String glyph=node.path("characters").path(i).asText();
            double s=node.path("character_start_times_seconds").path(i).asDouble(Double.NaN);
            double e=node.path("character_end_times_seconds").path(i).asDouble(Double.NaN);
            if(glyph.isEmpty() || glyph.length()>8
                    || !Double.isFinite(s)||!Double.isFinite(e)||s<0||e<s||s<last)
                throw new IllegalArgumentException("Character timestamps are invalid or out of order.");
            last=s;
            for(int j=0;j<glyph.length();j++) {
                char letter=Character.toLowerCase(glyph.charAt(j));
                if(Character.isLetterOrDigit(letter)) {
                    text.append(letter);
                    start.add(s);end.add(e);
                }else if(!text.isEmpty() && text.charAt(text.length()-1)!=' ') {
                    text.append(' ');start.add(s);end.add(e);
                }
            }
        }
        while(!text.isEmpty() && text.charAt(text.length()-1)==' ') {
            text.setLength(text.length()-1);
            start.remove(start.size()-1);end.remove(end.size()-1);
        }
        if(text.isEmpty())throw new IllegalArgumentException("Aligned speech contains no words.");
        return new Mapped(text.toString(),start,end);
    }

    private static String normalize(String phrase) {
        if(phrase==null)return "";
        StringBuilder s=new StringBuilder();
        for(char ch:phrase.toLowerCase(Locale.ROOT).toCharArray()) {
            if(Character.isLetterOrDigit(ch))s.append(ch);
            else if(!s.isEmpty() && s.charAt(s.length()-1)!=' ')s.append(' ');
        }
        return s.toString().trim();
    }
}
