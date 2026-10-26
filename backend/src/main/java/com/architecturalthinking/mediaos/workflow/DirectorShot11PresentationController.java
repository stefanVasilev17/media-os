package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-shot11")
public class DirectorShot11PresentationController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final UUID STUDIO_SHOT =
        UUID.fromString("0f164b33-bd45-4afd-abc5-90bfba735d1f");
    private static final String COMPOSITION =
        "EP001-Shot11-RouteDecisionPresentationV1";
    private static final UUID[] CLIP_IDS = {
        UUID.fromString("bc6cc60f-7aad-4fe9-99c9-e61942d13d1e"),
        UUID.fromString("399da60c-1e63-457f-929d-5c67374519cb"),
        UUID.fromString("4e58d6dc-0045-4d85-8381-31339a8c1ffe")
    };
    private static final int[] SCRIPT_REVISIONS = {3,2,2};
    private static final int[] GENERATION_REVISIONS = {2,1,1};
    private static final int[] BOUNDARIES = {0,22,46,72};
    private static final String[] APPROVED_NARRATIONS = {
        "The response reaches the phone, but the important part is what gets stored. "
            + "In a browser, a session cookie may be saved automatically — even if the page cannot read it. "
            + "In a token-based app, the client may keep a token for later requests. "
            + "The phone now has what it needs to continue without asking for the password again.",
        "Here is what Route Decision actually does. "
            + "The app updates its authentication state from the server’s successful response, "
            + "then checks which screen should be shown. Signed in? Open Dashboard. "
            + "Not signed in? Stay on Login. But this check only controls navigation. "
            + "It does not give the phone permission to read private data from the server.",
        "Opening the Dashboard triggers another request — this time for the user’s private data. "
            + "The browser may attach its session cookie automatically, or the app may send an access token. "
            + "The server checks that proof, then checks what this particular account is allowed to see. "
            + "Only the permitted data comes back. That’s when the Dashboard fills in. "
            + "A successful login never meant unlimited access."
    };
    private final JdbcClient db;
    private final RemotionRenderController renderer;

    public DirectorShot11PresentationController(
        JdbcClient db,
        RemotionRenderController renderer
    ) {
        this.db = db;
        this.renderer = renderer;
    }

    private record Voice(
        UUID id,
        int sequence,
        int scriptRevision,
        int generationRevision,
        String narration,
        boolean locked,
        boolean approved,
        boolean generated,
        String alignment
    ) {}

    private List<Voice> exactApprovedVoices() {
        boolean shotExists = db.sql("""
            select exists (
                select 1 from studio_shot
                where id=:id and episode_id=:episode and shot_number=11
                and legacy_source_shot_key is null
            )
            """)
            .param("id", STUDIO_SHOT)
            .param("episode", EPISODE)
            .query(Boolean.class)
            .single();
        if (!shotExists) {
            throw conflict("The isolated SHOT 11 Director Studio shot does not match the approved working copy.");
        }
        List<Voice> clips = db.sql("""
            select id,sequence,script_revision,generation_revision,narration,
                   locked_at is not null as locked,
                   approved_at is not null as approved,
                   generated_audio is not null and octet_length(generated_audio)>10000 as generated,
                   generated_alignment::text as alignment
            from studio_clip
            where shot_id=:shot
            order by sequence
            """)
            .param("shot", STUDIO_SHOT)
            .query((rs, row) -> new Voice(
                rs.getObject("id", UUID.class),
                rs.getInt("sequence"),
                rs.getInt("script_revision"),
                rs.getInt("generation_revision"),
                rs.getString("narration"),
                rs.getBoolean("locked"),
                rs.getBoolean("approved"),
                rs.getBoolean("generated"),
                rs.getString("alignment")
            ))
            .list();
        if (clips.size()!=3) {
            throw conflict("SHOT 11 requires precisely the three Director-approved V2 clips.");
        }
        for (int i=0; i<3; i++) {
            Voice voice=clips.get(i);
            if (!voice.id().equals(CLIP_IDS[i]) || voice.sequence()!=i+1
                || voice.scriptRevision()!=SCRIPT_REVISIONS[i]
                || voice.generationRevision()!=GENERATION_REVISIONS[i]
                || !APPROVED_NARRATIONS[i].equals(voice.narration())
                || !voice.locked() || !voice.approved() || !voice.generated()) {
                throw conflict("SHOT 11 C0"+(i+1)
                    +" differs from the exact Director-LOCKED Voice V2. No preview rendered.");
            }
            double seconds=DirectorShot10DraftController.alignmentEndSeconds(voice.alignment());
            int slotFrames=(BOUNDARIES[i+1]-BOUNDARIES[i])*30;
            if (!(seconds>0) || !Double.isFinite(seconds)
                || seconds*30d > slotFrames-6) {
                throw conflict("SHOT 11 C0"+(i+1)
                    +" alignment does not fit its protected narration slot; do not truncate audio.");
            }
        }
        return clips;
    }

    @GetMapping("/voice-readiness")
    public Map<String,Object> readiness() {
        List<Voice> voices=exactApprovedVoices();
        List<Map<String,Object>> clips=new ArrayList<>();
        for (Voice voice : voices) {
            clips.add(Map.of(
                "clipKey", "SHOT 11-C0"+voice.sequence(),
                "clipId", voice.id(),
                "durationSeconds",
                    DirectorShot10DraftController.alignmentEndSeconds(voice.alignment()),
                "approved", true,
                "locked", true,
                "generated", true
            ));
        }
        return Map.of(
            "ready",true,
            "status","DIRECTOR_VOICE_V2_LOCKED",
            "compositionId",COMPOSITION,
            "durationInFrames",2160,
            "clips",clips
        );
    }

    @PostMapping("/render-presentation-v1")
    public Map<String,Object> renderPreview() {
        List<Voice> voices=exactApprovedVoices();
        String base=System.getenv().getOrDefault(
            "MEDIA_OS_PUBLIC_URL",
            "https://media-os-backend-production.up.railway.app"
        ).replaceAll("/+$","");
        if (!base.matches("https://[A-Za-z0-9.:-]+")) {
            throw conflict("MEDIA_OS_PUBLIC_URL must be an approved HTTPS backend.");
        }
        List<Map<String,Object>> audioClips=new ArrayList<>();
        for (int i=0;i<3;i++) {
            Map<String,Object> clip=new LinkedHashMap<>();
            clip.put("src",base+"/api/v1/studio/clips/"+voices.get(i).id()+"/audio");
            clip.put("fromFrame",BOUNDARIES[i]*30);
            clip.put("durationInFrames",(BOUNDARIES[i+1]-BOUNDARIES[i])*30);
            audioClips.add(clip);
        }
        Map<String,Object> props=Map.of(
            "durationInFrames",2160,
            "audioClips",audioClips
        );
        return renderer.ensureRender(
            COMPOSITION,
            new RemotionRenderController.RenderRequest("FAST_PREVIEW",props)
        );
    }

    private static ResponseStatusException conflict(String detail) {
        return new ResponseStatusException(HttpStatus.CONFLICT,detail);
    }
}
