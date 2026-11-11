package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class Ep002ProductionContractService {
    static final String EPISODE = "EP002";
    static final String VISUAL_SHA = "5c43c7fd3bd66b5899f0956a9cfd80bdead834f1";
    private static final Pattern SHOT = Pattern.compile("SHOT(0[1-9]|1[01])");
    private final JdbcClient jdbc;
    private final JsonNode manifest;
    private final JsonNode visuals;
    private final JsonNode recoveryVisuals;

    record Script(int revision, String narration, String voiceDirection, String sourceRevision) {}
    record Take(UUID id,int revision,int number,String contentType,String modelId,
                String voiceId,OffsetDateTime generatedAt,BigDecimal durationSeconds,String alignmentJson) {}

    public Ep002ProductionContractService(JdbcClient jdbc,ObjectMapper mapper) {
        this.jdbc=jdbc;
        try {
            manifest=Ep002RecoverySource.load(mapper,Ep002RecoverySource.SCRIPT_PATH);
            visuals=mapper.readTree(new ClassPathResource("episode-production/ep002-approved-visual-source.json").getInputStream());
        } catch (IOException error) {
            throw new IllegalStateException("Approved EP002 production sources cannot be loaded.",error);
        }
        if (manifest.path("shotCount").asInt()!=11 || visuals.path("shotCount").asInt()!=11
                || visuals.path("beatCount").asInt()!=59
                || !VISUAL_SHA.equals(visuals.path("gitBlobSha").asText())) {
            throw new IllegalStateException("EP002 source integrity validation failed.");
        }
        recoveryVisuals=Ep002RecoverySource.load(mapper,Ep002RecoverySource.VISUAL_PATH);
        Ep002RecoverySource.verify(manifest,visuals,recoveryVisuals);
        for(int i=0;i<11;i++) {
            String key=String.format(java.util.Locale.ROOT,"SHOT%02d",i+1);
            if (!key.equals(manifest.path("shots").path(i).path("shotKey").asText())
                    || !key.equals(visuals.path("shots").path(i).path("shotKey").asText())) {
                throw new IllegalStateException("Approved EP002 SHOT sources are not aligned: "+key);
            }
        }
    }

    private int index(String shot) {
        if (shot==null || !SHOT.matcher(shot).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected SHOT01 through SHOT11.");
        return Integer.parseInt(shot.substring(4))-1;
    }

    static String sha256(String text) {
        try {
            byte[] bytes=MessageDigest.getInstance("SHA-256")
                    .digest(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException cause) {
            throw new IllegalStateException("SHA-256 unavailable.",cause);
        }
    }

    static String fingerprint(String episode,String shot,int revision,
                              String narrationHash,UUID preferredTake,String visualSha) {
        return sha256(String.join("\n",episode,shot,String.valueOf(revision),narrationHash,
                preferredTake.toString(),visualSha));
    }

    JsonNode sourceVisual(int index) { return Ep002RecoverySource.visual(visuals,recoveryVisuals,index); }
    JsonNode sourceScript(int index) { return manifest.path("shots").path(index); }

    private Script script(String shot,int index) {
        JsonNode approved=sourceScript(index);
        return jdbc.sql("""
                select revision,narration,voice_direction from ep002_creative_script_revision
                where shot_key=:shot order by revision desc limit 1
                """).param("shot",shot)
                .query((rs,n)->new Script(rs.getInt("revision"),rs.getString("narration"),
                        rs.getString("voice_direction"),approved.path("directorScriptRevision").asText()))
                .optional().orElseGet(()->new Script(0,approved.path("englishNarration").asText(),
                        approved.path("voiceDirection").asText(),approved.path("directorScriptRevision").asText()));
    }

    private Take chosenTake(String shot,int revision) {
        if(revision<1)return null;
        return jdbc.sql("""
                select t.id,t.revision,t.take_number,t.content_type,t.model_id,t.voice_id,
                       t.generated_at,t.duration_seconds,t.elevenlabs_alignment::text as alignment_json
                from ep002_creative_voice_choice choice
                join ep002_creative_voice_take t on t.id=choice.take_id
                  and t.shot_key=choice.shot_key and t.revision=choice.revision
                where choice.shot_key=:shot and choice.revision=:revision
                order by choice.selected_at desc,choice.id desc limit 1
                """).param("shot",shot).param("revision",revision)
                .query((rs,n)->new Take(rs.getObject("id",UUID.class),rs.getInt("revision"),
                        rs.getInt("take_number"),rs.getString("content_type"),
                        rs.getString("model_id"),rs.getString("voice_id"),
                        rs.getObject("generated_at",OffsetDateTime.class),
                        rs.getBigDecimal("duration_seconds"),rs.getString("alignment_json")))
                .optional().orElse(null);
    }

    private BigDecimal measuredDuration(Take take) {
        if(take==null)return null;
        if(take.durationSeconds()!=null)return take.durationSeconds();
        byte[] audio=jdbc.sql("select audio from ep002_creative_voice_take where id=:id")
                .param("id",take.id()).query(byte[].class).optional().orElse(null);
        if(audio==null || audio.length==0)return null;
        BigDecimal duration=probeDuration(audio,take.contentType());
        if(duration!=null) {
            jdbc.sql("""
                    update ep002_creative_voice_take set duration_seconds=:duration
                    where id=:id and duration_seconds is null
                    """).param("duration",duration).param("id",take.id()).update();
        }
        return duration;
    }

    static BigDecimal parseDuration(String raw) {
        try {
            double seconds=Double.parseDouble(raw.trim());
            if(!Double.isFinite(seconds)||seconds<=0||seconds>=86400)return null;
            return BigDecimal.valueOf(seconds).setScale(3,RoundingMode.HALF_UP);
        } catch (NumberFormatException problem) {return null;}
    }

    private static BigDecimal probeDuration(byte[] bytes,String mime) {
        Path temporary=null;
        try {
            temporary=Files.createTempFile("ep002-voice-duration-", "audio/wav".equals(mime)?".wav":".mp3");
            Files.write(temporary,bytes);
            Process process=new ProcessBuilder("ffprobe","-v","error","-show_entries",
                    "format=duration","-of","default=noprint_wrappers=1:nokey=1",
                    temporary.toAbsolutePath().toString())
                    .redirectErrorStream(true).start();
            if(!process.waitFor(8,TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return null;
            }
            if(process.exitValue()!=0)return null;
            return parseDuration(new String(process.getInputStream().readAllBytes(),
                    java.nio.charset.StandardCharsets.UTF_8));
        } catch(IOException ignored) {
            return null;
        } catch(InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return null;
        } finally {
            if(temporary!=null)try{Files.deleteIfExists(temporary);}catch(IOException ignored){}
        }
    }

    public Map<String,Object> contract(String shot) {
        int i=index(shot);
        Script script=script(shot,i);
        JsonNode approved=sourceScript(i);
        JsonNode visual=sourceVisual(i);
        String narrationHash=sha256(script.narration());
        boolean sourceUnchanged=script.narration().equals(approved.path("englishNarration").asText());
        Take chosen=chosenTake(shot,script.revision());
        BigDecimal measured=measuredDuration(chosen);
        Ep002AutomaticVoiceCues.Result automatic=chosen!=null && "SHOT01".equals(shot)
                ?Ep002AutomaticVoiceCues.resolve(shot,script.narration(),visual,
                        chosen.alignmentJson(),measured,new ObjectMapper()):null;
        var cues=automatic==null?List.<Ep002VoiceCueTiming.TimedBeat>of()
                :automatic.frames().stream().map(c->new Ep002VoiceCueTiming.TimedBeat(
                        c.beatNumber(),c.spokenAnchor(),c.spokenStartSeconds(),
                        c.spokenEndSeconds(),c.startFrame(),c.endFrame())).toList();
        String signature=chosen==null?null:fingerprint(EPISODE,shot,script.revision(),
                narrationHash,chosen.id(),VISUAL_SHA);
        Map<String,Object> scriptResult=new LinkedHashMap<>();
        scriptResult.put("revision",script.revision());
        scriptResult.put("sourceRevision",script.sourceRevision());
        scriptResult.put("narration",script.narration());
        scriptResult.put("voiceDirection",script.voiceDirection());
        scriptResult.put("sha256",narrationHash);
        scriptResult.put("origin",script.revision()==0?"APPROVED_ORIGINAL":"CREATIVE_SAVED_REVISION");
        scriptResult.put("sourceUnchanged",sourceUnchanged);

        Map<String,Object> voice=new LinkedHashMap<>();
        voice.put("preferredTakeId",chosen==null?null:chosen.id().toString());
        voice.put("takeNumber",chosen==null?null:chosen.number());
        voice.put("sourceScriptRevision",chosen==null?null:chosen.revision());
        voice.put("modelId",chosen==null?null:chosen.modelId());
        voice.put("voiceId",chosen==null?null:chosen.voiceId());
        voice.put("audioUrl",chosen==null?null:"/api/v1/creative/episodes/EP002/shots/"
                +shot+"/takes/"+chosen.id()+"/audio");
        voice.put("durationSeconds",measured);
        voice.put("cueTimings",cues);
        voice.put("cueTimingDiagnostic",automatic==null?"NO_SELECTED_TAKE":automatic.reason());
        voice.put("alignmentAuthority",cues.size()==5?"ELEVENLABS_CHARACTER_TIMESTAMPS":"NOT_AVAILABLE");
        voice.put("durationAuthority",chosen==null?"NO_PREFERRED_TAKE":
                measured==null?"MEASUREMENT_UNAVAILABLE":"FFPROBE_MEASURED");
        voice.put("status",chosen==null?"NO_PREFERRED_TAKE":"PREFERRED_TAKE_SELECTED");

        Map<String,Object> visualResult=new LinkedHashMap<>();
        visualResult.put("version",i>=7?"v5.0_RECOVERY":visuals.path("visualPassVersion").asText());
        visualResult.put("sourceGitBlobSha",VISUAL_SHA);
        visualResult.put("approval",i>=7?"DIRECTOR_APPROVED_RECOVERY_SCRIPT":visuals.path("approval").asText());
        visualResult.put("editorialWindow",visual.path("editorialWindow").asText());
        visualResult.put("editorialDurationSeconds",approved.path("editorialDurationSeconds").asInt());
        visualResult.put("beatTimingAuthority",cues.size()==5
                ? "ELEVENLABS_CHARACTER_TIMESTAMPS"
                : "EDITORIAL_ONLY_NOT_AUDIO_ALIGNED");
        visualResult.put("cueReviewStatus",sourceUnchanged?"SOURCE_TEXT_UNCHANGED":"REVIEW_AFTER_NARRATION_EDIT");
        visualResult.put("beats",visual.path("beats"));
        visualResult.put("automaticSpokenAnchors",Ep002RecoverySource.suggestedAnchors(visuals,recoveryVisuals,shot));
        visualResult.put("visualGoal",visual.path("visualGoal").asText());
        visualResult.put("cameraDirection",visual.path("cameraDirection").asText());
        visualResult.put("assetDirection",visual.path("assetDirection").asText());
        visualResult.put("truthContinuity",visual.path("truthContinuity").asText());
        visualResult.put("transition",visual.path("transition").asText());

        Map<String,Object> render=new LinkedHashMap<>();
        render.put("status","NOT_RENDERED");
        render.put("renderId",null);
        render.put("commitSha",null);
        if(signature!=null) {
            jdbc.sql("""
                    select l.remotion_render_id::text as remotion_render_id,
                           l.remotion_commit_sha as remotion_commit_sha,
                           r.status as render_status,r.progress as progress,
                           l.created_at as created_at
                    from episode_shot_render_lineage l
                    join remotion_render r on r.id=l.remotion_render_id
                    where l.episode_key=:episode and l.shot_key=:shot
                      and l.dependency_sha256=:hash
                      and coalesce(r.input_props->>'timingMode','PROVISIONAL_STORYBOARD')=:timing
                    order by l.created_at desc,l.id desc limit 1
                    """).param("episode",EPISODE).param("shot",shot).param("hash",signature)
                    .param("timing",cues.size()==5?"ELEVENLABS_CHARACTER_TIMESTAMPS":"PROVISIONAL_STORYBOARD")
                    .query((rs,n)->{
                        render.put("renderId",rs.getString("remotion_render_id"));
                        render.put("commitSha",rs.getString("remotion_commit_sha"));
                        String rawStatus=rs.getString("render_status");
                        render.put("status","RUNNING".equals(rawStatus)?"RENDERING":rawStatus);
                        render.put("progress",rs.getInt("progress"));
                        render.put("createdAt",rs.getObject("created_at",OffsetDateTime.class).toString());
                        return 1;
                    }).optional();
        }

        Map<String,Object> deps=new LinkedHashMap<>();
        deps.put("scriptRevision",script.revision());
        deps.put("narrationSha256",narrationHash);
        deps.put("preferredTakeId",chosen==null?null:chosen.id().toString());
        deps.put("visualSourceSha",VISUAL_SHA);
        deps.put("dependencySha256",signature);
        deps.put("renderReusable",Boolean.TRUE.equals("SUCCEEDED".equals(render.get("status"))));

        Map<String,Object> result=new LinkedHashMap<>();
        result.put("contractVersion","EPISODE_SHOT_PRODUCTION_V1");
        result.put("episodeKey",EPISODE);
        result.put("shotKey",shot);
        result.put("readOnly",true);
        result.put("status",chosen==null?"WAITING_FOR_PREFERRED_VOICE":
                measured==null?"WAITING_FOR_MEASURED_DURATION":
                sourceUnchanged?"READY_FOR_REMOTION_SCENE_CONTRACT":"READY_WITH_CUE_REVIEW");
        result.put("script",scriptResult);
        result.put("voice",voice);
        result.put("visual",visualResult);
        result.put("dependencies",deps);
        result.put("render",render);
        return result;
    }
}
