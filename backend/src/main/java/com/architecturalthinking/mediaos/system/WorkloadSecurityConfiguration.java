package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@ConditionalOnProperty(name = "mediaos.worker-auth.enabled", havingValue = "true")
public class WorkloadSecurityConfiguration {
    public WorkloadSecurityConfiguration(
            @Value("${mediaos.local-auth.enabled:false}") boolean localAuth,
            @Value("${mediaos.director-security.enabled:false}") boolean externalAuth) {
        if (!localAuth || externalAuth) {
            throw new IllegalStateException("Worker authentication requires exclusive local Director mode.");
        }
    }

    @Bean
    @Order(1)
    SecurityFilterChain scopedWorkerSecurity(HttpSecurity http,
            WorkloadCredentialService credentials) throws Exception {
        http.securityMatcher("/api/v1/worker/**",
                "/api/v1/remotion/renders/worker/**",
                "/api/v1/remotion/gpu-renders/**",
                "/api/v1/spline/gpu-renders/**")
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(new WorkloadIdentityFilter(credentials),
                    UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth.anyRequest().hasRole("WORKER"));
        return http.build();
    }
}
