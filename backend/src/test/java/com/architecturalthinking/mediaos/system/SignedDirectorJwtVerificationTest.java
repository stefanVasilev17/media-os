package com.architecturalthinking.mediaos.system;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SignedDirectorJwtVerificationTest {
    private static final String ISSUER = "https://identity.example";
    private static final String AUDIENCE = "mediaos-api";
    private static KeyPair trustedKey;
    private static KeyPair foreignKey;
    private static NimbusJwtDecoder decoder;

    @BeforeAll
    static void createEphemeralSigningKeys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        trustedKey = generator.generateKeyPair();
        foreignKey = generator.generateKeyPair();
        decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) trustedKey.getPublic()).build();
        decoder.setJwtValidator(DirectorSecurityConfiguration.requiredJwtClaims(ISSUER, AUDIENCE));
    }

    private String signedJwt(KeyPair key, String issuer, String audience,
                             String subject, Instant issuedAt, Instant notBefore,
                             Instant expiresAt) throws Exception {
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .issueTime(Date.from(issuedAt))
                .notBeforeTime(Date.from(notBefore))
                .expirationTime(Date.from(expiresAt));
        if (subject != null) {
            claims.subject(subject);
        }

        SignedJWT signed = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).build(), claims.build());
        signed.sign(new RSASSASigner((RSAPrivateKey) key.getPrivate()));
        return signed.serialize();
    }

    private String token(KeyPair key, String issuer, String audience,
                         String subject, Instant notBefore, Instant expiresAt) throws Exception {
        return signedJwt(key, issuer, audience, subject,
                Instant.now().minusSeconds(30), notBefore, expiresAt);
    }

    @Test
    void acceptsValidTokenSignedByTrustedIdentityKey() throws Exception {
        String value = token(trustedKey, ISSUER, AUDIENCE, "director-42",
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        var decoded = decoder.decode(value);
        assertEquals("director-42", decoded.getSubject());
        assertEquals(ISSUER, decoded.getIssuer().toString());
    }

    @Test
    void rejectsSameClaimsSignedByForeignKey() throws Exception {
        String forged = token(foreignKey, ISSUER, AUDIENCE, "director-42",
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        assertThrows(JwtException.class, () -> decoder.decode(forged));
    }

    @Test
    void rejectsTamperedPayload() throws Exception {
        String value = token(trustedKey, ISSUER, AUDIENCE, "director-42",
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        String[] parts = value.split("\\.");
        char[] payload = parts[1].toCharArray();
        payload[12] = payload[12] == 'A' ? 'B' : 'A';
        String tampered = parts[0] + "." + new String(payload) + "." + parts[2];
        assertThrows(JwtException.class, () -> decoder.decode(tampered));
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        String expired = token(trustedKey, ISSUER, AUDIENCE, "director-42",
                Instant.now().minusSeconds(120), Instant.now().minusSeconds(90));
        assertThrows(JwtException.class, () -> decoder.decode(expired));
    }

    @Test
    void rejectsWrongIssuerOrAudience() throws Exception {
        String issuer = token(trustedKey, "https://fake-id.example", AUDIENCE, "director-42",
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        String audience = token(trustedKey, ISSUER, "other-api", "director-42",
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        assertAll(
                () -> assertThrows(JwtException.class, () -> decoder.decode(issuer)),
                () -> assertThrows(JwtException.class, () -> decoder.decode(audience)));
    }

    @Test
    void rejectsTokenBeforeItsValidityWindow() throws Exception {
        String future = token(trustedKey, ISSUER, AUDIENCE, "director-42",
                Instant.now().plusSeconds(600), Instant.now().plusSeconds(900));
        assertThrows(JwtException.class, () -> decoder.decode(future));
    }

    @Test
    void rejectsMissingSubject() throws Exception {
        String anonymous = token(trustedKey, ISSUER, AUDIENCE, null,
                Instant.now().minusSeconds(20), Instant.now().plusSeconds(120));
        assertThrows(JwtException.class, () -> decoder.decode(anonymous));
    }
}
