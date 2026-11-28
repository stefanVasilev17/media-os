package com.architecturalthinking.mediaos.system;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;
import org.springframework.security.web.csrf.CsrfException;

import java.io.IOException;

/**
 * For Director-only EP002 voice-cue reviews, classify a 403 without disclosing
 * credentials, request bodies, CSRF tokens or the session identity.
 * All unrelated Director endpoints keep their previous denial behavior.
 */
public final class DirectorVoiceCueAccessDeniedHandler implements AccessDeniedHandler {
    private static final org.slf4j.Logger LOG =
            org.slf4j.LoggerFactory.getLogger(DirectorVoiceCueAccessDeniedHandler.class);
    private final AccessDeniedHandler fallback = new AccessDeniedHandlerImpl();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException denied) throws IOException, ServletException {
        String path=request.getRequestURI();
        boolean voice=path.matches("^/api/v1/creative/episodes/EP002/voice-cue-review/SHOT(0[1-9]|1[01])$");
        boolean publishing=path.matches("^/api/v1/episode-packages/[0-9a-fA-F-]{36}/publishing/(thumbnail|items/[A-Z_]+)$");
        if (!"POST".equals(request.getMethod()) || (!voice && !publishing)) {
            fallback.handle(request, response, denied);
            return;
        }
        String reason = denied instanceof MissingCsrfTokenException
                ? "CSRF_COOKIE_MISSING"
                : denied instanceof InvalidCsrfTokenException
                    ? "CSRF_COOKIE_HEADER_MISMATCH"
                    : denied instanceof CsrfException
                        ? "CSRF_VALIDATION_REJECTED"
                        : "DIRECTOR_ACCESS_DENIED";
        LOG.warn("{} reason={} route={}", voice?"EP002_DIRECTOR_VOICE_CUE_DENIED":"PUBLISHING_DIRECTOR_DENIED", reason, path);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-MediaOS-Denial-Reason", reason);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String message=voice?"Voice cue review denied by the security layer; no verification or render was performed."
                :reason.startsWith("CSRF")?"Secure request validation failed. Reload the workspace and try again. No publishing change was made."
                :"Director access denied. No publishing change was made.";
        response.getWriter().write("{\"error\":\""+reason+"\",\"message\":\""+message+"\"}");
    }
}
