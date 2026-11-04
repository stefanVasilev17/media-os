package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class EpisodeFactoryRenderCoordinator {
    private static final UUID PROJECT=UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int FPS=30;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final EpisodeFactoryPostCodeService runs;

    public EpisodeFactoryRenderCoordinator(JdbcClient jdbc,ObjectMapper mapper,
            EpisodeFactoryPostCodeService runs) {
        this.jdbc=jdbc;this.mapper=mapper;this.runs=runs;
    }

    public record CpuApprovalRequest(UUID requestId,String expectedSourceDigest,
                                    int maximumFrames,Boolean authorizeCpuSpend) {}
    public record ReviewRequest(UUID requestId,String expectedSourceDigest,
                                Boolean confirmWatchedAndApproved) {}
    public record QueueReceipt(UUID runId,String kind,int jobsSubmitted,
                               int existingJobsReused,String sourceCommit,
                               String approvalRequestId,boolean providerDispatchEnabled,
                               String nextAction) {}
    public record BuildEvidence(boolean verified,String workerCommit,
                                int compiledShots,List<String> blockers) {}

    record Worker(String id,String sha,String inventory) {}
    record RenderRow(UUID id,String status) {}
    record SourceShot(String key,int index,int frames,String take,String codePath,
                      String rendered,String renderId,boolean approved) {}

    static void requireCpuApproval(CpuApprovalRequest request,int minFrames) {
        if(request==null || request.requestId()==null
                || !Boolean.TRUE.equals(request.authorizeCpuSpend())
                || request.expectedSourceDigest()==null
                || !request.expectedSourceDigest().matches("[a-f0-9]{64}")
                || minFrames<1||minFrames>150000
                || request.maximumFrames()<minFrames || request.maximumFrames()>150000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Separate Director CPU consent, exact source digest and capped frame allowance are mandatory.");
    }

    static void requireReview(ReviewRequest request) {
        if(request==null || request.requestId()==null
                || !Boolean.TRUE.equals(request.confirmWatchedAndApproved())
                || request.expectedSourceDigest()==null
                || !request.expectedSourceDigest().matches("[a-f0-9]{64}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Explicit visual review, fresh source SHA and unique request UUID required.");
    }

    @Transactional(readOnly=true)
    public BuildEvidence buildEvidence(EpisodeFactoryPostCodeService.Run run) {
        if(run.sourceCommit()==null || !run.sourceScopeVerified())
            return new BuildEvidence(false,null,0,List.of("GITHUB_MERGED_CODE_NOT_VERIFIED"));
        var evidence=jdbc.sql("""
                select worker_id,source_commit,bundled_scenes::text
                  from episode_factory_worker_capability
                 where source_commit=:sha and build_checked=true
                   and last_heartbeat_at > now()-interval '120 seconds'
                 order by last_heartbeat_at desc limit 1
                """).param("sha",run.sourceCommit())
                .query((rs,n)->new Worker(rs.getString("worker_id"),
                        rs.getString("source_commit"),rs.getString("bundled_scenes")))
                .optional().orElse(null);
        if(evidence==null)
            return new BuildEvidence(false,null,0,List.of("NO_RECENT_MATCHING_COMPILED_WORKER_COMMIT"));
        List<String> known;
        try{known=mapper.readValue(evidence.inventory(),
                mapper.getTypeFactory().constructCollectionType(List.class,String.class));}
        catch(Exception ex){
            return new BuildEvidence(false,evidence.sha(),0,List.of("WORKER_SCENE_INVENTORY_INVALID"));
        }
        List<String> missing=run.shotStates().stream()
                .map(s->run.episodeKey()+"-"+s.shotKey())
                .filter(k->!known.contains(k)).toList();
        if(!missing.isEmpty())
            return new BuildEvidence(false,evidence.sha(),run.shots()-missing.size(),
                    List.of("WORKER_BUILD_MISSING_SCENES_"+String.join("_",missing)));
        return new BuildEvidence(true,evidence.sha(),run.shots(),List.of());
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public QueueReceipt queueShots(UUID packageId,UUID runId,
                                   CpuApprovalRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        var run=precondition(packageId,runId,true);
        var build=buildEvidence(run);
        if(!build.verified())throw conflict("The render worker has not proved an exact SHA-matching compilation of EVERY scene.");
        requireCpuApproval(request,run.totalFrames());
        assertDigest(run,request.expectedSourceDigest());
        boolean replay=authorization(run,request,"SHOTS",run.totalFrames(),actor,auditId);
        if(replay)return receipt(run,"SHOTS",0,run.shots(),request.requestId(),
                "Previous Director CPU approval already consumed; inspect existing render jobs.");
        int created=0,reused=0;
        for(var shot:run.shotStates()) {
            Map<String,Object> props=new LinkedHashMap<>();
            props.put("episodeKey",run.episodeKey());
            props.put("shotKey",shot.shotKey());
            props.put("durationInFrames",shot.durationFrames());
            props.put("voiceTakeId",shot.selectedTakeId());
            props.put("expectedSourceCommit",run.sourceCommit());
            props.put("sourceDigest",run.sourceScopeSha256());
            props.put("manifestSha",run.sourceManifestSha256());
            props.put("runId",run.runId().toString());
            String key="mediaos.factory.shot.v1|"+run.sourceScopeSha256()+
                    "|"+shot.shotKey()+"|"+shot.selectedTakeId()+
                    "|"+shot.durationFrames();
            RenderRow render=existingOrInsert(run,"AT-FACTORY-SHOT","REVIEW",
                    1920,1080,shot.durationFrames(),props,key,request.requestId());
            if(render.status().equals("CREATED"))created++;else reused++;
            jdbc.sql("""
                    update episode_factory_shot
                       set last_requested_render=:render,director_approved=false,
                           last_successful_render=case when :reuseSuccess then :render
                                                     else last_successful_render end,
                           last_render_input_sha256=case when :reuseSuccess then :hash
                                                        else last_render_input_sha256 end
                     where run_id=:run and shot_key=:shot
                    """).param("render",render.id()).param("run",runId)
                    .param("shot",shot.shotKey())
                    .param("reuseSuccess","SUCCEEDED".equals(render.status()))
                    .param("hash",run.sourceScopeSha256()).update();
        }
        jdbc.sql("""
                update episode_factory_production_run
                   set state='RENDER_QUEUED',render_approval_at=now(),
                       rendered_source_digest=:digest,updated_at=now()
                 where id=:run
                """).param("digest",run.sourceScopeSha256())
                .param("run",runId).update();
        return receipt(run,"SHOTS",created,reused,request.requestId(),
                "Worker may execute only the explicitly approved 1920x1080 source-pinned SHOT render jobs.");
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public EpisodeFactoryPostCodeService.Run approveAllShots(
            UUID packageId,UUID runId,ReviewRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        var run=precondition(packageId,runId,true);
        requireReview(request);
        assertDigest(run,request.expectedSourceDigest());
        if(auditId==null)throw conflict("Audited Director SHOT visual approval required.");
        if(run.renderedShots()!=run.shots() || run.shots()<1)
            throw conflict("All SHOT previews must have completed with verified video before collective Director approval.");
        String renderEvidence=renderEvidence(run);
        UUID previous=jdbc.sql("""
                select id from episode_factory_shot_review_approval
                 where request_id=:request and director_issuer=:issuer
                   and director_subject=:subject
                """).param("request",request.requestId())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query(UUID.class).optional().orElse(null);
        if(previous==null){
            jdbc.sql("""
                    insert into episode_factory_shot_review_approval(
                        id,request_id,run_id,verified_source_digest,
                        approved_render_digest,shot_count,director_issuer,
                        director_subject,preflight_audit_id
                    ) values(:id,:request,:run,:source,:renders,:count,
                             :issuer,:subject,:audit)
                    """).param("id",UUID.randomUUID()).param("request",request.requestId())
                    .param("run",runId).param("source",run.sourceScopeSha256())
                    .param("renders",renderEvidence).param("count",run.shots())
                    .param("issuer",actor.issuer()).param("subject",actor.subject())
                    .param("audit",auditId).update();
        }else{
            boolean matching=jdbc.sql("""
                    select exists(select 1 from episode_factory_shot_review_approval
                                   where id=:id and run_id=:run
                                     and verified_source_digest=:source
                                     and approved_render_digest=:renders)
                    """).param("id",previous).param("run",runId)
                    .param("source",run.sourceScopeSha256())
                    .param("renders",renderEvidence).query(Boolean.class).single();
            if(!matching)throw conflict("SHOT approval request replay differs from the reviewed render evidence.");
        }
        jdbc.sql("""
                update episode_factory_shot set director_approved=true
                 where run_id=:run and last_successful_render is not null
                """).param("run",runId).update();
        jdbc.sql("""
                update episode_factory_production_run
                   set state='SHOT_REVIEW_READY',updated_at=now()
                 where id=:run
                """).param("run",runId).update();
        return runs.get(packageId,runId);
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public QueueReceipt queueMaster(UUID packageId,UUID runId,
                                    CpuApprovalRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        var run=precondition(packageId,runId,true);
        assertAllApproved(run);
        requireCpuApproval(request,run.totalFrames());
        assertDigest(run,request.expectedSourceDigest());
        boolean replay=authorization(run,request,"MASTER",run.totalFrames(),actor,auditId);
        if(replay)return receipt(run,"MASTER",0,1,request.requestId(),"Existing master approval reused.");
        var output=run.outputPlans().stream().filter(x->x.kind().equals("MASTER"))
                .findFirst().orElseThrow(()->conflict("Master output plan is missing."));
        Map<String,Object> props=assemblyProps(run);
        props.put("startFrame",0);
        props.put("endFrame",run.totalFrames());
        var stored=existingOrInsert(run,"AT-FACTORY-MASTER","MASTER",1920,1080,
                run.totalFrames(),props,"mediaos.factory.master.v1|"+renderEvidence(run),
                request.requestId());
        jdbc.sql("""
                update episode_factory_output_plan
                   set render_id=:render,review_state='QUEUED'
                 where run_id=:run and kind='MASTER' and ordinal=0
                """).param("render",stored.id()).param("run",runId).update();
        return receipt(run,"MASTER","CREATED".equals(stored.status())?1:0,
                "CREATED".equals(stored.status())?0:1,request.requestId(),
                "Queued full-episode master. Video storage limit remains 256MB until approved object storage is configured.");
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public QueueReceipt queueShorts(UUID packageId,UUID runId,
                                    CpuApprovalRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        var run=precondition(packageId,runId,true);
        assertAllApproved(run);
        var candidates=run.outputPlans().stream()
                .filter(p->p.kind().equals("SHORT")).toList();
        if(candidates.size()!=3)throw conflict("Exactly three non-overlapping Shorts windows are required.");
        int requested=candidates.stream().mapToInt(x->x.endFrame()-x.startFrame()).sum();
        requireCpuApproval(request,requested);
        assertDigest(run,request.expectedSourceDigest());
        boolean replay=authorization(run,request,"SHORTS",requested,actor,auditId);
        if(replay)return receipt(run,"SHORTS",0,3,request.requestId(),"Existing Shorts approval reused.");
        int created=0,reused=0;
        for(var cut:candidates){
            Map<String,Object> props=assemblyProps(run);
            props.put("startFrame",cut.startFrame());
            props.put("endFrame",cut.endFrame());
            props.put("shortOrdinal",cut.ordinal());
            int frames=cut.endFrame()-cut.startFrame();
            var row=existingOrInsert(run,"AT-FACTORY-SHORT","REEL",1080,1920,
                    frames,props,"mediaos.factory.short.v1|"+renderEvidence(run)
                            +"|"+cut.ordinal()+"|"+cut.startFrame()+"|"+cut.endFrame(),
                    request.requestId());
            if("CREATED".equals(row.status()))created++;else reused++;
            jdbc.sql("""
                    update episode_factory_output_plan
                       set render_id=:render,review_state='QUEUED'
                     where run_id=:run and kind='SHORT' and ordinal=:ordinal
                    """).param("render",row.id()).param("run",runId)
                    .param("ordinal",cut.ordinal()).update();
        }
        return receipt(run,"SHORTS",created,reused,request.requestId(),
                "Queued three 9:16 draft reels. Director must check framing/hook before approval.");
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public EpisodeFactoryPostCodeService.Run approveFinal(UUID packageId,UUID runId,
                                               ReviewRequest request,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        var run=precondition(packageId,runId,true);
        assertAllApproved(run);
        requireReview(request);
        assertDigest(run,request.expectedSourceDigest());
        if(auditId==null)throw conflict("Audited final review required.");
        var outputs=run.outputPlans();
        var master=outputs.stream().filter(p->p.kind().equals("MASTER")).toList();
        var shorts=outputs.stream().filter(p->p.kind().equals("SHORT"))
                .sorted(java.util.Comparator.comparingInt(EpisodeFactoryPostCodeService.OutputState::ordinal))
                .toList();
        if(master.size()!=1 || shorts.size()!=3)
            throw conflict("Exactly one master and three Shorts are mandatory.");
        List<String> renderIds=new ArrayList<>();
        for(var output:List.of(master.get(0),shorts.get(0),shorts.get(1),shorts.get(2))){
            if(output.renderId()==null)throw conflict("A required final MP4 has not been created.");
            String status=jdbc.sql("""
                    select status from remotion_render where id=:render and video_data is not null
                    """).param("render",UUID.fromString(output.renderId()))
                    .query(String.class).optional().orElse("");
            if(!"SUCCEEDED".equals(status))throw conflict("The master and all three Shorts must be rendered before final review.");
            renderIds.add(output.renderId());
        }
        var previous=jdbc.sql("""
                select id from episode_factory_final_review_approval
                 where request_id=:request and director_issuer=:issuer
                   and director_subject=:subject
                """).param("request",request.requestId()).param("issuer",actor.issuer())
                .param("subject",actor.subject()).query(UUID.class).optional().orElse(null);
        if(previous!=null){
            boolean exact=jdbc.sql("""
                    select exists(select 1 from episode_factory_final_review_approval
                                   where id=:id and run_id=:run
                                    and verified_source_digest=:source)
                    """).param("id",previous).param("run",runId)
                    .param("source",run.sourceScopeSha256())
                    .query(Boolean.class).single();
            if(!exact)throw conflict("Final review UUID replay does not match this release.");
        }else{
            jdbc.sql("""
                    insert into episode_factory_final_review_approval(
                        id,request_id,run_id,verified_source_digest,
                        review_master_render_id,short1_render_id,short2_render_id,short3_render_id,
                        director_issuer,director_subject,preflight_audit_id
                    ) values(:id,:request,:run,:source,:master,:short1,:short2,:short3,
                             :issuer,:subject,:audit)
                    """).param("id",UUID.randomUUID()).param("request",request.requestId())
                    .param("run",runId).param("source",run.sourceScopeSha256())
                    .param("master",UUID.fromString(renderIds.get(0)))
                    .param("short1",UUID.fromString(renderIds.get(1)))
                    .param("short2",UUID.fromString(renderIds.get(2)))
                    .param("short3",UUID.fromString(renderIds.get(3)))
                    .param("issuer",actor.issuer()).param("subject",actor.subject())
                    .param("audit",auditId).update();
        }
        jdbc.sql("""
                update episode_factory_production_run
                   set state='FINAL_DIRECTOR_APPROVED',updated_at=now()
                 where id=:run
                """).param("run",runId).update();
        return runs.get(packageId,runId);
    }

    private EpisodeFactoryPostCodeService.Run precondition(
            UUID packageId,UUID runId,boolean checkFeedback) {
        var run=runs.get(packageId,runId);
        if(!run.currentVoiceMatches()||run.sourceCommit()==null
                ||!run.sourceScopeVerified()||run.sourceScopeSha256()==null
                ||(checkFeedback&&!run.openFeedback().isEmpty()))
            throw conflict("Factory voice/Git input stale, PR unverified or Director feedback is unresolved.");
        return run;
    }

    private void assertAllApproved(EpisodeFactoryPostCodeService.Run run) {
        if(run.shots()==0||run.renderedShots()!=run.shots()
                ||run.approvedShots()!=run.shots())
            throw conflict("All SHOT MP4s must be rendered and explicitly Director-approved.");
    }

    private void assertDigest(EpisodeFactoryPostCodeService.Run run,String expected){
        if(!Objects.equals(run.sourceScopeSha256(),expected))
            throw conflict("Source SHA changed since Director reviewed the CPU authorization.");
    }

    private boolean authorization(EpisodeFactoryPostCodeService.Run run,
            CpuApprovalRequest input,String kind,int frames,
            DirectorIdentity.Actor actor,UUID auditId) {
        if(auditId==null)throw conflict("Audited CPU authorization required.");
        var prior=jdbc.sql("""
                select run_id,kind,verified_source_digest,requested_frames
                  from episode_factory_cpu_authorization
                 where request_id=:request and director_issuer=:issuer
                   and director_subject=:subject
                """).param("request",input.requestId()).param("issuer",actor.issuer())
                .param("subject",actor.subject())
                .query((rs,n)->new String[]{rs.getString("run_id"),
                        rs.getString("kind"),rs.getString("verified_source_digest"),
                        rs.getString("requested_frames")}).optional().orElse(null);
        if(prior!=null){
            if(!prior[0].equals(run.runId().toString())||!prior[1].equals(kind)
                    ||!prior[2].equals(input.expectedSourceDigest())
                    ||Integer.parseInt(prior[3])!=frames)
                throw conflict("CPU authorization UUID already belongs to another render operation.");
            return true;
        }
        int attempts=jdbc.sql("""
                select count(*) from episode_factory_cpu_authorization
                 where run_id=:run and kind=:kind
                """).param("run",run.runId()).param("kind",kind)
                .query(Integer.class).single();
        if(attempts>=3)throw conflict("Maximum of three separate Director CPU authorizations per output kind reached.");
        jdbc.sql("""
                insert into episode_factory_cpu_authorization(
                    id,request_id,run_id,kind,original_manifest_sha256,
                    verified_source_digest,worker_source_commit,
                    maximum_frames,requested_frames,
                    director_issuer,director_subject,preflight_audit_id
                ) values(:id,:request,:run,:kind,:manifest,:source,:commit,:max,:frames,
                         :issuer,:subject,:audit)
                """).param("id",UUID.randomUUID()).param("request",input.requestId())
                .param("run",run.runId()).param("kind",kind)
                .param("manifest",run.sourceManifestSha256())
                .param("source",run.sourceScopeSha256())
                .param("commit",run.sourceCommit()).param("max",input.maximumFrames())
                .param("frames",frames).param("issuer",actor.issuer())
                .param("subject",actor.subject()).param("audit",auditId).update();
        return false;
    }

    private RenderRow existingOrInsert(EpisodeFactoryPostCodeService.Run run,
            String composition,String profile,int width,int height,int frames,
            Map<String,Object> props,String basis,UUID requestId) {
        String hash=EpisodePackageValidator.sha256(basis);
        var existing=jdbc.sql("""
                select id,status from remotion_render
                 where project_id=:project and render_hash=:hash
                """).param("project",PROJECT).param("hash",hash)
                .query((rs,n)->new RenderRow(rs.getObject("id",UUID.class),
                        rs.getString("status"))).optional().orElse(null);
        if(existing!=null && !existing.status().equals("FAILED"))
            return existing;
        if(existing!=null)hash=EpisodePackageValidator.sha256(basis+"|retry|"+requestId);
        UUID id=UUID.randomUUID();
        String encoded;
        try{encoded=mapper.writeValueAsString(props);}
        catch(Exception ex){throw conflict("Factory output props cannot be encoded.");}
        jdbc.sql("""
                insert into remotion_render(
                    id,project_id,episode_id,composition_id,render_key,engine_version,
                    input_props,render_hash,profile,status,width,height,fps,
                    duration_in_frames,progress
                ) values(:id,:project,null,:composition,:key,:engine,
                          cast(:props as jsonb),:hash,:profile,'QUEUED',
                          :width,:height,30,:frames,0)
                """).param("id",id).param("project",PROJECT)
                .param("composition",composition).param("key",composition)
                .param("engine","AT_FACTORY_"+run.sourceCommit().substring(0,12))
                .param("props",encoded).param("hash",hash).param("profile",profile)
                .param("width",width).param("height",height)
                .param("frames",frames).update();
        return new RenderRow(id,"CREATED");
    }

    private Map<String,Object> assemblyProps(EpisodeFactoryPostCodeService.Run run){
        var renderIds=run.shotStates().stream().map(EpisodeFactoryPostCodeService.ShotState::renderId).toList();
        if(renderIds.stream().anyMatch(Objects::isNull))
            throw conflict("All reviewed source MP4s must be stored before assembly.");
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("runId",run.runId().toString());
        props.put("episodeKey",run.episodeKey());
        props.put("sourceRenderIds",renderIds);
        props.put("expectedSourceCommit",run.sourceCommit());
        props.put("sourceDigest",run.sourceScopeSha256());
        props.put("durationInFrames",run.totalFrames());
        return props;
    }

    private static String renderEvidence(EpisodeFactoryPostCodeService.Run run) {
        var proof=new StringBuilder(run.sourceScopeSha256());
        for(var shot:run.shotStates()) {
            if(!shot.rendered()||shot.renderId()==null)
                throw conflict("A source render has not succeeded.");
            proof.append('|').append(shot.shotKey()).append('=').append(shot.renderId());
        }
        return EpisodePackageValidator.sha256(proof.toString());
    }

    private static QueueReceipt receipt(EpisodeFactoryPostCodeService.Run run,
            String kind,int created,int reused,UUID approval,String note) {
        return new QueueReceipt(run.runId(),kind,created,reused,run.sourceCommit(),
                approval.toString(),false,note);
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
