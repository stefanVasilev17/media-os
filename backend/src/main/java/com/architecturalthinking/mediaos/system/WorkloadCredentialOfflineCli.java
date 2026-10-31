package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import java.io.Console;
import java.time.Duration;
import java.util.Arrays;
import java.util.UUID;

public final class WorkloadCredentialOfflineCli {
    private WorkloadCredentialOfflineCli() {}

    public static void main(String[] args) {
        if (args.length < 3 || !(args[0].equals("issue") || args[0].equals("revoke")))
            throw new IllegalArgumentException(
                    "Usage: issue <scope> <worker-id> <minutes> [job-uuid] <change-ticket> | revoke <credential-uuid> <change-ticket>");
        if (!"OFFLINE_WORKERS_DISABLED_AND_BACKUP_VERIFIED".equals(
                System.getenv("MEDIAOS_OFFLINE_WORKER_MAINTENANCE_CONFIRM")))
            throw new IllegalStateException("Explicit offline worker/backup confirmation required.");
        Console console = System.console();
        if (console == null)
            throw new IllegalStateException("Interactive console required; refusing unattended credential changes.");
        var db = new DriverManagerDataSource(required("MEDIAOS_OFFLINE_JDBC_URL"),
                required("MEDIAOS_OFFLINE_DB_USERNAME"),
                required("MEDIAOS_OFFLINE_DB_PASSWORD"));
        if (!db.getUrl().startsWith("jdbc:postgresql://"))
            throw new IllegalStateException("Only PostgreSQL offline maintenance is supported.");
        var admin = new WorkloadCredentialOfflineAdmin(JdbcClient.create(db));
        var transactions = new TransactionTemplate(new DataSourceTransactionManager(db));
        if (args[0].equals("revoke")) {
            if (args.length != 3) throw new IllegalArgumentException("Revoke expects credential UUID and ticket.");
            UUID id = UUID.fromString(args[1]);
            transactions.executeWithoutResult(status -> admin.revoke(id,args[2]));
            System.out.println("Credential revoked and audited: " + id);
            return;
        }
        if (args.length != 5 && args.length != 6)
            throw new IllegalArgumentException("Issue expects scope, worker, duration, optional job and ticket.");
        String scope = args[1];
        String worker = args[2];
        Duration lifetime = Duration.ofMinutes(Long.parseLong(args[3]));
        UUID job = args.length == 6 ? UUID.fromString(args[4]) : null;
        String ticket = args[args.length-1];
        char[] secret = console.readPassword("Locally generated worker secret (not logged): ");
        if (secret == null) throw new IllegalStateException("Missing secret.");
        try {
            UUID id = transactions.execute(status -> admin.issue(
                    worker,scope,job,new String(secret),lifetime,ticket));
            System.out.println("Credential issued and audited: " + id +
                    ". Store the original secret only in the worker's protected environment.");
        } finally {
            Arrays.fill(secret,'\0');
        }
    }

    private static String required(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) throw new IllegalStateException("Missing " + key);
        return value;
    }
}
