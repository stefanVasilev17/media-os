package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/visual-feedback")
public class Ep002VisualDirectorFeedbackController {
    private final Ep002VisualDirectorFeedbackService feedback;

    public Ep002VisualDirectorFeedbackController(Ep002VisualDirectorFeedbackService feedback) {
        this.feedback=feedback;
    }

    @GetMapping
    public List<Ep002VisualDirectorFeedbackService.Feedback> list() {
        return feedback.list();
    }

    @PostMapping
    public Ep002VisualDirectorFeedbackService.Feedback submit(
            @RequestBody Ep002VisualDirectorFeedbackService.SubmitRequest request,
            HttpServletRequest http) {
        Object value=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(value instanceof Map<?,?> data) || !(data.get("auditId") instanceof UUID auditId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Director feedback requires a verified production preflight audit.");
        }
        return feedback.submit(request,auditId);
    }
}
