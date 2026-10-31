package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class EpisodeWriteActivationGuard {
    public EpisodeWriteActivationGuard(
            @Value("${mediaos.episodes.creation-enabled:false}") boolean creationEnabled,
            @Value("${mediaos.episodes.writes-enabled:false}") boolean writesEnabled,
            @Value("${mediaos.episode-research.enabled:false}") boolean researchEnabled,
            @Value("${mediaos.director-security.enabled:false}") boolean identitySecurityEnabled) {
        if ((creationEnabled || writesEnabled || researchEnabled) && !identitySecurityEnabled) {
            throw new IllegalStateException(
                    "MediaOS Episode write/research flags require verified Director security. "
                    + "Keep all new Episode mutations disabled until OIDC and membership are configured.");
        }
    }
}
