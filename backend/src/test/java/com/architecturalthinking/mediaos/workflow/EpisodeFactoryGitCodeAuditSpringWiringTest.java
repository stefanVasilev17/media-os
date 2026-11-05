package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class EpisodeFactoryGitCodeAuditSpringWiringTest {
    @Test
    void springCanCreateTheLiveGitAuditServiceWithItsObjectMapperDependency() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(ObjectMapper.class);
            context.registerBean(EpisodeFactoryGitCodeAuditService.class);
            context.refresh();
            assertNotNull(context.getBean(EpisodeFactoryGitCodeAuditService.class));
        }
    }
}
