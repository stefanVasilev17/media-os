package com.architecturalthinking.mediaos.remotion;

import java.util.Map;
import java.util.Optional;

public record RemotionClipPreviewRange(int startFrame, int endFrame) {

    public static final String INPUT_KEY = "__mediaOsClipRange";

    public static RemotionClipPreviewRange validateRequest(
            Integer startFrame, Integer endFrame, int sourceDurationFrames, int fps
    ) {
        if (startFrame == null || endFrame == null) {
            throw new IllegalArgumentException("CLIP_PREVIEW requires both startFrame and endFrame.");
        }
        if (fps <= 0 || sourceDurationFrames <= 0
                || startFrame < 0 || endFrame < startFrame || endFrame >= sourceDurationFrames) {
            throw new IllegalArgumentException("CLIP_PREVIEW frame range is outside composition bounds.");
        }
        long count = (long) endFrame - startFrame + 1L;
        if (count > Math.min(900L, (long) fps * 30L)) {
            throw new IllegalArgumentException("CLIP_PREVIEW supports at most 30 seconds (maximum 900 frames).");
        }
        return new RemotionClipPreviewRange(startFrame, endFrame);
    }

    public Map<String, Integer> asMetadata() {
        return Map.of("startFrame", startFrame, "endFrame", endFrame);
    }

    public int renderedFrames() {
        return endFrame - startFrame + 1;
    }

    public static Optional<RemotionClipPreviewRange> fromStoredProps(Map<String, Object> props) {
        if (props == null || !props.containsKey(INPUT_KEY)) {
            return Optional.empty();
        }
        Object value = props.get(INPUT_KEY);
        if (!(value instanceof Map<?, ?> map)
                || !(map.get("startFrame") instanceof Number start)
                || !(map.get("endFrame") instanceof Number end)) {
            throw new IllegalArgumentException("Invalid persisted CLIP_PREVIEW metadata.");
        }
        return Optional.of(new RemotionClipPreviewRange(start.intValue(), end.intValue()));
    }
}
