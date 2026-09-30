package com.architecturalthinking.mediaos.system;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/ai-control")
public class AiRuntimePolicyController {

    private final AiRuntimePolicyService policyService;

    public AiRuntimePolicyController(AiRuntimePolicyService policyService) {
        this.policyService = policyService;
    }

    public record UpdateRequest(Boolean paidAiEnabled, Boolean autoRepairEnabled) {}

    @GetMapping
    public Map<String, Object> state() {
        return policyService.snapshot();
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody(required = false) UpdateRequest request) {
        if (request == null) return policyService.snapshot();
        return policyService.update(request.paidAiEnabled(), request.autoRepairEnabled());
    }
}
