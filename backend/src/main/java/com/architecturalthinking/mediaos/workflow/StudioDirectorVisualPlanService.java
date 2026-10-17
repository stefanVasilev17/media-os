package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Deterministic, zero-LLM-cost visual compiler. Only executes a registered cinematic recipe.
 * Never edits canonical Director video, original voices, or the original source map.
 */
@Service
public class StudioDirectorVisualPlanService {
    private static final int FPS=30;
    private static final int[] GATEWAY_CLIP_SECONDS={17,21,20,23,20,18,11};
    private static final String[] ANCHORS={
        "API_GATEWAY","ROUTING","METHOD","RATE_LIMIT","WAF","SCHEMA","REQUEST_ALLOWED"
    };
    private static final String[] EVENT_KINDS={
        "GATEWAY_ARRIVAL","ROUTE_404","METHOD_405","RATE_LIMIT_429",
        "WAF_403","SCHEMA_400","LOAD_BALANCER_HANDOFF"
    };
    private static final String[] AUDIO_TERMS={
        "API Gateway","404","405","429","403","400","passes"
    };
    private static final String[] SPOKEN_CONCEPT_TERMS={
        "API Gateway","routing","HTTP method","rate limiting","WAF","schema validation","passes"
    };
    private static final String[] LABELS={
        "First server-side checkpoint",
        "POST /api/v2/login → 404; gateway route /api/v1/login",
        "GET /api/v1/login → 405; POST is expected",
        "Repeated login retries → 429 Too Many Requests",
        "WAF false-positive rule → 403 Forbidden",
        "userEmail instead of email → 400 Bad Request",
        "Canonical green POST /api/v1/login passes → Load Balancer"
    };
    private static final UUID EPISODE=ProductionOverviewService.EPISODE_ID;
    private final JdbcClient jdbc;
    private final ObjectMapper json;

    public StudioDirectorVisualPlanService(JdbcClient jdbc,ObjectMapper json){
        this.jdbc=jdbc;
        this.json=json;
    }

    public record Compilation(Map<String,Object> plan,String voiceSignature){}

    private record VoiceRow(
        UUID id,int sequence,String narration,int scriptRevision,int generationRevision,
        boolean approved,boolean generated,String alignmentJson
    ) {}

