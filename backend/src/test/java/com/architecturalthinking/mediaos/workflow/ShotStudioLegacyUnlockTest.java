package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class ShotStudioLegacyUnlockTest {
    @Test
    void allSixteenCanonicalKeysHaveStableShotNumbers() {
        for(int n=1;n<=16;n++) {
            String key=String.format("SHOT %02d",n);
            assertEquals(n,ShotStudioController.originalShotNumber(key));
        }
    }

    @Test
    void unlockCannotTargetNonCanonicalOrForgedShots() {
        for(String key:new String[]{
                "", "SHOT 00","SHOT 17","SHOT 100","SHOT 01-C01","SHOT 05 ",
                "SHOT 5","SHOT -1","SHOT 01';delete from studio_shot;--"
        }) {
            var error=assertThrows(ResponseStatusException.class,
                ()->ShotStudioController.originalShotNumber(key));
            assertEquals(HttpStatus.BAD_REQUEST,error.getStatusCode());
        }
    }

    @Test
    void nullIsNeverAValidOriginalShot() {
        assertThrows(ResponseStatusException.class,
            ()->ShotStudioController.originalShotNumber(null));
    }
}
