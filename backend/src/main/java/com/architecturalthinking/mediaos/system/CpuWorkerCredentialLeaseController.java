package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;

@RestController
@ConditionalOnProperty(name = "mediaos.cpu-worker.bootstrap-enabled", havingValue = "true")
public final class CpuWorkerCredentialLeaseController {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TOKEN_LIFETIME_MINUTES = 60;
    private final JdbcClient jdbc;
    private final byte[] bootstrapSecret;
    private final String allowedWorkerId;

    public record Lease(String token, OffsetDateTime expiresAt) {}

    public CpuWorkerCredentialLeaseController(JdbcClient jdbc,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String bootstrapSecret,
            @Value("${MEDIAOS_CPU_WORKER_ALLOWED_ID:}") String allowedWorkerId,
            @Value("${mediaos.worker-auth.enabled:false}") boolean workerAuthEnabled) {
        if (!workerAuthEnabled || bootstrapSecret == null || bootstrapSecret.length() < 32
                || allowedWorkerId == null || !allowedWorkerId.matches("[A-Za-z0-9._:-]{1,180}")) {
            throw new IllegalStateException("CPU worker bootstrap requires scoped worker auth, a strong existing worker key, and a pinned worker ID.");
        }
        this.jdbc = jdbc;
        this.bootstrapSecret = bootstrapSecret.getBytes(StandardCharsets.UTF_8);
        this.allowedWorkerId = allowedWorkerId;
    }

    @PostMapping("/api/v1/worker/remotion/cpu/lease")
    @Transactional
    public ResponseEntity<Lease> issue(
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String workerKey,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String legacyWorkerId,
            @RequestHeader(value = "X-Worker-Id", required = false) String workerId) {
        if (workerKey == null
                || !MessageDigest.isEqual(bootstrapSecret, workerKey.getBytes(StandardCharsets.UTF_8))
                || !allowedWorkerId.equals(workerId)
                || !allowedWorkerId.equals(legacyWorkerId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid CPU worker bootstrap identity.");
        }

        jdbc.sql("select pg_advisory_xact_lock(hashtext(:workerId)::bigint)")
                .param("workerId", allowedWorkerId).query((rs, row) -> true).single();

        Long recent = jdbc.sql("""
                select count(*) from mediaos_worker_credential
                where worker_id=:workerId and scope='REMOTION_CPU'
                  and created_at > now() - interval '1 minute'
                """).param("workerId", allowedWorkerId).query(Long.class).single();
        if (recent >= 3L) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "CPU worker token renewal rate limit reached.");
        }

        byte[] entropy = new byte[48];
        RANDOM.nextBytes(entropy);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(entropy);
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(TOKEN_LIFETIME_MINUTES);
        UUID id = UUID.randomUUID();

        jdbc.sql("""
                insert into mediaos_worker_credential
                    (id,worker_id,token_hash,scope,job_id,active,expires_at)
                values (:id,:worker,:hash,'REMOTION_CPU',null,true,:expires)
                """)
                .param("id", id).param("worker", allowedWorkerId)
                .param("hash", WorkloadCredentialService.sha256(token))
                .param("expires", expiresAt).update();
        jdbc.sql("""
                insert into mediaos_worker_credential_audit
                    (id,credential_id,operation,change_ticket)
                values (:id,:credential,'ISSUED','CPU_AUTO_RENEWAL')
                """)
                .param("id", UUID.randomUUID()).param("credential", id).update();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .body(new Lease(token, expiresAt));
    }
}
