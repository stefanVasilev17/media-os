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
public final class Ep004Shot15DirectorRenderService {
    public static final String COMPOSITION="EP004-SHOT15-HUMAN-CONSEQUENCE-V1-VISUAL";
    public static final String SOURCE_SHA=Ep004Shot01DirectorRenderService.SOURCE_SHA;
    public static final int FPS=30;
    public static final int BREATH_FRAMES=72;
    public static final int TAIL_FRAMES=60;
    public static final UUID PREDECESSOR_ID=UUID.fromString("404832c1-0b7d-4de7-a95b-1971445d9a4d");
    public static final String PREDECESSOR_COMMIT="e1158d874c63205bffb55e4ea6e0e011e667ea75";
    public static final int PREDECESSOR_FRAMES=2018;
    private static final String ORIGINAL_NARRATION="For the person waiting on an email, none of these terms mattered. What mattered was whether the message could arrive when it was needed. But behind that small moment was a system of gateways, shared capacity, hidden software behavior, and recovery decisions.\n\nThe lesson reaches beyond Microsoft 365. Every distributed system eventually has to answer the same difficult question: when one part fails, will moving its work protect the rest, or make the next failure more likely?\n\nThat is not just a question about failover. It is a question about how we design for uncertainty.";
    private static final List<String> BEAT_IDS=List.of("SHOT15_P01_B01","SHOT15_P01_B02","SHOT15_P02_B01","SHOT15_P02_B02","SHOT15_P03_B01","SHOT15_P03_B02");

    private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(Ep004Shot15DirectorRenderService.class);
    private static final UUID AUDIT_PACKAGE=UUID.fromString("d11d02a2-b649-44c9-a022-4405149f675e");
    private final java.util.concurrent.atomic.AtomicBoolean deploymentAuditDone=new java.util.concurrent.atomic.AtomicBoolean();
    private static final List<Map.Entry<String,String>> EVENTS=List.of(Map.entry("PERSON","For the person waiting on an email, none"),
        Map.entry("MATTERED","What mattered was whether the message could arrive when"),
        Map.entry("NEEDED","it was needed. But behind that small moment"),
        Map.entry("GATEWAYS","was a system of gateways"),
        Map.entry("CAPACITY","shared capacity"),
        Map.entry("HIDDEN","hidden software behavior, and recovery decisions"),
        Map.entry("BEYOND","The lesson reaches beyond Microsoft 365. Every distributed"),
        Map.entry("QUESTION","system eventually has to answer the same difficult question"),
        Map.entry("FAILS","when one part fails, will moving its work"),
        Map.entry("PROTECT","protect the rest"),
        Map.entry("NEXT","or make the next failure more likely"),
        Map.entry("FAILOVER","That is not just a question about failover."),
        Map.entry("DESIGN","is a question about how we design for"),
        Map.entry("UNCERTAINTY","uncertainty."));
    private final EpisodePackageCueTimingVerifier timing;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RemotionRenderController renders;
    private final MediaObjectStore storage;
    private final EpisodePackageVoiceReadinessService voices;

    public Ep004Shot15DirectorRenderService(JdbcClient jdbc,ObjectMapper mapper,
            RemotionRenderController renders,MediaObjectStore storage,
            EpisodePackageVoiceReadinessService voices,EpisodePackageCueTimingVerifier timing) {
        this.jdbc=jdbc;this.mapper=mapper;this.renders=renders;
        this.storage=storage;this.voices=voices;this.timing=timing;
    }

