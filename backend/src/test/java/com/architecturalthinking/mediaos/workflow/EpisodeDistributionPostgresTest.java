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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="CI_POSTGRES_URL",matches=".+")
class EpisodeDistributionPostgresTest {
    private static final UUID ID=UUID.fromString("d11d02a2-b649-44c9-a022-4405149f675e");
    private static final UUID FILM=UUID.fromString("040d0fd7-ebb3-3b99-838a-005bc23122cd");
    private static final String SHA="d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c";
    private static void auth(String subject){
        Jwt jwt=Jwt.withTokenValue("test").header("alg","none").claim("iss","https://distribution.test").subject(subject).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR"))));
    }
    private static EpisodeDistributionService.Change action(EpisodeDistributionService.Item i,String action,boolean human,String url,LocalDate date){
        return new EpisodeDistributionService.Change(i.id(),i.revision(),action,null,null,null,null,null,null,null,null,
            "Test evidence: human author, facts, platform policy and rights reviewed.",true,true,true,true,human,url,date);
    }
    private static EpisodeDistributionService.Item get(EpisodeDistributionService.View v,UUID id){
        return v.items().stream().filter(i->i.id().equals(id)).findFirst().orElseThrow();
    }
    @Test void exactSeedAndManualReviewLifecycle(){
        String url=System.getenv("CI_POSTGRES_URL"),schema="distribution_"+UUID.randomUUID().toString().replace("-","");
        var base=new DriverManagerDataSource(url,"media_os","media_os");
        var root=new JdbcTemplate(base);root.execute("create schema "+schema);
        try{
            var ds=new DriverManagerDataSource(url+(url.contains("?")?"&":"?")+"currentSchema="+schema,"media_os","media_os");
            var sql=new JdbcTemplate(ds);
            sql.execute("create table episode_package_import(id uuid primary key,episode_key text,shot_count int,director_issuer text,director_subject text)");
            sql.execute("create table episode_director_film(package_id uuid primary key,film_id uuid,sha256 text,duration_in_frames int,shot_count int,render_ids text)");
            sql.execute("create table episode_director_shot_lock(package_id uuid,shot_key text,render_id uuid)");
            sql.execute("create table episode_publishing_revision(package_id uuid,field_key text,revision int,state text,master_sha256 text,recorded_at timestamptz default now())");
            UUID other=UUID.randomUUID(),render=UUID.randomUUID();
            sql.update("insert into episode_package_import values(?,?,?,?,?),(?,?,?,?,?)",ID,"EP004",1,"https://distribution.test","owner",other,"EP005",1,"https://distribution.test","other");
            sql.update("insert into episode_director_film values(?,?,?,?,?,?)",ID,FILM,SHA,100,1,render.toString());
            sql.update("insert into episode_director_shot_lock values(?,?,?)",ID,"SHOT01",render);
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V134__distribution_editorial_studio.sql")).execute(ds);
            var service=new EpisodeDistributionService(JdbcClient.create(ds));
            var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
            auth("owner");var v=service.get(ID);
            assertEquals(12,v.items().size());
            assertEquals(5,v.items().stream().filter(i->i.kind().equals("ARTICLE")).count());
            assertEquals(2,v.items().stream().filter(i->i.platform().equals("MEDIUM")).count());
            assertTrue(v.items().stream().allMatch(i->i.state().equals("DRAFT")&&i.publishedUrl()==null));
            assertEquals(SHA,v.masterSha256());assertFalse(v.editorialQa());
            var medium=v.items().stream().filter(i->i.platform().equals("MEDIUM")).findFirst().orElseThrow();
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.change(ID,action(medium,"APPROVE",true,null,null))));
            sql.update("insert into episode_publishing_revision(package_id,field_key,revision,state,master_sha256) values(?,?,?,?,?),(?,?,?,?,?)",
                ID,"QA_EDITORIAL",1,"PASS",SHA,ID,"QA_RIGHTS",1,"PASS",SHA);
            assertTrue(service.get(ID).editorialQa());
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.change(ID,action(medium,"APPROVE",true,null,null))));
            var draft=tx.execute(s->service.change(ID,new EpisodeDistributionService.Change(null,0,"SAVE","HASHNODE","ARTICLE","Test article",
                "A substantive example. ".repeat(110),"https://sre.google/sre-book/handling-overload/","","Test destination",0,
                null,true,false,false,false,false,null,null)));
            var added=draft.items().stream().filter(i->i.title().equals("Test article")).findFirst().orElseThrow();
            var approved=get(tx.execute(s->service.change(ID,action(added,"APPROVE",false,null,null))),added.id());
            assertEquals("APPROVED",approved.state());
            var ready=get(tx.execute(s->service.change(ID,action(approved,"READY",false,null,null))),added.id());
            assertEquals("READY_TO_PUBLISH",ready.state());
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.change(ID,action(ready,"PUBLISH",false,"javascript:alert(1)",LocalDate.now()))));
            var published=get(tx.execute(s->service.change(ID,action(ready,"PUBLISH",false,"https://example.com/test",LocalDate.now()))),added.id());
            assertEquals("PUBLISHED",published.state());
            assertEquals(4,service.history(ID,added.id()).size());
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.change(ID,action(published,"SKIP",false,null,null))));
            assertThrows(ResponseStatusException.class,()->tx.execute(s->service.recordLaunch(ID,new EpisodeDistributionService.LaunchChange(0,"https://example.com/watch?v=abc",LocalDate.now(),true))));
            var launch=tx.execute(s->service.recordLaunch(ID,new EpisodeDistributionService.LaunchChange(0,null,LocalDate.now().plusDays(1),true)));
            assertEquals(1,launch.launch().revision());assertNull(launch.launch().videoUrl());
            auth("other");assertThrows(ResponseStatusException.class,()->service.get(ID));assertTrue(service.get(other).items().isEmpty());
            SecurityContextHolder.clearContext();assertThrows(ResponseStatusException.class,()->service.get(ID));
        }finally{SecurityContextHolder.clearContext();root.execute("drop schema "+schema+" cascade");}
    }
}
