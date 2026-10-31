package com.architecturalthinking.mediaos.system;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public final class LocalSocketPeerCaptureFilter extends OncePerRequestFilter {
    public static final String SOCKET_PEER_ATTRIBUTE =
            LocalSocketPeerCaptureFilter.class.getName() + ".socketPeer";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String peer = request.getRemoteAddr();
        request.setAttribute(SOCKET_PEER_ATTRIBUTE,
                peer == null || peer.isBlank() ? "unknown" : peer);
        chain.doFilter(request, response);
    }
}
