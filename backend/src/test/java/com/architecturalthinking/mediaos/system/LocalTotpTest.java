package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class LocalTotpTest {
    private static final String RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    @Test
    void acceptsRfc6238SixDigitHmacSha1AndPreventsReplay() {
        assertEquals(1, LocalTotp.verifyStep(RFC_SECRET, "287082", Instant.ofEpochSecond(59), -1));
        assertEquals(-1, LocalTotp.verifyStep(RFC_SECRET, "287082", Instant.ofEpochSecond(59), 1));
    }

    @Test
    void rejectsMalformedOtpAndMalformedSecrets() {
        assertEquals(-1, LocalTotp.verifyStep(RFC_SECRET, "12345", Instant.ofEpochSecond(59), -1));
        assertEquals(-1, LocalTotp.verifyStep(RFC_SECRET, "1234567", Instant.ofEpochSecond(59), -1));
        assertEquals(-1, LocalTotp.verifyStep(RFC_SECRET, "ABCDEF", Instant.ofEpochSecond(59), -1));
        assertThrows(IllegalArgumentException.class,
                () -> LocalTotp.fromBase32("invalid***"));
    }
}
