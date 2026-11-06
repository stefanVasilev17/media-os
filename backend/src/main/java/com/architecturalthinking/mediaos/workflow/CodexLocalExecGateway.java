package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class CodexLocalExecGateway {
    private final boolean enabled;
    private final boolean isolatedWorker;
    private final Path checkout;
    private final ObjectMapper mapper;
    private final Duration duration;

    public CodexLocalExecGateway(
            @Value("${mediaos.codex.local-exec-enabled:false}") boolean enabled,
            @Value("${mediaos.codex.local-isolated-worker:false}") boolean isolatedWorker,
            @Value("${mediaos.codex.local-checkout-directory:}") String root,
            @Value("${mediaos.codex.local-task-timeout-seconds:900}") int seconds,
            ObjectMapper mapper) {
        this.enabled=enabled;
        this.isolatedWorker=isolatedWorker;
        this.checkout=root==null||root.isBlank()?null:Path.of(root).toAbsolutePath().normalize();
        this.duration=Duration.ofSeconds(Math.max(60,Math.min(1800,seconds)));
        this.mapper=mapper;
    }

    public record Capability(boolean ready,String blocker) {}
    public record Result(String outcome,String sessionId,String reason) {}

    public Capability probe() {
        if(!enabled)return new Capability(false,"LOCAL_CODEX_WORKER_DISABLED");
        if(!isolatedWorker)
            return new Capability(false,"CODEX_EXEC_REQUIRES_EXPLICIT_ISOLATED_WORKER");
        if(checkout==null || !Files.isDirectory(checkout)
                || !Files.exists(checkout.resolve(".git"))
                || !Files.exists(checkout.resolve("AGENTS.md")))
            return new Capability(false,"ISOLATED_GIT_CHECKOUT_AND_AGENT_RULES_REQUIRED");
        Process process=null;
        try {
            ProcessBuilder login=new ProcessBuilder("codex","login","status")
                    .directory(checkout.toFile()).redirectErrorStream(true);
            restrictEnvironment(login);
            process=login.start();
            if(!process.waitFor(12,TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return new Capability(false,"CODEX_LOGIN_CHECK_TIMED_OUT");
            }
            String output=new String(process.getInputStream().readNBytes(4096),
                    StandardCharsets.UTF_8);
            if(process.exitValue()!=0 || !output.contains("Logged in using ChatGPT"))
                return new Capability(false,"CHATGPT_ACCOUNT_SIGN_IN_REQUIRED");
            return new Capability(true,"CHATGPT_CLI_LOGIN_PRESENT_INFERENCE_UNVERIFIED");
        }catch(InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return new Capability(false,"CODEX_LOGIN_CHECK_INTERRUPTED");
        }catch(Exception failure) {
            return new Capability(false,"CODEX_LOCAL_WORKER_UNAVAILABLE");
        }finally {
            if(process!=null&&process.isAlive())process.destroyForcibly();
        }
    }

    public Result submit(String prompt,String expectedSceneFile,String expectedMainCommit) {
        if(prompt==null||prompt.isBlank()||prompt.length()>30000
                || !allowedScene(expectedSceneFile)
                || expectedMainCommit==null||!expectedMainCommit.matches("[a-f0-9]{40}"))
            return new Result("NOT_SUBMITTED",null,"UNSAFE_PROMPT_OR_SCENE_SCOPE");
        Capability ready=probe();
        if(!ready.ready())
            return new Result("NOT_SUBMITTED",null,ready.blocker());
        if(!gitChanges().equals(""))return new Result(
                "NOT_SUBMITTED",null,"ISOLATED_SCENE_WORKTREE_MUST_START_CLEAN");
        if(!expectedMainCommit.equals(gitHead()))
            return new Result("NOT_SUBMITTED",null,"CHECKOUT_NOT_AT_PINNED_GITHUB_MAIN");
        Process process=null;
        try {
            ProcessBuilder builder=new ProcessBuilder(argv(checkout))
                    .directory(checkout.toFile()).redirectErrorStream(true);
            restrictEnvironment(builder);
            process=builder.start();
            Process current=process;
            AtomicBoolean completed=new AtomicBoolean(false);
            String[] session={null};
            Thread reader=Thread.ofVirtual().start(()->{
                try(var input=new BufferedReader(new InputStreamReader(
                        current.getInputStream(),StandardCharsets.UTF_8))){
                    String line;
                    while((line=input.readLine())!=null){
                        if(line.length()>131072)continue;
                        try {
                            JsonNode event=mapper.readTree(line);
                            if("thread.started".equals(event.path("type").asText())) {
                                String id=event.path("thread_id").asText("");
                                if(id.matches("[0-9a-f-]{36}"))session[0]=id;
                            }
                            if(completedEvent(event))completed.set(true);
                        }catch(Exception ignored){}
                    }
                }catch(Exception ignored){}
            });
            try(var stdin=process.getOutputStream()){
                stdin.write(prompt.getBytes(StandardCharsets.UTF_8));
                stdin.write('\n');
            }
            boolean finished=process.waitFor(duration.toSeconds(),TimeUnit.SECONDS);
            if(!finished){
                process.destroyForcibly();
                process.waitFor(2,TimeUnit.SECONDS);
            }
            reader.join(2000);
            if(finished&&process.exitValue()==0&&completed.get()&&session[0]!=null
                    && safeSingleSceneChange(expectedSceneFile))
                return new Result("FINISHED_UNVERIFIED",session[0],
                        "ONE_SCENE_CHANGED_SOURCE_PR_AND_BUILD_AUDIT_STILL_REQUIRED");
            return new Result("UNKNOWN",session[0],
                    finished?"CODEX_TURN_NOT_PROVEN_COMPLETE_NO_AUTO_RETRY":
                            "CODEX_EXEC_TIMED_OUT_NO_AUTO_RETRY");
        }catch(InterruptedException interrupted){
            Thread.currentThread().interrupt();
            if(process!=null)process.destroyForcibly();
            return new Result("UNKNOWN",null,"CODEX_EXEC_INTERRUPTED_NO_AUTO_RETRY");
        }catch(Exception failure) {
            if(process!=null)process.destroyForcibly();
            return new Result("UNKNOWN",null,"CODEX_EXEC_ERROR_NO_AUTO_RETRY");
        }
    }

    static boolean allowedScene(String file) {
        return file!=null && file.matches(
                "remotion-engine/src/episodes/ep002/Shot(0[2-9]|1[01])GeneratedScene\\.tsx");
    }

    private boolean safeSingleSceneChange(String expected) {
        String git=gitChanges();
        if(git.startsWith("UNAVAILABLE:"))return false;
        String[] entries=git.strip().split("\\R");
        if(entries.length!=1 || entries[0].length()<4)return false;
        String path=entries[0].substring(3).trim();
        if(!expected.equals(path))return false;
        Path target=checkout.resolve(expected).normalize();
        try {
            return target.startsWith(checkout)
                    && Files.isRegularFile(target,java.nio.file.LinkOption.NOFOLLOW_LINKS)
                    && Files.size(target)>=64 && Files.size(target)<=1024*1024;
        }catch(Exception failure){return false;}
    }

    private String gitHead() {
        Process process=null;
        try {
            ProcessBuilder builder=new ProcessBuilder("git","rev-parse","HEAD")
                    .directory(checkout.toFile()).redirectErrorStream(true);
            restrictEnvironment(builder);
            process=builder.start();
            if(!process.waitFor(8,TimeUnit.SECONDS)){
                process.destroyForcibly();
                return "";
            }
            String result=new String(process.getInputStream().readNBytes(256),
                    StandardCharsets.UTF_8).trim();
            return process.exitValue()==0&&result.matches("[a-f0-9]{40}")?result:"";
        }catch(Exception failure){
            if(failure instanceof InterruptedException)Thread.currentThread().interrupt();
            return "";
        }finally{
            if(process!=null&&process.isAlive())process.destroyForcibly();
        }
    }

    private String gitChanges() {
        Process process=null;
        try {
            ProcessBuilder builder=new ProcessBuilder(
                    "git","status","--porcelain","--untracked-files=all")
                    .directory(checkout.toFile()).redirectErrorStream(true);
            restrictEnvironment(builder);
            process=builder.start();
            if(!process.waitFor(8,TimeUnit.SECONDS)){
                process.destroyForcibly();
                return "UNAVAILABLE:TIMEOUT";
            }
            String out=new String(process.getInputStream().readNBytes(8192),
                    StandardCharsets.UTF_8);
            return process.exitValue()==0?out:"UNAVAILABLE:INVALID_GIT_WORKTREE";
        }catch(Exception failure){
            if(failure instanceof InterruptedException)Thread.currentThread().interrupt();
            return "UNAVAILABLE:GIT_STATUS_ERROR";
        }finally{
            if(process!=null&&process.isAlive())process.destroyForcibly();
        }
    }

    private static void restrictEnvironment(ProcessBuilder builder) {
        Map<String,String> inherited=System.getenv();
        Map<String,String> env=builder.environment();
        env.clear();
        for(String key:List.of("PATH","HOME","USER","LANG","LC_ALL",
                "XDG_CONFIG_HOME","XDG_DATA_HOME","CODEX_HOME")) {
            String value=inherited.get(key);
            if(value!=null&&!value.isBlank())env.put(key,value);
        }
        env.put("CI","1");
    }

    static List<String> argv(Path directory) {
        if(directory==null||!directory.isAbsolute())
            throw new IllegalArgumentException("An absolute isolated checkout is required.");
        return List.of("codex","exec","--ignore-user-config",
                "--json","--sandbox","workspace-write","--cd",directory.toString(),"-");
    }

    static boolean completedEvent(JsonNode event) {
        if(event==null||!"turn.completed".equals(event.path("type").asText()))
            return false;
        JsonNode turn=event.path("turn");
        return "completed".equals(turn.path("status").asText(""))
                || (turn.isMissingNode() && event.has("usage"));
    }
}
