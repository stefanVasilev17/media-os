package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = DirectorHttpAuthorizationTest.SecurityProbeController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = GlobalCreationPreflightFilter.class))
@Import({DirectorSecurityConfiguration.class, DirectorHttpAuthorizationTest.SecurityProbeController.class})
@TestPropertySource(properties = {
        "mediaos.director-security.enabled=true",
        "mediaos.director-security.issuer-uri=https://id.example",
        "mediaos.director-security.jwk-set-uri=https://id.example/jwks",
        "mediaos.director-security.audience=mediaos-api"
})
class DirectorHttpAuthorizationTest {
    @Autowired MockMvc mvc;
    @MockitoBean DirectorMembershipService membership;
    @MockitoBean JwtDecoder decoder;

    @RestController
    public static class SecurityProbeController {
        @GetMapping("/api/v1/episodes/security-probe")
        String read() { return "ok"; }

        @PostMapping(value = "/api/v1/episodes", produces = MediaType.TEXT_PLAIN_VALUE)
        String write() { return "updated"; }

        @PostMapping("/api/v1/episodes/security-probe")
        String unreviewedEpisodeWrite() { return "should-not-run"; }

        @PostMapping("/api/v1/episode-packages/{packageId}/factory-production/runs")
        String factoryCreate() { return "created"; }

        @PostMapping("/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/{operation}")
        String factoryAction() { return "factory-action"; }

