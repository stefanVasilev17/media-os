package com.architecturalthinking.mediaos.workflow;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Revisions may change the narration's wording without changing the five
 * Director-approved SHOT01 visual actions. Read-only cue selection from the
 * current saved narration; NEVER invent audio frames or mark a Take verified.
 * Every proposed phrase must remain a unique, ordered literal word sequence
 * in the saved text and is independently checked against REAL ElevenLabs
 * character timestamps by Ep002VoiceBeatResolver.
 */
public final class Ep002Shot01AdaptiveAnchors {
    private static final Pattern TOKEN=Pattern.compile("[\\p{L}\\p{N}]+");
    private static final String[][] SIGNALS={
        {"tap","click","press","login","signin","sign"},
        {"seconds","ten","minutes","minute","time","clock","loading","spinner","waiting"},
        {"server","health","healthy","authentication","service","auth","checks","running","alive","probe"},
        {"waiting","answer","response","unanswered","respond","request","pending","stuck","login"},
        {"nine","rewind","back","earlier","morning","restart","beginning","09"}
    };
    private static final double[] IDEAL={0.045,0.24,0.48,0.72,0.9};
    private static final double[] MIN={0.0,0.06,0.21,0.42,0.64};
    private static final double[] MAX={0.31,0.56,0.79,0.94,1.0};

    private Ep002Shot01AdaptiveAnchors() {}

    public static List<String> fromSavedNarration(String narration) {
        if(narration==null||narration.isBlank()||narration.length()>24_000)
            return List.of();
        Matcher found=TOKEN.matcher(narration);
        List<String> words=new ArrayList<>();
        List<String> norm=new ArrayList<>();
        while(found.find()) {
            String original=found.group();
            words.add(original);
            norm.add(original.toLowerCase(Locale.ROOT));
        }
        int total=words.size();
        if(total<30 || total>2500)return List.of();
        List<String> chosen=new ArrayList<>();
        int previousEnd=-1;
        String normalizedText=" "+String.join(" ",norm)+" ";
        for(int beat=0;beat<SIGNALS.length;beat++) {
            int bestStart=-1,bestEnd=-1;
            double bestScore=Double.POSITIVE_INFINITY;
            for(int marker=previousEnd+1;marker<total;marker++) {
                double portion=(double)marker/total;
                if(portion<MIN[beat]||portion>MAX[beat])continue;
                int priority=priority(beat,norm.get(marker));
                if(priority<0)continue;
                for(int backward=0;backward<=2;backward++) {
                    int start=Math.max(previousEnd+1,marker-backward);
                    int end=Math.min(total,Math.max(marker+3,start+4));
                    if(end-start<3||end-start>7)continue;
                    String phrase=" "+String.join(" ",norm.subList(start,end))+" ";
                    if(normalizedText.indexOf(phrase)<0
                            ||normalizedText.indexOf(phrase,normalizedText.indexOf(phrase)+1)>=0)
                        continue;
                    double score=priority*100.0+Math.abs(portion-IDEAL[beat])*140.0
                            +backward*1.5;
                    if(score<bestScore) {
                        bestScore=score;
                        bestStart=start;
                        bestEnd=end;
                    }
                }
            }
            if(bestStart<0)return List.of();
            chosen.add(String.join(" ",words.subList(bestStart,bestEnd)));
            previousEnd=bestEnd-1;
        }
        return List.copyOf(chosen);
    }

    private static int priority(int beat,String word) {
        for(int i=0;i<SIGNALS[beat].length;i++)if(SIGNALS[beat][i].equals(word))return i;
        return -1;
    }
}
