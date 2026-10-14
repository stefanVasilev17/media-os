package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DirectorScriptAmendmentControllerTest {
    @Test
    void acceptsScopedShotFiveOnly() {
        assertDoesNotThrow(() -> DirectorScriptAmendmentController.validate(original(), revised(), 210, 160));
    }

    @Test
    void rejectsChangedLockedFirstFourShots() {
        var changed = new ArrayList<>(revised());
        var first = changed.get(0);
        changed.set(0, new LockedScriptImportController.TimelineBlock(
                first.sectionId(), first.sectionTitle(), first.shotKey(), first.startSecond(), first.endSecond(),
                "Changed narration that would corrupt a locked shot.", first.voiceDirection()));
        assertThrows(ResponseStatusException.class,
                () -> DirectorScriptAmendmentController.validate(original(), changed, 210, 160));
    }

    @Test
    void rejectsWrongDownstreamShift() {
        var changed = new ArrayList<>(revised());
        var last = changed.get(changed.size() - 1);
        changed.set(changed.size() - 1, new LockedScriptImportController.TimelineBlock(
                last.sectionId(), last.sectionTitle(), last.shotKey(), last.startSecond() + 1, last.endSecond(),
                last.narration(), last.voiceDirection()));
        assertThrows(ResponseStatusException.class,
                () -> DirectorScriptAmendmentController.validate(original(), changed, 210, 160));
    }

    private static List<Map<String, Object>> original() {
        var result = new ArrayList<Map<String, Object>>();
        for (int i = 1; i <= 16; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("shotKey", String.format("SHOT %02d", i));
            row.put("startSecond", (i - 1) * 10);
            row.put("endSecond", i * 10);
            row.put("narration", "Narration " + i);
            result.add(row);
        }
        return result;
    }

    private static List<LockedScriptImportController.TimelineBlock> revised() {
        var result = new ArrayList<LockedScriptImportController.TimelineBlock>();
        for (int i = 1; i <= 16; i++) {
            int start = (i - 1) * 10 + (i > 5 ? 50 : 0);
            if (i == 5) {
                int t = start;
                for (int j = 0; j < 7; j++) {
                    int next = start + (j + 1) * 60 / 7;
                    result.add(block(i, t, next, "Approved concept " + j));
                    t = next;
                }
            } else {
                result.add(block(i, start, start + 10, "Narration " + i));
            }
        }
        return result;
    }

    private static LockedScriptImportController.TimelineBlock block(int i, int start, int end, String narration) {
        return new LockedScriptImportController.TimelineBlock(
                "SEG-" + i + "-" + start, "Scene", String.format("SHOT %02d", i),
                start, end, narration, "Natural");
    }
}
