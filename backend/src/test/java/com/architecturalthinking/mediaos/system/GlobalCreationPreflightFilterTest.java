package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GlobalCreationPreflightFilterTest {

    private final ProductionMemoryService memory = mock(ProductionMemoryService.class);
    private final GlobalCreationPreflightFilter filter = new GlobalCreationPreflightFilter(memory, new ObjectMapper());

    @BeforeEach
    void singleEpisodeFixture() {
        when(memory.hasSingleEpisode()).thenReturn(true);
    }


    @Test
    void blocksWritesWhenCanonicalRulesAreUnavailable() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/studio/shots");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(memory.preflight(eq("VOICE"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Missing production memory"));
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("GLOBAL_CREATION_PREFLIGHT_BLOCKED");
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    void passesAuditContextIntoAuthorizedCreation() throws Exception {
        UUID audit = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/remotion/renders/compositions/EP001");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(memory.preflight(eq("VISUAL"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId", audit, "status", "CONTEXT_READY"));
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isSameAs(request);
        assertThat(response.getHeader("X-MediaOS-Preflight")).isEqualTo(audit.toString());
        assertThat(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT")).isNotNull();
    }

    @Test
    void rejectsCrossEpisodeWritesInsteadOfUsingEp001MemoryForEp002() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/creative/script/generate");
        request.addHeader("X-MediaOS-Episode-Id", UUID.randomUUID().toString());
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("cross-episode");
        verifyNoInteractions(memory);
    }

    @Test
    void blocksAmbiguousCreationWhenMultipleEpisodesExist() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/creative/script/generate");
        when(memory.hasSingleEpisode()).thenReturn(false);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("Ambiguous episode routing");
        assertThat(chain.getRequest()).isNull();
        verify(memory, never()).preflight(any(), any(), any());
    }

    @Test
    void operationalHeartbeatAndProgressDoNotFloodAuditTable() throws Exception {
        for (String uri : new String[]{
                "/api/v1/worker/runner/heartbeat",
                "/api/v1/remotion/renders/worker/claim",
                "/api/v1/remotion/renders/worker/factory-capability",
                "/api/v1/remotion/renders/worker/abcd/progress",
                "/api/v1/worker/spline/jobs/abcd/started"
        }) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
            MockFilterChain chain = new MockFilterChain();
            filter.doFilter(request, new MockHttpServletResponse(), chain);
            assertThat(chain.getRequest()).isSameAs(request);
        }
        verify(memory, never()).preflight(any(), any(), any());
    }

    @Test
    void episodePathCanCreateUsingOnlyThatEpisodesMemory() throws Exception {
        UUID episode2 = UUID.fromString("33333333-3333-4333-8333-333333333333");
        UUID audit = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/episodes/" + episode2 + "/stages/research/draft");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(memory.preflight(eq("ALL"), any(), eq(episode2)))
                .thenReturn(Map.of("auditId", audit, "status", "CONTEXT_READY"));

        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isSameAs(request);
        verify(memory).preflight(eq("ALL"), any(), eq(episode2));
        assertThat(response.getHeader("X-MediaOS-Preflight")).isEqualTo(audit.toString());
    }

    @Test
    void episodeHeaderCannotOverrideEpisodeUrlIdentity() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/episodes/33333333-3333-4333-8333-333333333333/memory");
        request.addHeader("X-MediaOS-Episode-Id", ProductionOverviewService.EPISODE_ID.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("disagree");
        assertThat(chain.getRequest()).isNull();
        verify(memory, never()).preflight(any(), any(), any());
    }

    @Test
    void malformedEpisodePathIsRejectedBeforeAnyWrite() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST",
                "/api/v1/episodes/not-a-uuid/stages/script/draft");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        assertThat(response.getStatus()).isEqualTo(400);
        verify(memory, never()).preflight(any(), any(), any());
    }

    @Test
    void episodeCatalogCreationPreflightsAtProjectAnchorEvenWithMultipleEpisodes() throws Exception {
        when(memory.hasSingleEpisode()).thenReturn(false);
        UUID audit = UUID.randomUUID();
        when(memory.preflight(eq("ALL"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId", audit));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/episodes");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isSameAs(request);
        verify(memory).preflight(eq("ALL"), any(), eq(ProductionOverviewService.EPISODE_ID));
    }

    @Test
    void approvedVoiceCueReviewUsesRealDirectorPreflightWithoutCrossEpisodeSpoofing() throws Exception {
        when(memory.hasSingleEpisode()).thenReturn(false);
        UUID audit=UUID.randomUUID();
        when(memory.preflight(eq("ALL"),any(),eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId",audit));

        MockHttpServletRequest legitimate=new MockHttpServletRequest(
                "POST","/api/v1/creative/episodes/EP002/voice-cue-review/SHOT02");
        MockHttpServletResponse accepted=new MockHttpServletResponse();
        MockFilterChain chain=new MockFilterChain();
        filter.doFilter(legitimate,accepted,chain);
        assertThat(chain.getRequest()).isSameAs(legitimate);
        assertThat(accepted.getHeader("X-MediaOS-Preflight")).isEqualTo(audit.toString());

        MockHttpServletRequest forged=new MockHttpServletRequest(
                "POST","/api/v1/creative/episodes/EP002/voice-cue-review/SHOT02");
        forged.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
        MockHttpServletResponse rejected=new MockHttpServletResponse();
        filter.doFilter(forged,rejected,new MockFilterChain());
        assertThat(rejected.getStatus()).isEqualTo(409);
    }

    @Test
    void independentVerificationAndAutopilotWritesNeedProjectAudit() throws Exception {
        when(memory.hasSingleEpisode()).thenReturn(false);
        UUID audit=UUID.randomUUID();
        when(memory.preflight(eq("ALL"),any(),eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId",audit));
        String[] paths={
                "/api/v1/verification/runs",
                "/api/v1/verification/automation/arm",
                "/api/v1/verification/automation/pause",
                "/api/v1/verification/runs/12345678-1234-4123-8123-123456789abc/cancel"
        };
        for(String path:paths) {
            MockHttpServletRequest normal=new MockHttpServletRequest("POST",path);
            MockHttpServletResponse response=new MockHttpServletResponse();
            MockFilterChain chain=new MockFilterChain();
            filter.doFilter(normal,response,chain);
            assertThat(chain.getRequest()).isSameAs(normal);
            assertThat(response.getHeader("X-MediaOS-Preflight"))
                    .isEqualTo(audit.toString());

            MockHttpServletRequest forged=new MockHttpServletRequest("POST",path);
            forged.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
            MockHttpServletResponse rejected=new MockHttpServletResponse();
            filter.doFilter(forged,rejected,new MockFilterChain());
            assertThat(rejected.getStatus()).isEqualTo(409);
        }
    }

    @Test
    void authenticatedWorkerVerificationContinuationSkipsEpisodePreflight() throws Exception {
        for(String path:new String[]{
                "/api/v1/worker/verification/claim",
                "/api/v1/worker/verification/12345678-1234-4123-8123-123456789abc/complete"}) {
            MockHttpServletRequest request=new MockHttpServletRequest("POST",path);
            MockFilterChain chain=new MockFilterChain();
            filter.doFilter(request,new MockHttpServletResponse(),chain);
            assertThat(chain.getRequest()).isSameAs(request);
        }
    }

    @Test
    void codexAutomationRequiresRealAuditedProjectContextAndRejectsEpisodeSpoofing() throws Exception {
        when(memory.hasSingleEpisode()).thenReturn(false);
        UUID audit=UUID.randomUUID();
        when(memory.preflight(eq("ALL"),any(),eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId",audit));

        for(String action:new String[]{"arm","pause","resume"}) {
            MockHttpServletRequest legitimate=new MockHttpServletRequest(
                    "POST","/api/v1/creative/episodes/EP002/codex-automation/"+action);
            MockHttpServletResponse response=new MockHttpServletResponse();
            MockFilterChain chain=new MockFilterChain();
            filter.doFilter(legitimate,response,chain);
            assertThat(chain.getRequest()).isSameAs(legitimate);
            assertThat(response.getHeader("X-MediaOS-Preflight")).isEqualTo(audit.toString());

            MockHttpServletRequest forged=new MockHttpServletRequest(
                    "POST","/api/v1/creative/episodes/EP002/codex-automation/"+action);
            forged.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
            MockHttpServletResponse denied=new MockHttpServletResponse();
            filter.doFilter(forged,denied,new MockFilterChain());
            assertThat(denied.getStatus()).isEqualTo(409);
        }
    }

    @Test
    void ep002VisualFeedbackReceivesProjectAuditedPreflightEvenWithMultipleEpisodes() throws Exception {
        when(memory.hasSingleEpisode()).thenReturn(false);
        UUID audit=UUID.randomUUID();
        when(memory.preflight(eq("ALL"),any(),eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId",audit));
        MockHttpServletRequest request=new MockHttpServletRequest(
                "POST","/api/v1/creative/episodes/EP002/visual-feedback");
        MockHttpServletResponse response=new MockHttpServletResponse();
        MockFilterChain chain=new MockFilterChain();

        filter.doFilter(request,response,chain);

        assertThat(chain.getRequest()).isSameAs(request);
        assertThat(response.getHeader("X-MediaOS-Preflight")).isEqualTo(audit.toString());
        verify(memory).preflight(eq("ALL"),any(),eq(ProductionOverviewService.EPISODE_ID));
    }

    @Test
    void ep002VisualFeedbackRejectsForgedEpisodeIdentityBeforeAudit() throws Exception {
        MockHttpServletRequest request=new MockHttpServletRequest(
                "POST","/api/v1/creative/episodes/EP002/visual-feedback");
        request.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
        MockHttpServletResponse response=new MockHttpServletResponse();

        filter.doFilter(request,response,new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("project audit identity");
        verify(memory,never()).preflight(any(),any(),any());
    }

    @Test
    void readOnlyRequestsDoNotWriteAnAudit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/creative/overview");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isSameAs(request);
        verifyNoInteractions(memory);
    }

    @Test
    void deniesCreationWhenDatabaseOrMemoryServiceIsUnavailable() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/voice-clips/generate");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(memory.preflight(eq("VOICE"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenThrow(new IllegalStateException("Database unavailable"));
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(503);
        assertThat(response.getContentAsString()).contains("GLOBAL_CREATION_PREFLIGHT_UNAVAILABLE");
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    void cannotBypassPreflightUsingWebContextPath() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/mediaos/api/v1/studio/shots");
        request.setContextPath("/mediaos");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(memory.preflight(eq("VOICE"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId", UUID.randomUUID()));
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        verify(memory).preflight(eq("VOICE"), any(), eq(ProductionOverviewService.EPISODE_ID));
        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void businessExceptionIsNotMisreportedAsPreflightOutage() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/creative/script/generate");
        when(memory.preflight(eq("SCRIPT"), any(), eq(ProductionOverviewService.EPISODE_ID)))
                .thenReturn(Map.of("auditId", UUID.randomUUID()));
        MockHttpServletResponse response = new MockHttpServletResponse();

        org.junit.jupiter.api.Assertions.assertThrows(ServletException.class, () ->
                filter.doFilter(request, response, (req, res) -> { throw new ServletException("Application error"); }));
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
