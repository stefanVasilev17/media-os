package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named="CI_POSTGRES_URL",matches=".+")
class EpisodeReelPostgresTest {
    private static void auth(String subject){
        Jwt jwt=Jwt.withTokenValue("test").header("alg","none").claim("iss","https://reels.test").subject(subject).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR"))));
    }
    @Test void exactMasterCandidatesAndAuditedIdempotentQueue() {
        String url=System.getenv("CI_POSTGRES_URL"),schema="reels_"+UUID.randomUUID().toString().replace("-","");
        var base=new DriverManagerDataSource(url,"media_os","media_os");
        var root=new JdbcTemplate(base);root.execute("create schema "+schema);
        try{
            var ds=new DriverManagerDataSource(url+(url.contains("?")?"&":"?")+"currentSchema="+schema,"media_os","media_os");
            var sql=new JdbcTemplate(ds);
            sql.execute("create table episode_package_import(id uuid primary key,episode_key text,shot_count int,director_issuer text,director_subject text)");
            sql.execute("create table episode_director_film(package_id uuid primary key,film_id uuid,sha256 text,object_key text,byte_count bigint,duration_in_frames int,shot_count int,render_ids text)");
            sql.execute("create table episode_director_shot_lock(package_id uuid,shot_key text,render_id uuid)");
            sql.execute("create table episode_package_shot(package_id uuid,shot_key text,title text)");
            sql.execute("create table remotion_render(id uuid primary key,duration_in_frames int,status text,fps int,input_props jsonb default '{}'::jsonb)");
            UUID id=UUID.randomUUID(),film=UUID.randomUUID(),a=UUID.randomUUID(),b=UUID.randomUUID();
            String sha="a".repeat(64),key=MediaObjectStore.videoKey(film);
            sql.update("insert into episode_package_import values(?,?,?,?,?)",id,"EP004",2,"https://reels.test","owner");
            sql.update("insert into episode_director_film values(?,?,?,?,?,?,?,?)",id,film,sha,key,5000L,210,2,a+","+b);
            sql.update("insert into episode_director_shot_lock values(?,?,?),(?,?,?)",id,"SHOT01",a,id,"SHOT02",b);
            sql.update("insert into episode_package_shot values(?,?,?),(?,?,?)",id,"SHOT01","First",id,"SHOT02","Second");
            sql.update("insert into remotion_render(id,duration_in_frames,status,fps) values(?,?,?,?),(?,?,?,?)",a,90,"SUCCEEDED",30,b,120,"SUCCEEDED",30);
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V133__direct_episode_reels.sql"),new ClassPathResource("db/migration/V137__vertical_reel_packaging.sql"),new ClassPathResource("db/migration/V138__vertical_reel_v2.sql")).execute(ds);
            MediaObjectStore store=mock(MediaObjectStore.class);
            var service=new EpisodeReelService(JdbcClient.create(ds),store);
            var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
            auth("owner");var view=service.get(id);
            assertEquals(210,view.master().frames());
            assertEquals(2,view.candidates().size());
            assertEquals(90,view.candidates().getFirst().startFrame());
            assertTrue(view.candidates().getFirst().recommended());
            var request=new EpisodeReelService.Extract(sha,90,210,"A real candidate",true);
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.extract(id,request,null)));
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.extract(id,new EpisodeReelService.Extract("b".repeat(64),90,210,"Stale",true),UUID.randomUUID())));
            var queued=tx.execute(s->service.extract(id,request,UUID.randomUUID()));
            assertEquals("QUEUED",queued.reels().getFirst().state());
            assertNull(queued.reels().getFirst().videoUrl());
            assertEquals(1,tx.execute(s->service.extract(id,request,UUID.randomUUID())).reels().size());
            assertThrows(ResponseStatusException.class,()->service.authorizedMedia(id,queued.reels().getFirst().id()));
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.lock(id,queued.reels().getFirst().id(),new EpisodeReelService.Lock(sha,true))));
            UUID reel=queued.reels().getFirst().id();
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.packageVertical(id,reel,new EpisodeReelService.PackageVertical(sha,true),UUID.randomUUID())));
            sql.update("update episode_reel set state='LOCKED',locked_at=now(),object_key=?,sha256=?,byte_count=5000,method='TECHNICAL_ENCODE' where id=?",key,sha,reel);
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.packageVertical(id,reel,new EpisodeReelService.PackageVertical(sha,true),null)));
            sql.update("insert into episode_reel_vertical(reel_id,source_sha256,template_version,state,audit_id,actor,object_key,sha256,byte_count) values(?,?,\'AT_VERTICAL_V1\',\'READY\',?,?,?, ?,5000)",reel,sha,UUID.randomUUID(),"owner",key,"c".repeat(64));
            var packed=tx.execute(s->service.packageVertical(id,reel,new EpisodeReelService.PackageVertical(sha,true),UUID.randomUUID()));
            assertEquals(2,packed.size());
            var v2=packed.stream().filter(v->v.templateVersion().equals("AT_VERTICAL_V2")).findFirst().orElseThrow();
            assertEquals("QUEUED",v2.state());assertNull(v2.videoUrl());assertNull(v2.focusStartFrame());
            assertEquals("READY",packed.stream().filter(v->v.templateVersion().equals("AT_VERTICAL_V1")).findFirst().orElseThrow().state());
            assertEquals(2,tx.execute(s->service.packageVertical(id,reel,new EpisodeReelService.PackageVertical(sha,true),UUID.randomUUID())).size());
            assertEquals("LOCKED",service.get(id).reels().getFirst().state());
            assertThrows(ResponseStatusException.class,()->service.authorizedVerticalMedia(id,reel,"AT_VERTICAL_V2"));
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.lockVertical(id,reel,new EpisodeReelService.Lock(sha,true))));
            // Registered geometry must be bound to the exact locked shot and true clip offset.
            UUID shot07=UUID.fromString("c51cbbda-f832-4c46-8a37-cc3116f50e1f");
            sql.update("insert into remotion_render(id,duration_in_frames,status,fps,input_props) values(?,2606,'SUCCEEDED',30,cast(? as jsonb))",shot07,
                "{\"expectedSourceCommit\":\"232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56\",\"eventFrames\":{\"REEL_START\":1368}}");
            sql.update("insert into episode_director_shot_lock values(?,?,?)",id,"SHOT07",shot07);
            sql.update("update episode_package_import set shot_count=3 where id=?",id);
            sql.update("update episode_director_film set duration_in_frames=2816,shot_count=3,render_ids=? where package_id=?",a+","+b+","+shot07,id);
            var shotClip=new EpisodeReelService.VerticalSource(reel,id,"Focus",2546,key,sha,5000L,270,2816);
            assertEquals(1308,service.verifiedFocusStart(shotClip));
            var compactOnly=new EpisodeReelService.VerticalSource(reel,id,"Focus",100,key,sha,5000L,1600,1700);
            assertEquals(0,service.verifiedFocusStart(compactOnly));
            var wideOnly=new EpisodeReelService.VerticalSource(reel,id,"Wide",100,key,sha,5000L,270,370);
            assertNull(service.verifiedFocusStart(wideOnly));
            sql.update("update remotion_render set input_props='{}'::jsonb where id=?",shot07);
            assertNull(service.verifiedFocusStart(shotClip));
            auth("other");
            assertThrows(ResponseStatusException.class,()->service.vertical(id));
            assertThrows(ResponseStatusException.class,()->service.get(id));
            SecurityContextHolder.clearContext();assertThrows(ResponseStatusException.class,()->service.get(id));
        }finally{SecurityContextHolder.clearContext();root.execute("drop schema "+schema+" cascade");}
    }
}
