package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class Ep004DirectorSimpleFilmControllerTest {
    private static Ep004DirectorSimpleFilmController.ShotLock locked(String shot) {
        return new Ep004DirectorSimpleFilmController.ShotLock(
            shot,UUID.nameUUIDFromBytes(shot.getBytes()),OffsetDateTime.now());
    }

    @Test void onlyVerifiableProductionCompositionsCanBeDirectorLocked() {
        assertEquals("EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL",
            Ep004DirectorSimpleFilmController.composition("SHOT01"));
        assertEquals("EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL",
            Ep004DirectorSimpleFilmController.composition("SHOT02"));
        assertEquals("EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL",
            Ep004DirectorSimpleFilmController.composition("SHOT03"));
        assertThrows(ResponseStatusException.class,
            ()->Ep004DirectorSimpleFilmController.composition("SHOT04"));
        assertThrows(ResponseStatusException.class,
            ()->Ep004DirectorSimpleFilmController.composition("../SHOT03"));
    }

    @Test void filmNeverSkipsAnUnapprovedOrMissingIntermediateShot() {
        var shot1=locked("SHOT01");
        var shot3=locked("SHOT03");
        assertEquals(List.of(shot1),Ep004DirectorSimpleFilmController.consecutive(
            List.of(shot1,shot3)));
        assertTrue(Ep004DirectorSimpleFilmController.consecutive(List.of(shot3)).isEmpty());
        var shot2=locked("SHOT02");
        assertEquals(List.of(shot1,shot2,shot3),
            Ep004DirectorSimpleFilmController.consecutive(List.of(shot3,shot1,shot2)));
        assertEquals(shot1.renderId()+","+shot2.renderId()+","+shot3.renderId(),
            Ep004DirectorSimpleFilmController.identity(List.of(shot1,shot2,shot3)));
    }

    @Test void renderFingerprintChangesIfDirectorRelocksOneShot() {
        var shot1=locked("SHOT01");
        var a=new Ep004DirectorSimpleFilmController.ShotLock(
            "SHOT02",UUID.randomUUID(),OffsetDateTime.now());
        var b=new Ep004DirectorSimpleFilmController.ShotLock(
            "SHOT02",UUID.randomUUID(),OffsetDateTime.now());
        assertNotEquals(Ep004DirectorSimpleFilmController.identity(List.of(shot1,a)),
            Ep004DirectorSimpleFilmController.identity(List.of(shot1,b)));
    }
}
