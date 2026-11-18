package com.architecturalthinking.mediaos.workflow;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Optional private S3 zero-spend smoke check. No external voice provider calls.
 * Fail startup rather than serving a false "storage is ready" result.
 */
@Component
public class MediaObjectStorageStartupSmoke implements ApplicationRunner {
    private static final Logger log=LoggerFactory.getLogger(MediaObjectStorageStartupSmoke.class);
    private final MediaObjectStore mediaObjects;
    private final boolean enabled;

    public MediaObjectStorageStartupSmoke(
            MediaObjectStore mediaObjects,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_SMOKE_ON_STARTUP:false}") boolean enabled) {
        this.mediaObjects=mediaObjects;
        this.enabled=enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if(!enabled)return;
        log.info("MEDIAOS_P0_VOICE_OBJECT_SMOKE_START");
        mediaObjects.verifyPreflightBeforePaid();
        log.info("MEDIAOS_P0_VOICE_OBJECT_SMOKE_PASS put/get/sha/delete, no ElevenLabs call");
    }
}
