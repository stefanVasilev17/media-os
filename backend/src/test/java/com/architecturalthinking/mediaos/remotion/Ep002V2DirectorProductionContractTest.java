package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Ep002V2DirectorProductionContractTest {
    @Test
    void directorV2KeepsTenOriginalPinnedSourcesAndSeparateShot10(){
        assertEquals(11,Ep002DirectorMasterController.SOURCE_IDS.size());
        assertThrows(IllegalArgumentException.class,
                ()->Ep002V2DirectorProduction.sourceIds(
                  "2034d8c6-99b2-46a5-9469-bf3df325d6c0"));
        String shot10="22222222-2222-4222-8222-222222222222";
        List<String> ids=Ep002V2DirectorProduction.sourceIds(shot10);
        assertEquals(11,ids.size());
        assertEquals(11,new HashSet<>(ids).size());
        assertEquals(shot10,ids.get(9));
        for(int i=0;i<11;i++){
            if(i!=9)assertEquals(Ep002DirectorMasterController.SOURCE_IDS.get(i),ids.get(i));
        }
        assertEquals("DIRECTOR_V2_60_FRAME_BREATHS",
                Ep002V2DirectorProduction.MASTER_MODE);
        assertEquals("c61949419d0aa18b02434f8a050791bf1929016d",
                Ep002V2DirectorProduction.SHOT10_VISUAL_BLOB);
    }

    @Test
    void v2StatusIsDirectorReadOnlyAndNeverAcceptsArbitraryPublicJobRequests()
            throws Exception {
        RequestMapping request=Ep002V2DirectorProduction.class.getAnnotation(
                RequestMapping.class);
        assertArrayEquals(new String[]{"/api/v1/creative/episodes/EP002/master/v2"},
                request.value());
        Method preflight=Ep002V2DirectorProduction.class.getMethod("preflight");
        assertNotNull(preflight.getAnnotation(GetMapping.class));
        for(Method method:Ep002V2DirectorProduction.class.getMethods())
            assertNull(method.getAnnotation(
                org.springframework.web.bind.annotation.PostMapping.class));
    }
}
