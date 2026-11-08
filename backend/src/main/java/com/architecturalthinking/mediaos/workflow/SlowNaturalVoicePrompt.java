package com.architecturalthinking.mediaos.workflow;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SlowNaturalVoicePrompt {
    public static final String DELIVERY_MODE = "ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1";
    private static final Pattern PUNCTUATION = Pattern.compile("[.,!?;:]|—");
    private static final Pattern TIMING_TAG = Pattern.compile("(?i)\\[(?:long\\s+)?pause\\]");
    public record Plan(String text,int pauseCount,int longPauseCount) {}

    private SlowNaturalVoicePrompt() {}

    public static Plan plan(String original,String modelId) {
        if(modelId==null||!modelId.startsWith("eleven_v4"))
            throw new IllegalArgumentException("SLOW_NATURAL_REQUIRES_ELEVEN_V4");
        if(original==null||original.isBlank()||original.length()>5000
                ||TIMING_TAG.matcher(original).find())
            throw new IllegalArgumentException("SLOW_NATURAL_REQUIRES_VALID_UNTAGGED_NARRATION");
        StringBuilder result=new StringBuilder(original.length()+256);
        Matcher punctuation=PUNCTUATION.matcher(original);
        int cursor=0,lastPause=0,pauses=0,longPauses=0,sentences=0;
        while(punctuation.find()) {
            int end=punctuation.end();
            if(end>=original.length() || !Character.isWhitespace(original.charAt(end)))continue;
            char mark=original.charAt(punctuation.start());
            int wordCount=wordCount(original.substring(lastPause,end));
            boolean sentence=mark=='.'||mark=='!'||mark=='?';
            boolean clause=mark==';'||mark==':'||mark=='—';
            boolean add=sentence||(clause&&wordCount>=7)||(mark==','&&wordCount>=11);
            if(!add)continue;
            if(sentence)sentences++;
            boolean longBreak=sentence&&(paragraphBreak(original,end)||sentences%4==0);
            result.append(original,cursor,end).append(longBreak?" [long pause]":" [pause]");
            cursor=end;
            lastPause=end;
            pauses++;
            if(longBreak)longPauses++;
            if(pauses>=60)break;
        }
        result.append(original,cursor,original.length());
        if(pauses==0) {
            Matcher words=Pattern.compile("\\S+").matcher(original);
            int count=wordCount(original);
            if(count<8)throw new IllegalArgumentException(
                    "SLOW_NATURAL_NARRATION_NEEDS_A_NATURAL_PAUSE_POINT");
            int seen=0,position=-1;
            while(words.find()) {
                if(++seen>=count/2) {position=words.end();break;}
            }
            if(position<=0||position>=original.length())
                throw new IllegalArgumentException("SLOW_NATURAL_PAUSE_POINT_UNAVAILABLE");
            return new Plan(original.substring(0,position)+" [pause]"
                    +original.substring(position),1,0);
        }
        return new Plan(result.toString(),pauses,longPauses);
    }

    private static boolean paragraphBreak(String text,int end) {
        int newlines=0;
        for(int i=end;i<text.length()&&Character.isWhitespace(text.charAt(i));i++) {
            if(text.charAt(i)=='\n')newlines++;
        }
        return newlines>=2;
    }

    private static int wordCount(String text) {
        String trimmed=text.trim();
        return trimmed.isEmpty()?0:trimmed.split("\\s+").length;
    }
}
