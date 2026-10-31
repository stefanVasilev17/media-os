package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public final class DirectorMembershipService {
    private final JdbcClient jdbc;

    public DirectorMembershipService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<GrantedAuthority> authorities(String issuer, String subject) {
        if (issuer == null || issuer.isBlank() || subject == null || subject.isBlank()) {
            return List.of();
        }
        List<String> roles = jdbc.sql("""
                select role
                from mediaos_director_membership
                where project_id = :projectId
                  and issuer = :issuer
                  and subject = :subject
                  and active = true
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("issuer", issuer)
                .param("subject", subject)
                .query(String.class)
                .list();
        return roles.stream()
                .filter(role -> role.equals("VIEWER") || role.equals("EDITOR") || role.equals("DIRECTOR"))
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }
}