    public record CpuRequest(UUID requestId,String expectedNarrationSha256,
            String expectedSourceCommit,UUID expectedVoiceTakeId,
            int maximumFrames,Boolean confirmCpuRender) {}
    public record Readiness(boolean ready,String episodeKey,String shotKey,
            String selectedTakeId,String narrationSha256,String sourceSha256,
            int durationInFrames,Map<String,Integer> cueFrames,
            List<Map<String,Object>> verifiedCues,Map<String,Integer> eventFrames,String expectedSourceCommit,
            String previousVideoSha256,List<String> blockers,String nextAction) {}
    record Selected(String title,String storyJson,int revision,String narration,
            UUID takeId,String audioKey,String audioSha,Long audioBytes,BigDecimal measuredDuration,String alignment) {}
    record Previous(UUID renderId,String objectKey,String sha256,long bytes,
            int frames,String sourceCommit,int worldStartFrame) {}

    private Selected selected(UUID packageId) {
        var director=DirectorIdentity.requireDirector();
        return selectedOwned(packageId,director.issuer(),director.subject());
    }

    private Selected selectedOwned(UUID packageId,String issuer,String subject) {
        return jdbc.sql("""
              select s.title,s.original_visual_story::text as story,
                     rev.revision,rev.narration,t.id as take_id,
                     t.audio_object_key,t.audio_sha256,t.audio_size_bytes,t.duration_seconds,t.generated_alignment::text as alignment
                from episode_package_import p
                join episode_package_shot s on s.package_id=p.id
                   and s.shot_key='SHOT15'
                join lateral(select revision,narration from episode_package_shot_revision
                       where shot_id=s.id order by revision desc limit 1) rev on true
                join lateral(select take_id from episode_package_voice_choice
                       where shot_id=s.id and revision=rev.revision
                       order by selected_at desc,id desc limit 1) choice on true
                join episode_package_voice_take t on t.id=choice.take_id
                   and t.shot_id=s.id and t.revision=rev.revision
               where p.id=:package and p.episode_key='EP004'
                 and p.director_issuer=:issuer and p.director_subject=:subject
                 and t.storage_status='OBJECT_VERIFIED'
                 and t.audio_sha256 ~ '^[a-f0-9]{64}$'
                 and t.audio_size_bytes between 512 and 25165824
              """).param("package",packageId).param("issuer",issuer)
              .param("subject",subject)
              .query((rs,n)->new Selected(rs.getString("title"),rs.getString("story"),
                  rs.getInt("revision"),rs.getString("narration"),
                  rs.getObject("take_id",UUID.class),rs.getString("audio_object_key"),
                  rs.getString("audio_sha256"),rs.getObject("audio_size_bytes",Long.class),
                  rs.getBigDecimal("duration_seconds"),rs.getString("alignment")))
              .optional().orElse(null);
    }

    private Previous lockedShot14(UUID packageId) {
        return jdbc.sql("""
              select r.id,r.video_object_key,r.video_sha256,
                     r.video_object_bytes,r.duration_in_frames,
                     r.input_props->>'expectedSourceCommit' as source_commit,
                     (r.input_props->>'worldStartFrame')::integer as world_start
                from episode_director_shot_lock l
                join remotion_render r on r.id=l.render_id
               where l.package_id=:package and l.shot_key='SHOT14'
                 and r.project_id='11111111-1111-1111-1111-111111111111'::uuid
                 and r.composition_id=:previous and r.profile='REVIEW'
                 and r.status='SUCCEEDED' and r.width=1920 and r.height=1080
                 and r.fps=30 and r.duration_in_frames between 600 and 9000
                 and r.input_props->>'packageId'=:packageText
                 and r.input_props->>'episodeKey'='EP004'
                 and r.input_props->>'shotKey'='SHOT14'
                 and r.input_props->>'sourceSha256'=:source
                 and r.input_props->>'previewOnly'='false'
                 and r.input_props->>'directorCpuApproved'='true'
                 and r.id=:lockedId and r.duration_in_frames=2018
                 and r.input_props->>'expectedSourceCommit'=:lockedCommit
                 and r.video_sha256 ~ '^[a-f0-9]{64}$'
                 and r.video_object_bytes between 1024 and 134217728
                 and r.video_object_key is not null
               limit 1
              """).param("package",packageId).param("packageText",packageId.toString())
              .param("previous",Ep004Shot14DirectorRenderService.COMPOSITION)
              .param("lockedId",PREDECESSOR_ID).param("lockedCommit",PREDECESSOR_COMMIT)
              .param("source",SOURCE_SHA)
              .query((rs,n)->new Previous(rs.getObject("id",UUID.class),
                  rs.getString("video_object_key"),rs.getString("video_sha256"),
                  rs.getLong("video_object_bytes"),rs.getInt("duration_in_frames"),
                  rs.getString("source_commit"),rs.getInt("world_start")))
              .optional().orElse(null);
    }

