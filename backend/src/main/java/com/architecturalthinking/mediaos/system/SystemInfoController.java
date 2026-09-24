package com.architecturalthinking.mediaos.system;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemInfoController {

    private static final String MEDIA_OS_VERSION = "0.4.4";
    private final Instant startedAt = Instant.now();

    @GetMapping("/version")
    public ResponseEntity<Map<String, Object>> version() {
        String commit = firstNonBlank(
                System.getenv("RAILWAY_GIT_COMMIT_SHA"),
                System.getenv("GIT_COMMIT_SHA"),
                "unknown"
        );

        String release = "unknown".equals(commit)
                ? MEDIA_OS_VERSION
                : commit.substring(0, Math.min(8, commit.length()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("product", "Media OS");
        body.put("version", MEDIA_OS_VERSION);
        body.put("release", release);
        body.put("commitSha", commit);
        body.put("commitMessage", firstNonBlank(System.getenv("RAILWAY_GIT_COMMIT_MESSAGE"), ""));
        body.put("buildTime", readBuildTime());
        body.put("startedAt", startedAt.toString());
        body.put("serverTime", Instant.now().toString());
        body.put("deploymentId", firstNonBlank(System.getenv("RAILWAY_DEPLOYMENT_ID"), "unknown"));
        body.put("environment", firstNonBlank(System.getenv("RAILWAY_ENVIRONMENT_NAME"), "production"));
        body.put("service", firstNonBlank(System.getenv("RAILWAY_SERVICE_NAME"), "media-os-backend"));
        body.put("cachePolicy", "APP_SHELL_NO_STORE");

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    private String readBuildTime() {
        try (InputStream stream = getClass().getResourceAsStream("/media-os-build-time.txt")) {
            if (stream == null) {
                return "unknown";
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                String value = reader.readLine();
                return value == null || value.isBlank() ? "unknown" : value.trim();
            }
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
