package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/locked-script")
public class LockedScriptImportController {

    public static final String SCHEMA_VERSION = "mediaos.locked-script.v1";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ProductionOverviewService overview;
    private final ProductionMemoryService memory;

    public LockedScriptImportController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ProductionOverviewService overview,
            ProductionMemoryService memory
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.overview = overview;
        this.memory = memory;
    }

    public record TimelineBlock(
            @NotBlank String sectionId,
            @NotBlank String sectionTitle,
            @NotBlank String shotKey,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String narration,
            @NotBlank String voiceDirection
    ) {}

    public record LockedScriptImport(
            @NotBlank String schemaVersion,
            @NotBlank String episodeNumber,
            @NotBlank String title,
            @Positive int targetDurationSeconds,
            @NotBlank String source,
            @NotBlank String status,
            @NotBlank String voicePerformance,
            @NotEmpty List<@Valid TimelineBlock> timeline
    ) {}

    @PostMapping("/import")
    public Map<String, Object> importLocked(@Valid @RequestBody LockedScriptImport request) {
        if (!SCHEMA_VERSION.equals(request.schemaVersion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported locked-script schema. Expected " + SCHEMA_VERSION + ".");
        }
        if (!"FULLY_LOCKED".equalsIgnoreCase(request.status().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Manual Script import must explicitly declare status FULLY_LOCKED.");
        }

        Map<String, Object> episode = overview.episode();
        if (!String.valueOf(episode.get("episodeNumber")).equalsIgnoreCase(request.episodeNumber().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Import belongs to a different episode number.");
        }
        if (!normalize(String.valueOf(episode.get("title"))).equals(normalize(request.title()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Import title does not match the current episode.");
        }

        if (request.targetDurationSeconds() < 1140 || request.targetDurationSeconds() > 1260) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Locked Script duration must stay inside the 19–21 minute working window.");
        }
        if (request.timeline().size() < 24) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Locked Script import is incomplete; expected a detailed timecoded narration timeline.");
        }

        int expectedStart = 0;
        for (TimelineBlock block : request.timeline()) {
            if (block.startSecond() != expectedStart || block.endSecond() <= block.startSecond()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Locked Script timeline must be contiguous, ordered and gap-free from second 0.");
            }
            if (!block.shotKey().trim().toUpperCase(Locale.ROOT).matches("SHOT \\d{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        block.sectionId() + " has invalid shotKey; expected SHOT 01.");
            }
            expectedStart = block.endSecond();
        }
        if (expectedStart != request.targetDurationSeconds()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Final timeline timestamp must equal targetDurationSeconds.");
        }

        Map<String, Object> stage = jdbc.sql("""
                select id, status, current_revision
                from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("status", rs.getString("status"));
                    row.put("revision", rs.getInt("current_revision"));
                    return row;
                })
                .single();

        if ("LOCKED".equals(stage.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Script is already LOCKED. Manual replacement requires an explicit future unlock/revision flow.");
        }

        memory.preflight("SCRIPT", "IMPORT_LOCKED_SCRIPT");

        List<Map<String, Object>> canonicalTimeline = new ArrayList<>();
        for (TimelineBlock block : request.timeline()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sectionId", block.sectionId().trim());
            item.put("sectionTitle", block.sectionTitle().trim());
            item.put("shotKey", block.shotKey().trim().toUpperCase(Locale.ROOT));
            item.put("startSecond", block.startSecond());
            item.put("endSecond", block.endSecond());
            item.put("narration", block.narration().trim());
            item.put("voiceDirection", block.voiceDirection().trim());
            item.put("purpose", "Canonical director-approved narration block imported from the FULLY LOCKED EP001 script.");
            item.put("newValueEvent", false);
            item.put("newValueSummary", "");
            item.put("microTension", false);
            item.put("cognitiveRelief", false);
            item.put("listPassage", false);
            item.put("ahaMoment", false);
            item.put("reelCandidate", false);
            item.put("handoffNotes", "Preserve narration exactly. Downstream Voice and Visual Agents may change timing implementation, not wording.");
            canonicalTimeline.add(item);
        }

        Map<String, Object> artifact = new LinkedHashMap<>();
        artifact.put("overview", "FULLY LOCKED EP001 narration imported manually from the director-approved canonical script.");
        artifact.put("targetDurationSeconds", request.targetDurationSeconds());
        artifact.put("timeline", canonicalTimeline);
        artifact.put("voicePerformance", request.voicePerformance().trim());
        artifact.put("importSource", request.source().trim());
        artifact.put("handoffPrompt", "Consume this exact locked narration. Voice timing becomes authoritative after ElevenLabs alignment. Visual production must preserve the spoken meaning and use the production contract for what is seen.");

        int revision = ((Number) stage.get("revision")).intValue() + 1;
        String artifactJson = writeJson(artifact);
        UUID revisionId = UUID.randomUUID();

        jdbc.sql("""
                update production_stage
                set artifact=cast(:artifact as jsonb),
                    current_revision=:revision,
                    summary='FULLY LOCKED canonical EP001 narration imported manually.',
                    next_action='Continue to Voice Agent or import the HEAR / SEE production contract.',
                    readiness='{"ready":true,"remainingTasks":[]}'::jsonb,
                    status='LOCKED',
                    locked_at=now(),
                    updated_at=now()
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("artifact", artifactJson)
                .param("revision", revision)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        jdbc.sql("""
                insert into production_stage_revision(
                  id, production_stage_id, revision, artifact, summary, change_summary, created_by
                ) values (
                  :id,:stageId,:revision,cast(:artifact as jsonb),
                  'FULLY LOCKED canonical EP001 narration imported manually.',
                  'Manual LOCKED Script import from canonical source.',
                  'DIRECTOR_IMPORT'
                )
                """)
                .param("id", revisionId)
                .param("stageId", stage.get("id"))
                .param("revision", revision)
                .param("artifact", artifactJson)
                .update();

        Map<String, Object> handoff = new LinkedHashMap<>();
        handoff.put("sourceStage", "SCRIPT");
        handoff.put("sourceRevision", revision);
        handoff.put("summary", "FULLY LOCKED canonical narration imported manually.");
        handoff.put("artifact", artifact);

        jdbc.sql("""
                insert into agent_handoff(id, episode_id, source_stage_key, target_stage_key, source_revision, payload)
                values (:id,:episodeId,'SCRIPT','VOICE',:revision,cast(:payload as jsonb))
                on conflict (episode_id, source_stage_key, source_revision, target_stage_key) do nothing
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("payload", writeJson(handoff))
                .update();

        jdbc.sql("""
                update production_stage
                set status='ACTIVE',
                    summary='LOCKED Script revision ' || :revision || ' is ready for Voice production.',
                    next_action='Generate and approve small ElevenLabs voice clips from the LOCKED Script.',
                    updated_at=now()
                where episode_id=:episodeId and stage_key='VOICE'
                """)
                .param("revision", revision)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        jdbc.sql("update episode set current_stage='VOICE_PRODUCTION' where id=:episodeId")
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("locked", true);
        result.put("revision", revision);
        result.put("timelineBlocks", canonicalTimeline.size());
        result.put("nextRoute", "#/agents/script");
        result.put("message", "Canonical narration imported and LOCKED without an OpenAI call.");
        return result;
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize locked Script artifact.", ex);
        }
    }
}
