package com.architecturalthinking.mediaos.workflow;

import java.util.List;

public final class Ep002Shot03SlowNaturalVoice {
    public static final String DELIVERY_MODE="ELEVEN_V4_SHOT03_SLOW_NATURAL_PAUSES_V1";
    private static final String REQUIRED_SHOT="SHOT03";

    public record PauseAnchor(String exactSpokenText,String tag) {}

    private static final List<PauseAnchor> ANCHORS=List.of(
            new PauseAnchor("same User Database.","[pause]"),
            new PauseAnchor("this is where things start to slow down.","[long pause]"),
            new PauseAnchor("one account lookup.","[pause]"),
            new PauseAnchor("five hundred of these lookups every second.","[long pause]"),
            new PauseAnchor("Engineers call this throughput","[pause]"),
            new PauseAnchor("a given amount of time.","[long pause]"),
            new PauseAnchor("six hundred and fifty new Login requests","[pause]"),
            new PauseAnchor("Then nine hundred.","[long pause]"),
            new PauseAnchor("That’s the arrival rate","[pause]"),
            new PauseAnchor("enter the system.","[long pause]"),
            new PauseAnchor("database can handle.","[pause]"),
            new PauseAnchor("unfinished work starts piling up.","[pause]"),
            new PauseAnchor("Others are waiting.","[long pause]"),
            new PauseAnchor("become the bottleneck","[pause]"),
            new PauseAnchor("entire Login process.","[long pause]"),
            new PauseAnchor("Engineers call this saturation.","[long pause]"),
            new PauseAnchor("latency","[pause]"),
            new PauseAnchor("response — increases.","[long pause]"),
            new PauseAnchor("The database hasn’t stopped working.","[pause]")
    );

    private Ep002Shot03SlowNaturalVoice() {}

    public static int pauseCount() {
        return ANCHORS.size();
    }

    public static int longPauseCount() {
        return (int) ANCHORS.stream()
                .filter(anchor->"[long pause]".equals(anchor.tag())).count();
    }

    public static boolean matchesNarration(String narration) {
        try {
            pacedText(narration);
            return true;
        } catch(IllegalArgumentException invalid) {
            return false;
        }
    }

    public static String prompt(String shot,String narration,String modelId) {
        if (!REQUIRED_SHOT.equals(shot)||modelId==null
                ||!modelId.startsWith("eleven_v4")) {
            throw new IllegalArgumentException(
                    "SHOT03_SLOW_NATURAL_REQUIRES_SHOT03_AND_ELEVEN_V4");
        }
        return pacedText(narration);
    }

    private static String pacedText(String narration) {
        if(narration==null||narration.isBlank()
                ||narration.contains("[pause]")
                ||narration.contains("[long pause]")) {
            throw new IllegalArgumentException(
                    "SHOT03_SLOW_NATURAL_REQUIRES_UNTAGGED_SAVED_NARRATION");
        }
        StringBuilder result=new StringBuilder(narration.length()+ANCHORS.size()*20);
        int cursor=0;
        for(PauseAnchor anchor:ANCHORS) {
            int index=narration.indexOf(anchor.exactSpokenText(),cursor);
            if(index<0||narration.indexOf(anchor.exactSpokenText(),index+1)>=0) {
                throw new IllegalArgumentException(
                        "SHOT03_SLOW_NATURAL_PAUSE_ANCHOR_MISSING_OR_AMBIGUOUS");
            }
            int end=index+anchor.exactSpokenText().length();
            result.append(narration,cursor,end);
            result.append(' ').append(anchor.tag());
            cursor=end;
        }
        result.append(narration,cursor,narration.length());
        return result.toString();
    }
}
