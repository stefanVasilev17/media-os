package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
public class DirectorScriptAmendmentController {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;

    public DirectorScriptAmendmentController(JdbcClient jdbc, ObjectMapper mapper, ProductionOverviewService overview) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.overview = overview;
    }

    @Transactional
    @PostMapping("/api/v1/locked-script/director-amendment")
    public Map<String, Object> apply(@Valid @RequestBody LockedScriptImportController.LockedScriptImport request) {
        if (!LockedScriptImportController.SCHEMA_VERSION.equals(request.schemaVersion())) {
            throw conflict("Wrong script format.");
        }
        if (!"FULLY_LOCKED".equalsIgnoreCase(request.status())) {
            throw conflict("Only a Director-approved FULLY_LOCKED revision is allowed.");
        }
        Map<String, Object> episode = overview.episode();
        if (!norm(request.episodeNumber()).equals(norm(String.valueOf(episode.get("episodeNumber"))))
                || !norm(request.title()).equals(norm(String.valueOf(episode.get("title"))))) {
            throw conflict("The file belongs to a different episode.");
        }

        Map<String, Object> current = jdbc.sql("""
                select current_revision, status, artifact::text
                from production_stage where episode_id=:episodeId and stage_key='SCRIPT' for update
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, row) -> {
                    Map<String, Object> found = new LinkedHashMap<>();
                    found.put("revision", rs.getInt("current_revision"));
                    found.put("status", rs.getString("status"));
                    found.put("artifact", read(rs.getString("artifact")));
                    return found;
                }).single();

        if (!"LOCKED".equals(current.get("status"))) {
            throw conflict("The original script must remain LOCKED.");
        }
        int revision = ((Number) current.get("revision")).intValue();
        if (jdbc.sql("""
                select count(*) from episode_script_director_amendment
                where episode_id=:episodeId and script_revision=:revision
                """).param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                .query(Long.class).single() > 0) {
            throw conflict("A Director amendment is already active for this revision.");
        }
        long downstreamVisualLocks = jdbc.sql("""
                select count(*) from visual_shot_lock
                where episode_id=:episodeId and script_revision=:revision
                  and shot_key not in ('SHOT 01','SHOT 02','SHOT 03','SHOT 04')
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                .query(Long.class).single();
        if (downstreamVisualLocks > 0) {
            throw conflict("A later shot is already Director LOCKED; a larger migration is required.");
        }
        long downstreamApprovedVoice = jdbc.sql("""
                select count(*) from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision
                  and shot_key not in ('SHOT 01','SHOT 02','SHOT 03','SHOT 04')
                  and voice_approved_at is not null
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID).param("revision", revision)
                .query(Long.class).single();
        if (downstreamApprovedVoice > 0) {
            throw conflict("A later voice clip is already approved; automatic replacement is unsafe.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> base = (Map<String, Object>) current.get("artifact");
        List<Map<String, Object>> before = rows(base.get("timeline"));
        List<LockedScriptImportController.TimelineBlock> after = request.timeline();
        List<LockedScriptImportController.TimelineBlock> approvedShot = scopedApprovedShot05(before, after);
        int originalStart = number(grouped(before).get("SHOT 05").get(0).get("startSecond"));
        int suppliedStart = approvedShot.get(0).startSecond();
        int effectiveTarget = number(base.get("targetDurationSeconds")) + 50;

        Map<String, List<Map<String, Object>>> oldByShot = grouped(before);
        Map<String, Object> amended = new LinkedHashMap<>(base);
        List<Map<String, Object>> effectiveTimeline = new ArrayList<>();
        for (int shotIndex = 1; shotIndex <= 16; shotIndex++) {
            String shotKey = shot(shotIndex);
            if (shotIndex == 5) {
                for (var block : approvedShot) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("sectionId", block.sectionId());
                    row.put("sectionTitle", block.sectionTitle());
                    row.put("shotKey", shotKey);
                    row.put("startSecond", originalStart + block.startSecond() - suppliedStart);
                    row.put("endSecond", originalStart + block.endSecond() - suppliedStart);
                    row.put("narration", block.narration());
                    row.put("voiceDirection", block.voiceDirection());
                    row.put("purpose", "Director-approved SHOT 05 amendment; Concept First, Term Second.");
                    row.put("newValueEvent", false);
                    row.put("newValueSummary", "");
                    row.put("microTension", false);
                    row.put("cognitiveRelief", false);
                    row.put("listPassage", false);
                    row.put("ahaMoment", false);
                    row.put("reelCandidate", false);
                    row.put("handoffNotes", "Approved SHOT 05 voice; preserve existing SHOT 01–04.");
                    effectiveTimeline.add(row);
                }
            } else {
                for (Map<String, Object> original : oldByShot.getOrDefault(shotKey, List.of())) {
                    Map<String, Object> copy = new LinkedHashMap<>(original);
                    if (shotIndex > 5) {
                        copy.put("startSecond", number(original.get("startSecond")) + 50);
                        copy.put("endSecond", number(original.get("endSecond")) + 50);
                    }
                    effectiveTimeline.add(copy);
                }
            }
        }
        amended.put("timeline", effectiveTimeline);
        amended.put("targetDurationSeconds", effectiveTarget);
        amended.put("directorAmendment", "SHOT 05 | Concept First, Term Second | +50s downstream planning clock");
        String json = write(amended);
        jdbc.sql("""
                insert into episode_script_director_amendment(id,episode_id,script_revision,payload)
                values(:id,:episodeId,:revision,cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("payload", json)
                .update();

        return Map.of(
                "ready", true,
                "scriptRevision", revision,
                "targetDurationSeconds", effectiveTarget,
                "effectiveShot05StartSecond", originalStart,
                "effectiveShot05EndSecond", originalStart + 130,
                "timelineBlocks", effectiveTimeline.size(),
                "preservedDirectorLockedShots", List.of("SHOT 01", "SHOT 02", "SHOT 03", "SHOT 04"),
                "message", "Director SHOT 05 amendment accepted. Import SHOT 05 HEAR/SEE next."
        );
    }

    public Map<String, Object> effectiveArtifact(int revision, Map<String, Object> original) {
        return jdbc.sql("""
                select payload::text from episode_script_director_amendment
                where episode_id=:episodeId and script_revision=:revision
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query(String.class)
                .optional()
                .map(this::read)
                .orElse(original);
    }

    private static final String APPROVED_NARRATION_SHA256 =
            "a7d4ddce77e70013b8a9ab384bc2baba5f80440f4a5d911dd0799c34355e58d8";

    static List<LockedScriptImportController.TimelineBlock> scopedApprovedShot05(
            List<Map<String, Object>> canonical,
            List<LockedScriptImportController.TimelineBlock> supplied
    ) {
        Map<String, List<Map<String, Object>>> oldByShot = grouped(canonical);
        List<Map<String, Object>> original = oldByShot.getOrDefault("SHOT 05", List.of());
        if (original.isEmpty() || original.get(0).get("startSecond") == null) {
            throw conflict("The current LOCKED Script has no SHOT 05. Import stopped.");
        }
        int start = number(original.get(0).get("startSecond"));
        int end = number(original.get(original.size() - 1).get("endSecond"));
        if (end - start != 80) {
            throw conflict("Current SHOT 05 is " + (end-start) + " seconds, expected 80. Review required.");
        }
        List<LockedScriptImportController.TimelineBlock> shot = supplied.stream()
                .filter(x -> "SHOT 05".equals(x.shotKey())).toList();
        if (shot.size() != 7) {
            throw conflict("The approved SHOT 05 must contain exactly seven voice blocks.");
        }
        int cursor = shot.get(0).startSecond();
        int origin = cursor;
        StringBuilder narration = new StringBuilder();
        for (int i = 0; i < shot.size(); i++) {
            var block = shot.get(i);
            if (block.startSecond() != cursor || block.endSecond() <= cursor
                    || block.narration() == null || block.narration().isBlank()) {
                throw conflict("SHOT 05 contains a gap, overlap, or empty narration at clip " + (i+1) + ".");
            }
            cursor = block.endSecond();
            if (i > 0) narration.append('\n');
            narration.append(block.narration());
        }
        if (cursor - origin != 130) {
            throw conflict("The seven approved SHOT 05 blocks must total 130 seconds.");
        }
        try {
            byte[] checksum = MessageDigest.getInstance("SHA-256")
                    .digest(narration.toString().getBytes(StandardCharsets.UTF_8));
            if (!APPROVED_NARRATION_SHA256.equals(HexFormat.of().formatHex(checksum))) {
                throw conflict("SHOT 05 text does not match the Director-approved Simple English script.");
            }
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
        return shot;
    }

    static void validate(
            List<Map<String, Object>> before,
            List<LockedScriptImportController.TimelineBlock> after,
            int newTarget,
            int oldTarget
    ) {
        if (newTarget != oldTarget + 50) throw conflict("SHOT 05 revision must add exactly 50 seconds.");
        Map<String, List<Map<String, Object>>> oldByShot = grouped(before);
        Map<String, List<LockedScriptImportController.TimelineBlock>> newByShot = new LinkedHashMap<>();
        int cursor = 0;
        for (var block : after) {
            if (block.startSecond() != cursor || block.endSecond() <= cursor) {
                throw conflict("The amended script must be contiguous and ordered.");
            }
            if (!block.shotKey().matches("SHOT (0[1-9]|1[0-6])")) {
                throw conflict("Unknown SHOT identifier.");
            }
            cursor = block.endSecond();
            newByShot.computeIfAbsent(block.shotKey(), key -> new ArrayList<>()).add(block);
        }
        if (cursor != newTarget) throw conflict("The new script does not end at the target time.");

        for (int index = 1; index <= 16; index++) {
            String key = shot(index);
            var oldBlocks = oldByShot.getOrDefault(key, List.of());
            var newBlocks = newByShot.getOrDefault(key, List.of());
            if (oldBlocks.isEmpty() || newBlocks.isEmpty()) throw conflict("Missing " + key + " in the script.");
            if (index == 5) {
                int oldStart = number(oldBlocks.get(0).get("startSecond"));
                int oldEnd = number(oldBlocks.get(oldBlocks.size() - 1).get("endSecond"));
                if (newBlocks.get(0).startSecond() != oldStart
                        || newBlocks.get(newBlocks.size() - 1).endSecond() != oldEnd + 50
                        || newBlocks.size() != 7) {
                    throw conflict("SHOT 05 must have the seven approved voice blocks and +50 seconds.");
                }
                continue;
            }
            if (oldBlocks.size() != newBlocks.size()) {
                throw conflict(key + " changed its narration block count.");
            }
            for (int j = 0; j < oldBlocks.size(); j++) {
                var old = oldBlocks.get(j);
                var next = newBlocks.get(j);
                int delta = index < 5 ? 0 : 50;
                if (next.startSecond() != number(old.get("startSecond")) + delta
                        || next.endSecond() != number(old.get("endSecond")) + delta
                        || !norm(next.narration()).equals(norm(String.valueOf(old.get("narration"))))) {
                    throw conflict(key + " must keep its original narration and only the approved clock shift.");
                }
            }
        }
    }

    private static Map<String, List<Map<String, Object>>> grouped(List<Map<String, Object>> rows) {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        for (var row : rows) {
            result.computeIfAbsent(String.valueOf(row.get("shotKey")), x -> new ArrayList<>()).add(row);
        }
        return result;
    }

    private static String shot(int i) { return String.format(Locale.ROOT, "SHOT %02d", i); }
    private static int number(Object value) { return value instanceof Number n ? n.intValue() : 0; }
    private static String norm(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT); }
    private static ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }

    private List<Map<String, Object>> rows(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof Map<?, ?> map) {
                Map<String, Object> converted = new LinkedHashMap<>();
                map.forEach((key, item) -> converted.put(String.valueOf(key), item));
                result.add(converted);
            }
        }
        return result;
    }

    private Map<String, Object> read(String json) {
        try { return mapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception ex) { throw new IllegalStateException("Invalid saved script amendment.", ex); }
    }

    private String write(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (Exception ex) { throw new IllegalStateException("Could not store script amendment.", ex); }
    }
}
