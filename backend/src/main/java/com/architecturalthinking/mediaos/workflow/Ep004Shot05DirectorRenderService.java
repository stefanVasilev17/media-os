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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public final class Ep004Shot05DirectorRenderService {
    public static final String COMPOSITION="EP004-SHOT05-CONTINUOUS-GATEWAYS-V1-VISUAL";
    public static final String SOURCE_SHA=Ep004Shot01DirectorRenderService.SOURCE_SHA;
    public static final int FPS=30;
    public static final int BREATH_FRAMES=72;
    public static final int TAIL_FRAMES=45;
    public static final int SOURCE_WORLD_START=6356;

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RemotionRenderController renders;
    private final MediaObjectStore storage;
    private final EpisodePackageVoiceReadinessService voices;

    public Ep004Shot05DirectorRenderService(JdbcClient jdbc,ObjectMapper mapper,
            RemotionRenderController renders,MediaObjectStore storage,
            EpisodePackageVoiceReadinessService voices) {
        this.jdbc=jdbc;this.mapper=mapper;this.renders=renders;
        this.storage=storage;this.voices=voices;
    }

    public record CpuRequest(UUID requestId,String expectedNarrationSha256,
            String expectedSourceCommit,UUID expectedVoiceTakeId,
            int maximumFrames,Boolean confirmCpuRender) {}
    public record Readiness(boolean ready,String episodeKey,String shotKey,
            String selectedTakeId,String narrationSha256,String sourceSha256,
            int durationInFrames,Map<String,Integer> cueFrames,
            List<Map<String,Object>> verifiedCues,String expectedSourceCommit,
            String previousVideoSha256,List<String> blockers,String nextAction) {}
    record Selected(String title,String storyJson,int revision,String narration,
            UUID takeId,String audioKey,BigDecimal measuredDuration) {}
    record Previous(UUID renderId,String objectKey,String sha256,long bytes,
            int frames,String sourceCommit,int worldStartFrame) {}

    private Selected selected(UUID packageId) {
        var director=DirectorIdentity.requireDirector();
        return jdbc.sql("""
              select s.title,s.original_visual_story::text as story,
                     rev.revision,rev.narration,t.id as take_id,
                     t.audio_object_key,t.duration_seconds
                from episode_package_import p
                join episode_package_shot s on s.package_id=p.id
                   and s.shot_key='SHOT05'
                join lateral(select revision,narration from episode_package_shot_revision
                       where shot_id=s.id order by revision desc limit 1) rev on true
                join lateral(select take_id from episode_package_voice_choice
                       where shot_id=s.id and revision=rev.revision
                       order by selected_at desc,id desc limit 1) choice on true
                join episode_package_voice_take t on t.id=choice.take_id
                   and t.shot_id=s.id and t.revision=rev.revision
               where p.id=:package and p.episode_key='EP004'
                 and p.director_issuer=:issuer and p.director_subject=:subject
              """).param("package",packageId).param("issuer",director.issuer())
              .param("subject",director.subject())
              .query((rs,n)->new Selected(rs.getString("title"),rs.getString("story"),
                  rs.getInt("revision"),rs.getString("narration"),
                  rs.getObject("take_id",UUID.class),rs.getString("audio_object_key"),
                  rs.getBigDecimal("duration_seconds")))
              .optional().orElse(null);
    }

    private Previous lockedShot04(UUID packageId) {
        return jdbc.sql("""
              select r.id,r.video_object_key,r.video_sha256,
                     r.video_object_bytes,r.duration_in_frames,
                     r.input_props->>'expectedSourceCommit' as source_commit,
                     (r.input_props->>'worldStartFrame')::integer as world_start
                from episode_director_shot_lock l
                join remotion_render r on r.id=l.render_id
               where l.package_id=:package and l.shot_key='SHOT04'
                 and r.project_id='11111111-1111-1111-1111-111111111111'::uuid
                 and r.composition_id=:previous and r.profile='REVIEW'
                 and r.status='SUCCEEDED' and r.width=1920 and r.height=1080
                 and r.fps=30 and r.duration_in_frames between 600 and 9000
                 and r.input_props->>'packageId'=:packageText
                 and r.input_props->>'episodeKey'='EP004'
                 and r.input_props->>'shotKey'='SHOT04'
                 and r.input_props->>'sourceSha256'=:source
                 and r.input_props->>'previewOnly'='false'
                 and r.input_props->>'directorCpuApproved'='true'
                 and r.input_props->>'worldStartFrame'='6356'
                 and r.video_sha256 ~ '^[a-f0-9]{64}$'
                 and r.video_object_bytes between 1024 and 268435456
                 and r.video_object_key is not null
               limit 1
              """).param("package",packageId).param("packageText",packageId.toString())
              .param("previous",Ep004Shot04DirectorRenderService.COMPOSITION)
              .param("source",SOURCE_SHA)
              .query((rs,n)->new Previous(rs.getObject("id",UUID.class),
                  rs.getString("video_object_key"),rs.getString("video_sha256"),
                  rs.getLong("video_object_bytes"),rs.getInt("duration_in_frames"),
                  rs.getString("source_commit"),rs.getInt("world_start")))
              .optional().orElse(null);
    }

    public Readiness readiness(UUID packageId,String sourceCommit) {
        var overall=voices.report(packageId);
        if(!"EP004".equals(overall.episodeKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A Director-owned EP004 package is required.");
        var shot=overall.shots().stream().filter(s->"SHOT05".equals(s.shotKey()))
                .findFirst().orElse(null);
        if(sourceCommit==null||sourceCommit.isBlank())
            sourceCommit=jdbc.sql("""
                 select source_commit from episode_factory_worker_capability
                  where build_checked=true
                    and last_heartbeat_at>now()-interval '120 seconds'
                    and bundled_scenes::text like '%EP004-SHOT05%'
                  order by last_heartbeat_at desc limit 1
                 """).query(String.class).optional().orElse("");
        var current=selected(packageId);
        var previous=lockedShot04(packageId);
        List<String> blockers=new ArrayList<>();
        if(!SOURCE_SHA.equals(overall.sourceSha256()))
            blockers.add("EP004_ORIGINAL_SOURCE_CHANGED");
        if(shot==null||!"VOICE_READY".equals(shot.status()))
            blockers.add("SHOT05_DIRECTOR_APPROVED_ORIGINAL_VOICE_CUES_MISSING");
        if(current==null)
            blockers.add("SHOT05_DIRECTOR_SELECTED_CURRENT_TAKE_MISSING");
        else if(current.audioKey()==null
                ||!current.audioKey().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT05/"))
            blockers.add("SHOT05_PRIVATE_APPROVED_TAKE_NOT_VERIFIED");
        if(previous==null||previous.sourceCommit()==null
                ||!previous.sourceCommit().matches("[a-f0-9]{40}")
                ||previous.worldStartFrame()!=SOURCE_WORLD_START)
            blockers.add("SHOT04_PREVIOUS_DIRECTOR_LOCKED_MP4_REQUIRED");
        else try {
            storage.verifyVideoManifest(previous.objectKey(),
                    previous.sha256(),previous.bytes());
        }catch(Exception invalid) {
            blockers.add("SHOT04_LOCKED_MP4_SHA256_OR_STORAGE_CHANGED");
        }
        if(!storage.writable())blockers.add("PRIVATE_MP4_STORAGE_NOT_WRITABLE");
        int frames=shot==null||shot.measuredDurationSeconds()==null?0:
            BREATH_FRAMES+(int)Math.ceil(shot.measuredDurationSeconds().doubleValue()*FPS)
            +TAIL_FRAMES;
        if(frames<600||frames>9000)
            blockers.add("SHOT05_AUDIO_DURATION_OUTSIDE_BOUNDED_RENDER");
        if(sourceCommit==null||!sourceCommit.matches("[a-f0-9]{40}"))
            blockers.add("MATCHING_SHOT05_WORKER_SOURCE_COMMIT_REQUIRED");
        else {
            boolean compiled=jdbc.sql("""
                 select exists(select 1 from episode_factory_worker_capability
                   where source_commit=:sha and build_checked=true
                     and last_heartbeat_at>now()-interval '120 seconds'
                     and bundled_scenes::text like '%EP004-SHOT05%')
                 """).param("sha",sourceCommit).query(Boolean.class).single();
            if(!compiled)blockers.add("SHOT05_RENDER_SCENE_NOT_COMPILED_ON_LIVE_WORKER");
        }
        Map<String,Integer> cueFrames=new LinkedHashMap<>();
        List<Map<String,Object>> verified=new ArrayList<>();
        if(shot!=null&&"VOICE_READY".equals(shot.status())){
            int previousStart=BREATH_FRAMES-1;
            for(var cue:shot.verifiedCues()){
                int start=BREATH_FRAMES+(int)Math.round(cue.startSeconds()*FPS);
                int end=BREATH_FRAMES+(int)Math.round(cue.endSeconds()*FPS);
                if(start<=previousStart||end<start
                        ||end>frames-TAIL_FRAMES+8
                        ||cue.beatId()==null
                        ||!cue.beatId().matches("SHOT05_[A-Z0-9_]{3,45}")){
                    blockers.add("SHOT05_ALIGNED_CUE_FRAME_OUTSIDE_REAL_AUDIO");
                    break;
                }
                cueFrames.put(cue.beatId(),start);
                verified.add(Map.of("beatId",cue.beatId(),
                    "anchor",cue.cueAnchor(),"startFrame",start,"endFrame",end));
                previousStart=start;
            }
            if(verified.size()<2||verified.size()>40)
                blockers.add("SHOT05_ORIGINAL_VISUAL_CUES_REQUIRED");
        }
        if(current!=null){
            try{
                JsonNode beats=mapper.readTree(current.storyJson()).path("visualBeats");
                if(!beats.isArray()||beats.size()!=verified.size())
                    blockers.add("SHOT05_ORIGINAL_STORY_BEAT_COUNT_MISMATCH");
                else for(int i=0;i<beats.size();i++)
                    if(!Objects.equals(beats.get(i).path("beatId").asText(),
                                          verified.get(i).get("beatId"))
                       ||!Objects.equals(beats.get(i).path("cueAnchor").asText(),
                                          verified.get(i).get("anchor")))
                        blockers.add("SHOT05_ORIGINAL_STORY_CUE_MISMATCH_"+i);
            }catch(Exception invalid){blockers.add("SHOT05_ORIGINAL_STORY_UNREADABLE");}
        }
        return new Readiness(blockers.isEmpty(),"EP004","SHOT05",
                shot==null?null:shot.selectedTakeId(),
                current==null?null:EpisodePackageValidator.sha256(current.narration()),
                overall.sourceSha256(),frames,Map.copyOf(cueFrames),List.copyOf(verified),
                sourceCommit,previous==null?null:previous.sha256(),
                List.copyOf(blockers),blockers.isEmpty()
                    ?"SHOT05 ready for one explicit Director-approved render. Voice starts after 72 frames; SHOT04 seam is verified."
                    :"Verify current approved Take, original cues, locked SHOT04 and compiled worker before any CPU spend.");
    }

    public Map<String,Object> queue(UUID packageId,CpuRequest request,UUID auditId) {
        DirectorIdentity.requireDirector();
        if(auditId==null||request==null||request.requestId()==null
                ||!Boolean.TRUE.equals(request.confirmCpuRender())
                ||request.maximumFrames()<600||request.maximumFrames()>9000
                ||request.expectedVoiceTakeId()==null
                ||request.expectedNarrationSha256()==null
                ||!request.expectedNarrationSha256().matches("[a-f0-9]{64}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Audited explicit SHOT05 CPU approval is required.");
        Readiness ready=readiness(packageId,request.expectedSourceCommit());
        Selected selected=selected(packageId);
        if(!ready.ready()||ready.durationInFrames()>request.maximumFrames()
                ||selected==null||selected.revision()<1
                ||!Objects.equals(ready.selectedTakeId(),
                                 request.expectedVoiceTakeId().toString())
                ||!Objects.equals(ready.narrationSha256(),request.expectedNarrationSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT05 approved Take, source, exact cues or measured duration changed: "
                +String.join(";",ready.blockers()));
        boolean exists=jdbc.sql("""
              select exists(select 1 from remotion_render
                where composition_id=:composition
                  and project_id='11111111-1111-1111-1111-111111111111'::uuid
                  and input_props->>'packageId'=:package
                  and input_props->>'voiceTakeId'=:take
                  and input_props->>'narrationSha256'=:narration
                  and input_props->>'expectedSourceCommit'=:commit
                  and status in ('QUEUED','RUNNING','SUCCEEDED'))
              """).param("composition",COMPOSITION).param("package",packageId.toString())
              .param("take",ready.selectedTakeId())
              .param("narration",ready.narrationSha256())
              .param("commit",request.expectedSourceCommit())
              .query(Boolean.class).single();
        if(exists)throw new ResponseStatusException(HttpStatus.CONFLICT,
            "This exact SHOT05 candidate was already queued or succeeded. No duplicate CPU spend.");
        Previous predecessor=lockedShot04(packageId);
        if(predecessor==null||!Objects.equals(predecessor.sha256(),ready.previousVideoSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Locked SHOT04 changed after readiness; no CPU spend.");
        storage.verifyVideoManifest(predecessor.objectKey(),
                predecessor.sha256(),predecessor.bytes());
        JsonNode story;
        try{story=mapper.readTree(selected.storyJson());}
        catch(Exception invalid){throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Original SHOT05 story cannot be parsed.");}
        List<Map<String,String>> beats=new ArrayList<>();
        for(JsonNode beat:story.path("visualBeats"))
            beats.add(Map.of("beatId",beat.path("beatId").asText(),
                    "cueAnchor",beat.path("cueAnchor").asText(),
                    "direction",beat.path("direction").asText()));
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("episodeKey","EP004");props.put("shotKey","SHOT05");
        props.put("durationInFrames",ready.durationInFrames());
        props.put("breathFrames",BREATH_FRAMES);
        props.put("sourceSha256",SOURCE_SHA);
        props.put("previousRenderId",predecessor.renderId().toString());
        props.put("previousSourceCommit",predecessor.sourceCommit());
        props.put("previousFrameCount",predecessor.frames());
        props.put("previousLastEncodedFrame",predecessor.frames()-1);
        props.put("worldStartFrame",predecessor.worldStartFrame()+predecessor.frames()-1);
        props.put("previousWorldStartFrame",predecessor.worldStartFrame());
        props.put("previousVideoSha256",predecessor.sha256());
        try{
            String previousJson=jdbc.sql("""
                 select input_props::text from remotion_render
                  where id=:id and status='SUCCEEDED' and composition_id=:composition
                 """).param("id",predecessor.renderId())
                 .param("composition",Ep004Shot04DirectorRenderService.COMPOSITION)
                 .query(String.class).single();
            JsonNode previousProps=mapper.readTree(previousJson);
            if(!"SHOT04".equals(previousProps.path("shotKey").asText())
                ||!Objects.equals(previousProps.path("expectedSourceCommit").asText(),
                                    predecessor.sourceCommit())
                ||previousProps.path("durationInFrames").asInt()!=predecessor.frames()
                ||previousProps.path("worldStartFrame").asInt()!=predecessor.worldStartFrame())
                throw new IllegalStateException("Previous locked SHOT04 voice/world source changed.");
            props.put("previousShot04Props",mapper.convertValue(previousProps,Map.class));
        }catch(Exception invalid){
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Locked SHOT04 original rendering properties cannot be verified.");
        }
        props.put("previewOnly",false);
        props.put("directorCpuApproved",true);
        props.put("scriptRevision",selected.revision());
        props.put("voiceTakeId",ready.selectedTakeId());
        props.put("narrationSha256",ready.narrationSha256());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("visualBeats",beats);
        props.put("shotTitle",selected.title());
        props.put("expectedSourceCommit",request.expectedSourceCommit());
        props.put("packageId",packageId.toString());
        props.put("renderRequestId",request.requestId().toString());
        return renders.ensureVerifiedEp004Shot05Preview(props);
    }
}
