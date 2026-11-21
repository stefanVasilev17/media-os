package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/film")
public final class Ep004DirectorSimpleFilmController {
    private static final String PROJECT_ID="11111111-1111-1111-1111-111111111111";
    private static final int FPS=30;
    private static final long MAX_INPUT_BYTES=MediaObjectStore.MAX_FILM_BYTES
        -8L*1024*1024;
    private static final Logger LOG=LoggerFactory.getLogger(Ep004DirectorSimpleFilmController.class);
    private final JdbcClient jdbc;
    private final MediaObjectStore store;

    public Ep004DirectorSimpleFilmController(JdbcClient jdbc,MediaObjectStore store) {
        this.jdbc=jdbc;this.store=store;
    }

    public record LockRequest(UUID renderId,Boolean confirmLock) {}
    record ShotLock(String shotKey,UUID renderId,OffsetDateTime lockedAt) {}
    record VideoSource(String shotKey,UUID renderId,String objectKey,String sha256,
                       long bytes,int frames,String sourceCommit,String voiceTakeId,
                       int scriptRevision) {}
    record Film(UUID id,String objectKey,String sha256,long bytes,int count,
                String renderIds,int frames) {}
    record AssemblyJob(UUID packageId,String sequence) {}
    record AssemblyState(String sequence,String status,String error) {}

    private void requireEpisode(UUID packageId){
        var actor=DirectorIdentity.requireDirector();
        boolean owns=jdbc.sql("""
            select exists(select 1 from episode_package_import
              where id=:id and episode_key='EP004'
                and director_issuer=:issuer and director_subject=:subject)
            """).param("id",packageId).param("issuer",actor.issuer())
            .param("subject",actor.subject()).query(Boolean.class).single();
        if(!owns)throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Director-owned EP004 package was not found.");
    }

