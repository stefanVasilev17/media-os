package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;

public final class WorkloadCredentialOfflineAdmin {
    private static final Set<String> SCOPES = Set.of(
            "RUNNER", "SPLINE", "SPLINE_SHOT", "SPLINE_SNAPSHOT",
            "REMOTION_CPU", "REMOTION_GPU", "SPLINE_GPU");
    private final JdbcClient jdbc;

    public WorkloadCredentialOfflineAdmin(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public UUID issue(String workerId, String scope, UUID jobId,
                      String token, Duration lifetime, String ticket) {
        requireTransaction(ticket);
        if (workerId == null || !workerId.matches("[A-Za-z0-9._:-]{1,180}"))
            throw new IllegalArgumentException("Invalid worker identifier.");
        if (!SCOPES.contains(scope))
            throw new IllegalArgumentException("Unknown worker scope.");
        if (("REMOTION_GPU".equals(scope) || "SPLINE_GPU".equals(scope)) != (jobId != null))
            throw new IllegalArgumentException("Only GPU credentials are job-bound.");
        if (lifetime == null || lifetime.compareTo(Duration.ofMinutes(5)) < 0
                || lifetime.compareTo(Duration.ofDays(1)) > 0)
            throw new IllegalArgumentException("Worker credential lifetime must be 5 minutes to 24 hours.");
        if (token == null || !token.matches("[A-Za-z0-9_-]{43,128}"))
            throw new IllegalArgumentException("Use an independently generated high-entropy credential.");

        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into mediaos_worker_credential
                    (id,worker_id,token_hash,scope,job_id,active,expires_at)
                values (:id,:worker,:hash,:scope,:job,true,:expires)
                """)
                .param("id", id).param("worker", workerId)
                .param("hash", WorkloadCredentialService.sha256(token))
                .param("scope", scope).param("job", jobId)
                .param("expires", OffsetDateTime.now(ZoneOffset.UTC).plus(lifetime))
                .update();
        audit(id, "ISSUED", ticket);
        return id;
    }

    public void revoke(UUID id, String ticket) {
        requireTransaction(ticket);
        int rows = jdbc.sql("""
                update mediaos_worker_credential set active=false
                where id=:id and active=true
                """).param("id", id).update();
        if (rows != 1) throw new IllegalArgumentException("Active worker credential not found.");
        audit(id, "REVOKED", ticket);
    }

    private void audit(UUID id, String action, String ticket) {
        jdbc.sql("""
                insert into mediaos_worker_credential_audit
                    (id,credential_id,operation,change_ticket)
                values (:id,:credential,:operation,:ticket)
                """)
                .param("id", UUID.randomUUID()).param("credential", id)
                .param("operation", action).param("ticket", ticket).update();
    }

    private static void requireTransaction(String ticket) {
        if (!TransactionSynchronizationManager.isActualTransactionActive())
            throw new IllegalStateException("Explicit offline database transaction required.");
        if (ticket == null || !ticket.matches("[A-Za-z0-9_-]{8,96}"))
            throw new IllegalArgumentException("Approved non-secret change ticket required.");
    }
}
