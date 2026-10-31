# Local Director offline recovery and TOTP key rotation

**Status:** PR #110 Draft. Never run against production without explicit Director approval, a verified database backup, and a scheduled maintenance window. The tool has **no HTTP endpoint**, uses an interactive terminal, and runs entirely with local Spring/JDBC dependencies.

## Preconditions

1. Stop all MediaOS application/worker processes connected to the target database. Verify no active writers, no pending paid AI or video operations. Take and restore-test a PostgreSQL backup **before** maintenance.
2. Identify the UUID from `mediaos_local_director` using a separate, read-only administrative connection. Check exactly **one** Director account exists. Obtain an approved **non-secret** change ticket.
3. Prepare a unique strong password and a new 32-or-more-character Base32 authenticator seed if recovering credentials. For encryption key rotation prepare the previous and replacement **random 32-byte Base64** AES keys; safeguard both, do not put any in scripts/chat/GitHub/logs.
4. On an administrator-controlled workstation with Java 21 + Maven, clone the approved commit and verify its SHA and GitHub PR review. Build its classpath in the `backend` module:

```sh
cd backend
mvn -B -ntp -DskipTests package dependency:build-classpath -Dmdep.outputFile=target/runtime.classpath
```

5. Set these environmental variables **locally in a protected terminal**, not in Railway's running app configuration:

```text
MEDIAOS_OFFLINE_MAINTENANCE_CONFIRM=OFFLINE_DATABASE_BACKED_UP_AND_SERVICES_STOPPED
MEDIAOS_OFFLINE_ACCOUNT_ID=<same account UUID as the command>
MEDIAOS_OFFLINE_JDBC_URL=<approved PostgreSQL JDBC URL>
MEDIAOS_OFFLINE_DB_USERNAME=<restricted maintenance database user>
MEDIAOS_OFFLINE_DB_PASSWORD=<maintenance password, never in command line>
```

The dedicated database role needs only SELECT/UPDATE on `mediaos_local_director`, DELETE on `SPRING_SESSION`, SELECT/INSERT on `mediaos_local_director_maintenance_audit`, and permission for transaction/locking. The application must be stopped, not merely hidden behind a firewall. Use a TLS-validated JDBC connection for remote PostgreSQL. Do not expose this database publicly.

## Rotate only the encryption key

Run **interactively**, using the offline database and a reviewed account UUID:

```sh
java -cp "target/classes:$(cat target/runtime.classpath)" \
  com.architecturalthinking.mediaos.system.LocalDirectorOfflineCli \
  rotate-key <account-uuid> <change_ticket>
```

The tool prompts privately for previous and replacement AES keys (never command-line arguments). It decrypts the existing TOTP seed with the previous key, validates it, encrypts with the new key, inserts a permanent audit row, and removes JDBC sessions in a single transaction. A wrong previous key aborts the entire transaction. After a successful commit **update** `MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY` on the stopped MediaOS app to the replacement Base64 key **before restarting**. Keep previous key in a secure backup only for audited disaster recovery.

## Recover the account

```sh
java -cp "target/classes:$(cat target/runtime.classpath)" \
  com.architecturalthinking.mediaos.system.LocalDirectorOfflineCli \
  recover <account-uuid> <change_ticket>
```

Enter the replacement password, replacement authenticator seed and **current/replacement** AES key interactively. The operation atomically updates the Argon2id password hash and encrypted TOTP seed, resets login lock and TOTP replay state, revokes JDBC sessions, and writes a durable audit event. If the original encryption key was lost, a new key may be used during recovery, but the stopped application **must** then be configured with that same new key before restart. The original seed cannot be recovered without the old key.

## Prohibited shortcuts and validation

Never use the first-account bootstrap against an existing database; never disable MFA, manipulate `active` directly, fabricate Director JWT/session cookies, or put sensitive credentials into GitHub, shell history, or public QA. If audit insertion, credential encryption or session revocation fails, the database transaction must roll back. After recovery, verify the audit event, confirm old sessions are unusable, check a valid fresh TOTP on the isolated staging copy, and remove temporary credentials. Keep production writes disabled until separately approved.

**Verified in disposable PostgreSQL:** transactional rollback with wrong encryption key, preservation of historical approvals, successful key rotation, password/TOTP recovery and forced session revocation. **Not yet performed against a real operator account.**
