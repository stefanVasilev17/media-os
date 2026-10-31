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
@Import(DirectorSecurityConfiguration.class)
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
    static class SecurityProbeController {
        @GetMapping("/api/v1/security-probe")
        String read() { return "ok"; }

        @PostMapping(value = "/api/v1/security-probe", produces = MediaType.TEXT_PLAIN_VALUE)
        String write() { return "updated"; }
    }

    @Test
    void anonymousCannotReadProjectData() throws Exception {
        mvc.perform(get("/api/v1/security-probe"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousCannotWriteProjectData() throws Exception {
        mvc.perform(post("/api/v1/security-probe"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void viewerMayReadButCannotWrite() throws Exception {
        var viewer = jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"));
        mvc.perform(get("/api/v1/security-probe").with(viewer))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/security-probe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void editorCannotPerformPrivilegedMutation() throws Exception {
        mvc.perform(post("/api/v1/security-probe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_EDITOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void directorCanReachAnExplicitlyPermittedMutation() throws Exception {
        mvc.perform(post("/api/v1/security-probe").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isOk());
    }

    @Test
    void unregisteredEndpointCannotWriteOutsideTheApi() throws Exception {
        mvc.perform(post("/internal/unregistered").with(
                jwt().authorities(new SimpleGrantedAuthority("ROLE_DIRECTOR"))))
                .andExpect(status().isForbidden());
    }
}
