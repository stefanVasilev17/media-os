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
public final class Ep004Shot03DirectorRenderService {
    public static final String COMPOSITION="EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL";
    public static final String SOURCE_SHA=Ep004Shot01DirectorRenderService.SOURCE_SHA;
    public static final int FPS=30;
    public static final int BREATH_FRAMES=60;
    public static final int TAIL_FRAMES=45;
    public static final String SHOT02_RENDER_ID="20758da0-46f9-4973-9ef8-ec93eb437a5a";
    public static final String SHOT02_SOURCE_COMMIT="714d7c31affb84793780eee42bc5062387b069a7";

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RemotionRenderController renders;
    private final MediaObjectStore storage;
    private final EpisodePackageVoiceReadinessService voices;

    public Ep004Shot03DirectorRenderService(JdbcClient jdbc,ObjectMapper mapper,
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
            String expectedSourceCommit,Integer novemberFrame,Integer backwardFrame,
            String previousVideoSha256,List<String> blockers,String nextAction) {}

    record Selected(String title,String storyJson,int revision,String narration,
                    UUID takeId,String audioKey,BigDecimal measuredDuration,
                    String providerAlignmentJson) {}

    record Previous(String objectKey,String sha256,Long bytes,String inputPropsJson) {}

    private Previous previousShot02() {
        return jdbc.sql("""
               select video_object_key,video_sha256,video_object_bytes,
                      input_props::text as original_input_props
                 from remotion_render
                where id=:render and composition_id='EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL'
                  and profile='REVIEW' and status='SUCCEEDED'
                  and project_id='11111111-1111-1111-1111-111111111111'::uuid
                  and width=1920 and height=1080 and fps=30 and duration_in_frames=2124
                  and input_props->>'episodeKey'='EP004'
                  and input_props->>'shotKey'='SHOT02'
                  and input_props->>'expectedSourceCommit'=:source
                  and input_props->>'sourceSha256'=:sha
                  and input_props->>'previewOnly'='false'
                  and input_props->>'directorCpuApproved'='true'
                limit 1
               """).param("render",UUID.fromString(SHOT02_RENDER_ID))
                .param("source",SHOT02_SOURCE_COMMIT).param("sha",SOURCE_SHA)
                .query((rs,n)->new Previous(
                    rs.getString("video_object_key"),rs.getString("video_sha256"),
                    rs.getObject("video_object_bytes",Long.class),
                    rs.getString("original_input_props")))
                .optional().orElse(null);
    }

