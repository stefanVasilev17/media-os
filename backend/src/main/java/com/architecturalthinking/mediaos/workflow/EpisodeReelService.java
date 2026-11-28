package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodeReelService {
    private static final Logger LOG=LoggerFactory.getLogger(EpisodeReelService.class);
    private static final long MAX_MASTER=1024L*1024*1024;
    private static final long MAX_RETAINED=2L*1024*1024*1024;
    private static final Map<String,String> EP004=Map.of(
        "SHOT02","The Hidden Assumption Behind Failover",
        "SHOT04","When Faster Hardware Reveals Hidden Concurrency Bugs",
        "SHOT05","How Missing Capacity Amplifies Failure",
        "SHOT06","Why Traffic Volume Can Be Misleading",
        "SHOT07","When Failover Spreads the Failure",
        "SHOT09","Healthy Does Not Mean Ready",
        "SHOT10","Restarting a Server Is Not Recovery",
        "SHOT13","High Availability Can Still Fail",
        "SHOT14","Local Success, Global Failure");
    private final JdbcClient jdbc;
    private final MediaObjectStore store;
    public EpisodeReelService(JdbcClient jdbc,MediaObjectStore store){this.jdbc=jdbc;this.store=store;}

    record Owner(String episodeKey,int shots,DirectorIdentity.Actor actor){}
    public record Master(UUID filmId,String sha256,int frames,String videoUrl){}
    record Source(UUID filmId,String sha,String key,long bytes,int frames,int shots,String renderIds){}
    record Shot(String key,String title,UUID renderId,int frames){}
    public record Candidate(String shotKey,String title,int startFrame,int endFrame,boolean recommended){}
    public record Reel(UUID id,UUID filmId,String title,int startFrame,int endFrame,String state,
                       String method,String issue,String sha256,Long byteCount,String videoUrl){}
    record Job(UUID id,UUID packageId,UUID filmId,String sha,int first,int end){}
    record Media(String key,String sha,long bytes){}
    public record View(String episodeKey,Master master,List<Candidate> candidates,List<Reel> reels,String message){}
    public record Extract(String masterSha256,Integer startFrame,Integer endFrame,String title,Boolean confirm){}
    public record Lock(String sha256,Boolean confirm){}
    private static ResponseStatusException conflict(String reason){return new ResponseStatusException(HttpStatus.CONFLICT,reason);}
    private static ResponseStatusException bad(String reason){return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    private Owner owner(UUID id,boolean lock){
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("select episode_key,shot_count from episode_package_import where id=:id and director_issuer=:issuer and director_subject=:subject"+(lock?" for update":""))
            .param("id",id).param("issuer",actor.issuer()).param("subject",actor.subject())
            .query((rs,i)->new Owner(rs.getString(1),rs.getInt(2),actor)).optional()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Director-owned episode was not found."));
    }
    private Source source(UUID id,int shots){
        return jdbc.sql("""
          select film_id,sha256,object_key,byte_count,duration_in_frames,shot_count,render_ids
          from episode_director_film f where package_id=:id and shot_count=:count
            and render_ids=(select string_agg(l.render_id::text,',' order by l.shot_key)
                from episode_director_shot_lock l where l.package_id=f.package_id)
            and sha256 ~ '^[a-f0-9]{64}$' and duration_in_frames>0
          """).param("id",id).param("count",shots).query((rs,i)->new Source(rs.getObject(1,UUID.class),
             rs.getString(2),rs.getString(3),rs.getLong(4),rs.getInt(5),rs.getInt(6),rs.getString(7)))
             .optional().orElse(null);
    }
    private List<Candidate> candidates(UUID id,Owner owner,Source source){
        List<Shot> shots=jdbc.sql("""
          select s.shot_key,s.title,l.render_id,r.duration_in_frames from episode_package_shot s
          join episode_director_shot_lock l on l.package_id=s.package_id and l.shot_key=s.shot_key
          join remotion_render r on r.id=l.render_id
          where s.package_id=:id and r.status='SUCCEEDED' and r.fps=30
          order by s.shot_key
          """).param("id",id).query((rs,i)->new Shot(rs.getString(1),rs.getString(2),rs.getObject(3,UUID.class),rs.getInt(4))).list();
        if(shots.size()!=source.shots()||!String.join(",",shots.stream().map(s->s.renderId().toString()).toList()).equals(source.renderIds())
            ||shots.stream().anyMatch(s->s.frames()<=0)||shots.stream().mapToLong(Shot::frames).sum()!=source.frames())
            return List.of();
        List<Candidate> result=new ArrayList<>();
        int first=0;
        for(Shot shot:shots){
            int end=first+shot.frames();
            boolean recommended="EP004".equals(owner.episodeKey())&&EP004.containsKey(shot.key());
            if(shot.frames()<=5400)result.add(new Candidate(shot.key(),
                recommended?EP004.get(shot.key()):shot.title(),first,end,recommended));
            first=end;
        }
        return result.stream().sorted(Comparator.comparing(Candidate::recommended).reversed().thenComparingInt(Candidate::startFrame)).toList();
    }
    private String url(UUID id,UUID reel){return "/api/v1/episode-packages/"+id+"/reels/"+reel+"/video";}
    private List<Reel> reels(UUID id){
        return jdbc.sql("select * from episode_reel where package_id=:id order by start_frame,created_at")
            .param("id",id).query((rs,i)->new Reel(rs.getObject("id",UUID.class),rs.getObject("film_id",UUID.class),
                rs.getString("title"),rs.getInt("start_frame"),rs.getInt("end_frame"),rs.getString("state"),
                rs.getString("method"),rs.getString("issue"),rs.getString("sha256"),(Long)rs.getObject("byte_count"),
                rs.getString("object_key")==null?null:url(id,rs.getObject("id",UUID.class)))).list();
    }
    @Transactional(readOnly=true)
    public View get(UUID id){return snapshot(id,owner(id,false));}
    private View snapshot(UUID id,Owner owner){
        Source s=source(id,owner.shots());
        if(s==null)return new View(owner.episodeKey(),null,List.of(),reels(id),"Finish and lock all SHOTs before extracting from Full Video.");
        List<Candidate> cs=candidates(id,owner,s);
        return new View(owner.episodeKey(),new Master(s.filmId(),s.sha(),s.frames(),
            "/api/v1/episode-packages/"+id+"/film/video?v="+s.filmId()),cs,reels(id),
            cs.isEmpty()?"Exact SHOT boundaries unavailable. Only a manually reviewed master interval may be used.":null);
    }
    @Transactional
    public View extract(UUID id,Extract request,UUID audit){
        Owner owner=owner(id,true);
        if(request==null||!Boolean.TRUE.equals(request.confirm())||audit==null)
            throw conflict("Explicit Director extraction consent is required.");
        Source s=source(id,owner.shots());
        if(s==null||!s.sha().equals(request.masterSha256()))throw conflict("Current Full Video changed. Refresh first.");
        if(s.bytes()>MAX_MASTER)throw conflict("Master exceeds the current bounded extraction capacity.");
        if(request.startFrame()==null||request.endFrame()==null)throw bad("Exact frame range required.");
        try{DirectReelExtractor.validateRange(request.startFrame(),request.endFrame(),s.frames());}
        catch(IllegalArgumentException ex){throw bad(ex.getMessage());}
        String title=request.title()==null?"":request.title().strip();
        if(title.isEmpty()||title.length()>160)throw bad("A title of up to 160 characters is required.");
        store.requireWritable();
        store.verifyVideoManifest(s.key(),s.sha(),s.bytes());
        // Bound both pending work and retained bytes; no creative clip quota.
        long reserved=jdbc.sql("""
          select coalesce(sum(case when state in ('QUEUED','RUNNING') then 134217728 else coalesce(byte_count,0) end),0)
          from episode_reel where package_id=:id
          """).param("id",id).query(Long.class).single()+verticalReserved(id);
        var existing=jdbc.sql("""
            select state from episode_reel where package_id=:id and film_id=:film and start_frame=:first and end_frame=:end
            """).param("id",id).param("film",s.filmId()).param("first",request.startFrame())
            .param("end",request.endFrame()).query(String.class).optional();
        if(existing.isPresent()&&!"FAILED".equals(existing.get()))return snapshot(id,owner);
        if(reserved+DirectReelExtractor.MAX_BYTES>MAX_RETAINED)
            throw conflict("Episode reel storage budget reached. Review retained media before requesting more.");
        jdbc.sql("""
          insert into episode_reel(id,package_id,film_id,master_sha256,title,start_frame,end_frame,state,audit_id,actor)
          values(:reel,:id,:film,:sha,:title,:first,:end,'QUEUED',:audit,:actor)
          on conflict(package_id,film_id,start_frame,end_frame) do update
            set state='QUEUED',issue=null,audit_id=excluded.audit_id,actor=excluded.actor,
                title=excluded.title,updated_at=now()
          where episode_reel.state='FAILED'
          """).param("reel",UUID.randomUUID()).param("id",id).param("film",s.filmId())
            .param("sha",s.sha()).param("title",title).param("first",request.startFrame()).param("end",request.endFrame())
            .param("audit",audit).param("actor",owner.actor().auditName()).update();
        return snapshot(id,owner);
    }
    @Transactional
    public View lock(UUID id,UUID reel,Lock request){
        Owner owner=owner(id,true);
        if(request==null||!Boolean.TRUE.equals(request.confirm()))throw conflict("Review the actual clip before LOCK.");
        Source s=source(id,owner.shots());
        if(s==null)throw conflict("Current Full Video is not ready.");
        Media m=media(id,reel);
        if(!m.sha().equals(request.sha256()))throw conflict("Clip identity changed.");
        store.verifyVideoManifest(m.key(),m.sha(),m.bytes());
        int n=jdbc.sql("""
          update episode_reel set state='LOCKED',locked_at=now(),updated_at=now()
          where id=:reel and package_id=:id and state='READY' and film_id=:film and master_sha256=:sha
          """).param("id",id).param("reel",reel).param("film",s.filmId()).param("sha",s.sha()).update();
        if(n!=1)throw conflict("Only a ready clip from the current master can be locked.");
        return snapshot(id,owner);
    }
    private Media media(UUID id,UUID reel){
        return jdbc.sql("""
          select object_key,sha256,byte_count from episode_reel where id=:reel and package_id=:id and state in ('READY','LOCKED')
          """).param("id",id).param("reel",reel).query((rs,i)->new Media(rs.getString(1),rs.getString(2),rs.getLong(3)))
            .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Extract not ready."));
    }
    @Transactional(readOnly=true)
    public Media authorizedMedia(UUID id,UUID reel){owner(id,false);return media(id,reel);}

    // Existing backend assembly scheduler; one bounded technical extraction at a time.
    // No unattended new work: every queued row carries an audited Director request.
    @Scheduled(initialDelay=20000,fixedDelay=5000)
    public void process(){
        Job job=null;Path dir=null;MediaObjectStore.Stored saved=null;boolean committed=false;
        try{
            jdbc.sql("""
              update episode_reel set state='FAILED',lease_until=null,issue='Extraction interrupted. Retry explicitly.',updated_at=now()
              where state='RUNNING' and lease_until<now()
              """).update();
            job=jdbc.sql("""
              with next_job as (
                select id from episode_reel where state='QUEUED'
                  and not exists(select 1 from episode_reel where state='RUNNING')
                  and not exists(select 1 from episode_reel_vertical where state='RUNNING')
                  and not exists(select 1 from episode_director_film_job where status in ('QUEUED','RUNNING'))
                order by created_at limit 1 for update skip locked
              )
              update episode_reel r set state='RUNNING',lease_until=now()+interval '30 minutes',updated_at=now()
                from next_job where r.id=next_job.id
              returning r.id,r.package_id,r.film_id,r.master_sha256,r.start_frame,r.end_frame
              """).query((rs,i)->new Job(rs.getObject(1,UUID.class),rs.getObject(2,UUID.class),
                rs.getObject(3,UUID.class),rs.getString(4),rs.getInt(5),rs.getInt(6))).optional().orElse(null);
            if(job==null){processVertical();return;}
            int count=jdbc.sql("select shot_count from episode_package_import where id=:id").param("id",job.packageId()).query(Integer.class).single();
            Source s=source(job.packageId(),count);
            if(s==null||!s.filmId().equals(job.filmId())||!s.sha().equals(job.sha())||s.bytes()>MAX_MASTER)
                throw conflict("Master changed; select the new version.");
            store.requireWritable();
            dir=Files.createTempDirectory("mediaos-direct-reel-");
            if(Files.getFileStore(dir).getUsableSpace()<s.bytes()+DirectReelExtractor.MAX_BYTES+256L*1024*1024)
                throw conflict("Not enough bounded scratch space.");
            Path input=dir.resolve("master.mp4"),output=dir.resolve("reel.mp4");
            try(var out=Files.newOutputStream(input)){store.streamVideoRange(s.key(),s.sha(),s.bytes(),0,s.bytes()-1,out);}
            if(Files.size(input)!=s.bytes()||!MediaObjectStore.sha256(input).equals(s.sha()))
                throw conflict("Master checksum mismatch.");
            String method=DirectReelExtractor.extract(input,output,job.first(),job.end(),s.frames());
            Source current=source(job.packageId(),count);
            if(current==null||!current.filmId().equals(s.filmId())||!current.sha().equals(s.sha()))throw conflict("Master changed during extraction.");
            saved=store.uploadReelVerified(UUID.randomUUID(),output);
            int updated=jdbc.sql("""
              update episode_reel set state='READY',object_key=:key,sha256=:sha,byte_count=:bytes,method=:method,
                lease_until=null,issue=null,updated_at=now()
              where id=:id and state='RUNNING' and film_id=:film and master_sha256=:master
                and exists(select 1 from episode_director_film f where f.package_id=episode_reel.package_id
                   and f.film_id=:film and f.sha256=:master)
              """).param("key",saved.key()).param("sha",saved.sha256()).param("bytes",saved.byteCount())
                .param("method",method).param("id",job.id()).param("film",job.filmId()).param("master",job.sha()).update();
            if(updated!=1)throw conflict("Extract no longer current.");
            committed=true;
            LOG.info("DIRECT_REEL_READY id={} frames={} method={} bytes={}",job.id(),job.end()-job.first(),method,saved.byteCount());
        }catch(Exception failure){
            if(failure instanceof InterruptedException)Thread.currentThread().interrupt();
            LOG.warn("Direct reel extraction failed; original master preserved",failure);
            if(job!=null){
                try{jdbc.sql("update episode_reel set state='FAILED',lease_until=null,issue='Extraction failed. Original video is safe; retry after review.',updated_at=now() where id=:id and state='RUNNING'")
                    .param("id",job.id()).update();}catch(Exception db){LOG.error("Reel state update failed",db);}
            }
        }finally{
            if(saved!=null&&!committed){
                try{
                    boolean referenced=jdbc.sql("select exists(select 1 from episode_reel where object_key=:key)")
                        .param("key",saved.key()).query(Boolean.class).single();
                    if(!referenced)store.discardUncommittedVideo(saved.key(),saved.sha256(),saved.byteCount());
                }catch(Exception cleanup){LOG.error("Uncommitted reel object requires audit",cleanup);}
            }
            if(dir!=null)try(var files=Files.walk(dir)){
                for(Path f:files.sorted(Comparator.reverseOrder()).toList())Files.deleteIfExists(f);
            }catch(Exception cleanup){LOG.warn("Reel scratch cleanup failed",cleanup);}
        }
    }

    public record Vertical(UUID reelId,String title,String state,String templateVersion,String sourceSha256,
                           String sha256,Long byteCount,String issue,String videoUrl,Integer focusStartFrame){}
    public record PackageVertical(String sourceSha256,Boolean confirm){}
    record VerticalSource(UUID reelId,UUID packageId,String title,int frames,String key,String sha,long bytes,int first,int end){}
    record VerticalJob(UUID reelId,String version,Integer focus){}
    private VerticalSource verticalSource(UUID id,UUID reel){
        return jdbc.sql("""
          select r.id,r.package_id,r.title,r.end_frame-r.start_frame,r.object_key,r.sha256,r.byte_count,r.start_frame,r.end_frame
          from episode_reel r join episode_director_film f on f.package_id=r.package_id
          join episode_package_import p on p.id=r.package_id
          where r.package_id=:id and r.id=:reel and r.state='LOCKED' and r.film_id=f.film_id
            and r.master_sha256=f.sha256 and f.shot_count=p.shot_count
            and f.render_ids=(select string_agg(l.render_id::text,',' order by l.shot_key)
                from episode_director_shot_lock l where l.package_id=f.package_id)
          """).param("id",id).param("reel",reel).query((rs,i)->new VerticalSource(rs.getObject(1,UUID.class),
             rs.getObject(2,UUID.class),rs.getString(3),rs.getInt(4),rs.getString(5),rs.getString(6),rs.getLong(7),rs.getInt(8),rs.getInt(9)))
             .optional().orElseThrow(()->conflict("A locked reel from the current master is required."));
    }
    // Exact scene-specific recipe: audited source commit and locked render ID, verified frame
    // lineage and actual REEL_START. Other scenes always keep the complete frame.
    Integer verifiedFocusStart(VerticalSource clip){
        return jdbc.sql("""
          with ordered as (
            select l.shot_key,l.render_id,r.duration_in_frames,r.input_props,
              coalesce(sum(r.duration_in_frames) over(order by l.shot_key rows between unbounded preceding and 1 preceding),0)::integer as first_frame,
              sum(r.duration_in_frames) over() as total_frames
            from episode_director_shot_lock l join remotion_render r on r.id=l.render_id
            where l.package_id=:id and r.status='SUCCEEDED' and r.fps=30
          )
          select greatest(0,o.first_frame+1368-:first) as focus
          from ordered o join episode_director_film f on f.package_id=:id
          join episode_package_import p on p.id=f.package_id
          where p.episode_key='EP004' and o.shot_key='SHOT07'
            and o.render_id=cast('c51cbbda-f832-4c46-8a37-cc3116f50e1f' as uuid)
            and o.duration_in_frames=2606 and o.total_frames=f.duration_in_frames
            and o.input_props->>'expectedSourceCommit'='232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56'
            and o.input_props->'eventFrames'->>'REEL_START'='1368'
            and :first>=o.first_frame and :end<=o.first_frame+o.duration_in_frames
            and :end>o.first_frame+1368
          """).param("id",clip.packageId()).param("first",clip.first()).param("end",clip.end())
            .query(Integer.class).optional().orElse(null);
    }
    private long verticalReserved(UUID id){
        return jdbc.sql("""
          select coalesce(sum(case when v.state in ('QUEUED','RUNNING') then 134217728 else coalesce(v.byte_count,0) end),0)
          from episode_reel_vertical v join episode_reel r on r.id=v.reel_id where r.package_id=:id
          """).param("id",id).query(Long.class).single();
    }
    private List<Vertical> verticals(UUID id){
        return jdbc.sql("""
          select v.*,r.title from episode_reel_vertical v join episode_reel r on r.id=v.reel_id
          where r.package_id=:id order by r.start_frame,r.created_at,v.template_version
          """).param("id",id).query((rs,i)->new Vertical(rs.getObject("reel_id",UUID.class),
            rs.getString("title"),rs.getString("state"),rs.getString("template_version"),rs.getString("source_sha256"),
            rs.getString("sha256"),(Long)rs.getObject("byte_count"),rs.getString("issue"),
            rs.getString("object_key")==null?null:"/api/v1/episode-packages/"+id+"/reels/"+rs.getObject("reel_id",UUID.class)+"/vertical/video?version="+rs.getString("template_version"),(Integer)rs.getObject("focus_start_frame"))).list();
    }
    @Transactional(readOnly=true)
    public List<Vertical> vertical(UUID id){owner(id,false);return verticals(id);}
    @Transactional
    public List<Vertical> packageVertical(UUID id,UUID reel,PackageVertical request,UUID audit){
        Owner owner=owner(id,true);
        if(request==null||!Boolean.TRUE.equals(request.confirm())||audit==null)throw conflict("Explicit technical packaging consent required.");
        VerticalSource s=verticalSource(id,reel);
        if(!s.sha().equals(request.sourceSha256()))throw conflict("Locked source identity changed.");
        store.requireWritable();store.verifyVideoManifest(s.key(),s.sha(),s.bytes());
        var existing=verticals(id).stream().filter(v->v.reelId().equals(reel)&&VerticalReelPackagerV2.VERSION.equals(v.templateVersion())).findFirst();
        if(existing.isPresent()&&!"FAILED".equals(existing.get().state()))return verticals(id);
        long reserved=jdbc.sql("""
          select coalesce(sum(case when state in ('QUEUED','RUNNING') then 134217728 else coalesce(byte_count,0) end),0)
          from episode_reel where package_id=:id
          """).param("id",id).query(Long.class).single()+verticalReserved(id);
        if(reserved+DirectReelExtractor.MAX_BYTES>MAX_RETAINED)throw conflict("Vertical reel storage budget reached.");
        jdbc.sql("""
          insert into episode_reel_vertical(reel_id,source_sha256,template_version,state,audit_id,actor,focus_start_frame)
          values(:reel,:sha,:template,'QUEUED',:audit,:actor,:focus)
          on conflict(reel_id,template_version) do update set state='QUEUED',issue=null,audit_id=excluded.audit_id,actor=excluded.actor,focus_start_frame=excluded.focus_start_frame,updated_at=now()
          where episode_reel_vertical.state='FAILED' and episode_reel_vertical.source_sha256=excluded.source_sha256
          """).param("reel",reel).param("sha",s.sha()).param("template",VerticalReelPackagerV2.VERSION).param("focus",verifiedFocusStart(s),java.sql.Types.INTEGER)
            .param("audit",audit).param("actor",owner.actor().auditName()).update();
        return verticals(id);
    }
    @Transactional
    public List<Vertical> lockVertical(UUID id,UUID reel,Lock request){
        owner(id,true);VerticalSource s=verticalSource(id,reel);
        if(request==null||!Boolean.TRUE.equals(request.confirm()))throw conflict("Review actual vertical video before LOCK.");
        Media m=verticalMedia(id,reel,VerticalReelPackagerV2.VERSION);
        if(!m.sha().equals(request.sha256()))throw conflict("Vertical artifact identity changed.");
        store.verifyVideoManifest(m.key(),m.sha(),m.bytes());
        int n=jdbc.sql("""
          update episode_reel_vertical set state='LOCKED',locked_at=now(),updated_at=now()
          where reel_id=:reel and template_version='AT_VERTICAL_V2' and source_sha256=:source and sha256=:sha and state='READY'
          """).param("reel",reel).param("source",s.sha()).param("sha",m.sha()).update();
        if(n!=1)throw conflict("Only the reviewed current vertical artifact can be locked.");
        return verticals(id);
    }
    private Media verticalMedia(UUID id,UUID reel,String version){
        if(!List.of(VerticalReelPackager.VERSION,VerticalReelPackagerV2.VERSION).contains(version))throw bad("Unknown packaging version.");
        return jdbc.sql("""
          select v.object_key,v.sha256,v.byte_count from episode_reel_vertical v join episode_reel r on r.id=v.reel_id
          where r.package_id=:id and v.reel_id=:reel and v.template_version=:version and v.state in ('READY','LOCKED') and r.state='LOCKED'
            and v.source_sha256=r.sha256
          """).param("id",id).param("reel",reel).param("version",version).query((rs,i)->new Media(rs.getString(1),rs.getString(2),rs.getLong(3)))
            .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Vertical export not ready."));
    }
    @Transactional(readOnly=true)
    public Media authorizedVerticalMedia(UUID id,UUID reel,String version){owner(id,false);return verticalMedia(id,reel,version);}

    // Called only by the existing direct reel scheduler when no direct extraction is available.
    private void processVertical(){
        VerticalJob job=null;Path dir=null;MediaObjectStore.Stored saved=null;boolean committed=false;
        try{
            jdbc.sql("""
              update episode_reel_vertical set state='FAILED',lease_until=null,issue='Packaging interrupted. Retry explicitly.',updated_at=now()
              where state='RUNNING' and lease_until<now()
              """).update();
            job=jdbc.sql("""
              with next_job as (
                select reel_id,template_version from episode_reel_vertical where state='QUEUED'
                  and not exists(select 1 from episode_reel_vertical where state='RUNNING')
                  and not exists(select 1 from episode_reel where state in ('QUEUED','RUNNING'))
                  and not exists(select 1 from episode_director_film_job where status in ('QUEUED','RUNNING'))
                order by created_at limit 1 for update skip locked
              )
              update episode_reel_vertical v set state='RUNNING',lease_until=now()+interval '30 minutes',updated_at=now()
              from next_job where v.reel_id=next_job.reel_id and v.template_version=next_job.template_version
                returning v.reel_id,v.template_version,v.focus_start_frame
              """).query((rs,i)->new VerticalJob(rs.getObject(1,UUID.class),rs.getString(2),(Integer)rs.getObject(3))).optional().orElse(null);
            if(job==null)return;
            UUID reel=job.reelId();String version=job.version();
            UUID id=jdbc.sql("select package_id from episode_reel where id=:reel").param("reel",reel).query(UUID.class).single();
            VerticalSource s=verticalSource(id,reel);
            String expected=jdbc.sql("select source_sha256 from episode_reel_vertical where reel_id=:reel and template_version=:version")
                .param("reel",reel).param("version",version).query(String.class).single();
            if(!s.sha().equals(expected)||s.bytes()>DirectReelExtractor.MAX_BYTES)throw conflict("Original clip identity or size invalid.");
            store.requireWritable();
            dir=Files.createTempDirectory("mediaos-vertical-reel-");
            if(Files.getFileStore(dir).getUsableSpace()<s.bytes()+DirectReelExtractor.MAX_BYTES+256L*1024*1024)
                throw conflict("Not enough bounded scratch space.");
            Path input=dir.resolve("source.mp4"),output=dir.resolve("vertical.mp4");
            try(var out=Files.newOutputStream(input)){store.streamVideoRange(s.key(),s.sha(),s.bytes(),0,s.bytes()-1,out);}
            if(Files.size(input)!=s.bytes()||!MediaObjectStore.sha256(input).equals(s.sha()))throw conflict("Locked reel checksum mismatch.");
            if(VerticalReelPackagerV2.VERSION.equals(version)){
                if(!java.util.Objects.equals(job.focus(),verifiedFocusStart(s)))throw conflict("Verified framing source changed.");
                VerticalReelPackagerV2.packageClip(input,output,s.frames(),s.title(),job.focus());
            }else if(VerticalReelPackager.VERSION.equals(version))VerticalReelPackager.packageClip(input,output,s.frames(),s.title());
            else throw conflict("Unknown packaging version.");
            if(!verticalSource(id,reel).sha().equals(expected))throw conflict("Locked source changed during packaging.");
            saved=store.uploadReelVerified(UUID.randomUUID(),output);
            int n=jdbc.sql("""
              update episode_reel_vertical v set state='READY',object_key=:key,sha256=:sha,byte_count=:bytes,
                lease_until=null,issue=null,updated_at=now()
              where reel_id=:reel and template_version=:version and state='RUNNING' and source_sha256=:source
                and exists(select 1 from episode_reel r join episode_director_film f on f.package_id=r.package_id
                  where r.id=v.reel_id and r.state='LOCKED' and r.sha256=:source and r.film_id=f.film_id and r.master_sha256=f.sha256)
              """).param("key",saved.key()).param("sha",saved.sha256()).param("bytes",saved.byteCount())
                .param("reel",reel).param("version",version).param("source",expected).update();
            if(n!=1)throw conflict("Vertical source no longer current.");
            committed=true;LOG.info("VERTICAL_REEL_READY source={} version={} focus={} frames={} bytes={}",reel,version,job.focus(),s.frames(),saved.byteCount());
        }catch(Exception failure){
            if(failure instanceof InterruptedException)Thread.currentThread().interrupt();
            LOG.warn("Vertical reel packaging failed; locked originals preserved",failure);
            if(job!=null)try{
                jdbc.sql("update episode_reel_vertical set state='FAILED',lease_until=null,issue='Packaging failed. Locked original is safe; retry explicitly.',updated_at=now() where reel_id=:reel and template_version=:version and state='RUNNING'")
                    .param("reel",job.reelId()).param("version",job.version()).update();
            }catch(Exception db){LOG.error("Vertical reel state update failed",db);}
        }finally{
            if(saved!=null&&!committed)try{
                boolean referenced=jdbc.sql("select exists(select 1 from episode_reel_vertical where object_key=:key)")
                    .param("key",saved.key()).query(Boolean.class).single();
                if(!referenced)store.discardUncommittedVideo(saved.key(),saved.sha256(),saved.byteCount());
            }catch(Exception cleanup){LOG.error("Uncommitted vertical reel object requires audit",cleanup);}
            if(dir!=null)try(var files=Files.walk(dir)){
                for(Path f:files.sorted(Comparator.reverseOrder()).toList())Files.deleteIfExists(f);
            }catch(Exception cleanup){LOG.warn("Vertical scratch cleanup failed",cleanup);}
        }
    }
}
