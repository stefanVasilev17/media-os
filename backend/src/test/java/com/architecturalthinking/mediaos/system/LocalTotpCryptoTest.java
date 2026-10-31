package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class LocalTotpCryptoTest {
    private String key(byte value) {
        byte[] bytes = new byte[32];
        java.util.Arrays.fill(bytes, value);
        return Base64.getEncoder().encodeToString(bytes);
    }

    @Test
    void encryptsWithRandomNonceAndRejectsOtherKeys() {
        LocalTotpCrypto a = new LocalTotpCrypto(key((byte) 1));
        LocalTotpCrypto b = new LocalTotpCrypto(key((byte) 2));
        String encrypted = a.encrypt("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        assertTrue(encrypted.startsWith("v1:"));
        assertFalse(encrypted.contains("GEZDGNBV"));
        assertEquals("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", a.decrypt(encrypted));
        assertNotEquals(encrypted, a.encrypt("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"));
        assertThrows(IllegalStateException.class, () -> b.decrypt(encrypted));
    }

    @Test
    void rejectsAbsentEncryptionKey() {
        assertThrows(IllegalStateException.class, () -> new LocalTotpCrypto(""));
    }
}
