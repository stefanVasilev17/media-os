package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;

@Component
public class EpisodePackageValidator {
    public static final String VERSION = "mediaos.episode-package.v1";
    public static final int MAX_BYTES = 512 * 1024;

    private final ObjectMapper mapper;

    public EpisodePackageValidator(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public record Validated(JsonNode document,String episodeKey,String title,
                            String sha256,int shotCount,int beatCount) {}

    public Validated validate(String fileName,String sourceText,String expectedSha256) {
        if (fileName == null || !fileName.matches("[A-Za-z0-9][A-Za-z0-9._-]{0,139}\\.json")
                || fileName.length() > 140) bad("Only a safe .json file name is accepted.");
        if (sourceText == null || sourceText.isBlank()
                || sourceText.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES)
            bad("Episode Package must be a nonempty JSON file below 512 KiB.");
        String sha=sha256(sourceText);
        if (expectedSha256 == null || !sha.equals(expectedSha256))
            bad("Uploaded file hash differs from the Director-confirmed SHA-256.");

        JsonNode doc;
        try {
            doc = mapper.reader().with(JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
                    .readTree(sourceText);
        } catch (JsonProcessingException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Episode Package contains invalid or duplicate-key JSON.");
        }
        requireObject(doc,"package",Set.of(
                "schemaVersion","episode","sourceApproval","visualIdentity","shots","shortsCandidates"));
        if (!VERSION.equals(text(doc,"schemaVersion",1,80))) bad("Unknown Episode Package version.");

        JsonNode episode=object(doc,"episode",Set.of(
                "episodeKey","title","language","audience","targetDurationSeconds","subjectCluster"));
        String episodeKey=text(episode,"episodeKey",5,24);
        if (!episodeKey.matches("EP[0-9]{3,}") || episodeKey.equals("EP001")
                || episodeKey.equals("EP002"))
            bad("Use a new episode number (EP003 or later); EP001 and EP002 are protected.");
        String title=text(episode,"title",8,180);
        if (!"en".equals(text(episode,"language",2,2)))
            bad("Episode Package narration must be English.");
        text(episode,"audience",5,300);
        number(episode,"targetDurationSeconds",60,3600);
        optionalText(episode,"subjectCluster",0,140);

        JsonNode approval=object(doc,"sourceApproval",
                Set.of("script","visualStoryline","approvalNotes"));
        String scriptApproval=text(approval,"script",1,40);
        String visualApproval=text(approval,"visualStoryline",1,40);
        boolean approved="DIRECTOR_APPROVED".equals(scriptApproval)
                && "DIRECTOR_APPROVED".equals(visualApproval);
        boolean ep003VoiceOnly="EP003".equals(episodeKey)
                && "DIRECTOR_APPROVED".equals(scriptApproval)
                && "VOICE_ONLY_DRAFT".equals(visualApproval);
        if (!approved && !ep003VoiceOnly)
            bad("Script and visual storyline must be Director-approved, except EP003 voice-only intake with draft visuals.");
        if(ep003VoiceOnly && !"What Happens When One Database Is No Longer Enough?".equals(title))
            bad("EP003 voice-only intake requires the exact Director-locked episode title.");
        optionalText(approval,"approvalNotes",0,1000);

        JsonNode identity=object(doc,"visualIdentity",
                Set.of("styleReference","continuityRules","reuseAssetKeys"));
        text(identity,"styleReference",3,180);
        text(identity,"continuityRules",10,2500);
        optionalStringArray(identity,"reuseAssetKeys",200,80);

        JsonNode shots=array(doc,"shots",1,40);
        Set<String> knownShotKeys=new HashSet<>();
        int beats=0;
        int editorialTotal=0;
        for (int i=0;i<shots.size();i++) {
            JsonNode shot=shots.get(i);
            requireObject(shot,"shot",Set.of(
                    "shotKey","title","editorialDurationSeconds","narration","voiceDirection",
                    "visualGoal","startingFrame","cameraDirection","assetKeys","visualBeats",
                    "transition","shortsCandidate"));
            String key=text(shot,"shotKey",6,6);
            String expected=String.format(Locale.ROOT,"SHOT%02d",i+1);
            if (!expected.equals(key) || !knownShotKeys.add(key))
                bad("SHOT keys must be contiguous and unique in exact playback order.");
            text(shot,"title",4,180);
            editorialTotal+=number(shot,"editorialDurationSeconds",3,400);
            String narration=text(shot,"narration",20,12000);
            text(shot,"voiceDirection",8,1200);
            text(shot,"visualGoal",10,1500);
            optionalText(shot,"startingFrame",3,1500);
            text(shot,"cameraDirection",5,2200);
            text(shot,"transition",4,1200);
            optionalBoolean(shot,"shortsCandidate");
            optionalStringArray(shot,"assetKeys",100,80);

            JsonNode visualBeats=array(shot,"visualBeats",1,40);
            Set<String> beatIds=new HashSet<>();
            for(JsonNode beat:visualBeats) {
                requireObject(beat,"visual beat",Set.of("beatId","cueAnchor","direction","assets"));
                String beatId=text(beat,"beatId",1,50);
                if(!beatIds.add(beatId)) bad("Duplicate beatId in "+key+".");
                String cue=text(beat,"cueAnchor",1,400);
                text(beat,"direction",10,3000);
                optionalStringArray(beat,"assets",80,80);
                if(!normalize(narration).contains(normalize(cue)))
                    bad("A HEAR → SEE cue must occur literally in its SHOT narration: "+key+".");
                beats++;
            }
        }
        if (Math.abs(editorialTotal-number(episode,"targetDurationSeconds",60,3600))>30)
            bad("Episode target duration must agree with SHOT editorial durations within 30 seconds.");

        JsonNode shorts=array(doc,"shortsCandidates",3,12);
        for(JsonNode item:shorts) {
            requireObject(item,"Shorts candidate",Set.of("title","shotKeys","hook"));
            text(item,"title",4,160);
            text(item,"hook",10,500);
            JsonNode refs=array(item,"shotKeys",1,10);
            Set<String> unique=new HashSet<>();
            for(JsonNode ref:refs) {
                if(!ref.isTextual() || !knownShotKeys.contains(ref.asText())
                        || !unique.add(ref.asText())) bad("Shorts references must name unique existing SHOTs.");
            }
        }
        return new Validated(doc,episodeKey,title,sha,shots.size(),beats);
    }

    public static String sha256(String content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 provider unavailable.",error);
        }
    }

    private static String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("\\s+"," ").trim();
    }

