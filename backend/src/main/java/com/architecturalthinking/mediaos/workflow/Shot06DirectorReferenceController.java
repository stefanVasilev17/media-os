package com.architecturalthinking.mediaos.workflow;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-review/shot06-v5")
public class Shot06DirectorReferenceController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final int REVISION = 3;
    private static final String SHOT = "SHOT 06";
    private static final String VERSION = "v5";
    private static final String EXPECTED_SHA256 =
            "6e96f65d27a1dfd0ea3e6dde2343c444af81900d6dc4c324c6ab78ff361a3e57";
    private static final int EXPECTED_SIZE = 10518165;

    private final JdbcClient jdbc;

    public Shot06DirectorReferenceController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> state() {
        Map<String, Object> stored = jdbc.sql("""
                select content_sha256,size_bytes,uploaded_at
                from episode_director_reference_video
                where episode_id=:episode and script_revision=3
                  and shot_key=:shot and version=:version
                """)
                .param("episode", EPISODE).param("shot", SHOT).param("version", VERSION)
                .query((rs, row) -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("available", true);
                    data.put("sha256", rs.getString(1));
                    data.put("sizeBytes", rs.getLong(2));
                    data.put("uploadedAt", rs.getObject(3).toString());
                    return data;
                }).optional().orElseGet(() -> Map.of("available", false));

        Map<String, Object> response = new LinkedHashMap<>(stored);
        response.put("shotKey", SHOT);
        response.put("version", VERSION);
        response.put("expectedSha256", EXPECTED_SHA256);
        response.put("expectedSizeBytes", EXPECTED_SIZE);
        response.put("directorApprovedReference", true);
        response.put("nativeVisualQaPassed", false);
        response.put("nativeDirectorLockApplied", false);
        response.put("videoUrl", "/api/v1/director-review/shot06-v5/video");
        return response;
    }

    @Transactional
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty() || file.getSize() != EXPECTED_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The exact 10,518,165-byte SHOT06 Director v5 MP4 is required.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded video.", ex);
        }
        String digest;
        try {
            digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
        if (!EXPECTED_SHA256.equals(digest)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHA-256 mismatch. Refusing an alternate GitHub, older, recompressed or edited SHOT06 MP4.");
        }
        String stage = jdbc.sql("""
                select status from production_stage
                where episode_id=:episode and stage_key='SCRIPT'
                  and current_revision=3
                """).param("episode", EPISODE).query(String.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Script revision 3 is missing."));
        if (!"LOCKED".equals(stage)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Script revision 3 is not LOCKED.");
        }

        jdbc.sql("""
                insert into episode_director_reference_video(
                    episode_id,script_revision,shot_key,version,
                    content_sha256,size_bytes,media_type,video_data
                ) values (:episode,3,:shot,:version,:sha,:size,'video/mp4',:data)
                on conflict (episode_id,script_revision,shot_key,version) do nothing
                """)
                .param("episode", EPISODE).param("shot", SHOT).param("version", VERSION)
                .param("sha", digest).param("size", bytes.length).param("data", bytes)
                .update();

        boolean matches = jdbc.sql("""
                select exists(select 1 from episode_director_reference_video
                where episode_id=:episode and script_revision=3 and shot_key=:shot
                  and version=:version and content_sha256=:sha and size_bytes=:size)
                """).param("episode", EPISODE).param("shot", SHOT)
                .param("version", VERSION).param("sha", digest)
                .param("size", bytes.length).query(Boolean.class).single();
        if (!matches) throw new ResponseStatusException(HttpStatus.CONFLICT, "Different SHOT06 reference already exists. Nothing overwritten.");
        return state();
    }

    @GetMapping("/video")
    public ResponseEntity<byte[]> video(@RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {
        byte[] bytes = jdbc.sql("""
                select video_data from episode_director_reference_video
                where episode_id=:episode and script_revision=3
                  and shot_key=:shot and version=:version
                  and content_sha256=:sha
                """).param("episode", EPISODE).param("shot", SHOT)
                .param("version", VERSION).param("sha", EXPECTED_SHA256)
                .query((rs, row) -> rs.getBytes(1))
                .optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "The exact approved SHOT06 v5 MP4 has not been uploaded to MediaOS."));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("video/mp4"));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.setCacheControl("private, max-age=31536000, immutable");
        if (range == null || !range.startsWith("bytes=")) {
            headers.setContentLength(bytes.length);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        }
        String spec = range.substring(6).split(",",2)[0].trim();
        int hyphen = spec.indexOf('-');
        if (hyphen < 0) throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
        long start, end;
        try {
            if (hyphen == 0) {
                long suffix = Long.parseLong(spec.substring(1));
                if (suffix <= 0) throw new NumberFormatException();
                start = Math.max(0, bytes.length - suffix);
                end = bytes.length - 1L;
            } else {
                start = Long.parseLong(spec.substring(0, hyphen));
                end = hyphen == spec.length()-1 ? bytes.length-1L :
                        Long.parseLong(spec.substring(hyphen+1));
            }
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
        }
        if (start < 0 || start >= bytes.length || end < start)
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
        end = Math.min(end, bytes.length - 1L);
        byte[] part = Arrays.copyOfRange(bytes, (int)start, (int)end+1);
        headers.setContentLength(part.length);
        headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + bytes.length);
        return new ResponseEntity<>(part, headers, HttpStatus.PARTIAL_CONTENT);
    }
}
