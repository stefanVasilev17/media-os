package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MediaOsVerificationAutoServiceTest {
    @Test
    void boundedDirectorConsentIsRequiredBeforeAutomaticRevisionTesting() {
        var valid=new MediaOsVerificationAutoService.ArmRequest(
                UUID.randomUUID(),5,true);
        assertDoesNotThrow(()->MediaOsVerificationAutoService.validate(valid));
        for(int max:new int[]{-1,0,21,100}){
            var rejected=new MediaOsVerificationAutoService.ArmRequest(
                    UUID.randomUUID(),max,true);
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                            ()->MediaOsVerificationAutoService.validate(rejected))
                            .getStatusCode());
        }
        var unapproved=new MediaOsVerificationAutoService.ArmRequest(
                UUID.randomUUID(),5,false);
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                        ()->MediaOsVerificationAutoService.validate(unapproved))
                        .getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                        ()->MediaOsVerificationAutoService.validate(null))
                        .getStatusCode());
    }
}
