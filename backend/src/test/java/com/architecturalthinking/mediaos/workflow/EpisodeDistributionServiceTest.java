package com.architecturalthinking.mediaos.workflow;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
class EpisodeDistributionServiceTest {
    @Test void policyConstrainedDestinationsAndUrlValidation(){
        for(String key:java.util.List.of("HN","INFOQ","DZONE","REDDIT","NEWSLETTER")){
            assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.validateKind(EpisodeDistributionService.platform(key),"POST"));
            assertDoesNotThrow(()->EpisodeDistributionService.validateKind(EpisodeDistributionService.platform(key),"RESEARCH"));
        }
        assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.validateKind(EpisodeDistributionService.platform("DEV"),"DISCUSSION"));
        assertEquals("https://youtu.be/123456789ab",EpisodeDistributionService.https("https://youtu.be/123456789ab",true));
        assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.https("https://youtube.com.evil.test/watch?v=123456789ab",true));
        assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.https("https://user@example.com",false));
        assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.https("javascript:alert(1)",false));
        assertThrows(ResponseStatusException.class,()->EpisodeDistributionService.bounded("x".repeat(100),20,20,true));
    }
}
