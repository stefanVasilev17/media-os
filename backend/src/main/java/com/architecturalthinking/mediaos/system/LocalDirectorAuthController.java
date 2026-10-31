package com.architecturalthinking.mediaos.system;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public class LocalDirectorAuthController {
    private final LocalDirectorLoginService logins;
    private final SecurityContextRepository contexts;

    public LocalDirectorAuthController(LocalDirectorLoginService logins,
                                       SecurityContextRepository contexts) {
        this.logins = logins;
        this.contexts = contexts;
    }

    public record Login(String username, String password, String totpCode) {}
    public record Mode(boolean localAuthentication, boolean requiresTotp) {}

    @GetMapping("/mode")
    public Mode mode() {
        return new Mode(true, true);
    }

    @GetMapping("/csrf")
    public java.util.Map<String, String> csrf(CsrfToken token) {
        return java.util.Map.of("token", token.getToken(), "header", token.getHeaderName());
    }

    @PostMapping("/login")
    public DirectorSessionController.Session login(@RequestBody Login login,
                                                  HttpServletRequest request,
                                                  HttpServletResponse response) {
        LocalDirectorLoginService.Attempt attempt = logins.verify(
                login.username(), login.password(), login.totpCode());
        if (!attempt.success()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials or verification code.");
        }

        LocalDirectorPrincipal principal = attempt.principal();
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR")));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        var session = request.getSession(true);
        request.changeSessionId();
        contexts.saveContext(context, request, response);
        return new DirectorSessionController.Session(true, List.of("DIRECTOR"), true, true);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
    }
}
