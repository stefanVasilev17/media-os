package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.Console;
import java.util.Arrays;
import java.util.UUID;

public final class LocalDirectorOfflineCli {
    private LocalDirectorOfflineCli() {}

    public static void main(String[] args) {
        if (args.length != 3
                || !(args[0].equals("recover") || args[0].equals("rotate-key"))) {
            throw new IllegalArgumentException(
                    "Usage: recover|rotate-key <account-uuid> <approved-change-ticket>");
        }
        if (!"OFFLINE_DATABASE_BACKED_UP_AND_SERVICES_STOPPED".equals(
                System.getenv("MEDIAOS_OFFLINE_MAINTENANCE_CONFIRM"))) {
            throw new IllegalStateException("Offline backup and stopped-service confirmation required.");
        }
        UUID account = UUID.fromString(args[1]);
        String ticket = args[2];
        String expectedId = System.getenv("MEDIAOS_OFFLINE_ACCOUNT_ID");
        if (!account.toString().equals(expectedId)) {
            throw new IllegalStateException("Target UUID must match separate offline account confirmation.");
        }
        String url = required("MEDIAOS_OFFLINE_JDBC_URL");
        if (!url.startsWith("jdbc:postgresql://")) {
            throw new IllegalStateException("Offline maintenance supports only PostgreSQL JDBC.");
        }
        String username = required("MEDIAOS_OFFLINE_DB_USERNAME");
        String password = required("MEDIAOS_OFFLINE_DB_PASSWORD");
        Console console = System.console();
        if (console == null) {
            throw new IllegalStateException("Interactive terminal required; refusing unattended recovery.");
        }
        var datasource = new DriverManagerDataSource(url, username, password);
        var maintenance = new LocalDirectorOfflineMaintenance(
                JdbcClient.create(datasource),
                Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
        var transactions = new TransactionTemplate(new DataSourceTransactionManager(datasource));

        if (args[0].equals("recover")) {
            char[] newPassword = console.readPassword("New Director password: ");
            char[] totp = console.readPassword("New authenticator Base32 seed: ");
            char[] key = console.readPassword("New/current AES-256 key (Base64): ");
            if (newPassword == null || totp == null || key == null) {
                throw new IllegalStateException("Interactive credentials required.");
            }
            try {
                transactions.executeWithoutResult(status -> maintenance.recover(account,
                        new String(newPassword), new String(totp), new String(key), ticket));
            } finally {
                Arrays.fill(newPassword, '\0');
                Arrays.fill(totp, '\0');
                Arrays.fill(key, '\0');
            }
        } else {
            char[] oldKey = console.readPassword("Previous AES-256 key (Base64): ");
            char[] newKey = console.readPassword("Replacement AES-256 key (Base64): ");
            if (oldKey == null || newKey == null) {
                throw new IllegalStateException("Interactive encryption keys required.");
            }
            try {
                transactions.executeWithoutResult(status -> maintenance.rotateTotpEncryptionKey(
                        account, new String(oldKey), new String(newKey), ticket));
            } finally {
                Arrays.fill(oldKey, '\0');
                Arrays.fill(newKey, '\0');
            }
        }
        System.out.println("Offline maintenance committed; change ticket: " + ticket
                + ". Rotate runtime key and remove temporary access before restarting the app.");
    }

    private static String required(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing offline connection setting: " + key);
        }
        return value;
    }
}
