package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public final class Ep004Shot01DirectorRenderService {
    public static final String COMPOSITION="EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL";
    public static final String SOURCE_SHA="a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365";
    public static final int FPS=30;
    public static final int BREATH_FRAMES=60;
    public static final List<String> BEAT_IDS=List.of(
            "SHOT01_P01_B01","SHOT01_P01_B02","SHOT01_P01_B03",
            "SHOT01_P02_B01","SHOT01_P02_B02","SHOT01_P02_B03",
            "SHOT01_P03_B01","SHOT01_P03_B02");

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RemotionRenderController renders;
    private final MediaObjectStore storage;

    public Ep004Shot01DirectorRenderService(JdbcClient jdbc,ObjectMapper mapper,
            RemotionRenderController renders,MediaObjectStore storage){
        this.jdbc=jdbc;this.mapper=mapper;this.renders=renders;this.storage=storage;
    }

    public record CpuRequest(UUID requestId,String expectedNarrationSha256,
            String expectedSourceCommit,UUID expectedVoiceTakeId,
            int maximumFrames,Boolean confirmCpuRender) {}

    public record Readiness(boolean ready,String episodeKey,String shotKey,
            String selectedTakeId,String narrationSha256,
            String sourceSha256,int durationInFrames,
            Map<String,Integer> cueFrames,String expectedSourceCommit,
            List<String> blockers,String nextAction) {}

    record Selected(String sourceSha,String storyJson,int revision,String narration,
                    UUID takeId,String delivery,String alignmentJson,
                    BigDecimal duration,String objectKey) {}

    private Selected selected(UUID packageId){
        DirectorIdentity.Actor director=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select p.source_sha256,s.original_visual_story::text as story,
                       r.revision,r.narration,t.id as take_id,
                       t.generated_alignment->>'mediaos_delivery_mode' as delivery,
                       t.generated_alignment::text as alignment,
                       t.duration_seconds,t.audio_object_key
                  from episode_package_import p
                  join episode_package_shot s on s.package_id=p.id
                    and s.shot_key='SHOT01'
                  join lateral(
                    select revision,narration
                      from episode_package_shot_revision
                     where shot_id=s.id order by revision desc limit 1
                  ) r on true
                  join lateral(
                    select take_id from episode_package_voice_choice
                     where shot_id=s.id and revision=r.revision
                     order by selected_at desc,id desc limit 1
                  ) choice on true
                  join episode_package_voice_take t
                    on t.id=choice.take_id and t.shot_id=s.id
                   and t.revision=r.revision
                 where p.id=:packageId and p.episode_key='EP004'
                   and p.director_issuer=:issuer and p.director_subject=:subject
                """)
                .param("packageId",packageId).param("issuer",director.issuer())
                .param("subject",director.subject())
                .query((rs,row)->new Selected(rs.getString("source_sha256"),
                        rs.getString("story"),rs.getInt("revision"),
                        rs.getString("narration"),
                        rs.getObject("take_id",UUID.class),
                        rs.getString("delivery"),rs.getString("alignment"),
                        rs.getBigDecimal("duration_seconds"),rs.getString("audio_object_key")))
                .optional().orElse(null);
    }

    public Readiness readiness(UUID packageId,String sourceCommit) {
        Selected value=selected(packageId);
        List<String> blockers=new ArrayList<>();
        if(value==null) {
            return new Readiness(false,"EP004","SHOT01",null,null,SOURCE_SHA,0,
                    Map.of(),sourceCommit,List.of("DIRECTOR_APPROVED_CURRENT_TAKE_MISSING"),
                    "Approve a current-revision SHOT01 Take in Voice Studio first.");
        }
        if(!SOURCE_SHA.equals(value.sourceSha()))blockers.add("EP004_ORIGINAL_SOURCE_SHA_MISMATCH");
        if(!"SLOW_NATURAL".equals(value.delivery()))
            blockers.add("SELECTED_TAKE_IS_NOT_SLOW_NATURAL");
        if(value.duration()==null || value.duration().signum()<=0)
            blockers.add("MEASURED_TAKE_DURATION_MISSING");
        if(value.objectKey()==null || !value.objectKey().startsWith(MediaObjectStore.VOICE_PREFIX))
            blockers.add("APPROVED_TAKE_PRIVATE_S3_MANIFEST_MISSING");
        if(!storage.writable())blockers.add("P0_PRIVATE_VIDEO_STORAGE_NOT_WRITABLE");

        int frames=value.duration()==null?0:
                BREATH_FRAMES+(int)Math.ceil(value.duration().doubleValue()*FPS)+45;
        if(frames<600 || frames>9000)
            blockers.add("MEASURED_DURATION_EXCEEDS_EP004_SHOT01_BOUND");
        Map<String,Integer> cues=Map.of();
        try {
            cues=actualCueFrames(mapper.readTree(value.storyJson()),
                    mapper.readTree(value.alignmentJson()),frames);
        }catch(Exception missing){
            blockers.add("REAL_PROVIDER_HEAR_SEE_CUES_NOT_VERIFIED: "+missing.getMessage());
        }

        if(sourceCommit==null || !sourceCommit.matches("[a-f0-9]{40}")) {
            blockers.add("SHARED_WORKER_SOURCE_SHA_REQUIRED");
        }else{
            boolean workerReady=jdbc.sql("""
                    select exists(select 1 from episode_factory_worker_capability
                      where source_commit=:sha and build_checked=true
                        and last_heartbeat_at>now()-interval '120 seconds'
                        and bundled_scenes::text like '%EP004-SHOT01%')
                    """).param("sha",sourceCommit).query(Boolean.class).single();
            if(!workerReady)blockers.add("MATCHING_EP004_SCENE_NOT_PROVED_BY_SHARED_WORKER");
        }
        return new Readiness(blockers.isEmpty(),"EP004","SHOT01",
                value.takeId().toString(),EpisodePackageValidator.sha256(value.narration()),
                SOURCE_SHA,frames,cues,sourceCommit,List.copyOf(blockers),
                blockers.isEmpty()?
                        "An explicit audited Director CPU approval can queue one SHOT01 REVIEW render.":
                        "Resolve blockers before requesting CPU. No automatic paid render.");
    }

    public Map<String,Object> queue(UUID packageId,CpuRequest request,UUID auditId){
        DirectorIdentity.requireDirector();
        if(auditId==null||request==null||request.requestId()==null
                ||!Boolean.TRUE.equals(request.confirmCpuRender())
                ||request.maximumFrames()<600 || request.maximumFrames()>9000
                ||request.expectedVoiceTakeId()==null
                ||request.expectedNarrationSha256()==null
                ||!request.expectedNarrationSha256().matches("[a-f0-9]{64}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited, unique, explicitly approved Director CPU frame budget required.");
        Readiness ready=readiness(packageId,request.expectedSourceCommit());
        if(!ready.ready()||ready.durationInFrames()>request.maximumFrames()
                ||!Objects.equals(ready.selectedTakeId(),request.expectedVoiceTakeId().toString())
                ||!Objects.equals(ready.narrationSha256(),request.expectedNarrationSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Selected Director Take, original source, real cues, or CPU cap changed: "+
                    String.join(";",ready.blockers()));

        boolean alreadyQueued=jdbc.sql("""
                select exists(select 1 from remotion_render
                  where composition_id=:composition
                    and project_id='11111111-1111-1111-1111-111111111111'::uuid
                    and input_props->>'voiceTakeId'=:take
                    and input_props->>'narrationSha256'=:narrationSha
                    and status in ('QUEUED','RUNNING','SUCCEEDED'))
                """).param("composition",COMPOSITION)
                .param("take",ready.selectedTakeId())
                .param("narrationSha",ready.narrationSha256())
                .query(Boolean.class).single();
        if(alreadyQueued)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An EP004 SHOT01 job already exists for this approved Take. Inspect it; no duplicate CPU spend.");

        Map<String,Object> props=new LinkedHashMap<>();
        props.put("durationInFrames",ready.durationInFrames());
        props.put("sourceSha256",SOURCE_SHA);
        props.put("worldStartFrame",0);
        props.put("previewOnly",false);
        props.put("voiceTakeId",ready.selectedTakeId());
        props.put("scriptRevision",selected(packageId).revision());
        props.put("narrationSha256",ready.narrationSha256());
        props.put("cueFrames",ready.cueFrames());
        props.put("expectedSourceCommit",request.expectedSourceCommit());
        props.put("packageId",packageId.toString());
        props.put("directorCpuApproved",true);
        props.put("renderRequestId",request.requestId().toString());
        return renders.ensureVerifiedEp004Shot01Preview(props);
    }

    static Map<String,Integer> actualCueFrames(JsonNode story,JsonNode alignment,int durationFrames) {
        if(story==null||alignment==null||durationFrames<600)
            throw new IllegalArgumentException("Missing source or provider alignment.");
        JsonNode beats=story.path("visualBeats");
        if(!beats.isArray()||beats.size()!=8)
            throw new IllegalArgumentException("Locked SHOT01 must contain exactly eight beats.");
        for(String field:List.of("alignment","normalized_alignment")){
            JsonNode blob=alignment.path(field);
            if(!blob.isObject())continue;
            try{return locateAll(beats,blob,durationFrames);}
            catch(IllegalArgumentException ignored){ }
        }
        throw new IllegalArgumentException("The eight approved cue phrases do not all occur in real provider alignment.");
    }

    private static Map<String,Integer> locateAll(JsonNode beats,JsonNode aligned,int durationFrames){
        JsonNode chars=aligned.path("characters"),starts=aligned.path("character_start_times_seconds"),
                ends=aligned.path("character_end_times_seconds");
        if(!chars.isArray()||!starts.isArray()||!ends.isArray()||chars.size()<50
                ||chars.size()!=starts.size()||chars.size()!=ends.size())
            throw new IllegalArgumentException("Provider character/time vector is incomplete.");
        StringBuilder normalized=new StringBuilder();
        List<Integer> originalIndices=new ArrayList<>();
        double previous=-1;
        for(int i=0;i<chars.size();i++){
            if(!starts.get(i).isNumber()||!ends.get(i).isNumber())
                throw new IllegalArgumentException("Non-numeric provider time.");
            double first=starts.get(i).asDouble(),last=ends.get(i).asDouble();
            if(first<0||first<previous||last<first)
                throw new IllegalArgumentException("Provider time vector is unordered.");
            previous=first;
            String value=chars.get(i).asText();
            String lower=Normalizer.normalize(value,Normalizer.Form.NFKC)
                    .toLowerCase(java.util.Locale.ROOT);
            for(int at=0;at<lower.length();at++){
                char c=lower.charAt(at);
                if(Character.isLetterOrDigit(c)){
                    normalized.append(c);
                    originalIndices.add(i);
                }
            }
        }
        Map<String,Integer> frames=new LinkedHashMap<>();
        int prior=BREATH_FRAMES-1,searchFrom=0;
        for(int b=0;b<BEAT_IDS.size();b++){
            JsonNode beat=beats.get(b);
            String key=beat.path("beatId").asText();
            if(!BEAT_IDS.get(b).equals(key))
                throw new IllegalArgumentException("A locked EP004 beat ID/order changed.");
            String needle=normalize(beat.path("cueAnchor").asText());
            if(needle.length()<18)
                throw new IllegalArgumentException("Cue phrase is too short for verified alignment.");
            int hit=normalized.indexOf(needle,searchFrom);
            if(hit<0)throw new IllegalArgumentException("Cue phrase not found: "+key);
            int characterIndex=originalIndices.get(hit);
            int frame=BREATH_FRAMES+(int)Math.round(starts.get(characterIndex).asDouble()*FPS);
            if(frame<=prior||frame>=durationFrames-15)
                throw new IllegalArgumentException("Voice cue order or available frames invalid: "+key);
            frames.put(key,frame);
            searchFrom=hit+needle.length();
            prior=frame;
        }
        return Map.copyOf(frames);
    }

    private static String normalize(String text){
        if(text==null)return "";
        String normalized=Normalizer.normalize(text,Normalizer.Form.NFKC)
                .toLowerCase(java.util.Locale.ROOT);
        return normalized.replaceAll("[^\\p{L}\\p{N}]","");
    }
}
