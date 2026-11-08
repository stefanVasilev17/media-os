package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import java.util.List;

@Configuration
@EnableWebSecurity
public class DirectorSecurityConfiguration {
    private final DirectorMembershipService membership;

    public DirectorSecurityConfiguration(DirectorMembershipService membership) {
        this.membership = membership;
    }

    @Bean
    @ConditionalOnExpression("!${mediaos.director-security.enabled:false} && !${mediaos.local-auth.enabled:false} && !${mediaos.google-auth.enabled:false}")
    SecurityFilterChain lockedWithoutIdentity(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorization -> authorization
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/v1/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/**").permitAll()
                        .anyRequest().denyAll());
        return http.build();
    }

    @Bean
    @ConditionalOnProperty(name = "mediaos.director-security.enabled", havingValue = "true")
    SecurityFilterChain verifiedDirector(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorization -> authorization
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/v1/worker/**", "/api/v1/remotion/renders/worker/**",
                                "/api/v1/remotion/gpu-renders/**", "/api/v1/spline/gpu-renders/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.HEAD, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, EpisodeFactoryDirectorRoutes.POST_PATHS)
                            .hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/creative/episodes/EP002/shots/SHOT02/render-preview",
                                
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
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(token ->
                        new JwtAuthenticationToken(
                                token,
                                membership.authorities(
                                        token.getIssuer() == null ? "" : token.getIssuer().toString(),
                                        token.getSubject()),
                                token.getSubject()))));
        return http.build();
    }

    @Bean
    @ConditionalOnProperty(name = "mediaos.director-security.enabled", havingValue = "true")
    JwtDecoder verifiedDirectorDecoder(
            @Value("${mediaos.director-security.issuer-uri:}") String issuer,
            @Value("${mediaos.director-security.jwk-set-uri:}") String jwkSetUri,
            @Value("${mediaos.director-security.audience:}") String audience) {
        if (!issuer.startsWith("https://") || !jwkSetUri.startsWith("https://") || audience.isBlank()) {
            throw new IllegalStateException("Director identity needs a trusted HTTPS issuer, JWKS URL, and API audience.");
        }
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        decoder.setJwtValidator(requiredJwtClaims(issuer, audience));
        return decoder;
    }

    static OAuth2TokenValidator<Jwt> requiredJwtClaims(String issuer, String audience) {
        return new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                new JwtClaimValidator<List<String>>(JwtClaimNames.AUD,
                        audiences -> audiences != null && audiences.contains(audience)),
                new JwtClaimValidator<String>(JwtClaimNames.SUB,
                        subject -> subject != null && !subject.isBlank()));
    }
}
