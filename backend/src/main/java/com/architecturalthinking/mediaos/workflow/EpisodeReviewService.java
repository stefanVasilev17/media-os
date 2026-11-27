package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class EpisodeReviewService {
    static final Set<String> KINDS=Set.of("STRENGTH","PROBLEM","LESSON","RULE","RECOMMENDATION","ANALYTICS","CONCLUSION");
    static final Set<String> CATEGORIES=Set.of("VISUAL","STORY","TECHNICAL","VOICE","PRODUCTION","PUBLISHING","REELS","DISTRIBUTION","AUDIENCE");
    static final Set<String> CLASSIFICATIONS=Set.of("OBSERVATION","HYPOTHESIS","VERIFIED_RESULT","PERMANENT_RULE");
    static final List<String> METRICS=List.of("VIEWS","IMPRESSIONS","CTR_PERCENT","AVD_SECONDS","AVERAGE_PERCENT_VIEWED","AUDIENCE_RETENTION","TRAFFIC_SOURCES","AUDIENCE_GEOGRAPHY","RPM","REELS_PERFORMANCE","ARTICLE_PERFORMANCE","REFERRAL_TRAFFIC","SUBSCRIBERS_GAINED");
    static final Set<String> DETAIL_METRICS=Set.of("AUDIENCE_RETENTION","TRAFFIC_SOURCES","AUDIENCE_GEOGRAPHY","REELS_PERFORMANCE","ARTICLE_PERFORMANCE","REFERRAL_TRAFFIC");
    record Owner(String episodeKey,DirectorIdentity.Actor actor){}
    public record Gate(String name,String status,String detail){}
    public record Item(UUID id,int revision,String kind,String category,String scope,String classification,String title,String body,
        String applicability,String evidence,String metric,BigDecimal value,String currency,LocalDate periodStart,LocalDate periodEnd,
        String state,String masterSha256,String contextSha256,String contextSummary,String actor,UUID auditId,OffsetDateTime recordedAt){}
    public record Previous(String episodeKey,UUID packageId,Item item){}
    public record View(String episodeKey,String masterSha256,String contextSha256,String contextSummary,List<Gate> gates,
        List<String> blockers,boolean launchRecorded,LocalDate launchDate,List<Item> items,List<Previous> previous){}
    public record Change(UUID id,Integer expectedRevision,String action,String kind,String category,String scope,String classification,
        String title,String body,String applicability,String evidence,String metric,BigDecimal value,String currency,
        LocalDate periodStart,LocalDate periodEnd,Boolean confirm){}
    private final JdbcClient jdbc;
    private final EpisodePublishingStudioService publishing;
    private final EpisodeReelService reels;
    private final EpisodeDistributionService distribution;
    public EpisodeReviewService(JdbcClient jdbc,EpisodePublishingStudioService publishing,EpisodeReelService reels,EpisodeDistributionService distribution){
        this.jdbc=jdbc;this.publishing=publishing;this.reels=reels;this.distribution=distribution;
    }
    static ResponseStatusException bad(String reason){return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    static ResponseStatusException conflict(String reason){return new ResponseStatusException(HttpStatus.CONFLICT,reason);}
    private Owner owner(UUID id,boolean lock){
        var a=DirectorIdentity.requireDirector();
        return jdbc.sql("select episode_key from episode_package_import where id=:id and director_issuer=:issuer and director_subject=:subject"+(lock?" for update":""))
            .param("id",id).param("issuer",a.issuer()).param("subject",a.subject()).query(String.class).optional()
            .map(k->new Owner(k,a)).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Director-owned episode was not found."));
    }
    private Item item(java.sql.ResultSet r,int i)throws java.sql.SQLException{
        return new Item(r.getObject("item_id",UUID.class),r.getInt("revision"),r.getString("kind"),r.getString("category"),
            r.getString("scope"),r.getString("classification"),r.getString("title"),r.getString("body"),r.getString("applicability"),
            r.getString("evidence"),r.getString("metric"),r.getBigDecimal("value"),r.getString("currency"),
            r.getObject("period_start",LocalDate.class),r.getObject("period_end",LocalDate.class),r.getString("state"),
            r.getString("master_sha256"),r.getString("context_sha256"),r.getString("context_summary"),r.getString("actor"),r.getObject("audit_id",UUID.class),
            r.getObject("recorded_at",OffsetDateTime.class));
    }
    private List<Item> items(UUID id){
        return jdbc.sql("select distinct on(item_id) * from episode_review_revision where package_id=:id order by item_id,revision desc")
            .param("id",id).query(this::item).list().stream().sorted(Comparator.comparing(Item::recordedAt).reversed()).toList();
    }
    private List<Previous> previous(UUID id,Owner o,String category){
        if(category!=null&&!CATEGORIES.contains(category))throw bad("Unknown review category.");
        return jdbc.sql("""
          with latest as (
            select distinct on(r.package_id,r.item_id) r.*,p.episode_key
            from episode_review_revision r join episode_package_import p on p.id=r.package_id
            where p.director_issuer=:issuer and p.director_subject=:subject and p.id<>:id
              and p.episode_key<:episode order by r.package_id,r.item_id,r.revision desc
          )
          select l.* from latest l join episode_director_film f on f.package_id=l.package_id and f.sha256=l.master_sha256
            join episode_package_import p on p.id=l.package_id
          where l.state='APPROVED' and ((l.scope='CHANNEL' and l.kind in ('LESSON','RULE','RECOMMENDATION')) or l.kind='CONCLUSION')
            and f.shot_count=p.shot_count and f.duration_in_frames>0
            and f.render_ids=(select string_agg(s.render_id::text,',' order by s.shot_key) from episode_director_shot_lock s where s.package_id=f.package_id)
            and (cast(:category as text) is null or l.category=:category)
          order by case when l.kind='RULE' then 0 else 1 end,l.recorded_at desc limit 50
          """).param("issuer",o.actor().issuer()).param("subject",o.actor().subject()).param("id",id)
            .param("episode",o.episodeKey()).param("category",category)
            .query((r,i)->new Previous(r.getString("episode_key"),r.getObject("package_id",UUID.class),item(r,i))).list();
    }
    @Transactional(readOnly=true) public List<Previous> previous(UUID id,String category){return previous(id,owner(id,false),category);}
    @Transactional(readOnly=true) public List<Item> history(UUID id,UUID itemId){
        owner(id,false);return jdbc.sql("select * from episode_review_revision where package_id=:id and item_id=:item order by revision desc")
            .param("id",id).param("item",itemId).query(this::item).list();
    }
    static String digest(String value){
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}
    }
    private View snapshot(UUID id,Owner o){
        var p=publishing.get(id);var r=reels.get(id);var d=distribution.get(id);
        String sha=p.master()!=null&&p.master().complete()?p.master().sha256():null;
        long locked=r.master()==null?0:r.reels().stream().filter(x->"LOCKED".equals(x.state())&&r.master().filmId().equals(x.filmId())).count();
        long articles=d.items().stream().filter(x->"ARTICLE".equals(x.kind())).count();
        long mediumReady=sha==null?0:d.items().stream().filter(x->"MEDIUM".equals(x.platform())&&"ARTICLE".equals(x.kind())&&
            Set.of("READY_TO_PUBLISH","PUBLISHED").contains(x.state())&&sha.equals(x.masterSha256())&&d.editorialQa()).count();
        long published=d.items().stream().filter(x->"PUBLISHED".equals(x.state())).count();
        boolean launched=d.launch().videoUrl()!=null&&d.launch().launchDate()!=null;
        var gates=new ArrayList<Gate>();
        gates.add(new Gate("Full Video lineage",sha==null?"PENDING":"PASS",sha==null?"Current exact locked sequence is not available.":"Current master lineage matches locked SHOTs; playback QA is separate."));
        gates.add(new Gate("Publishing",p.readyForDirectorRelease()?"PASS":"PENDING",p.readyForDirectorRelease()?"Publishing checks recorded for current master.":p.blockers().size()+" open publishing checks"));
        gates.add(new Gate("Reels",locked>=3?"PASS":"PENDING",locked+" current-master locked extracts; platform eligibility is separate. More qualifying extracts encouraged."));
        gates.add(new Gate("Distribution",mediumReady>0?"PASS":"PENDING",articles+" article drafts/records; "+published+" recorded publications; "+mediumReady+" cleared Medium articles."));
        gates.add(new Gate("Public launch record",launched?"PASS":"PENDING",launched?"Director-recorded public URL; external availability not independently verified.":"No actual public URL recorded."));
        List<String> blockers=new ArrayList<>(p.blockers());blockers.addAll(d.blockers());
        if(locked<3)blockers.add("At least three current-master locked direct Reel extracts are required.");
        if(!p.releaseRecorded())blockers.add("Director release authorization not recorded.");
        for(var q:p.items()){
            if(!q.fieldKey().startsWith("QA_"))continue;
            boolean current=sha!=null&&sha.equals(q.masterSha256())&&
                p.blockers().stream().noneMatch(b->b.startsWith(q.fieldKey()+":"));
            String state="PASS".equals(q.state())&&current&&(!"QA_RELEASE".equals(q.fieldKey())||p.releaseRecorded())?"PASS":
                "FAIL".equals(q.state())&&sha!=null&&sha.equals(q.masterSha256())?"FAIL":"PENDING";
            gates.add(new Gate(q.fieldKey().replace("QA_","QA: "),state,
                q.revision()==0?"Not recorded.":q.state()+" recorded in Publishing revision "+q.revision()+
                    ("PASS".equals(q.state())&&!"PASS".equals(state)?" — requires current review.":"")));
        }
        String contextSummary=String.join("\n",gates.stream().map(g->g.name()+": "+g.status()+" — "+g.detail()).toList())
            +"\nOpen checks:\n"+String.join("\n",blockers);
        String context=digest(contextSummary+"|"+Objects.toString(sha,"")+"|"+p.items().stream().map(x->x.fieldKey()+":"+x.revision()+":"+x.state()).toList()
            +"|"+r.reels().stream().map(x->x.id()+":"+x.state()).sorted().toList()
            +"|"+d.items().stream().map(x->x.id()+":"+x.revision()+":"+x.state()).sorted().toList()+"|"+d.launch().revision());
        return new View(o.episodeKey(),sha,context,contextSummary,List.copyOf(gates),List.copyOf(blockers),launched,d.launch().launchDate(),items(id),previous(id,o,null));
    }
    @Transactional(readOnly=true) public View get(UUID id){return snapshot(id,owner(id,false));}
    static void validateAnalytics(Change c,LocalDate launch){
        if(launch==null||c.metric()==null||!METRICS.contains(c.metric())||c.periodStart()==null||c.periodEnd()==null||
            c.periodStart().isBefore(launch)||c.periodEnd().isBefore(c.periodStart())||c.periodEnd().isAfter(LocalDate.now()))
            throw bad("Use an actual metric and a completed observation period after recorded launch.");
        BigDecimal v=c.value();
        if(!DETAIL_METRICS.contains(c.metric())&&v==null)throw bad("Numeric metric value required.");
        if(v!=null&&(v.precision()>20||v.scale()>6||v.abs().compareTo(new BigDecimal("99999999999999"))>0||
            (!"SUBSCRIBERS_GAINED".equals(c.metric())&&v.signum()<0)))throw bad("Metric value outside supported range.");
        if("CTR_PERCENT".equals(c.metric())&&v.compareTo(BigDecimal.valueOf(100))>0)throw bad("CTR is a percentage from 0 to 100.");
        if(Set.of("VIEWS","IMPRESSIONS","SUBSCRIBERS_GAINED").contains(c.metric())&&v.stripTrailingZeros().scale()>0)
            throw bad("Counts must be whole numbers.");
        if("RPM".equals(c.metric())){
            if(c.currency()==null||!c.currency().matches("[A-Z]{3}"))throw bad("RPM needs a currency code.");
            try{Currency.getInstance(c.currency());}catch(IllegalArgumentException ex){throw bad("Unknown currency code.");}
        }else if(c.currency()!=null&&!c.currency().isBlank())throw bad("Currency applies only to RPM.");
    }
    static String field(String s,int chars,int bytes,boolean required){return EpisodeDistributionService.bounded(s,chars,bytes,required);}
    static void validateDraft(Change c,View view){
        if(c.kind()==null||!KINDS.contains(c.kind())||c.category()==null||!CATEGORIES.contains(c.category())||
            c.scope()==null||!Set.of("EPISODE","CHANNEL").contains(c.scope())||c.classification()==null||!CLASSIFICATIONS.contains(c.classification()))
            throw bad("Select a valid kind, category, applicability scope and evidence classification.");
        if(("RULE".equals(c.kind()))!="PERMANENT_RULE".equals(c.classification())||
            ("RULE".equals(c.kind())&&!"CHANNEL".equals(c.scope()))||
            (Set.of("ANALYTICS","CONCLUSION").contains(c.kind())&&!"EPISODE".equals(c.scope())))
            throw bad("Permanent rules require channel scope; analytics and conclusions are episode-specific.");
        field(c.title(),200,800,true);field(c.body(),8000,16384,true);field(c.applicability(),2000,4096,"CHANNEL".equals(c.scope()));
        field(c.evidence(),4000,8192,true);
        if("ANALYTICS".equals(c.kind())){
            if(!view.launchRecorded())throw conflict("Record the actual public launch first; unavailable analytics are not zero.");
            if(!"OBSERVATION".equals(c.classification()))throw bad("Manual analytics are observations, not causal findings.");
            validateAnalytics(c,view.launchDate());
        }else if(c.metric()!=null||c.value()!=null||c.currency()!=null||c.periodStart()!=null||c.periodEnd()!=null)throw bad("Analytics fields belong only to analytics records.");
    }
    @Transactional public View change(UUID id,Change c,UUID audit){
        Owner o=owner(id,true);View view=snapshot(id,o);
        if(c==null||audit==null||!Boolean.TRUE.equals(c.confirm())||c.expectedRevision()==null)throw conflict("Audited Director confirmation and expected revision are required.");
        if(view.masterSha256()==null)throw conflict("Complete the current Full Video before recording episode conclusions.");
        Item old=c.id()==null?null:view.items().stream().filter(x->x.id().equals(c.id())).findFirst().orElse(null);
        if(old==null&&(!"SAVE".equals(c.action())||c.expectedRevision()!=0||c.id()==null))throw bad("New review records require a stable client UUID and revision zero.");
        int rev=old==null?0:old.revision();
        if(c.expectedRevision()!=rev||rev>=100)throw conflict("Review revision changed or history limit reached. Refresh.");
        if(old==null&&view.items().size()>=200)throw conflict("Episode review record capacity reached.");
        String action=Objects.toString(c.action(),"");
        String state;
        Change draft=c;
        if("SAVE".equals(action)){
            if(old!=null&&!old.kind().equals(c.kind()))throw bad("Review record kind cannot change.");
            validateDraft(c,view);state="DRAFT";
        }
        else if(Set.of("APPROVE","RETIRE").contains(action)){
            if(old==null||("APPROVE".equals(action)&&!"DRAFT".equals(old.state()))||("RETIRE".equals(action)&&"RETIRED".equals(old.state())))
                throw conflict("Select a current draft to approve or an active record to retire.");
            if("APPROVE".equals(action)&&(!view.masterSha256().equals(old.masterSha256())||
                ("CONCLUSION".equals(old.kind())&&!view.contextSha256().equals(old.contextSha256()))))
                throw conflict("The review source changed; save a refreshed draft before approval.");
            draft=new Change(old.id(),rev,action,old.kind(),old.category(),old.scope(),old.classification(),old.title(),old.body(),
                old.applicability(),old.evidence(),old.metric(),old.value(),old.currency(),old.periodStart(),old.periodEnd(),true);
            if("APPROVE".equals(action))validateDraft(draft,view);
            state="APPROVE".equals(action)?"APPROVED":"RETIRED";
        }else throw bad("Unknown review action.");
        if(jdbc.sql("select coalesce(sum(octet_length(body)+octet_length(evidence)+octet_length(applicability)+octet_length(title)+octet_length(context_summary)),0) from episode_review_revision where package_id=:id")
            .param("id",id).query(Long.class).single()+64000L>4L*1024*1024)throw conflict("Episode review history byte budget reached.");
        jdbc.sql("""
          insert into episode_review_revision(package_id,item_id,revision,kind,category,scope,classification,title,body,applicability,evidence,
             metric,value,currency,period_start,period_end,state,master_sha256,context_sha256,context_summary,actor,audit_id)
          values(:package,:item,:rev,:kind,:category,:scope,:class,:title,:body,:applicability,:evidence,
             :metric,:value,:currency,:start,:end,:state,:sha,:context,:summary,:actor,:audit)
          """).param("package",id).param("item",old==null?c.id():old.id()).param("rev",rev+1)
            .param("kind",draft.kind()).param("category",draft.category()).param("scope",draft.scope()).param("class",draft.classification())
            .param("title",field(draft.title(),200,800,true)).param("body",field(draft.body(),8000,16384,true))
            .param("applicability",field(draft.applicability(),2000,4096,false)).param("evidence",field(draft.evidence(),4000,8192,true))
            .param("metric",draft.metric()).param("value",draft.value()).param("currency",draft.currency())
            .param("start",draft.periodStart()).param("end",draft.periodEnd()).param("state",state)
            .param("sha","RETIRE".equals(action)?old.masterSha256():view.masterSha256())
            .param("context","RETIRE".equals(action)?old.contextSha256():view.contextSha256())
            .param("summary","RETIRE".equals(action)?old.contextSummary():("CONCLUSION".equals(draft.kind())?field(view.contextSummary(),16000,32768,true):""))
            .param("actor",o.actor().auditName()).param("audit",audit).update();
        return snapshot(id,o);
    }
}
