package com.architecturalthinking.mediaos.system;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = 1800)
@ConditionalOnProperty(name = "mediaos.google-auth.enabled", havingValue = "true")
public class GoogleDirectorSecurityConfiguration {
    @Bean
    GoogleDirectorIdentityPolicy googleDirectorIdentityPolicy(
            @Value("${mediaos.google-auth.allowed-email:}") String email,
            @Value("${mediaos.google-auth.allowed-subject:}") String subject,
            @Value("${mediaos.google-auth.client-id:}") String clientId) {
        return new GoogleDirectorIdentityPolicy(email, subject, clientId);
    }

    @Bean
    ClientRegistrationRepository googleDirectorClientRegistration(
            @Value("${mediaos.google-auth.client-id:}") String clientId,
            @Value("${mediaos.google-auth.client-secret:}") String clientSecret) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException("Google OAuth client ID and client secret are required.");
        }
        var google = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .scope("openid", "email")
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }

    @Bean
    DefaultCookieSerializer googleDirectorCookieSerializer() {
        DefaultCookieSerializer cookie = new DefaultCookieSerializer();
        cookie.setCookieName("MEDIAOS_SESSION");
        cookie.setUseHttpOnlyCookie(true);
        cookie.setUseSecureCookie(true);
        cookie.setSameSite("Lax");
        cookie.setCookiePath("/");
        return cookie;
    }

    @Bean
    SecurityFilterChain googleDirectorFilterChain(HttpSecurity http,
            GoogleDirectorIdentityPolicy policy) throws Exception {
        CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrf.setCookieCustomizer(builder -> builder.secure(true).sameSite("Strict").path("/"));
        OidcUserService delegate = new OidcUserService();

        http.csrf(config -> config
                    .csrfTokenRepository(csrf)
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(
                        (request, response, error) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .authorizeHttpRequests(access -> access
                        .requestMatchers("/actuator/health", "/actuator/health/**",
                                "/api/v1/auth/mode", "/api/v1/auth/csrf",
                                "/oauth2/authorization/google",
                                "/login/oauth2/code/google").permitAll()
                        .requestMatchers("/api/v1/worker/**", "/api/v1/remotion/renders/worker/**",
                                "/api/v1/remotion/gpu-renders/**",
                                "/api/v1/spline/gpu-renders/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.HEAD, "/api/v1/**").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/creative/episodes/EP002/shots/{shotKey}/generate",
                                "/api/v1/creative/episodes/EP002/shots/{shotKey}/approve",
                                "/api/v1/episodes",
                                "/api/v1/episodes/{episodeId}/stages/{stageKey}/draft",
                                "/api/v1/episodes/{episodeId}/stages/{stageKey}/director-lock",
                                "/api/v1/episodes/{episodeId}/assets/{assetKey}/reuse",
                                "/api/v1/episodes/{episodeId}/memory",
                                "/api/v1/episodes/{episodeId}/research/preview",
                                "/api/v1/episodes/{episodeId}/research/run",
                                "/api/v1/episodes/{episodeId}/agents/{stageKey}/preview",
                                "/api/v1/episodes/{episodeId}/agents/{stageKey}/run",
                                "/api/v1/episodes/{episodeId}/learning/refresh",
                                "/api/v1/episodes/{episodeId}/learning/{proposalId}/decision",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/messages",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/director-lock",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/ai/preview",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/ai/run",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/voice/generate",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/voice/approve",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/render-qa",
                                "/api/v1/episodes/{episodeId}/quality-assertions",
                                "/api/v1/previews/director",
                                "/api/v1/previews/creative/{stageKey}").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/creative/episodes/EP002/shots/{shotKey}",
                                "/api/v1/episodes/{episodeId}/brief",
                                "/api/v1/episodes/{episodeId}/research/sources",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/draft",
                                "/api/v1/system/ai-control").hasRole("DIRECTOR")
                        .requestMatchers("/api/v1/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/**").permitAll()
                        .anyRequest().denyAll())
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(user -> user.oidcUserService(request -> {
                            OidcUser candidate = delegate.loadUser(request);
                            if (!policy.allowed(candidate.getIdToken())) {
                                throw new OAuth2AuthenticationException(
                                        new OAuth2Error("access_denied"), "Google Director identity is not approved.");
                            }
                            return new DefaultOidcUser(
                                    List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR")),
                                    candidate.getIdToken(), "sub");
                        }))
                        .successHandler((request, response, authentication) -> response.sendRedirect("/#/"))
                        .failureHandler((request, response, error) ->
                                response.sendRedirect("/?googleAuth=denied#/")))
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .deleteCookies("MEDIAOS_SESSION")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT)));

        http.addFilterAfter(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain) throws ServletException, IOException {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth instanceof OAuth2AuthenticationToken token
                        && token.getPrincipal() instanceof OidcUser user
                        && !policy.allowed(user.getIdToken())) {
                    var session = request.getSession(false);
                    if (session != null) session.invalidate();
                    SecurityContextHolder.clearContext();
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
                chain.doFilter(request, response);
            }
        }, SecurityContextHolderFilter.class);
        return http.build();
    }
}
