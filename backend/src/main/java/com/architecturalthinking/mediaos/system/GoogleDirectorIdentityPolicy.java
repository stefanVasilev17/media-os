package com.architecturalthinking.mediaos.system;

import org.springframework.security.oauth2.core.oidc.OidcIdToken;

import java.net.URI;
import java.util.List;
import java.util.Locale;

final class GoogleDirectorIdentityPolicy {
    private final String email;
    private final String subject;
    private final String clientId;

    GoogleDirectorIdentityPolicy(String email, String subject, String clientId) {
        this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        this.subject = subject == null ? "" : subject.trim();
        this.clientId = clientId == null ? "" : clientId.trim();
        if (this.email.isBlank() || !this.email.contains("@")
                || this.email.indexOf('@') == 0 || this.email.endsWith("@")
                || this.clientId.isBlank()) {
            throw new IllegalStateException("Google Director email and OAuth client ID must be configured.");
        }
    }

    boolean allowed(OidcIdToken token) {
        if (token == null || token.getIssuer() == null
                || !List.of("https://accounts.google.com", "accounts.google.com")
                        .contains(token.getIssuer().toString())) {
            return false;
        }
        if (!token.getAudience().contains(clientId)
                || token.getSubject() == null || token.getSubject().isBlank()) {
            return false;
        }
        if (!Boolean.TRUE.equals(token.getClaim("email_verified"))) {
            return false;
        }
        String providedEmail = token.getClaimAsString("email");
        if (providedEmail == null
                || !email.equals(providedEmail.trim().toLowerCase(Locale.ROOT))) {
            return false;
        }
        return subject.isEmpty() || subject.equals(token.getSubject());
    }
}
