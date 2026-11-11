package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * An ElevenLabs TTS response can contain metadata and null alignment fields.
 * A non-null JSON column is NOT proof that character timestamps exist.
 * Separate missing timestamps from malformed/unsafe stored timestamp arrays:
 * only missing timestamps may be requested from the paid provider again.
 */
public final class Ep002SavedAlignmentInspection {
    public enum State { MISSING, PRESENT, MALFORMED }

    private Ep002SavedAlignmentInspection() {}

    public static State inspect(ObjectMapper mapper,String rawJson) {
        if(mapper==null || rawJson==null || rawJson.isBlank())return State.MISSING;
        try {
            JsonNode root=mapper.readTree(rawJson);
            if(root==null||root.isNull())return State.MISSING;
            if(!root.isObject())return State.MALFORMED;
            State normalized=block(root.path("normalized_alignment"));
            State original=block(root.path("alignment"));
            if(normalized==State.PRESENT||original==State.PRESENT)return State.PRESENT;
            if(normalized==State.MALFORMED||original==State.MALFORMED)return State.MALFORMED;
            return State.MISSING;
        }catch(Exception invalid) {
            return State.MALFORMED;
        }
    }

    private static State block(JsonNode value) {
        if(value==null||value.isMissingNode()||value.isNull())return State.MISSING;
        if(!value.isObject())return State.MALFORMED;
        JsonNode chars=value.path("characters");
        JsonNode starts=value.path("character_start_times_seconds");
        JsonNode ends=value.path("character_end_times_seconds");
        if((chars.isMissingNode()||chars.isNull())
                &&(starts.isMissingNode()||starts.isNull())
                &&(ends.isMissingNode()||ends.isNull()))return State.MISSING;
        if(!chars.isArray()||!starts.isArray()||!ends.isArray())
            return State.MALFORMED;
        if(chars.isEmpty()&&starts.isEmpty()&&ends.isEmpty())return State.MISSING;
        if(chars.isEmpty()||chars.size()!=starts.size()||chars.size()!=ends.size()
                ||chars.size()>100_000)return State.MALFORMED;
        double previous=-1;
        for(int i=0;i<chars.size();i++) {
            JsonNode c=chars.get(i),start=starts.get(i),end=ends.get(i);
            if(!c.isTextual()||c.asText().isEmpty()||c.asText().length()>8
                    ||!start.isNumber()||!end.isNumber())return State.MALFORMED;
            double s=start.asDouble(),e=end.asDouble();
            if(!Double.isFinite(s)||!Double.isFinite(e)||s<0||e<s||s<previous)
                return State.MALFORMED;
            previous=s;
        }
        return State.PRESENT;
    }
}
