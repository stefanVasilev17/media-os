package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ShotRevisionService {
    private static final Pattern SHOT = Pattern.compile("SHOT (0[1-9]|[1-9][0-9]{1,2})");
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final EpisodeWorkspaceService workspaces;
    private final EpisodeDirectorOverviewController director;

    public ShotRevisionService(JdbcClient jdbc, ObjectMapper mapper, EpisodeWorkspaceService workspaces,
                               EpisodeDirectorOverviewController director) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.workspaces = workspaces;
        this.director = director;
    }

    public record Revision(int revision, int scriptRevision, String status, String narration,
                           String voiceDirection, String visualDirection, String changeSummary,
                           String lockedAt) {}

    public record Context(int scriptRevision, String shotKey, String title, String originalNarration,
                          Revision draft, Revision approved) {}

    public Context context(UUID episodeId, String shotKey) {
        requireEpisodeAndShot(episodeId, shotKey);
        Map<String, Object> overview = director.overview(episodeId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> shots = (List<Map<String, Object>>) overview.get("shots");
        Map<String, Object> shot = shots.stream().filter(s -> shotKey.equals(s.get("shotKey"))).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This shot is not registered in this episode."));
        int scriptRevision = ((Number) overview.get("scriptRevision")).intValue();
        boolean locked = workspaces.stages(episodeId).stream().anyMatch(s ->
                "SCRIPT".equals(s.get("stageKey")) && "LOCKED".equals(s.get("status"))
                        && ((Number) s.get("revision")).intValue() == scriptRevision);
        if (!locked || scriptRevision < 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This episode needs an existing Director-LOCKED Script first.");

        Revision draft = current(episodeId, shotKey);
        if (draft != null && !"DRAFT".equals(draft.status())) draft = null;
        Revision approved = approved(episodeId, shotKey);
        if ((draft != null && draft.scriptRevision() != scriptRevision)
                || (approved != null && approved.scriptRevision() != scriptRevision))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The base Script revision changed. Revision Agent requires a new Director rebase.");
        return new Context(scriptRevision, shotKey, String.valueOf(shot.get("title")),
                String.valueOf(shot.getOrDefault("narration", "")), draft, approved);
    }

    public Map<String, Object> state(UUID episodeId, String shotKey) {
        Context c = context(episodeId, shotKey);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId.toString());
        result.put("shotKey", shotKey);
        result.put("title", c.title());
        result.put("baseScriptRevision", c.scriptRevision());
        result.put("originalNarration", c.originalNarration());
        result.put("draft", c.draft());
        result.put("approved", c.approved());
        result.put("effectiveNarration", c.approved() == null ? c.originalNarration() : c.approved().narration());
        result.put("effectiveVisualDirection", c.approved() == null ? "" : c.approved().visualDirection());
        result.put("voiceVideoRequiresNewApproval", c.approved() != null);
        result.put("messages", messages(episodeId, shotKey));
        result.put("autoAiGeneration", false);
        return result;
    }

    @Transactional
    public Map<String, Object> message(UUID episodeId, String shotKey, String content) {
        context(episodeId, shotKey);
        if (content == null || content.trim().isEmpty() || content.length() > 6000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A message must contain 1–6000 characters.");
        appendMessage(episodeId, shotKey, "USER", content.trim(), "MANUAL");
        return state(episodeId, shotKey);
    }

    @Transactional
    public void recordAiConversation(UUID episodeId, String shotKey, String request, String reply) {
        context(episodeId, shotKey);
        if (request == null || reply == null || reply.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incomplete AI conversation.");
        appendMessage(episodeId, shotKey, "USER", request.trim(), "OPENAI");
        appendMessage(episodeId, shotKey, "AGENT", reply.trim(), "OPENAI");
    }

    @Transactional
    public Map<String, Object> saveDraft(UUID episodeId, String shotKey, int expectedRevision,
                                         String narration, String voiceDirection, String visualDirection,
                                         String changeSummary, String source) {
        Context c = context(episodeId, shotKey);
        if (narration == null || narration.isBlank() || narration.length() > 16000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nonempty narration (max 16000 characters) is required.");
        if (voiceDirection != null && voiceDirection.length() > 1200)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voice direction is too long.");
        if (visualDirection != null && visualDirection.length() > 12000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visual direction is too long.");
        if (changeSummary != null && changeSummary.length() > 2000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Change summary is too long.");

        // Serialize all revisions for this episode. Old LOCK snapshots are retained.
        jdbc.sql("select id from episode where id=:id for update")
                .param("id", episodeId).query(UUID.class).single();
        Revision current = current(episodeId, shotKey);
        int actualRevision = current == null ? latestRevision(episodeId, shotKey) : current.revision();
        if (expectedRevision != actualRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shot draft changed. Refresh before saving.");

        jdbc.sql("""
                update episode_shot_revision set is_current=false
                where episode_id=:episode and shot_key=:shot and is_current
                """).param("episode", episodeId).param("shot", shotKey).update();

        int next = actualRevision + 1;
        jdbc.sql("""
                insert into episode_shot_revision(
                  id,episode_id,shot_key,revision,based_on_script_revision,is_current,status,
                  narration,voice_direction,visual_direction,change_summary
                ) values (:id,:episode,:shot,:revision,:scriptRevision,true,'DRAFT',
                          :narration,:voice,:visual,:summary)
                """)
                .param("id", UUID.randomUUID()).param("episode", episodeId).param("shot", shotKey)
                .param("revision", next).param("scriptRevision", c.scriptRevision())
                .param("narration", narration.trim()).param("voice", nonNull(voiceDirection))
                .param("visual", nonNull(visualDirection)).param("summary", nonNull(changeSummary)).update();

        if ("OPENAI".equals(source))
            appendMessage(episodeId, shotKey, "AGENT", nonNull(changeSummary), "OPENAI");
        return state(episodeId, shotKey);
    }

    @Transactional
    public Map<String, Object> lock(UUID episodeId, String shotKey, int expectedRevision, String note) {
        Context c = context(episodeId, shotKey);
        if (note == null || note.trim().length() < 10 || note.length() > 1500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Director LOCK requires a clear approval note.");
        int updated = jdbc.sql("""
                update episode_shot_revision
                set status='LOCKED',locked_at=now(),director_note=:note,updated_at=now()
                where episode_id=:episode and shot_key=:shot and revision=:revision
                  and based_on_script_revision=:scriptRevision and is_current and status='DRAFT'
                """)
                .param("episode", episodeId).param("shot", shotKey)
                .param("revision", expectedRevision).param("scriptRevision", c.scriptRevision())
                .param("note", note.trim()).update();
        if (updated != 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only the current unchanged DRAFT can be Director LOCKED.");
        appendMessage(episodeId, shotKey, "SYSTEM",
                "Director LOCK v" + expectedRevision
                        + ": New Voice and Video handoff is ready. Existing audio, renders and approvals are preserved; regenerate and approve against this revision.",
                "DIRECTOR_LOCK");
        return state(episodeId, shotKey);
    }

    public Revision approved(UUID episodeId, String shotKey) {
        return jdbc.sql("""
                select revision,based_on_script_revision,status,narration,voice_direction,
                       visual_direction,change_summary,locked_at::text
                from episode_shot_revision where episode_id=:episode and shot_key=:shot and status='LOCKED'
                order by revision desc limit 1
                """).param("episode", episodeId).param("shot", shotKey)
                .query((rs, n) -> row(rs)).optional().orElse(null);
    }

    private Revision current(UUID episodeId, String shotKey) {
        return jdbc.sql("""
                select revision,based_on_script_revision,status,narration,voice_direction,
                       visual_direction,change_summary,locked_at::text
                from episode_shot_revision where episode_id=:episode and shot_key=:shot and is_current
                """).param("episode", episodeId).param("shot", shotKey)
                .query((rs, n) -> row(rs)).optional().orElse(null);
    }

    private Revision row(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Revision(rs.getInt("revision"),rs.getInt("based_on_script_revision"),
                rs.getString("status"),rs.getString("narration"),rs.getString("voice_direction"),
                rs.getString("visual_direction"),rs.getString("change_summary"),rs.getString("locked_at"));
    }

    private int latestRevision(UUID episodeId, String shotKey) {
        return jdbc.sql("""
                select coalesce(max(revision),0) from episode_shot_revision
                where episode_id=:episode and shot_key=:shot
                """).param("episode", episodeId).param("shot", shotKey).query(Integer.class).single();
    }

    private List<Map<String, Object>> messages(UUID episodeId, String shotKey) {
        return jdbc.sql("""
                select sender,content,source,created_at::text
                from episode_shot_revision_message
                where episode_id=:episode and shot_key=:shot
                order by created_at desc,id desc limit 60
                """).param("episode", episodeId).param("shot", shotKey)
                .query((rs, n) -> Map.<String, Object>of(
                        "sender", rs.getString("sender"), "content", rs.getString("content"),
                        "source", rs.getString("source"), "createdAt", rs.getString("created_at")))
                .list().reversed();
    }

    private void appendMessage(UUID episodeId, String shotKey, String sender, String text, String source) {
        jdbc.sql("""
                insert into episode_shot_revision_message(id,episode_id,shot_key,sender,content,source)
                values(:id,:episode,:shot,:sender,:content,:source)
                """).param("id", UUID.randomUUID()).param("episode", episodeId).param("shot", shotKey)
                .param("sender", sender).param("content", text).param("source", source).update();
    }

    private void requireEpisodeAndShot(UUID episodeId, String shotKey) {
        workspaces.episode(episodeId);
        if (shotKey == null || !SHOT.matcher(shotKey).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a canonical shot key, for example SHOT 12.");
    }

    private String nonNull(String text) { return text == null ? "" : text.trim(); }
}
