package com.architecturalthinking.mediaos.proposal;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@Repository
public class ProposalRepository {
    private final JdbcClient jdbc;

    public ProposalRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> demoProposal() {
        return jdbc.sql("""
                select id::text, title, summary, risk_level, confidence, status,
                       affected_objects::text, proposed_operations::text
                from proposal
                where id = '66666666-6666-6666-6666-666666666666'
                """).query((rs, rowNum) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", rs.getString("id"));
            m.put("title", rs.getString("title"));
            m.put("summary", rs.getString("summary"));
            m.put("riskLevel", rs.getString("risk_level"));
            m.put("confidence", rs.getBigDecimal("confidence"));
            m.put("status", rs.getString("status"));
            m.put("affectedObjects", jsonTextToList(rs.getString("affected_objects")));
            m.put("proposedOperations", jsonTextToList(rs.getString("proposed_operations")));
            return m;
        }).single();
    }

    private static java.util.List<String> jsonTextToList(String json) {
        if (json == null || json.length() < 2) return java.util.List.of();
        String inner = json.substring(1, json.length() - 1).trim();
        if (inner.isBlank()) return java.util.List.of();
        return Arrays.stream(inner.split(","))
                .map(String::trim)
                .map(v -> v.replaceAll("^\"|\"$", ""))
                .toList();
    }
}
