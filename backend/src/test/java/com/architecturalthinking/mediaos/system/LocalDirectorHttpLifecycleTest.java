package com.architecturalthinking.mediaos.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnabledIfEnvironmentVariable(named = "CI_POSTGRES_URL", matches = ".+")
@SpringBootTest(
        classes = LocalDirectorHttpLifecycleTest.LocalHttpTestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=${CI_POSTGRES_URL}",
        "spring.datasource.username=media_os",
        "spring.datasource.password=media_os",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.session.jdbc.initialize-schema=never",
        "mediaos.local-auth.enabled=true",
        "mediaos.director-security.enabled=false",
        "mediaos.local-auth.bootstrap.enabled=false",
        "mediaos.local-auth.totp-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
class LocalDirectorHttpLifecycleTest {
    private static final String TOTP_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    private static final String PASSWORD = "temporary-test-only-strong-password";

    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {HibernateJpaAutoConfiguration.class, JpaRepositoriesAutoConfiguration.class})
    @Import({
            LocalDirectorSecurityConfiguration.class,
            LocalDirectorAuthController.class,
            DirectorSessionController.class,
            LocalDirectorLoginService.class,
            LocalDirectorLoginThrottle.class,
            LocalTotpCrypto.class,
            LocalDirectorSessionRevalidationFilter.class,
            ProbeController.class
    })
    static class LocalHttpTestApplication {}

    @RestController
    public static class ProbeController {
        @PostMapping("/api/v1/episodes")
        public String permittedMutation() {
            return "allowed";
        }
    }

    @Autowired private MockMvc mvc;
    @Autowired private JdbcClient jdbc;
    @Autowired private PasswordEncoder encoder;
    @Autowired private LocalTotpCrypto crypto;
    @Autowired private ObjectMapper mapper;

    private UUID accountId;
    private String username;

    private record Csrf(String token, Cookie cookie) {}

    @BeforeEach
    void createOnlyDisposableAccount() {
        accountId = UUID.randomUUID();
        username = "local_http_ci_" + accountId.toString().substring(0, 16);
        jdbc.sql("""
                insert into mediaos_local_director
                    (id, username, password_hash, totp_secret_encrypted, active)
                values (:id, :username, :password, :secret, true)
                """)
                .param("id", accountId)
                .param("username", username)
                .param("password", encoder.encode(PASSWORD))
                .param("secret", crypto.encrypt(TOTP_SECRET))
                .update();
    }

    @AfterEach
    void removeDisposableAccount() {
        if (accountId != null) {
            jdbc.sql("delete from mediaos_local_director where id=:id")
                    .param("id", accountId).update();
        }
    }

    private Csrf csrf() throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        String token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(cookie, "CSRF endpoint must set a browser cookie.");
        assertTrue(cookie.getSecure(), "CSRF cookie must use HTTPS.");
        assertFalse(cookie.isHttpOnly(), "The XSRF cookie must be readable to send the header.");
        return new Csrf(token, cookie);
    }

    private MvcResult login(Csrf csrf, String password, String code) throws Exception {
        String json = mapper.writeValueAsString(
                new LocalDirectorAuthController.Login(username, password, code));
        return mvc.perform(post("/api/v1/auth/login")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andReturn();
    }

    private String currentCode() throws Exception {
        long step = Instant.now().getEpochSecond() / 30;
        byte[] secret = LocalTotp.fromBase32(TOTP_SECRET);
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(secret, "HmacSHA1"));
        byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
        int offset = hash[hash.length - 1] & 15;
        int value = ((hash[offset] & 127) << 24)
                | ((hash[offset + 1] & 255) << 16)
                | ((hash[offset + 2] & 255) << 8)
                | (hash[offset + 3] & 255);
        Arrays.fill(secret, (byte) 0);
        return "%06d".formatted(value % 1_000_000);
    }

    @Test
    void anExpiredDatabaseSessionCannotKeepDirectorRights() throws Exception {
        Csrf csrf = csrf();
        MvcResult response = login(csrf, PASSWORD, currentCode());
        assertEquals(200, response.getResponse().getStatus());
        Cookie cookie = response.getResponse().getCookie("MEDIAOS_SESSION");
        assertNotNull(cookie);
        int configuredTimeout = jdbc.sql("""
                select MAX_INACTIVE_INTERVAL
                from SPRING_SESSION
                where PRINCIPAL_NAME=:principal
                """)
                .param("principal", accountId.toString())
                .query(Integer.class).single();
        assertEquals(1800, configuredTimeout, "Director sessions must expire after 30 minutes of inactivity.");

        int updated = jdbc.sql("""
                update SPRING_SESSION
                set LAST_ACCESS_TIME=0, EXPIRY_TIME=0
                where PRINCIPAL_NAME=:principal
                """)
                .param("principal", accountId.toString()).update();
        assertEquals(1, updated, "The login must create one JDBC session for this Director.");

        mvc.perform(get("/api/v1/security/session").cookie(cookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void databaseThrottleBlocksRepeatedAttemptsAgainstUnknownUsername() throws Exception {
        Csrf csrf = csrf();
        String otherUsername = "unknown_" + UUID.randomUUID();
        String json = mapper.writeValueAsString(
                new LocalDirectorAuthController.Login(otherUsername, "invalid", "000000"));

        for (int i = 0; i < LocalDirectorLoginThrottle.USERNAME_LIMIT; i++) {
            mvc.perform(post("/api/v1/auth/login")
                            .cookie(csrf.cookie())
                            .header("X-XSRF-TOKEN", csrf.token())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/v1/auth/login")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isTooManyRequests());

        mvc.perform(get("/api/v1/security/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRequiresCsrfAndRejectsBadCredentials() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new LocalDirectorAuthController.Login(username, PASSWORD, currentCode()))))
                .andExpect(status().isForbidden());

        Csrf csrf = csrf();
        assertEquals(401, login(csrf, "incorrect", currentCode()).getResponse().getStatus());
        assertEquals(401, login(csrf, PASSWORD, "000000").getResponse().getStatus());
        mvc.perform(get("/api/v1/security/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginGrantsOnlyPermittedDirectorOperationsThenLogoutRevokesIt() throws Exception {
        Csrf token = csrf();
        MvcResult loggedIn = login(token, PASSWORD, currentCode());
        assertEquals(200, loggedIn.getResponse().getStatus());
        assertTrue(loggedIn.getResponse().getContentAsString().contains("DIRECTOR"));

        Cookie sessionCookie = loggedIn.getResponse().getCookie("MEDIAOS_SESSION");
        assertNotNull(sessionCookie, "Login must issue a JDBC-backed cookie session.");
        assertTrue(sessionCookie.isHttpOnly(), "Authentication cookie must not be readable by JS.");
        assertTrue(sessionCookie.getSecure(), "Authentication cookie must require HTTPS.");

        mvc.perform(get("/api/v1/security/session").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canApprove").value(true));

        mvc.perform(post("/api/v1/episodes").cookie(sessionCookie))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/episodes")
                        .cookie(sessionCookie, token.cookie())
                        .header("X-XSRF-TOKEN", token.token()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/worker/runner/heartbeat")
                        .cookie(sessionCookie, token.cookie())
                        .header("X-XSRF-TOKEN", token.token()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/auth/logout")
                        .cookie(sessionCookie, token.cookie())
                        .header("X-XSRF-TOKEN", token.token()))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/security/session").cookie(sessionCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reusedTotpCannotAuthenticateAgainAndDeactivationRevokesExistingSession() throws Exception {
        Csrf token = csrf();
        String code = currentCode();
        MvcResult loggedIn = login(token, PASSWORD, code);
        assertEquals(200, loggedIn.getResponse().getStatus());
        assertEquals(401, login(token, PASSWORD, code).getResponse().getStatus(),
                "A successfully used TOTP time step must not be reused.");

        Cookie cookie = loggedIn.getResponse().getCookie("MEDIAOS_SESSION");
        assertNotNull(cookie);
        jdbc.sql("update mediaos_local_director set active=false where id=:id")
                .param("id", accountId).update();

        mvc.perform(get("/api/v1/security/session").cookie(cookie))
                .andExpect(status().isUnauthorized());
    }
}
