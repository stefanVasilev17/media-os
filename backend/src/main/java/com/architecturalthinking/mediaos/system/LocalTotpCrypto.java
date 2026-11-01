package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public final class LocalTotpCrypto {
    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public LocalTotpCrypto(@Value("${mediaos.local-auth.totp-encryption-key:}") String keyBase64) {
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(keyBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("A 32-byte local TOTP encryption key is required.", e);
        }
        if (bytes.length != 32) throw new IllegalStateException("A 32-byte local TOTP encryption key is required.");
        key = new SecretKeySpec(bytes, "AES");
        java.util.Arrays.fill(bytes, (byte) 0);
    }

    public String encrypt(String secret) {
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] encoded = cipher.doFinal(secret.getBytes(StandardCharsets.US_ASCII));
            byte[] result = new byte[iv.length + encoded.length];
            System.arraycopy(iv, 0, result, 0, iv.length);
            System.arraycopy(encoded, 0, result, iv.length, encoded.length);
            return "v1:" + Base64.getUrlEncoder().withoutPadding().encodeToString(result);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP encryption failed.", e);
        }
    }

    public String decrypt(String encrypted) {
        try {
            if (encrypted == null || !encrypted.startsWith("v1:")) {
                throw new IllegalArgumentException("Unknown encrypted TOTP format.");
            }
            byte[] data = Base64.getUrlDecoder().decode(encrypted.substring(3));
            if (data.length < 29) throw new IllegalArgumentException("Invalid encrypted TOTP.");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, data, 0, 12));
            return new String(cipher.doFinal(data, 12, data.length - 12), StandardCharsets.US_ASCII);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP decryption failed.", e);
        }
    }
}
