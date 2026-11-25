package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

public final class Ep004Shot10ReadOnlyPreflight {
    private static final Logger LOG=LoggerFactory.getLogger(Ep004Shot10ReadOnlyPreflight.class);
    private static final UUID PACKAGE=UUID.fromString("d11d02a2-b649-44c9-a022-4405149f675e");
    private static final UUID PREVIOUS=UUID.fromString("e9a8aa58-61e3-4739-a4c1-32efd13d5426");
    private static final String PREVIOUS_COMMIT="85efc3127dc9e40accbee0bea44e9309395e64bb";
    private static final String ORIGINAL_NARRATION="The hardest part of an outage can arrive during recovery. Engineers restart a gateway server, and it begins responding again. But waiting connections have not disappeared. Microsoft reported that recovered servers could become unresponsive as soon as traffic returned. Its normal automated recovery was not designed for so much of the gateway fleet to be unresponsive at once.\n\nRestarting a server is not the same as recovering a service. A restart may clear the current bad state, but it does not erase the requests waiting outside. Imagine a gateway comes back online and the router immediately sends it all the traffic it missed. The same hidden software problem appears under the returning load. The gateway stops responding again. Now the system has to recover twice. That is why large-scale recovery often needs controlled traffic admission, not just more restarts. The goal is not to make the server start. The goal is to keep it serving real users.";
    private static final List<String> BEATS=List.of("SHOT10_P01_B01","SHOT10_P01_B02","SHOT10_P01_B03","SHOT10_P02_B01","SHOT10_P02_B02","SHOT10_P02_B03");
    private static final List<Map.Entry<String,String>> EVENTS=List.of(Map.entry("RESTART","Engineers restart a gateway server"),
        Map.entry("RESPONDING","it begins responding again"),
        Map.entry("WAITING","But waiting connections have not disappeared"),
        Map.entry("RETURNED","as soon as traffic returned"),
        Map.entry("FLEET","Its normal automated recovery was not designed"),
        Map.entry("REPLAY","Restarting a server is not the same as"),
        Map.entry("BACKLOG","it does not erase the requests waiting outside"),
        Map.entry("ONLINE","Imagine a gateway comes back online"),
        Map.entry("RUSH","and the router immediately sends it all"),
        Map.entry("CONTENTION","The same hidden software problem appears"),
        Map.entry("RELAPSE","The gateway stops responding again"),
        Map.entry("TWICE","Now the system has to recover twice"),
        Map.entry("CONTROL","controlled traffic admission"),
        Map.entry("GOAL","The goal is to keep it serving real users"));
    private final JdbcClient jdbc;
    private final MediaObjectStore storage;
    private final EpisodePackageVoiceReadinessService voices;
    private final EpisodePackageCueTimingVerifier timing;
    private final ObjectMapper mapper;
    private final AtomicBoolean done=new AtomicBoolean();
    public Ep004Shot10ReadOnlyPreflight(JdbcClient jdbc,MediaObjectStore storage,
        EpisodePackageVoiceReadinessService voices,EpisodePackageCueTimingVerifier timing,ObjectMapper mapper){
        this.jdbc=jdbc;this.storage=storage;this.voices=voices;this.timing=timing;this.mapper=mapper;
    }
    record Owner(String issuer,String subject){}
    record Take(UUID id,String narration,String key,String sha,long bytes,BigDecimal duration,String alignment){}
    record Previous(String key,String sha,long bytes){}
    @Scheduled(initialDelay=20000,fixedDelay=60000)
    public void verify(){
        String source=System.getenv("RAILWAY_GIT_COMMIT_SHA");
        if(source==null||!source.matches("[a-f0-9]{40}")||!done.compareAndSet(false,true))return;
        try{
            if(jdbc.sql("select exists(select 1 from episode_director_shot_lock where package_id=:p and shot_key='SHOT10')").param("p",PACKAGE).query(Boolean.class).single())return;
            Owner owner=jdbc.sql("""
                select director_issuer,director_subject from episode_package_import
                where id=:p and episode_key='EP004' and source_sha256=:sha
                """).param("p",PACKAGE).param("sha",Ep004Shot01DirectorRenderService.SOURCE_SHA)
                .query((rs,n)->new Owner(rs.getString(1),rs.getString(2))).optional().orElseThrow();
            var report=voices.reportOwnedPackage(PACKAGE,owner.issuer(),owner.subject());
            var shot=report.shots().stream().filter(s->"SHOT10".equals(s.shotKey())).findFirst().orElseThrow();
            if(!"VOICE_READY".equals(shot.status())){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED voiceStatus={} blockers={}",shot.status(),shot.blockers());return;}
            if(!shot.verifiedCues().stream().map(c->c.beatId()).toList().equals(BEATS)){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED ORIGINAL_BEATS_MISMATCH");return;}
            Take take=jdbc.sql("""
                select t.id,rev.narration,t.audio_object_key,t.audio_sha256,t.audio_size_bytes,
                       t.duration_seconds,t.generated_alignment::text
                from episode_package_shot s
                join episode_package_shot_revision rev on rev.shot_id=s.id and rev.revision=:rev
                join episode_package_voice_take t on t.shot_id=s.id and t.revision=rev.revision
                where s.package_id=:p and s.shot_key='SHOT10' and t.id=:take
                  and t.storage_status='OBJECT_VERIFIED' and t.audio_sha256 ~ '^[a-f0-9]{64}$'
                  and t.audio_size_bytes between 512 and 25165824
                """).param("rev",shot.revision()).param("p",PACKAGE)
                .param("take",UUID.fromString(shot.selectedTakeId()))
                .query((rs,n)->new Take(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getString(4),rs.getLong(5),rs.getBigDecimal(6),rs.getString(7))).optional().orElseThrow();
            if(!ORIGINAL_NARRATION.equals(take.narration())||take.key()==null||!take.key().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT10/")){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED ORIGINAL_NARRATION_OR_VOICE_KEY_MISMATCH");return;}
            storage.downloadVerified(take.key(),take.sha(),take.bytes());
            Previous previous=jdbc.sql("""
                select r.video_object_key,r.video_sha256,r.video_object_bytes
                from episode_director_shot_lock l join remotion_render r on r.id=l.render_id
                where l.package_id=:p and l.shot_key='SHOT09' and r.id=:id
                  and r.composition_id=:composition and r.status='SUCCEEDED' and r.profile='REVIEW'
                  and r.project_id='11111111-1111-1111-1111-111111111111'::uuid
                  and r.width=1920 and r.height=1080 and r.fps=30 and r.duration_in_frames=2457
                  and r.input_props->>'packageId'=:packageText and r.input_props->>'episodeKey'='EP004'
                  and r.input_props->>'shotKey'='SHOT09' and r.input_props->>'sourceSha256'=:source
                  and r.input_props->>'expectedSourceCommit'=:commit
                  and r.input_props->>'directorCpuApproved'='true' and r.input_props->>'previewOnly'='false'
                  and r.video_sha256 ~ '^[a-f0-9]{64}$' and r.video_object_bytes between 1024 and 134217728
                  and r.video_object_key is not null
                """).param("p",PACKAGE).param("id",PREVIOUS).param("composition",Ep004Shot09DirectorRenderService.COMPOSITION)
                .param("packageText",PACKAGE.toString()).param("source",Ep004Shot01DirectorRenderService.SOURCE_SHA)
                .param("commit",PREVIOUS_COMMIT)
                .query((rs,n)->new Previous(rs.getString(1),rs.getString(2),rs.getLong(3))).optional().orElseThrow();
            storage.downloadVideoVerified(previous.key(),previous.sha(),previous.bytes());
            var story=mapper.createObjectNode();
            var beats=story.putArray("visualBeats");
            for(var event:EVENTS){var b=beats.addObject();b.put("beatId",event.getKey());b.put("cueAnchor",event.getValue());}
            var events=timing.verify(take.narration(),story.toString(),take.alignment(),take.duration());
            if(!events.verified()||events.cues().size()!=EVENTS.size()){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED EVENT_ALIGNMENT_{}",events.failureCode());return;}
            Map<String,Integer> clock=new LinkedHashMap<>(),original=new LinkedHashMap<>();
            for(var cue:events.cues())clock.put(cue.beatId(),72+(int)Math.round(cue.startSeconds()*30));
            for(var cue:shot.verifiedCues())original.put(cue.beatId(),72+(int)Math.round(cue.startSeconds()*30));
            int frames=72+(int)Math.ceil(take.duration().doubleValue()*30)+45;
            if(frames<600||frames>9000||!storage.writable()){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED DURATION_OR_STORAGE");return;}
            LOG.info("EP004_SHOT10_INPUT_PREFLIGHT_PASS source={} frames={} cues={} voiceShaVerified=true previousVideoShaVerified=true revision={}",source,frames,original.size(),shot.revision());
            LOG.info("EP004_SHOT10_ORIGINAL_CUE_CLOCK {}",original);
            LOG.info("EP004_SHOT10_VERIFIED_EVENT_CLOCK {}",clock);
        }catch(Exception e){LOG.warn("EP004_SHOT10_INPUT_PREFLIGHT_BLOCKED type={}",e.getClass().getSimpleName());}
    }
}
