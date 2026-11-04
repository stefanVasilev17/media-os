package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public class EpisodeFactoryWorkerCapabilityController {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final String secret;

    public EpisodeFactoryWorkerCapabilityController(JdbcClient jdbc,ObjectMapper mapper,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.secret=workerKey==null?"":workerKey.trim();
    }

    public record Capability(String sourceCommit,List<String> sceneKeys,boolean buildChecked) {}

    static void validate(Capability data) {
        if(data==null||data.sourceCommit()==null
                ||!data.sourceCommit().matches("[a-f0-9]{40}")
                ||data.sceneKeys()==null||data.sceneKeys().size()>40
                ||new HashSet<>(data.sceneKeys()).size()!=data.sceneKeys().size()
                ||data.sceneKeys().stream().anyMatch(key->
                    key==null || !key.matches("EP[0-9]{3,}-SHOT[0-9]{2}")
                    ||key.startsWith("EP001-") || key.startsWith("EP002-"))
                ||!data.buildChecked())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Worker must provide source SHA, safe scene inventory and successful build attestation.");
    }

    @PostMapping("/factory-capability")
    public Map<String,Object> heartbeat(
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String workerKey,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String workerId,
            @RequestBody Capability body) {
        requireWorker(workerKey,workerId);
        validate(body);
        String json;
        try{json=mapper.writeValueAsString(body.sceneKeys());}
        catch(Exception ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Factory worker scene inventory cannot be serialized.");}
        jdbc.sql("""
                insert into episode_factory_worker_capability(
                    worker_id,source_commit,bundled_scenes,build_checked,last_heartbeat_at
                ) values(:worker,:sha,cast(:keys as jsonb),true,now())
                on conflict (worker_id) do update
                  set source_commit=excluded.source_commit,
                      bundled_scenes=excluded.bundled_scenes,
                      build_checked=true,last_heartbeat_at=now()
                """).param("worker",workerId.trim())
                .param("sha",body.sourceCommit()).param("keys",json).update();
        return Map.of("state","FACTORY_BUNDLE_REPORTED",
                "sceneCount",body.sceneKeys().size(),
                "sourceCommit",body.sourceCommit());
    }

    private void requireWorker(String key,String worker) {
        if(secret.isBlank()||key==null||worker==null
                ||worker.isBlank()||worker.length()>160
                ||!MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8),
                        key.trim().getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Authenticated Remotion CPU worker credentials required.");
    }
}
