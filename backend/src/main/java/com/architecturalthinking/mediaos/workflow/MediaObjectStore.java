package com.architecturalthinking.mediaos.workflow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.core.sync.ResponseTransformer;

import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Component
public final class MediaObjectStore implements AutoCloseable {
    public static final String VOICE_PREFIX = "mediaos/media/voice/v1/";
    public static final long MAX_VOICE_BYTES = 24L * 1024 * 1024;
    public record Stored(String key, String sha256, long byteCount) {}

    private final S3Client client;
    private final String bucket;
    private final boolean writesEnabled;

    public MediaObjectStore(
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_ENABLED:false}") boolean enabled,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_WRITE_ENABLED:false}") boolean writesEnabled,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_ENDPOINT:}") String endpoint,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_BUCKET:}") String bucket,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_REGION:auto}") String region,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_ACCESS_KEY_ID:}") String accessKey,
            @Value("${MEDIAOS_MEDIA_OBJECT_S3_SECRET_ACCESS_KEY:}") String secretKey) {
        this.bucket = bucket;
        this.writesEnabled = writesEnabled;
        if (!enabled || endpoint.isBlank() || bucket.isBlank() || region.isBlank()
                || accessKey.isBlank() || secretKey.isBlank() || !endpoint.startsWith("https://")) {
            this.client = null;
            return;
        }
        this.client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(false).build())
                .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(35))
                        .apiCallAttemptTimeout(Duration.ofSeconds(20)))
                .build();
    }

    /**
     * Make a free synthetic object roundtrip BEFORE any paid provider dispatch.
     * The only delete allowed by this adapter is this ephemeral probe key.
     */
    public void verifyPreflightBeforePaid() {
        requireWritable();
        UUID requestId=UUID.randomUUID();
        UUID probeId=UUID.randomUUID();
        String key=voiceKey("EP999","SHOT01",requestId,probeId,"audio/mpeg");
        byte[] tiny="mediaos-private-voice-probe".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        try {
            Stored verified=uploadVerified(key,tiny,"audio/mpeg");
            if(verified.byteCount()!=tiny.length) {
                throw new IllegalStateException("Voice storage probe byte count mismatch.");
            }
        } finally {
            try {
                client.deleteObject(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                        .bucket(bucket).key(key).build());
            } catch(RuntimeException cleanupFailure) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Voice storage probe cleanup could not be verified. Paid TTS blocked.",
                        cleanupFailure);
            }
        }
    }

    public boolean readable() {
        return client != null;
    }

    public boolean writable() {
        return client != null && writesEnabled;
    }

    public void requireWritable() {
        if (!writable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "VOICE_STORAGE_NOT_READY: private object storage writer must be explicitly configured before paid TTS.");
        }
    }

    public static String voiceKey(String episodeKey, String shotKey, UUID requestId,
                                  UUID takeId, String contentType) {
        if (episodeKey == null || !episodeKey.matches("EP[0-9]{3,}")
                || shotKey == null || !shotKey.matches("SHOT(0[1-9]|[1-3][0-9]|40)")
                || requestId == null || takeId == null) {
            throw new IllegalArgumentException("Invalid voice object identity.");
        }
        String extension = switch (contentType) {
            case "audio/mpeg", "audio/mp3" -> "mp3";
            case "audio/wav", "audio/x-wav", "audio/wave" -> "wav";
            default -> throw new IllegalArgumentException("Unsupported voice audio content type.");
        };
        return VOICE_PREFIX + episodeKey + "/" + shotKey + "/" + requestId
                + "/" + takeId + "." + extension;
    }

    public static void requireSafeVoiceKey(String key) {
        if (key == null || !key.matches(
                "mediaos/media/voice/v1/EP[0-9]{3,}/SHOT(0[1-9]|[1-3][0-9]|40)/"
                + "[a-f0-9-]{36}/[a-f0-9-]{36}\\.(mp3|wav)")) {
            throw new IllegalArgumentException("Object key must be a namespaced MediaOS voice artifact.");
        }
    }

    public Stored uploadVerified(String key, byte[] audio, String contentType) {
        requireWritable();
        requireSafeVoiceKey(key);
        if (audio == null || audio.length == 0 || audio.length > MAX_VOICE_BYTES) {
            throw new ResponseStatusException(HttpStatus.INSUFFICIENT_STORAGE,
                    "VOICE_STORAGE_LIMIT: generated take exceeds the hard 24 MiB limit.");
        }
        if (!"audio/mpeg".equals(contentType) && !"audio/mp3".equals(contentType)
                && !"audio/wav".equals(contentType)
                && !"audio/x-wav".equals(contentType) && !"audio/wave".equals(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported generated audio type.");
        }
        String hash = sha256(audio);
        try {
            client.putObject(PutObjectRequest.builder()
                    .bucket(bucket).key(key).contentType(contentType)
                    .metadata(Map.of("sha256", hash, "owner", "mediaos-voice"))
                    .build(), RequestBody.fromBytes(audio));
            var head = client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            if (head.contentLength() != audio.length
                    || !hash.equalsIgnoreCase(head.metadata().get("sha256"))) {
                throw new IllegalStateException("Remote voice object size/hash metadata mismatch.");
            }
            byte[] readback = downloadVerified(key, hash, audio.length);
            if (readback.length != audio.length) {
                throw new IllegalStateException("Uploaded voice object failed complete readback.");
            }
            return new Stored(key, hash, audio.length);
        } catch (S3Exception failure) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private voice storage operation failed; no paid request will be retried automatically.", failure);
        }
    }

    public byte[] downloadVerified(String key, String expectedSha256, long expectedBytes) {
        if (!readable()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private voice object storage reader is not configured.");
        }
        requireSafeVoiceKey(key);
        if (expectedSha256 == null || !expectedSha256.matches("[a-f0-9]{64}")
                || expectedBytes <= 0 || expectedBytes > MAX_VOICE_BYTES) {
            throw new IllegalArgumentException("Invalid trusted voice object manifest.");
        }
        try {
            var head = client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            if (head.contentLength() != expectedBytes
                    || !expectedSha256.equalsIgnoreCase(head.metadata().get("sha256"))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Voice object manifest mismatch.");
            }
            byte[] content = client.getObject(
                    GetObjectRequest.builder().bucket(bucket).key(key).build(),
                    ResponseTransformer.toBytes()).asByteArray();
            if (content.length != expectedBytes || !sha256(content).equals(expectedSha256)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Voice object SHA-256 mismatch; refuse playback or approval.");
            }
            return content;
        } catch (S3Exception failure) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private voice object not readable; retry playback after storage recovers.", failure);
        }
    }

    static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 unavailable.", impossible);
        }
    }

    @Override
    public void close() {
        if (client != null) client.close();
    }
}