    private static void requireObject(JsonNode node,String label,Set<String> allowed) {
        if (node==null || !node.isObject()) bad(label+" must be an object.");
        node.fieldNames().forEachRemaining(name -> {
            if (!allowed.contains(name)) bad("Unknown "+label+" field: "+name+".");
        });
    }

    private static JsonNode object(JsonNode parent,String field,Set<String> allowed) {
        JsonNode value=parent.path(field);
        requireObject(value,field,allowed);
        return value;
    }

    private static String text(JsonNode node,String field,int min,int max) {
        JsonNode value=node.path(field);
        if (!value.isTextual()) bad(field+" must be text.");
        String s=value.asText();
        if (s.trim().length()<min || s.length()>max)
            bad(field+" must be "+min+"–"+max+" characters.");
        return s;
    }

    private static void optionalText(JsonNode node,String field,int min,int max) {
        if(node.has(field)) text(node,field,min,max);
    }

    private static int number(JsonNode node,String field,int min,int max) {
        JsonNode v=node.path(field);
        if(!v.isInt() || v.asInt()<min || v.asInt()>max)
            bad(field+" must be an integer between "+min+" and "+max+".");
        return v.asInt();
    }

    private static void optionalBoolean(JsonNode node,String field) {
        if(node.has(field) && !node.path(field).isBoolean())
            bad(field+" must be true or false.");
    }

    private static JsonNode array(JsonNode node,String field,int min,int max) {
        JsonNode v=node.path(field);
        if(!v.isArray() || v.size()<min || v.size()>max)
            bad(field+" must have "+min+"–"+max+" items.");
        return v;
    }

    private static void optionalStringArray(JsonNode node,String field,int maxCount,int maxLen) {
        if(!node.has(field)) return;
        JsonNode values=array(node,field,0,maxCount);
        Set<String> seen=new HashSet<>();
        for(JsonNode value:values) {
            if(!value.isTextual() || value.asText().isBlank()
                    || value.asText().length()>maxLen || !seen.add(value.asText()))
                bad(field+" must contain unique, nonempty text labels.");
        }
    }

    private static void bad(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);
    }
}
