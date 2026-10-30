package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class FirstPassCoverageArchitectureTest {
    @Test
    void everyDirectOpenAiClientMustAttachMandatoryProductionRules() throws IOException {
        Path sourceRoot = Files.isDirectory(Path.of("src/main/java"))
                ? Path.of("src/main/java")
                : Path.of("backend/src/main/java");
        List<String> unprotected = new ArrayList<>();
        try (var javaFiles = Files.walk(sourceRoot)) {
            for (Path file : javaFiles.filter(p -> p.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file, StandardCharsets.UTF_8);
                if (!source.contains("api.openai.com")) continue;
                boolean covered = source.contains("firstPass.prepareForStage(")
                        || source.contains("mandatoryProductionRules");
                if (!covered) unprotected.add(file.toString());
            }
        }
        assertTrue(unprotected.isEmpty(),
                "Direct OpenAI clients without first-pass rules are not allowed: " + unprotected
                        + ". Integrate ShotPromptContextService before introducing another paid agent.");
    }
}
