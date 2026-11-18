package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MediaObjectStoreTest {
    @Test
    void absentConfigurationFailsClosedBeforePaidProviderCall() {
        try (MediaObjectStore store=new MediaObjectStore(false,false,"","","auto","","")) {
            assertFalse(store.readable());
            assertFalse(store.writable());
            ResponseStatusException failed=assertThrows(ResponseStatusException.class,
                    store::requireWritable);
            assertEquals(HttpStatus.CONFLICT,failed.getStatusCode());
        }
    }

    @Test
    void uploadAndPlaybackAreNeverAllowedOutsideNamespacedMediaVoicePrefix() {
        UUID request=UUID.randomUUID();
        UUID take=UUID.randomUUID();
        String mp3=MediaObjectStore.voiceKey("EP004","SHOT01",request,take,"audio/mpeg");
        String wav=MediaObjectStore.voiceKey("EP004","SHOT15",request,take,"audio/wav");
        assertTrue(mp3.startsWith("mediaos/media/voice/v1/EP004/SHOT01/"));
        assertTrue(mp3.endsWith(".mp3"));
        assertTrue(wav.endsWith(".wav"));
        assertDoesNotThrow(()->MediaObjectStore.requireSafeVoiceKey(mp3));
        assertDoesNotThrow(()->MediaObjectStore.requireSafeVoiceKey(wav));
        for(String key:new String[] {
                "postgres/backups/locked.dump",
                "mediaos/media/voice/v1/EP004/SHOT01/../../postgres/backups/locked.dump",
                "mediaos/media/voice/v1/EP004/SHOT01/garbage.mp3",
                "/mediaos/media/voice/v1/EP004/SHOT01/a.mp3"
        }) {
            assertThrows(IllegalArgumentException.class,
                    ()->MediaObjectStore.requireSafeVoiceKey(key));
        }
        assertThrows(IllegalArgumentException.class,
                ()->MediaObjectStore.voiceKey("EP001/../../", "SHOT01",request,take,"audio/mpeg"));
        assertThrows(IllegalArgumentException.class,
                ()->MediaObjectStore.voiceKey("EP004", "SHOT41",request,take,"audio/mpeg"));
        assertThrows(IllegalArgumentException.class,
                ()->MediaObjectStore.voiceKey("EP004", "SHOT01",request,take,"application/pdf"));
    }

    @Test
    void sha256IsStableAndUploadLimitIsBounded() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                MediaObjectStore.sha256("abc".getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        assertEquals(25165824L,MediaObjectStore.MAX_VOICE_BYTES);
        try(MediaObjectStore store=new MediaObjectStore(false,false,"","","auto","","")) {
            ResponseStatusException failed=assertThrows(ResponseStatusException.class,
                    ()->store.uploadVerified("postgres/backups/recovery.dump",new byte[]{1},"audio/mpeg"));
            assertEquals(HttpStatus.CONFLICT,failed.getStatusCode());
        }
    }
}
