package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class EpisodePublishingStudioService {
    static final List<String> FIELDS=List.of("TITLE","THUMBNAIL_DESIGN","THUMBNAIL_ASSET",
        "DESCRIPTION","CHAPTERS","TAGS","HASHTAGS","SOURCES","DISCLAIMER","PINNED_COMMENT",
        "UPLOAD_SETTINGS","TRANSCRIPT","SUBTITLES_SRT","AUDIO_DIRECTION",
        "QA_MASTER","QA_AUDIO","QA_EDITORIAL","QA_RIGHTS","QA_CAPTIONS","QA_UPLOAD","QA_RELEASE");
    private static final Set<String> METADATA=Set.copyOf(FIELDS.stream()
        .filter(k->!k.startsWith("QA_")).toList());
    private static final List<String> TECHNICAL_QA=List.of("QA_MASTER","QA_AUDIO","QA_EDITORIAL",
        "QA_RIGHTS","QA_CAPTIONS","QA_UPLOAD");
    private static final Pattern CHAPTER=Pattern.compile("^(?:(\\d{1,2}):)?(\\d{1,3}):(\\d{2})\\s+\\S.*$");
    private static final Pattern SRT_TIME=Pattern.compile("^(\\d{2}):(\\d{2}):(\\d{2}),(\\d{3}) --> (\\d{2}):(\\d{2}):(\\d{2}),(\\d{3})$");
    private final JdbcClient jdbc;
    private final MediaObjectStore store;

    public EpisodePublishingStudioService(JdbcClient jdbc,MediaObjectStore store){
        this.jdbc=jdbc;this.store=store;
    }

    public record Master(UUID filmId,String sha256,int durationInFrames,int shotCount,boolean complete){}
    public record Item(String fieldKey,int revision,String value,String state,String origin,
        String masterSha256,OffsetDateTime recordedAt,String objectSha256,Integer objectBytes,
        String objectType,String thumbnailUrl){}
    public record Studio(UUID packageId,String episodeKey,Master master,List<Item> items,
        List<String> blockers,boolean readyForDirectorRelease,boolean releaseRecorded,
        String assembledDescription){}
    public record Change(Integer expectedRevision,String action,String value,Boolean confirm){}
    record OwnedEpisode(String key,int shotCount,DirectorIdentity.Actor actor){}
    record Thumbnail(String key,String sha256,int bytes,String type){}
    private static ResponseStatusException bad(String reason){
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);
    }
    private static ResponseStatusException conflict(String reason){
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }

    private OwnedEpisode owner(UUID packageId,boolean lock){
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("select episode_key,shot_count from episode_package_import "+
                "where id=:id and director_issuer=:issuer and director_subject=:subject"+
                (lock?" for update":""))
            .param("id",packageId).param("issuer",actor.issuer()).param("subject",actor.subject())
            .query((rs,i)->new OwnedEpisode(rs.getString("episode_key"),rs.getInt("shot_count"),actor))
            .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Director-owned episode package was not found."));
    }

    private Master master(UUID packageId,int expectedShots){
        return jdbc.sql("""
            select f.film_id,f.sha256,f.duration_in_frames,f.shot_count,
              f.render_ids=(select string_agg(l.render_id::text,',' order by l.shot_key)
                from episode_director_shot_lock l where l.package_id=f.package_id) as exact_locks
            from episode_director_film f where f.package_id=:id
            """).param("id",packageId).query((rs,i)->new Master(
                rs.getObject("film_id",UUID.class),rs.getString("sha256"),
                rs.getInt("duration_in_frames"),rs.getInt("shot_count"),
                expectedShots>0&&rs.getInt("shot_count")==expectedShots&&
                    rs.getBoolean("exact_locks")&&rs.getInt("duration_in_frames")>0))
            .optional().orElse(null);
    }

    private String thumbnailUrl(UUID packageId,int revision){
        return "/api/v1/episode-packages/"+packageId+"/publishing/thumbnail/"+revision;
    }
    private Item item(java.sql.ResultSet rs,UUID packageId) throws java.sql.SQLException{
        int revision=rs.getInt("revision");
        return new Item(rs.getString("field_key"),revision,rs.getString("field_value"),
            rs.getString("state"),rs.getString("origin"),rs.getString("master_sha256"),
            rs.getObject("recorded_at",OffsetDateTime.class),rs.getString("object_sha256"),
            (Integer)rs.getObject("object_bytes"),rs.getString("object_type"),
            rs.getString("object_key")==null?null:thumbnailUrl(packageId,revision));
    }
    private List<Item> stored(UUID packageId){
        return jdbc.sql("""
            select distinct on (field_key) * from episode_publishing_revision
             where package_id=:id order by field_key,revision desc
            """).param("id",packageId).query((rs,i)->item(rs,packageId)).list();
    }
    private Item empty(String field){
        return new Item(field,0,"",field.startsWith("QA_")?"PENDING":"DRAFT",
            "NOT_RECORDED",null,null,null,null,null,null);
    }

    @Transactional(readOnly=true)
    public Studio get(UUID packageId){
        return snapshot(packageId,owner(packageId,false));
    }
    @Transactional(readOnly=true)
    public List<Item> history(UUID packageId,String field){
        owner(packageId,false);requireField(field);
        return jdbc.sql("""
            select * from episode_publishing_revision
            where package_id=:id and field_key=:field order by revision desc
            """).param("id",packageId).param("field",field)
            .query((rs,i)->item(rs,packageId)).list();
    }
    private Studio snapshot(UUID packageId,OwnedEpisode episode){
        Master master=master(packageId,episode.shotCount());
        Map<String,Item> map=stored(packageId).stream().collect(Collectors.toMap(Item::fieldKey,Function.identity()));
        List<Item> items=FIELDS.stream().map(k->map.getOrDefault(k,empty(k))).toList();
        List<String> blockers=new ArrayList<>();
        if(master==null||!master.complete())blockers.add("Complete current locked Full Video is required.");
        for(String key:FIELDS){
            if(key.equals("QA_RELEASE"))continue;
            Item x=map.getOrDefault(key,empty(key));
            String required=key.startsWith("QA_")?"PASS":"APPROVED";
            if(!required.equals(x.state()))blockers.add(key+": "+x.state());
            else if(master==null||!master.sha256().equals(x.masterSha256()))blockers.add(key+": master version changed");
        }
        if(!nonemptyAsset(map.get("THUMBNAIL_ASSET")))blockers.add("Actual thumbnail image is missing.");
        String description=assembled(map);
        if(description.length()>5000)blockers.add("Combined YouTube description exceeds 5000 characters.");
        staleQa(map,blockers,"QA_AUDIO",List.of("AUDIO_DIRECTION"));
        staleQa(map,blockers,"QA_EDITORIAL",List.of("TITLE","DESCRIPTION","SOURCES","CHAPTERS","DISCLAIMER"));
        staleQa(map,blockers,"QA_RIGHTS",List.of("THUMBNAIL_ASSET","THUMBNAIL_DESIGN","SOURCES","DISCLAIMER"));
        staleQa(map,blockers,"QA_CAPTIONS",List.of("TRANSCRIPT","SUBTITLES_SRT"));
        Item upload=map.get("QA_UPLOAD");
        if(upload!=null&&"PASS".equals(upload.state())&&
            map.values().stream().anyMatch(x->(METADATA.contains(x.fieldKey())||
                TECHNICAL_QA.contains(x.fieldKey())&&!x.fieldKey().equals("QA_UPLOAD"))&&later(x,upload)))
            blockers.add("QA_UPLOAD: private upload QA predates a metadata or QA change.");
        boolean ready=blockers.isEmpty();
        Item release=map.get("QA_RELEASE");
        boolean releaseRecorded=ready&&release!=null&&"PASS".equals(release.state())
            &&master.sha256().equals(release.masterSha256())
            &&map.values().stream().noneMatch(x->!x.fieldKey().equals("QA_RELEASE")&&later(x,release));
        return new Studio(packageId,episode.key(),master,items,List.copyOf(blockers),ready,releaseRecorded,description);
    }
    private static void staleQa(Map<String,Item> map,List<String> blockers,String key,List<String> dependencies){
        Item qa=map.get(key);
        if(qa!=null&&"PASS".equals(qa.state())&&dependencies.stream()
            .map(map::get).anyMatch(x->x!=null&&later(x,qa)))
            blockers.add(key+": evidence predates a relevant metadata change");
    }
    private static boolean later(Item a,Item b){
        return a.recordedAt()!=null&&b.recordedAt()!=null&&a.recordedAt().isAfter(b.recordedAt());
    }
    private static boolean nonemptyAsset(Item x){
        return x!=null&&x.objectSha256()!=null&&x.objectBytes()!=null&&x.objectBytes()>0;
    }
    static String assembled(Map<String,Item> map){
        List<String> sections=new ArrayList<>();
        for(String key:List.of("DESCRIPTION","CHAPTERS","SOURCES","DISCLAIMER","HASHTAGS")){
            Item x=map.get(key);
            if(x!=null&&!x.value().isBlank()){
                String header=switch(key){
                    case "CHAPTERS" -> "Chapters\n";
                    case "SOURCES" -> "Sources & Technical References\n";
                    case "DISCLAIMER" -> "Editorial Disclaimer\n";
                    default -> "";
                };
                sections.add(header+x.value().strip());
            }
        }
        return String.join("\n\n",sections);
    }
    private static void requireField(String field){
        if(!FIELDS.contains(field))throw bad("Unknown publishing field.");
    }
    private Item latest(UUID packageId,String key){
        return jdbc.sql("""
            select * from episode_publishing_revision where package_id=:id and field_key=:field
            order by revision desc limit 1
            """).param("id",packageId).param("field",key).query((rs,i)->item(rs,packageId))
            .optional().orElseGet(()->empty(key));
    }
    private Thumbnail thumbnail(UUID packageId,int revision){
        return jdbc.sql("""
            select object_key,object_sha256,object_bytes,object_type from episode_publishing_revision
             where package_id=:id and field_key='THUMBNAIL_ASSET' and revision=:rev
               and object_key is not null
            """).param("id",packageId).param("rev",revision)
            .query((rs,i)->new Thumbnail(rs.getString("object_key"),rs.getString("object_sha256"),
                rs.getInt("object_bytes"),rs.getString("object_type"))).optional()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thumbnail revision not found."));
    }
    private void requireRevision(Integer expected,Item old){
        if(expected==null||expected!=old.revision())throw conflict("Publishing revision changed; refresh before saving.");
        if(old.revision()>=50)throw conflict("Publishing revision limit reached; preserve existing history.");
    }
    private void requireMetadataCapacity(UUID id,String value){
        long used=jdbc.sql("select coalesce(sum(octet_length(field_value)),0) from episode_publishing_revision where package_id=:id")
            .param("id",id).query(Long.class).single();
        if(used+value.getBytes(StandardCharsets.UTF_8).length>4L*1024*1024)
            throw conflict("Episode publishing metadata retention limit reached.");
    }
    private void insert(UUID id,String key,int revision,String value,String state,String origin,
                        Master master,Thumbnail thumb){
        requireMetadataCapacity(id,value);
        jdbc.sql("""
            insert into episode_publishing_revision(package_id,field_key,revision,field_value,state,
                origin,master_sha256,object_key,object_sha256,object_bytes,object_type)
            values(:id,:key,:rev,:value,:state,:origin,:master,:object,:sha,:bytes,:type)
            """).param("id",id).param("key",key).param("rev",revision)
            .param("value",value).param("state",state).param("origin",origin)
            .param("master",master==null?null:master.sha256())
            .param("object",thumb==null?null:thumb.key()).param("sha",thumb==null?null:thumb.sha256())
            .param("bytes",thumb==null?null:thumb.bytes()).param("type",thumb==null?null:thumb.type()).update();
    }

    @Transactional
    public Studio change(UUID id,String key,Change request){
        requireField(key);
        OwnedEpisode episode=owner(id,true);
        if(request==null||request.action()==null)throw bad("Publishing action is required.");
        Item old=latest(id,key);requireRevision(request.expectedRevision(),old);
        Master master=master(id,episode.shotCount());
        String action=request.action(),value=request.value()==null?"":request.value().strip();
        String state;
        Thumbnail thumb=null;
        if(key.startsWith("QA_")){
            if(!Set.of("PENDING","PASS","FAIL").contains(action))throw bad("Invalid QA action.");
            validateText(key,value,false,master);
            if(!"PENDING".equals(action)&&(value.length()<12||!Boolean.TRUE.equals(request.confirm())))
                throw conflict("Explicit Director QA confirmation and evidence are required.");
            if("PASS".equals(action)){
                if(master==null||!master.complete())throw conflict("Complete current master required for QA.");
                if("QA_CAPTIONS".equals(key)&&!approvedCurrent(latest(id,"SUBTITLES_SRT"),master))
                    throw conflict("Approve a synchronized SRT for this master first.");
                if("QA_UPLOAD".equals(key)){
                    var s=snapshot(id,episode);
                    if(s.blockers().stream().anyMatch(b->!b.startsWith("QA_UPLOAD:")))
                        throw conflict("Resolve all other metadata and QA blockers before recording private upload QA.");
                }
                if("QA_RELEASE".equals(key)&&!snapshot(id,episode).readyForDirectorRelease())
                    throw conflict("Resolve all publishing blockers before recording Director release approval.");
            }
            state=action;
        }else if("SAVE".equals(action)&&!"THUMBNAIL_ASSET".equals(key)){
            validateText(key,value,false,master);
            if("APPROVED".equals(old.state())&&!Boolean.TRUE.equals(request.confirm()))
                throw conflict("Confirm a new draft revision; the approved revision remains in history.");
            state="DRAFT";
        }else if("APPROVE".equals(action)){
            if(old.revision()==0||!Boolean.TRUE.equals(request.confirm()))
                throw conflict("Explicit Director approval of a saved revision is required.");
            value=old.value();
            validateText(key,value,true,master);
            if(master==null||!master.complete())throw conflict("Complete current master required for approval.");
            if("THUMBNAIL_ASSET".equals(key)){
                thumb=thumbnail(id,old.revision());
                Item design=latest(id,"THUMBNAIL_DESIGN");
                if(!approvedCurrent(design,master))throw conflict("Approve the current thumbnail design first.");
                requireMatchingDesign(design,thumb.sha256());
                store.downloadPublishingThumbnail(id,thumb.key(),thumb.sha256(),thumb.bytes(),thumb.type());
            }
            state="APPROVED";
        }else throw bad("Invalid publishing action.");
        if(!key.startsWith("QA_")&&old.state().equals(state)&&old.value().equals(value)&&
            java.util.Objects.equals(old.masterSha256(),master==null?null:master.sha256()))
            return snapshot(id,episode);
        insert(id,key,old.revision()+1,value,state,episode.actor().auditName(),master,thumb);
        return snapshot(id,episode);
    }

    private static void requireMatchingDesign(Item design,String hash){
        var expected=Pattern.compile("SHA-256 ([a-f0-9]{64})").matcher(design.value());
        if(expected.find()&&!expected.group(1).equals(hash))
            throw conflict("Image differs from the exact approved thumbnail design hash. Review and approve a new design revision first.");
    }
    private static boolean approvedCurrent(Item x,Master m){
        return "APPROVED".equals(x.state())&&m.sha256().equals(x.masterSha256());
    }

    @Transactional
    public Studio uploadThumbnail(UUID id,Integer expected,boolean confirm,byte[] bytes){
        OwnedEpisode episode=owner(id,true);
        Item old=latest(id,"THUMBNAIL_ASSET");
        requireRevision(expected,old);
        if(!confirm)throw conflict("Explicit Director thumbnail upload confirmation required.");
        String type=MediaObjectStore.publishingImageType(bytes);
        String hash=MediaObjectStore.sha256(bytes);
        requireMatchingDesign(latest(id,"THUMBNAIL_DESIGN"),hash);
        requireMetadataCapacity(id,"Verified image: "+hash);
        if(nonemptyAsset(old)&&hash.equals(old.objectSha256()))return snapshot(id,episode);
        // 10 distinct bounded image uploads per episode; approval revisions reuse the same object.
        long count=jdbc.sql("""
            select count(distinct object_sha256) from episode_publishing_revision
            where package_id=:id and field_key='THUMBNAIL_ASSET'
            """).param("id",id).query(Long.class).single();
        if(count>=10)throw conflict("Thumbnail image retention limit reached.");
        Master master=master(id,episode.shotCount());
        MediaObjectStore.Stored saved=store.uploadPublishingThumbnail(id,bytes,type);
        insert(id,"THUMBNAIL_ASSET",old.revision()+1,"Verified image: "+saved.sha256(),"DRAFT",
            episode.actor().auditName(),master,new Thumbnail(saved.key(),saved.sha256(),(int)saved.byteCount(),type));
        return snapshot(id,episode);
    }

    public record Image(byte[] bytes,String type,String sha256){}
    @Transactional(readOnly=true)
    public Image image(UUID id,int revision){
        owner(id,false);
        Thumbnail x=thumbnail(id,revision);
        return new Image(store.downloadPublishingThumbnail(id,x.key(),x.sha256(),x.bytes(),x.type()),x.type(),x.sha256());
    }

    static void validateText(String field,String value,boolean approval,Master master){
        if(value.getBytes(StandardCharsets.UTF_8).length>262144||value.indexOf('\0')>=0)
            throw bad("Publishing text exceeds its bounded size or contains invalid characters.");
        if(approval&&value.isBlank())throw bad("A blank field cannot be approved.");
        int length=value.codePointCount(0,value.length());
        int max=switch(field){
            case "TITLE" -> 100;
            case "TAGS" -> 500;
            case "DESCRIPTION" -> 5000;
            case "PINNED_COMMENT" -> 10000;
            case "TRANSCRIPT","SUBTITLES_SRT" -> 150000;
            default -> 20000;
        };
        if(length>max)throw bad("Text exceeds the field limit of "+max+" characters.");
        if(approval&&field.equals("CHAPTERS"))validateChapters(value,master);
        if(approval&&field.equals("SUBTITLES_SRT"))validateSrt(value,master);
    }
    static void validateChapters(String text,Master master){
        int previous=-10,count=0;
        for(String line:text.split("\\R")){
            if(line.isBlank())continue;
            var matcher=CHAPTER.matcher(line.strip());
            if(!matcher.matches())throw bad("Each chapter needs a timestamp and title.");
            int hours=matcher.group(1)==null?0:Integer.parseInt(matcher.group(1));
            int minutes=Integer.parseInt(matcher.group(2)),seconds=Integer.parseInt(matcher.group(3));
            if(seconds>=60||(matcher.group(1)!=null&&minutes>=60))throw bad("Invalid chapter clock.");
            int time=hours*3600+minutes*60+seconds;
            if((count==0&&time!=0)||time-previous<10)throw bad("Chapters start at 00:00 and need 10-second spacing.");
            previous=time;count++;
        }
        if(count<3)throw bad("At least three chapters required.");
        if(master!=null&&previous*30L+300>master.durationInFrames())throw bad("Last chapter must fit the current master.");
    }
    private static long millis(java.util.regex.Matcher m,int start){
        long h=Long.parseLong(m.group(start)),min=Long.parseLong(m.group(start+1)),sec=Long.parseLong(m.group(start+2));
        if(min>=60||sec>=60)throw bad("Invalid SRT time.");
        return ((h*60+min)*60+sec)*1000+Long.parseLong(m.group(start+3));
    }
    static void validateSrt(String text,Master master){
        String normalized=text.replace("\r\n","\n").replace('\r','\n').strip();
        long previousEnd=0;int index=0;
        for(String block:normalized.split("\\n\\s*\\n")){
            String[] lines=block.split("\n");
            if(lines.length<3||lines.length>4||!lines[0].strip().equals(Integer.toString(++index)))
                throw bad("SRT requires numbered blocks, a timestamp and one or two text lines.");
            var m=SRT_TIME.matcher(lines[1].strip());
            if(!m.matches())throw bad("Invalid SRT timestamp.");
            long start=millis(m,1),end=millis(m,5);
            if(start<previousEnd||end<=start||Arrays.stream(lines).skip(2).anyMatch(String::isBlank))
                throw bad("SRT blocks must be nonempty and chronological without overlap.");
            if(master!=null&&end*30L>master.durationInFrames()*1000L+30)
                throw bad("Caption ends outside current master.");
            previousEnd=end;
        }
    }
}
