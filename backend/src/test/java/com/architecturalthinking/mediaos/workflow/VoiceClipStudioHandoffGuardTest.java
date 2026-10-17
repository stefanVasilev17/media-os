package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class VoiceClipStudioHandoffGuardTest {
    @Test
    void explicitDirectorConfirmationIsRequired() {
        var declined=new VoiceClipController.StudioDirectorHandoffRequest(3,false);
        var confirmed=new VoiceClipController.StudioDirectorHandoffRequest(3,true);
        assertFalse(declined.directorConfirmed());
        assertTrue(confirmed.directorConfirmed());
    }

    @Test
    void sourceShotRevisionMustBePinned() {
        assertEquals(3,new VoiceClipController.StudioDirectorHandoffRequest(3,true).scriptRevision());
    }
}