    static String composition(String shotKey){
        return switch(shotKey){
            case "SHOT01" -> "EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL";
            case "SHOT02" -> "EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL";
            case "SHOT03" -> "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL";
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT,
              "This SHOT has no verified production render composition yet.");
        };
    }

    private List<ShotLock> locks(UUID packageId){
        return jdbc.sql("""
           select shot_key,render_id,locked_at from episode_director_shot_lock
             where package_id=:package order by shot_key
           """).param("package",packageId).query((rs,i)->new ShotLock(
                rs.getString("shot_key"),rs.getObject("render_id",UUID.class),
                rs.getObject("locked_at",OffsetDateTime.class))).list();
    }

    static List<ShotLock> consecutive(List<ShotLock> locks){
        List<ShotLock> prefix=new ArrayList<>();
        for(int i=1;i<=40;i++){
            String expected=String.format(java.util.Locale.ROOT,"SHOT%02d",i);
            ShotLock match=null;
            for(ShotLock s:locks)if(expected.equals(s.shotKey())){match=s;break;}
            if(match==null)break;
            prefix.add(match);
        }
        return List.copyOf(prefix);
    }

    static String identity(List<ShotLock> locks){
        return String.join(",",locks.stream().map(s->s.renderId().toString()).toList());
    }

    private Film currentFilm(UUID packageId){
        return jdbc.sql("""
            select film_id,object_key,sha256,byte_count,shot_count,render_ids,duration_in_frames
              from episode_director_film where package_id=:package
            """).param("package",packageId).query((rs,i)->new Film(
                rs.getObject("film_id",UUID.class),rs.getString("object_key"),
                rs.getString("sha256"),rs.getLong("byte_count"),
                rs.getInt("shot_count"),rs.getString("render_ids"),
                rs.getInt("duration_in_frames"))).optional().orElse(null);
    }

    private boolean current(Film film,List<ShotLock> prefix){
        return film!=null&&!prefix.isEmpty()&&film.count()==prefix.size()
            &&film.renderIds().equals(identity(prefix));
    }

    static String versionedFilmUrl(UUID packageId,UUID filmId){
        return "/api/v1/episode-packages/"+packageId+"/film/video?v="+filmId;
    }

    static String filmState(boolean ready,int consecutiveCount,
            AssemblyState job,String expectedSequence){
        if(ready)return "READY";
        if(consecutiveCount==0)return "WAITING_FOR_SHOT01";
        if(job==null||!expectedSequence.equals(job.sequence()))
            return "ASSEMBLY_REQUIRED";
        return "ERROR".equals(job.status())?"ASSEMBLY_FAILED":"ASSEMBLING";
    }

    private Map<String,Object> snapshot(UUID packageId){
        List<ShotLock> all=locks(packageId),prefix=consecutive(all);
        Film film=currentFilm(packageId);
        boolean ready=current(film,prefix);
        Map<String,Object> response=new LinkedHashMap<>();
        response.put("locks",all.stream().map(x->Map.of(
            "shotKey",x.shotKey(),"renderId",x.renderId().toString(),
            "lockedAt",x.lockedAt().toString())).toList());
        AssemblyState job=assemblyState(packageId);
        String state=filmState(ready,prefix.size(),job,identity(prefix));
        response.put("shotCount",ready?film.count():prefix.size());
        response.put("renderIds",ready?List.of(film.renderIds().split(",")):List.of());
        response.put("durationInFrames",ready?film.frames():0);
        response.put("state",state);
        response.put("error","ASSEMBLY_FAILED".equals(state)
            ?"Full Video joining needs a retry. All locked SHOT files are preserved.":null);
        response.put("filmId",ready?film.id().toString():null);
        response.put("videoUrl",ready?versionedFilmUrl(packageId,film.id()):null);
        return response;
    }

    @GetMapping
    public Map<String,Object> film(@PathVariable UUID packageId){
        requireEpisode(packageId);
        return snapshot(packageId);
    }

    private VideoSource verifiedRender(UUID packageId,String shotKey,UUID renderId){
        return jdbc.sql("""
          select id,video_object_key,video_sha256,video_object_bytes,
                 duration_in_frames,input_props->>'expectedSourceCommit' as commit,
                 input_props->>'voiceTakeId' as take_id,
                 input_props->>'scriptRevision' as script_revision
            from remotion_render
           where id=:render and project_id=cast(:project as uuid)
             and composition_id=:composition and profile='REVIEW'
             and status='SUCCEEDED' and width=1920 and height=1080 and fps=30
             and input_props->>'packageId'=:package
             and input_props->>'sourceSha256'=:source
             and input_props->>'previewOnly'='false'
             and input_props->>'directorCpuApproved'='true'
             and (:shot='SHOT01' or input_props->>'shotKey'=:shot)
             and video_object_key is not null and video_sha256 is not null
             and video_object_bytes between 1024 and 268435456
          """).param("render",renderId).param("project",PROJECT_ID)
          .param("composition",composition(shotKey)).param("package",packageId.toString())
          .param("source",Ep004Shot01DirectorRenderService.SOURCE_SHA)
          .param("shot",shotKey)
          .query((rs,i)->new VideoSource(shotKey,rs.getObject("id",UUID.class),
              rs.getString("video_object_key"),rs.getString("video_sha256"),
              rs.getLong("video_object_bytes"),rs.getInt("duration_in_frames"),
              rs.getString("commit"),rs.getString("take_id"),
              rs.getString("script_revision")==null?-1:
                  Integer.parseInt(rs.getString("script_revision"))))
          .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,
              "Only exact Director-rendered, successful, private source SHOT MP4s can be locked."));
    }

    private void verifyCurrentVoice(UUID packageId,VideoSource source){
        boolean current=jdbc.sql("""
            select exists(
              select 1 from episode_package_shot s
              join lateral(select revision from episode_package_shot_revision
                    where shot_id=s.id order by revision desc limit 1) rev on true
              join lateral(select take_id from episode_package_voice_choice
                    where shot_id=s.id and revision=rev.revision
                    order by selected_at desc,id desc limit 1) choice on true
              join episode_package_voice_take t on t.id=choice.take_id
                    and t.shot_id=s.id and t.revision=rev.revision
              where s.package_id=:package and s.shot_key=:shot
                    and t.id::text=:take and rev.revision=:revision
              )
            """).param("package",packageId).param("shot",source.shotKey())
            .param("take",source.voiceTakeId()).param("revision",source.scriptRevision())
            .query(Boolean.class).single();
        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Approve the current script-revision voice Take and render it before locking.");
    }

    @PostMapping("/locks/{shotKey}")
    public Map<String,Object> lock(@PathVariable UUID packageId,@PathVariable String shotKey,
                                   @RequestBody LockRequest request,HttpServletRequest http){
        requireEpisode(packageId);
        Object audit=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audit instanceof Map<?,?> receipt)
                ||!(receipt.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Audited Director confirmation is required to LOCK a SHOT.");
        if(!Boolean.TRUE.equals(request==null?null:request.confirmLock())
                ||request.renderId()==null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An exact reviewed render ID and explicit Director LOCK approval are required.");
        VideoSource source=verifiedRender(packageId,shotKey,request.renderId());
        if(source.sourceCommit()==null||!source.sourceCommit().matches("[a-f0-9]{40}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Missing original compiled source SHA.");
        verifyCurrentVoice(packageId,source);
        store.verifyVideoManifest(source.objectKey(),source.sha256(),source.bytes());
        jdbc.sql("""
            insert into episode_director_shot_lock(package_id,shot_key,render_id)
            values(:package,:shot,:render)
            on conflict(package_id,shot_key) do update set
              render_id=excluded.render_id,locked_at=now()
            """).param("package",packageId).param("shot",shotKey)
                .param("render",source.renderId()).update();
        queueAssembly(packageId);
        return snapshot(packageId);
    }

    private AssemblyState assemblyState(UUID packageId){
        return jdbc.sql("""
            select render_ids,status,error from episode_director_film_job
              where package_id=:package
            """).param("package",packageId)
            .query((rs,i)->new AssemblyState(rs.getString("render_ids"),
                rs.getString("status"),rs.getString("error")))
            .optional().orElse(null);
    }

    private void queueAssembly(UUID packageId){
        List<ShotLock> prefix=consecutive(locks(packageId));
        if(prefix.isEmpty()||current(currentFilm(packageId),prefix))return;
        if(prefix.size()==1){
            ShotLock single=prefix.get(0);
            VideoSource source=verifiedRender(packageId,single.shotKey(),single.renderId());
            store.verifyVideoManifest(source.objectKey(),source.sha256(),source.bytes());
            saveFilm(packageId,UUID.randomUUID(),source.objectKey(),source.sha256(),
                source.bytes(),1,identity(prefix),source.frames());
            return;
        }
        if(!store.writable())throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Private film storage must be writable before an assembly can be queued.");
        jdbc.sql("""
           insert into episode_director_film_job(package_id,render_ids,status)
           values(:package,:sequence,'QUEUED')
           on conflict(package_id) do update set
             render_ids=excluded.render_ids,status='QUEUED',attempts=0,
             error=null,lease_until=null,updated_at=now()
           where episode_director_film_job.render_ids is distinct from excluded.render_ids
           """).param("package",packageId)
             .param("sequence",identity(prefix)).update();
    }

    public record RetryRequest(Boolean confirmRetry) {}

    @PostMapping("/retry")
    public Map<String,Object> retry(@PathVariable UUID packageId,
            @RequestBody RetryRequest request,HttpServletRequest http){
        requireEpisode(packageId);
        Object audit=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audit instanceof Map<?,?> receipt)
                ||!(receipt.get("auditId") instanceof UUID)
                ||request==null||!Boolean.TRUE.equals(request.confirmRetry()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An audited, explicit Director retry is required.");
        List<ShotLock> prefix=consecutive(locks(packageId));
        if(prefix.size()<2)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "There is no consecutive multi-SHOT film to retry.");
        if(current(currentFilm(packageId),prefix))return snapshot(packageId);
        int n=jdbc.sql("""
            update episode_director_film_job
               set status='QUEUED',attempts=0,error=null,lease_until=null,updated_at=now()
             where package_id=:package and render_ids=:sequence and status='ERROR'
            """).param("package",packageId)
              .param("sequence",identity(prefix)).update();
        if(n!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This film is not in a retryable error state. Refresh Full Video.");
        return snapshot(packageId);
    }

    @Scheduled(initialDelayString="${MEDIAOS_FULL_FILM_START_DELAY_MS:15000}",
               fixedDelayString="${MEDIAOS_FULL_FILM_POLL_MS:4000}")
    public void processAssemblyQueue(){
        try{
            jdbc.sql("""
                update episode_director_film_job
                   set status='QUEUED',lease_until=null,updated_at=now()
                 where status='RUNNING' and lease_until<now() and attempts<3
                """).update();
            jdbc.sql("""
                update episode_director_film_job
                   set status='ERROR',error='Full Video assembly timed out. Safe retry available.',
                       lease_until=null,updated_at=now()
                 where status='RUNNING' and lease_until<now() and attempts>=3
                """).update();
            AssemblyJob job=jdbc.sql("""
                with available as (
                  select package_id from episode_director_film_job
                   where status='QUEUED' and attempts<3
                   order by updated_at limit 1 for update skip locked
                )
                update episode_director_film_job j
                   set status='RUNNING',attempts=attempts+1,
                       lease_until=now()+interval '20 minutes',updated_at=now()
                  from available
                 where j.package_id=available.package_id
                returning j.package_id,j.render_ids
                """).query((rs,i)->new AssemblyJob(
                    rs.getObject("package_id",UUID.class),rs.getString("render_ids")))
                    .optional().orElse(null);
            if(job==null)return;
            try{
                assemble(job.packageId(),job.sequence());
                jdbc.sql("""
                  update episode_director_film_job set status='READY',error=null,
                         lease_until=null,updated_at=now()
                   where package_id=:package and render_ids=:sequence and status='RUNNING'
                  """).param("package",job.packageId())
                     .param("sequence",job.sequence()).update();
            }catch(Exception error){
                LOG.error("Full film assembly failed; existing SHOT locks are retained",error);
                jdbc.sql("""
                  update episode_director_film_job set status='ERROR',
                         error='Full Video needs a retry. Original SHOTs are preserved.',
                         lease_until=null,updated_at=now()
                   where package_id=:package and render_ids=:sequence and status='RUNNING'
                  """).param("package",job.packageId())
                     .param("sequence",job.sequence()).update();
            }
        }catch(Exception unexpected){
            LOG.error("Full film worker database coordination failed",unexpected);
        }
    }

    private void saveFilm(UUID packageId,UUID filmId,String key,String sha,long bytes,
                          int count,String sequence,int frames){
        jdbc.sql("""
            insert into episode_director_film
              (package_id,film_id,object_key,sha256,byte_count,
               shot_count,render_ids,duration_in_frames)
            values(:package,:film,:key,:sha,:bytes,:count,:sequence,:frames)
            on conflict(package_id) do update set
              film_id=excluded.film_id,object_key=excluded.object_key,
              sha256=excluded.sha256,byte_count=excluded.byte_count,
              shot_count=excluded.shot_count,render_ids=excluded.render_ids,
              duration_in_frames=excluded.duration_in_frames,created_at=now()
            """).param("package",packageId).param("film",filmId)
            .param("key",key).param("sha",sha).param("bytes",bytes)
            .param("count",count).param("sequence",sequence)
            .param("frames",frames).update();
    }

    private synchronized void assemble(UUID packageId,String expectedSequence){
        List<ShotLock> prefix=consecutive(locks(packageId));
        if(prefix.size()<2||!expectedSequence.equals(identity(prefix)))
            throw new IllegalStateException("Locked SHOT sequence changed before assembly.");
        if(current(currentFilm(packageId),prefix))return;
        List<VideoSource> sources=new ArrayList<>();
        long inputSize=0;int frames=0;
        for(ShotLock item:prefix){
            VideoSource source=verifiedRender(packageId,item.shotKey(),item.renderId());
            store.verifyVideoManifest(source.objectKey(),source.sha256(),source.bytes());
            inputSize+=source.bytes();frames+=source.frames();
            if(inputSize>MAX_INPUT_BYTES)
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Full film source bytes exceed the bounded 4 GiB storage budget.");
            sources.add(source);
        }
        String sequence=identity(prefix);
        if(!store.writable())throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Private video storage must be writable to assemble the full film.");
        Path folder=null;
        try{
            folder=Files.createTempDirectory("mediaos-director-film-");
            for(int i=0;i<sources.size();i++){
                VideoSource source=sources.get(i);
                String name=String.format(java.util.Locale.ROOT,"shot%02d.mp4",i+1);
                Path target=folder.resolve(name);
                try(var output=Files.newOutputStream(target)){
                    store.streamVideoRange(source.objectKey(),source.sha256(),
                        source.bytes(),0,source.bytes()-1,output);
                }
                if(Files.size(target)!=source.bytes())
                    throw new IOException("Original SHOT streaming download was truncated.");
            }
            Ep004LosslessFilmAssembler.assemble(folder,sources.size(),frames);
            Path output=folder.resolve("full-video.mp4");
            if(Files.size(output)>MediaObjectStore.MAX_FILM_BYTES)
                throw new IllegalStateException("Continuous film exceeds the 4 GiB master limit.");
            UUID id=UUID.randomUUID();
            MediaObjectStore.Stored saved=store.uploadFilmVerified(id,output);
            if(!sequence.equals(identity(consecutive(locks(packageId)))))
                throw new IllegalStateException("Director changed locked SHOTs during film assembly.");
            saveFilm(packageId,id,saved.key(),saved.sha256(),saved.byteCount(),
                prefix.size(),sequence,frames);
        }catch(InterruptedException interrupted){
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Full film assembly was interrupted. Locks remain saved.",interrupted);
        }catch(IOException|RuntimeException problem){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "SHOT LOCK saved, but full film stream-copy needs attention: "+
                  problem.getMessage(),problem);
        }finally{
            if(folder!=null){
                try(var files=Files.list(folder)){
                    files.forEach(path->{try{Files.deleteIfExists(path);}
                        catch(IOException ignored){}});
                }catch(IOException ignored){}
                try{Files.deleteIfExists(folder);}catch(IOException ignored){}
            }
        }
    }

    @GetMapping("/video")
    public ResponseEntity<StreamingResponseBody> video(@PathVariable UUID packageId,
            @RequestHeader(value=HttpHeaders.RANGE,required=false) String range){
        requireEpisode(packageId);
        List<ShotLock> prefix=consecutive(locks(packageId));
        Film film=currentFilm(packageId);
        if(!current(film,prefix))throw new ResponseStatusException(HttpStatus.NOT_FOUND,
            "No up-to-date, consecutive Director-LOCKED full film exists.");
        store.verifyVideoManifest(film.objectKey(),film.sha256(),film.bytes());
        long start=0,end=film.bytes()-1;
        if(range!=null){
            if(!range.matches("^bytes=[0-9]*-[0-9]*$"))
                throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                    "Invalid full film video range.");
            String[] parts=range.substring(6).split("-",2);
            if(parts[0].isBlank()&&parts[1].isBlank())
                throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                    "Empty requested video range.");
            try{
                if(parts[0].isBlank()){
                    long suffix=Long.parseLong(parts[1]);
                    if(suffix<=0)throw new NumberFormatException();
                    start=Math.max(0,film.bytes()-suffix);
                }else{
                    start=Long.parseLong(parts[0]);
                    if(!parts[1].isBlank())end=Long.parseLong(parts[1]);
                }
                if(start<0||start>=film.bytes()||end<start||end>=film.bytes())
                    throw new NumberFormatException();
            }catch(NumberFormatException failure){
                throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                    "Video range is outside the available MP4.");
            }
        }
        final long first=start,last=end;
        HttpHeaders headers=new HttpHeaders();
        headers.setContentType(MediaType.valueOf("video/mp4"));
        headers.setCacheControl("private, no-store");
        headers.set(HttpHeaders.ACCEPT_RANGES,"bytes");
        headers.setContentLength(last-first+1);
        if(range!=null)headers.set(HttpHeaders.CONTENT_RANGE,
            "bytes "+first+"-"+last+"/"+film.bytes());
        StreamingResponseBody body=output->store.streamVideoRange(
            film.objectKey(),film.sha256(),film.bytes(),first,last,output);
        return new ResponseEntity<>(body,headers,
            range==null?HttpStatus.OK:HttpStatus.PARTIAL_CONTENT);
    }
}
