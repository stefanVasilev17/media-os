package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@ConditionalOnProperty(name = "mediaos.google-auth.enabled", havingValue = "true")
public class GoogleDirectorAuthController {
    public record Mode(boolean localAuthentication, boolean googleAuthentication, boolean requiresTotp) {}

    @GetMapping("/mode")
    public Mode mode() {
        return new Mode(false, true, false);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(@RequestAttribute("_csrf") CsrfToken token) {
        return Map.of("token", token.getToken(), "header", token.getHeaderName());
    }
}
