package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002CreativeVoiceServiceTest {
    private Ep002CreativeVoiceService service() {
        return new Ep002CreativeVoiceService(
                mock(JdbcClient.class),
                mock(ElevenLabsTextToSpeechService.class),
                mock(Ep002VoiceIdentityGuard.class),
                mock(PlatformTransactionManager.class),
                true);
    }

    @Test
    void rejectsUnknownShotBeforeDatabaseOrPaidOperations() {
        var creative=service();
        for(String key : new String[]{"SHOT12","SHOT 01","SHOT00","EP001","SHOT01/../EP001",""}) {
            assertThrows(ResponseStatusException.class,()->creative.state(key));
            assertThrows(ResponseStatusException.class,
                    ()->creative.save(key,0,"some narration","calm"));
            assertThrows(ResponseStatusException.class,
                    ()->creative.generate(key,1,java.util.UUID.randomUUID()));
            assertThrows(ResponseStatusException.class,
                    ()->creative.approve(key,1,java.util.UUID.randomUUID()));
            assertThrows(ResponseStatusException.class,
                    ()->creative.restoreOlderTake(key,1,java.util.UUID.randomUUID()));
        }
    }

    @Test
    void slowVoiceMustHaveExplicitPaidConfirmationAndNeverAffectOtherShots() {
        var slow=service();
        assertThrows(ResponseStatusException.class,()->
                slow.generateSlow("SHOT02",1,java.util.UUID.randomUUID(),false));
        assertThrows(ResponseStatusException.class,()->
                slow.generateSlow("SHOT03",1,java.util.UUID.randomUUID(),true));
    }

    @Test
    void restorationIsShot01OnlyAndNeverSendsVoiceToProvider() {
        var db=mock(JdbcClient.class);
        var tts=mock(ElevenLabsTextToSpeechService.class);
        var creative=new Ep002CreativeVoiceService(db,tts,
                mock(Ep002VoiceIdentityGuard.class),
                mock(PlatformTransactionManager.class),true);
        assertThrows(ResponseStatusException.class,
                ()->creative.restoreOlderTake("SHOT02",2,java.util.UUID.randomUUID()));
        assertThrows(ResponseStatusException.class,
                ()->creative.restoreOlderTake("SHOT03",2,java.util.UUID.randomUUID()));
        verifyNoInteractions(db,tts);
    }

    @Test
    void validatesJsonBoundariesBeforeCallingPaidService() {
        var db=mock(JdbcClient.class);
        var tts=mock(ElevenLabsTextToSpeechService.class);
        var identity=mock(Ep002VoiceIdentityGuard.class);
        var creative=new Ep002CreativeVoiceService(db,tts,identity,
                mock(PlatformTransactionManager.class),true);
        assertThrows(ResponseStatusException.class,
                ()->creative.generate("SHOT01",1,null));
        verifyNoInteractions(tts);
    }
}