        @PostMapping("/api/v1/creative/episodes/EP002/voice-cue-review/SHOT02")
        String voiceCueReview() { return "director-reviewed"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT02/render-preview")
        String shot02Preview() { return "director-preview-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT04/render-preview")
        String shot04Preview() { return "director-preview-shot04-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT05/render-preview")
        String shot05Preview() { return "director-preview-shot05-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT06/render-preview")
        String shot06Preview() { return "director-preview-shot06-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT07/render-preview")
        String shot07Preview() { return "director-preview-shot07-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT01/generate-slow")
        String shot01SlowVoice() { return "director-paid-voice-shot01"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT02/generate-slow")
        String shot02SlowVoice() { return "director-paid-voice-only"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT03/generate-slow")
        String shot03SlowVoice() { return "director-paid-voice-shot03"; }

        @PostMapping("/api/v1/creative/episodes/EP002/shots/SHOT11/generate-slow")
        String shot11SlowVoice() { return "director-paid-voice-shot11"; }

        @PostMapping("/api/v1/creative/episodes/EP002/codex-automation/{action}")
        String ep002CodexAutomation() { return "authorized"; }

        @PostMapping("/api/v1/creative/episodes/EP002/visual-approvals")
        String ep002VisualApproval() { return "reviewed"; }

        @PostMapping("/api/v1/creative/episodes/EP002/visual-feedback")
        String ep002VisualFeedback() { return "feedback-stored"; }

        @PostMapping("/api/v1/verification/runs")
        String testRun() { return "verification-queued"; }

        @PostMapping("/api/v1/verification/runs/{runId}/cancel")
        String testRunCancel() { return "verification-cancelled"; }

        @PostMapping("/api/v1/verification/automation/{action}")
        String testAutoVerification() { return "automation-authorized"; }

        @PostMapping("/api/v1/worker/runner/heartbeat")
        String worker() { return "worker"; }

        @PostMapping("/api/v1/unreviewed")
        String unreviewed() { return "should-not-run"; }
    }

    @Test
    void anonymousCannotReadProjectData() throws Exception {
        mvc.perform(get("/api/v1/episodes/security-probe"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousCannotWriteProjectData() throws Exception {
        mvc.perform(post("/api/v1/episodes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void viewerMayReadButCannotWrite() throws Exception {
        var viewer = jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"));
        mvc.perform(get("/api/v1/episodes/security-probe").with(viewer))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/episodes").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void editorCannotPerformPrivilegedMutation() throws Exception {
        mvc.perform(post("/api/v1/episodes").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_EDITOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void directorCanReachAnExplicitlyPermittedMutation() throws Exception {
        mvc.perform(post("/api/v1/episodes").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
    }

    @Test
    void signedDirectorTokenCannotClaimGpuRenderWork() throws Exception {
        mvc.perform(get("/api/v1/remotion/gpu-renders/test-render/work").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/spline/gpu-renders/test-render/work").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void evenDirectorCannotInvokeAnInternalWorkerCallback() throws Exception {
        mvc.perform(post("/api/v1/worker/runner/heartbeat").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void evenDirectorCannotWriteThroughAnUnreviewedEpisodeRoute() throws Exception {
        mvc.perform(post("/api/v1/episodes/security-probe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void evenDirectorCannotWriteThroughAnUnreviewedApiRoute() throws Exception {
        mvc.perform(post("/api/v1/unreviewed").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void factoryMutationsRequireDirectorAndOnlyApprovedActionsAreReachable() throws Exception {
        String base = "/api/v1/episode-packages/11111111-1111-4111-8111-111111111111"
                + "/factory-production/runs";
        String run = base + "/22222222-2222-4222-8222-222222222222";
        String[] allowed = {
                base,
                run + "/verify-github",
                run + "/feedback",
                run + "/revision-pr",
                run + "/queue-shots",
                run + "/approve-shots",
                run + "/queue-master",
                run + "/queue-shorts",
                run + "/approve-final"
        };
        for (String path : allowed) {
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                    .andExpect(status().isOk());
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority("ROLE_EDITOR"))))
                    .andExpect(status().isForbidden());
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"))))
                    .andExpect(status().isForbidden());
            mvc.perform(post(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post(run + "/queue-shots-unsafe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
        mvc.perform(post(run + "/delete-render").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
        mvc.perform(post(base + "/arbitrary").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void ep002Shot02ThroughShot07RenderPreviewsRequireDirectorAndDenyUnreleasedShots() throws Exception {
        String path="/api/v1/creative/episodes/EP002/shots/SHOT02/render-preview";
        mvc.perform(post(path).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for (String role : new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
        String shot03="/api/v1/creative/episodes/EP002/shots/SHOT03/render-preview";
        mvc.perform(post(shot03).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(shot03).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(shot03)).andExpect(status().isUnauthorized());
        String shot04="/api/v1/creative/episodes/EP002/shots/SHOT04/render-preview";
        mvc.perform(post(shot04).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(shot04).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(shot04)).andExpect(status().isUnauthorized());
        String shot05="/api/v1/creative/episodes/EP002/shots/SHOT05/render-preview";
        mvc.perform(post(shot05).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(shot05).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(shot05)).andExpect(status().isUnauthorized());
        String shot06="/api/v1/creative/episodes/EP002/shots/SHOT06/render-preview";
        mvc.perform(post(shot06).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(shot06).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(shot06)).andExpect(status().isUnauthorized());
        String shot07="/api/v1/creative/episodes/EP002/shots/SHOT07/render-preview";
        mvc.perform(post(shot07).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(shot07).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(shot07)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/creative/episodes/EP002/shots/SHOT08/render-preview")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void paidSlowVoiceRouteAllowsEveryEp002ShotForDirectorOnly() throws Exception {
        for(String shot:new String[]{"SHOT01","SHOT02","SHOT03","SHOT11"}) {
            String path="/api/v1/creative/episodes/EP002/shots/"+shot+"/generate-slow";
            mvc.perform(post(path).with(jwt().authorities(
                    new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                    .andExpect(status().isOk());
            for(String role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
                mvc.perform(post(path).with(jwt().authorities(
                        new SimpleGrantedAuthority(role))))
                        .andExpect(status().isForbidden());
            }
            mvc.perform(post(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/creative/episodes/EP003/shots/SHOT03/generate-slow")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void approvedEp002VoiceCueReviewsRequireRealDirectorRole() throws Exception {
        String path="/api/v1/creative/episodes/EP002/voice-cue-review/SHOT02";
        mvc.perform(post(path).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        mvc.perform(post(path).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"))))
                .andExpect(status().isForbidden());
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
    }

    @Test
    void independentVerificationAndAutopilotRequireDirectorOnlyExactWriteRoutes()
            throws Exception {
        String root="/api/v1/verification/";
        String[] allowed={
                root+"runs",
                root+"runs/12345678-1234-4123-8123-123456789abc/cancel",
                root+"automation/arm",
                root+"automation/pause"
        };
        for(String path:allowed) {
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                    .andExpect(status().isOk());
            for(String role:new String[]{"ROLE_EDITOR","ROLE_VIEWER"}) {
                mvc.perform(post(path).with(
                        jwt().authorities(new SimpleGrantedAuthority(role))))
                        .andExpect(status().isForbidden());
            }
            mvc.perform(post(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post(root+"automation/unsafe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
        mvc.perform(post(root+"runs/arbitrary/retry").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void automaticCodexWritesRequireDirectorAndOnlyExactApprovedActions() throws Exception {
        String base="/api/v1/creative/episodes/EP002/codex-automation/";
        for(String action:new String[]{"arm","pause","resume"}) {
            String path=base+action;
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                    .andExpect(status().isOk());
            for(String role:new String[]{"ROLE_EDITOR","ROLE_VIEWER"}) {
                mvc.perform(post(path).with(
                        jwt().authorities(new SimpleGrantedAuthority(role))))
                        .andExpect(status().isForbidden());
            }
            mvc.perform(post(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post(base+"dispatch-anything").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void ep002RenderedShotApprovalRequiresDirectorAndExactRoute() throws Exception {
        String path="/api/v1/creative/episodes/EP002/visual-approvals";
        mvc.perform(post(path).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for(var role:new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
        mvc.perform(post(path+"/unsafe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void ep002VisualFeedbackRequiresDirectorAndRemainsASingleExplicitRoute() throws Exception {
        String path="/api/v1/creative/episodes/EP002/visual-feedback";
        mvc.perform(post(path).with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
        for (String role : new String[]{"ROLE_VIEWER","ROLE_EDITOR"}) {
            mvc.perform(post(path).with(
                    jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
        mvc.perform(post(path+"/unreviewed").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void unregisteredEndpointCannotWriteOutsideTheApi() throws Exception {
        mvc.perform(post("/internal/unregistered").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }
}
