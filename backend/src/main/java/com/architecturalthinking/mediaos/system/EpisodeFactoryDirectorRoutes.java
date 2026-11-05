package com.architecturalthinking.mediaos.system;

final class EpisodeFactoryDirectorRoutes {
    static final String[] POST_PATHS = {
            "/api/v1/creative/episodes/EP002/visual-feedback",
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
