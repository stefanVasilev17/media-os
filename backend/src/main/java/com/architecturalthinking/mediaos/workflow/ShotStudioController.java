package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/v1/studio")
public class ShotStudioController {
    private static final UUID EPISODE=ProductionOverviewService.EPISODE_ID;
    private final JdbcClient db;
    private final ObjectMapper json;
    private final ElevenLabsTextToSpeechService tts;
    private final RemotionRenderController renderer;
    public ShotStudioController(JdbcClient db,ObjectMapper json,ElevenLabsTextToSpeechService tts,
                                RemotionRenderController renderer){
        this.db=db;this.json=json;this.tts=tts;this.renderer=renderer;
    }
    public record Title(@NotBlank String title){}
    public record Text(@NotBlank String narration,String voiceDirection){}
    public record Unlock(boolean directorConfirmed){}
    public record Visual(@NotBlank String instructions){}

    @GetMapping("/shots")
    public List<Map<String,Object>> list(){
        return db.sql("select id from studio_shot where episode_id=:episode order by shot_number")
            .param("episode",EPISODE).query(UUID.class).list().stream().map(this::shot).toList();
    }
    @Transactional
    @PostMapping("/shots")
    public Map<String,Object> create(@Valid @RequestBody Title body){
        if(body.title().trim().length()>240)throw bad("Shot title is too long.");
        db.sql("select id from episode where id=:id for update").param("id",EPISODE).query(UUID.class).single();
        int next=db.sql("select greatest(coalesce(max(shot_number),0),16)+1 from studio_shot where episode_id=:id")
            .param("id",EPISODE).query(Integer.class).single();
        UUID id=UUID.randomUUID();
        db.sql("insert into studio_shot(id,episode_id,shot_number,title) values(:id,:episode,:number,:title)")
            .param("id",id).param("episode",EPISODE).param("number",next).param("title",body.title().trim()).update();
        return shot(id);
    }
    @PostMapping("/shots/{id}/clips")
    @Transactional
    public Map<String,Object> addClip(@PathVariable UUID id,@Valid @RequestBody Text body){
        shot(id);
        db.sql("select id from studio_shot where id=:id for update").param("id",id).query(UUID.class).single();
        int sequence=db.sql("select coalesce(max(sequence),0)+1 from studio_clip where shot_id=:id")
            .param("id",id).query(Integer.class).single();
        db.sql("insert into studio_clip(id,shot_id,sequence,narration,voice_direction) values(:id,:shot,:seq,:text,:direction)")
            .param("id",UUID.randomUUID()).param("shot",id).param("seq",sequence)
            .param("text",validate(body.narration(),5000)).param("direction",direction(body.voiceDirection())).update();
        db.sql("update studio_shot set preview_render_id=null,preview_visual_revision=null where id=:id")
            .param("id",id).update();
        return shot(id);
    }
    @PutMapping("/clips/{id}")
    @Transactional
    public Map<String,Object> updateClip(@PathVariable UUID id,@Valid @RequestBody Text body){
        Map<String,Object> old=clip(id,true);
        if(old.get("lockedAt")!=null)throw conflict("Clip is LOCKED. Unlock it as Director before editing.");
        String narration=validate(body.narration(),5000), voice=direction(body.voiceDirection());
        if(!narration.equals(old.get("narration"))||!voice.equals(old.get("voiceDirection"))){
            archive(id);
            invalidatePreview((UUID)old.get("shotId"));
            db.sql("""
                update studio_clip set narration=:n,voice_direction=:d,script_revision=script_revision+1,
                generated_audio=null,generated_audio_content_type=null,generated_alignment=null,
                generated_at=null,approved_at=null,updated_at=now() where id=:id
                """).param("n",narration).param("d",voice).param("id",id).update();
        }
        return clip(id,false);
    }
    @PostMapping("/clips/{id}/lock")
    @Transactional
    public Map<String,Object> lock(@PathVariable UUID id){
        clip(id,true);
        db.sql("update studio_clip set locked_at=coalesce(locked_at,now()),updated_at=now() where id=:id")
            .param("id",id).update();
        return clip(id,false);
    }
    @PostMapping("/clips/{id}/unlock")
    @Transactional
    public Map<String,Object> unlock(@PathVariable UUID id,@RequestBody Unlock body){
        if(!body.directorConfirmed())throw conflict("Director confirmation required.");
        Map<String,Object> old=clip(id,true);
        if(old.get("lockedAt")!=null){
            archive(id);
            invalidatePreview((UUID)old.get("shotId"));
            db.sql("""
                update studio_clip set script_revision=script_revision+1,locked_at=null,approved_at=null,
                generated_audio=null,generated_audio_content_type=null,generated_alignment=null,
                generated_at=null,updated_at=now() where id=:id
                """).param("id",id).update();
        }
        return clip(id,false);
    }
    @PostMapping("/clips/{id}/generate")
    public Map<String,Object> generate(@PathVariable UUID id){
        Map<String,Object> old=clip(id,false);
        if(old.get("lockedAt")==null)throw conflict("Lock narration before voice generation.");
        if(old.get("approvedAt")!=null)throw conflict("Approved audio is immutable; Director unlock is required.");
        if(!tts.configured())throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"ElevenLabs is not configured.");
        ElevenLabsTextToSpeechService.GenerationResult result;
        try {
            result=tts.generate(String.valueOf(old.get("clipKey")),String.valueOf(old.get("narration")),
                "","",Map.of(),"calm, conversational, confident");
        }catch(IllegalArgumentException err){throw bad(err.getMessage());}
        catch(IllegalStateException err){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,err.getMessage(),err);}
        int changed=db.sql("""
            update studio_clip set generated_audio=:audio,generated_audio_content_type=:type,
                generated_alignment=cast(:alignment as jsonb),generated_at=now(),
                generation_revision=generation_revision+1,updated_at=now()
            where id=:id and script_revision=:revision and locked_at is not null and approved_at is null
            """).param("audio",result.audio()).param("type",result.contentType())
            .param("alignment",toJson(result.alignmentResponse())).param("id",id)
            .param("revision",old.get("scriptRevision")).update();
        if(changed!=1)throw conflict("Script changed during TTS. Outdated generation discarded.");
        invalidatePreview((UUID)old.get("shotId"));
        return clip(id,false);
    }
    @PostMapping("/clips/{id}/approve")
    @Transactional
    public Map<String,Object> approve(@PathVariable UUID id){
        Map<String,Object> old=clip(id,true);
        if(old.get("lockedAt")==null||!Boolean.TRUE.equals(old.get("generated")))
            throw conflict("Generate a locked voice clip before approving.");
        db.sql("update studio_clip set approved_at=coalesce(approved_at,now()),updated_at=now() where id=:id")
            .param("id",id).update();
        return clip(id,false);
    }
    @GetMapping("/clips/{id}/audio")
    public ResponseEntity<byte[]> audio(@PathVariable UUID id){
        clip(id,false);
        return db.sql("select generated_audio from studio_clip where id=:id").param("id",id)
            .query((rs,n)->rs.getBytes("generated_audio")).optional()
            .filter(x->x.length>0)
            .map(x->ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/mpeg"))
                .cacheControl(CacheControl.noStore()).body(x))
            .orElseThrow(()->missing("Voice draft"));
    }
    @PutMapping("/shots/{id}/visual")
    @Transactional
    public Map<String,Object> saveVisual(@PathVariable UUID id,@Valid @RequestBody Visual body){
        Map<String,Object> old=shot(id);
        String prompt=validate(body.instructions(),16000);
        if(!prompt.equals(old.get("visualPrompt"))){
            invalidatePreview(id);
            db.sql("""
                insert into studio_visual_revision_history(id,shot_id,visual_revision,prompt)
                select gen_random_uuid(),id,visual_revision,visual_prompt from studio_shot
                where id=:id and visual_revision>0
                on conflict(shot_id,visual_revision) do nothing
                """).param("id",id).update();
            db.sql("update studio_shot set visual_prompt=:p,visual_revision=visual_revision+1,updated_at=now() where id=:id")
                .param("p",prompt).param("id",id).update();
        }
        return shot(id);
    }
    private Map<String,Object> shot(UUID id){
        Map<String,Object> value=db.sql("""
            select shot_number,title,visual_prompt,visual_revision,preview_render_id,preview_visual_revision from studio_shot
            where id=:id and episode_id=:episode
            """).param("id",id).param("episode",EPISODE).query((rs,n)->{
                Map<String,Object> r=new LinkedHashMap<>();
                r.put("id",id);r.put("shotNumber",rs.getInt("shot_number"));
                r.put("shotKey",String.format("SHOT %02d",rs.getInt("shot_number")));
                r.put("title",rs.getString("title"));r.put("visualPrompt",rs.getString("visual_prompt"));
                r.put("visualRevision",rs.getInt("visual_revision"));
                UUID previewId=rs.getObject("preview_render_id",UUID.class);
                r.put("previewRenderId",previewId);
                r.put("previewVisualRevision",rs.getObject("preview_visual_revision"));return r;
            }).optional().orElseThrow(()->missing("Shot"));
        value.put("clips",db.sql("""
            select c.id from studio_clip c where c.shot_id=:id order by c.sequence
            """).param("id",id).query(UUID.class).list().stream().map(clipId->clip(clipId,false)).toList());
        return value;
    }
    private Map<String,Object> clip(UUID id,boolean lock){
        String sql="""
            select c.shot_id,c.sequence,c.narration,c.voice_direction,c.script_revision,c.locked_at,
                   c.generated_at,c.approved_at,c.generation_revision,c.generated_alignment::text as alignment_json,
                   c.generated_audio is not null as generated,s.shot_number
            from studio_clip c join studio_shot s on s.id=c.shot_id
            where c.id=:id and s.episode_id=:episode
            """+(lock?" for update of c":"");
        return db.sql(sql).param("id",id).param("episode",EPISODE).query((rs,n)->{
            Map<String,Object> r=new LinkedHashMap<>();r.put("id",id);
            r.put("shotId",rs.getObject("shot_id",UUID.class));
            r.put("clipKey",String.format("SHOT %02d-C%02d",rs.getInt("shot_number"),rs.getInt("sequence")));
            r.put("sequence",rs.getInt("sequence"));r.put("narration",rs.getString("narration"));
            r.put("voiceDirection",rs.getString("voice_direction"));r.put("scriptRevision",rs.getInt("script_revision"));
            r.put("generationRevision",rs.getInt("generation_revision"));r.put("generated",rs.getBoolean("generated"));
            r.put("lockedAt",rs.getObject("locked_at"));r.put("generatedAt",rs.getObject("generated_at"));
            r.put("approvedAt",rs.getObject("approved_at"));
            r.put("durationSeconds",voiceDuration(rs.getString("alignment_json")));
            return r;
        }).optional().orElseThrow(()->missing("Clip"));
    }
    @PostMapping("/shots/{id}/generate-preview")
    public Map<String,Object> generatePreview(@PathVariable UUID id){
        Map<String,Object> candidate=shot(id);
        String prompt=String.valueOf(candidate.get("visualPrompt")).trim();
        if(prompt.isBlank())throw conflict("Save visual instructions before generating a preview.");
        @SuppressWarnings("unchecked")
        List<Map<String,Object>> clips=(List<Map<String,Object>>)candidate.get("clips");
        if(clips.isEmpty())throw conflict("Add and approve at least one voice clip.");
        if(clips.size()>12)throw conflict("Studio previews are limited to twelve audio clips per shot.");
        List<Map<String,Object>> audio=new ArrayList<>();
        int cursor=38;
        String base=System.getenv().getOrDefault(
            "MEDIA_OS_PUBLIC_URL","https://media-os-backend-production.up.railway.app").replaceAll("/+$","");
        if(!base.matches("https://[A-Za-z0-9.:-]+"))
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"MEDIA_OS_PUBLIC_URL must be a public HTTPS service URL.");
        for(Map<String,Object> clip:clips){
            if(clip.get("approvedAt")==null||!Boolean.TRUE.equals(clip.get("generated")))
                throw conflict("Every clip must have Director-approved audio before preview generation.");
            double seconds=((Number)clip.get("durationSeconds")).doubleValue();
            if(!Double.isFinite(seconds)||seconds<.3d||seconds>180d)
                throw conflict("A voice clip has no valid ElevenLabs timing. Regenerate its audio before rendering.");
            int length=Math.max(1,(int)Math.ceil(seconds*30d)+12);
            audio.add(Map.of(
                "src",base+"/api/v1/studio/clips/"+clip.get("id")+"/audio",
                "fromFrame",cursor,
                "durationInFrames",length
            ));
            cursor+=length+12;
        }
        if(cursor>30*180)throw conflict("Preview would exceed 3 minutes. Divide the shot into shorter clips.");
        String focus=previewFocus(prompt,String.valueOf(candidate.get("title")));
        List<String> path=focus.equals("Client")?
            List.of("Client","API Gateway","Auth Service"):
            focus.equals("API Gateway")?
            List.of("Client","API Gateway","Auth Service"):
            List.of("Client",focus,"Next Service");
        String camera=previewCamera(prompt);
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("shotKey",candidate.get("shotKey"));
        props.put("shotTitle",candidate.get("title"));
        props.put("focusNode",focus);
        props.put("routeNodes",path);
        props.put("cameraMode",camera);
        props.put("annotation",prompt.length()>140?prompt.substring(0,140):prompt);
        props.put("audioClips",audio);
        props.put("durationInFrames",cursor+30);
        Map<String,Object> render=renderer.ensureRender("EP001-Studio-LivingMapDraft",
            new RemotionRenderController.RenderRequest("FAST_PREVIEW",props));
        UUID renderId=UUID.fromString(String.valueOf(render.get("renderId")));
        int updated=db.sql("""
            update studio_shot set preview_render_id=:render,
                preview_visual_revision=visual_revision,preview_created_at=now()
            where id=:id and episode_id=:episode and visual_revision=:revision
            """)
            .param("render",renderId).param("id",id).param("episode",EPISODE)
            .param("revision",candidate.get("visualRevision")).update();
        if(updated!=1)throw conflict("Visual instructions were modified while preview was being queued. Save again.");
        return render;
    }

    static String previewFocus(String visual,String title){
        String lower=(visual+" "+title).toLowerCase(Locale.ROOT);
        for(String name:List.of("API Gateway","Load Balancer","Authentication Service","Auth Service",
            "Redis","User Database","Database","Payment Processor","Session Store","Browser","Phone","Client")){
            if(lower.contains(name.toLowerCase(Locale.ROOT)))return name;
        }
        return title.length()>46?title.substring(0,46):title;
    }
    static String previewCamera(String prompt){
        String text=prompt.toLowerCase(Locale.ROOT);
        if(text.contains("wide")||text.contains("zoom out")||text.contains("pull back"))return "WIDE";
        if(text.contains("follow")||text.contains("track")||text.contains("pan "))return "FOLLOW";
        return "FOCUS";
    }
    private double voiceDuration(String alignment){
        if(alignment==null||alignment.isBlank())return 0d;
        try {
            JsonNode root=json.readTree(alignment);
            JsonNode endings=root.path("alignment").path("character_end_times");
            if(!endings.isArray()||endings.isEmpty())endings=root.path("normalized_alignment").path("character_end_times");
            if(!endings.isArray())return 0d;
            double end=0d;
            for(JsonNode v:endings)if(v.isNumber())end=Math.max(end,v.asDouble());
            return Double.isFinite(end)&&end>0d?end+.3d:0d;
        }catch(Exception ignored){return 0d;}
    }
    private void invalidatePreview(UUID id){
        db.sql("update studio_shot set preview_render_id=null,preview_visual_revision=null where id=:id")
            .param("id",id).update();
    }

    private void archive(UUID id){
        db.sql("""
            insert into studio_clip_revision_history(id,clip_id,script_revision,snapshot,audio)
            select gen_random_uuid(),id,script_revision,to_jsonb(studio_clip)-'generated_audio',generated_audio
            from studio_clip where id=:id
            on conflict(clip_id,script_revision) do nothing
            """).param("id",id).update();
    }
    static String validate(String text,int max){
        if(text==null||text.isBlank())throw bad("Text cannot be blank.");
        String trimmed=text.trim();
        if(trimmed.length()>max)throw bad("Text exceeds "+max+" characters.");
        return trimmed;
    }
    private static String direction(String text){
        if(text==null)return "";
        return validate(text.isBlank()?"calm, conversational, confident":text,1200);
    }
    private String toJson(Object value){
        try{return json.writeValueAsString(value);}
        catch(Exception err){throw new IllegalStateException("Unable to serialize voice alignment.",err);}
    }
    private static ResponseStatusException bad(String msg){return new ResponseStatusException(HttpStatus.BAD_REQUEST,msg);}
    private static ResponseStatusException conflict(String msg){return new ResponseStatusException(HttpStatus.CONFLICT,msg);}
    private static ResponseStatusException missing(String what){return new ResponseStatusException(HttpStatus.NOT_FOUND,what+" not found.");}
}
