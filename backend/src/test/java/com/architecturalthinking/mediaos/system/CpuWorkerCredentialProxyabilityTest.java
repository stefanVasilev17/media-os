package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Modifier;

import static org.junit.jupiter.api.Assertions.*;

class CpuWorkerCredentialProxyabilityTest {
    @Test
    void transactionalLeaseControllerCanBeSubclassedBySpringProxy() throws Exception {
        assertFalse(Modifier.isFinal(CpuWorkerCredentialLeaseController.class.getModifiers()));
        assertNotNull(CpuWorkerCredentialLeaseController.class.getMethod(
                "issue", String.class, String.class, String.class
        ).getAnnotation(Transactional.class));
    }
}
