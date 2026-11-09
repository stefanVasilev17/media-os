package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

public final class Ep002RecoverySource {
    static final String SCRIPT_PATH="episode-production/ep002-locked-script-v5.json";
    static final String VISUAL_PATH="episode-production/ep002-recovery-visual-overrides-v5.json";
    static final int PROTECTED_SHOTS=7;
    static final int FIRST_RECOVERY_SHOT=8;
    static final int LAST_RECOVERY_SHOT=11;
    static final int EXPECTED_TOTAL_BEATS=59;
    private Ep002RecoverySource() {}

    static JsonNode load(ObjectMapper mapper,String path) {
        try(var stream=new ClassPathResource(path).getInputStream()) {
            return mapper.readTree(stream);
        } catch(IOException exception) {
            throw new IllegalStateException("EP002 recovery production source cannot be loaded: "+path,exception);
        }
    }

    static JsonNode visual(JsonNode archived,JsonNode recovery,int index) {
        if(index<0||index>=11)throw new IllegalArgumentException("Invalid EP002 SHOT index");
        if(index<PROTECTED_SHOTS)return archived.path("shots").path(index);
        return recovery.path("shots").path(index-PROTECTED_SHOTS);
    }

    static void verify(JsonNode scripts,JsonNode archived,JsonNode recovery) {
        if(!"EP002".equals(scripts.path("episodeKey").asText())
                ||!"v5.0".equals(scripts.path("scriptVersion").asText())
                ||!"DIRECTOR_LOCKED".equals(scripts.path("directorFullScriptStatus").asText())
                ||scripts.path("shotCount").asInt()!=11
                ||!"EP002".equals(recovery.path("episodeKey").asText())
                ||!"v5.0".equals(recovery.path("scriptVersion").asText())
                ||recovery.path("shotCount").asInt()!=4
                ||recovery.path("beatCount").asInt()!=24
                ||!Ep002ProductionContractService.VISUAL_SHA.equals(
                    recovery.path("protectedVisualSourceSha").asText())
                ||archived.path("beatCount").asInt()!=EXPECTED_TOTAL_BEATS) {
            throw new IllegalStateException("EP002 recovery/source integrity invalid");
        }
        int count=0;
        for(int i=0;i<11;i++) {
            String key=String.format(Locale.ROOT,"SHOT%02d",i+1);
            JsonNode script=scripts.path("shots").path(i);
            JsonNode old=archived.path("shots").path(i);
            JsonNode effective=visual(archived,recovery,i);
            if(!key.equals(script.path("shotKey").asText())
                    ||!key.equals(old.path("shotKey").asText())
                    ||!key.equals(effective.path("shotKey").asText())
                    ||script.path("englishNarration").asText().isBlank()
                    ||effective.path("beats").size()!=old.path("beats").size())
                throw new IllegalStateException("EP002 recovery SHOT beats changed: "+key);
            count+=effective.path("beats").size();
            if(i>=PROTECTED_SHOTS) {
                if(!"v2.0".equals(script.path("directorScriptRevision").asText()))
                    throw new IllegalStateException("EP002 recovery script revision invalid: "+key);
                int previous=-1;
                String words=normalize(script.path("englishNarration").asText());
                for(JsonNode beat:effective.path("beats")) {
                    String quote=normalize(beat.path("spokenAnchor").asText());
                    int at=words.indexOf(quote);
                    if(quote.length()<5||at<=previous
                            ||words.indexOf(quote,at+1)>=0)
                        throw new IllegalStateException("EP002 recovery automatic cue missing or repeated: "+key);
                    previous=at;
                }
            }
        }
        if(count!=EXPECTED_TOTAL_BEATS)
            throw new IllegalStateException("EP002 protected visual beat count changed");
    }

    static String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+"," ").trim();
    }

    static List<String> suggestedAnchors(JsonNode archived,JsonNode recovery,String shotKey) {
        if(shotKey==null||!shotKey.matches("SHOT(0[8-9]|1[0-1])"))return List.of();
        int index=Integer.parseInt(shotKey.substring(4))-1;
        JsonNode beats=visual(archived,recovery,index).path("beats");
        java.util.ArrayList<String> anchors=new java.util.ArrayList<>();
        for(JsonNode beat:beats)anchors.add(beat.path("spokenAnchor").asText());
        return List.copyOf(anchors);
    }
}
