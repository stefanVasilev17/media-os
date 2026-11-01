package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EpisodeResearchAgentServiceTest {
    private final EpisodeWorkspaceService workspace = mock(EpisodeWorkspaceService.class);
    private final EpisodeLearningService learning = mock(EpisodeLearningService.class);
    private final EpisodeBuildAgentClient ai = mock(EpisodeBuildAgentClient.class);
    private final ShotPromptContextService firstPass = mock(ShotPromptContextService.class);
    private final AiRuntimePolicyService paid = mock(AiRuntimePolicyService.class);
    private final PreviewAuthorizationService tokens = mock(PreviewAuthorizationService.class);

    private EpisodeResearchAgentService agent(boolean enabled) {
        return new EpisodeResearchAgentService(workspace,learning,ai,firstPass,paid,tokens,
                new ObjectMapper(),enabled);
    }

    @Test
    void researchGenerationFailsClosedUntilFeatureIsEnabled() {
        UUID ep3=UUID.randomUUID();
        assertThrows(ResponseStatusException.class, () -> agent(false).preview(ep3,0));
        verifyNoInteractions(ai,paid,tokens);
    }

    @Test
    void episodeOneIsNeverUsedForScopedResearch() {
        assertThrows(ResponseStatusException.class, () ->
                agent(true).preview(ProductionOverviewService.EPISODE_ID,0));
        verifyNoInteractions(ai,paid,tokens);
    }

    @Test
    void briefValidationRejectsEmptyIdeaOrOversizedReferences() {
        assertThrows(ResponseStatusException.class,() ->
                EpisodeWorkspaceService.validatedBrief("short"));
        assertEquals("Explain Redis failures and recovery",
                EpisodeWorkspaceService.validatedBrief(" Explain Redis failures and recovery "));
        assertThrows(ResponseStatusException.class,() ->
                EpisodeWorkspaceService.validatedSources("x".repeat(12001)));
    }

    @Test
    void researchSourcesArePreservedAsUnverifiedDirectorLeads() {
        var truth = new EpisodeBuildAgentClient.TruthAudit(
                "Redis access fails before the login can complete.",
                "Application and cache","User","Auth Service",
                List.of("User","Auth Service","Redis"),
                List.of("Cache reachable?"),List.of("Session restore"),
                List.of("Session cache"),List.of("Redis"),List.of(
                    "User requests a session","Auth checks the cache","Cache times out"),
                List.of(),List.of("Error response"),List.of("Login delay"),
                List.of("Cache vendor implementation"),List.of("Cache is a dependency"),
                List.of("Payments"),List.of("Verify timeout policy"),
                List.of("Distinguish cache failure from credential failure"),0.6
        );
        UUID episode=UUID.randomUUID();
        var ready=new EpisodeResearchAgentService.Prepared(
                Map.of("id", episode),"Why Redis Fails","Explain Redis failure",
                "https://redis.io/docs/latest/",
                1,"fingerprint","Mandatory first-pass rules text",3,"payload",List.of(),
                List.of("https://redis.io/docs/latest/"));
        Map<String,Object> artifact=EpisodeResearchAgentService.researchArtifact(truth,ready);
        assertEquals("DIRECTOR_SUPPLIED_UNVERIFIED",artifact.get("technicalSourcesStatus"));
        assertEquals(1, ((List<?>)artifact.get("technicalSources")).size());
        assertEquals("Why Redis Fails",artifact.get("centralQuestion"));
        assertEquals(3,((List<?>)artifact.get("truthMap")).size());
        assertEquals(1,artifact.get("sourceBriefRevision"));
    }

    @Test
    void sourceCorrectionCannotModifyLockedLegacyEpisode() {
        assertThrows(ResponseStatusException.class,() ->
            agent(true).attachSources(ProductionOverviewService.EPISODE_ID,1,
                    "https://example.com",UUID.randomUUID()));
        verify(workspace,never()).draft(any(),any(),any(),any(),anyInt(),any());
    }
}
