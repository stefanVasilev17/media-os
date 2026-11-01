package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class LocalAuthenticationModeGuard {
    @Autowired
    public LocalAuthenticationModeGuard(
            @Value("${mediaos.local-auth.enabled:false}") boolean local,
            @Value("${mediaos.director-security.enabled:false}") boolean legacyOidc,
            @Value("${mediaos.google-auth.enabled:false}") boolean google) {
        int active = (local ? 1 : 0) + (legacyOidc ? 1 : 0) + (google ? 1 : 0);
        if (active > 1) {
            throw new IllegalStateException(
                    "Local password authentication, OIDC bearer, and Google OIDC login are mutually exclusive.");
        }
    }

    LocalAuthenticationModeGuard(boolean local, boolean legacyOidc) {
        this(local, legacyOidc, false);
    }
}
