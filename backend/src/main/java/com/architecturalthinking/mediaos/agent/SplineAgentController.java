package com.architecturalthinking.mediaos.agent;

import com.architecturalthinking.mediaos.proposal.ProposalRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/episodes/EP001/agents/spline")
public class SplineAgentController {
    private final JdbcClient jdbc;
    private final ProposalRepository proposals;

    public SplineAgentController(JdbcClient jdbc, ProposalRepository proposals) {
        this.jdbc = jdbc;
        this.proposals = proposals;
    }

    @GetMapping
    public Map<String, Object> getThread() {
        var messages = jdbc.sql("""
                select id::text, sender, content
                from agent_message
                where thread_id = '44444444-4444-4444-4444-444444444444'
                order by created_at
                """).query((rs, rowNum) -> Map.of(
                "id", rs.getString("id"),
                "sender", rs.getString("sender"),
                "content", rs.getString("content")
        )).list();

        return Map.of(
                "episodeNumber", "EP001",
                "episodeTitle", "What Really Happens When You Click Login?",
                "agentName", "Spline Agent",
                "agentStatus", "READY FOR REVIEW",
                "messages", messages,
                "proposal", proposals.demoProposal()
        );
    }
}
