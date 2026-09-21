package com.architecturalthinking.mediaos.spline;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class SplineCommandOptimizer {

    private static final Pattern CREATE_ACTION = Pattern.compile(
            "(?i)\\b(create|build|make|clone|duplicate)\\b"
    );
    private static final Pattern TARGET_ROOT = Pattern.compile(
            "\\b(MEDIA_OS_[A-Z0-9_]{1,80})\\b"
    );
    private static final Pattern REFERENCE_BACKTICK = Pattern.compile(
            "(?is)\\buse\\s+(?:the\\s+)?(?:existing\\s+)?`([^`]{1,120})`[^.\\r\\n]{0,180}\\breference\\b"
    );
    private static final Pattern REFERENCE_QUOTED = Pattern.compile(
            "(?is)\\buse\\s+(?:the\\s+)?(?:existing\\s+)?[\"']([^\"']{1,120})[\"'][^.\\r\\n]{0,180}\\breference\\b"
    );
    private static final Pattern REFERENCE_PLAIN = Pattern.compile(
            "(?is)\\buse\\s+(?:the\\s+)?(?:existing\\s+)?([A-Za-z][A-Za-z0-9 _-]{0,80}?)(?:\\s+card|\\s+component|\\s+object)?\\s+as\\s+(?:the\\s+)?(?:visual\\s+)?reference\\b"
    );
    private static final Pattern TITLE_BACKTICK = Pattern.compile(
            "(?is)\\b(?:title(?:\\s+text)?|text)\\s+(?:to|as)\\s+`([^`]{1,120})`"
    );
    private static final Pattern TITLE_QUOTED = Pattern.compile(
            "(?is)\\b(?:title(?:\\s+text)?|text)\\s+(?:to|as)\\s+[\"']([^\"']{1,120})[\"']"
    );

    private SplineCommandOptimizer() {}

    record ReferenceComponentCreateIntent(
            String targetRootName,
            String referenceObjectName,
            String titleText,
            String placementPolicy
    ) {}

    static Optional<ReferenceComponentCreateIntent> tryParseReferenceComponentCreate(String message) {
        if (message == null || message.isBlank() || !CREATE_ACTION.matcher(message).find()) {
            return Optional.empty();
        }

        Matcher targetMatcher = TARGET_ROOT.matcher(message);
        if (!targetMatcher.find()) {
            return Optional.empty();
        }

        String targetRootName = targetMatcher.group(1).trim();
        String referenceObjectName = firstMatch(
                message,
                REFERENCE_BACKTICK,
                REFERENCE_QUOTED,
                REFERENCE_PLAIN
        );

        if (referenceObjectName == null || referenceObjectName.isBlank()) {
            return Optional.empty();
        }

        referenceObjectName = referenceObjectName.trim();
        if (referenceObjectName.equalsIgnoreCase(targetRootName)) {
            return Optional.empty();
        }

        String titleText = firstMatch(message, TITLE_BACKTICK, TITLE_QUOTED);
        if (titleText != null) {
            titleText = titleText.trim();
            if (titleText.isBlank()) {
                titleText = null;
            }
        }

        String normalized = message.toLowerCase(Locale.ROOT);
        String placementPolicy;
        if (normalized.contains("below") && normalized.contains("architecture map")) {
            placementPolicy = "BELOW_MAIN_ARCHITECTURE_MAP";
        } else if (normalized.contains("empty area")) {
            placementPolicy = "EMPTY_AREA";
        } else {
            placementPolicy = "NEAREST_SAFE_EMPTY_AREA";
        }

        return Optional.of(new ReferenceComponentCreateIntent(
                targetRootName,
                referenceObjectName,
                titleText,
                placementPolicy
        ));
    }

    private static String firstMatch(String message, Pattern... patterns) {
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(message);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }
}
