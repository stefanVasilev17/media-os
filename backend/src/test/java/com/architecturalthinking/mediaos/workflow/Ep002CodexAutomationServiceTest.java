package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class Ep002CodexAutomationServiceTest {
    private static Ep002CodexAutomationService.ArmRequest valid() {
        return new Ep002CodexAutomationService.ArmRequest(
                UUID.randomUUID(),"a".repeat(64),10,true);
    }

    @Test
    void armConsentRequiresBoundedOneTimeDirectorApproval() {
        assertDoesNotThrow(()->Ep002CodexAutomationService.validateArm(valid()));
        var original=valid();
        var denied=new Ep002CodexAutomationService.ArmRequest(
                original.requestId(),original.expectedEpisodeFingerprint(),
                original.maximumTaskSubmissions(),false);
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,
                    ()->Ep002CodexAutomationService.validateArm(denied)).getStatusCode());
    }

    @Test
    void cannotEnableUnlimitedOrInvalidSubscriptionUsage() {
        for(int count:new int[]{0,-1,21,100}) {
            var input=new Ep002CodexAutomationService.ArmRequest(
                    UUID.randomUUID(),"a".repeat(64),count,true);
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                        ()->Ep002CodexAutomationService.validateArm(input)).getStatusCode());
        }
    }

    @Test
    void cannotArmUsingStaleOrEmptyInputFingerprint() {
        for(String fingerprint:new String[]{null,"", "0".repeat(40),"z".repeat(64)}) {
            var request=new Ep002CodexAutomationService.ArmRequest(
                    UUID.randomUUID(),fingerprint,10,true);
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                        ()->Ep002CodexAutomationService.validateArm(request)).getStatusCode());
        }
    }

    @Test
    void defaultCloudCliAdapterNeverStartsACloudTask() {
        var gateway=new CodexCloudCliGateway(false,"", "");
        var capability=gateway.probe();
        assertFalse(capability.supported());
        assertEquals("CLOUD_CLI_AUTOMATION_DISABLED",capability.reason());
        var submission=gateway.submit("Remotion SHOT02 test only");
        assertEquals("NOT_SUBMITTED",submission.state());
        assertNull(submission.taskId());
    }
}
