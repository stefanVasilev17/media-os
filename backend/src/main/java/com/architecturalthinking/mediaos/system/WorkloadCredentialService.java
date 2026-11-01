package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "mediaos.worker-auth.enabled", havingValue = "true")
public class WorkloadCredentialService {
    private final JdbcClient jdbc;

    public record Identity(UUID credentialId, String workerId, String scope, UUID jobId) {}

    public WorkloadCredentialService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Identity verify(String token, String workerId, String requestedScope, UUID requestedJob) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43,128}")
                || workerId == null || !workerId.matches("[A-Za-z0-9._:-]{1,180}")
                || requestedScope == null) {
            return null;
        }
        return jdbc.sql("""
                select id, worker_id, scope, job_id
                from mediaos_worker_credential
                where token_hash=:hash and worker_id=:workerId and scope=:scope
                  and active=true and expires_at>now()
                  and (job_id is null or job_id=:job)
                """)
                .param("hash", sha256(token))
                .param("workerId", workerId)
                .param("scope", requestedScope)
                .param("job", requestedJob)
                .query((rs, row) -> new Identity(
                        rs.getObject("id", UUID.class),
                        rs.getString("worker_id"),
                        rs.getString("scope"),
                        rs.getObject("job_id", UUID.class)))
                .optional().orElse(null);
    }

    public static String sha256(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable.", exception);
        }
    }
}
