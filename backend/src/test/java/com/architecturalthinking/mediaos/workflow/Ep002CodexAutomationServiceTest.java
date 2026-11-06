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
    void distinguishesDefiniteNoSubmissionFromUncertainRemoteOutcome() {
        assertEquals("REMOTE_FAILED",Ep002CodexAutomationService.classifySubmission(
                new CodexCloudCliGateway.Submission("NOT_SUBMITTED",null,
                        "CLOUD_CLI_AUTOMATION_DISABLED")));
        assertEquals("REMOTE_UNKNOWN",Ep002CodexAutomationService.classifySubmission(
                new CodexCloudCliGateway.Submission("REMOTE_UNKNOWN",null,
                        "SUBMISSION_TIMED_OUT_RECONCILE_WITH_PROVIDER")));
        assertEquals("REMOTE_UNKNOWN",Ep002CodexAutomationService.classifySubmission(null));
        assertEquals("REMOTE_CREATED",Ep002CodexAutomationService.classifySubmission(
                new CodexCloudCliGateway.Submission("REMOTE_CREATED",
                        "task_e_0123456789abcdef","TASK_ID_RETURNED_BY_OFFICIAL_CLI")));
        assertEquals("REMOTE_UNKNOWN",Ep002CodexAutomationService.classifySubmission(
                new CodexCloudCliGateway.Submission("REMOTE_CREATED",null,
                        "MISSING_TASK_ID")));
    }

    @Test
    void isolatedChatgptCodexExecCompletionNeverPretendsScenePrIsVerified() {
        assertEquals("LOCAL_CODE_READY",Ep002CodexAutomationService.classifyLocalSubmission(
                new CodexLocalExecGateway.Result("FINISHED_UNVERIFIED",
                        "c12a56b9-b6aa-4a30-b027-72f894f02bc0","CODE_READY")));
        assertEquals("REMOTE_FAILED",Ep002CodexAutomationService.classifyLocalSubmission(
                new CodexLocalExecGateway.Result("NOT_SUBMITTED",null,"LOGIN_MISSING")));
        assertEquals("REMOTE_UNKNOWN",Ep002CodexAutomationService.classifyLocalSubmission(
                new CodexLocalExecGateway.Result("UNKNOWN",null,"INTERRUPTED")));
        assertEquals("REMOTE_UNKNOWN",Ep002CodexAutomationService.classifyLocalSubmission(
                new CodexLocalExecGateway.Result("FINISHED_UNVERIFIED",null,"MISSING_SESSION")));
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
