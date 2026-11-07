package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class Ep002Shot02EditorialPausePlan {
    public static final int FPS=30;
    public static final String TIMING_MODE="ELEVENLABS_REAL_TIMESTAMPS_PLUS_EDITORIAL_SILENCE_V1";
    private Ep002Shot02EditorialPausePlan(){}

    public record Pause(String afterPhrase,int atFrame,int holdFrames) {}
    public record Plan(int sourceDurationInFrames,int durationInFrames,int addedFrames,
                       String timingMode,List<Pause> pauses,
                       List<Ep002VoiceBeatResolver.BeatCue> verifiedCues,
                       List<Ep002Shot02TermResolver.TermCue> termCues) {}
    private record Spec(String phrase,int holdFrames) {}
    private record Speech(String text,List<Double> ends) {}

    private static final List<Spec> BREAKS=List.of(
        new Spec("before the seats are gone",60),
        new Spec("the number of people arriving has",48),
        new Spec("the platform s entry point",66),
        new Spec("across several Auth servers",81),
        new Spec("at first answers return quickly",30),
        new Spec("entering the system each second",81),
        new Spec("the Auth servers share the traffic",33),
        new Spec("the same User Database",90),
        new Spec("where the pressure starts",48)
    );

    public static Plan fromVerified(ObjectMapper mapper,String alignment,
                                    BigDecimal sourceSeconds,
                                    List<Ep002VoiceBeatResolver.BeatCue> beats,
                                    List<Ep002Shot02TermResolver.TermCue> terms) {
        if(mapper==null||alignment==null||alignment.isBlank()||sourceSeconds==null
                ||sourceSeconds.signum()<=0||beats==null||beats.size()!=5
                ||terms==null||terms.size()!=7)
            throw new IllegalArgumentException("SHOT02_EDITORIAL_REQUIRES_CURRENT_VERIFIED_TAKE");
        int frames=(int)Math.ceil(sourceSeconds.doubleValue()*FPS);
        if(frames<6||frames>108000||beats.getLast().endFrame()!=frames)
            throw new IllegalArgumentException("SHOT02_EDITORIAL_VOICE_DURATION_INVALID");
        Speech speech=parseAlignment(mapper,alignment);
        List<Pause> pauses=new ArrayList<>();
        int cursor=0,previous=-1,total=0;
        for(Spec spec:BREAKS) {
            String phrase=normalize(spec.phrase());
            int index=nextPhrase(speech.text(),phrase,cursor);
            if(index<0)throw new IllegalArgumentException(
                    "SHOT02_EDITORIAL_SENTENCE_ANCHOR_NOT_IN_SELECTED_TAKE: "+spec.phrase());
            double seconds=speech.ends().get(index+phrase.length()-1);
            int at=Math.max(0,(int)Math.ceil(seconds*FPS));
            if(at<=previous||at>=frames||at-previous<9)
                throw new IllegalArgumentException("SHOT02_EDITORIAL_PAUSE_BOUNDARIES_INVALID");
            pauses.add(new Pause(spec.phrase(),at,spec.holdFrames()));
            previous=at;
            cursor=index+phrase.length();
            total+=spec.holdFrames();
        }
        List<Ep002VoiceBeatResolver.BeatCue> shiftedBeats=new ArrayList<>();
        for(int i=0;i<beats.size();i++){
            var beat=beats.get(i);
            int start=shiftStart(beat.startFrame(),pauses);
            int end=i+1==beats.size()?frames+total:
                    shiftStart(beats.get(i+1).startFrame(),pauses);
            if(end<=start)throw new IllegalArgumentException("SHOT02_EDITORIAL_BEAT_INVALID");
            shiftedBeats.add(new Ep002VoiceBeatResolver.BeatCue(
                beat.beatNumber(),beat.spokenAnchor(),start,end,
                beat.spokenStartSeconds()+shiftSeconds(beat.startFrame(),pauses,true),
                beat.spokenEndSeconds()+shiftSeconds(beat.endFrame(),pauses,false)));
        }
        List<Ep002Shot02TermResolver.TermCue> shiftedTerms=new ArrayList<>();
        for(var term:terms){
            int start=shiftStart(term.startFrame(),pauses);
            int end=shiftEnd(term.endFrame(),pauses);
            if(start>=end||end>frames+total
                    ||(!shiftedTerms.isEmpty()&&start<shiftedTerms.getLast().endFrame()))
                throw new IllegalArgumentException("SHOT02_EDITORIAL_TERM_CUE_INVALID");
            shiftedTerms.add(new Ep002Shot02TermResolver.TermCue(
                term.id(),term.spokenAnchor(),start,end));
        }
        if(shiftedBeats.getLast().endFrame()!=frames+total)
            throw new IllegalArgumentException("SHOT02_EDITORIAL_DURATION_MISMATCH");
        return new Plan(frames,frames+total,total,TIMING_MODE,
            List.copyOf(pauses),List.copyOf(shiftedBeats),List.copyOf(shiftedTerms));
    }

    static int shiftStart(int frame,List<Pause> pauses){
        int delta=0;
        for(Pause p:pauses)if(p.atFrame()<=frame)delta+=p.holdFrames();
        return frame+delta;
    }
    static int shiftEnd(int frame,List<Pause> pauses){
        int delta=0;
        for(Pause p:pauses)if(p.atFrame()<frame)delta+=p.holdFrames();
        return frame+delta;
    }
    private static double shiftSeconds(int frame,List<Pause> pauses,boolean includeEqual){
        int added=0;
        for(Pause p:pauses)if(p.atFrame()<frame||(includeEqual&&p.atFrame()==frame))
            added+=p.holdFrames();
        return added/(double)FPS;
    }
    private static String normalize(String value){
        StringBuilder out=new StringBuilder();
        for(char ch:value.toLowerCase(Locale.ROOT).toCharArray()){
            if(Character.isLetterOrDigit(ch))out.append(ch);
            else if(!out.isEmpty()&&out.charAt(out.length()-1)!=' ')out.append(' ');
        }
        return out.toString().trim();
    }
    private static int nextPhrase(String source,String phrase,int from){
        int found=source.indexOf(phrase,from);
        while(found>=0){
            int end=found+phrase.length();
            if((found==0||source.charAt(found-1)==' ')
                    &&(end==source.length()||source.charAt(end)==' '))
                return found;
            found=source.indexOf(phrase,found+1);
        }
        return -1;
    }
    private static Speech parseAlignment(ObjectMapper mapper,String raw){
        try{
            JsonNode root=mapper.readTree(raw);
            JsonNode block=root.path("normalized_alignment");
            if(!valid(block))block=root.path("alignment");
            if(!valid(block))throw new IllegalArgumentException(
                "SHOT02_EDITORIAL_REAL_CHARACTER_ALIGNMENT_MISSING");
            StringBuilder out=new StringBuilder();
            List<Double> ends=new ArrayList<>();
            double last=-1;
            for(int i=0;i<block.path("characters").size();i++){
                String glyph=block.path("characters").get(i).asText();
                double start=block.path("character_start_times_seconds").get(i).asDouble(Double.NaN);
                double end=block.path("character_end_times_seconds").get(i).asDouble(Double.NaN);
                if(glyph.isBlank()&&glyph.length()>8||glyph.isEmpty()||glyph.length()>8
                   ||!Double.isFinite(start)||!Double.isFinite(end)
                   ||end<start||start<last)
                    throw new IllegalArgumentException("SHOT02_EDITORIAL_BAD_CHARACTER_TIMESTAMP");
                last=start;
                for(char ch:glyph.toLowerCase(Locale.ROOT).toCharArray()){
                    if(Character.isLetterOrDigit(ch)){
                        out.append(ch);ends.add(end);
                    }else if(!out.isEmpty()&&out.charAt(out.length()-1)!=' '){
                        out.append(' ');ends.add(end);
                    }
                }
            }
            while(!out.isEmpty()&&out.charAt(out.length()-1)==' '){
                out.deleteCharAt(out.length()-1);ends.remove(ends.size()-1);
            }
            if(out.isEmpty())throw new IllegalArgumentException(
                "SHOT02_EDITORIAL_EMPTY_CHARACTER_ALIGNMENT");
            return new Speech(out.toString(),List.copyOf(ends));
        }catch(IllegalArgumentException e){throw e;}
        catch(Exception bad){throw new IllegalArgumentException(
            "SHOT02_EDITORIAL_ALIGNMENT_UNREADABLE",bad);}
    }
    private static boolean valid(JsonNode block){
        return block.path("characters").isArray()
          &&block.path("character_start_times_seconds").isArray()
          &&block.path("character_end_times_seconds").isArray()
          &&block.path("characters").size()>0
          &&block.path("characters").size()==block.path("character_start_times_seconds").size()
          &&block.path("characters").size()==block.path("character_end_times_seconds").size();
    }
}
