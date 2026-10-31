package com.architecturalthinking.mediaos.system;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/claim")
@ConditionalOnProperty(name = "mediaos.local-auth.claim-enabled", havingValue = "true")
public class LocalDirectorClaimController {
    private final JdbcClient jdbc;
    private final PasswordEncoder passwords;
    private final LocalTotpCrypto totpCrypto;
    private final SecurityContextRepository contexts;
    private final SecureRandom random = new SecureRandom();

    public LocalDirectorClaimController(JdbcClient jdbc, PasswordEncoder passwords,
                                        LocalTotpCrypto totpCrypto, SecurityContextRepository contexts) {
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.totpCrypto = totpCrypto;
        this.contexts = contexts;
    }

    public record Claim(String token) {}

    private record Invite(String username, UUID directorId, OffsetDateTime expiresAt, boolean consumed) {}

    @PostMapping("/redeem")
    @Transactional
    public DirectorSessionController.Session redeem(@RequestBody Claim claim,
                                                     HttpServletRequest request,
                                                     HttpServletResponse response) {
        if (claim == null || claim.token() == null
                || !claim.token().matches("[A-Za-z0-9_-]{43}")) {
            throw invalid();
        }

        String digest = hash(claim.token());
        Invite invite = jdbc.sql("""
                select username, director_id, expires_at, consumed_at is not null as consumed
                  from mediaos_director_claim_invite
                 where token_hash=:hash
                 for update
                """).param("hash", digest)
                .query((rs, row) -> new Invite(
                        rs.getString("username"),
                        (UUID) rs.getObject("director_id"),
                        rs.getObject("expires_at", OffsetDateTime.class),
                        rs.getBoolean("consumed")))
                .optional().orElse(null);

        if (invite == null || invite.consumed()
                || !invite.expiresAt().isAfter(OffsetDateTime.now())) {
            throw invalid();
        }
        Long total = jdbc.sql("select count(*) from mediaos_local_director")
                .query(Long.class).single();
        if (total != 1) {
            throw invalid();
        }

        // Claim ownership of the original QA Director identity, keeping prior
        // Director decision attribution. Invalidate bootstrap credentials.
        byte[] passwordBytes = new byte[48];
        byte[] totpBytes = new byte[32];
        random.nextBytes(passwordBytes);
        random.nextBytes(totpBytes);
        String randomPassword = java.util.Base64.getUrlEncoder()
                .withoutPadding().encodeToString(passwordBytes);
        String randomTotp = base32(totpBytes);
        java.util.Arrays.fill(passwordBytes, (byte) 0);
        java.util.Arrays.fill(totpBytes, (byte) 0);

        int changed = jdbc.sql("""
                update mediaos_local_director
                   set username=:username, password_hash=:password,
                       totp_secret_encrypted=:totp, failed_attempts=0,
                       locked_until=null, last_totp_step=-1, updated_at=now()
                 where id=:id and active=true
                """)
                .param("username", invite.username())
                .param("password", passwords.encode(randomPassword))
                .param("totp", totpCrypto.encrypt(randomTotp))
                .param("id", invite.directorId())
                .update();
        if (changed != 1) throw invalid();

        jdbc.sql("delete from SPRING_SESSION where PRINCIPAL_NAME=:id")
                .param("id", invite.directorId().toString()).update();

        int used = jdbc.sql("""
                update mediaos_director_claim_invite set consumed_at=now()
                 where token_hash=:hash and consumed_at is null
                """).param("hash", digest).update();
        if (used != 1) throw invalid();

        LocalDirectorPrincipal principal =
                new LocalDirectorPrincipal(invite.directorId(), invite.username());
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR")));
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(auth);
        SecurityContextHolder.setContext(ctx);
        var session = request.getSession(true);
        request.changeSessionId();
        session.setMaxInactiveInterval(LocalDirectorAuthController.REMEMBER_SECONDS);
        session.setAttribute(LocalDirectorAuthController.REMEMBER_ABSOLUTE_EXPIRY,
                System.currentTimeMillis() + (long) LocalDirectorAuthController.REMEMBER_SECONDS * 1000L);
        contexts.saveContext(ctx, request, response);
        return new DirectorSessionController.Session(true, List.of("DIRECTOR"), true, true);
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.US_ASCII)));
        } catch (Exception ex) {
            throw new IllegalStateException("Token verification unavailable.", ex);
        }
    }

    private static String base32(byte[] input) {
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder result = new StringBuilder();
        int value = 0, bits = 0;
        for (byte b : input) {
            value = (value << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                bits -= 5;
                result.append(alphabet.charAt((value >>> bits) & 31));
            }
        }
        if (bits > 0) result.append(alphabet.charAt((value << (5 - bits)) & 31));
        return result.toString();
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired activation link.");
    }
}
