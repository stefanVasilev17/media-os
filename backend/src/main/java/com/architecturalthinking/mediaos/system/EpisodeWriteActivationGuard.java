package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class EpisodeWriteActivationGuard {
    @Autowired
    public EpisodeWriteActivationGuard(
            @Value("${mediaos.episodes.creation-enabled:false}") boolean creationEnabled,
            @Value("${mediaos.episodes.writes-enabled:false}") boolean writesEnabled,
            @Value("${mediaos.episode-research.enabled:false}") boolean researchEnabled,
            @Value("${mediaos.learning.promotion-enabled:false}") boolean learningPromotionEnabled,
            @Value("${mediaos.director-security.enabled:false}") boolean identitySecurityEnabled,
            @Value("${mediaos.local-auth.enabled:false}") boolean localSecurityEnabled,
            @Value("${mediaos.google-auth.enabled:false}") boolean googleSecurityEnabled) {
        if ((creationEnabled || writesEnabled || researchEnabled || learningPromotionEnabled)
                && !(identitySecurityEnabled || localSecurityEnabled || googleSecurityEnabled)) {
            throw new IllegalStateException(
                    "MediaOS Episode mutations require verified Director security. "
                    + "Do not enable creation, voice writes, research, or learning without authentication.");
        }
    }

    EpisodeWriteActivationGuard(boolean creationEnabled, boolean writesEnabled,
                                boolean researchEnabled, boolean learningPromotionEnabled,
                                boolean identitySecurityEnabled, boolean localSecurityEnabled) {
        this(creationEnabled, writesEnabled, researchEnabled, learningPromotionEnabled,
                identitySecurityEnabled, localSecurityEnabled, false);
    }
}
