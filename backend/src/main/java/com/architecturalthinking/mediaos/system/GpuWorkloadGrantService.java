package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "mediaos.worker-auth.enabled", havingValue = "true")
public class GpuWorkloadGrantService {
    private final JdbcClient jdbc;
    private final SecureRandom random = new SecureRandom();

    public record Grant(UUID id, String workerId, String token) {}

    public GpuWorkloadGrantService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public Grant issue(UUID renderId, String scope, Duration lifetime) {
        if (renderId == null || (!"REMOTION_GPU".equals(scope) && !"SPLINE_GPU".equals(scope)))
            throw new IllegalArgumentException("GPU grant requires a render UUID and GPU scope.");
        if (lifetime == null || lifetime.compareTo(Duration.ofMinutes(5)) < 0
                || lifetime.compareTo(Duration.ofMinutes(45)) > 0)
            throw new IllegalArgumentException("GPU grant lifetime must be 5–45 minutes.");
        byte[] secret = new byte[32];
        random.nextBytes(secret);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        java.util.Arrays.fill(secret, (byte) 0);
        String workerId = "runpod-gpu:" + renderId;
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into mediaos_worker_credential
                    (id,worker_id,token_hash,scope,job_id,active,expires_at)
                values (:id,:workerId,:hash,:scope,:job,true,:expires)
                """)
                .param("id", id).param("workerId", workerId)
                .param("hash", WorkloadCredentialService.sha256(token))
                .param("scope", scope).param("job", renderId)
                .param("expires", OffsetDateTime.now(ZoneOffset.UTC).plus(lifetime))
                .update();
        audit(id, "ISSUED");
        return new Grant(id, workerId, token);
    }

    @Transactional
    public void revoke(UUID credentialId) {
        if (credentialId == null) return;
        int updated = jdbc.sql("""
                update mediaos_worker_credential set active=false
                where id=:id and active=true
                """).param("id", credentialId).update();
        if (updated > 0) audit(credentialId, "REVOKED");
    }

    private void audit(UUID credentialId, String action) {
        jdbc.sql("""
                insert into mediaos_worker_credential_audit
                    (id,credential_id,operation,change_ticket)
                values (:id,:credential,:operation,:ticket)
                """)
                .param("id", UUID.randomUUID())
                .param("credential", credentialId)
                .param("operation", action)
                .param("ticket", "GPU_DISPATCH_AUTO")
                .update();
    }
}