    public Compilation compile(UUID shotId,Map<String,Object> shot){
        if(!"SHOT 05".equals(shot.get("sourceShotKey")))
            throw conflict("A voice-synchronized cinematic recipe is available for original SHOT 05 only. Other shots require a reviewed recipe; the template renderer remains separate.");
        String directorNotes=String.valueOf(shot.getOrDefault("visualPrompt","")).trim();
        if(directorNotes.isBlank())
            directorNotes="Built-in Director Gateway recipe: show real 404/405/429/403/400 examples in narration order; keep the current Living Architecture Map and reveal each result on the spoken status code.";
        List<VoiceRow> rows=voices(shotId);
        if(rows.size()!=7)throw conflict("API Gateway Director plan requires exactly seven original voice blocks.");
        for(int i=0;i<rows.size();i++){
            VoiceRow voice=rows.get(i);
            if(voice.sequence()!=i+1 || !voice.approved() || !voice.generated())
                throw conflict("Every C01–C07 voice clip must be explicitly Director-approved before planning.");
        }
        String signature=signature(rows);
        List<Map<String,Object>> sections=new ArrayList<>();
        List<Map<String,Object>> audio=new ArrayList<>();
        List<Map<String,Object>> events=new ArrayList<>();
        Map<String,Double> anchors=new LinkedHashMap<>();
        int offset=0;
        for(int i=0;i<rows.size();i++){
            VoiceRow voice=rows.get(i);
            int from=offset;
            int voiceStart=from+(i==0?38:0);
            JsonNode alignment=parse(voice.alignmentJson());
            double audioEnd=audioEnd(alignment);
            if(audioEnd<=0d || !Double.isFinite(audioEnd))
                throw conflict("Missing timestamp alignment in C0"+(i+1)+". Cannot synchronize its visuals to voice.");
            int audioDuration=(int)Math.ceil((audioEnd+.18)*FPS);
            int sectionDuration=Math.max(GATEWAY_CLIP_SECONDS[i]*FPS,
                (voiceStart-from)+audioDuration+12);
            int limit=from+sectionDuration;
            int anchorLocal=termFrame(alignment,AUDIO_TERMS[i]);
            if(anchorLocal<0)
                throw conflict("Spoken anchor '"+AUDIO_TERMS[i]+"' is missing from voice C0"+(i+1)+
                    ". The system will not guess when an object or failure should appear.");
            int eventFrame=voiceStart+anchorLocal;
            if(eventFrame<from||eventFrame>=limit)
                throw conflict("Spoken event C0"+(i+1)+" falls outside its approved timeline.");
            String key=String.format(Locale.ROOT,"SHOT 05-C%02d",i+1);
            Map<String,Object> section=new LinkedHashMap<>();
            section.put("clipKey",key);section.put("startFrame",from);section.put("endFrame",limit);
            section.put("voiceStartFrame",voiceStart);section.put("voiceEndFrame",voiceStart+audioDuration);
            section.put("scriptRevision",voice.scriptRevision());
            section.put("generationRevision",voice.generationRevision());
            sections.add(section);
            Map<String,Object> source=new LinkedHashMap<>();
            source.put("clipId",voice.id().toString());
            source.put("fromFrame",voiceStart);source.put("durationInFrames",audioDuration);
            source.put("generationRevision",voice.generationRevision());
            audio.add(source);
            Map<String,Object> event=new LinkedHashMap<>();
            event.put("clipKey",key);event.put("kind",EVENT_KINDS[i]);
            event.put("frame",eventFrame);event.put("spokenTrigger",AUDIO_TERMS[i]);
            event.put("visualExample",LABELS[i]);event.put("target",i==6?"Load Balancer":"API Gateway");
            event.put("derivedFromVoiceAlignment",true);
            events.add(event);
            int conceptFrame=termFrame(alignment,SPOKEN_CONCEPT_TERMS[i]);
            int conceptAt=conceptFrame>=0?voiceStart+conceptFrame:eventFrame;
            if(conceptAt<from||conceptAt>=limit)conceptAt=eventFrame;
            anchors.put(ANCHORS[i],Math.round(conceptAt*1000d/FPS)/1000d);
            offset=limit;
        }
        if(offset>180*FPS||offset<130*FPS||sections.size()!=7||events.size()!=7)
            throw conflict("The SHOT 05 storyboard is outside its supported 130–180 second voice-synchronized envelope.");
        Map<String,Object> plan=new LinkedHashMap<>();
        plan.put("schemaVersion",1);
        plan.put("recipeId","EP001_GATEWAY_DIAGNOSTICS_V1");
        plan.put("shotKey","SHOT 05");
        plan.put("fps",FPS);
        plan.put("durationInFrames",offset);
        plan.put("originalVideoPreserved",true);
        plan.put("livingMapSource","EP001_CURRENT_WORLD");
        plan.put("voiceSignature",signature);
        plan.put("directorNotes",directorNotes);
        plan.put("sections",sections);
        plan.put("events",events);
        plan.put("anchors",anchors);
        plan.put("audioSources",audio);
        validatePlan(plan);
        return new Compilation(plan,signature);
    }

    public String currentSignature(UUID id){return signature(voices(id));}

    private List<VoiceRow> voices(UUID shotId){
        return jdbc.sql("""
                select c.id,c.sequence,c.narration,c.script_revision,c.generation_revision,
                       c.approved_at is not null as approved,c.generated_audio is not null as generated,
                       c.generated_alignment::text as alignment
                from studio_clip c join studio_shot s on c.shot_id=s.id
                where s.id=:id and s.episode_id=:episode order by c.sequence
                """).param("id",shotId).param("episode",EPISODE)
                .query((rs,n)->new VoiceRow(rs.getObject("id",UUID.class),
                    rs.getInt("sequence"),rs.getString("narration"),
                    rs.getInt("script_revision"),rs.getInt("generation_revision"),
                    rs.getBoolean("approved"),rs.getBoolean("generated"),
                    rs.getString("alignment"))).list();
    }