    public Readiness readiness(UUID packageId,String sourceCommit) {
        var director=DirectorIdentity.requireDirector();
        return readinessOwned(packageId,sourceCommit,director.issuer(),director.subject());
    }

    private Readiness readinessOwned(UUID packageId,String sourceCommit,String issuer,String subject) {
        var overall=voices.reportOwnedPackage(packageId,issuer,subject);
        if(!"EP004".equals(overall.episodeKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A Director-owned EP004 package is required.");
        var shot=overall.shots().stream().filter(s->"SHOT15".equals(s.shotKey()))
                .findFirst().orElse(null);
        if(sourceCommit==null||sourceCommit.isBlank())
            sourceCommit=jdbc.sql("""
                 select source_commit from episode_factory_worker_capability
                  where build_checked=true
                    and last_heartbeat_at>now()-interval '120 seconds'
                    and bundled_scenes::text like '%EP004-SHOT15%'
                  order by last_heartbeat_at desc limit 1
                 """).query(String.class).optional().orElse("");
        var current=selectedOwned(packageId,issuer,subject);
        var previous=lockedShot14(packageId);
        List<String> blockers=new ArrayList<>();
        if(!SOURCE_SHA.equals(overall.sourceSha256()))
            blockers.add("EP004_ORIGINAL_SOURCE_CHANGED");
        if(shot==null||!"VOICE_READY".equals(shot.status()))
            blockers.add("SHOT15_DIRECTOR_APPROVED_ORIGINAL_VOICE_CUES_MISSING");
        if(current==null||shot==null||!Objects.equals(current.takeId().toString(),shot.selectedTakeId()))
            blockers.add("SHOT15_DIRECTOR_SELECTED_CURRENT_TAKE_MISSING");
        else if(!ORIGINAL_NARRATION.equals(current.narration()))
            blockers.add("SHOT15_ORIGINAL_NARRATION_CHANGED");
        else if(current.audioKey()==null
                ||!current.audioKey().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT15/"))
            blockers.add("SHOT15_PRIVATE_APPROVED_TAKE_NOT_VERIFIED");
        else try { storage.downloadVerified(current.audioKey(),current.audioSha(),current.audioBytes()); }
        catch(Exception invalid){blockers.add("SHOT15_SELECTED_AUDIO_SHA256_OR_STORAGE_CHANGED");}
        if(previous==null||previous.sourceCommit()==null
                ||!previous.sourceCommit().matches("[a-f0-9]{40}")
                ||!PREDECESSOR_ID.equals(previous.renderId())
                ||!PREDECESSOR_COMMIT.equals(previous.sourceCommit())
                ||previous.frames()!=PREDECESSOR_FRAMES||previous.worldStartFrame()<600)
            blockers.add("SHOT14_PREVIOUS_DIRECTOR_LOCKED_MP4_REQUIRED");
        else try {
            storage.verifyVideoManifest(previous.objectKey(),
                    previous.sha256(),previous.bytes());
        }catch(Exception invalid) {
            blockers.add("SHOT14_LOCKED_MP4_SHA256_OR_STORAGE_CHANGED");
        }
        if(!storage.writable())blockers.add("PRIVATE_MP4_STORAGE_NOT_WRITABLE");
        int frames=shot==null||shot.measuredDurationSeconds()==null?0:
            BREATH_FRAMES+(int)Math.ceil(shot.measuredDurationSeconds().doubleValue()*FPS)
            +TAIL_FRAMES;
        if(frames<600||frames>9000)
            blockers.add("SHOT15_AUDIO_DURATION_OUTSIDE_BOUNDED_RENDER");
        String deployed=System.getenv("RAILWAY_GIT_COMMIT_SHA");
        if(deployed!=null&&!deployed.isBlank()&&!deployed.equals(sourceCommit))
            blockers.add("SHOT15_BACKEND_WORKER_SOURCE_MISMATCH");
        if(sourceCommit==null||!sourceCommit.matches("[a-f0-9]{40}"))
            blockers.add("MATCHING_SHOT15_WORKER_SOURCE_COMMIT_REQUIRED");
        else {
            boolean compiled=jdbc.sql("""
                 select exists(select 1 from episode_factory_worker_capability
                   where source_commit=:sha and build_checked=true
                     and last_heartbeat_at>now()-interval '120 seconds'
                     and bundled_scenes::text like '%EP004-SHOT15%')
                 """).param("sha",sourceCommit).query(Boolean.class).single();
            if(!compiled)blockers.add("SHOT15_RENDER_SCENE_NOT_COMPILED_ON_LIVE_WORKER");
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
                        ||!cue.beatId().matches("SHOT15_[A-Z0-9_]{3,45}")){
                    blockers.add("SHOT15_ALIGNED_CUE_FRAME_OUTSIDE_REAL_AUDIO");
                    break;
                }
                cueFrames.put(cue.beatId(),start);
                verified.add(Map.of("beatId",cue.beatId(),
                    "anchor",cue.cueAnchor(),"startFrame",start,"endFrame",end));
                previousStart=start;
            }
            if(!verified.stream().map(v->String.valueOf(v.get("beatId"))).toList().equals(BEAT_IDS))
                blockers.add("SHOT15_ORIGINAL_VISUAL_CUES_REQUIRED");
        }
        if(current!=null){
            try{
                JsonNode beats=mapper.readTree(current.storyJson()).path("visualBeats");
                if(!beats.isArray()||beats.size()!=verified.size())
                    blockers.add("SHOT15_ORIGINAL_STORY_BEAT_COUNT_MISMATCH");
                else for(int i=0;i<beats.size();i++)
                    if(!Objects.equals(beats.get(i).path("beatId").asText(),
                                          verified.get(i).get("beatId"))
                       ||!Objects.equals(beats.get(i).path("cueAnchor").asText(),
                                          verified.get(i).get("anchor")))
                        blockers.add("SHOT15_ORIGINAL_STORY_CUE_MISMATCH_"+i);
            }catch(Exception invalid){blockers.add("SHOT15_ORIGINAL_STORY_UNREADABLE");}
        }
        Map<String,Integer> eventFrames=new LinkedHashMap<>();
        if(current!=null&&shot!=null&&"VOICE_READY".equals(shot.status())){
            try{
                var eventStory=mapper.createObjectNode();
                var eventBeats=eventStory.putArray("visualBeats");
                for(var event:EVENTS){
                    var b=eventBeats.addObject();b.put("beatId",event.getKey());b.put("cueAnchor",event.getValue());
                }
                var resolved=timing.verify(current.narration(),eventStory.toString(),current.alignment(),current.measuredDuration());
                if(!resolved.verified()||resolved.cues().size()!=EVENTS.size())
                    blockers.add("SHOT15_EXACT_RECOVERY_EVENTS_UNVERIFIED_"+resolved.failureCode());
                else {
                    int previousEvent=BREATH_FRAMES-1;
                    for(var cue:resolved.cues()){
                        int f=BREATH_FRAMES+(int)Math.round(cue.startSeconds()*FPS);
                        if(f<=previousEvent||f>=frames-TAIL_FRAMES+8)
                            blockers.add("SHOT15_RECOVERY_EVENT_CLOCK_INVALID_"+cue.beatId());
                        eventFrames.put(cue.beatId(),f);previousEvent=f;
                    }
                    if(eventFrames.size()==EVENTS.size()&&verified.size()==BEAT_IDS.size()
                            &&(eventFrames.get("PERSON")!=(int)verified.get(0).get("startFrame")
                            ||eventFrames.get("NEEDED")!=(int)verified.get(1).get("startFrame")
                            ||eventFrames.get("BEYOND")!=(int)verified.get(2).get("startFrame")
                            ||eventFrames.get("FAILS")!=(int)verified.get(3).get("startFrame")
                            ||eventFrames.get("FAILOVER")!=(int)verified.get(4).get("startFrame")
                            ||eventFrames.get("DESIGN")!=(int)verified.get(5).get("startFrame")))
                        blockers.add("SHOT15_DESIGN_EVENTS_DO_NOT_MATCH_ORIGINAL_BEATS");
                }
            }catch(Exception invalid){blockers.add("SHOT15_RECOVERY_ALIGNMENT_UNREADABLE");}
        }
        LOG.info("EP004_SHOT15_READINESS source={} ready={} frames={} cues={} blockers={}",
                sourceCommit,blockers.isEmpty(),frames,verified.size(),blockers);
        return new Readiness(blockers.isEmpty(),"EP004","SHOT15",
                shot==null?null:shot.selectedTakeId(),
                current==null?null:EpisodePackageValidator.sha256(current.narration()),
                overall.sourceSha256(),frames,Map.copyOf(cueFrames),List.copyOf(verified),Map.copyOf(eventFrames),
                sourceCommit,previous==null?null:previous.sha256(),
                List.copyOf(blockers),blockers.isEmpty()
                    ?"SHOT15 ready for one explicit Director-approved render. Voice starts after 72 frames; SHOT14 seam is verified."
                    :"Verify current approved Take, original cues, locked SHOT14 and compiled worker before any CPU spend.");
    }

    // Read-only deployment verification; no Director identity is fabricated,
    // no HTTP route is exposed, and no render or voice generation is authorized.
    // Execute once on this exact backend/worker source, reporting only status.
    @org.springframework.scheduling.annotation.Scheduled(initialDelay=15000,fixedDelay=15000)
    public void verifyDeployedShot15Inputs() {
        String sha=System.getenv("RAILWAY_GIT_COMMIT_SHA");
        if(sha==null||!sha.matches("[a-f0-9]{40}")||deploymentAuditDone.get())return;
        try {
            boolean worker=jdbc.sql("""
                select exists(select 1 from episode_factory_worker_capability
                  where source_commit=:sha and build_checked=true
                    and last_heartbeat_at>now()-interval '120 seconds'
                    and bundled_scenes::text like '%EP004-SHOT15%')
                """).param("sha",sha).query(Boolean.class).single();
            if(!worker||!deploymentAuditDone.compareAndSet(false,true))return;
            record Owner(String issuer,String subject) {}
            Owner owner=jdbc.sql("""
                select director_issuer,director_subject from episode_package_import
                where id=:id and episode_key='EP004' and source_sha256=:source
                """).param("id",AUDIT_PACKAGE).param("source",SOURCE_SHA)
                .query((rs,n)->new Owner(rs.getString("director_issuer"),rs.getString("director_subject")))
                .optional().orElseThrow();
            Readiness checked=readinessOwned(AUDIT_PACKAGE,sha,owner.issuer(),owner.subject());
            if(!checked.ready()){
                deploymentAuditDone.set(false);
                LOG.warn("EP004_SHOT15_DEPLOYMENT_READINESS_BLOCKED source={} blockers={}",sha,checked.blockers());
                return;
            }
            Previous previous=lockedShot14(AUDIT_PACKAGE);
            storage.downloadVideoVerified(previous.objectKey(),previous.sha256(),previous.bytes());
            LOG.info("EP004_SHOT15_DEPLOYMENT_READINESS_PASS source={} frames={} cues={} originalVoiceShaVerified=true lockedShot14VideoShaVerified=true",
                    sha,checked.durationInFrames(),checked.verifiedCues().size());
            LOG.info("EP004_SHOT15_REAL_EVENT_CLOCK_PASS events={}",checked.eventFrames());
        } catch(Exception failure) {
            LOG.warn("EP004_SHOT15_DEPLOYMENT_READINESS_ERROR type={}",failure.getClass().getSimpleName());
        }
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
                "Audited explicit SHOT15 CPU approval is required.");
        Readiness ready=readiness(packageId,request.expectedSourceCommit());
        if(jdbc.sql("select exists(select 1 from episode_director_shot_lock where package_id=:p and shot_key='SHOT15')").param("p",packageId).query(Boolean.class).single())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"SHOT15 already Director locked.");
        Selected selected=selected(packageId);
        if(!ready.ready()||ready.durationInFrames()>request.maximumFrames()
                ||!Objects.equals(ready.expectedSourceCommit(),request.expectedSourceCommit())
                ||selected==null||selected.revision()<1
                ||!Objects.equals(ready.selectedTakeId(),
                                 request.expectedVoiceTakeId().toString())
                ||!Objects.equals(ready.narrationSha256(),request.expectedNarrationSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT15 approved Take, source, exact cues or measured duration changed: "
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
            "This exact SHOT15 candidate was already queued or succeeded. No duplicate CPU spend.");
        Previous predecessor=lockedShot14(packageId);
        if(predecessor==null||!Objects.equals(predecessor.sha256(),ready.previousVideoSha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Locked SHOT14 changed after readiness; no CPU spend.");
        storage.verifyVideoManifest(predecessor.objectKey(),
                predecessor.sha256(),predecessor.bytes());
        JsonNode story;
        try{story=mapper.readTree(selected.storyJson());}
        catch(Exception invalid){throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Original SHOT15 story cannot be parsed.");}
        List<Map<String,String>> beats=new ArrayList<>();
        for(JsonNode beat:story.path("visualBeats"))
            beats.add(Map.of("beatId",beat.path("beatId").asText(),
                    "cueAnchor",beat.path("cueAnchor").asText(),
                    "direction",beat.path("direction").asText()));
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("episodeKey","EP004");props.put("shotKey","SHOT15");
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
                 .param("composition",Ep004Shot14DirectorRenderService.COMPOSITION)
                 .query(String.class).single();
            JsonNode previousProps=mapper.readTree(previousJson);
            if(!"SHOT14".equals(previousProps.path("shotKey").asText())
                ||!Objects.equals(previousProps.path("expectedSourceCommit").asText(),
                                    predecessor.sourceCommit())
                ||previousProps.path("durationInFrames").asInt()!=predecessor.frames()
                ||previousProps.path("worldStartFrame").asInt()!=predecessor.worldStartFrame())
                throw new IllegalStateException("Previous locked SHOT14 voice/world source changed.");
            props.put("previousShot14Props",mapper.convertValue(previousProps,Map.class));
        }catch(Exception invalid){
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Locked SHOT14 original rendering properties cannot be verified.");
        }
        props.put("previewOnly",false);
        props.put("directorCpuApproved",true);
        props.put("scriptRevision",selected.revision());
        props.put("voiceTakeId",ready.selectedTakeId());
        props.put("voiceAudioSha256",selected.audioSha());
        props.put("voiceAudioBytes",selected.audioBytes());
        props.put("narrationSha256",ready.narrationSha256());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("eventFrames",ready.eventFrames());
        props.put("visualBeats",beats);
        props.put("shotTitle",selected.title());
        props.put("expectedSourceCommit",request.expectedSourceCommit());
        props.put("packageId",packageId.toString());
        props.put("renderRequestId",request.requestId().toString());
        return renders.ensureVerifiedEp004Shot15Preview(props);
    }
}
