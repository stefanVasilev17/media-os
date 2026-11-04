package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class EpisodeFactoryGitCodeAuditService {
    private static final String REPOSITORY = "stefanVasilev17/media-os";
    private final JsonRead github;

    public interface JsonRead {
        JsonNode fetch(String path) throws IOException, InterruptedException;
    }

    public EpisodeFactoryGitCodeAuditService(ObjectMapper mapper) {
        this.github = new LiveGitHubJsonRead(mapper);
    }

    EpisodeFactoryGitCodeAuditService(JsonRead source) {
        this.github = source;
    }

    public record CheckedFile(String path,String blobSha,String status) {}
    public record GitAudit(String status,int prNumber,String mergedCommit,String mainHead,
                           String digest,List<CheckedFile> files,List<String> blockers,
                           boolean sourceScopeVerified,boolean buildVerified,
                           boolean canQueueCpuRendering) {}

    public GitAudit verify(String episodeKey,int number,
                           List<EpisodeCodexCloudHandoffService.Shot> shots) {
        if(!validEpisode(episodeKey) || shots==null || shots.isEmpty()
                || shots.size()>40 || number<1)
            throw new IllegalArgumentException("A bounded EP003+ imported episode and PR are required.");

        List<String> blockers=new ArrayList<>();
        JsonNode pr;
        JsonNode contents;
        String mainSha=null;
        String mergeSha=null;
        try{
            pr=github.fetch("/repos/"+REPOSITORY+"/pulls/"+number);
            contents=github.fetch("/repos/"+REPOSITORY+"/pulls/"+number+"/files?per_page=100&page=1");
            JsonNode head=github.fetch("/repos/"+REPOSITORY+"/branches/main");
            mainSha=head.path("commit").path("sha").asText("");
        }catch(InterruptedException ex){
            Thread.currentThread().interrupt();
            return blocked(number,"GITHUB_READ_INTERRUPTED");
        }catch(Exception ex){
            return blocked(number,"GITHUB_READ_UNAVAILABLE");
        }

        if(!REPOSITORY.equals(pr.path("base").path("repo").path("full_name").asText())
                || !"main".equals(pr.path("base").path("ref").asText())
                || !REPOSITORY.equals(pr.path("head").path("repo").path("full_name").asText()))
            blockers.add("UNTRUSTED_PR_BASE_OR_FORK");
        if(!pr.path("merged").asBoolean(false))
            blockers.add("DIRECTOR_MERGE_REQUIRED_BEFORE_RENDER");
        mergeSha=pr.path("merge_commit_sha").asText("");
        if(!isGitSha(mergeSha)||!isGitSha(mainSha))
            blockers.add("GIT_COMMIT_EVIDENCE_INVALID");
        if(!contents.isArray() || contents.isEmpty()
                || pr.path("changed_files").asInt(999)!=contents.size()
                || contents.size()>100)
            blockers.add("INCOMPLETE_PR_DIFF_OR_MORE_THAN_100_FILES");

        Map<String,String> actual=new HashMap<>();
        Set<String> paths=new HashSet<>();
        List<CheckedFile> files=new ArrayList<>();
        if(contents.isArray()){
            for(JsonNode entry:contents){
                String path=entry.path("filename").asText("");
                String sha=entry.path("sha").asText("");
                String state=entry.path("status").asText("");
                boolean scoped=safeNewEpisodePath(episodeKey,path);
                if(!scoped || !Set.of("added","modified").contains(state)
                        || !isGitSha(sha) || !paths.add(path)){
                    blockers.add("OUT_OF_SCOPE_OR_UNTRUSTED_PR_CHANGE");
                    files.add(new CheckedFile(path,sha,"BLOCKED"));
                    continue;
                }
                actual.put(path,sha);
                files.add(new CheckedFile(path,sha,"EPISODE_ONLY_PROPOSED"));
            }
        }

        for(var shot:shots){
            String path=shot.outputPath();
            if(!path.equals(expectedShotPath(episodeKey,shot.shotIndex()))
                    || !shot.shotKey().equals(String.format(java.util.Locale.ROOT,
                            "SHOT%02d",shot.shotIndex()))
                    || !actual.containsKey(path))
                blockers.add("MISSING_REQUIRED_GENERATED_SHOT_"+shot.shotKey());
        }

        if(blockers.isEmpty()){
            try{
                for(var f:files){
                    JsonNode git=github.fetch("/repos/"+REPOSITORY+"/contents/"+
                            f.path()+"?ref="+mergeSha);
                    if(!"file".equals(git.path("type").asText())
                            || !f.path().equals(git.path("path").asText())
                            || !f.blobSha().equals(git.path("sha").asText()))
                        blockers.add("MERGED_BLOB_DIFFERS_FROM_VERIFIED_PR");
                }
            }catch(InterruptedException e){
                Thread.currentThread().interrupt();blockers.add("GIT_BLOB_CHECK_INTERRUPTED");
            }catch(Exception e){blockers.add("MERGED_BLOB_UNAVAILABLE");}
        }
        if(blockers.isEmpty()){
            // No GitHub Actions and no trusted build evidence yet. This proves the
            // actual merged file set and SHA only. Worker build verification is separate.
            String joined=files.stream().sorted(java.util.Comparator.comparing(CheckedFile::path))
                    .map(f->f.path()+"="+f.blobSha()).collect(java.util.stream.Collectors.joining("|"));
            String digest=EpisodePackageValidator.sha256(episodeKey+"|"+number+"|"+
                    mergeSha+"|"+joined);
            return new GitAudit("GITHUB_MERGED_SOURCE_SCOPED_NEEDS_WORKER_BUILD",number,
                    mergeSha,mainSha,digest,List.copyOf(files),List.of(),true,false,false);
        }
        return new GitAudit("GITHUB_SOURCE_BLOCKED",number,mergeSha,mainSha,null,
                List.copyOf(files),List.copyOf(new HashSet<>(blockers)),false,false,false);
    }

    static String expectedShotPath(String episode,int index){
        if(!validEpisode(episode)||index<1||index>40)
            throw new IllegalArgumentException("Unsafe factory scene destination.");
        return "remotion-engine/src/episodes/"+episode.toLowerCase(java.util.Locale.ROOT)+
                "/Shot"+String.format(java.util.Locale.ROOT,"%02d",index)+"GeneratedScene.tsx";
    }

    static boolean safeNewEpisodePath(String episode,String path){
        if(!validEpisode(episode)||path==null)return false;
        String prefix="remotion-engine/src/episodes/"+
                episode.toLowerCase(java.util.Locale.ROOT)+"/";
        if(!path.startsWith(prefix)||path.length()>220||path.contains("..")
                ||path.contains("//"))return false;
        String remain=path.substring(prefix.length());
        return remain.matches("[A-Za-z][A-Za-z0-9_-]{0,90}\\.(tsx|ts|json)")
                && !remain.equals("package.json") && !remain.equals("tsconfig.json");
    }

    private static boolean validEpisode(String episode){
        return episode!=null&&episode.matches("EP[0-9]{3,}")
                && !episode.equals("EP001")&&!episode.equals("EP002");
    }

    private static boolean isGitSha(String sha){
        return sha!=null&&sha.matches("[a-f0-9]{40}");
    }

    private static GitAudit blocked(int pr,String reason){
        return new GitAudit("GITHUB_SOURCE_BLOCKED",pr,null,null,null,
                List.of(),List.of(reason),false,false,false);
    }

    static class LiveGitHubJsonRead implements JsonRead {
        private final HttpClient http=HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6)).build();
        private final ObjectMapper mapper;
        private final String token;

        LiveGitHubJsonRead(ObjectMapper mapper){
            this.mapper=mapper;
            var environment=System.getenv("MEDIA_OS_GITHUB_READ_TOKEN");
            this.token=environment==null?"":environment.trim();
        }

        @Override
        public JsonNode fetch(String path) throws IOException,InterruptedException{
            if(path==null||!path.startsWith("/repos/"+REPOSITORY+"/")
                    || path.contains("..")||path.contains("#")
                    ||path.contains("&")||path.contains("//"))
                throw new IOException("Forbidden GitHub metadata path.");
            HttpRequest.Builder request=HttpRequest.newBuilder(
                    URI.create("https://api.github.com"+path))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent","MediaOS-Factory-GitHub-ReadOnly")
                    .header("Accept","application/vnd.github+json")
                    .GET();
            if(!token.isBlank())request.header("Authorization","Bearer "+token);
            var response=http.send(request.build(),HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()!=200||response.body().length()>600_000)
                throw new IOException("GitHub source is private, oversized, rate-limited or unavailable.");
            return mapper.readTree(response.body());
        }
    }
}
