package com.architecturalthinking.mediaos.system;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Director identity comes only from a verified JWT and locally granted
 * ROLE_DIRECTOR membership. A preflight ID, header, or JSON reviewer name
 * is never proof of the actor's identity.
 */
public final class DirectorIdentity {
    private DirectorIdentity() {}

    public record Actor(String issuer, String subject, String auditName) {}

    public static Actor requireDirector() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken token)
                || !token.isAuthenticated()
                || token.getAuthorities().stream()
                    .noneMatch(authority -> "ROLE_DIRECTOR".equals(authority.getAuthority()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Verified Director membership is required.");
        }

        Jwt jwt = token.getToken();
        String issuer = jwt.getIssuer() == null ? "" : jwt.getIssuer().toString();
        String subject = jwt.getSubject();
        if (issuer.isBlank() || subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Verified Director issuer and subject are required.");
        }

        return new Actor(issuer, subject, stableAuditName(issuer, subject));
    }

    static String stableAuditName(String issuer, String subject) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((issuer + "\u0000" + subject).getBytes(StandardCharsets.UTF_8));
            return "director:" + HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("JVM SHA-256 implementation unavailable.", e);
        }
    }
}
