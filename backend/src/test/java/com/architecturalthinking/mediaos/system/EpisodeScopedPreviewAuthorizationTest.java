package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class EpisodeScopedPreviewAuthorizationTest {
    private final PreviewAuthorizationService previews = new PreviewAuthorizationService(mock(JdbcClient.class));
    private final UUID ep2 = UUID.fromString("33333333-3333-4333-8333-333333333333");
    private final UUID ep3 = UUID.fromString("44444444-4444-4444-8444-444444444444");

    @Test
    void cannotReplayAuthorizationBetweenEpisodes() {
        String a = previews.episodeCreativePayload(ep2, "SCRIPT", "GENERATE", "", 0, 1);
        String b = previews.episodeCreativePayload(ep3, "SCRIPT", "GENERATE", "", 0, 1);
        assertThat(a).isNotEqualTo(b);
        assertThat(a).contains("EPISODE=" + ep2);
        assertThat(b).contains("EPISODE=" + ep3);
    }

    @Test
    void cannotReplayAcrossStageRevisionOrLockedUpstreamRevision() {
        String original = previews.episodeCreativePayload(ep2, "SCRIPT", "REVISE", "Fix delay example", 2, 1);
        assertThat(original).isNotEqualTo(
                previews.episodeCreativePayload(ep2, "SCRIPT", "REVISE", "Fix delay example", 3, 1));
        assertThat(original).isNotEqualTo(
                previews.episodeCreativePayload(ep2, "SCRIPT", "REVISE", "Fix delay example", 2, 2));
        assertThat(original).isNotEqualTo(
                previews.episodeCreativePayload(ep2, "SCENE", "REVISE", "Fix delay example", 2, 1));
        assertThat(original).isNotEqualTo(
                previews.episodeCreativePayload(ep2, "SCRIPT", "REVISE", "Different creator correction", 2, 1));
        assertThat(original).isNotEqualTo(previews.creativePayload("SCRIPT", "REVISE", "Fix delay example"));
    }

    @Test
    void rejectsIncompletePreviewScope() {
        assertThrows(IllegalArgumentException.class, () ->
                previews.episodeCreativePayload(ep2, "SCRIPT", "GENERATE", "", -1, 1));
        assertThrows(IllegalArgumentException.class, () ->
                previews.episodeCreativePayload(ep2, "SCRIPT", "GENERATE", "", 0, 0));
        assertThrows(IllegalArgumentException.class, () ->
                previews.episodeCreativePayload(null, "SCRIPT", "GENERATE", "", 0, 1));
    }
}
