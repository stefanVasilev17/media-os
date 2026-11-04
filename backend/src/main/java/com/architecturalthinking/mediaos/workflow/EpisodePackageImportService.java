package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodePackageImportService {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final EpisodePackageValidator validator;

    public EpisodePackageImportService(JdbcClient jdbc,ObjectMapper mapper,
                                       EpisodePackageValidator validator) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.validator=validator;
    }

    public record ImportRequest(UUID requestId,String fileName,String sourceText,
                                String expectedSha256,Boolean confirmSourceImport) {}

    public record ImportedShot(String shotKey,int shotIndex,String title,
                               int editorialSeconds,String narration,String voiceDirection,
                               JsonNode visualStory,String voiceTaskStatus) {}

    public record ImportedEpisode(UUID packageId,String episodeKey,String title,String status,
                                  String schemaVersion,String sourceSha256,String sourceFileName,
                                  int shotCount,int beatCount,String importedAt,
                                  List<ImportedShot> shots) {}

    static void requireConfirmed(Boolean confirmation) {
        if(!Boolean.TRUE.equals(confirmation))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Confirm source-only import. It creates no paid voice or AI execution.");
    }

    public List<Map<String,Object>> list() {
        DirectorIdentity.Actor director=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select id,episode_key,title,status,shot_count,beat_count,source_sha256,imported_at::text
                  from episode_package_import
                 where director_issuer=:issuer and director_subject=:subject
                 order by imported_at desc,id desc
                 limit 50
                """).param("issuer",director.issuer()).param("subject",director.subject())
                .query((rs,n)->Map.<String,Object>of(
                        "packageId",rs.getObject("id",UUID.class).toString(),
                        "episodeKey",rs.getString("episode_key"),
                        "title",rs.getString("title"),
                        "status",rs.getString("status"),
                        "shotCount",rs.getInt("shot_count"),
                        "beatCount",rs.getInt("beat_count"),
                        "sourceSha256",rs.getString("source_sha256"),
                        "importedAt",rs.getString("imported_at")
                )).list();
    }

    public ImportedEpisode get(UUID id) {
        DirectorIdentity.Actor director=DirectorIdentity.requireDirector();
        return load(id,director);
    }

    @Transactional
    public ImportedEpisode importFile(ImportRequest request,UUID preflightAuditId) {
        DirectorIdentity.Actor director=DirectorIdentity.requireDirector();
        if(preflightAuditId==null || request==null || request.requestId()==null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A valid audited Director import request ID is required.");
        requireConfirmed(request.confirmSourceImport());

        EpisodePackageValidator.Validated validated=validator.validate(
                request.fileName(),request.sourceText(),request.expectedSha256());

        UUID prior=jdbc.sql("""
                select id from episode_package_import where request_id=:request
                """).param("request",request.requestId())
                .query(UUID.class).optional().orElse(null);
        if(prior!=null)
            return verifiedReplay(prior,validated,director);

        boolean claimed=jdbc.sql("""
                select exists(select 1 from episode
                    where project_id=:project and episode_number=:episode)
                """)
                .param("project",ProductionOverviewService.PROJECT_ID)
                .param("episode",validated.episodeKey())
                .query(Boolean.class).single();
        if(claimed) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Episode already exists in the legacy/native workspace. Import never overwrites it.");

        UUID id=UUID.randomUUID();
        int inserted=jdbc.sql("""
                insert into episode_package_import(
                    id,request_id,episode_key,title,schema_version,
                    source_file_name,source_sha256,original_source_text,source_document,
                    shot_count,beat_count,director_issuer,director_subject
                ) values(
                    :id,:request,:episode,:title,:schema,:file,:hash,:original,
                    cast(:json as jsonb),:shots,:beats,:issuer,:subject
                ) on conflict (request_id) do nothing
                """)
                .param("id",id)
                .param("request",request.requestId())
                .param("episode",validated.episodeKey())
                .param("title",validated.title())
                .param("schema",EpisodePackageValidator.VERSION)
                .param("file",request.fileName())
                .param("hash",validated.sha256())
                .param("original",request.sourceText())
                .param("json",canonicalJson(validated.document()))
                .param("shots",validated.shotCount())
                .param("beats",validated.beatCount())
                .param("issuer",director.issuer())
                .param("subject",director.subject())
                .update();

        if(inserted==0) {
            UUID existing=jdbc.sql("""
                    select id from episode_package_import where request_id=:request
                    """).param("request",request.requestId())
                    .query(UUID.class).optional().orElseThrow(()->new ResponseStatusException(
                            HttpStatus.CONFLICT,"Episode Package already imported or reserved."));
            return verifiedReplay(existing,validated,director);
        }

        int index=0;
        for(JsonNode shot:validated.document().path("shots")) {
            index++;
            jdbc.sql("""
                    insert into episode_package_shot(
                        id,package_id,shot_key,shot_index,title,
                        original_narration,original_voice_direction,
                        original_visual_story,editorial_seconds,voice_task_status
                    ) values(
                        :id,:package,:key,:index,:title,:narration,:direction,
                        cast(:visual as jsonb),:seconds,'PENDING_VOICE'
                    )
                    """)
                    .param("id",UUID.randomUUID())
                    .param("package",id)
                    .param("key",shot.path("shotKey").asText())
                    .param("index",index)
                    .param("title",shot.path("title").asText())
                    .param("narration",shot.path("narration").asText())
                    .param("direction",shot.path("voiceDirection").asText())
                    .param("visual",canonicalJson(shot))
                    .param("seconds",shot.path("editorialDurationSeconds").asInt())
                    .update();
        }
        return load(id,director);
    }

    private ImportedEpisode verifiedReplay(UUID packageId,
                                           EpisodePackageValidator.Validated validated,
                                           DirectorIdentity.Actor director) {
        ImportedEpisode stored=load(packageId,director);
        if(!stored.episodeKey().equals(validated.episodeKey())
                || !stored.sourceSha256().equals(validated.sha256()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request ID was already used for another Episode Package.");
        return stored;
    }

    private ImportedEpisode load(UUID id,DirectorIdentity.Actor director) {
        ImportedEpisode source=jdbc.sql("""
                select id,episode_key,title,status,schema_version,source_sha256,
                       source_file_name,shot_count,beat_count,imported_at::text
                  from episode_package_import
                 where id=:id and director_issuer=:issuer and director_subject=:subject
                """).param("id",id).param("issuer",director.issuer())
                .param("subject",director.subject())
                .query((rs,n)->new ImportedEpisode(
                        rs.getObject("id",UUID.class),rs.getString("episode_key"),
                        rs.getString("title"),rs.getString("status"),
                        rs.getString("schema_version"),rs.getString("source_sha256"),
                        rs.getString("source_file_name"),rs.getInt("shot_count"),
                        rs.getInt("beat_count"),rs.getString("imported_at"),List.of()))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Episode package not found for this Director."));

        List<ImportedShot> shots=jdbc.sql("""
                select shot_key,shot_index,title,editorial_seconds,
                       original_narration,original_voice_direction,
                       original_visual_story::text,voice_task_status
                  from episode_package_shot where package_id=:package
                 order by shot_index
                """).param("package",id).query((rs,n)->new ImportedShot(
                        rs.getString("shot_key"),rs.getInt("shot_index"),
                        rs.getString("title"),rs.getInt("editorial_seconds"),
                        rs.getString("original_narration"),
                        rs.getString("original_voice_direction"),
                        parseJson(rs.getString("original_visual_story")),
                        rs.getString("voice_task_status")
                )).list();

        if(shots.size()!=source.shotCount())
            throw new IllegalStateException("Imported Episode has incomplete SHOT records.");
        return new ImportedEpisode(source.packageId(),source.episodeKey(),
                source.title(),source.status(),source.schemaVersion(),
                source.sourceSha256(),source.sourceFileName(),source.shotCount(),
                source.beatCount(),source.importedAt(),shots);
    }

    private JsonNode parseJson(String raw) {
        try{return mapper.readTree(raw);}
        catch(JsonProcessingException ex){throw new IllegalStateException("Stored visual plan is malformed.",ex);}
    }

    private String canonicalJson(JsonNode node) {
        try{return mapper.writeValueAsString(node);}
        catch(JsonProcessingException ex){throw new IllegalStateException("Could not store validated Episode Package.",ex);}
    }
}
