package com.architecturalthinking.mediaos.workflow;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/director-overview")
public class EpisodeDirectorOverviewController {
    private static final Pattern SHOT_KEY = Pattern.compile("^SHOT\\s*([0-9]{1,3})$", Pattern.CASE_INSENSITIVE);

    private final EpisodeWorkspaceService episodes;
    private final JdbcClient jdbc;

    public EpisodeDirectorOverviewController(EpisodeWorkspaceService episodes, JdbcClient jdbc) {
        this.episodes = episodes;
        this.jdbc = jdbc;
    }

    private static final class Shot {
        private final String key;
        private String title;
        private String narration = "";
        private int startSecond = -1;
        private int endSecond = -1;
        private int voiceTotal;
        private int voiceApproved;
        private boolean voiceGenerated;
        private boolean videoLocked;
        private boolean videoDraft;
        private int lockedRevision;
        private boolean revisedVoiceApproved;
        private String visualDirection = "";
        private String voiceDirection = "";

        private Shot(String key) {
            this.key = key;
            this.title = key;
        }

        private Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("shotKey", key);
            out.put("title", title);
            out.put("narration", narration);
            out.put("startSecond", startSecond);
            out.put("endSecond", endSecond);
            out.put("voiceStatus", effectiveVoiceStatus(lockedRevision, revisedVoiceApproved, voiceTotal, voiceApproved));
            out.put("videoStatus", videoLocked && lockedRevision == 0 ? "LOCKED" : "PENDING");
            out.put("voiceProgress", voiceApproved + "/" + voiceTotal);
            out.put("voiceHasDraft", voiceGenerated);
            out.put("videoHasDraft", videoDraft);
            out.put("shotRevision", lockedRevision);
            out.put("visualDirection", visualDirection);
            out.put("voiceDirection", voiceDirection);
            return out;
        }
    }

    @GetMapping
    public Map<String, Object> overview(@PathVariable UUID episodeId) {
        Map<String, Object> episode = episodes.episode(episodeId);
        List<Map<String, Object>> stages = episodes.stages(episodeId);
        Map<String, Shot> shots = new LinkedHashMap<>();
        int scriptRevision = 0;
        for (Map<String, Object> stage : stages) {
            if (!"SCRIPT".equals(stage.get("stageKey"))) continue;
            scriptRevision = ((Number) stage.get("revision")).intValue();
            Object artifact = stage.get("artifact");
            if (!(artifact instanceof Map<?, ?> data) || !(data.get("timeline") instanceof List<?> timeline)) break;
            for (Object entry : timeline) {
                if (!(entry instanceof Map<?, ?> block)) continue;
                String key = shotKey(block.get("shotKey"));
                if (key == null) continue;
                Shot shot = shots.computeIfAbsent(key, Shot::new);
                String title = string(block.get("sectionTitle"));
                if (title.isBlank()) title = string(block.get("title"));
                if (!title.isBlank()) shot.title = title;
                String narration = string(block.get("narration"));
                if (!narration.isBlank()) shot.narration += (shot.narration.isEmpty() ? "" : System.lineSeparator().repeat(2)) + narration;
                String voiceDirection = string(block.get("voiceDirection"));
                if (!voiceDirection.isBlank()) shot.voiceDirection = voiceDirection;
                int start = block.get("startSecond") instanceof Number n
                        ? n.intValue() : editorialSecond(block.get("editorialStart"));
                if (start >= 0) shot.startSecond = shot.startSecond < 0 ? start : Math.min(shot.startSecond, start);
                int end = block.get("endSecond") instanceof Number n
                        ? n.intValue() : editorialSecond(block.get("editorialEnd"));
                if (end >= 0) shot.endSecond = Math.max(shot.endSecond, end);
            }
            break;
        }

        // Approved SCENE choreography augments script shots without creating voice/video approvals.
        for (Map<String, Object> stage : stages) {
            if (!"SCENE".equals(stage.get("stageKey")) || !"LOCKED".equals(stage.get("status"))) continue;
            Object artifact = stage.get("artifact");
            if (!(artifact instanceof Map<?, ?> data) || !(data.get("shots") instanceof List<?> plans)) break;
            for (Object entry : plans) {
                if (!(entry instanceof Map<?, ?> plan)) continue;
                String key = shotKey(plan.get("shotKey"));
                if (key == null) continue;
                Shot shot = shots.get(key);
                if (shot == null) continue;
                String approvedVisual = string(plan.get("visualPlanMarkdown"));
                if (!approvedVisual.isBlank()) shot.visualDirection = approvedVisual;
            }
            break;
        }

        int revision = scriptRevision;
        if (revision > 0) {
            jdbc.sql("""
                    select shot_key, count(*) as total,
                           count(*) filter (where voice_approved_at is not null) as approved,
                           bool_or(generated_audio is not null) as generated
                    from voice_clip_workflow
                    where episode_id=:episodeId and script_revision=:revision
                    group by shot_key
                    """)
                    .param("episodeId", episodeId).param("revision", revision)
                    .query((rs, n) -> {
                        String key = shotKey(rs.getString("shot_key"));
                        if (key != null) {
                            Shot shot = shots.computeIfAbsent(key, Shot::new);
                            shot.voiceTotal = rs.getInt("total");
                            shot.voiceApproved = rs.getInt("approved");
                            shot.voiceGenerated |= rs.getBoolean("generated");
                        }
                        return key;
                    }).list();

            jdbc.sql("""
                    select shot_key, shot_title, start_second, end_second,
                           voice_approved_at, generated_audio
                    from voice_shot_workflow
                    where episode_id=:episodeId and script_revision=:revision
                    """)
                    .param("episodeId", episodeId).param("revision", revision)
                    .query((rs, n) -> {
                        String key = shotKey(rs.getString("shot_key"));
                        if (key != null) {
                            Shot shot = shots.computeIfAbsent(key, Shot::new);
                            String title = string(rs.getString("shot_title"));
                            if (!title.isBlank()) shot.title = title;
                            if (shot.startSecond < 0) shot.startSecond = rs.getInt("start_second");
                            if (shot.endSecond < 0) shot.endSecond = rs.getInt("end_second");
                            if (shot.voiceTotal == 0) {
                                shot.voiceTotal = 1;
                                shot.voiceApproved = rs.getObject("voice_approved_at") != null ? 1 : 0;
                            }
                            shot.voiceGenerated |= rs.getBytes("generated_audio") != null;
                        }
                        return key;
                    }).list();

            // Episode-aware original Script takes are separate from revision-specific voice
            // and cannot silently change the EP001 voice/visual workflows.
            jdbc.sql("""
                    select shot_key,
                           count(*) filter (where approved_at is not null) as approved,
                           count(*) as total
                    from episode_locked_script_voice_take
                    where episode_id=:episode and script_revision=:revision
                    group by shot_key
                    """)
                    .param("episode", episodeId).param("revision", revision)
                    .query((rs, n) -> {
                        String key = shotKey(rs.getString("shot_key"));
                        if (key != null) {
                            Shot shot = shots.get(key);
                            if (shot != null && shot.voiceTotal == 0) {
                                shot.voiceTotal = 1;
                                shot.voiceApproved = rs.getInt("approved") > 0 ? 1 : 0;
                                shot.voiceGenerated = rs.getInt("total") > 0;
                            }
                        }
                        return key;
                    }).list();

            jdbc.sql("""
                    select shot_key from visual_shot_lock
                    where episode_id=:episodeId and script_revision=:revision
                    """)
                    .param("episodeId", episodeId).param("revision", revision)
                    .query((rs, n) -> {
                        String key = shotKey(rs.getString("shot_key"));
                        if (key != null) shots.computeIfAbsent(key, Shot::new).videoLocked = true;
                        return key;
                    }).list();
        }

        jdbc.sql("""
                select s.shot_number, s.title,
                       count(c.id) as total,
                       count(c.approved_at) as approved,
                       count(c.generated_at) as generated,
                       s.preview_render_id
                from studio_shot s
                left join studio_clip c on c.shot_id=s.id
                where s.episode_id=:episodeId
                group by s.id
                """)
                .param("episodeId", episodeId)
                .query((rs, n) -> {
                    String key = String.format(Locale.ROOT, "SHOT %02d", rs.getInt("shot_number"));
                    Shot shot = shots.computeIfAbsent(key, Shot::new);
                    if (shot.title.equals(key)) shot.title = rs.getString("title");
                    if (shot.voiceTotal == 0 && rs.getInt("total") > 0) {
                        shot.voiceTotal = rs.getInt("total");
                        shot.voiceApproved = rs.getInt("approved");
                    }
                    shot.voiceGenerated |= rs.getInt("generated") > 0;
                    shot.videoDraft |= rs.getObject("preview_render_id") != null;
                    return key;
                }).list();

        // An approved script correction supersedes old audio/render approvals only for
        // the Director status model. The previous recordings and LOCKs remain untouched.
        jdbc.sql("""
                select distinct on (shot_key) shot_key,revision,narration,voice_direction,visual_direction
                from episode_shot_revision
                where episode_id=:episode and status='LOCKED'
                order by shot_key,revision desc
                """).param("episode", episodeId)
                .query((rs, n) -> {
                    String key = shotKey(rs.getString("shot_key"));
                    if (key != null && shots.containsKey(key)) {
                        Shot shot = shots.get(key);
                        shot.lockedRevision = rs.getInt("revision");
                        shot.narration = rs.getString("narration");
                        shot.visualDirection = rs.getString("visual_direction");
                        shot.voiceDirection = rs.getString("voice_direction");
                    }
                    return key;
                }).list();

        jdbc.sql("""
                select v.shot_key,v.shot_revision
                from episode_revision_voice_take v
                join episode_shot_revision r
                  on r.episode_id=v.episode_id
                  and r.shot_key=v.shot_key and r.revision=v.shot_revision
                where v.episode_id=:episode and v.approved_at is not null
                  and r.status='LOCKED'
                """).param("episode", episodeId)
                .query((rs, n) -> {
                    String key = shotKey(rs.getString("shot_key"));
                    if (key != null && shots.containsKey(key)) {
                        Shot shot = shots.get(key);
                        if (shot.lockedRevision == rs.getInt("shot_revision"))
                            shot.revisedVoiceApproved = true;
                    }
                    return key;
                }).list();

        List<Map<String, Object>> orderedShots = shots.values().stream()
                .sorted(Comparator.comparingInt(s -> Integer.parseInt(s.key.substring(5))))
                .map(Shot::toMap).toList();
        long voiceLocked = shots.values().stream().filter(s -> s.lockedRevision > 0 ? s.revisedVoiceApproved : s.voiceTotal > 0 && s.voiceTotal == s.voiceApproved).count();
        long videoLocked = shots.values().stream().filter(s -> s.lockedRevision == 0 && s.videoLocked).count();

        List<Map<String, Object>> stageSummary = new ArrayList<>();
        for (Map<String, Object> stage : stages) {
            stageSummary.add(Map.of(
                    "stageKey", stage.get("stageKey"),
                    "displayName", stage.get("displayName"),
                    "status", stage.get("status"),
                    "revision", stage.get("revision")));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("episode", episode);
        response.put("legacyEpisode", ProductionOverviewService.EPISODE_ID.equals(episodeId));
        response.put("scriptRevision", scriptRevision);
        response.put("stages", stageSummary);
        response.put("shots", orderedShots);
        response.put("counts", Map.of("total", orderedShots.size(), "voiceLocked", voiceLocked, "videoLocked", videoLocked));
        response.put("voiceVideoWriteReady", ProductionOverviewService.EPISODE_ID.equals(episodeId));
        return response;
    }

    private static String string(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    static String effectiveVoiceStatus(int lockedRevision, boolean revisedVoiceApproved,
                                       int originalTotal, int originalApproved) {
        return lockedRevision > 0
                ? (revisedVoiceApproved ? "LOCKED" : "PENDING")
                : voiceStatus(originalTotal, originalApproved);
    }

    static String voiceStatus(int total, int approved) {
        return total > 0 && approved == total ? "LOCKED" : "PENDING";
    }

    static int editorialSecond(Object value) {
        if (!(value instanceof String text) || !text.matches("\\d{2}:\\d{2}")) return -1;
        int minutes = Integer.parseInt(text.substring(0, 2));
        int seconds = Integer.parseInt(text.substring(3));
        return seconds < 60 ? minutes * 60 + seconds : -1;
    }

    static String shotKey(Object candidate) {
        Matcher match = SHOT_KEY.matcher(string(candidate));
        if (!match.matches()) return null;
        int number = Integer.parseInt(match.group(1));
        return number > 0 ? String.format(Locale.ROOT, "SHOT %02d", number) : null;
    }
}
