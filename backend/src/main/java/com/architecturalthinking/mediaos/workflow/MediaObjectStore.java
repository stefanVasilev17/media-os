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
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.core.sync.ResponseTransformer;

import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.Arrays;
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
    public static final long MAX_VIDEO_BYTES = 256L * 1024 * 1024;
    public static final long MAX_FILM_BYTES = 4L * 1024 * 1024 * 1024;
    private static final int FILM_PART_BYTES = 16 * 1024 * 1024;
    public static final String VIDEO_PREFIX = "mediaos/media/video/v1/";
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
                try {
                    client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
                    throw new IllegalStateException("Probe voice object remains readable after DELETE.");
                } catch (S3Exception e) {
                    if(e.statusCode()!=404)throw e;
                }
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

    static String sha256(Path path) throws IOException {
        try{
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            try(InputStream in=Files.newInputStream(path)){
                byte[] buf=new byte[64*1024];int n;
                while((n=in.read(buf))!=-1)digest.update(buf,0,n);
            }
            return HexFormat.of().formatHex(digest.digest());
        }catch(NoSuchAlgorithmException impossible){
            throw new IllegalStateException("SHA-256 unavailable.",impossible);
        }
    }

    static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 unavailable.", impossible);
        }
    }


    public static String videoKey(UUID renderId) {
        if(renderId==null) throw new IllegalArgumentException("Missing render identity.");
        return VIDEO_PREFIX+renderId+".mp4";
    }

    public static void requireSafeVideoKey(String key) {
        if(key==null || !key.matches(
                "mediaos/media/video/v1/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}\\.mp4"))
            throw new IllegalArgumentException("Only private immutable MediaOS video object keys are permitted.");
    }

    public Stored uploadVideoVerified(UUID renderId, byte[] video) {
        requireWritable();
        String key=videoKey(renderId);
        requireSafeVideoKey(key);
        if(video==null||video.length<1024||video.length>MAX_VIDEO_BYTES)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "New MP4 must be between 1 KiB and 256 MiB.");
        if(video.length<12 || video[4]!='f'||video[5]!='t'||video[6]!='y'||video[7]!='p')
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New video has no ISO BMFF ftyp signature.");
        String hash=sha256(video);
        try {
            client.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
                    .contentType("video/mp4")
                    .metadata(Map.of("sha256",hash,"owner","mediaos-video",
                            "retention","pending-director-review"))
                    .build(),RequestBody.fromBytes(video));
            verifyVideoManifest(key,hash,video.length);
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            long count=0;
            try(InputStream in=client.getObject(GetObjectRequest.builder()
                    .bucket(bucket).key(key).build())){
                byte[] buf=new byte[64*1024];int n;
                while((n=in.read(buf))!=-1){
                    count+=n;
                    if(count>MAX_VIDEO_BYTES)throw new IllegalStateException("Video readback exceeded limit.");
                    digest.update(buf,0,n);
                }
            }
            if(count!=video.length
                    || !HexFormat.of().formatHex(digest.digest()).equals(hash))
                throw new IllegalStateException("Remote MP4 SHA-256 readback mismatch.");
            return new Stored(key,hash,count);
        }catch(S3Exception ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private video storage upload failed; do not store MP4 in PostgreSQL.",ex);
        }catch(IOException | NoSuchAlgorithmException ex){
            throw new IllegalStateException("Private video full-readback verification failed.",ex);
        }
    }

    /** Large continuous films use verified multipart S3 upload with bounded 16 MiB memory. */
    public Stored uploadFilmVerified(UUID filmId,Path file) {
        return uploadBoundedMovie(filmId,file,"director-locked-film",MAX_FILM_BYTES);
    }

    public Stored uploadReelVerified(UUID reelId,Path file) {
        return uploadBoundedMovie(reelId,file,"director-reel-review",DirectReelExtractor.MAX_BYTES);
    }

    private Stored uploadBoundedMovie(UUID filmId,Path file,String retention,long maxBytes) {
        requireWritable();
        String key=videoKey(filmId);
        requireSafeVideoKey(key);
        if(file==null||!Files.isRegularFile(file))
            throw new IllegalArgumentException("Missing real completed film file.");
        String uploadId=null;boolean uploaded=false;
        try{
            long length=Files.size(file);
            if(length<1024||length>maxBytes)
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "MP4 exceeds its bounded artifact limit.");
            try(InputStream in=Files.newInputStream(file)){
                byte[] header=in.readNBytes(12);
                if(header.length!=12||header[4]!='f'||header[5]!='t'
                        ||header[6]!='y'||header[7]!='p')
                    throw new IllegalArgumentException("Full film is not an ISO BMFF MP4.");
            }
            String hash=sha256(file);
            Map<String,String> metadata=Map.of("sha256",hash,"owner","mediaos-video",
                    "retention",retention);
            uploadId=client.createMultipartUpload(CreateMultipartUploadRequest.builder()
                .bucket(bucket).key(key).contentType("video/mp4")
                .metadata(metadata).build()).uploadId();
            List<CompletedPart> parts=new ArrayList<>();
            try(InputStream in=Files.newInputStream(file)){
                long pending=length;int partNumber=1;
                while(pending>0){
                    int size=(int)Math.min(pending,(long)FILM_PART_BYTES);
                    byte[] part=in.readNBytes(size);
                    if(part.length!=size)
                        throw new IOException("Local full film truncated during upload.");
                    String etag=client.uploadPart(UploadPartRequest.builder()
                        .bucket(bucket).key(key).uploadId(uploadId)
                        .partNumber(partNumber).contentLength((long)size).build(),
                        RequestBody.fromBytes(part)).eTag();
                    if(etag==null||etag.isBlank())
                        throw new IOException("S3 returned no film part ETag.");
                    parts.add(CompletedPart.builder().partNumber(partNumber)
                        .eTag(etag).build());
                    pending-=size;partNumber++;
                }
            }
            client.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                .bucket(bucket).key(key).uploadId(uploadId)
                .multipartUpload(CompletedMultipartUpload.builder()
                    .parts(parts).build()).build());
            uploaded=true;
            verifyVideoManifest(key,hash,length);
            MessageDigest readback=MessageDigest.getInstance("SHA-256");
            long checked=0;
            for(long first=0;first<length;first+=FILM_PART_BYTES){
                long last=Math.min(length-1,first+FILM_PART_BYTES-1L);
                try(InputStream in=client.getObject(GetObjectRequest.builder()
                        .bucket(bucket).key(key)
                        .range("bytes="+first+"-"+last).build())){
                    byte[] buf=new byte[64*1024];long remaining=last-first+1;
                    while(remaining>0){
                        int n=in.read(buf,0,(int)Math.min(buf.length,remaining));
                        if(n<0)throw new IOException("Full film S3 readback truncated.");
                        readback.update(buf,0,n);remaining-=n;checked+=n;
                    }
                }
            }
            if(checked!=length||!hash.equals(HexFormat.of().formatHex(readback.digest())))
                throw new IOException("S3 full film SHA-256 readback mismatch.");
            return new Stored(key,hash,length);
        }catch(Exception failure){
            if(uploadId!=null&&!uploaded){
                try{client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                    .bucket(bucket).key(key).uploadId(uploadId).build());}
                catch(S3Exception ignored){}
            }
            if(uploaded){
                try{client.deleteObject(software.amazon.awssdk.services.s3.model
                    .DeleteObjectRequest.builder().bucket(bucket).key(key).build());}
                catch(S3Exception ignored){}
            }
            if(failure instanceof ResponseStatusException response)throw response;
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Verified bounded S3 full film upload failed. Original SHOTs remain unchanged.",
                failure);
        }
    }

    public void verifyVideoManifest(String key,String expectedHash,long expectedBytes) {
        if(!readable())throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Private video object reader is not configured.");
        requireSafeVideoKey(key);
        if(expectedHash==null||!expectedHash.matches("[a-f0-9]{64}")
                ||expectedBytes<1024||expectedBytes>MAX_FILM_BYTES)
            throw new IllegalArgumentException("Invalid video manifest.");
        try {
            var head=client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket).key(key).build());
            if(head.contentLength()!=expectedBytes
                    || !expectedHash.equals(head.metadata().get("sha256"))
                    || !"mediaos-video".equals(head.metadata().get("owner")))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Video size, owner or SHA-256 metadata mismatch.");
        }catch(S3Exception ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private video object cannot be verified.",ex);
        }
    }

    public void streamVideoRange(String key,String expectedHash,long expectedBytes,
                                 long start,long end,OutputStream output) throws IOException {
        verifyVideoManifest(key,expectedHash,expectedBytes);
        if(start<0||end<start||end>=expectedBytes)
            throw new IllegalArgumentException("Invalid video byte range.");
        long from=start;
        while(from<=end){
            long to=Math.min(end,from+FILM_PART_BYTES-1L);
            try(InputStream input=client.getObject(GetObjectRequest.builder()
                    .bucket(bucket).key(key).range("bytes="+from+"-"+to).build())){
                byte[] buf=new byte[64*1024];long remaining=to-from+1;
                while(remaining>0){
                    int n=input.read(buf,0,(int)Math.min(buf.length,remaining));
                    if(n<0)throw new IOException("S3 ranged MP4 ended before expected length.");
                    output.write(buf,0,n);remaining-=n;
                }
            }catch(S3Exception ex){
                throw new IOException("Private video range failed.",ex);
            }
            from=to+1;
        }
    }

    public byte[] downloadVideoVerified(String key,String expectedHash,long expectedBytes) {
        verifyVideoManifest(key,expectedHash,expectedBytes);
        if(expectedBytes>MAX_VIDEO_BYTES)throw new IllegalArgumentException(
                "Large completed film must be streamed, not loaded into JVM memory.");
        try {
            byte[] bytes=client.getObject(GetObjectRequest.builder()
                    .bucket(bucket).key(key).build(),
                    ResponseTransformer.toBytes()).asByteArray();
            if(bytes.length!=expectedBytes||!sha256(bytes).equals(expectedHash))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Private MP4 SHA-256 validation failed.");
            return bytes;
        }catch(S3Exception ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Private video object unavailable.",ex);
        }
    }

    public void discardUncommittedVideo(String key,String hash,long bytes) {
        requireWritable();
        verifyVideoManifest(key,hash,bytes);
        try {
            client.deleteObject(software.amazon.awssdk.services.s3.model.DeleteObjectRequest
                    .builder().bucket(bucket).key(key).build());
            try {
                client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
                throw new IllegalStateException("Uncommitted video cleanup failed.");
            }catch(S3Exception absent){
                if(absent.statusCode()!=404)throw absent;
            }
        }catch(S3Exception ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Uncommitted MP4 cleanup could not be verified; operator audit required.",ex);
        }
    }


    public static final int MAX_THUMBNAIL_BYTES=2*1024*1024;
    private static final String THUMBNAIL_PREFIX="mediaos/media/publishing/thumbnail/v1/";

    static String publishingImageType(byte[] bytes){
        if(bytes==null||bytes.length<12||bytes.length>MAX_THUMBNAIL_BYTES)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thumbnail must be a PNG/JPEG/WebP of at most 2 MiB.");
        boolean png=bytes[0]==(byte)0x89&&bytes[1]=='P'&&bytes[2]=='N'&&bytes[3]=='G'
            &&bytes[4]==13&&bytes[5]==10&&bytes[6]==26&&bytes[7]==10;
        boolean jpeg=bytes[0]==(byte)0xff&&bytes[1]==(byte)0xd8&&bytes[2]==(byte)0xff;
        boolean webp=bytes[0]=='R'&&bytes[1]=='I'&&bytes[2]=='F'&&bytes[3]=='F'
            &&bytes[8]=='W'&&bytes[9]=='E'&&bytes[10]=='B'&&bytes[11]=='P';
        if(!png&&!jpeg&&!webp)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only PNG, JPEG and static WebP thumbnails are allowed.");
        if(webp)validateStaticWebp(bytes);
        try(var stream=new javax.imageio.stream.MemoryCacheImageInputStream(new java.io.ByteArrayInputStream(bytes))){
            var readers=javax.imageio.ImageIO.getImageReaders(stream);
            if(!readers.hasNext())throw new IOException("No image reader.");
            var reader=readers.next();
            try{
                reader.setInput(stream,true,true);
                int width=reader.getWidth(0),height=reader.getHeight(0);
                if(width<640||height<360||width>4096||height>4096||(long)width*height>12000000)
                    throw new IOException("Thumbnail dimensions outside bounded limits.");
                if(reader.read(0)==null)throw new IOException("Cannot decode thumbnail.");
            }finally{reader.dispose();}
        }catch(IOException|RuntimeException ex){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thumbnail cannot be decoded safely.",ex);
        }
        return png?"image/png":jpeg?"image/jpeg":"image/webp";
    }

    private static long littleEndian32(byte[] bytes,int offset){
        return Integer.toUnsignedLong(java.nio.ByteBuffer.wrap(bytes,offset,4)
            .order(java.nio.ByteOrder.LITTLE_ENDIAN).getInt());
    }

    // Reject animation, malformed RIFF boundaries and multiple image payloads before decoding.
    private static void validateStaticWebp(byte[] bytes){
        if(littleEndian32(bytes,4)!=bytes.length-8L)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Malformed WebP container.");
        int images=0,offset=12;
        while(offset<bytes.length){
            if(bytes.length-offset<8)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Malformed WebP chunk.");
            String tag=new String(bytes,offset,4,java.nio.charset.StandardCharsets.US_ASCII);
            long size=littleEndian32(bytes,offset+4),end=offset+8L+size+(size&1L);
            if(end>bytes.length)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Malformed WebP chunk size.");
            if(tag.equals("ANIM")||tag.equals("ANMF")||
                (tag.equals("VP8X")&&(size!=10||(bytes[offset+8]&2)!=0)))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Animated or malformed WebP is not a thumbnail.");
            if(tag.equals("VP8 ")||tag.equals("VP8L"))images++;
            offset=(int)end;
        }
        if(images!=1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"WebP must contain exactly one still image.");
    }

    static String publishingThumbnailKey(UUID packageId,String hash,String type){
        if(packageId==null||hash==null||!hash.matches("[a-f0-9]{64}"))
            throw new IllegalArgumentException("Invalid thumbnail identity.");
        String suffix=switch(type){
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Invalid thumbnail type.");
        };
        return THUMBNAIL_PREFIX+packageId+"/"+hash+suffix;
    }

    public Stored uploadPublishingThumbnail(UUID packageId,byte[] bytes,String type){
        requireWritable();
        if(!publishingImageType(bytes).equals(type))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thumbnail image type mismatch.");
        String hash=sha256(bytes),key=publishingThumbnailKey(packageId,hash,type);
        try{
            try{
                downloadPublishingThumbnail(packageId,key,hash,bytes.length,type);
                return new Stored(key,hash,bytes.length);
            }catch(ResponseStatusException absent){
                if(absent.getStatusCode()!=HttpStatus.NOT_FOUND)throw absent;
            }
            client.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(type)
                .metadata(Map.of("sha256",hash,"owner","mediaos-publishing-thumbnail"))
                .build(),RequestBody.fromBytes(bytes));
            downloadPublishingThumbnail(packageId,key,hash,bytes.length,type);
            return new Stored(key,hash,bytes.length);
        }catch(S3Exception ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Private thumbnail storage unavailable.",ex);
        }
    }

    public byte[] downloadPublishingThumbnail(UUID packageId,String key,String hash,long bytes,String type){
        if(!readable())throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Private thumbnail storage unavailable.");
        if(!publishingThumbnailKey(packageId,hash,type).equals(key)||bytes<1||bytes>MAX_THUMBNAIL_BYTES)
            throw new IllegalArgumentException("Invalid trusted thumbnail manifest.");
        try{
            var head=client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            if(head.contentLength()!=bytes||!hash.equals(head.metadata().get("sha256"))
                ||!"mediaos-publishing-thumbnail".equals(head.metadata().get("owner"))
                ||!type.equals(head.contentType()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Thumbnail manifest mismatch.");
            try(InputStream input=client.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build())){
                byte[] result=input.readNBytes((int)bytes+1);
                if(result.length!=bytes||!hash.equals(sha256(result)))
                    throw new ResponseStatusException(HttpStatus.CONFLICT,"Thumbnail SHA-256 mismatch.");
                return result;
            }
        }catch(S3Exception ex){
            if(ex.statusCode()==404)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Thumbnail object not found.",ex);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Private thumbnail storage unavailable.",ex);
        }catch(IOException ex){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Private thumbnail could not be read.",ex);
        }
    }

    @Override
    public void close() {
        if (client != null) client.close();
    }
}
