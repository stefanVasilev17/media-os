package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class EpisodeWriteActivationGuard {
    public EpisodeWriteActivationGuard(
            @Value("${mediaos.episodes.creation-enabled:false}") boolean creationEnabled,
            @Value("${mediaos.episodes.writes-enabled:false}") boolean writesEnabled,
            @Value("${mediaos.episode-research.enabled:false}") boolean researchEnabled,
            @Value("${mediaos.learning.promotion-enabled:false}") boolean learningPromotionEnabled,
            @Value("${mediaos.director-security.enabled:false}") boolean identitySecurityEnabled,
            @Value("${mediaos.local-auth.enabled:false}") boolean localSecurityEnabled) {
        if ((creationEnabled || writesEnabled || researchEnabled || learningPromotionEnabled)
                && !(identitySecurityEnabled || localSecurityEnabled)) {
            throw new IllegalStateException(
                    "MediaOS Episode write/research/learning flags require verified Director security. "
                    + "Keep all new Episode mutations disabled until verified local or OIDC identity security is configured.");
        }
    }
}
