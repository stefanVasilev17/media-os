package com.architecturalthinking.mediaos.system;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
@Order(Ordered.LOWEST_PRECEDENCE - 110)
public class LocalDirectorSessionRevalidationFilter extends OncePerRequestFilter {
    private final LocalDirectorLoginService accounts;

    public LocalDirectorSessionRevalidationFilter(LocalDirectorLoginService accounts) {
        this.accounts = accounts;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var session = request.getSession(false);
        if (session != null && auth instanceof UsernamePasswordAuthenticationToken local
                && local.isAuthenticated() && local.getPrincipal() instanceof LocalDirectorPrincipal) {
            Object deadline = session.getAttribute(LocalDirectorAuthController.REMEMBER_ABSOLUTE_EXPIRY);
            if (deadline instanceof Long until && System.currentTimeMillis() >= until) {
                session.invalidate();
                SecurityContextHolder.clearContext();
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Remembered device session expired.");
                return;
            }
        }
        if (auth instanceof UsernamePasswordAuthenticationToken local
                && local.isAuthenticated()
                && local.getPrincipal() instanceof LocalDirectorPrincipal principal
                && !accounts.isActive(principal.id())) {
            if (session != null) session.invalidate();
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Director session was revoked.");
            return;
        }
        chain.doFilter(request, response);
    }
}