    private Selected selected(UUID packageId) {
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select s.title,s.original_visual_story::text as story,
                       rev.revision,rev.narration,t.id as take_id,
                       t.audio_object_key,t.duration_seconds,
                       t.generated_alignment::text as provider_alignment_json
                  from episode_package_import p
                  join episode_package_shot s on s.package_id=p.id and s.shot_key='SHOT03'
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
                        rs.getBigDecimal("duration_seconds"),
                        rs.getString("provider_alignment_json")))
                .optional().orElse(null);
    }

    public Readiness readiness(UUID packageId,String sourceCommit) {
        var overall=voices.report(packageId);
        if(!"EP004".equals(overall.episodeKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A Director-owned EP004 episode package is required.");
        var shot=overall.shots().stream().filter(s->"SHOT03".equals(s.shotKey()))
                .findFirst().orElse(null);
        if(sourceCommit==null||sourceCommit.isBlank())
            sourceCommit=jdbc.sql("""
                    select source_commit from episode_factory_worker_capability
                     where build_checked=true
                       and last_heartbeat_at>now()-interval '120 seconds'
                       and bundled_scenes::text like '%EP004-SHOT03%'
                     order by last_heartbeat_at desc limit 1
                    """).query(String.class).optional().orElse("");
        var selected=selected(packageId);
        var predecessor=previousShot02();
        List<String> blockers=new ArrayList<>();
        if(!SOURCE_SHA.equals(overall.sourceSha256()))
            blockers.add("EP004_ORIGINAL_SOURCE_CHANGED");
        if(shot==null||!"VOICE_READY".equals(shot.status()))
            blockers.add("SHOT03_ORIGINAL_VOICE_AND_CUES_NOT_VERIFIED");
        if(selected==null)
            blockers.add("DIRECTOR_APPROVED_CURRENT_TAKE_MISSING");
        else if(selected.audioKey()==null
                ||!selected.audioKey().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT03/"))
            blockers.add("SHOT03_APPROVED_AUDIO_OBJECT_UNVERIFIED");
        if(!storage.writable())blockers.add("PRIVATE_MEDIA_OBJECT_STORAGE_NOT_WRITABLE");
        if(predecessor==null||predecessor.objectKey()==null
                ||predecessor.sha256()==null||predecessor.bytes()==null
                ||predecessor.inputPropsJson()==null
                ||!predecessor.objectKey().startsWith(MediaObjectStore.VIDEO_PREFIX)
                ||!predecessor.sha256().matches("[a-f0-9]{64}")
                ||predecessor.bytes()<1024
                ||predecessor.bytes()>MediaObjectStore.MAX_VIDEO_BYTES)
            blockers.add("SHOT02_LOCKED_PREDECESSOR_PRIVATE_MP4_NOT_VERIFIED");
        else {
            try {storage.verifyVideoManifest(predecessor.objectKey(),
                    predecessor.sha256(),predecessor.bytes());}
            catch(Exception invalid){blockers.add("SHOT02_LOCKED_PREDECESSOR_SHA_OR_STORAGE_INVALID");}
        }
        int frames=shot==null||shot.measuredDurationSeconds()==null?0:
                BREATH_FRAMES+(int)Math.ceil(shot.measuredDurationSeconds().doubleValue()*FPS)+TAIL_FRAMES;
        if(frames<600||frames>9000)blockers.add("SHOT03_MEASURED_DURATION_OUT_OF_CPU_BOUND");
        if(sourceCommit==null||!sourceCommit.matches("[a-f0-9]{40}"))
            blockers.add("SHARED_WORKER_SOURCE_COMMIT_REQUIRED");
        else {
            boolean compiled=jdbc.sql("""
                    select exists(select 1 from episode_factory_worker_capability
                      where source_commit=:sha and build_checked=true
                        and last_heartbeat_at>now()-interval '120 seconds'
                        and bundled_scenes::text like '%EP004-SHOT03%')
                    """).param("sha",sourceCommit).query(Boolean.class).single();
            if(!compiled)blockers.add("MATCHING_SHOT03_REMOTION_SOURCE_NOT_COMPILED_BY_WORKER");
        }
        Map<String,Integer> cues=new LinkedHashMap<>();
        List<Map<String,Object>> verified=new ArrayList<>();
        if(shot!=null&&"VOICE_READY".equals(shot.status())){
            int prior=BREATH_FRAMES-1;
            for(var cue:shot.verifiedCues()){
                int start=BREATH_FRAMES+(int)Math.round(cue.startSeconds()*FPS);
                int end=BREATH_FRAMES+(int)Math.round(cue.endSeconds()*FPS);
                if(start<=prior||end<start||end>=frames-TAIL_FRAMES+8
                        ||cue.beatId()==null||!cue.beatId().matches("SHOT03_[A-Z0-9_]{3,45}")){
                    blockers.add("VERIFIED_SHOT03_CUE_FRAME_OR_ID_OUT_OF_RANGE");
                    break;
                }
                cues.put(cue.beatId(),start);
                verified.add(Map.of("beatId",cue.beatId(),"anchor",cue.cueAnchor(),
                        "startFrame",start,"endFrame",end));
                prior=start;
            }
            if(cues.size()<2||cues.size()>40)
                blockers.add("VERIFIED_SHOT03_CUE_COUNT_OUT_OF_RANGE");
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
            }catch(Exception failure){blockers.add("ORIGINAL_SHOT03_STORY_MALFORMED");}
        }
        Integer novemberFrame=null,backwardFrame=null;
        if(selected!=null&&selected.providerAlignmentJson()!=null){
            var verifier=new EpisodePackageCueTimingVerifier(mapper);
            var november=verifier.firstSpokenTermStartSeconds(selected.narration(),
                    selected.providerAlignmentJson(),selected.measuredDuration(),"november");
            var backward=verifier.firstSpokenTermStartSeconds(selected.narration(),
                    selected.providerAlignmentJson(),selected.measuredDuration(),"backward");
            if(november.isPresent()&&backward.isPresent()){
                int route=BREATH_FRAMES+(int)Math.round(november.getAsDouble()*FPS);
                int recall=BREATH_FRAMES+(int)Math.round(backward.getAsDouble()*FPS);
                if(route>=BREATH_FRAMES+90&&recall>route+90
                        &&recall<frames-TAIL_FRAMES-20){
                    novemberFrame=route;backwardFrame=recall;
                }
            }
        }
        if(novemberFrame==null||backwardFrame==null)
            blockers.add("SHOT03_REAL_NOVEMBER_AND_BACKWARD_WORD_CUES_NOT_VERIFIED");
        return new Readiness(blockers.isEmpty(),"EP004","SHOT03",
                shot==null?null:shot.selectedTakeId(),
                selected==null?null:EpisodePackageValidator.sha256(selected.narration()),
                overall.sourceSha256(),frames,Map.copyOf(cues),List.copyOf(verified),
                sourceCommit,novemberFrame,backwardFrame,
                predecessor==null?null:predecessor.sha256(),
                List.copyOf(blockers),blockers.isEmpty()
                ?"Director may approve one bounded SHOT03 1080p real-voice review render."
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
                    "Approved SHOT03 Take, actual cues, worker source or maximum frames changed: "
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
                "This exact SHOT03 candidate was already queued or succeeded. Inspect its MP4; do not spend CPU twice.");

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
        props.put("episodeKey","EP004");props.put("shotKey","SHOT03");
        props.put("durationInFrames",ready.durationInFrames());
        props.put("sourceSha256",SOURCE_SHA);
        props.put("previousRenderId",SHOT02_RENDER_ID);
        props.put("previousSourceCommit",SHOT02_SOURCE_COMMIT);
        props.put("worldStartFrame",4123);
        props.put("previousLastEncodedFrame",2123);
        props.put("previousFrameCount",2124);
        props.put("previewOnly",false);
        props.put("directorCpuApproved",true);
        props.put("scriptRevision",s.revision());
        props.put("voiceTakeId",ready.selectedTakeId());
        props.put("narrationSha256",ready.narrationSha256());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("novemberFrame",ready.novemberFrame());
        props.put("backwardFrame",ready.backwardFrame());
        Previous predecessor=previousShot02();
        if(predecessor==null||!Objects.equals(predecessor.sha256(),ready.previousVideoSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT02 predecessor changed after readiness; no CPU spend.");
        props.put("previousVideoSha256",predecessor.sha256());
        try {
            JsonNode sourceProps=mapper.readTree(predecessor.inputPropsJson());
            if(!sourceProps.isObject()||sourceProps.path("verifiedCues").size()<2
                ||sourceProps.path("visualBeats").size()<2
                ||!SHOT02_SOURCE_COMMIT.equals(sourceProps.path("expectedSourceCommit").asText()))
                throw new IllegalArgumentException("Invalid immutable predecessor input");
            props.put("previousShot02Props",mapper.convertValue(sourceProps,Map.class));
        }catch(Exception invalid){
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Exact original SHOT02 visual inputs are unavailable; no CPU render.");
        }
        props.put("visualBeats",beats);
        props.put("shotTitle",s.title());
        props.put("expectedSourceCommit",request.expectedSourceCommit());
        props.put("packageId",packageId.toString());
        props.put("renderRequestId",request.requestId().toString());
        return renders.ensureVerifiedEp004Shot03Preview(props);
    }
}
