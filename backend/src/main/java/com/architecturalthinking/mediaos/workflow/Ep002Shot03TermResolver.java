package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class Ep002Shot03TermResolver {
    private Ep002Shot03TermResolver() {}

    public record TermCue(String id,String spokenAnchor,int startFrame,int endFrame) {}
    private record TermSpec(String id,String spoken) {}

    private static final List<TermSpec> TERMS=List.of(
            new TermSpec("USER_DATABASE","User Database"),
            new TermSpec("FIVE_HUNDRED","five hundred"),
            new TermSpec("THROUGHPUT","throughput"),
            new TermSpec("SIX_FIFTY","six hundred and fifty"),
            new TermSpec("NINE_HUNDRED","nine hundred"),
            new TermSpec("ARRIVAL_RATE","arrival rate"),
            new TermSpec("UNFINISHED_WORK","unfinished work starts piling up"),
            new TermSpec("BOTTLENECK","bottleneck"),
            new TermSpec("SATURATION","saturation"),
            new TermSpec("LATENCY","latency"),
            new TermSpec("STILL_WORKING","hasn’t stopped working")
    );

    public static List<TermCue> resolve(
            ObjectMapper mapper,String alignment,BigDecimal duration,
            List<Ep002VoiceBeatResolver.BeatCue> beats) {
        if(mapper==null||alignment==null||duration==null
                ||beats==null||beats.size()!=5)
            throw new IllegalArgumentException("SHOT03_VERIFIED_VOICE_ALIGNMENT_REQUIRED");
        List<String> phrases=TERMS.stream().map(TermSpec::spoken).toList();
        List<Ep002VoiceBeatResolver.BeatCue> aligned;
        try {
            aligned=Ep002VoiceBeatResolver.resolve(
                    mapper,alignment,duration,phrases,TERMS.size());
        } catch(IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "SHOT03_MISSING_OR_AMBIGUOUS_REAL_SPOKEN_TERM",ex);
        }
        int frames=(int)Math.ceil(duration.doubleValue()*30d);
        List<TermCue> out=new ArrayList<>();
        for(int i=0;i<TERMS.size();i++) {
            var original=aligned.get(i);
            int first=(int)Math.floor(original.spokenStartSeconds()*30d);
            int last=Math.min(frames,(int)Math.ceil(original.spokenEndSeconds()*30d));
            if(last<=first)last=Math.min(frames,first+1);
            if(first<0||last<=first||last>frames
                    ||(!out.isEmpty()&&first<out.getLast().endFrame()))
                throw new IllegalArgumentException("SHOT03_REAL_TERM_FRAMES_INVALID");
            out.add(new TermCue(TERMS.get(i).id(),TERMS.get(i).spoken(),first,last));
        }
        if(out.get(1).startFrame()<beats.get(0).startFrame()
            ||out.get(1).startFrame()>=beats.get(0).endFrame()
            ||out.get(3).startFrame()<beats.get(1).startFrame()
            ||out.get(4).startFrame()>=beats.get(1).endFrame()
            ||out.get(5).startFrame()<beats.get(2).startFrame()
            ||out.get(5).startFrame()>=beats.get(2).endFrame()
            ||out.get(6).startFrame()<beats.get(3).startFrame()
            ||out.get(6).startFrame()>=beats.get(3).endFrame()
            ||out.get(7).startFrame()<beats.get(4).startFrame()
            ||out.get(7).startFrame()>=beats.get(4).endFrame())
            throw new IllegalArgumentException("SHOT03_TERMS_DISAGREE_WITH_DIRECTOR_BEATS");
        return List.copyOf(out);
    }
}
