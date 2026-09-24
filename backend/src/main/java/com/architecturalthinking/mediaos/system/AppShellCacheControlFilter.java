package com.architecturalthinking.mediaos.system;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AppShellCacheControlFilter extends OncePerRequestFilter {

    private static final Set<String> NO_STORE_PATHS = Set.of(
            "/",
            "/index.html",
            "/manifest.webmanifest",
            "/registerSW.js",
            "/sw.js"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if ("GET".equalsIgnoreCase(request.getMethod()) && NO_STORE_PATHS.contains(request.getRequestURI())) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            response.setHeader("Pragma", "no-cache");
            response.setDateHeader("Expires", 0L);
        }

        filterChain.doFilter(request, response);
    }
}
