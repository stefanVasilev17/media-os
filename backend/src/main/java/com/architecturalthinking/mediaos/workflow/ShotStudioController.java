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
    private final StudioDirectorVisualPlanService planner;
    public ShotStudioController(JdbcClient db,ObjectMapper json,ElevenLabsTextToSpeechService tts,
                                RemotionRenderController renderer,StudioDirectorVisualPlanService planner){
        this.db=db;this.json=json;this.tts=tts;this.renderer=renderer;this.planner=planner;
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
    public record DirectorWorkingCopy(boolean directorConfirmed) {}

    private static final List<String> EP001_TITLES=List.of(
        "The Human Action / Login Intent",
        "Request Assembly",
        "Ready Does Not Mean Sent",
        "DNS Resolution / Network Transit",
        "API Gateway / Routing",
        "Load Balancer / Traffic Distribution",
        "Auth Service / Validation Steps",
        "User Database / User Data",
        "Healthy Auth Service, Broken Login",
        "When Trust Breaks Along the Way",
        "Correct Password, But Not Logged In Yet",
        "Authentication State / Session Creation",
        "Route Decision / Logged-In UI",
        "Session Restore Flow",
        "What Really Happened When You Clicked Login",
        "The Next Request"
    );

    @Transactional
    @PostMapping("/original-shots/{shotKey}/unlock")
    public Map<String,Object> unlockOriginalShot(
        @PathVariable String shotKey,
        @RequestBody DirectorWorkingCopy action
    ){
        if(action==null||!action.directorConfirmed())
            throw conflict("Explicit Director confirmation is required before opening an original shot for corrections.");
        int shotNumber=originalShotNumber(shotKey);
        String key=String.format(Locale.ROOT,"SHOT %02d",shotNumber);
        db.sql("select id from episode where id=:episode for update")
            .param("episode",EPISODE).query(UUID.class).single();
        UUID existing=db.sql("""
            select id from studio_shot where episode_id=:episode and shot_number=:number
            """).param("episode",EPISODE).param("number",shotNumber)
            .query(UUID.class).optional().orElse(null);
        if(existing!=null)return shot(existing);

        int scriptRevision=db.sql("""
            select current_revision from production_stage
            where episode_id=:episode and stage_key='SCRIPT' and status='LOCKED'
            """).param("episode",EPISODE).query(Integer.class)
            .optional().orElseThrow(()->conflict("Original EP001 Script is not Director LOCKED."));

        record SourceClip(int sequence,String text,String direction) {}
        List<SourceClip> source=db.sql("""
            select sequence_no,coalesce(director_narration_override,narration) as effective_narration,
                   coalesce(voice_direction,'') as direction
            from voice_clip_workflow
            where episode_id=:episode and script_revision=:revision and shot_key=:shot
            order by sequence_no
            """).param("episode",EPISODE).param("revision",scriptRevision).param("shot",key)
            .query((rs,n)->new SourceClip(
                rs.getInt("sequence_no"),rs.getString("effective_narration"),rs.getString("direction")))
            .list();
        if(source.isEmpty())throw conflict("Original shot has no authoritative voice clips. Copy was not created.");
        if(source.size()>48)throw conflict("Shot contains too many clips for automatic working-copy preparation.");
        for(int i=0;i<source.size();i++){
            SourceClip clip=source.get(i);
            if(clip.sequence()!=i+1||clip.text()==null||clip.text().isBlank())
                throw conflict("Original voice clips are incomplete or out of sequence. Source was not modified.");
            validate(clip.text(),5000);
        }
        UUID shotId=UUID.randomUUID();
        db.sql("""
            insert into studio_shot (
                id,episode_id,shot_number,title,legacy_source_shot_key,legacy_source_script_revision
            ) values(:id,:episode,:number,:title,:source,:revision)
            """).param("id",shotId).param("episode",EPISODE).param("number",shotNumber)
            .param("title",EP001_TITLES.get(shotNumber-1)).param("source",key)
            .param("revision",scriptRevision).update();
        for(SourceClip clip:source){
            db.sql("""
                insert into studio_clip(id,shot_id,sequence,narration,voice_direction)
                values(:id,:shot,:sequence,:narration,:direction)
                """).param("id",UUID.randomUUID()).param("shot",shotId)
                .param("sequence",clip.sequence()).param("narration",clip.text())
                .param("direction",clip.direction()).update();
        }
        return shot(shotId);
    }

    static int originalShotNumber(String shotKey){
        if(shotKey==null||!shotKey.matches("SHOT (0[1-9]|1[0-6])"))
            throw bad("Only canonical EP001 SHOT 01–16 can be unlocked through this endpoint.");
        return Integer.parseInt(shotKey.substring(5));
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
    @Transactional
    @PostMapping("/shots/{id}/reuse-existing-voices")
    public Map<String,Object> reuseOriginalVoices(@PathVariable UUID id) {
        Map<String,Object> current=shot(id);
        if(current.get("sourceShotKey")==null || current.get("sourceScriptRevision")==null)
            throw conflict("Only an original EP001 Director working copy can reuse the original voice recordings.");

        db.sql("select id from studio_shot where id=:id and episode_id=:episode for update")
            .param("id",id).param("episode",EPISODE).query(UUID.class).single();

        int reused=db.sql("""
            update studio_clip target
            set generated_audio=original.generated_audio,
                generated_audio_content_type=coalesce(original.generated_audio_content_type,'audio/mpeg'),
                generated_alignment=original.generated_alignment,
                generated_at=coalesce(original.voice_generated_at,now()),
                generation_revision=greatest(target.generation_revision+1,1),
                approved_at=original.voice_approved_at,
                updated_at=now()
            from studio_shot source, voice_clip_workflow original
            where target.shot_id=source.id
              and source.id=:id and source.episode_id=:episode
              and source.legacy_source_shot_key is not null
              and original.episode_id=source.episode_id
              and original.shot_key=source.legacy_source_shot_key
              and original.script_revision=source.legacy_source_script_revision
              and original.sequence_no=target.sequence
              and target.locked_at is not null
              and target.generated_audio is null and target.approved_at is null
              and target.narration=coalesce(original.director_narration_override,original.narration)
              and target.voice_direction=coalesce(original.voice_direction,'')
              and original.generated_audio is not null
              and octet_length(original.generated_audio)>0
              and original.generated_alignment is not null
            """).param("id",id).param("episode",EPISODE).update();

        if(reused>0)invalidatePreview(id);
        Map<String,Object> answer=new LinkedHashMap<>();
        answer.put("reusedClips",reused);
        long voiceApproved=((List<?>)shot(id).get("clips")).stream()
            .filter(value->value instanceof Map<?,?> m && m.get("approvedAt")!=null).count();
        answer.put("approvedClips",voiceApproved);
        answer.put("shot",shot(id));
        return answer;
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
                update studio_shot
                set director_visual_plan=null,director_visual_plan_revision=null,
                    director_visual_voice_signature=null,director_visual_created_at=null
                where id=:id
                """).param("id",id).update();
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
            select shot_number,title,visual_prompt,visual_revision,preview_render_id,preview_visual_revision,
                   legacy_source_shot_key,legacy_source_script_revision,
                   director_visual_plan_revision,director_visual_voice_signature from studio_shot
            where id=:id and episode_id=:episode
            """).param("id",id).param("episode",EPISODE).query((rs,n)->{
                Map<String,Object> r=new LinkedHashMap<>();
                r.put("id",id);r.put("shotNumber",rs.getInt("shot_number"));
                r.put("shotKey",String.format("SHOT %02d",rs.getInt("shot_number")));
                r.put("title",rs.getString("title"));r.put("visualPrompt",rs.getString("visual_prompt"));
                r.put("visualRevision",rs.getInt("visual_revision"));
                UUID previewId=rs.getObject("preview_render_id",UUID.class);
                r.put("previewRenderId",previewId);
                r.put("previewVisualRevision",rs.getObject("preview_visual_revision"));
                r.put("sourceShotKey",rs.getString("legacy_source_shot_key"));
                r.put("sourceScriptRevision",rs.getObject("legacy_source_script_revision"));
                r.put("visualPlanRevision",rs.getObject("director_visual_plan_revision"));
                r.put("visualPlanReady",rs.getString("director_visual_voice_signature")!=null);
                return r;
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
    @Transactional
    @PostMapping("/shots/{id}/generate-visual-plan")
    public Map<String,Object> generateDirectorPlan(@PathVariable UUID id) {
        Map<String,Object> source=shot(id);
        if(((Number)source.get("visualRevision")).intValue()<1)
            throw conflict("Save your Director visual directions before planning.");
        StudioDirectorVisualPlanService.Compilation compiled=planner.compile(id,source);
        String encoded=toJson(compiled.plan());
        String signature=compiled.voiceSignature();
        String unchanged=planner.currentSignature(id);
        if(!signature.equals(unchanged))
            throw conflict("A voice clip changed during planning. Generate again after its approval.");
        int changed=db.sql("""
            update studio_shot set
              director_visual_plan=cast(:plan as jsonb),
              director_visual_plan_revision=visual_revision,
              director_visual_voice_signature=:signature,
              director_visual_created_at=now(),
              preview_render_id=null,preview_visual_revision=null
            where id=:id and episode_id=:episode and visual_revision=:revision
            """)
            .param("plan",encoded).param("signature",signature).param("id",id)
            .param("episode",EPISODE).param("revision",source.get("visualRevision")).update();
        if(changed!=1)throw conflict("Visual instructions changed during compilation. Generate again.");
        db.sql("""
            insert into studio_director_visual_plan_history(
                id,shot_id,visual_revision,voice_signature,plan
            ) values(gen_random_uuid(),:shot,:revision,:signature,cast(:plan as jsonb))
            on conflict(shot_id,visual_revision,voice_signature) do nothing
            """).param("shot",id).param("revision",source.get("visualRevision"))
            .param("signature",signature).param("plan",encoded).update();
        return Map.of("ready",true,"visualRevision",source.get("visualRevision"),
            "plan",compiled.plan(),"validation","PASSED","generationCost","ZERO_LLM_TOKENS");
    }

    @GetMapping("/shots/{id}/visual-plan")
    public Map<String,Object> getDirectorPlan(@PathVariable UUID id) {
        shot(id);
        return db.sql("""
            select director_visual_plan::text as plan,
                   director_visual_plan_revision as revision,
                   director_visual_voice_signature as signature,
                   visual_revision as current_revision
            from studio_shot where id=:id and episode_id=:episode
            """).param("id",id).param("episode",EPISODE)
            .query((rs,n)->{
                String plan=rs.getString("plan");
                if(plan==null)return Map.<String,Object>of("ready",false,"stale",false);
                try{
                    @SuppressWarnings("unchecked")
                    Map<String,Object> parsed=json.readValue(plan,Map.class);
                    boolean fresh=rs.getInt("revision")==rs.getInt("current_revision")
                        && rs.getString("signature").equals(planner.currentSignature(id));
                    Map<String,Object> value=new LinkedHashMap<>();
                    value.put("ready",fresh);value.put("stale",!fresh);
                    value.put("plan",parsed);
                    return value;
                }catch(Exception ex){throw conflict("Stored Visual Plan could not be validated.");}
            }).single();
    }

    @PostMapping("/shots/{id}/render-director-plan")
    public Map<String,Object> renderDirectorPlan(@PathVariable UUID id) {
        Map<String,Object> source=shot(id);
        if(!"SHOT 05".equals(source.get("sourceShotKey")))
            throw conflict("Director-grade cinematic rendering is enabled for the SHOT 05 recipe only.");
        Map<String,Object> saved=getDirectorPlan(id);
        if(!Boolean.TRUE.equals(saved.get("ready")))
            throw conflict("Generate a current validated Visual Plan first. Narration and instructions must not change.");
        @SuppressWarnings("unchecked")
        Map<String,Object> plan=(Map<String,Object>)saved.get("plan");
        StudioDirectorVisualPlanService.validatePlan(plan);
        @SuppressWarnings("unchecked")
        List<Map<String,Object>> audio=(List<Map<String,Object>>)plan.get("audioSources");
        String base=System.getenv().getOrDefault(
            "MEDIA_OS_PUBLIC_URL","https://media-os-backend-production.up.railway.app").replaceAll("/+$","");
        if(!base.matches("https://[A-Za-z0-9.:-]+"))
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "MEDIA_OS_PUBLIC_URL must be a public HTTPS backend URL.");
        List<Map<String,Object>> clips=new ArrayList<>();
        for(Map<String,Object> item:audio){
            UUID clipId=UUID.fromString(String.valueOf(item.get("clipId")));
            clips.add(Map.of(
                "src",base+"/api/v1/studio/clips/"+clipId+"/audio?v="+item.get("generationRevision"),
                "fromFrame",item.get("fromFrame"),
                "durationInFrames",item.get("durationInFrames")
            ));
        }
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("directorPlan",plan);
        props.put("audioClips",clips);
        props.put("durationInFrames",3900);
        Map<String,Object> render=renderer.ensureRender("EP001-Studio-DirectorPlan",
            new RemotionRenderController.RenderRequest("FAST_PREVIEW",props));
        UUID renderId=UUID.fromString(String.valueOf(render.get("renderId")));
        int changed=db.sql("""
            update studio_shot set preview_render_id=:render,
                preview_visual_revision=visual_revision,preview_created_at=now()
            where id=:id and episode_id=:episode
              and director_visual_voice_signature=:signature
              and director_visual_plan_revision=visual_revision
            """).param("render",renderId).param("id",id).param("episode",EPISODE)
            .param("signature",plan.get("voiceSignature")).update();
        if(changed!=1)throw conflict("Director plan became stale while the preview was queued.");
        return render;
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
