package com.architecturalthinking.mediaos.system;

final class EpisodeFactoryDirectorRoutes {
    static final String[] POST_PATHS = {
            "/api/v1/creative/episodes/EP002/shots/{shotKey}/generate-slow",
            "/api/v1/creative/episodes/EP002/shots/SHOT03/render-preview",
            "/api/v1/creative/episodes/EP002/visual-feedback",
            "/api/v1/creative/episodes/EP002/visual-approvals",
            "/api/v1/creative/episodes/EP002/voice-cue-review/{shotKey}",
            "/api/v1/verification/runs",
            "/api/v1/verification/runs/{runId}/cancel",
            "/api/v1/verification/automation/arm",
            "/api/v1/verification/automation/pause",
            "/api/v1/creative/episodes/EP002/codex-automation/arm",
            "/api/v1/creative/episodes/EP002/codex-automation/pause",
            "/api/v1/creative/episodes/EP002/codex-automation/resume",
            "/api/v1/episode-packages/{packageId}/factory-production/runs",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/verify-github",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/feedback",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/revision-pr",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/queue-shots",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/approve-shots",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/queue-master",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/queue-shorts",
            "/api/v1/episode-packages/{packageId}/factory-production/runs/{runId}/approve-final"
    };

    private EpisodeFactoryDirectorRoutes() {
    }
}
