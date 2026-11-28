package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="CI_POSTGRES_URL",matches=".+")
class EpisodePublishingStudioPostgresTest {
    private static final UUID EP004=UUID.fromString("d11d02a2-b649-44c9-a022-4405149f675e");
    private static final UUID FILM=UUID.fromString("040d0fd7-ebb3-3b99-838a-005bc23122cd");
    private static final String SHA="d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c";

    private static void authenticate(String subject){
        Jwt jwt=Jwt.withTokenValue("test").header("alg","none")
            .claim("iss","https://publishing.test").subject(subject).build();
        SecurityContextHolder.getContext().setAuthentication(
            new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR"))));
    }
    private static EpisodePublishingStudioService.Item item(EpisodePublishingStudioService.Studio s,String key){
        return s.items().stream().filter(x->x.fieldKey().equals(key)).findFirst().orElseThrow();
    }
    @Test void exactSeedAndImmutableDirectorRevisionsWithRealPostgres() throws Exception{
        String url=System.getenv("CI_POSTGRES_URL"),schema="publishing_"+UUID.randomUUID().toString().replace("-","");
        var base=new DriverManagerDataSource(url,"media_os","media_os");
        var root=new JdbcTemplate(base);
        root.execute("create schema "+schema);
        try{
            var ds=new DriverManagerDataSource(url+(url.contains("?")?"&":"?")+"currentSchema="+schema,
                "media_os","media_os");
            var sql=new JdbcTemplate(ds);
            var jdbc=JdbcClient.create(ds);
            sql.execute("create table episode_package_import(id uuid primary key, episode_key text not null, shot_count integer not null, director_issuer text not null, director_subject text not null)");
            sql.execute("create table episode_director_film(package_id uuid primary key references episode_package_import(id), film_id uuid not null, sha256 varchar(64) not null, duration_in_frames int not null, shot_count int not null, render_ids text not null)");
            sql.execute("create table episode_director_shot_lock(package_id uuid not null, shot_key text not null, render_id uuid not null, primary key(package_id,shot_key))");
            sql.update("insert into episode_package_import values(?,?,?,?,?)",EP004,"EP004",15,"https://publishing.test","director");
            UUID other=UUID.randomUUID();
            sql.update("insert into episode_package_import values(?,?,?,?,?)",other,"EP005",15,"https://publishing.test","other");
            List<String> renderIds=new ArrayList<>();
            for(int i=1;i<=15;i++){
                UUID id=UUID.randomUUID();renderIds.add(id.toString());
                sql.update("insert into episode_director_shot_lock values(?,?,?)",EP004,String.format("SHOT%02d",i),id);
            }
            sql.update("insert into episode_director_film values(?,?,?,?,?,?)",EP004,FILM,SHA,34651,15,String.join(",",renderIds));
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V132__episode_publishing_studio.sql")).execute(ds);
            sql.execute(new ClassPathResource("db/migration/V136__publishing_thumbnail_webp.sql").getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
            assertEquals(20,sql.queryForObject("select count(*) from episode_publishing_revision where package_id=?",Integer.class,EP004));
            assertEquals(0,sql.queryForObject("select count(*) from episode_publishing_revision where package_id=?",Integer.class,other));
            var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
            try(var store=new MediaObjectStore(false,false,"","","auto","","")){
                var studio=new EpisodePublishingStudioService(jdbc,store);
                authenticate("director");
                var seeded=studio.get(EP004);
                assertTrue(seeded.master().complete());
                assertEquals(SHA,seeded.master().sha256());
                assertEquals("Why Microsoft 365 Went Down — And Why Failover Made It Worse",item(seeded,"TITLE").value());
                assertEquals("APPROVED",item(seeded,"TITLE").state());
                assertEquals("DRAFT",item(seeded,"TRANSCRIPT").state());
                assertTrue(item(seeded,"TRANSCRIPT").value().length()>10000);
                assertTrue(item(seeded,"SUBTITLES_SRT").value().isBlank());
                assertEquals(15,item(seeded,"CHAPTERS").value().lines().count());
                assertTrue(seeded.assembledDescription().length()<=5000);
                assertFalse(seeded.readyForDirectorRelease());
                assertFalse(seeded.releaseRecorded());
                assertThrows(ResponseStatusException.class,()->studio.get(other));
                assertThrows(ResponseStatusException.class,()->tx.execute(s->studio.change(EP004,"TITLE",
                    new EpisodePublishingStudioService.Change(0,"SAVE","New title",true))));
                assertThrows(ResponseStatusException.class,()->tx.execute(s->studio.change(EP004,"TITLE",
                    new EpisodePublishingStudioService.Change(1,"SAVE","New title",false))));
                var revised=tx.execute(s->studio.change(EP004,"TITLE",
                    new EpisodePublishingStudioService.Change(1,"SAVE","New title",true)));
                assertEquals("DRAFT",item(revised,"TITLE").state());
                assertEquals(2,item(revised,"TITLE").revision());
                var approved=tx.execute(s->studio.change(EP004,"TITLE",
                    new EpisodePublishingStudioService.Change(2,"APPROVE","New title",true)));
                assertEquals(3,item(approved,"TITLE").revision());
                assertEquals("APPROVED",item(approved,"TITLE").state());
                assertEquals("Why Microsoft 365 Went Down — And Why Failover Made It Worse",studio.history(EP004,"TITLE").get(2).value());
                assertThrows(ResponseStatusException.class,()->tx.execute(s->studio.change(EP004,"QA_RELEASE",
                    new EpisodePublishingStudioService.Change(1,"PASS","Director release evidence",true))));
                assertThrows(ResponseStatusException.class,()->tx.execute(s->studio.change(EP004,"QA_CAPTIONS",
                    new EpisodePublishingStudioService.Change(1,"PASS","Caption evidence not yet verified",true))));
                var masterQa=tx.execute(s->studio.change(EP004,"QA_MASTER",
                    new EpisodePublishingStudioService.Change(1,"PASS","Director checked complete playback.",true)));
                assertEquals("PASS",item(masterQa,"QA_MASTER").state());
                assertFalse(masterQa.readyForDirectorRelease());
                sql.update("update episode_director_film set sha256=? where package_id=?","b".repeat(64),EP004);
                assertTrue(studio.get(EP004).blockers().contains("TITLE: master version changed"));
                // The exact approved design hash still rejects a different file.
                byte[] webp=java.util.Base64.getDecoder().decode("UklGRi4AAABXRUJQVlA4TCEAAAAvf8JZAAfQpWKUq/8BIUHi//FWIvqf8Z///Oc///nP/wsA");
                var mismatch=assertThrows(ResponseStatusException.class,()->tx.execute(t->studio.uploadThumbnail(EP004,0,true,webp)));
                assertTrue(mismatch.getReason().contains("exact approved thumbnail design hash"));
                assertEquals(0,item(studio.get(EP004),"THUMBNAIL_ASSET").revision());
                // Exercise the new DB constraint without altering the approved seed or production data.
                String hash=MediaObjectStore.sha256(webp);
                String key=MediaObjectStore.publishingThumbnailKey(other,hash,"image/webp");
                sql.update("insert into episode_publishing_revision(package_id,field_key,revision,field_value,state,origin,object_key,object_sha256,object_bytes,object_type) values(?,?,?,?,?,?,?,?,?,?)",
                    other,"THUMBNAIL_ASSET",1,"synthetic fixture","DRAFT","CI_ONLY",key,hash,webp.length,"image/webp");
                assertEquals("image/webp",sql.queryForObject("select object_type from episode_publishing_revision where package_id=?",String.class,other));
                assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->sql.update("update episode_publishing_revision set object_type='image/svg+xml' where package_id=?",other));
                sql.update("delete from episode_publishing_revision where package_id=?",other);
                authenticate("other");
                assertThrows(ResponseStatusException.class,()->studio.get(EP004));
                assertTrue(studio.get(other).items().stream().allMatch(x->x.revision()==0));
                SecurityContextHolder.clearContext();
                assertThrows(ResponseStatusException.class,()->studio.get(EP004));
            }
        }finally{
            SecurityContextHolder.clearContext();
            root.execute("drop schema "+schema+" cascade");
        }
    }
}
