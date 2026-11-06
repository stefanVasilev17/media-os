package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class Ep002SingleShotGitEvidenceService {
    static final String REPO="stefanVasilev17/media-os";
    static final String API="/repos/"+REPO;
    private final EpisodeFactoryGitCodeAuditService.JsonRead github;

    public record Evidence(
            boolean verified,int prNumber,String shotKey,
            String currentMainCommit,String sourceBlobSha,
            String policyDigest,List<String> blockers) {}

    @Autowired
    public Ep002SingleShotGitEvidenceService(ObjectMapper mapper) {
        this(new EpisodeFactoryGitCodeAuditService.LiveGitHubJsonRead(mapper));
    }

    Ep002SingleShotGitEvidenceService(EpisodeFactoryGitCodeAuditService.JsonRead source) {
        this.github=source;
    }

    public record PolicyEvidence(boolean verified,String mainCommit,
                                 String policyDigest,List<String> blockers) {}

    public record VerificationTarget(boolean verified,String sourceCommit,
                                     String reason) {}

    public VerificationTarget verificationTarget() {
        try {
            JsonNode pr=github.fetch(API+"/pulls/191");
            boolean correct=REPO.equals(
                    pr.path("base").path("repo").path("full_name").asText())
                    && "main".equals(pr.path("base").path("ref").asText())
                    && REPO.equals(
                        pr.path("head").path("repo").path("full_name").asText())
                    && MediaOsVerificationRunService.BRANCH.equals(
                        pr.path("head").path("ref").asText())
                    && "open".equals(pr.path("state").asText());
            String sha=pr.path("head").path("sha").asText("");
            if(!correct||!isSha(sha))
                return new VerificationTarget(false,null,
                        "UNTRUSTED_OR_CLOSED_VERIFICATION_PR_SOURCE");
            return new VerificationTarget(true,sha,"LIVE_PRIVATE_GITHUB_PR191_HEAD_VERIFIED");
        }catch(InterruptedException interrupted){
            Thread.currentThread().interrupt();
            return new VerificationTarget(false,null,"GITHUB_VERIFICATION_INTERRUPTED");
        }catch(IOException|RuntimeException failure){
            return new VerificationTarget(false,null,
                    "PRIVATE_GITHUB_READ_ACCESS_REQUIRED");
        }
    }



    public PolicyEvidence verifyCurrentPolicy() {
        try {
            String main=github.fetch(API+"/branches/main")
                    .path("commit").path("sha").asText("");
            if(!isSha(main))
                return new PolicyEvidence(false,null,null,List.of("NO_TRUSTED_MAIN_COMMIT"));
            List<String> blobs=new ArrayList<>();
            for(var entry:Ep002SequentialVisualPreflightService.RULES.subList(0,4)) {
                JsonNode record=github.fetch(
                        API+"/contents/"+entry.path()+"?ref="+main);
                String sha=record.path("sha").asText("");
                if(!"file".equals(record.path("type").asText())
                        || !entry.path().equals(record.path("path").asText())
                        || !isSha(sha))
                    return new PolicyEvidence(false,null,null,
                            List.of("REQUIRED_POLICY_DOCUMENT_MISSING_ON_PINNED_MAIN"));
                blobs.add(entry.path()+"="+sha);
            }
            String finalMain=github.fetch(API+"/branches/main")
                    .path("commit").path("sha").asText("");
            if(!main.equals(finalMain))
                return new PolicyEvidence(false,null,null,
                        List.of("GITHUB_MAIN_MOVED_DURING_POLICY_READ"));
            return new PolicyEvidence(true,main,
                    EpisodePackageValidator.sha256(
                            "EP002_VISUAL_POLICY_V1|"+String.join("|",blobs)),List.of());
        }catch(InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return new PolicyEvidence(false,null,null,
                    List.of("GITHUB_POLICY_READ_INTERRUPTED"));
        }catch(IOException | RuntimeException problem) {
            return new PolicyEvidence(false,null,null,
                    List.of("PRIVATE_GITHUB_POLICY_VERIFICATION_UNAVAILABLE"));
        }
    }

    public Evidence verify(String shotKey,int prNumber) {
        if(shotKey==null || !shotKey.matches("SHOT(0[2-9]|1[01])")
                || prNumber<1 || prNumber>1000000)
            return blocked(prNumber,shotKey,"UNSAFE_EP002_SHOT_OR_PR");
        String codePath="remotion-engine/src/episodes/ep002/Shot"+
                shotKey.substring(4)+"GeneratedScene.tsx";
        try {
            JsonNode pr=github.fetch(API+"/pulls/"+prNumber);
            JsonNode diff=github.fetch(API+"/pulls/"+prNumber+"/files?per_page=100&page=1");
            JsonNode main=github.fetch(API+"/branches/main");
            String mainSha=main.path("commit").path("sha").asText("");
            if(!isSha(mainSha))return blocked(prNumber,shotKey,"INVALID_MAIN_SHA");
            if(!REPO.equals(pr.path("base").path("repo").path("full_name").asText())
                    || !"main".equals(pr.path("base").path("ref").asText())
                    || !REPO.equals(pr.path("head").path("repo").path("full_name").asText())
                    || !pr.path("merged").asBoolean(false))
                return blocked(prNumber,shotKey,"PR_NOT_TRUSTED_AND_MERGED_TO_MAIN");
            if(!diff.isArray() || diff.size()!=1 || pr.path("changed_files").asInt()!=1)
                return blocked(prNumber,shotKey,"PR_MUST_TOUCH_EXACTLY_ONE_SHOT_SCENE");
            JsonNode changed=diff.path(0);
            String changedPath=changed.path("filename").asText();
            String blob=changed.path("sha").asText();
            if(!codePath.equals(changedPath)
                    || !"added".equals(changed.path("status").asText())
                    && !"modified".equals(changed.path("status").asText())
                    || !isSha(blob))
                return blocked(prNumber,shotKey,"UNSAFE_OR_UNVERIFIED_REMOTION_FILE_CHANGE");
            JsonNode live=github.fetch(API+"/contents/"+codePath+"?ref=main");
            if(!"file".equals(live.path("type").asText())
                    || !codePath.equals(live.path("path").asText())
                    || !blob.equals(live.path("sha").asText()))
                return blocked(prNumber,shotKey,"SCENE_BLOB_NOT_IN_CURRENT_MAIN");
            List<String> pinned=new ArrayList<>();
            for(var file:Ep002SequentialVisualPreflightService.RULES.subList(0,4)) {
                JsonNode rule=github.fetch(API+"/contents/"+file.path()+"?ref=main");
                String sha=rule.path("sha").asText("");
                if(!"file".equals(rule.path("type").asText())
                        || !file.path().equals(rule.path("path").asText())
                        || !isSha(sha))
                    return blocked(prNumber,shotKey,"REQUIRED_VISUAL_POLICY_NOT_PRESENT_ON_MAIN");
                pinned.add(file.path()+"="+sha);
            }
            String digest=EpisodePackageValidator.sha256(
                    "EP002_VISUAL_POLICY_V1|"+String.join("|",pinned));
            return new Evidence(true,prNumber,shotKey,mainSha,blob,digest,List.of());
        } catch(InterruptedException ex) {
            Thread.currentThread().interrupt();
            return blocked(prNumber,shotKey,"GITHUB_READ_INTERRUPTED");
        } catch(IOException | RuntimeException ex) {
            return blocked(prNumber,shotKey,"PRIVATE_GITHUB_AUDIT_UNAVAILABLE");
        }
    }

    static boolean isSha(String raw) {
        return raw!=null&&raw.matches("[a-f0-9]{40}");
    }

    private static Evidence blocked(int pr,String shot,String reason) {
        return new Evidence(false,pr,shot,null,null,null,List.of(reason));
    }
}
