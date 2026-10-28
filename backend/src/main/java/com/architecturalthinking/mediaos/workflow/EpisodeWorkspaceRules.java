package com.architecturalthinking.mediaos.workflow;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Pure, independently tested Director gates. No silent LOCK, no implicit stage. */
public final class EpisodeWorkspaceRules {
    private EpisodeWorkspaceRules() {}

    public static String editableStage(String raw) {
        String stage = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (!List.of("RESEARCH", "SCRIPT", "SCENE").contains(stage))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only Research, Script and Scene use this draft gate. Voice and Visual require specialized QA.");
        return stage;
    }

    public static void validateDirectorDecision(String decision, String note) {
        if (!"DIRECTOR_APPROVE".equals(decision) || note == null || note.trim().length() < 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Explicit DIRECTOR_APPROVE decision and meaningful review note required.");
    }

    public static void validateArtifactForLock(String stage, Map<String, Object> artifact) {
        if (artifact == null) artifact = Map.of();
        switch (editableStage(stage)) {
            case "RESEARCH" -> {
                if (!nonBlank(artifact.get("centralQuestion"))
                        || !nonBlank(artifact.get("viewerPromise"))
                        || !listHas(artifact.get("truthMap"), 3)
                        || !listHas(artifact.get("outOfScope"), 1)
                        || !listHas(artifact.get("technicalSources"), 1))
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Research requires centralQuestion, viewerPromise, truthMap (3+), outOfScope and technicalSources.");
            }
            case "SCRIPT" -> {
                Object target = artifact.get("targetDurationSeconds");
                if (!nonBlank(artifact.get("overview"))
                        || !listHas(artifact.get("timeline"), 5)
                        || !(target instanceof Number duration)
                        || duration.doubleValue() < 540 || duration.doubleValue() > 900)
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Script requires overview, 5+ timeline beats and 9–15 minute target.");
            }
            case "SCENE" -> {
                if (!nonBlank(artifact.get("overview")) || !listHas(artifact.get("shots"), 3))
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Scene requires reviewed overview and 3+ shot plans.");
            }
            default -> throw new IllegalStateException("Unexpected stage.");
        }
    }

    private static boolean nonBlank(Object o) { return o instanceof String s && !s.trim().isBlank(); }
    private static boolean listHas(Object o, int min) { return o instanceof List<?> list && list.size() >= min; }
}
