package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class Ep002SequentialVisualPreflightService {
    static final String VERSION = "EP002_SEQUENTIAL_VISUAL_PREFLIGHT_V1";
    static final List<RuleFile> RULES = List.of(
            new RuleFile("AGENTS.md", "Agent scope, Director approval and startup rules"),
            new RuleFile("docs/visual/AT_REMOTION_VISUAL_CONSTITUTION_V1.md",
                    "One-world canonical visual identity, states and camera grammar"),
            new RuleFile("docs/visual/CODEX_VISUAL_LESSONS_LEDGER.md",
                    "Latest accepted Director corrections; respect superseded entries"),
            new RuleFile("docs/visual/SEQUENTIAL_CODEX_SHOT_PROTOCOL_V1.md",
                    "Exactly one scoped Remotion SHOT and verified preflight before code"),
            new RuleFile("backend/src/main/resources/episode-production/ep002-locked-script-v4.json",
                    "Immutable approved English narration reference"),
            new RuleFile("backend/src/main/resources/episode-production/ep002-approved-visual-source.json",
                    "Immutable approved 59-beat visual choreography")
    );

    private final Ep002FactoryReadinessBridgeService bridge;

    public Ep002SequentialVisualPreflightService(Ep002FactoryReadinessBridgeService bridge) {
        this.bridge = bridge;
    }

    public record RuleFile(String path, String role) {}

    public record NextShot(
            String shotKey, String title, int beatCount, String codeDestination,
            int narrationRevision, String narrationSha256, String approvedTakeId,
            Integer durationInFrames, String cameraDirection, String visualGoal,
            String continuity, JsonNode approvedVisualStory
    ) {}

    public record Preflight(
            String schemaVersion, String episodeKey, String inputFingerprint,
            String status, String nextShotKey, String previousAcceptedShotKey,
            String followingShotKey, String protectedShot01Path,
            int acceptedSceneCount, int remainingSceneCount,
            NextShot candidate, List<RuleFile> mandatoryRuleFiles,
            List<String> blockers, boolean latestPolicyGitVerified,
            boolean realCueFramesVerified, boolean readyForCodex,
            boolean startsCodex, boolean startsRender, String executableCodexPrompt
    ) {}

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Preflight preview() {
        DirectorIdentity.requireDirector();
        // The only current Director-LOCKED visual acceptance evidence is SHOT01.
        // No code presence, preferred Take or batch-plan row is an acceptance record.
        return project(bridge.preview(), Set.of("SHOT01"));
    }

    static Preflight project(Ep002FactoryReadinessBridgeService.Snapshot snapshot,
                             Set<String> acceptedVisuals) {
        if (snapshot == null || !"EP002".equals(snapshot.episodeKey())
                || snapshot.shotCount() != 11 || snapshot.shots().size() != 11
                || snapshot.approvedBeatCount() != 59 || snapshot.protectedScenes() != 1
                || !snapshot.sourceVerified() || acceptedVisuals == null
                || !acceptedVisuals.contains("SHOT01")) {
            throw conflict("EP002 sequential visual plan requires verified locked sources and SHOT01.");
        }
        var first = snapshot.shots().get(0);
        if (!first.directorVisualLocked() || first.proposedScenePath() != null
                || !Ep002FactoryReadinessBridgeService.PROTECTED_SHOT01
                    .equals(first.existingScenePath())) {
            throw conflict("Director-LOCKED SHOT01 cannot become an AI-generated scene.");
        }
        Set<String> found = new HashSet<>();
        int totalBeats = 0;
        boolean encounteredPending = false;
        String previous = null;
        Ep002FactoryReadinessBridgeService.ShotReadiness candidate = null;
        String after = null;
        for (int i = 0; i < snapshot.shots().size(); i++) {
            var shot = snapshot.shots().get(i);
            String expected = String.format(java.util.Locale.ROOT, "SHOT%02d", i + 1);
            if (!expected.equals(shot.shotKey()) || !found.add(shot.shotKey())
                    || shot.approvedVisualStory() == null
                    || shot.approvedVisualStory().path("beats").size() != shot.beatCount()
                    || (i > 0 && (shot.directorVisualLocked()
                        || !("remotion-engine/src/episodes/ep002/Shot"
                            + String.format(java.util.Locale.ROOT, "%02d", i + 1)
                            + "GeneratedScene.tsx").equals(shot.proposedScenePath())))) {
                throw conflict("Protected sequential source/path mismatch: " + expected);
            }
            totalBeats += shot.beatCount();
            boolean accepted = acceptedVisuals.contains(expected);
            if (i == 0) {
                previous = expected;
                continue;
            }
            if (accepted && encounteredPending) {
                throw conflict("A later SHOT cannot be accepted while an earlier scene is pending.");
            }
            if (!accepted && candidate == null) {
                candidate = shot;
                encounteredPending = true;
            } else if (!accepted && candidate != null && after == null) {
                after = expected;
            }
            if (accepted) previous = expected;
        }
        if (totalBeats != 59 || acceptedVisuals.size() != found.stream()
                .filter(acceptedVisuals::contains).count()) {
            throw conflict("EP002 visual beat total or approved SHOT references are invalid.");
        }

        List<String> blockers = new ArrayList<>();
        if (snapshot.selectedVoiceTakes() != 11)
            blockers.add("ALL_CURRENT_REVISION_DIRECTOR_TAKES_REQUIRED");
        if (snapshot.measuredVoiceTakes() != 11)
            blockers.add("ALL_ELEVEN_MEASURED_AUDIO_DURATIONS_REQUIRED");
        if (snapshot.verifiedTimedShots() != 11)
            blockers.add("REAL_HEAR_SEE_TIMED_CUES_REQUIRED_FOR_ALL_SHOTS");
        if (snapshot.blockers().contains("UNRESOLVED_PAID_VOICE_REQUESTS"))
            blockers.add("UNRESOLVED_ELEVENLABS_LEDGER_MUST_BE_RECONCILED");
        if (candidate != null && !candidate.blockers().isEmpty())
            blockers.add("NEXT_SHOT_HAS_UNRESOLVED_SOURCE_OR_VOICE_BLOCKERS");
        blockers.add("VERSIONED_VISUAL_POLICY_AND_LEDGER_GIT_SHA_NOT_YET_VERIFIED");
        blockers.add("SEQUENTIAL_DIRECTOR_ACCEPTANCE_STORAGE_AND_GATE_NOT_YET_IMPLEMENTED");
        blockers.add("EP002_SINGLE_SHOT_CLOUD_PR_AUDIT_AND_WORKER_ROUTE_NOT_YET_IMPLEMENTED");

        NextShot target = candidate == null ? null : new NextShot(
                candidate.shotKey(), candidate.title(), candidate.beatCount(),
                candidate.proposedScenePath(), candidate.scriptRevision(),
                candidate.narrationSha256(), candidate.preferredTakeId(),
                candidate.durationFrames(),
                candidate.approvedVisualStory().path("cameraDirection").asText(),
                candidate.approvedVisualStory().path("visualGoal").asText(),
                candidate.approvedVisualStory().path("truthContinuity").asText(),
                candidate.approvedVisualStory().deepCopy());

        String state = target == null ? "AWAITING_EPISODE_ASSEMBLY_QA"
                : "SINGLE_SHOT_PREFLIGHT_BLOCKED_NO_CODE_TASK";
        return new Preflight(VERSION, "EP002", snapshot.inputFingerprint(),
                state, target == null ? null : target.shotKey(), previous, after,
                Ep002FactoryReadinessBridgeService.PROTECTED_SHOT01,
                acceptedVisuals.size(), 11 - acceptedVisuals.size(), target,
                RULES, List.copyOf(blockers),
                false, false, false, false, false, null);
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
