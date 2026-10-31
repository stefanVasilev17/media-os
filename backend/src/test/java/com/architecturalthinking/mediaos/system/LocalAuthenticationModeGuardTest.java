package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LocalAuthenticationModeGuardTest {
    @Test
    void refusesSimultaneousLocalAndOidcConfiguration() {
        assertThrows(IllegalStateException.class, () -> new LocalAuthenticationModeGuard(true, true));
    }

    @Test
    void supportsLocalOnlyWithoutExternalProvider() {
        assertDoesNotThrow(() -> new LocalAuthenticationModeGuard(true, false));
        assertDoesNotThrow(() -> new LocalAuthenticationModeGuard(false, false));
    }
}
