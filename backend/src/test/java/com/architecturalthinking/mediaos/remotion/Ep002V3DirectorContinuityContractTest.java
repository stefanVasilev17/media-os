package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Ep002V3DirectorContinuityContractTest {
    @Test
    void v3KeepsElevenOriginalRenderPinsAndOnlySubstitutesCleanLockedShot10(){
        List<String> originals=Ep002DirectorMasterController.SOURCE_IDS;
        List<String> v3=Ep002V2DirectorProduction.sourceIds(
            Ep002V3DirectorContinuityProduction.SHOT10_ID);
        assertEquals(11,v3.size());
        assertEquals(11,new HashSet<>(v3).size());
        for(int i=0;i<11;i++){
            if(i==9)assertNotEquals(originals.get(i),v3.get(i));
            else assertEquals(originals.get(i),v3.get(i));
        }
        assertEquals("DIRECTOR_V3_EXACT_FRAME_MATCHED_SEAMS",
            Ep002V3DirectorContinuityProduction.MODE);
        assertEquals("TEN_ANCHORED_MOVING_CAMERA_BRIDGES",
            Ep002V3DirectorContinuityProduction.TRANSITION);
    }

    @Test
    void directorReviewEndpointCannotBeUsedToRequestArbitraryRenders()
        throws Exception{
        Class<Ep002V3DirectorContinuityProduction> target=
            Ep002V3DirectorContinuityProduction.class;
        RequestMapping root=target.getAnnotation(RequestMapping.class);
        assertArrayEquals(new String[]{"/api/v1/creative/episodes/EP002/master/v3"},
            root.value());
        assertNotNull(target.getMethod("preflight").getAnnotation(GetMapping.class));
        for(Method method:target.getMethods())
            assertNull(method.getAnnotation(PostMapping.class));
    }
}
