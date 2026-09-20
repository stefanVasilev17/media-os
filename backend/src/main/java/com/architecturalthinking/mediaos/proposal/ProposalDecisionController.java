package com.architecturalthinking.mediaos.proposal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/proposals")
public class ProposalDecisionController {
    private final JdbcClient jdbc;

    public ProposalDecisionController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record DecisionRequest(@NotNull Decision decision, String comment) {}
    public enum Decision { APPROVE, REQUEST_CHANGES }

    @PostMapping("/{proposalId}/decisions")
    public Map<String, Object> decide(@PathVariable UUID proposalId, @Valid @RequestBody DecisionRequest request) {
        UUID id = UUID.randomUUID();
        jdbc.sql("insert into approval_decision(id, proposal_id, decision, creator_comment) values (:id,:proposalId,:decision,:comment)")
                .param("id", id).param("proposalId", proposalId).param("decision", request.decision().name()).param("comment", request.comment()).update();

        String status = request.decision() == Decision.APPROVE ? "APPROVED" : "CHANGES_REQUESTED";
        jdbc.sql("update proposal set status=:status where id=:proposalId")
                .param("status", status).param("proposalId", proposalId).update();

        if (request.decision() == Decision.REQUEST_CHANGES && request.comment() != null && !request.comment().isBlank()) {
            jdbc.sql("""
                    insert into correction(id, proposal_id, context_type, original_proposal, creator_correction, status)
                    values (:id,:proposalId,'SPLINE_PROPOSAL','Restore Session Flow',:comment,'RAW')
                    """)
                    .param("id", UUID.randomUUID()).param("proposalId", proposalId).param("comment", request.comment()).update();
        }

        return Map.of("decisionId", id, "proposalId", proposalId, "status", status);
    }
}
