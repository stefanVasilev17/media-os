package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class ProductionMemoryImportServiceTest {
    private ProductionMemoryImportService.Candidate candidate(String scope, String episode,
                                                               String fileHash) {
        return new ProductionMemoryImportService.Candidate(
                "AT-MEM-001", episode, scope, "LOCK", "REQUIRED",
                "Use one persistent Living Architecture Map for architecture teaching.",
                "Architectural_Thinking_Core_Production_Bible_v2_3.md", 6,
                "ONE WORLD. ONE LIVING MAP. MANY ENGINEERING STORIES.", fileHash);
    }

    @Test
    void stageCandidatesRequireTraceableSourceAndExplicitScope() {
        String hash = "a".repeat(64);
        assertDoesNotThrow(() -> ProductionMemoryImportService.validate(candidate("ALL", "GLOBAL", hash)));
        assertDoesNotThrow(() -> ProductionMemoryImportService.validate(candidate("SCRIPT", "EP002", hash)));
        assertThrows(ResponseStatusException.class, () ->
                ProductionMemoryImportService.validate(candidate("SCRIPT", "EP2", hash)));
        assertThrows(ResponseStatusException.class, () ->
                ProductionMemoryImportService.validate(candidate("ADMIN", "GLOBAL", hash)));
        assertThrows(ResponseStatusException.class, () ->
                ProductionMemoryImportService.validate(candidate("SCRIPT", "GLOBAL", "unverified")));
    }

    @Test
    void emptyOrShortCandidateCannotEnterProductionMemory() {
        var shortRule = new ProductionMemoryImportService.Candidate(
                "AT-MEM-008", "GLOBAL", "ALL", "QA", "REQUIRED", "Bad!",
                "Bible.md", 1, "Bad!", "b".repeat(64));
        assertThrows(ResponseStatusException.class, () ->
                ProductionMemoryImportService.validate(shortRule));
    }

    @Test
    void lexicalOverlapIsHintNotSemanticApproval() {
        String first = ProductionMemoryImportService.normalize("The database is OVERLOADED  and responding.");
        String other = ProductionMemoryImportService.normalize("The database is overloaded and responding.");
        assertEquals(first, other);
        assertEquals(1.0, ProductionMemoryImportService.similarity(first, other));
        assertTrue(ProductionMemoryImportService.similarity(
                ProductionMemoryImportService.normalize("Never bypass identity verification during load shedding."),
                ProductionMemoryImportService.normalize("Add three Aha moments to the script.")) < 0.4);
        // "not online" vs "online" cannot be semantically validated by lexical similarity.
    }
}
