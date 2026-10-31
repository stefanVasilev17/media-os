package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class LocalAuthenticationModeGuard {
    public LocalAuthenticationModeGuard(
            @Value("${mediaos.local-auth.enabled:false}") boolean local,
            @Value("${mediaos.director-security.enabled:false}") boolean legacyOidc) {
        if (local && legacyOidc) {
            throw new IllegalStateException(
                    "Local authentication and OIDC must never be enabled together.");
        }
    }
}
