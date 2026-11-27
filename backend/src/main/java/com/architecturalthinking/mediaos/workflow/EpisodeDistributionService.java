package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class EpisodeDistributionService {
    public record Platform(String key,String name,String discovery,String dependency,String policy,String guidance,boolean humanOnly,boolean editorial){}
    static final List<Platform> PLATFORMS=List.of(
        new Platform("MEDIUM","Medium","Topic recommendations / publications","NONE","https://help.medium.com/hc/en-us/articles/360006362473-Medium-s-Distribution-Guidelines-How-curators-review-stories-for-Boost-General-and-Network-Distribution","For broad discovery use original human writing; disclose generated text/images; no AI-generated paywall or traffic-first story. Review publication rules.",true,false),
        new Platform("HASHNODE","Hashnode","Topic feeds / public search","NONE","https://hashnode.com/code-of-conduct","Check current account, editorial and AI disclosure rules. Educational value first.",false,false),
        new Platform("DEV","DEV Community","Technical tags / feeds","NONE","https://dev.to/guidelines-for-ai-assisted-articles-on-dev/","Educational, non-promotional material only; disclose AI use. No generated comments or backlink campaign.",false,false),
        new Platform("REDDIT","Reddit","Community ranking","NONE","https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam","Verify exact subreddit rules, AI restrictions and account eligibility. No repeated promotion.",true,false),
        new Platform("INFOQ","InfoQ","Editorial readership","NONE","https://www.infoq.com/guidelines/","Human-authored work, disclose assistance, verify submission limits and exclusivity; no generated substantial sections.",true,true),
        new Platform("DZONE","DZone","Editorial readership","NONE","https://dzone.com/articles/dzones-article-submission-guidelines","Human expertise and current submission rules; editorial acceptance not guaranteed.",true,true),
        new Platform("NEWSLETTER","Technical newsletter","Established subscribers","NONE","", "Choose a real newsletter and check its submission policy before contacting it.",true,true),
        new Platform("HN","Hacker News","Community ranking","NONE","https://news.ycombinator.com/newsguidelines.html","Human-only participation; research notes only here. No generated submissions or comments.",true,false),
        new Platform("LINKEDIN","LinkedIn","Professional network / feed","PARTIAL","https://www.linkedin.com/legal/professional-community-policies","Optional amplification; avoid repetitive promotion.",false,false),
        new Platform("YOUTUBE","YouTube Community","Channel discovery","PARTIAL","https://www.youtube.com/howyoutubeworks/policies/community-guidelines/","Optional post; confirm channel eligibility and actual public video URL.",false,false),
        new Platform("X","X","Topic search / recommendations","PARTIAL","https://help.x.com/en/rules-and-policies/x-rules","Optional amplification, no mass duplication.",false,false),
        new Platform("BLUESKY","Bluesky","Topic feeds / search","PARTIAL","https://bsky.social/about/support/community-guidelines","Optional amplification, follow current community rules.",false,false)
    );
    record Owner(String key,DirectorIdentity.Actor actor){}
    public record Item(UUID id,int revision,String platform,String kind,String title,String body,String sources,String assets,
        String destination,int launchDay,String state,String evidence,String publishedUrl,LocalDate publishedOn,
        String masterSha256,String actor,OffsetDateTime recordedAt){}
    public record Launch(int revision,String videoUrl,LocalDate launchDate){}
    public record View(String episodeKey,String masterSha256,boolean editorialQa,Launch launch,List<Platform> platforms,List<Item> items,
        List<String> blockers){}
    public record Change(UUID id,Integer expectedRevision,String action,String platform,String kind,String title,String body,
        String sources,String assets,String destination,Integer launchDay,String evidence,Boolean confirm,
        Boolean authorReview,Boolean policyReview,Boolean rightsReview,Boolean humanAuthored,
        String publishedUrl,LocalDate publishedOn){}
    public record LaunchChange(Integer expectedRevision,String videoUrl,LocalDate launchDate,Boolean confirm){}
    private final JdbcClient jdbc;
    public EpisodeDistributionService(JdbcClient jdbc){this.jdbc=jdbc;}
    static ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
    static ResponseStatusException conflict(String s){return new ResponseStatusException(HttpStatus.CONFLICT,s);}
    private Owner owner(UUID id,boolean lock){
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("select episode_key from episode_package_import where id=:id and director_issuer=:issuer and director_subject=:subject"+(lock?" for update":""))
            .param("id",id).param("issuer",actor.issuer()).param("subject",actor.subject())
            .query(String.class).optional().map(k->new Owner(k,actor))
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Director-owned episode was not found."));
    }
    private String master(UUID id){
        return jdbc.sql("""
          select f.sha256 from episode_director_film f join episode_package_import p on p.id=f.package_id
          where f.package_id=:id and f.shot_count=p.shot_count and f.duration_in_frames>0
          and f.render_ids=(select string_agg(l.render_id::text,',' order by l.shot_key)
            from episode_director_shot_lock l where l.package_id=f.package_id)
          """).param("id",id).query(String.class).optional().orElse(null);
    }
    private boolean editorialQa(UUID id,String sha){
        if(sha==null)return false;
        return jdbc.sql("""
          with latest as (select distinct on(field_key) field_key,state,master_sha256,recorded_at
              from episode_publishing_revision where package_id=:id order by field_key,revision desc)
          select count(*)=2 from latest q
          where q.field_key in ('QA_EDITORIAL','QA_RIGHTS') and q.state='PASS' and q.master_sha256=:sha
          and not exists(select 1 from latest m where m.field_key in ('TITLE','DESCRIPTION','SOURCES','CHAPTERS','DISCLAIMER','THUMBNAIL_DESIGN','THUMBNAIL_ASSET')
             and m.recorded_at>q.recorded_at)
          """).param("id",id).param("sha",sha).query(Boolean.class).single();
    }
    private Item item(java.sql.ResultSet rs,int n)throws java.sql.SQLException{
        return new Item(rs.getObject("item_id",UUID.class),rs.getInt("revision"),rs.getString("platform"),rs.getString("kind"),
            rs.getString("title"),rs.getString("body"),rs.getString("sources"),rs.getString("assets"),rs.getString("destination"),
            rs.getInt("launch_day"),rs.getString("state"),rs.getString("evidence"),rs.getString("published_url"),
            rs.getObject("published_on",LocalDate.class),rs.getString("master_sha256"),rs.getString("actor"),rs.getObject("recorded_at",OffsetDateTime.class));
    }
    private List<Item> items(UUID id){
        return jdbc.sql("select distinct on(item_id) * from episode_distribution_revision where package_id=:id order by item_id,revision desc")
            .param("id",id).query(this::item).list().stream().sorted(Comparator.comparingInt((Item x)->rank(x.platform())).thenComparingInt(Item::launchDay).thenComparing(Item::title)).toList();
    }
    private static int rank(String platform){return platform.equals("MEDIUM")?0:platform.equals("HASHNODE")?1:platform.equals("DEV")?2:platform.equals("REDDIT")?3:platform.equals("INFOQ")||platform.equals("DZONE")||platform.equals("NEWSLETTER")||platform.equals("HN")?4:5;}
    static Platform platform(String key){return PLATFORMS.stream().filter(p->p.key().equals(key)).findFirst().orElseThrow(()->bad("Unknown platform."));}
    private Launch launch(UUID id){
        return jdbc.sql("select revision,video_url,launch_date from episode_distribution_launch where package_id=:id")
            .param("id",id).query((rs,i)->new Launch(rs.getInt(1),rs.getString(2),rs.getObject(3,LocalDate.class))).optional().orElse(new Launch(0,null,null));
    }
    private View snapshot(UUID id,Owner o){
        String sha=master(id);boolean qa=editorialQa(id,sha);var launch=launch(id);var items=items(id);var blockers=new ArrayList<String>();
        if(items.stream().noneMatch(i->i.platform().equals("MEDIUM")&&i.kind().equals("ARTICLE")&&i.body().length()>=1500&&!Set.of("BLOCKED","SKIPPED").contains(i.state())))
            blockers.add("Prepare at least one complete Medium article.");
        if(items.stream().noneMatch(i->i.platform().equals("MEDIUM")&&i.kind().equals("ARTICLE")&&Set.of("READY_TO_PUBLISH","PUBLISHED").contains(i.state())&&Objects.equals(i.masterSha256(),sha)))
            blockers.add("Medium launch article still needs author and policy clearance.");
        if(!qa)blockers.add("Complete editorial accuracy and rights QA in Publishing.");
        if(launch.videoUrl()==null)blockers.add("Record the real public YouTube URL at launch.");
        return new View(o.key(),sha,qa,launch,PLATFORMS,items,List.copyOf(blockers));
    }
    @Transactional(readOnly=true) public View get(UUID id){return snapshot(id,owner(id,false));}
    @Transactional(readOnly=true) public List<Item> history(UUID id,UUID item){
        owner(id,false);return jdbc.sql("select * from episode_distribution_revision where package_id=:id and item_id=:item order by revision desc")
            .param("id",id).param("item",item).query(this::item).list();
    }
    static String bounded(String s,int chars,int bytes,boolean required){
        s=s==null?"":s.strip();if(s.length()>chars||s.getBytes(StandardCharsets.UTF_8).length>bytes||s.indexOf('\0')>=0||(required&&s.isBlank()))throw bad("Missing or oversized editorial field.");return s;
    }
    static String https(String s,boolean youtube){
        s=bounded(s,2048,8192,true);
        try{
            URI u=URI.create(s);String h=u.getHost();
            if(!"https".equals(u.getScheme())||h==null||u.getUserInfo()!=null||u.getPort()!=-1)throw new IllegalArgumentException();
            if(youtube){
                if(!(Set.of("youtube.com","www.youtube.com","youtu.be").contains(h.toLowerCase(Locale.ROOT))))throw new IllegalArgumentException();
                String candidate="youtu.be".equalsIgnoreCase(h)?u.getPath().substring(1):Arrays.stream(Optional.ofNullable(u.getQuery()).orElse("").split("&")).filter(x->x.startsWith("v=")).map(x->x.substring(2)).findFirst().orElse("");
                if(!candidate.matches("[A-Za-z0-9_-]{11}")||(!"youtu.be".equalsIgnoreCase(h)&&!"/watch".equals(u.getPath())))throw new IllegalArgumentException();
            }
            return s;
        }catch(RuntimeException e){throw bad(youtube?"A real YouTube watch or share URL is required.":"Use an HTTPS publication URL.");}
    }
    @Transactional public View recordLaunch(UUID id,LaunchChange x){
        Owner o=owner(id,true);var old=launch(id);
        if(x==null||!Boolean.TRUE.equals(x.confirm())||x.expectedRevision()==null||x.expectedRevision()!=old.revision())throw conflict("Confirm the launch record and refresh its version.");
        String url=x.videoUrl()==null||x.videoUrl().isBlank()?null:https(x.videoUrl(),true);
        if(url!=null&&(x.launchDate()==null||x.launchDate().isAfter(LocalDate.now())))throw bad("Record an actual launch date for a public video URL.");
        if(old.videoUrl()!=null&&!Objects.equals(old.videoUrl(),url))throw conflict("Public video URL is already recorded; preserve the launch identity.");
        jdbc.sql("""
          insert into episode_distribution_launch(package_id,revision,video_url,launch_date,actor)
          values(:id,:rev,:url,:date,:actor) on conflict(package_id) do update set
          revision=excluded.revision,video_url=excluded.video_url,launch_date=excluded.launch_date,actor=excluded.actor,updated_at=now()
          """).param("id",id).param("rev",old.revision()+1).param("url",url).param("date",x.launchDate()).param("actor",o.actor().auditName()).update();
        return snapshot(id,o);
    }
    static void validateKind(Platform p,String kind){
        if(!Set.of("ARTICLE","POST","RESEARCH","DISCUSSION").contains(kind))throw bad("Unknown content type.");
        if(Set.of("HN","INFOQ","DZONE","NEWSLETTER","REDDIT").contains(p.key())&&!kind.equals("RESEARCH"))
            throw bad("This destination is research / human author support only in V1.");
        if(p.key().equals("DEV")&&!kind.equals("ARTICLE"))throw bad("DEV supports educational articles only here.");
        if(p.key().equals("MEDIUM")&&!kind.equals("ARTICLE"))throw bad("Medium requires a complete article.");
    }
    static void requireReview(Change c,Platform p,Item old,boolean qa,String sha){
        if(!Boolean.TRUE.equals(c.confirm())||!Boolean.TRUE.equals(c.authorReview())||!Boolean.TRUE.equals(c.policyReview())||!Boolean.TRUE.equals(c.rightsReview()))
            throw conflict("Explicit author, policy and rights reviews are required.");
        if(p.humanOnly()&&!Boolean.TRUE.equals(c.humanAuthored()))throw conflict("Original human authorship is required for this destination.");
        if(old.kind().equals("RESEARCH"))throw conflict("Research notes cannot be marked publication-ready. Human submission is outside V1.");
        if(!qa||sha==null||!Objects.equals(old.masterSha256(),sha))throw conflict("Current master and Publishing editorial/rights QA must be complete.");
        if(old.kind().equals("ARTICLE")&&old.body().length()<1500)throw conflict("Complete article text is required.");
        if(old.body().isBlank()||old.sources().isBlank()||old.destination().isBlank())throw conflict("Complete text, sources and destination are required.");
        if(old.body().contains("{{")||old.body().contains("[VIDEO_URL]"))throw conflict("Remove unresolved placeholders before approval.");
        if(p.key().equals("DEV")&&(old.body().toLowerCase(Locale.ROOT).contains("youtube.com")||old.body().toLowerCase(Locale.ROOT).contains("youtu.be")))throw conflict("Keep DEV educational and free of promotional video links.");
        if(bounded(c.evidence(),8000,16384,true).length()<20)throw conflict("Record meaningful factual, policy, rights and authorship evidence.");
    }
    @Transactional public View change(UUID id,Change c){
        Owner o=owner(id,true);
        if(c==null||c.action()==null||c.expectedRevision()==null)throw bad("Editorial action and version required.");
        UUID itemId=c.id()==null?UUID.randomUUID():c.id();
        Item old=jdbc.sql("select * from episode_distribution_revision where package_id=:id and item_id=:item order by revision desc limit 1")
            .param("id",id).param("item",itemId).query(this::item).optional().orElse(null);
        if(c.expectedRevision()!=(old==null?0:old.revision())||c.expectedRevision()>=100||(c.id()!=null&&old==null))throw conflict("Editorial revision changed; refresh.");
        if(old!=null&&"PUBLISHED".equals(old.state()))throw conflict("Published record is immutable; add a separate item.");
        String sha=master(id),state,platform,kind,title,body,sources,assets,dest,evidence,url=null;LocalDate date=null;int day;
        if("SAVE".equals(c.action())){
            if(old!=null&&Set.of("APPROVED","READY_TO_PUBLISH").contains(old.state())&&!Boolean.TRUE.equals(c.confirm()))throw conflict("Confirm new draft revision.");
            platform=platform(c.platform()).key();kind=bounded(c.kind(),24,96,true);validateKind(platform(platform),kind);
            title=bounded(c.title(),200,800,true);body=bounded(c.body(),80000,131072,true);
            sources=bounded(c.sources(),12000,16384,false);assets=bounded(c.assets(),6000,8192,false);
            dest=bounded(c.destination(),300,1200,false);day=c.launchDay()==null?0:c.launchDay();
            if(day< -30||day>365)throw bad("Invalid launch day.");
            evidence="";state="DRAFT";
        }else{
            if(old==null||!Boolean.TRUE.equals(c.confirm()))throw conflict("Confirm action on a saved revision.");
            platform=old.platform();kind=old.kind();title=old.title();body=old.body();sources=old.sources();assets=old.assets();dest=old.destination();day=old.launchDay();
            evidence=bounded(c.evidence(),8000,16384,true);
            switch(c.action()){
                case "APPROVE" -> {requireReview(c,platform(platform),old,editorialQa(id,sha),sha);state="APPROVED";}
                case "READY" -> {if(!"APPROVED".equals(old.state()))throw conflict("Approve the saved article or post first.");requireReview(c,platform(platform),old,editorialQa(id,sha),sha);state="READY_TO_PUBLISH";}
                case "PUBLISH" -> {
                    if(!"READY_TO_PUBLISH".equals(old.state()))throw conflict("Record readiness before publication.");
                    requireReview(c,platform(platform),old,editorialQa(id,sha),sha);
                    url=https(c.publishedUrl(),false);date=c.publishedOn();
                    if(date==null||date.isAfter(LocalDate.now()))throw bad("Actual publication date required.");
                    state="PUBLISHED";
                }
                case "BLOCK" -> state="BLOCKED";
                case "SKIP" -> state="SKIPPED";
                default -> throw bad("Unknown editorial action.");
            }
        }
        long used=jdbc.sql("select coalesce(sum(octet_length(body)+octet_length(sources)+octet_length(assets)+octet_length(evidence)),0) from episode_distribution_revision where package_id=:id")
            .param("id",id).query(Long.class).single();
        if(used+(body+sources+assets+evidence).getBytes(StandardCharsets.UTF_8).length>8L*1024*1024)throw conflict("Episode editorial revision storage budget reached.");
        jdbc.sql("""
            insert into episode_distribution_revision(package_id,item_id,revision,platform,kind,title,body,sources,assets,destination,launch_day,state,evidence,published_url,published_on,master_sha256,actor)
            values(:id,:item,:rev,:platform,:kind,:title,:body,:sources,:assets,:dest,:day,:state,:evidence,:url,:date,:sha,:actor)
            """).param("id",id).param("item",itemId).param("rev",c.expectedRevision()+1).param("platform",platform).param("kind",kind)
            .param("title",title).param("body",body).param("sources",sources).param("assets",assets).param("dest",dest).param("day",day)
            .param("state",state).param("evidence",evidence).param("url",url).param("date",date).param("sha",sha).param("actor",o.actor().auditName()).update();
        return snapshot(id,o);
    }
}
