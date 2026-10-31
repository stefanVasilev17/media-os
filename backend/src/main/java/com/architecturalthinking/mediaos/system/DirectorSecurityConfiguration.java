package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
    @ConditionalOnProperty(name = "mediaos.director-security.enabled", havingValue = "false", matchIfMissing = true)
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
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.HEAD, "/api/v1/**").hasAnyRole("VIEWER", "EDITOR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/**").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/**").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/**").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/**").hasRole("DIRECTOR")
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
