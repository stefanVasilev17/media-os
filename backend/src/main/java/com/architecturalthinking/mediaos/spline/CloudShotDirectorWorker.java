package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CloudShotDirectorWorker {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String AGENT_KEY = "SPLINE_SHOT_AGENT";
    private static final String TASK_TYPE = "CREATE_RUNTIME_SHOT_V1";
    private static final String WORKER_ID = "RAILWAY-CLOUD-SHOT-DIRECTOR";
    private static final String LOGIN_FLOW = "EP001_LOGIN_FLOW";
    private static final Pattern DURATION_PATTERN = Pattern.compile(
            "(?iu)(\\d+(?:[\\.,]\\d+)?)\\s*(?:seconds?|secs?|sec\\.?|секунди|секунда|сек\\.?)"
    );
    private static final Pattern PERCENT_PATTERN = Pattern.compile("(?iu)(\\d+(?:[\\.,]\\d+)?)\\s*%");
    private static final Pattern EXACT_CAMERA_PATTERN = Pattern.compile("\\bCAM_[A-Z0-9_]+\\b");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService executor;
    private final AtomicBoolean polling = new AtomicBoolean(false);

    public CloudShotDirectorWorker(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.executor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "media-os-cloud-shot-director");
            thread.setDaemon(true);
            return thread;
        });
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        executor.scheduleWithFixedDelay(this::pollSafely, 500, 1200, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void stop() {
        executor.shutdownNow();
    }

    private void pollSafely() {
        if (!polling.compareAndSet(false, true)) {
            return;
        }

        ClaimedJob claimed = null;
        try {
            claimed = claimNext();
            if (claimed == null) {
                return;
            }
            markOrchestrationRunning(claimed);
            Map<String, Object> spec = createShotSpec(claimed.payload());
            complete(claimed, spec);
        } catch (Exception ex) {
            if (claimed != null) {
                fail(claimed, ex);
            }
        } finally {
            polling.set(false);
        }
    }

    private ClaimedJob claimNext() {
        Optional<ClaimedJob> claimed = jdbc.sql("""
                with candidate as (
                  select id
                  from production_job
                  where agent_key=:agentKey
                    and task_type=:taskType
                    and status='QUEUED'
                  order by created_at
                  for update skip locked
                  limit 1
                )
                update production_job p
                set status='RUNNING',
                    worker_id=:workerId,
                    claimed_at=coalesce(p.claimed_at, now()),
                    started_at=coalesce(p.started_at, now()),
                    updated_at=now()
                from candidate c
                where p.id=c.id
                returning p.id, p.task_id, p.payload::text
                """)
                .param("agentKey", AGENT_KEY)
                .param("taskType", TASK_TYPE)
                .param("workerId", WORKER_ID)
                .query((rs, rowNum) -> new ClaimedJob(
                        rs.getObject("id", UUID.class),
                        rs.getObject("task_id", UUID.class),
                        readJsonMap(rs.getString("payload"))
                ))
                .optional();

        if (claimed.isEmpty()) {
            return null;
        }

        UUID orchestrationJobId = jdbc.sql("select job_id from task where id=:taskId")
                .param("taskId", claimed.get().taskId())
                .query(UUID.class)
                .single();

        return new ClaimedJob(
                claimed.get().productionJobId(),
                claimed.get().taskId(),
                orchestrationJobId,
                claimed.get().payload()
        );
    }

    private void markOrchestrationRunning(ClaimedJob job) {
        jdbc.sql("update task set status='IN_PROGRESS', updated_at=now() where id=:taskId")
                .param("taskId", job.taskId())
                .update();
        jdbc.sql("update job set status='RUNNING', progress=55, updated_at=now() where id=:jobId")
                .param("jobId", job.orchestrationJobId())
                .update();
    }

    private void complete(ClaimedJob job, Map<String, Object> spec) {
        String output = "MEDIA_OS_SPLINE_RESULT: SUCCEEDED " + writeJson(spec);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("output", output);
        result.put("workerId", WORKER_ID);
        result.put("metrics", Map.of(
                "executionProfile", "CLOUD_SHOT_DIRECTOR_V1",
                "executionEngine", "MEDIA_OS_CLOUD_SEMANTIC_PLANNER",
                "readOnly", true,
                "windowsRunnerRequired", false
        ));

        jdbc.sql("""
                update production_job
                set status='SUCCEEDED',
                    result=cast(:result as jsonb),
                    error=null,
                    finished_at=now(),
                    updated_at=now()
                where id=:jobId and worker_id=:workerId and status='RUNNING'
                """)
                .param("result", writeJson(result))
                .param("jobId", job.productionJobId())
                .param("workerId", WORKER_ID)
                .update();

        rememberAppliedCorrection(job);

        jdbc.sql("update task set status='COMPLETED', updated_at=now() where id=:taskId")
                .param("taskId", job.taskId())
                .update();
        jdbc.sql("update job set status='COMPLETED', progress=100, updated_at=now() where id=:jobId")
                .param("jobId", job.orchestrationJobId())
                .update();
    }

    private void rememberAppliedCorrection(ClaimedJob job) {
        String previousShotId = stringValue(job.payload().get("previousShotId")).trim();
        String feedback = stringValue(job.payload().get("creatorMessage")).trim();
        String shotKey = stringValue(job.payload().get("shotKey")).trim();
        if (previousShotId.isBlank() || feedback.isBlank() || shotKey.isBlank()) {
            return;
        }

        UUID sourceJobId;
        try {
            sourceJobId = UUID.fromString(previousShotId);
        } catch (IllegalArgumentException ignored) {
            return;
        }

        jdbc.sql("""
                insert into spline_director_memory(
                    id, project_id, scope, shot_key, source_production_job_id, feedback
                )
                values (:id, :projectId, 'SHOT', :shotKey, :sourceJobId, :feedback)
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("shotKey", shotKey)
                .param("sourceJobId", sourceJobId)
                .param("feedback", feedback)
                .update();
    }

    private void fail(ClaimedJob job, Exception ex) {
        String message = ex.getMessage() == null || ex.getMessage().isBlank()
                ? ex.getClass().getSimpleName()
                : ex.getMessage();
        if (message.length() > 1800) {
            message = message.substring(0, 1800);
        }

        try {
            Map<String, Object> result = Map.of(
                    "output", "",
                    "workerId", WORKER_ID,
                    "metrics", Map.of(
                            "executionProfile", "CLOUD_SHOT_DIRECTOR_V1",
                            "executionEngine", "MEDIA_OS_CLOUD_SEMANTIC_PLANNER",
                            "readOnly", true,
                            "windowsRunnerRequired", false
                    )
            );

            jdbc.sql("""
                    update production_job
                    set status='FAILED',
                        result=cast(:result as jsonb),
                        error=:error,
                        finished_at=now(),
                        updated_at=now()
                    where id=:jobId and worker_id=:workerId
                    """)
                    .param("result", writeJson(result))
                    .param("error", message)
                    .param("jobId", job.productionJobId())
                    .param("workerId", WORKER_ID)
                    .update();
            jdbc.sql("update task set status='FAILED', updated_at=now() where id=:taskId")
                    .param("taskId", job.taskId())
                    .update();
            jdbc.sql("update job set status='FAILED', updated_at=now() where id=:jobId")
                    .param("jobId", job.orchestrationJobId())
                    .update();
        } catch (Exception ignored) {
        }
    }

    private Map<String, Object> createShotSpec(Map<String, Object> payload) {
        String message = stringValue(payload.get("creatorMessage"));
        Map<String, Object> previous = mapValue(payload.get("previousShotSpec"));
        List<String> memory = stringList(payload.get("directorMemory"));

        if (!previous.isEmpty()) {
            return reviseShot(previous, message, memory);
        }
        return createNewShot(message, memory, stringValue(payload.get("shotKey")));
    }

    private Map<String, Object> createNewShot(String message, List<String> memory, String shotKey) {
        String normalized = normalize(message);
        int durationMs = explicitDurationMs(message).orElse(20_000);
        List<String> exactCameras = exactCameraNames(message);
        List<Map<String, Object>> beats = new ArrayList<>();

        if (!exactCameras.isEmpty()) {
            addExactCameraSequence(beats, exactCameras, durationMs, normalized, memory);
        } else {
            boolean wantsLogin = containsAny(normalized,
                    "login", "phone", "логин", "телефон", "sign in", "signin");
            boolean wantsClient = containsAny(normalized,
                    "client boundary", "client reveal", "request assembly", "клиент", "request", "assembly");

            if (wantsLogin && wantsClient) {
                beats.add(flowBeat(0, LOGIN_FLOW));
                int transitionMs = preferredTransitionMs(durationMs, normalized, memory);
                int holdMs = explicitHoldMs(message).orElse(Math.max(2500, Math.round(durationMs * 0.40f)));
                holdMs = Math.min(holdMs, Math.max(0, durationMs - transitionMs - 1000));
                beats.add(cameraBeat(holdMs, "CAM_CLIENT_REVEAL", transitionMs, "easeInOut"));
            } else if (wantsClient) {
                beats.add(cameraBeat(0, "CAM_CLIENT_REVEAL", 0, "easeInOut"));
            } else if (wantsLogin) {
                beats.add(flowBeat(0, LOGIN_FLOW));
            } else {
                beats.add(cameraBeat(0, "MEDIA_OS_CAMERA", 0, "easeInOut"));
            }
        }

        beats.sort((a, b) -> Integer.compare(number(a.get("atMs"), 0), number(b.get("atMs"), 0)));
        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("schemaVersion", 1);
        spec.put("name", shotName(message, shotKey, beats));
        spec.put("durationMs", durationMs);
        spec.put("beats", beats);
        return spec;
    }

    private Map<String, Object> reviseShot(Map<String, Object> previous, String message, List<String> memory) {
        Map<String, Object> spec = objectMapper.convertValue(
                previous,
                new TypeReference<LinkedHashMap<String, Object>>() {}
        );
        String normalized = normalize(message);
        int durationMs = number(spec.get("durationMs"), 20_000);
        Optional<Integer> explicitDuration = explicitDurationMs(message);
        if (explicitDuration.isPresent()) {
            durationMs = explicitDuration.get();
        }

        List<Map<String, Object>> beats = beatList(spec.get("beats"));
        migrateLegacyLoginOpening(beats, stringValue(spec.get("name")));

        List<Map<String, Object>> cameraBeats = cameraBeats(beats);
        Optional<Integer> extraHoldMs = additionalHoldMs(message);
        if (extraHoldMs.isPresent()) {
            Map<String, Object> clientBeat = findCameraBeat(cameraBeats, "CAM_CLIENT_REVEAL");
            if (clientBeat != null) {
                clientBeat.put("atMs", number(clientBeat.get("atMs"), 0) + extraHoldMs.get());
                if (explicitDuration.isEmpty()) {
                    durationMs += extraHoldMs.get();
                }
            }
        }

        if (containsAny(normalized, "slower", "по-бав", "по бав", "по-плав", "по плав")) {
            double factor = slowerFactor(message).orElse(1.25d);
            for (Map<String, Object> beat : cameraBeats) {
                int transitionMs = number(beat.get("transitionMs"), 0);
                if (transitionMs > 0) {
                    beat.put("transitionMs", Math.max(250, (int) Math.round(transitionMs * factor)));
                }
            }
        }

        if (containsAny(normalized, "faster", "по-бърз", "по бърз")) {
            double factor = fasterFactor(message).orElse(0.80d);
            for (Map<String, Object> beat : cameraBeats) {
                int transitionMs = number(beat.get("transitionMs"), 0);
                if (transitionMs > 0) {
                    beat.put("transitionMs", Math.max(250, (int) Math.round(transitionMs * factor)));
                }
            }
        }

        List<String> exactCameras = exactCameraNames(message);
        if (!exactCameras.isEmpty()) {
            replaceCameraSequence(beats, exactCameras, durationMs, normalized, memory);
        } else {
            boolean mentionsLogin = containsAny(normalized, "login", "phone", "логин", "телефон");
            boolean mentionsClient = containsAny(normalized,
                    "client boundary", "client reveal", "request assembly", "клиент", "request", "assembly", "втори кадър", "втория кадър");
            boolean framingCorrection = containsAny(normalized,
                    "focus", "фокус", "frame", "framing", "кадър", "позицион", "center", "centre", "център", "центри");
            boolean openingCorrection = containsAny(normalized,
                    "first", "opening", "start", "begin", "първ", "начал", "започ", "phone", "login", "телефон", "логин");
            boolean secondCorrection = containsAny(normalized,
                    "second", "втори", "втория", "client", "request assembly", "клиент", "request");

            if ((mentionsLogin && containsAny(normalized, "start", "begin", "започ", "начал")) || (framingCorrection && openingCorrection)) {
                ensureLoginFlow(beats);
            }

            cameraBeats = cameraBeats(beats);
            if (mentionsClient && !cameraBeats.isEmpty() && containsAny(normalized, "end", "finish", "накрая", "крайн", "завърш")) {
                cameraBeats.get(cameraBeats.size() - 1).put("targetName", "CAM_CLIENT_REVEAL");
            }

            if (framingCorrection && secondCorrection && findCameraBeat(cameraBeats, "CAM_CLIENT_REVEAL") == null) {
                int transitionMs = preferredTransitionMs(durationMs, normalized, memory);
                int atMs = Math.max(2500, Math.min(durationMs - transitionMs - 500, Math.round(durationMs * 0.40f)));
                beats.add(cameraBeat(atMs, "CAM_CLIENT_REVEAL", transitionMs, "easeInOut"));
            }
        }

        beats.sort((a, b) -> Integer.compare(number(a.get("atMs"), 0), number(b.get("atMs"), 0)));
        int latestEnd = 0;
        for (Map<String, Object> beat : beats) {
            latestEnd = Math.max(
                    latestEnd,
                    number(beat.get("atMs"), 0) + number(beat.get("transitionMs"), 0)
            );
        }
        durationMs = Math.max(durationMs, latestEnd + 500);
        durationMs = Math.min(120_000, Math.max(500, durationMs));

        spec.put("schemaVersion", 1);
        spec.put("durationMs", durationMs);
        spec.put("beats", beats);

        if (spec.equals(previous)) {
            throw new IllegalArgumentException(
                    "The director correction did not change the ShotSpec. Describe the concrete framing, timing, camera target, flow, state, or event change you want."
            );
        }
        return spec;
    }

    private void migrateLegacyLoginOpening(List<Map<String, Object>> beats, String shotName) {
        boolean hadLoginCamera = beats.removeIf(beat ->
                "CAMERA".equalsIgnoreCase(stringValue(beat.get("type")))
                        && "CAM_LOGIN".equalsIgnoreCase(stringValue(beat.get("targetName")))
        );
        boolean loginShot = hadLoginCamera || normalize(shotName).contains("login");
        if (loginShot) {
            ensureLoginFlow(beats);
        }
    }

    private void ensureLoginFlow(List<Map<String, Object>> beats) {
        boolean exists = beats.stream().anyMatch(beat ->
                "FLOW".equalsIgnoreCase(stringValue(beat.get("type")))
                        && LOGIN_FLOW.equalsIgnoreCase(stringValue(beat.get("flowName")))
        );
        if (!exists) {
            beats.add(flowBeat(0, LOGIN_FLOW));
        }
    }

    private List<Map<String, Object>> cameraBeats(List<Map<String, Object>> beats) {
        return beats.stream()
                .filter(beat -> "CAMERA".equalsIgnoreCase(stringValue(beat.get("type"))))
                .toList();
    }

    private Map<String, Object> findCameraBeat(List<Map<String, Object>> cameraBeats, String targetName) {
        return cameraBeats.stream()
                .filter(beat -> targetName.equalsIgnoreCase(stringValue(beat.get("targetName"))))
                .findFirst()
                .orElse(null);
    }

    private void addExactCameraSequence(
            List<Map<String, Object>> beats,
            List<String> cameras,
            int durationMs,
            String normalized,
            List<String> memory
    ) {
        beats.add(cameraBeat(0, cameras.get(0), 0, "easeInOut"));
        if (cameras.size() == 1) {
            return;
        }
        int transitionMs = preferredTransitionMs(durationMs, normalized, memory);
        int usable = Math.max(1, durationMs - transitionMs);
        for (int index = 1; index < cameras.size(); index++) {
            int atMs = Math.round((usable * index) / (float) cameras.size());
            beats.add(cameraBeat(atMs, cameras.get(index), transitionMs, "easeInOut"));
        }
    }

    private void replaceCameraSequence(
            List<Map<String, Object>> beats,
            List<String> cameras,
            int durationMs,
            String normalized,
            List<String> memory
    ) {
        beats.removeIf(beat -> "CAMERA".equalsIgnoreCase(stringValue(beat.get("type"))));
        List<Map<String, Object>> cameraBeats = new ArrayList<>();
        addExactCameraSequence(cameraBeats, cameras, durationMs, normalized, memory);
        beats.addAll(cameraBeats);
    }

    private int preferredTransitionMs(int durationMs, String normalized, List<String> memory) {
        String memoryText = normalize(String.join(" ", memory));
        boolean restrained = containsAny(normalized + " " + memoryText,
                "slow", "cinematic", "smooth", "спокой", "плав", "no drift", "без drift", "без постоянен");
        int defaultMs = restrained ? 4000 : 2600;
        return Math.max(700, Math.min(defaultMs, Math.max(700, durationMs / 3)));
    }

    private Optional<Integer> explicitDurationMs(String message) {
        Matcher matcher = DURATION_PATTERN.matcher(message == null ? "" : message);
        if (!matcher.find()) {
            return Optional.empty();
        }
        double seconds = parseDecimal(matcher.group(1), 0d);
        if (seconds <= 0d) {
            return Optional.empty();
        }
        return Optional.of((int) Math.round(seconds * 1000d));
    }

    private Optional<Integer> explicitHoldMs(String message) {
        String normalized = normalize(message);
        if (!containsAny(normalized, "hold", "stay", "задръж", "остани", "стой")) {
            return Optional.empty();
        }
        return explicitDurationMs(message);
    }

    private Optional<Integer> additionalHoldMs(String message) {
        String normalized = normalize(message);
        boolean additional = containsAny(normalized, "още", "another", "additional", "допълнително");
        boolean hold = containsAny(normalized, "hold", "stay", "задръж", "остани", "стой", "phone", "login", "телефон", "логин");
        if (!additional || !hold) {
            return Optional.empty();
        }
        return explicitDurationMs(message);
    }

    private Optional<Double> slowerFactor(String message) {
        Matcher matcher = PERCENT_PATTERN.matcher(message == null ? "" : message);
        if (!matcher.find()) {
            return Optional.empty();
        }
        double percent = parseDecimal(matcher.group(1), 0d);
        return Optional.of(Math.max(1.01d, 1d + percent / 100d));
    }

    private Optional<Double> fasterFactor(String message) {
        Matcher matcher = PERCENT_PATTERN.matcher(message == null ? "" : message);
        if (!matcher.find()) {
            return Optional.empty();
        }
        double percent = parseDecimal(matcher.group(1), 0d);
        return Optional.of(Math.max(0.15d, 1d - percent / 100d));
    }

    private List<String> exactCameraNames(String message) {
        List<String> names = new ArrayList<>();
        Matcher matcher = EXACT_CAMERA_PATTERN.matcher(message == null ? "" : message.toUpperCase(Locale.ROOT));
        while (matcher.find()) {
            String name = matcher.group();
            if (!names.contains(name)) {
                names.add(name);
            }
        }
        return names;
    }

    private Map<String, Object> cameraBeat(int atMs, String targetName, int transitionMs, String easing) {
        Map<String, Object> beat = new LinkedHashMap<>();
        beat.put("type", "CAMERA");
        beat.put("atMs", Math.max(0, atMs));
        beat.put("targetName", targetName);
        if (transitionMs > 0) {
            beat.put("transitionMs", transitionMs);
            beat.put("easing", easing);
        }
        return beat;
    }

    private Map<String, Object> flowBeat(int atMs, String flowName) {
        Map<String, Object> beat = new LinkedHashMap<>();
        beat.put("type", "FLOW");
        beat.put("atMs", Math.max(0, atMs));
        beat.put("flowName", flowName);
        return beat;
    }

    private String shotName(String message, String shotKey, List<Map<String, Object>> beats) {
        boolean login = beats.stream().anyMatch(beat ->
                "CAM_LOGIN".equals(beat.get("targetName"))
                        || ("FLOW".equals(beat.get("type")) && LOGIN_FLOW.equals(beat.get("flowName")))
        );
        boolean client = beats.stream().anyMatch(beat -> "CAM_CLIENT_REVEAL".equals(beat.get("targetName")));
        if (login && client) {
            return "Login to Client Boundary";
        }
        if (login) {
            return "Login Focus";
        }
        if (client) {
            return "Client Boundary Focus";
        }
        if (shotKey != null && !shotKey.isBlank()) {
            return shotKey;
        }
        return "Runtime Shot";
    }

    private List<Map<String, Object>> beatList(Object value) {
        List<Map<String, Object>> beats = new ArrayList<>();
        if (!(value instanceof List<?> rawList)) {
            return beats;
        }
        for (Object item : rawList) {
            Map<String, Object> beat = mapValue(item);
            if (!beat.isEmpty()) {
                beats.add(beat);
            }
        }
        return beats;
    }

    private Map<String, Object> mapValue(Object value) {
        if (!(value instanceof Map<?, ?>)) {
            return new LinkedHashMap<>();
        }
        return objectMapper.convertValue(
                value,
                new TypeReference<LinkedHashMap<String, Object>>() {}
        );
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(item -> item != null)
                .map(String::valueOf)
                .toList();
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid Cloud Shot Director payload.", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize Cloud Shot Director result.", ex);
        }
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return fallback;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private double parseDecimal(String value, double fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Double.parseDouble(value.replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replace('–', '-').replace('—', '-');
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private record ClaimedJob(
            UUID productionJobId,
            UUID taskId,
            UUID orchestrationJobId,
            Map<String, Object> payload
    ) {
        private ClaimedJob(UUID productionJobId, UUID taskId, Map<String, Object> payload) {
            this(productionJobId, taskId, null, payload);
        }
    }
}
