package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class Ep002DirectorMasterContractTest {
    @Test
    void exactDirectorApprovedShotOrderPreservesOriginalHistoricalV3() {
        List<String> ids=Ep002DirectorMasterController.SOURCE_IDS;
        assertEquals(11,ids.size());
        assertEquals(11,new HashSet<>(ids).size());
        assertEquals("8f46fafd-9613-4375-bce2-ea98854e8b20",ids.get(0));
        assertFalse(ids.contains("447f2846-3d1d-4d6c-924c-ea3918520625"));
        assertEquals("73ec0e6f-d348-4518-a32b-573bf89a8ab5",ids.get(10));
        for(int i=0;i<ids.size();i++) {
            String id=ids.get(i);
            assertDoesNotThrow(()->UUID.fromString(id));
            assertEquals(i==0?"EP002-SHOT01-DRAFT":
                    String.format("EP002-SHOT%02d-CANDIDATE",i+1),
                    Ep002DirectorMasterController.expectedComposition(i));
        }
    }

    @Test
    void noInventedFrameCountForUnavailableReferenceMetadata() {
        assertEquals(11,Ep002DirectorMasterController.EXPECTED_FRAMES.size());
        assertEquals(1172,Ep002DirectorMasterController.EXPECTED_FRAMES.get(0).intValue());
        for(int index=1;index<=5;index++)
            assertNull(Ep002DirectorMasterController.EXPECTED_FRAMES.get(index));
        assertEquals(2674,Ep002DirectorMasterController.EXPECTED_FRAMES.get(6).intValue());
        assertEquals(2314,Ep002DirectorMasterController.EXPECTED_FRAMES.get(7).intValue());
        assertEquals(3063,Ep002DirectorMasterController.EXPECTED_FRAMES.get(8).intValue());
        assertEquals(2360,Ep002DirectorMasterController.EXPECTED_FRAMES.get(9).intValue());
        assertEquals(1572,Ep002DirectorMasterController.EXPECTED_FRAMES.get(10).intValue());
    }

    @Test
    void oneTimeExplicitDirectorChatAuthorizationIsPinnedAndNotAWebRoute() throws Exception {
        assertEquals("USER_EXPLICIT_CHAT_2026_11_12_EP002_11_SHOT_MASTER_ONE_PAID_CPU",
                Ep002DirectorMasterController.CHAT_AUTHORIZATION);
        Method once=Ep002DirectorMasterController.class.getMethod(
                "queueVerifiedChatMasterOnce",String.class);
        assertNull(once.getAnnotation(PostMapping.class));
        assertNull(once.getAnnotation(GetMapping.class));
    }

    @Test
    void masterRequiresExplicitSeparateDirectorPaidConfirmation() throws Exception {
        RequestMapping scope=Ep002DirectorMasterController.class.getAnnotation(RequestMapping.class);
        assertArrayEquals(new String[]{"/api/v1/creative/episodes/EP002/master"},scope.value());
        Method create=Ep002DirectorMasterController.class.getMethod(
                "render",Ep002DirectorMasterController.RenderRequest.class,
                jakarta.servlet.http.HttpServletRequest.class);
        assertNotNull(create.getAnnotation(PostMapping.class));
        assertNotNull(Ep002DirectorMasterController.class.getMethod("preflight")
                .getAnnotation(GetMapping.class));
        Ep002DirectorMasterController.RenderRequest noConsent=
                new Ep002DirectorMasterController.RenderRequest(UUID.randomUUID(),
                        Ep002DirectorMasterController.sha256("test"),false);
        assertFalse(noConsent.confirmPaidCpuRender());
        assertEquals(64,Ep002DirectorMasterController.sha256("locked eleven").length());
    }
}
