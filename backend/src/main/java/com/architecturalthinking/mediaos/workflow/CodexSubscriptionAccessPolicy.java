package com.architecturalthinking.mediaos.workflow;

/**
 * The Director accepts subscription-included Codex only.
 * Hosted provider authorization and the permitted token/runtime model remain unverified.
 * This fixed fail-closed policy is deliberate: never infer approval from environment variables,
 * a preexisting CLI login, a ChatGPT identity token, or an API key.
 */
public final class CodexSubscriptionAccessPolicy {
    private CodexSubscriptionAccessPolicy() {}

    public static final String BLOCKER="OPENAI_HOSTED_SIWC_PLAN_USAGE_APPROVAL_PENDING";

    public record Readiness(
            String applicationStatus,
            String applicationEvidence,
            String requiredPermission,
            String runtime,
            String blocker,
            boolean chatGptSubscriptionOnly,
            boolean paidApiFallbackAllowed,
            boolean hostedPlanUseVerified,
            boolean providerApprovedTokenHandling,
            boolean canConnect,
            boolean canDispatch) {}

    public static Readiness readiness() {
        return new Readiness(
                "SUBMITTED_AWAITING_OPENAI_RESPONSE",
                "DIRECTOR_REPORTED_SUBMISSION_NOT_PROVIDER_VERIFIED",
                "CHATGPT_PLAN_USAGE_NOT_IDENTITY_ONLY",
                "CLOUD_HOSTED_NO_LOCAL_MACHINE",
                BLOCKER,
                true,
                false,
                false,
                false,
                false,
                false);
    }

    public static boolean hostedAccessGranted() {
        return false;
    }
}
