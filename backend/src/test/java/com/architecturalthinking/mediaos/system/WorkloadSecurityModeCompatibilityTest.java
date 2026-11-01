package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WorkloadSecurityModeCompatibilityTest {
    @Test
    void googleDirectorAndScopedWorkerAuthenticationCoexist() {
        assertDoesNotThrow(() -> new WorkloadSecurityConfiguration(false, false, true));
    }

    @Test
    void localDirectorAndScopedWorkerAuthenticationStillCoexist() {
        assertDoesNotThrow(() -> new WorkloadSecurityConfiguration(true, false, false));
    }

    @Test
    void bearerOidcDirectorAndScopedWorkerAuthenticationCoexist() {
        assertDoesNotThrow(() -> new WorkloadSecurityConfiguration(false, true, false));
    }

    @Test
    void scopedWorkersMustNotRunWithoutDirectorIdentityMode() {
        assertThrows(IllegalStateException.class,
                () -> new WorkloadSecurityConfiguration(false, false, false));
    }

    @Test
    void ambiguousDirectorIdentityModesFailClosed() {
        assertThrows(IllegalStateException.class,
                () -> new WorkloadSecurityConfiguration(true, false, true));
        assertThrows(IllegalStateException.class,
                () -> new WorkloadSecurityConfiguration(false, true, true));
        assertThrows(IllegalStateException.class,
                () -> new WorkloadSecurityConfiguration(true, true, false));
        assertThrows(IllegalStateException.class,
                () -> new WorkloadSecurityConfiguration(true, true, true));
    }
}