    static int termFrame(JsonNode root,String text){
        JsonNode normalized=root.path("normalized_alignment");
        JsonNode section=hasCharacters(normalized)?normalized:root.path("alignment");
        JsonNode chars=section.path("characters");
        JsonNode starts=section.path("character_start_times_seconds");
        if(!chars.isArray()||!starts.isArray()||chars.size()!=starts.size())return -1;
        StringBuilder value=new StringBuilder();
        for(JsonNode ch:chars)value.append(ch.asText());
        String spoken=value.toString().toLowerCase(Locale.ROOT);
        int pos=spoken.indexOf(text.toLowerCase(Locale.ROOT));
        if(pos<0)return -1;
        double seconds=starts.get(pos).asDouble(-1);
        return Double.isFinite(seconds)&&seconds>=0?Math.round((float)(seconds*FPS)):-1;
    }
    private static boolean hasCharacters(JsonNode n){
        return n.path("characters").isArray()&&n.path("character_start_times_seconds").isArray();
    }
    static double audioEnd(JsonNode root){
        JsonNode norm=root.path("normalized_alignment");
        JsonNode section=hasCharacters(norm)?norm:root.path("alignment");
        JsonNode values=section.path("character_end_times_seconds");
        if(!values.isArray())return 0;
        double max=0;
        for(JsonNode n:values)if(n.isNumber())max=Math.max(max,n.asDouble());
        return max;
    }
    private JsonNode parse(String value){
        if(value==null||value.isBlank())throw conflict("Voice alignment is missing.");
        try{return json.readTree(value);}
        catch(Exception ex){throw conflict("Voice alignment is not valid JSON.");}
    }

    static void validatePlan(Map<String,Object> plan){
        if(!"EP001_GATEWAY_DIAGNOSTICS_V1".equals(plan.get("recipeId")))
            throw conflict("Unsupported or modified Director recipe.");
        int total=((Number)plan.get("durationInFrames")).intValue();
        if(total<3900||total>5400)throw conflict("Invalid director preview duration.");
        @SuppressWarnings("unchecked")
        List<Map<String,Object>> sections=(List<Map<String,Object>>)plan.get("sections");
        @SuppressWarnings("unchecked")
        List<Map<String,Object>> events=(List<Map<String,Object>>)plan.get("events");
        if(sections==null||events==null||sections.size()!=7||events.size()!=7)
            throw conflict("Director visual plan must contain all seven independently timed sections and events.");
        int end=0;
        for(int i=0;i<7;i++){
            Map<String,Object> section=sections.get(i),event=events.get(i);
            int start=((Number)section.get("startFrame")).intValue();
            int sectionEnd=((Number)section.get("endFrame")).intValue();
            int at=((Number)event.get("frame")).intValue();
            if(start!=end||sectionEnd-start<GATEWAY_CLIP_SECONDS[i]*FPS ||
                at<start||at>=sectionEnd ||
                !EVENT_KINDS[i].equals(event.get("kind"))||
                !section.get("clipKey").equals(event.get("clipKey")))
                throw conflict("Invalid event ordering, clip correspondence or frame boundaries in Director plan.");
            end=sectionEnd;
        }
        if(end!=total)throw conflict("Storyboard end frame does not match approved voice-driven duration.");
    }

    private static String signature(List<VoiceRow> voices){
        try{
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            for(VoiceRow v:voices){
                String value=v.id()+"|"+v.sequence()+"|"+v.scriptRevision()+"|"+
                    v.generationRevision()+"|"+v.approved()+"|"+v.generated()+"|"+
                    v.narration()+"|"+v.alignmentJson()+"\n";
                digest.update(value.getBytes(StandardCharsets.UTF_8));
            }
            return HexFormat.of().formatHex(digest.digest());
        }catch(Exception e){throw new IllegalStateException("Could not compute voice signature.",e);}
    }
    private static ResponseStatusException conflict(String reason){
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
