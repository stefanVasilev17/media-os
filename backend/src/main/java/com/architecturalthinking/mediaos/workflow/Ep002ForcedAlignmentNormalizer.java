package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public final class Ep002ForcedAlignmentNormalizer {
    private Ep002ForcedAlignmentNormalizer() {}

    public static String normalize(ObjectMapper mapper, String sourceJson) {
        try {
            JsonNode root=mapper.readTree(sourceJson);
            JsonNode characters=root.path("characters");
            if(!characters.isArray() || characters.isEmpty() || characters.size()>100_000)
                throw new IllegalArgumentException("Forced alignment returned no valid characters.");
            ObjectNode normalized=mapper.createObjectNode();
            ObjectNode block=normalized.putObject("normalized_alignment");
            ArrayNode symbols=block.putArray("characters");
            ArrayNode starts=block.putArray("character_start_times_seconds");
            ArrayNode ends=block.putArray("character_end_times_seconds");
            double previousStart=-1;
            for(JsonNode character:characters) {
                String glyph=character.path("text").asText("");
                double start=character.path("start").asDouble(Double.NaN);
                double end=character.path("end").asDouble(Double.NaN);
                if(glyph.isEmpty() || glyph.length()>8 || !Double.isFinite(start)
                    || !Double.isFinite(end) || start<0 || end<start || start<previousStart)
                    throw new IllegalArgumentException("Forced alignment returned invalid character timing.");
                previousStart=start;
                symbols.add(glyph); starts.add(start); ends.add(end);
            }
            normalized.put("alignment_source","ELEVENLABS_FORCED_ALIGNMENT");
            normalized.set("forced_alignment",root);
            return mapper.writeValueAsString(normalized);
        } catch (IllegalArgumentException problem) {throw problem;}
        catch (Exception problem) {
            throw new IllegalArgumentException("Unable to normalize ElevenLabs forced alignment.",problem);
        }
    }
}
