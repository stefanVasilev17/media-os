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

    @Test void fullVideoPlayerUrlChangesWhenANewFilmIsAssembled() {
        UUID packageId=UUID.randomUUID();
        UUID first=UUID.randomUUID();
        UUID second=UUID.randomUUID();
        String v1=Ep004DirectorSimpleFilmController.versionedFilmUrl(packageId,first);
        String v2=Ep004DirectorSimpleFilmController.versionedFilmUrl(packageId,second);
        assertNotEquals(v1,v2,"An updated film must remount the browser video player.");
        assertEquals(v1,Ep004DirectorSimpleFilmController.versionedFilmUrl(packageId,first),
                "Returning to the same saved film must keep an immutable URL.");
        assertTrue(v1.endsWith("?v="+first));
        assertTrue(v1.startsWith("/api/v1/episode-packages/"+packageId+"/film/video"));
    }

    @Test void fullFilmQueueStateNeverClaimsReadyBeforeActualVerifiedMaster() {
        var waiting=new Ep004DirectorSimpleFilmController.AssemblyState(
            "render-a,render-b","QUEUED",null);
        var running=new Ep004DirectorSimpleFilmController.AssemblyState(
            "render-a,render-b","RUNNING",null);
        var failed=new Ep004DirectorSimpleFilmController.AssemblyState(
            "render-a,render-b","ERROR","joining failed");
        assertEquals("WAITING_FOR_SHOT01",
            Ep004DirectorSimpleFilmController.filmState(false,0,waiting,"render-a,render-b"));
        assertEquals("ASSEMBLING",
            Ep004DirectorSimpleFilmController.filmState(false,2,waiting,"render-a,render-b"));
        assertEquals("ASSEMBLING",
            Ep004DirectorSimpleFilmController.filmState(false,2,running,"render-a,render-b"));
        assertEquals("ASSEMBLY_FAILED",
            Ep004DirectorSimpleFilmController.filmState(false,2,failed,"render-a,render-b"));
        assertEquals("ASSEMBLY_REQUIRED",
            Ep004DirectorSimpleFilmController.filmState(false,3,failed,
                "render-a,render-b,render-c"));
        assertEquals("ASSEMBLY_REQUIRED",
            Ep004DirectorSimpleFilmController.filmState(false,2,null,"render-a,render-b"));
        assertEquals("READY",
            Ep004DirectorSimpleFilmController.filmState(true,3,failed,"render-a,render-b"));
    }

    @Test void longFilmCapacityIsIndependentFromSmallIndividualShotBound() {
        assertEquals(256L*1024*1024,MediaObjectStore.MAX_VIDEO_BYTES);
        assertEquals(4L*1024*1024*1024,MediaObjectStore.MAX_FILM_BYTES);
        assertTrue(MediaObjectStore.MAX_FILM_BYTES>MediaObjectStore.MAX_VIDEO_BYTES);
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
