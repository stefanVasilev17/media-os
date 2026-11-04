package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RemotionGitDependencyPinService {
    public static final String REPOSITORY="stefanVasilev17/media-os";
    private static final String PATH_PREFIX="remotion-engine/";
    private static final Set<String> SHARED_PATHS=Set.of(
            "remotion-engine/src/components/architectural-thinking/index.ts",
            "remotion-engine/src/design-system/tokens.ts",
            "remotion-engine/package.json",
            "remotion-engine/src/Root.tsx",
            "remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx"
    );

    public record BlobEvidence(String path,String expectedHistoricalBlobSha,
                               String observedGitBlobSha,String status) {}
    public record Pin(String status,String repository,String branch,String pinnedCommit,
                      String registryCatalogSha256,String productionDependencySha256,
                      int verifiedPaths,List<BlobEvidence> files,List<String> blockers,
                      boolean canDispatchProvider) {}

    public interface GitHubEvidenceSource {
        String branchHead(String repository,String branch) throws IOException,InterruptedException;
        String fileBlob(String repository,String path,String commit)
                throws IOException,InterruptedException;
    }

    private final GitHubEvidenceSource github;
    private final RemotionReusableAssetRegistry registry;

    public RemotionGitDependencyPinService(GitHubEvidenceSource github,
                                            RemotionReusableAssetRegistry registry) {
        this.github=github;
        this.registry=registry;
    }

    public Pin verify() {
        Map<String,String> expected=new LinkedHashMap<>();
        var catalog=registry.catalog();
        expected.put(catalog.sourceRegistryPath(),catalog.sourceRegistryGitBlobSha());
        for(var asset:catalog.assets()) {
            String previous=expected.putIfAbsent(asset.sourcePath(),asset.gitBlobSha());
            if(previous!=null && !previous.equals(asset.gitBlobSha()))
                throw new IllegalStateException("Trusted registry contains conflicting source hashes.");
        }
        for(String path:SHARED_PATHS)expected.putIfAbsent(path,null);
        return verifyExactSources(github,registry.fingerprint(),expected);
    }

    static Pin verifyExactSources(GitHubEvidenceSource github,String catalogSha,
                                  Map<String,String> expected) {
        List<BlobEvidence> files=new ArrayList<>();
        List<String> blockers=new ArrayList<>();
        if(expected.isEmpty() || expected.size()>20
                || !catalogSha.matches("[a-f0-9]{64}"))
            throw new IllegalArgumentException("A bounded trusted registry fingerprint is required.");
        String head=null;
        try {
            head=github.branchHead(REPOSITORY,"main");
            if(!isSha(head))throw new IOException("Untrusted GitHub branch commit.");
        } catch(InterruptedException error) {
            Thread.currentThread().interrupt();
            blockers.add("GITHUB_READ_INTERRUPTED");
        } catch(Exception error) {
            blockers.add("GITHUB_HEAD_UNAVAILABLE");
        }
        if(head!=null && blockers.isEmpty()){
            for(var entry:expected.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey()).toList()) {
                String path=entry.getKey();
                if(!safeReadPath(path)) {
                    blockers.add("UNSAFE_DEPENDENCY_PATH");
                    continue;
                }
                String observed=null;
                try{
                    observed=github.fileBlob(REPOSITORY,path,head);
                }catch(InterruptedException interrupted){
                    Thread.currentThread().interrupt();
                    blockers.add("GITHUB_READ_INTERRUPTED");
                }catch(Exception error){
                    blockers.add("GITHUB_DEPENDENCY_FETCH_FAILED");
                }
                String state=!isSha(observed)?"MISSING_OR_UNVERIFIED"
                        :entry.getValue()!=null && !entry.getValue().equals(observed)
                            ?"CHANGED_FROM_DIRECTOR_REVIEWED_BASELINE"
                            :entry.getValue()!=null?"MATCH_DIRECTOR_REVIEWED_BASELINE"
                            :"PINNED_CURRENT_GIT_DEPENDENCY";
                if("MISSING_OR_UNVERIFIED".equals(state)
                        || "CHANGED_FROM_DIRECTOR_REVIEWED_BASELINE".equals(state))
                    blockers.add("GIT_DEPENDENCY_INVALID_OR_DRIFTED");
                files.add(new BlobEvidence(path,entry.getValue(),observed,state));
            }
        }
        boolean valid=blockers.isEmpty() && files.size()==expected.size();
        String snapshot=valid?dependencyDigest(REPOSITORY,head,catalogSha,files):null;
        return new Pin(valid?"GIT_DEPENDENCIES_PINNED_AND_VERIFIED":"GIT_DEPENDENCIES_BLOCKED",
                REPOSITORY,"main",head,catalogSha,snapshot,
                (int)files.stream().filter(f->f.status().startsWith("MATCH_")
                        || f.status().startsWith("PINNED_")).count(),
                List.copyOf(files),List.copyOf(blockers),false);
    }

    static String dependencyDigest(String repo,String commit,String catalogSha,
                                   List<BlobEvidence> files) {
        StringBuilder basis=new StringBuilder("mediaos.code-worker-git-pin.v1|")
                .append(repo).append('|').append(commit).append('|').append(catalogSha);
        for(BlobEvidence e:files.stream().sorted(Comparator.comparing(BlobEvidence::path)).toList())
            basis.append('|').append(e.path()).append('=').append(e.observedGitBlobSha());
        return EpisodePackageValidator.sha256(basis.toString());
    }

    static boolean safeReadPath(String path) {
        return path!=null && path.startsWith(PATH_PREFIX)
                && !path.contains("..") && !path.contains("//")
                && path.matches("[a-zA-Z0-9/_\\.-]{5,240}")
                && (path.endsWith(".tsx")||path.endsWith(".ts")||path.endsWith(".json"));
    }

    private static boolean isSha(String sha) {
        return sha!=null && sha.matches("[a-f0-9]{40}");
    }

    @Component
    public static class GitHubReadOnlyEvidenceSource implements GitHubEvidenceSource {
        private final HttpClient http=HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(7)).build();
        private final ObjectMapper mapper;
        private final String token;

        public GitHubReadOnlyEvidenceSource(ObjectMapper mapper) {
            this.mapper=mapper;
            String configured=System.getenv("MEDIA_OS_GITHUB_READ_TOKEN");
            this.token=configured==null?"":configured.trim();
        }

        @Override
        public String branchHead(String repository,String branch)
                throws IOException,InterruptedException {
            if(!REPOSITORY.equals(repository)||!"main".equals(branch))
                throw new IOException("Unapproved GitHub repository/branch.");
            JsonNode data=fetch("/repos/"+repository+"/branches/main");
            return data.path("commit").path("sha").asText("");
        }

        @Override
        public String fileBlob(String repository,String path,String commit)
                throws IOException,InterruptedException {
            if(!REPOSITORY.equals(repository)||!safeReadPath(path)||!isSha(commit))
                throw new IOException("Unsafe GitHub read parameters.");
            JsonNode data=fetch("/repos/"+repository+"/contents/"+path+"?ref="+commit);
            if(!"file".equals(data.path("type").asText())
                    || !path.equals(data.path("path").asText()))
                throw new IOException("GitHub returned an unexpected file.");
            return data.path("sha").asText("");
        }

        private JsonNode fetch(String safePath) throws IOException,InterruptedException {
            HttpRequest.Builder request=HttpRequest.newBuilder(
                    URI.create("https://api.github.com"+safePath))
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .header("User-Agent","MediaOS-ReadOnly-Source-Pin")
                    .header("Accept","application/vnd.github+json");
            if(!token.isBlank())request.header("Authorization","Bearer "+token);
            HttpResponse<String> response=http.send(request.build(),
                    HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()!=200)
                throw new IOException("GitHub read-only evidence unavailable HTTP "+response.statusCode());
            if(response.body().length()>200000)
                throw new IOException("Unexpected oversized GitHub metadata.");
            return mapper.readTree(response.body());
        }
    }
}
