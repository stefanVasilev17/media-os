package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableWebSecurity
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = 1800)
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public class LocalDirectorSecurityConfiguration {
    @Bean
    PasswordEncoder localDirectorPasswordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    SecurityContextRepository localSecurityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    DefaultCookieSerializer cookieSerializer() {
        DefaultCookieSerializer cookie = new DefaultCookieSerializer();
        cookie.setCookieName("MEDIAOS_SESSION");
        cookie.setUseHttpOnlyCookie(true);
        cookie.setUseSecureCookie(true);
        cookie.setSameSite("Lax");
        cookie.setCookiePath("/");
        // Persistent cookie is inert after the server-side session expires or is revoked.
        cookie.setCookieMaxAge(30 * 24 * 60 * 60);
        return cookie;
    }

    @Bean
    SecurityFilterChain localDirectorFilterChain(HttpSecurity http,
                                                 SecurityContextRepository repository) throws Exception {
        CookieCsrfTokenRepository csrfCookie = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfCookie.setCookieCustomizer(builder -> builder.secure(true).sameSite("Strict").path("/"));
        http.csrf(csrf -> csrf
                .csrfTokenRepository(csrfCookie)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .securityContext(context -> context.securityContextRepository(repository))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, reason) ->
                                response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler(new DirectorVoiceCueAccessDeniedHandler()))
                .authorizeHttpRequests(authorization -> authorization
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/api/v1/auth/mode", "/api/v1/auth/csrf", "/api/v1/auth/login", "/api/v1/auth/claim/redeem").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview", "/api/v1/auth/logout").authenticated()
                        .requestMatchers("/api/v1/worker/**", "/api/v1/remotion/renders/worker/**",
                                "/api/v1/remotion/gpu-renders/**", "/api/v1/spline/gpu-renders/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.HEAD, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, EpisodeFactoryDirectorRoutes.POST_PATHS)
                            .hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/creative/episodes/EP002/shots/SHOT02/render-preview",
                                
                                "/api/v1/creative/episodes/EP002/shots/{shotKey}/align-existing-take",
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
                                "/api/v1/previews/creative/{stageKey}")
                            .hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/episodes/{episodeId}/brief",
                                "/api/v1/episodes/{episodeId}/research/sources",
                                "/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/draft",
                                "/api/v1/system/ai-control")
                            .hasRole("DIRECTOR")
                        .requestMatchers("/api/v1/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/**").permitAll()
                        .anyRequest().denyAll())
                ;
        return http.build();
    }

}
