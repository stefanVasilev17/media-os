package com.architecturalthinking.mediaos.system;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.Arrays;

public final class LocalTotp {
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private LocalTotp() {}

    public static byte[] fromBase32(String value) {
        if (value == null || value.length() < 32 || value.length() > 128) {
            throw new IllegalArgumentException("TOTP secret must contain 32-128 Base32 characters.");
        }
        int buffer = 0, bits = 0, index = 0;
        byte[] bytes = new byte[value.length() * 5 / 8];
        for (char c : value.toUpperCase(java.util.Locale.ROOT).toCharArray()) {
            int v = ALPHABET.indexOf(c);
            if (v < 0) throw new IllegalArgumentException("Invalid Base32 TOTP secret.");
            buffer = (buffer << 5) | v;
            bits += 5;
            if (bits >= 8) {
                bits -= 8;
                bytes[index++] = (byte) (buffer >> bits);
            }
        }
        if (bits > 0 && (buffer & ((1 << bits) - 1)) != 0) {
            throw new IllegalArgumentException("TOTP secret has invalid padding bits.");
        }
        return Arrays.copyOf(bytes, index);
    }

    public static long verifyStep(String base32Secret, String providedCode,
                                  Instant now, long lastUsedStep) {
        if (providedCode == null || !providedCode.matches("[0-9]{6}")) return -1;
        byte[] secret = fromBase32(base32Secret);
        try {
            long current = Math.floorDiv(now.getEpochSecond(), 30);
            for (long step = current - 1; step <= current + 1; step++) {
                if (step <= lastUsedStep || step < 0) continue;
                String expected = codeAt(secret, step);
                if (java.security.MessageDigest.isEqual(
                        expected.getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                        providedCode.getBytes(java.nio.charset.StandardCharsets.US_ASCII))) {
                    return step;
                }
            }
            return -1;
        } finally {
            Arrays.fill(secret, (byte) 0);
        }
    }

    private static String codeAt(byte[] secret, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            byte[] hmac = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset = hmac[hmac.length - 1] & 0x0F;
            int value = ((hmac[offset] & 0x7F) << 24)
                    | ((hmac[offset + 1] & 0xFF) << 16)
                    | ((hmac[offset + 2] & 0xFF) << 8)
                    | (hmac[offset + 3] & 0xFF);
            return "%06d".formatted(value % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA1 unavailable.", e);
        }
    }
}
