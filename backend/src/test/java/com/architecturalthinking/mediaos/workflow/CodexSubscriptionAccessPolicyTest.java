package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CodexSubscriptionAccessPolicyTest {
    @Test
    void reportedPartnerApplicationIsNotAConnectedHostedCodexAccount() {
        var status=CodexSubscriptionAccessPolicy.readiness();
        assertEquals("SUBMITTED_AWAITING_OPENAI_RESPONSE",status.applicationStatus());
        assertEquals("DIRECTOR_REPORTED_SUBMISSION_NOT_PROVIDER_VERIFIED",
                status.applicationEvidence());
        assertEquals("CHATGPT_PLAN_USAGE_NOT_IDENTITY_ONLY",
                status.requiredPermission());
        assertEquals("CLOUD_HOSTED_NO_LOCAL_MACHINE",status.runtime());
        assertEquals(CodexSubscriptionAccessPolicy.BLOCKER,status.blocker());
        assertFalse(status.hostedPlanUseVerified());
        assertFalse(status.providerApprovedTokenHandling());
        assertFalse(status.canConnect());
        assertFalse(status.canDispatch());
        assertFalse(CodexSubscriptionAccessPolicy.hostedAccessGranted());
    }

    @Test
    void onlySubscriptionUsageIsAllowedAndNoPaidProviderFallbackExists() {
        var status=CodexSubscriptionAccessPolicy.readiness();
        assertTrue(status.chatGptSubscriptionOnly());
        assertFalse(status.paidApiFallbackAllowed());
    }
}
