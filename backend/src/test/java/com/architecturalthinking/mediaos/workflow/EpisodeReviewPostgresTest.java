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
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named="CI_POSTGRES_URL",matches=".+")
class EpisodeReviewPostgresTest {
    private static final String SHA="a".repeat(64);
    private static void auth(String subject){
        Jwt jwt=Jwt.withTokenValue("test").header("alg","none").claim("iss","https://review.test").subject(subject).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR"))));
    }
    private static EpisodeReviewService.Change draft(UUID id,int revision,String kind,String scope,String classification){
        return new EpisodeReviewService.Change(id,revision,"SAVE",kind,"VISUAL",scope,classification,
            "Keep labels readable","Check clearance at every camera pose.","Before the next SHOT","Director review evidence",null,null,null,null,null,true);
    }
    private static EpisodeReviewService.Change action(UUID id,int rev,String action){
        return new EpisodeReviewService.Change(id,rev,action,null,null,null,null,null,null,null,null,null,null,null,null,null,true);
    }
    @Test void ownerScopedImmutableHistoryAndApprovedCarryForward(){
        String url=System.getenv("CI_POSTGRES_URL"),schema="review_"+UUID.randomUUID().toString().replace("-","");
        var base=new DriverManagerDataSource(url,"media_os","media_os");
        var root=new JdbcTemplate(base);root.execute("create schema "+schema);
        try{
            var ds=new DriverManagerDataSource(url+(url.contains("?")?"&":"?")+"currentSchema="+schema,"media_os","media_os");
            var sql=new JdbcTemplate(ds);
            sql.execute("create table episode_package_import(id uuid primary key,episode_key text,shot_count int,director_issuer text,director_subject text)");
            sql.execute("create table episode_director_film(package_id uuid primary key,film_id uuid,sha256 text,duration_in_frames int,shot_count int,render_ids text)");
            sql.execute("create table episode_director_shot_lock(package_id uuid,shot_key text,render_id uuid)");
            UUID id=UUID.randomUUID(),next=UUID.randomUUID(),other=UUID.randomUUID(),film=UUID.randomUUID(),render=UUID.randomUUID(),item=UUID.randomUUID(),audit=UUID.randomUUID();
            for(var p:List.of(id,next,other))sql.update("insert into episode_package_import values(?,?,?,?,?)",p,p.equals(id)?"EP004":"EP005",1,"https://review.test",p.equals(other)?"other":"owner");
            sql.update("insert into episode_director_film values(?,?,?,?,?,?)",id,film,SHA,100,1,render.toString());
            sql.update("insert into episode_director_shot_lock values(?,?,?)",id,"SHOT01",render);
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V135__episode_review_learning.sql")).execute(ds);
            var p=mock(EpisodePublishingStudioService.class);
            var r=mock(EpisodeReelService.class);
            var d=mock(EpisodeDistributionService.class);
            when(p.get(id)).thenReturn(new EpisodePublishingStudioService.Studio(id,"EP004",new EpisodePublishingStudioService.Master(film,SHA,100,1,true),List.of(),List.of("QA_AUDIO: PENDING"),false,false,""));
            when(r.get(id)).thenReturn(new EpisodeReelService.View("EP004",new EpisodeReelService.Master(film,SHA,100,"/test"),List.of(),List.of(),null));
            when(d.get(id)).thenReturn(new EpisodeDistributionService.View("EP004",SHA,false,new EpisodeDistributionService.Launch(0,null,null),List.of(),List.of(),List.of()));
            var service=new EpisodeReviewService(JdbcClient.create(ds),p,r,d);
            var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
            auth("owner");
            assertEquals("PENDING",service.get(id).gates().stream().filter(g->g.name().equals("Reels")).findFirst().orElseThrow().status());
            assertThrows(ResponseStatusException.class,()->tx.execute(t->service.change(id,draft(item,0,"RULE","CHANNEL","PERMANENT_RULE"),null)));
            var first=tx.execute(t->service.change(id,draft(item,0,"RULE","CHANNEL","PERMANENT_RULE"),audit));
            assertEquals("DRAFT",first.items().getFirst().state());assertTrue(service.previous(next,null).isEmpty());
            assertThrows(ResponseStatusException.class,()->tx.execute(t->service.change(id,draft(item,0,"RULE","CHANNEL","PERMANENT_RULE"),audit)));
            var approved=tx.execute(t->service.change(id,action(item,1,"APPROVE"),audit));
            assertEquals("APPROVED",approved.items().getFirst().state());
            assertEquals(audit,approved.items().getFirst().auditId());assertEquals(2,service.history(id,item).size());
            assertEquals("EP004",service.previous(next,"VISUAL").getFirst().episodeKey());
            assertTrue(service.previous(next,"VOICE").isEmpty());
            var analytics=new EpisodeReviewService.Change(UUID.randomUUID(),0,"SAVE","ANALYTICS","AUDIENCE","EPISODE","OBSERVATION","Views","Observed","","Evidence","VIEWS",java.math.BigDecimal.ZERO,null,LocalDate.now(),LocalDate.now(),true);
            assertThrows(ResponseStatusException.class,()->tx.execute(t->service.change(id,analytics,audit)));
            UUID conclusion=UUID.randomUUID();
            var conclusionDraft=tx.execute(t->service.change(id,draft(conclusion,0,"CONCLUSION","EPISODE","OBSERVATION"),audit));
            var record=conclusionDraft.items().stream().filter(i->i.id().equals(conclusion)).findFirst().orElseThrow();
            assertTrue(record.contextSummary().contains("QA_AUDIO: PENDING"));
            assertEquals("APPROVED",tx.execute(t->service.change(id,action(conclusion,1,"APPROVE"),audit)).items().stream().filter(i->i.id().equals(conclusion)).findFirst().orElseThrow().state());
            tx.execute(t->service.change(id,action(item,2,"RETIRE"),audit));
            assertTrue(service.previous(next,"VISUAL").stream().noneMatch(x->x.item().id().equals(item)));
            auth("other");assertThrows(ResponseStatusException.class,()->service.get(id));assertTrue(service.previous(other,null).isEmpty());
            SecurityContextHolder.clearContext();assertThrows(ResponseStatusException.class,()->service.history(id,item));
        }finally{SecurityContextHolder.clearContext();root.execute("drop schema "+schema+" cascade");}
    }
}
