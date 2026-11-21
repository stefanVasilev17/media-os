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
public final class Ep004Shot02DirectorRenderService {
    public static final String COMPOSITION="EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL";
    public static final String SOURCE_SHA=Ep004Shot01DirectorRenderService.SOURCE_SHA;
    public static final int FPS=30;
    public static final int BREATH_FRAMES=60;
    public static final int TAIL_FRAMES=45;
    public static final String V8_RENDER_ID="e8f3818e-aac0-40f2-8e1a-d70e9fa108e0";
    public static final String V8_SOURCE_COMMIT="590448542604e8308750664354bbd8dea55a53e5";

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RemotionRenderController renders;
    private final MediaObjectStore storage;
    private final EpisodePackageVoiceReadinessService voices;

    public Ep004Shot02DirectorRenderService(JdbcClient jdbc,ObjectMapper mapper,
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
            List<Map<String,Object>> verifiedCues,
            String expectedSourceCommit,List<String> blockers,String nextAction) {}

    record Selected(String title,String storyJson,int revision,String narration,
                    UUID takeId,String audioKey,BigDecimal measuredDuration) {}

    private Selected selected(UUID packageId) {
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select s.title,s.original_visual_story::text as story,
                       rev.revision,rev.narration,t.id as take_id,
                       t.audio_object_key,t.duration_seconds
                  from episode_package_import p
                  join episode_package_shot s on s.package_id=p.id and s.shot_key='SHOT02'
                  join lateral(select revision,narration from episode_package_shot_revision
                        where shot_id=s.id order by revision desc limit 1) rev on true
                  join lateral(select take_id from episode_package_voice_choice
                        where shot_id=s.id and revision=rev.revision
                        order by selected_at desc,id desc limit 1) choice on true
                  join episode_package_voice_take t on t.id=choice.take_id
                        and t.shot_id=s.id and t.revision=rev.revision
                 where p.id=:package and p.episode_key='EP004'
                   and p.director_issuer=:issuer and p.director_subject=:subject
                """).param("package",packageId).param("issuer",actor.issuer())
                .param("subject",actor.subject())
                .query((rs,n)->new Selected(rs.getString("title"),rs.getString("story"),
                        rs.getInt("revision"),rs.getString("narration"),
                        rs.getObject("take_id",UUID.class),rs.getString("audio_object_key"),
                        rs.getBigDecimal("duration_seconds")))
                .optional().orElse(null);
    }

    public Readiness readiness(UUID packageId,String sourceCommit) {
        var overall=voices.report(packageId);
        if(!"EP004".equals(overall.episodeKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A Director-owned EP004 episode package is required.");
        var shot=overall.shots().stream().filter(s->"SHOT02".equals(s.shotKey()))
                .findFirst().orElse(null);
        if(sourceCommit==null||sourceCommit.isBlank())
            sourceCommit=jdbc.sql("""
                    select source_commit from episode_factory_worker_capability
                     where build_checked=true
                       and last_heartbeat_at>now()-interval '120 seconds'
                       and bundled_scenes::text like '%EP004-SHOT02%'
                     order by last_heartbeat_at desc limit 1
                    """).query(String.class).optional().orElse("");
        var selected=selected(packageId);
        List<String> blockers=new ArrayList<>();
        if(!SOURCE_SHA.equals(overall.sourceSha256()))
            blockers.add("EP004_ORIGINAL_SOURCE_CHANGED");
        if(shot==null||!"VOICE_READY".equals(shot.status()))
            blockers.add("SHOT02_ORIGINAL_VOICE_AND_CUES_NOT_VERIFIED");
        if(selected==null)
            blockers.add("DIRECTOR_APPROVED_CURRENT_TAKE_MISSING");
        else if(selected.audioKey()==null
                ||!selected.audioKey().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT02/"))
            blockers.add("SHOT02_APPROVED_AUDIO_OBJECT_UNVERIFIED");
        if(!storage.writable())blockers.add("PRIVATE_MEDIA_OBJECT_STORAGE_NOT_WRITABLE");
        int frames=shot==null||shot.measuredDurationSeconds()==null?0:
                BREATH_FRAMES+(int)Math.ceil(shot.measuredDurationSeconds().doubleValue()*FPS)+TAIL_FRAMES;
        if(frames<600||frames>9000)blockers.add("SHOT02_MEASURED_DURATION_OUT_OF_CPU_BOUND");
        if(sourceCommit==null||!sourceCommit.matches("[a-f0-9]{40}"))
            blockers.add("SHARED_WORKER_SOURCE_COMMIT_REQUIRED");
        else {
            boolean compiled=jdbc.sql("""
                    select exists(select 1 from episode_factory_worker_capability
                      where source_commit=:sha and build_checked=true
                        and last_heartbeat_at>now()-interval '120 seconds'
                        and bundled_scenes::text like '%EP004-SHOT02%')
                    """).param("sha",sourceCommit).query(Boolean.class).single();
            if(!compiled)blockers.add("MATCHING_SHOT02_REMOTION_SOURCE_NOT_COMPILED_BY_WORKER");
        }
        Map<String,Integer> cues=new LinkedHashMap<>();
        List<Map<String,Object>> verified=new ArrayList<>();
        if(shot!=null&&"VOICE_READY".equals(shot.status())){
            int prior=BREATH_FRAMES-1;
            for(var cue:shot.verifiedCues()){
                int start=BREATH_FRAMES+(int)Math.round(cue.startSeconds()*FPS);
                int end=BREATH_FRAMES+(int)Math.round(cue.endSeconds()*FPS);
                if(start<=prior||end<start||end>=frames-TAIL_FRAMES+8
                        ||cue.beatId()==null||!cue.beatId().matches("SHOT02_[A-Z0-9_]{3,45}")){
                    blockers.add("VERIFIED_SHOT02_CUE_FRAME_OR_ID_OUT_OF_RANGE");
                    break;
                }
                cues.put(cue.beatId(),start);
                verified.add(Map.of("beatId",cue.beatId(),"anchor",cue.cueAnchor(),
                        "startFrame",start,"endFrame",end));
                prior=start;
            }
            if(cues.size()<2||cues.size()>40)
                blockers.add("VERIFIED_SHOT02_CUE_COUNT_OUT_OF_RANGE");
        }
        if(selected!=null){
            try {
                JsonNode beats=mapper.readTree(selected.storyJson()).path("visualBeats");
                if(!beats.isArray()||beats.size()!=verified.size())
                    blockers.add("ORIGINAL_VISUAL_STORY_BEAT_COUNT_MISMATCH");
                else for(int i=0;i<beats.size();i++){
                    if(!Objects.equals(beats.get(i).path("beatId").asText(),
                                verified.get(i).get("beatId"))
                        ||!Objects.equals(beats.get(i).path("cueAnchor").asText(),
                                verified.get(i).get("anchor")))
                        blockers.add("ORIGINAL_VISUAL_STORY_AND_CUE_MISMATCH_"+i);
                }
            }catch(Exception failure){blockers.add("ORIGINAL_SHOT02_STORY_MALFORMED");}
        }
        return new Readiness(blockers.isEmpty(),"EP004","SHOT02",
                shot==null?null:shot.selectedTakeId(),
                selected==null?null:EpisodePackageValidator.sha256(selected.narration()),
                overall.sourceSha256(),frames,Map.copyOf(cues),List.copyOf(verified),
                sourceCommit,List.copyOf(blockers),blockers.isEmpty()
                ?"Director may approve one bounded SHOT02 1080p real-voice review render."
                :"Resolve original voice, story, storage or matching compiled worker before CPU consent.");
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
                    "An authenticated explicit bounded Director CPU approval is mandatory.");
        Readiness ready=readiness(packageId,request.expectedSourceCommit());
        Selected s=selected(packageId);
        if(!ready.ready()||ready.durationInFrames()>request.maximumFrames()
                ||s==null||s.revision()<1
                ||!Objects.equals(ready.selectedTakeId(),request.expectedVoiceTakeId().toString())
                ||!Objects.equals(ready.narrationSha256(),request.expectedNarrationSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Approved SHOT02 Take, actual cues, worker source or maximum frames changed: "
                     +String.join(";",ready.blockers()));

        boolean exists=jdbc.sql("""
                select exists(select 1 from remotion_render
                 where composition_id=:composition
                   and project_id='11111111-1111-1111-1111-111111111111'::uuid
                   and input_props->>'voiceTakeId'=:take
                   and input_props->>'narrationSha256'=:script
                   and input_props->>'expectedSourceCommit'=:commit
                   and status in ('QUEUED','RUNNING','SUCCEEDED'))
                """).param("composition",COMPOSITION).param("take",ready.selectedTakeId())
                .param("script",ready.narrationSha256())
                .param("commit",request.expectedSourceCommit())
                .query(Boolean.class).single();
        if(exists)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This exact SHOT02 candidate was already queued or succeeded. Inspect its MP4; do not spend CPU twice.");

        JsonNode root;
        try{root=mapper.readTree(s.storyJson());}
        catch(Exception ex){throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Original visual story is unreadable.");}
        List<Map<String,String>> beats=new ArrayList<>();
        for(JsonNode beat:root.path("visualBeats"))
            beats.add(Map.of("beatId",beat.path("beatId").asText(),
                    "cueAnchor",beat.path("cueAnchor").asText(),
                    "direction",beat.path("direction").asText()));

        Map<String,Object> props=new LinkedHashMap<>();
        props.put("episodeKey","EP004");props.put("shotKey","SHOT02");
        props.put("durationInFrames",ready.durationInFrames());
        props.put("sourceSha256",SOURCE_SHA);
        props.put("previousRenderId",V8_RENDER_ID);
        props.put("previousSourceCommit",V8_SOURCE_COMMIT);
        props.put("worldStartFrame",2000);
        props.put("previewOnly",false);
        props.put("directorCpuApproved",true);
        props.put("scriptRevision",s.revision());
        props.put("voiceTakeId",ready.selectedTakeId());
        props.put("narrationSha256",ready.narrationSha256());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("visualBeats",beats);
        props.put("shotTitle",s.title());
        props.put("expectedSourceCommit",request.expectedSourceCommit());
        props.put("packageId",packageId.toString());
        props.put("renderRequestId",request.requestId().toString());
        return renders.ensureVerifiedEp004Shot02Preview(props);
    }
}
