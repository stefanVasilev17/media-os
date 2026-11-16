package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders")
public class RemotionRenderController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID EP001_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT01_V2 = UUID.fromString("b6fd7f30-7c78-414b-a88c-387c0ee8c43a");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT02_V4 = UUID.fromString("78db6f85-ba05-4714-ba4f-fc70d64def88");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT03_V4 = UUID.fromString("fc26ca7b-60f2-4c35-b248-6b373736ce99");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT04_V1 = UUID.fromString("4079729b-c1b3-405c-9a83-1ace0ef25641");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT05_V1 = UUID.fromString("04b9f55a-7705-4f23-b9f7-a0103e8c955b");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT06_V1 = UUID.fromString("0007bd16-edbf-4ecc-927a-4a5781d0b921");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT07_V3 = UUID.fromString("09457c3c-32d9-432c-aa92-67f0e7b13f60");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT08_V2 = UUID.fromString("22059373-cc17-44fd-ad03-56d092cc57dc");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT08_V3 = UUID.fromString("d67eec72-66bb-427b-bdb9-0d4043ed5dd2");
    private static final UUID DIRECTOR_LOCKED_EP003_SHOT09_V2 = UUID.fromString("b3a3912f-79ee-4c72-b313-cbe09f950a5e");
    private static final String ENGINE_VERSION_PREFIX = "AT_REMOTION_";

    private static final Map<String, CompositionProfile> COMPOSITIONS = Map.ofEntries(
            Map.entry("EP002-DIRECTOR-MASTER",
                new CompositionProfile("EP002_DIRECTOR_MASTER", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT01-DRAFT",
                new CompositionProfile("EP002_SHOT01_DRAFT", null, 1920, 1080, 30, 1200, true)),
            Map.entry("EP002-SHOT02-CANDIDATE",
                new CompositionProfile("EP002_SHOT02_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT03-CANDIDATE",
                new CompositionProfile("EP002_SHOT03_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT04-CANDIDATE",
                new CompositionProfile("EP002_SHOT04_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT05-CANDIDATE",
                new CompositionProfile("EP002_SHOT05_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT06-CANDIDATE",
                new CompositionProfile("EP002_SHOT06_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT07-CANDIDATE",
                new CompositionProfile("EP002_SHOT07_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT08-CANDIDATE",
                new CompositionProfile("EP002_SHOT08_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT09-CANDIDATE",
                new CompositionProfile("EP002_SHOT09_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT10-CANDIDATE",
                new CompositionProfile("EP002_SHOT10_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP002-SHOT11-CANDIDATE",
                new CompositionProfile("EP002_SHOT11_CANDIDATE", null, 1920, 1080, 30, 6, true)),
            Map.entry("EP001-VerticalSlice",
                new CompositionProfile("EP001_VERTICAL_SLICE", EP001_ID, 1920, 1080, 30, 1920, false)),
            Map.entry("EP001-Shot01-VoiceSynced",
                new CompositionProfile("EP001_SHOT01_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 930, true)),
            Map.entry("EP001-Shot02-VoiceSynced",
                new CompositionProfile("EP001_SHOT02_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 2220, true)),
            Map.entry("EP001-Shot03-VoiceSynced",
                new CompositionProfile("EP001_SHOT03_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 1590, true)),
            Map.entry("EP001-Shot04-VoiceSynced",
                new CompositionProfile("EP001_SHOT04_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 2010, true)),
            Map.entry("EP001-Shot05-VoiceSynced",
                new CompositionProfile("EP001_SHOT05_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 3900, true)),
            Map.entry("EP001-LoadBalancer-Youtube",
                new CompositionProfile("EP001_LOAD_BALANCER_YOUTUBE", EP001_ID, 1920, 1080, 30, 5220, true)),
            Map.entry("EP001-Shot06-VoiceSynced",
                new CompositionProfile("EP001_SHOT06_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 5220, true)),
            Map.entry("EP001-Shot07-VoiceSynced",
                new CompositionProfile("EP001_SHOT07_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 6000, true)),
            Map.entry("EP001-Shot08-VisualDraft",
                new CompositionProfile("EP001_SHOT08_VISUAL_DRAFT", EP001_ID, 1920, 1080, 30, 2850, true)),
            Map.entry("EP001-Shot08-VisualDraft-V2",
                new CompositionProfile("EP001_SHOT08_VISUAL_DRAFT_V2", EP001_ID, 1920, 1080, 30, 2850, true)),
            Map.entry("EP001-Shot08-PremiumSlice-V3",
                new CompositionProfile("EP001_SHOT08_PREMIUM_SLICE_V3", EP001_ID, 1920, 1080, 30, 900, true)),
            Map.entry("EP001-Shot08-ContinuousDive-V4",
                new CompositionProfile("EP001_SHOT08_CONTINUOUS_DIVE_V4", EP001_ID, 1920, 1080, 30, 900, true)),
            Map.entry("EP001-Shot08-TableLookup-V5",
                new CompositionProfile("EP001_SHOT08_TABLE_LOOKUP_V5", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV6",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V6", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV7",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V7", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV8",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V8", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-DirectorVoiceV9",
                new CompositionProfile("EP001_SHOT08_DIRECTOR_VOICE_V9", EP001_ID, 1920, 1080, 30, 4690, true)),
            Map.entry("EP001-Shot08-DirectorVoiceV10",
                new CompositionProfile("EP001_SHOT08_DIRECTOR_VOICE_V10", EP001_ID, 1920, 1080, 30, 4690, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV1",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V1", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV2",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V2", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV4",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V4", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV5",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V5", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV6",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V6", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV1",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V1", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV2",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V2", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV3",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V3", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV4",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V4", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV5",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V5", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV6",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V6", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV7",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V7", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationPresentationV8",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_PRESENTATION_V8", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV1",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V1", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV2",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V2", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV3",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V3", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV4",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V4", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV5",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V5", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot12-CompleteLoginRecapV1",
                new CompositionProfile("EP001_SHOT12_COMPLETE_LOGIN_RECAP_V1", EP001_ID, 1920, 1080, 30, 3150, true)),
            Map.entry("EP001-Shot12-CompleteLoginRecapV2",
                new CompositionProfile("EP001_SHOT12_COMPLETE_LOGIN_RECAP_V2", EP001_ID, 1920, 1080, 30, 3150, true)),
            Map.entry("EP001-Shot12-CompleteLoginRecapV3",
                new CompositionProfile("EP001_SHOT12_COMPLETE_LOGIN_RECAP_V3", EP001_ID, 1920, 1080, 30, 2400, true)),
            Map.entry("EP001-Shot12-CompleteLoginRecapV4",
                new CompositionProfile("EP001_SHOT12_COMPLETE_LOGIN_RECAP_V4", EP001_ID, 1920, 1080, 30, 2400, true)),
            Map.entry("EP001-Shot12-CompleteLoginRecapV5",
                new CompositionProfile("EP001_SHOT12_COMPLETE_LOGIN_RECAP_V5", EP001_ID, 1920, 1080, 30, 2400, true)),
            Map.entry("EP001-Shot04-FinalPolish",
                new CompositionProfile("EP001_SHOT04_FINAL_POLISH", EP001_ID, 1920, 1080, 30, 2601, true)),
            Map.entry("EP001-Shot06-FinalPolish",
                new CompositionProfile("EP001_SHOT06_FINAL_POLISH", EP001_ID, 1920, 1080, 30, 5137, true)),
            Map.entry("EP001-Shot07-FinalPolish",
                new CompositionProfile("EP001_SHOT07_FINAL_POLISH", EP001_ID, 1920, 1080, 30, 4882, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV3",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V3", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Studio-DirectorPlan",
                new CompositionProfile("EP001_STUDIO_DIRECTOR_PLAN", EP001_ID, 1920, 1080, 30, 3900, true)),
            Map.entry("EP001-Studio-LivingMapDraft",
                new CompositionProfile("EP001_STUDIO_LIVING_MAP_DRAFT", EP001_ID, 1920, 1080, 30, 600, true)),
            Map.entry("EP001-Voice-CurrentPreview",
                new CompositionProfile("EP001_VOICE_CURRENT_PREVIEW", EP001_ID, 1920, 1080, 30, 1, true))
    );

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ProductionMemoryService productionMemory;
    private final StorageHealthService storage;
    private final String engineVersion;

    public RemotionRenderController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ProductionMemoryService productionMemory,
            StorageHealthService storage
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.productionMemory = productionMemory;
        this.storage = storage;
        this.engineVersion = resolveEngineVersion();
    }

    private String resolveEngineVersion() {
        String sha = System.getenv().getOrDefault("RAILWAY_GIT_COMMIT_SHA", "").trim();
        String shortSha = sha.isBlank() ? "LOCAL" : sha.substring(0, Math.min(12, sha.length()));
        String buildStamp = readBuildStamp().replaceAll("[^0-9]", "");
        return ENGINE_VERSION_PREFIX + shortSha + (buildStamp.isBlank() ? "" : "_" + buildStamp);
    }

    private String readBuildStamp() {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("media-os-build-time.txt")) {
            return input == null ? "" : new String(input.readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException ignored) {
            return "";
        }
    }

    public record RenderRequest(String profile, Map<String, Object> inputProps) {}

    @PostMapping("/compositions/{compositionId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> ensureRender(
            @PathVariable String compositionId,
            @RequestBody(required = false) RenderRequest request
    ) {
        if ("EP002-DIRECTOR-MASTER".equals(compositionId)
                || "EP002-SHOT01-DRAFT".equals(compositionId)
                || "EP002-SHOT02-CANDIDATE".equals(compositionId)
                || "EP002-SHOT03-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT04-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT05-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT06-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT07-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT08-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT09-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT10-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT11-CANDIDATE".equals(compositionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "EP002 render inputs must come from the verified selected-voice Director endpoint.");
        }
        return ensureVerifiedRender(compositionId,request);
    }

    public Map<String,Object> ensureVerifiedEp002Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT01-DRAFT",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot02Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT02-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot03Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT03-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot04Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT04-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot05Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT05-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot06Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT06-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }
    public Map<String,Object> ensureVerifiedEp002Shot07Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT07-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }

    public Map<String,Object> ensureVerifiedEp002Shot08Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT08-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }
    public Map<String,Object> ensureVerifiedEp002Shot09Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT09-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }
    public Map<String,Object> ensureVerifiedEp002Shot10Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT10-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }
    public Map<String,Object> ensureVerifiedEp002Shot11Preview(Map<String,Object> verifiedProps) {
        return ensureVerifiedRender("EP002-SHOT11-CANDIDATE",
                new RenderRequest("REVIEW",verifiedProps));
    }


    public Map<String,Object> ensureVerifiedEp002Master(Map<String,Object> exactApprovedProps) {
        return ensureVerifiedRender("EP002-DIRECTOR-MASTER",
                new RenderRequest("REVIEW",exactApprovedProps));
    }

    private Map<String,Object> ensureVerifiedRender(String compositionId,RenderRequest request) {
        CompositionProfile composition = requireComposition(compositionId);
        if (!"EP002-SHOT01-DRAFT".equals(compositionId)) {
            productionMemory.preflight(
                    "VISUAL",
                    "REMOTION_RENDER_" + compositionId.replaceAll("[^A-Za-z0-9]+", "_").toUpperCase(Locale.ROOT)
            );
        }
        String profileName = request == null || request.profile() == null || request.profile().isBlank()
                ? "FAST_PREVIEW"
                : request.profile().trim().toUpperCase();
        OutputProfile output = requireOutputProfile(profileName, composition);
        Map<String, Object> inputProps = request == null || request.inputProps() == null
                ? Map.of()
                : new LinkedHashMap<>(request.inputProps());
        int durationInFrames = resolveDurationInFrames(composition, inputProps);
        inputProps.put("durationInFrames", durationInFrames);
        Map<String,Object> semanticRenderProps=new LinkedHashMap<>(inputProps);
        if("EP002-SHOT02-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT03-CANDIDATE".equals(compositionId)
                 ||"EP002-SHOT04-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT05-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT06-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT07-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT08-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT09-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT10-CANDIDATE".equals(compositionId)
                ||"EP002-SHOT11-CANDIDATE".equals(compositionId))
            semanticRenderProps.remove("renderRequestId");
        String renderHash = renderHash(compositionId, profileName, output, semanticRenderProps);

        Optional<RenderRow> existing = findByHash(renderHash);
        if (existing.isPresent()) {
            RenderRow row = existing.get();
            if (!"FAILED".equals(row.status())) {
                return response(row);
            }
            storage.requireRenderHeadroom();
            jdbc.sql("""
                    update remotion_render
                    set status='QUEUED', progress=0, worker_id=null, error=null,
                        claimed_at=null, started_at=null, finished_at=null, updated_at=now()
                    where id=:id
                    """)
                    .param("id", row.id())
                    .update();
            return response(findById(row.id()).orElseThrow());
        }

        storage.requireRenderHeadroom();
        UUID renderId = UUID.randomUUID();
        String inputPropsJson = writeJson(inputProps);

        jdbc.sql("""
                insert into remotion_render(
                    id, project_id, episode_id, composition_id, render_key, engine_version,
                    input_props, render_hash, profile, status, width, height, fps,
                    duration_in_frames, progress, worker_id
                )
                values (
                    :id, :projectId, :episodeId, :compositionId, :renderKey, :engineVersion,
                    cast(:inputProps as jsonb), :renderHash, :profile, 'QUEUED', :width, :height, :fps,
                    :durationInFrames, 0, null
                )
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("episodeId", composition.episodeId())
                .param("compositionId", compositionId)
                .param("renderKey", composition.renderKey())
                .param("engineVersion", engineVersion)
                .param("inputProps", inputPropsJson)
                .param("renderHash", renderHash)
                .param("profile", profileName)
                .param("width", output.width())
                .param("height", output.height())
                .param("fps", composition.fps())
                .param("durationInFrames", durationInFrames)
                .update();
        return response(findById(renderId).orElseThrow());
    }

    @GetMapping("/ep003/shot01/latest-successful")
    public Map<String,Object> latestEp003Shot01DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT01-DIRECTOR-CANDIDATE'
                  and render_key in ('EP003_SHOT01_V1','EP003_SHOT01_V2')
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and video_data is not null
                  and coalesce(size_bytes,0)>0
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_EP003_SHOT01_DIRECTOR_MP4"));
    }

    @GetMapping("/ep003/shot02/latest-successful")
    public Map<String,Object> latestEp003Shot02DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and ((composition_id='EP003-SHOT02-DIRECTOR-CANDIDATE'
                        and render_key='EP003_SHOT02_V1')
                    or (composition_id='EP003-SHOT02-TERMS-V2-DIRECTOR-CANDIDATE'
                        and render_key='EP003_SHOT02_TERMS_V2')
                    or (composition_id='EP003-SHOT02-TERMS-V3-DIRECTOR-CANDIDATE'
                        and render_key='EP003_SHOT02_TERMS_V3')
                    or (id='78db6f85-ba05-4714-ba4f-fc70d64def88'::uuid
                        and composition_id='EP003-SHOT02-MOTION-V4-DIRECTOR-CANDIDATE'
                        and render_key='EP003_SHOT02_MOTION_V4'))
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and video_data is not null
                  and coalesce(size_bytes,0)>0
                order by case when id='78db6f85-ba05-4714-ba4f-fc70d64def88'::uuid then 0 else 1 end,
                         finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_EP003_SHOT02_DIRECTOR_MP4"));
    }

    @GetMapping("/ep003/shot08/v3/latest-successful")
    public Map<String,Object> latestEp003Shot08V3DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT08-SHARDING-V3-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT08_SHARDING_V3'
                  and engine_version='EP003_SHOT08_PIN_52c99cdf2b4b'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=5372
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT08_V3_MP4_YET"));
    }

    @GetMapping("/ep003/shot08/v4/latest-successful")
    public Map<String,Object> latestEp003Shot08V4DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT08-SHARDING-V4-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT08_SHARDING_V4'
                  and engine_version='EP003_SHOT08_PIN_143975e3d6c0'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=5372
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT08_V4_MP4_YET"));
    }

    @GetMapping("/ep003/shot09/v3/latest-successful")
    public Map<String,Object> latestEp003Shot09V3DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT09_FAILOVER_V3'
                  and engine_version='EP003_SHOT09_PIN_599d23563c9c'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3145
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT09_V3_MP4_YET"));
    }

    @GetMapping("/ep003/shot11/v1/latest-successful")
    public Map<String,Object> latestEp003Shot11V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT11_FINALE_V1'
                  and engine_version='EP003_SHOT11_PIN_140398af1c5b'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3104
                  and width=1920 and height=1080 and fps=30
                  and (input_props->>'directorLocked')='false'
                  and (input_props->>'voiceTakeId')='5c3435f6-ae66-4ec3-a6b0-bf1cc8207486'
                  and (input_props->>'previousRenderId')='174c8a8b-3202-4067-95ef-7dab1de11aa3'
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT11_V1_REAL_MP4_YET"));
    }

    @GetMapping("/ep003/shot10/v2/latest-successful")
    public Map<String,Object> latestEp003Shot10V2DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT10-MEASUREMENT-V2-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT10_MEASUREMENT_V2'
                  and engine_version='EP003_SHOT10_PIN_51403eaa9dde'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=4016
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT10_V2_MP4_YET"));
    }

    @GetMapping("/ep003/shot10/v1/latest-successful")
    public Map<String,Object> latestEp003Shot10V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT10-MEASUREMENT-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT10_MEASUREMENT_V1'
                  and engine_version='EP003_SHOT10_PIN_0fc02175a4ea'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=4016
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT10_V1_MP4_YET"));
    }

    @GetMapping("/ep003/shot09/v2/latest-successful")
    public Map<String,Object> latestEp003Shot09V2DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT09-FAILOVER-V2-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT09_FAILOVER_V2'
                  and engine_version='EP003_SHOT09_PIN_c1e9a9bd1860'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3145
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT09_V2_MP4_YET"));
    }

    @GetMapping("/ep003/shot09/v1/latest-successful")
    public Map<String,Object> latestEp003Shot09V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT09-FAILOVER-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT09_FAILOVER_V1'
                  and engine_version='EP003_SHOT09_PIN_40386a945e5d'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3145
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT09_V1_MP4_YET"));
    }

    @GetMapping("/ep003/shot08/v2/latest-successful")
    public Map<String,Object> latestEp003Shot08V2DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT08-SHARDING-V2-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT08_SHARDING_V2'
                  and engine_version='EP003_SHOT08_PIN_d64dd22fa8cd'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=5372
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                    "reason","NO_VERIFIED_EP003_SHOT08_V2_MP4_YET"));
    }

    @GetMapping("/ep003/shot08/v1/latest-successful")
    public Map<String,Object> latestEp003Shot08V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT08_SHARDING_V1'
                  and engine_version='EP003_SHOT08_PIN_8f0b2a80734a'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=5372
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT08_V1_MP4_YET"));
    }

    @GetMapping("/ep003/shot07/v3/latest-successful")
    public Map<String,Object> latestEp003Shot07V3DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT07-BOTTLENECK-V3-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT07_BOTTLENECK_V3'
                  and engine_version='EP003_SHOT07_PIN_316d8573072a'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3476
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_SHOT07_V3_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot07/v1/latest-successful")
    public Map<String,Object> latestEp003Shot07V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT07_BOTTLENECK_V1'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames between 1500 and 7200
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT07_V1_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot06/v1/latest-successful")
    public Map<String,Object> latestEp003Shot06V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT06_CORRECTNESS_V1'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames between 1500 and 7200
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT06_V1_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot05/v1/latest-successful")
    public Map<String,Object> latestEp003Shot05V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT05_STALE_READ_V1'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames between 1500 and 7200
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT05_V1_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot04/v1/latest-successful")
    public Map<String,Object> latestEp003Shot04V1DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT04_READ_WRITE_SPLITTING_V1'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames between 1500 and 7200
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT04_V1_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot03/v4/latest-successful")
    public Map<String,Object> latestEp003Shot03V4DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT03-WORDING-V4-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT03_WORDING_V4'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3080
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT03_V4_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot03/v3/latest-successful")
    public Map<String,Object> latestEp003Shot03V3DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT03-PRIMARY-CLARITY-V3-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT03_PRIMARY_CLARITY_V3'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3080
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT03_V3_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/shot03/v2/latest-successful")
    public Map<String,Object> latestEp003Shot03V2DirectorReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-SHOT03-DATABASE-REPLICAS-V2-DIRECTOR-CANDIDATE'
                  and render_key='EP003_SHOT03_DATABASE_REPLICAS_V2'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and duration_in_frames=3080
                  and width=1920 and height=1080 and fps=30
                  and video_data is not null
                  and coalesce(size_bytes,0)>1000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_RENDERED_EP003_SHOT03_V2_CANDIDATE_YET"));
    }

    @GetMapping("/ep003/cumulative/wip-corrected-ten/latest-successful")
    public Map<String,Object> latestEp003CorrectedTenShotWipFilm() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT'
                  and render_key='EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_10'
                  and engine_version='EP003_WIP_OWNER_B_V2'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and width=1920 and height=1080 and fps=30
                  and duration_in_frames=35489
                  and (input_props->>'wip')='true'
                  and (input_props->>'directorLocked')='false'
                  and (input_props->>'verified')='true'
                  and (input_props->>'shotCount')='10'
                  and (input_props->>'lockedPrefixShotCount')='7'
                  and (input_props->'sequence'->7->>'renderKey')='EP003_SHOT08_SHARDING_V4'
                  and (input_props->'sequence'->8->>'renderKey')='EP003_SHOT09_FAILOVER_V3'
                  and (input_props->'sequence'->9->>'renderKey')='EP003_SHOT10_MEASUREMENT_V2'
                  and jsonb_array_length(input_props->'qa')=9
                  and video_data is not null
                  and coalesce(size_bytes,0)>2000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_CORRECTED_TEN_SHOT_WIP_FILM_YET"));
    }

    @GetMapping("/ep003/cumulative/latest-successful")
    public Map<String,Object> latestEp003CumulativeFullVideo() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-CUMULATIVE-DIRECTOR-MASTER'
                  and render_key like 'EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_%'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and (input_props->>'directorLocked')='true'
                  and (input_props->>'verified')='true'
                  and video_data is not null
                  and coalesce(size_bytes,0)>0
                order by (input_props->>'shotCount')::integer desc,
                         finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_LOCKED_CONTIGUOUS_MASTER_YET"));
    }

    @GetMapping("/ep003/cumulative/wip-3shot-v4/latest-successful")
    public Map<String,Object> latestEp003ThreeShotV4WipVideo() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-CUMULATIVE-WIP-REVIEW'
                  and render_key='EP003_WIP_LOCKED_01_02_PLUS_SHOT03_WORDING_V4_03'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and width=1920 and height=1080 and fps=30
                  and duration_in_frames=9037
                  and (input_props->>'wip')='true'
                  and (input_props->>'directorLocked')='false'
                  and (input_props->>'verified')='true'
                  and (input_props->>'shotCount')='3'
                  and (input_props->>'lockedPrefixShotCount')='2'
                  and (input_props->'sequence'->2->>'shotKey')='SHOT03'
                  and (input_props->'sequence'->2->>'directorLocked')='false'
                  and (input_props->'sequence'->2->>'renderKey')='EP003_SHOT03_WORDING_V4'
                  and video_data is not null
                  and coalesce(size_bytes,0)>2000000
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_THREE_SHOT_WIP_FOR_SHOT03_V4_YET"));
    }

    @GetMapping("/ep003/cumulative/wip-latest")
    public Map<String,Object> latestEp003WipFullFilmReview() {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id='EP003-CUMULATIVE-WIP-REVIEW'
                  and render_key='EP003_WIP_SHOT01_LOCKED_PLUS_SHOT02_MOTION_V4_02'
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and (input_props->>'wip')='true'
                  and (input_props->>'directorLocked')='false'
                  and (input_props->>'verified')='true'
                  and (input_props->>'lockedPrefixShotCount')='1'
                  and video_data is not null
                  and coalesce(size_bytes,0)>0
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "reason","NO_VERIFIED_EP003_WIP_SHOT02_V4_FILM_YET"));
    }

    @GetMapping("/{renderId}")
    public Map<String, Object> render(@PathVariable UUID renderId) {
        return findById(renderId)
                .map(this::response)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion render was not found."));
    }

    @GetMapping("/compositions/{compositionId}/latest")
    public Map<String, Object> latest(
            @PathVariable String compositionId,
            @RequestParam(defaultValue = "FAST_PREVIEW") String profile
    ) {
        CompositionProfile composition = requireComposition(compositionId);
        String profileName = profile.trim().toUpperCase();
        requireOutputProfile(profileName, composition);
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId and composition_id=:compositionId and profile=:profile
                order by created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("compositionId", compositionId)
                .param("profile", profileName)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(() -> Map.of(
                        "status", "EMPTY",
                        "compositionId", compositionId,
                        "profile", profileName
                ));
    }

    @GetMapping("/compositions/{compositionId}/latest-successful")
    public Map<String,Object> latestSuccessfulReviewVideo(
            @PathVariable String compositionId,
            @RequestParam(defaultValue="REVIEW") String profile
    ) {
        if(!compositionId.matches("EP002-SHOT(06|07|08)-CANDIDATE"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only SHOT06–08 completed preview MP4 references belong in this review room.");
        CompositionProfile composition=requireComposition(compositionId);
        String profileName=profile.trim().toUpperCase(Locale.ROOT);
        requireOutputProfile(profileName,composition);
        if(!"REVIEW".equals(profileName))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Director continuity review uses actual Full HD REVIEW MP4s only.");
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId
                  and composition_id=:compositionId
                  and profile='REVIEW'
                  and status='SUCCEEDED'
                  and video_data is not null
                  and coalesce(size_bytes,0)>0
                order by finished_at desc,created_at desc,id desc
                limit 1
                """)
                .param("projectId",PROJECT_ID)
                .param("compositionId",compositionId)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(()->Map.of("status","EMPTY",
                        "compositionId",compositionId,
                        "reason","NO_REAL_COMPLETED_REVIEW_MP4"));
    }

    @GetMapping("/provider-status")
    public Map<String, Object> providerStatus() {
        return Map.of(
                "configured", true,
                "provider", "CPU_QUEUE",
                "engine", "REMOTION_CPU_V1",
                "engineVersion", engineVersion,
                "compositions", COMPOSITIONS.keySet(),
                "profiles", Arrays.asList("DRAFT", "FAST_PREVIEW", "REVIEW")
        );
    }

    @GetMapping("/{renderId}/video")
    public ResponseEntity<byte[]> video(
            @PathVariable UUID renderId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range
    ) {
        VideoArtifact artifact = jdbc.sql("""
                select video_data, coalesce(media_type, 'video/mp4') as media_type
                from remotion_render
                where id=:id and project_id=:projectId and status='SUCCEEDED'
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> new VideoArtifact(rs.getBytes("video_data"), rs.getString("media_type")))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered Remotion preview is not available."));

        byte[] bytes = artifact.bytes();
        if (bytes == null || bytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered Remotion preview is empty.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(artifact.mediaType()));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.setCacheControl("private, max-age=31536000, immutable");

        if (range == null || !range.startsWith("bytes=")) {
            headers.setContentLength(bytes.length);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        }

        long[] parsed = parseRange(range, bytes.length);
        int start = (int) parsed[0];
        int end = (int) parsed[1];
        byte[] slice = Arrays.copyOfRange(bytes, start, end + 1);
        headers.setContentLength(slice.length);
        headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + bytes.length);
        return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
    }

    private CompositionProfile requireComposition(String compositionId) {
        CompositionProfile composition = COMPOSITIONS.get(compositionId);
        if (composition == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion composition is not registered for production rendering.");
        }
        return composition;
    }

    private OutputProfile requireOutputProfile(String profile, CompositionProfile composition) {
        return switch (profile) {
            case "DRAFT" -> new OutputProfile(960, 540);
            case "FAST_PREVIEW" -> new OutputProfile(1280, 720);
            case "REVIEW" -> new OutputProfile(composition.width(), composition.height());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Remotion Engine v0.1 supports DRAFT, FAST_PREVIEW and REVIEW profiles only."
            );
        };
    }

    private int resolveDurationInFrames(CompositionProfile composition, Map<String, Object> inputProps) {
        if (!composition.dynamicDuration()) return composition.durationInFrames();
        Object raw = inputProps.get("durationInFrames");
        int value;
        if (raw instanceof Number number) {
            value = number.intValue();
        } else {
            try {
                value = Integer.parseInt(String.valueOf(raw));
            } catch (Exception ignored) {
                value = composition.durationInFrames();
            }
        }
        if (value <= 0 || value > 60 * 60 * composition.fps()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dynamic Remotion duration is invalid.");
        }
        return value;
    }

    private String renderHash(
            String compositionId,
            String profile,
            OutputProfile output,
            Map<String, Object> inputProps
    ) {
        try {
            String material = engineVersion + "\n"
                    + compositionId + "\n"
                    + profile + "\n"
                    + output.width() + "x" + output.height() + "\n"
                    + objectMapper.writeValueAsString(new TreeMap<>(inputProps));
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash the Remotion render input.", ex);
        }
    }

    private Optional<RenderRow> findByHash(String renderHash) {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId and render_hash=:renderHash
                """)
                .param("projectId", PROJECT_ID)
                .param("renderHash", renderHash)
                .query(this::mapRenderRow)
                .optional();
    }

    private Optional<RenderRow> findById(UUID renderId) {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query(this::mapRenderRow)
                .optional();
    }

    private RenderRow mapRenderRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new RenderRow(
                rs.getObject("id", UUID.class),
                rs.getString("composition_id"),
                rs.getString("render_key"),
                rs.getString("engine_version"),
                rs.getString("profile"),
                rs.getString("status"),
                rs.getInt("width"),
                rs.getInt("height"),
                rs.getInt("fps"),
                rs.getInt("duration_in_frames"),
                rs.getInt("progress"),
                (Long) rs.getObject("size_bytes"),
                rs.getString("error"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("finished_at", OffsetDateTime.class)
        );
    }

    private Map<String, Object> response(RenderRow row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("renderId", row.id());
        result.put("directorLocked",
                row.id().equals(DIRECTOR_LOCKED_EP003_SHOT01_V2)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT02_V4)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT03_V4)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT04_V1)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT05_V1)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT06_V1)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT07_V3)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT08_V2)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT08_V3)
                || row.id().equals(DIRECTOR_LOCKED_EP003_SHOT09_V2));
        result.put("compositionId", row.compositionId());
        result.put("renderKey", row.renderKey());
        result.put("engineVersion", row.engineVersion());
        result.put("profile", row.profile());
        result.put("status", publicStatus(row.status()));
        result.put("width", row.width());
        result.put("height", row.height());
        result.put("fps", row.fps());
        result.put("durationInFrames", row.durationInFrames());
        result.put("durationMs", Math.round(row.durationInFrames() * 1000d / row.fps()));
        result.put("progress", row.progress());
        result.put("sizeBytes", row.sizeBytes());
        result.put("error", row.error());
        result.put("createdAt", row.createdAt());
        result.put("finishedAt", row.finishedAt());
        if ("SUCCEEDED".equals(row.status())) {
            result.put("videoUrl", "/api/v1/remotion/renders/" + row.id() + "/video");
        }
        return result;
    }

    private String publicStatus(String status) {
        return switch (status) {
            case "SUCCEEDED" -> "READY";
            case "RUNNING" -> "RENDERING";
            default -> status;
        };
    }

    private long[] parseRange(String range, int length) {
        try {
            String value = range.substring("bytes=".length()).split(",", 2)[0].trim();
            String[] parts = value.split("-", 2);
            long start = parts[0].isBlank() ? 0 : Long.parseLong(parts[0]);
            long end = parts.length < 2 || parts[1].isBlank() ? length - 1L : Long.parseLong(parts[1]);
            start = Math.max(0, Math.min(start, length - 1L));
            end = Math.max(start, Math.min(end, length - 1L));
            return new long[]{start, end};
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Invalid video range.");
        }
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize Remotion render input props.", ex);
        }
    }

    private record CompositionProfile(
            String renderKey,
            UUID episodeId,
            int width,
            int height,
            int fps,
            int durationInFrames,
            boolean dynamicDuration
    ) {}

    private record OutputProfile(int width, int height) {}
    private record VideoArtifact(byte[] bytes, String mediaType) {}

    private record RenderRow(
            UUID id,
            String compositionId,
            String renderKey,
            String engineVersion,
            String profile,
            String status,
            int width,
            int height,
            int fps,
            int durationInFrames,
            int progress,
            Long sizeBytes,
            String error,
            OffsetDateTime createdAt,
            OffsetDateTime finishedAt
    ) {}
}
