package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/jobs")
public class SplineJobController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public SplineJobController(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public record CreateSplineJobRequest(
            @NotBlank String name,
            @NotBlank String taskType,
            @NotBlank String target,
            @NotBlank String instructions,
            @NotEmpty List<String> permissions,
            @NotEmpty List<String> protectedObjects,
            Map<String, Object> payload
    ) {}

    public record DecisionRequest(
            @NotBlank String decision,
            String comment
    ) {}

    public record ObjectEditRequest(
            @NotBlank String objectName,
            List<Double> position,
            List<Double> size,
            String color
    ) {}

    public record ChatCommandRequest(
            @NotBlank String message
    ) {}

    private record DecisionContext(
            UUID taskId,
            UUID orchestrationJobId,
            UUID approvalId,
            String productionStatus
    ) {}

    @GetMapping("/latest")
    public Map<String, Object> latest() {
        return jdbc.sql("""
                select id, task_type, target, status, worker_id, error,
                       created_at, claimed_at, started_at, finished_at,
                       coalesce(result, '{}'::jsonb)::text as result
                from production_job
                where agent_key = 'SPLINE_AGENT'
                  and task_type not in ('SYNC_SCENE_CATALOG_V1', 'SYNC_SCENE_SECTION_V1', 'CAPTURE_SPLINE_SNAPSHOT')
                order by created_at desc
                limit 1
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("taskType", rs.getString("task_type"));
                    item.put("target", rs.getString("target"));
                    item.put("status", rs.getString("status"));
                    item.put("workerId", rs.getString("worker_id"));
                    item.put("error", rs.getString("error"));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    item.put("claimedAt", rs.getObject("claimed_at", OffsetDateTime.class));
                    item.put("startedAt", rs.getObject("started_at", OffsetDateTime.class));
                    item.put("finishedAt", rs.getObject("finished_at", OffsetDateTime.class));
                    item.put("result", readJson(rs.getString("result")));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "NONE"));
    }

    @GetMapping("/pending-approvals")
    public List<Map<String, Object>> pendingApprovals() {
        return jdbc.sql("""
                select p.id as production_job_id,
                       p.task_type,
                       p.target,
                       p.instructions,
                       p.permissions::text as permissions,
                       p.protected_objects::text as protected_objects,
                       p.payload::text as payload,
                       p.created_at,
                       t.name as task_name,
                       a.id as approval_id
                from production_job p
                join task t on t.id = p.task_id
                join approval a on a.task_id = t.id
                where p.agent_key = 'SPLINE_AGENT'
                  and p.status = 'WAITING_APPROVAL'
                  and a.status = 'PENDING'
                order by p.created_at asc
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productionJobId", rs.getObject("production_job_id", UUID.class));
                    item.put("approvalId", rs.getObject("approval_id", UUID.class));
                    item.put("name", rs.getString("task_name"));
                    item.put("taskType", rs.getString("task_type"));
                    item.put("target", rs.getString("target"));
                    item.put("instructions", rs.getString("instructions"));
                    item.put("permissions", readJson(rs.getString("permissions")));
                    item.put("protectedObjects", readJson(rs.getString("protected_objects")));
                    item.put("payload", readJson(rs.getString("payload")));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return item;
                })
                .list();
    }

    @GetMapping("/chat")
    public List<Map<String, Object>> chatHistory() {
        List<Map<String, Object>> items = jdbc.sql("""
                select m.id, m.role, m.content, m.created_at,
                       p.id as production_job_id,
                       p.status as production_status,
                       p.error as production_error
                from spline_agent_message m
                left join production_job p on p.id = m.production_job_id
                where m.project_id = :projectId
                order by m.created_at desc
                limit 50
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("role", rs.getString("role"));
                    item.put("content", rs.getString("content"));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    item.put("productionJobId", rs.getObject("production_job_id", UUID.class));
                    item.put("status", rs.getString("production_status"));
                    item.put("error", rs.getString("production_error"));
                    return item;
                })
                .list();

        java.util.Collections.reverse(items);
        return items;
    }

    @PostMapping("/chat-command")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createChatCommand(@Valid @RequestBody ChatCommandRequest request) {
        String message = request.message().trim();
        if (message.length() > 4000) {
            throw new InvalidObjectEditException("Spline command is too long.");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("executionProfile", "CREATOR_CHAT_V2");
        payload.put("creatorMessage", message);
        payload.put("safeSandboxRequired", true);
        payload.put("sandboxPrefix", "MEDIA_OS_");
        payload.put("productionReferencesReadOnly", true);

        Map<String, Object> result = create(new CreateSplineJobRequest(
                "Spline creator command",
                "CREATOR_SPLINE_COMMAND_V2",
                "FOCUSED_SPLINE_3D_TAB",
                "Execute exactly this creator command in the focused Spline scene: " + message +
                        " Follow the CREATOR_CHAT_V2 safety contract. Treat visual/reference/source objects as read-only. " +
                        "Any newly created root sandbox object must use the MEDIA_OS_ prefix. " +
                        "Do not change unrelated objects. Verify the requested result before reporting success.",
                List.of(
                        "READ_CREATOR_NAMED_OBJECTS",
                        "EDIT_EXPLICIT_CREATOR_TARGETS",
                        "CREATE_MEDIA_OS_SANDBOX_OBJECTS",
                        "EDIT_NEW_MEDIA_OS_SANDBOX_SUBTREE"
                ),
                List.of("ALL_OBJECTS_OUTSIDE_EXPLICIT_CREATOR_TARGETS", "ALL_REFERENCE_OBJECTS"),
                payload
        ));

        UUID productionJobId = (UUID) result.get("productionJobId");

        jdbc.sql("""
                insert into spline_agent_message(id, project_id, production_job_id, role, content)
                values (:id, :projectId, :productionJobId, 'USER', :content)
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("productionJobId", productionJobId)
                .param("content", message)
                .update();

        return result;
    }

    @PostMapping("/object-edit")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createObjectEdit(@Valid @RequestBody ObjectEditRequest request) {
        String objectName = request.objectName().trim();

        if (!objectName.matches("MEDIA_OS_[A-Z0-9_]{1,80}")) {
            throw new InvalidObjectEditException("Spline Agent v2 sandbox edits are limited to MEDIA_OS_* objects.");
        }

        validateVector("position", request.position(), false);
        validateVector("size", request.size(), true);

        String color = request.color() == null ? null : request.color().trim();
        if (color != null && color.isBlank()) {
            color = null;
        }
        if (color != null && !color.matches("#[0-9A-Fa-f]{6}|[A-Za-z][A-Za-z0-9_-]{0,31}")) {
            throw new InvalidObjectEditException("Color must be a named color or a six-digit hex value.");
        }

        if (request.position() == null && request.size() == null && color == null) {
            throw new InvalidObjectEditException("At least one object property must be changed.");
        }

        List<String> permissions = new java.util.ArrayList<>();
        permissions.add("READ_TARGET_OBJECT");
        if (request.position() != null || request.size() != null) {
            permissions.add("EDIT_TARGET_TRANSFORM");
        }
        if (color != null) {
            permissions.add("EDIT_TARGET_MATERIAL");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("executionProfile", "TARGETED_OBJECT_V2");
        payload.put("objectName", objectName);
        payload.put("expectedPosition", request.position());
        payload.put("expectedSize", request.size());
        payload.put("expectedColor", color);
        payload.put("safeSandboxRequired", true);

        StringBuilder instructions = new StringBuilder();
        instructions.append("Find the existing object named ").append(objectName)
                .append(". Do not create a replacement if it is missing. Edit only this object.");
        if (request.position() != null) {
            instructions.append(" Set position to ").append(formatVector(request.position())).append(".");
        }
        if (request.size() != null) {
            instructions.append(" Set size to ").append(formatVector(request.size())).append(".");
        }
        if (color != null) {
            instructions.append(" Set its visible material color to ").append(color).append(".");
        }
        instructions.append(" Do not modify any other object. Verify only the requested final properties through Spline MCP before reporting success.");

        return create(new CreateSplineJobRequest(
                "Spline object edit · " + objectName,
                "EDIT_OBJECT_PROPERTIES_V2",
                "FOCUSED_SPLINE_3D_TAB",
                instructions.toString(),
                permissions,
                List.of("ALL_OBJECTS_EXCEPT_" + objectName),
                payload
        ));
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody CreateSplineJobRequest request) {
        UUID orchestrationJobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();
        UUID approvalId = UUID.randomUUID();

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id, :projectId, :name, 'SPLINE_EXECUTION', 'WAITING_APPROVAL', 10)
                """)
                .param("id", orchestrationJobId)
                .param("projectId", PROJECT_ID)
                .param("name", request.name())
                .update();

        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id, :jobId, :name, :taskType, 'WAITING_APPROVAL', 1)
                """)
                .param("id", taskId)
                .param("jobId", orchestrationJobId)
                .param("name", request.name())
                .param("taskType", request.taskType())
                .update();

        jdbc.sql("""
                insert into production_job(
                    id, project_id, task_id, agent_key, task_type, target, instructions,
                    permissions, protected_objects, payload, status
                )
                values (
                    :id, :projectId, :taskId, 'SPLINE_AGENT', :taskType, :target, :instructions,
                    cast(:permissions as jsonb), cast(:protectedObjects as jsonb), cast(:payload as jsonb),
                    'WAITING_APPROVAL'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .param("taskType", request.taskType())
                .param("target", request.target())
                .param("instructions", request.instructions())
                .param("permissions", writeJson(request.permissions()))
                .param("protectedObjects", writeJson(request.protectedObjects()))
                .param("payload", writeJson(request.payload() == null ? Map.of() : request.payload()))
                .update();

        jdbc.sql("""
                insert into approval(id, task_id, status, comment)
                values (:id, :taskId, 'PENDING', null)
                """)
                .param("id", approvalId)
                .param("taskId", taskId)
                .update();

        writeEvent(
                orchestrationJobId,
                taskId,
                "SPLINE_JOB_AWAITING_APPROVAL",
                "Spline Agent execution is waiting for creator approval.",
                Map.of("productionJobId", productionJobId, "approvalId", approvalId)
        );

        return Map.of(
                "productionJobId", productionJobId,
                "approvalId", approvalId,
                "jobId", orchestrationJobId,
                "taskId", taskId,
                "status", "WAITING_APPROVAL"
        );
    }

    @PostMapping("/{productionJobId}/decision")
    @Transactional
    public Map<String, Object> decide(
            @PathVariable UUID productionJobId,
            @Valid @RequestBody DecisionRequest request
    ) {
        String decision = request.decision().trim().toUpperCase();
        if (!decision.equals("APPROVE") && !decision.equals("REQUEST_CHANGES")) {
            throw new InvalidDecisionException();
        }

        DecisionContext context = jdbc.sql("""
                select p.status as production_status,
                       t.id as task_id,
                       j.id as job_id,
                       a.id as approval_id
                from production_job p
                join task t on t.id = p.task_id
                join job j on j.id = t.job_id
                join approval a on a.task_id = t.id
                where p.id = :productionJobId
                order by a.created_at desc
                limit 1
                """)
                .param("productionJobId", productionJobId)
                .query((rs, rowNum) -> new DecisionContext(
                        rs.getObject("task_id", UUID.class),
                        rs.getObject("job_id", UUID.class),
                        rs.getObject("approval_id", UUID.class),
                        rs.getString("production_status")
                ))
                .optional()
                .orElseThrow(JobNotFoundException::new);

        if (!"WAITING_APPROVAL".equals(context.productionStatus())) {
            throw new JobStateException("Spline job is not waiting for approval.");
        }

        if (decision.equals("APPROVE")) {
            jdbc.sql("""
                    update approval
                    set status='APPROVED', comment=:comment, decided_at=now()
                    where id=:approvalId and status='PENDING'
                    """)
                    .param("comment", request.comment())
                    .param("approvalId", context.approvalId())
                    .update();

            jdbc.sql("""
                    update production_job
                    set status='QUEUED', updated_at=now()
                    where id=:productionJobId and status='WAITING_APPROVAL'
                    """)
                    .param("productionJobId", productionJobId)
                    .update();

            jdbc.sql("update task set status='PENDING', updated_at=now() where id=:taskId")
                    .param("taskId", context.taskId())
                    .update();

            jdbc.sql("update job set status='QUEUED', progress=20, updated_at=now() where id=:jobId")
                    .param("jobId", context.orchestrationJobId())
                    .update();

            writeEvent(
                    context.orchestrationJobId(),
                    context.taskId(),
                    "SPLINE_JOB_APPROVED",
                    "Creator approved the Spline Agent execution. The job is now queued.",
                    Map.of("productionJobId", productionJobId)
            );

            return Map.of("productionJobId", productionJobId, "status", "QUEUED");
        }

        jdbc.sql("""
                update approval
                set status='CHANGES_REQUESTED', comment=:comment, decided_at=now()
                where id=:approvalId and status='PENDING'
                """)
                .param("comment", request.comment())
                .param("approvalId", context.approvalId())
                .update();

        jdbc.sql("""
                update production_job
                set status='CHANGES_REQUESTED', updated_at=now()
                where id=:productionJobId and status='WAITING_APPROVAL'
                """)
                .param("productionJobId", productionJobId)
                .update();

        jdbc.sql("update task set status='CHANGES_REQUESTED', updated_at=now() where id=:taskId")
                .param("taskId", context.taskId())
                .update();

        jdbc.sql("update job set status='NEEDS_REVIEW', progress=10, updated_at=now() where id=:jobId")
                .param("jobId", context.orchestrationJobId())
                .update();

        writeEvent(
                context.orchestrationJobId(),
                context.taskId(),
                "SPLINE_JOB_CHANGES_REQUESTED",
                "Creator requested changes before Spline Agent execution.",
                Map.of("productionJobId", productionJobId)
        );

        return Map.of("productionJobId", productionJobId, "status", "CHANGES_REQUESTED");
    }

    private void validateVector(String field, List<Double> values, boolean positiveOnly) {
        if (values == null) {
            return;
        }
        if (values.size() != 3) {
            throw new InvalidObjectEditException(field + " must contain exactly three values.");
        }
        for (Double value : values) {
            if (value == null || !Double.isFinite(value)) {
                throw new InvalidObjectEditException(field + " values must be finite numbers.");
            }
            if (positiveOnly && value <= 0) {
                throw new InvalidObjectEditException(field + " values must be greater than zero.");
            }
            if (Math.abs(value) > 100000) {
                throw new InvalidObjectEditException(field + " value is outside the safe sandbox range.");
            }
        }
    }

    private String formatVector(List<Double> values) {
        return "(" + values.get(0) + ", " + values.get(1) + ", " + values.get(2) + ")";
    }

    private void writeEvent(
            UUID orchestrationJobId,
            UUID taskId,
            String type,
            String message,
            Map<String, Object> payload
    ) {
        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message, payload)
                values (:id, :projectId, :jobId, :taskId, :type, :message, cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("jobId", orchestrationJobId)
                .param("taskId", taskId)
                .param("type", type)
                .param("message", message)
                .param("payload", writeJson(payload))
                .update();
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid stored Spline job JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline job JSON.", e);
        }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    private static class InvalidDecisionException extends RuntimeException {}

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    private static class InvalidObjectEditException extends RuntimeException {
        InvalidObjectEditException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    private static class JobNotFoundException extends RuntimeException {}

    @ResponseStatus(HttpStatus.CONFLICT)
    private static class JobStateException extends RuntimeException {
        JobStateException(String message) {
            super(message);
        }
    }
}
