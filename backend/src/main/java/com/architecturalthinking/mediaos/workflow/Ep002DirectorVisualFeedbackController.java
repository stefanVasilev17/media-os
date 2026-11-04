package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/SHOT01/director-feedback")
public class Ep002DirectorVisualFeedbackController {
    private static final Set<String> ALLOWED_AREAS =
            Set.of("LAYOUT", "CAMERA", "MOTION", "COLOR", "TEXT", "TIMING", "OTHER");

    private final JdbcClient jdbc;
    private final Ep002RemotionSceneContractService scenes;

    public Ep002DirectorVisualFeedbackController(
            JdbcClient jdbc, Ep002RemotionSceneContractService scenes) {
        this.jdbc = jdbc;
        this.scenes = scenes;
    }

    public record FeedbackRequest(
            UUID requestId,
            UUID sourceRenderId,
            String expectedContractId,
            String changeArea,
            String feedback,
            Boolean acknowledgeVisualLock
    ) {}

    public record FeedbackEntry(
            UUID id,
            UUID sourceRenderId,
            String changeArea,
            String feedback,
            String status,
            String sceneContractId,
            String preferredTakeId,
            int scriptRevision,
            String createdAt
    ) {}

    static String validatedText(String input) {
        if (input == null || input.trim().length() < 12 || input.trim().length() > 3000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Director feedback must contain 12 to 3000 characters.");
        return input.trim();
    }

    static String validatedArea(String input) {
        String area = input == null ? "" : input.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_AREAS.contains(area))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown visual change area.");
        return area;
    }

    static void requireLockedVisualAcknowledgment(Boolean acknowledged) {
        if (!Boolean.TRUE.equals(acknowledged))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT01 is Director-LOCKED. Explicitly acknowledge that this only saves feedback; it does not modify the approved scene.");
    }

    @GetMapping
    public List<FeedbackEntry> list() {
        DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select id,source_render_id,change_area,feedback_text,status,
                       scene_contract_id,preferred_take_id,script_revision,created_at::text
                  from ep002_director_visual_feedback
                 where episode_key='EP002' and shot_key='SHOT01'
                 order by created_at desc,id desc
                 limit 30
                """).query((rs,n) -> mapEntry(rs)).list();
    }

    @PostMapping
    @Transactional
    public FeedbackEntry submit(@RequestBody FeedbackRequest request) {
        DirectorIdentity.Actor director = DirectorIdentity.requireDirector();
        if (request == null || request.requestId() == null || request.sourceRenderId() == null
                || request.expectedContractId() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Request ID, rendered preview ID and current scene contract are required.");

        requireLockedVisualAcknowledgment(request.acknowledgeVisualLock());
        String feedback = validatedText(request.feedback());
        String area = validatedArea(request.changeArea());

        FeedbackEntry previous = find(request.requestId());
        if (previous != null) {
            if (sameRequest(previous,request,feedback,area)
                    && ownedBy(request.requestId(),director))
                return previous;
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This feedback request ID has already been used for a different request.");
        }

        Ep002RemotionSceneContractService.SceneContract scene = scenes.contract("SHOT01");
        if (!scene.contractId().equals(request.expectedContractId())
                || scene.inputs().preferredTakeId() == null
                || scene.inputs().productionDependencySha256() == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The selected voice or scene contract changed. Refresh the SHOT01 blueprint.");

        UUID takeId = UUID.fromString(scene.inputs().preferredTakeId());
        boolean verifiedRender = jdbc.sql("""
                select exists (
                    select 1
                      from episode_shot_render_lineage l
                      join remotion_render r on r.id=l.remotion_render_id
                     where l.episode_key='EP002' and l.shot_key='SHOT01'
                       and l.remotion_render_id=:renderId
                       and l.preferred_take_id=:takeId
                       and l.script_revision=:scriptRevision
                       and l.dependency_sha256=:dependency
                       and r.status='SUCCEEDED'
                       and r.input_props->>'contractId'=:contractId
                       and r.input_props->>'voiceTakeId'=:takeText
                )
                """)
                .param("renderId",request.sourceRenderId())
                .param("takeId",takeId)
                .param("takeText",takeId.toString())
                .param("scriptRevision",scene.inputs().scriptRevision())
                .param("dependency",scene.inputs().productionDependencySha256())
                .param("contractId",scene.contractId())
                .query(Boolean.class).single();
        if (!verifiedRender)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Feedback requires a verified successful EP002 SHOT01 preview for the currently selected voice.");

        jdbc.sql("""
                insert into ep002_director_visual_feedback (
                    id,episode_key,shot_key,source_render_id,scene_contract_id,
                    preferred_take_id,script_revision,dependency_sha256,
                    change_area,feedback_text,status,actor_issuer,actor_subject
                ) values (
                    :id,'EP002','SHOT01',:renderId,:contractId,
                    :takeId,:scriptRevision,:dependency,:area,:feedback,
                    'PENDING_AGENT_REVIEW',:issuer,:subject
                ) on conflict (id) do nothing
                """)
                .param("id",request.requestId())
                .param("renderId",request.sourceRenderId())
                .param("contractId",scene.contractId())
                .param("takeId",takeId)
                .param("scriptRevision",scene.inputs().scriptRevision())
                .param("dependency",scene.inputs().productionDependencySha256())
                .param("area",area)
                .param("feedback",feedback)
                .param("issuer",director.issuer())
                .param("subject",director.subject())
                .update();

        FeedbackEntry saved = find(request.requestId());
        if (saved == null || !sameRequest(saved,request,feedback,area)
                || !ownedBy(request.requestId(),director))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Feedback request ID collision. Nothing was executed.");
        return saved;
    }

    private boolean ownedBy(UUID id, DirectorIdentity.Actor actor) {
        return jdbc.sql("""
                select exists (
                    select 1 from ep002_director_visual_feedback
                    where id=:id and actor_issuer=:issuer and actor_subject=:subject
                )
                """)
                .param("id",id)
                .param("issuer",actor.issuer())
                .param("subject",actor.subject())
                .query(Boolean.class).single();
    }

    private static boolean sameRequest(FeedbackEntry entry,FeedbackRequest request,
                                       String feedback,String area) {
        return entry.sourceRenderId().equals(request.sourceRenderId())
                && entry.sceneContractId().equals(request.expectedContractId())
                && entry.feedback().equals(feedback)
                && entry.changeArea().equals(area);
    }

    private FeedbackEntry find(UUID id) {
        return jdbc.sql("""
                select id,source_render_id,change_area,feedback_text,status,
                       scene_contract_id,preferred_take_id,script_revision,created_at::text
                  from ep002_director_visual_feedback
                 where id=:id
                """).param("id",id).query((rs,n)->mapEntry(rs)).optional().orElse(null);
    }

    private static FeedbackEntry mapEntry(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new FeedbackEntry(
                rs.getObject("id",UUID.class),
                rs.getObject("source_render_id",UUID.class),
                rs.getString("change_area"),
                rs.getString("feedback_text"),
                rs.getString("status"),
                rs.getString("scene_contract_id"),
                rs.getObject("preferred_take_id",UUID.class).toString(),
                rs.getInt("script_revision"),
                rs.getString("created_at")
        );
    }
}
