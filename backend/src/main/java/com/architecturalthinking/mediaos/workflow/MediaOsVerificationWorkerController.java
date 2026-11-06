package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.WorkloadCredentialService;
import com.architecturalthinking.mediaos.system.WorkloadIdentityFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/worker/verification")
public class MediaOsVerificationWorkerController {
    private final MediaOsVerificationRunService runs;

    public MediaOsVerificationWorkerController(MediaOsVerificationRunService runs) {
        this.runs=runs;
    }

    @PostMapping("/claim")
    public ResponseEntity<MediaOsVerificationRunService.Lease> claim(HttpServletRequest request) {
        var worker=requireVerificationWorker(request);
        var result=runs.claim(worker.workerId());
        return result==null?ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }

    @PostMapping("/{runId}/complete")
    public MediaOsVerificationRunService.Run complete(
            @PathVariable UUID runId,
            @RequestBody MediaOsVerificationRunService.Completion input,
            HttpServletRequest request) {
        var worker=requireVerificationWorker(request);
        return runs.complete(runId,worker.workerId(),input);
    }

    private static WorkloadCredentialService.Identity requireVerificationWorker(
            HttpServletRequest request) {
        Object identity=request.getAttribute(WorkloadIdentityFilter.VERIFIED_WORKER);
        if(!(identity instanceof WorkloadCredentialService.Identity worker)
                || !"VERIFICATION".equals(worker.scope()) || worker.jobId()!=null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Verified verification-only worker authorization required.");
        return worker;
    }
}
