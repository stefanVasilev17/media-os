package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class EpisodeCodeWorkerPreflightService {
    private static final int FPS=30;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final EpisodeMultiShotExecutionService jobs;
    private final EpisodePackageVoiceReadinessService readiness;
    private final RemotionReusableAssetRegistry assets;

    public EpisodeCodeWorkerPreflightService(JdbcClient jdbc,ObjectMapper mapper,
            EpisodeMultiShotExecutionService jobs,
            EpisodePackageVoiceReadinessService readiness,
            RemotionReusableAssetRegistry assets) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.jobs=jobs;
        this.readiness=readiness;
        this.assets=assets;
    }

    public record AssetMatch(String requestedKey,String resolution,
                             String component,String assetStatus,
                             String sourcePath,String verifiedGitBlobSha) {}
    public record Cue(String beatId,String anchor,double startSeconds,double endSeconds,
                      int startFrame,int endFrame) {}
    public record ShotPlan(String shotKey,int shotIndex,String proposedFilePath,
                           int narrationRevision,String selectedTakeId,
                           BigDecimal measuredAudioSeconds,int durationInFrames,
                           String visualGoal,String cameraDirection,
                           List<AssetMatch> assets,List<Cue> verifiedCues,
                           int unresolvedAssets,boolean codeProposalAllowed) {}
    public record Preflight(UUID packageId,UUID jobId,String episodeKey,
                            String state,String sourceSha256,String readinessFingerprint,
                            String currentReadinessFingerprint,boolean sameVoiceSnapshot,
                            String assetCatalogVersion,String assetCatalogSha256,
                            String assetReferenceGitSha,String productionInputCandidateSha256,
                            String dependencyStatus,String repository,String allowedOutputPrefix,
                            int registeredAssets,int totalShots,int missingAssetKeys,
                            boolean providerDispatchEnabled,boolean canStartAgent,
                            String nextAction,List<ShotPlan> shots) {}
    record Source(String key,int shotIndex,int revision,String take,
                  BigDecimal measuredSeconds,String visual,String verifiedCues) {}

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Preflight plan(UUID packageId,UUID jobId) {
        var job=jobs.get(packageId,jobId);
        String prefix=safePrefix(job.episodeKey(),job.repository(),job.codePathPrefix());
        var current=readiness.report(packageId);
        boolean same=job.readinessFingerprint().equals(current.readinessFingerprint())
                && job.sourceSha256().equals(current.sourceSha256())
                && current.eligibleForAiBudgetReview();

        List<Source> sources=jdbc.sql("""
                select shot_key,shot_index,narration_revision,approved_take_id,
                       measured_audio_seconds,original_visual_story::text,
                       verified_cues::text
                  from episode_multi_shot_execution_task
                 where job_id=:job order by shot_index
                """).param("job",jobId).query((rs,n)->new Source(
                rs.getString("shot_key"),rs.getInt("shot_index"),
                rs.getInt("narration_revision"),
                rs.getObject("approved_take_id",UUID.class).toString(),
                rs.getBigDecimal("measured_audio_seconds"),
                rs.getString("original_visual_story"),rs.getString("verified_cues")))
                .list();

        if(sources.isEmpty() || sources.size()!=job.totalTasks()
                || sources.size()!=job.tasks().size())
            throw conflict("Prepared Multi-SHOT job lacks a complete source snapshot.");

        List<ShotPlan> shotPlans=new ArrayList<>();
        int missing=0;
        for(int i=0;i<sources.size();i++){
            Source source=sources.get(i);
            String expected=String.format(Locale.ROOT,"SHOT%02d",i+1);
            if(source.shotIndex()!=i+1 || !expected.equals(source.key())
                    || source.measuredSeconds()==null
                    || source.measuredSeconds().signum()<=0)
                throw conflict("Prepared SHOT order/audio evidence is invalid.");

            JsonNode story=parse(source.visual(),"original visual story");
            JsonNode cues=parse(source.verifiedCues(),"verified voice cues");
            if(!story.isObject() || !cues.isArray() || cues.isEmpty()
                    || !story.path("visualBeats").isArray()
                    || story.path("visualBeats").size()!=cues.size())
                throw conflict("Original visual story and measured voice cues differ.");

            int frameCount=framesForDuration(source.measuredSeconds());
            Set<String> requested=new LinkedHashSet<>();
            addAssetKeys(story.path("assetKeys"),requested);
            for(JsonNode beat:story.path("visualBeats"))addAssetKeys(beat.path("assets"),requested);
            List<AssetMatch> resolved=new ArrayList<>();
            for(String key:requested){
                var found=assets.resolve(key);
                if(found==null){
                    resolved.add(new AssetMatch(key,"NEW_ASSET_PROPOSAL_REQUIRED",
                            null,null,null,null));
                    missing++;
                }else{
                    resolved.add(new AssetMatch(key,
                            "DIRECTOR_LOCKED_REUSE_ONLY".equals(found.status())
                                ?"REUSE_EXISTING_WITHOUT_MODIFICATION"
                                :"REVIEW_EXISTING_BEFORE_REUSE",
                            found.component(),found.status(),
                            found.sourcePath(),found.gitBlobSha()));
                }
            }

            List<Cue> timed=new ArrayList<>();
            for(int beatIndex=0;beatIndex<cues.size();beatIndex++){
                JsonNode cue=cues.get(beatIndex);
                JsonNode original=story.path("visualBeats").get(beatIndex);
                if(!Objects.equals(cue.path("beatId").asText(),original.path("beatId").asText())
                        || !cue.path("startSeconds").isNumber()
                        || !cue.path("endSeconds").isNumber())
                    throw conflict("Verified voice cue does not match the original ordered visual beat.");
                double begin=cue.path("startSeconds").asDouble();
                double end=cue.path("endSeconds").asDouble();
                int startFrame=frameFromSeconds(begin,false,frameCount);
                int endFrame=frameFromSeconds(end,true,frameCount);
                if(end<begin || endFrame<=startFrame)
                    throw conflict("Verified cue has no usable frame duration.");
                timed.add(new Cue(cue.path("beatId").asText(),
                        cue.path("cueAnchor").asText(""),
                        begin,end,startFrame,endFrame));
            }

            shotPlans.add(new ShotPlan(source.key(),source.shotIndex(),
                    proposalFilePath(prefix,source.shotIndex()),
                    source.revision(),source.take(),source.measuredSeconds(),
                    frameCount,story.path("visualGoal").asText(""),
                    story.path("cameraDirection").asText(""),
                    List.copyOf(resolved),List.copyOf(timed),
                    (int)resolved.stream().filter(x->x.component()==null).count(),
                    false));
        }

        String snapshotHash=EpisodePackageValidator.sha256(
                job.sourceSha256()+"|"+job.readinessFingerprint()+"|"+
                assets.fingerprint()+"|"+assets.catalog().sourceGitCommit());
        String dependencyStatus=!same?"STALE_VOICE_READINESS"
                :missing>0?"MISSING_ASSET_DECISIONS_AND_GIT_REVALIDATION"
                :"PINNED_GIT_DEPENDENCIES_AND_DIRECTOR_START_REQUIRED";
        return new Preflight(packageId,jobId,job.episodeKey(),job.state(),
                job.sourceSha256(),job.readinessFingerprint(),
                current.readinessFingerprint(),same,
                assets.catalog().schemaVersion(),assets.fingerprint(),
                assets.catalog().sourceGitCommit(),snapshotHash,
                dependencyStatus,job.repository(),prefix,
                assets.catalog().assets().size(),sources.size(),missing,
                false,false,
                "Review explicit asset matches and missing assets. Pin and revalidate actual Git blobs and shared dependencies; then implement a separately approved, budget-metered Agent Code Worker. This preview never calls OpenAI or changes GitHub.",
                List.copyOf(shotPlans));
    }

    static String safePrefix(String episode,String repository,String existingPrefix) {
        if(episode==null || !episode.matches("EP[0-9]{3,}")
                || episode.equals("EP001") || episode.equals("EP002")
                || !EpisodeAiProductionAuthorizationService.REPOSITORY.equals(repository))
            throw conflict("Only the Director-owned new-episode repository scope is allowed.");
        String expected="remotion-engine/src/episodes/"+
                episode.toLowerCase(Locale.ROOT)+"/";
        if(!expected.equals(existingPrefix))throw conflict("Unsafe code proposal prefix.");
        return expected;
    }

    static String proposalFilePath(String prefix,int index){
        if(prefix==null
                || !prefix.matches("remotion-engine/src/episodes/ep(?!001/|002/)[0-9]{3,}/")
                || index<1 || index>40)
            throw conflict("Generated file path is outside the approved episode.");
        return prefix+String.format(Locale.ROOT,"Shot%02dGeneratedScene.tsx",index);
    }

    static int framesForDuration(BigDecimal seconds) {
        if(seconds==null || seconds.signum()<=0
                || seconds.compareTo(new BigDecimal("3600"))>0)
            throw conflict("Actual audio duration is required for frame timing.");
        return seconds.multiply(BigDecimal.valueOf(FPS))
                .setScale(0,RoundingMode.CEILING).intValueExact();
    }

    static int frameFromSeconds(double seconds,boolean end,int durationFrames){
        if(!Double.isFinite(seconds) || seconds<0
                || seconds>durationFrames/(double)FPS+0.001)
            throw conflict("Voice cue exceeds measured audio frame bounds.");
        int calculated=end?(int)Math.ceil(seconds*FPS):(int)Math.floor(seconds*FPS);
        if(calculated>durationFrames)
            throw conflict("Voice cue cannot be silently clipped to the shot duration.");
        return calculated;
    }

    private void addAssetKeys(JsonNode array,Set<String> keys){
        if(array==null || array.isMissingNode() || array.isNull())return;
        if(!array.isArray() || array.size()>100)throw conflict("Invalid source visual asset keys.");
        for(JsonNode value:array) {
            if(!value.isTextual() || value.asText().isBlank()
                    || value.asText().length()>80)
                throw conflict("Invalid visual asset declaration in original source.");
            keys.add(value.asText());
        }
    }

    private JsonNode parse(String text,String source){
        try{return mapper.readTree(text);}
        catch(Exception ex){throw conflict("Malformed "+source+" in immutable job.");}
    }

    private static ResponseStatusException conflict(String reason){
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
