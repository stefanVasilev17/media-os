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
        byte[] sample=new byte[2048];
        sample[4]='f';sample[5]='t';sample[6]='y';sample[7]='p';
        for(int i=8;i<sample.length;i++)sample[i]=(byte)(i%251);
        java.util.UUID probeId=java.util.UUID.randomUUID();
        MediaObjectStore.Stored video=mediaObjects.uploadVideoVerified(probeId,sample);
        try {
            java.io.ByteArrayOutputStream range=new java.io.ByteArrayOutputStream();
            mediaObjects.streamVideoRange(video.key(),video.sha256(),
                    video.byteCount(),200,639,range);
            if(!java.util.Arrays.equals(java.util.Arrays.copyOfRange(sample,200,640),
                    range.toByteArray()))
                throw new IllegalStateException("S3 video Range smoke content mismatch.");
        }catch(java.io.IOException failure){
            throw new IllegalStateException("S3 video Range smoke failed.",failure);
        }finally{
            mediaObjects.discardUncommittedVideo(video.key(),video.sha256(),video.byteCount());
        }
        log.info("MEDIAOS_P0_VIDEO_OBJECT_SMOKE_PASS put/sha-full-readback/range/delete, no paid render");
    }
}
