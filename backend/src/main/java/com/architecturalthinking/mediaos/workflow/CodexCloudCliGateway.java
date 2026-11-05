package com.architecturalthinking.mediaos.workflow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Component
public class CodexCloudCliGateway {
    private static final Pattern TASK=Pattern.compile("task_e_[A-Za-z0-9_]{8,130}");
    private static final Pattern ENV=Pattern.compile("[A-Za-z0-9_.:/-]{1,160}");
    private static final int OUTPUT_LIMIT=8192;

    private final boolean enabled;
    private final String environmentId;
    private final Path checkout;

    public CodexCloudCliGateway(
            @Value("${mediaos.codex.cloud-cli-enabled:false}") boolean enabled,
            @Value("${mediaos.codex.cloud-environment-id:}") String environmentId,
            @Value("${mediaos.codex.checkout-directory:}") String checkoutDirectory) {
        this.enabled=enabled;
        this.environmentId=environmentId==null?"":environmentId.trim();
        this.checkout=checkoutDirectory==null||checkoutDirectory.isBlank()
                ?null:Path.of(checkoutDirectory).toAbsolutePath().normalize();
    }

    public record Capability(boolean supported,String reason) {}
    public record Submission(String state,String taskId,String reason) {}
    record CommandResult(int exitCode,boolean timedOut,String output) {}

    public Capability probe() {
        if(!enabled)return new Capability(false,"CLOUD_CLI_AUTOMATION_DISABLED");
        if(!ENV.matcher(environmentId).matches())
            return new Capability(false,"PUBLISHED_CLOUD_ENVIRONMENT_ID_NOT_CONFIGURED");
        if(checkout==null||!Files.isDirectory(checkout.resolve(".git")))
            return new Capability(false,"TRUSTED_PRIVATE_GIT_CHECKOUT_MISSING");
        CommandResult login=execute(List.of("codex","login","status"),Duration.ofSeconds(12));
        if(login.exitCode()!=0 || login.timedOut()
                || !login.output().contains("Logged in using ChatGPT"))
            return new Capability(false,"CHATGPT_PLAN_LOGIN_NOT_VERIFIED");
        CommandResult catalog=execute(
                List.of("codex","cloud","list","--env",environmentId,"--json"),
                Duration.ofSeconds(18));
        if(catalog.timedOut()||catalog.exitCode()!=0)
            return new Capability(false,"CODEX_CLOUD_ENVIRONMENT_NOT_DISCOVERABLE_BY_CLI");
        return new Capability(true,"CLOUD_CLI_ENVIRONMENT_CATALOG_CHECK_PASSED");
    }

    public Submission submit(String prompt) {
        if(prompt==null||prompt.isBlank()||prompt.length()>30000)
            return new Submission("NOT_SUBMITTED",null,"UNSAFE_OR_MISSING_REMOTION_TASK_PROMPT");
        Capability capability=probe();
        if(!capability.supported())
            return new Submission("NOT_SUBMITTED",null,capability.reason());
        CommandResult result=execute(commandFor(environmentId,prompt),Duration.ofSeconds(60));
        var match=TASK.matcher(result.output());
        if(match.find() && !result.timedOut() && result.exitCode()==0)
            return new Submission("REMOTE_CREATED",match.group(),"TASK_ID_RETURNED_BY_OFFICIAL_CLI");
        // The CLI may have submitted before a timeout or connection interruption.
        // Never automatically retry when remote creation cannot be disproved.
        return new Submission("REMOTE_UNKNOWN",null,
                result.timedOut()?"SUBMISSION_TIMED_OUT_RECONCILE_WITH_PROVIDER"
                        :"SUBMISSION_RESULT_AMBIGUOUS_NO_AUTOMATIC_RETRY");
    }

    static List<String> commandFor(String environment,String prompt) {
        if(environment==null||!ENV.matcher(environment).matches()
                || prompt==null||prompt.isBlank()||prompt.length()>30000)
            throw new IllegalArgumentException("Unsafe Codex Cloud launch arguments.");
        return List.of("codex","cloud","exec","--env",environment,
                "--branch","main","--attempts","1",prompt);
    }

    private CommandResult execute(List<String> args,Duration limit) {
        Process process=null;
        try {
            ProcessBuilder builder=new ProcessBuilder(new ArrayList<>(args))
                    .directory(checkout.toFile()).redirectErrorStream(true);
            // This dispatcher is subscription-authenticated only.
            // Never inherit pay-per-token API keys into the Codex child process.
            Map<String,String> env=builder.environment();
            env.remove("OPENAI_API_KEY");
            env.remove("OPENAI_ORG_ID");
            env.remove("OPENAI_PROJECT_ID");
            process=builder.start();
            Process running=process;
            ByteArrayOutputStream buffer=new ByteArrayOutputStream();
            Thread drain=Thread.ofVirtual().start(()->{
                try(var input=running.getInputStream()){
                    byte[] chunk=new byte[1024];
                    int count;
                    while((count=input.read(chunk))>=0) {
                        if(buffer.size()<OUTPUT_LIMIT)
                            buffer.write(chunk,0,Math.min(count,OUTPUT_LIMIT-buffer.size()));
                    }
                }catch(Exception ignored){}
            });
            boolean finished=process.waitFor(limit.toMillis(),TimeUnit.MILLISECONDS);
            if(!finished) {
                process.destroyForcibly();
                process.waitFor(2,TimeUnit.SECONDS);
            }
            drain.join(2000);
            return new CommandResult(finished?process.exitValue():-1,
                    !finished,buffer.toString(StandardCharsets.UTF_8));
        }catch(Exception ex){
            if(ex instanceof InterruptedException)Thread.currentThread().interrupt();
            if(process!=null)process.destroyForcibly();
            return new CommandResult(-1,false,"");
        }
    }
}
