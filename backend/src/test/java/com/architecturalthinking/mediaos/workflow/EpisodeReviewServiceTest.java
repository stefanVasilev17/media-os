package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class EpisodeReviewServiceTest {
    private static EpisodeReviewService.Change metric(String key,String value,String currency,LocalDate start,LocalDate end){
        return new EpisodeReviewService.Change(UUID.randomUUID(),0,"SAVE","ANALYTICS","AUDIENCE","EPISODE","OBSERVATION",
            "Actual metric","Measured from the analytics dashboard","","Director evidence",key,value==null?null:new BigDecimal(value),currency,start,end,true);
    }
    @Test void rejectFutureOrPreLaunchAndMissingNumericEvidence(){
        LocalDate launch=LocalDate.now().minusDays(7);
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("VIEWS","0",null,launch.minusDays(1),launch),launch));
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("VIEWS","10",null,launch,LocalDate.now().plusDays(1)),launch));
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("VIEWS",null,null,launch,launch),launch));
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("VIEWS","1.5",null,launch,launch),launch));
        assertDoesNotThrow(()->EpisodeReviewService.validateAnalytics(metric("VIEWS","0",null,launch,launch),launch));
    }
    @Test void ctrRpmAndBreakdownValidation(){
        LocalDate day=LocalDate.now();
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("CTR_PERCENT","101",null,day,day),day));
        assertThrows(RuntimeException.class,()->EpisodeReviewService.validateAnalytics(metric("RPM","15.2",null,day,day),day));
        assertDoesNotThrow(()->EpisodeReviewService.validateAnalytics(metric("RPM","15.2","USD",day,day),day));
        assertDoesNotThrow(()->EpisodeReviewService.validateAnalytics(metric("TRAFFIC_SOURCES",null,null,day,day),day));
    }
    @Test void contextDigestIsDeterministicAndChangesWithEvidenceState(){
        assertEquals(EpisodeReviewService.digest("master|PASS"),EpisodeReviewService.digest("master|PASS"));
        assertNotEquals(EpisodeReviewService.digest("master|PASS"),EpisodeReviewService.digest("master|PENDING"));
    }
}
