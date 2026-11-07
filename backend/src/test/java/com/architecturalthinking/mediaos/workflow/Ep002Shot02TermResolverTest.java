package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot02TermResolverTest {
    private final ObjectMapper json=new ObjectMapper();
    private static final BigDecimal SECONDS=new BigDecimal("30.000");
    private static final String NARRATION =
            "At nine o'clock, tickets go on sale. The software has not changed. "
            + "Each tap sends a Login request through the API Gateway. "
            + "A Load Balancer spreads them across several Auth servers. "
            + "Engineers call this the arrival rate. "
            + "The Auth servers share one User Database.";

    private String alignment(String speech) throws Exception {
        ObjectNode root=json.createObjectNode();
        ObjectNode block=root.putObject("normalized_alignment");
        ArrayNode letters=block.putArray("characters");
        ArrayNode starts=block.putArray("character_start_times_seconds");
        ArrayNode ends=block.putArray("character_end_times_seconds");
        for(int i=0;i<speech.length();i++) {
            letters.add(String.valueOf(speech.charAt(i)));
            starts.add(i*0.06d);
            ends.add(i*0.06d+0.04d);
        }
        return json.writeValueAsString(root);
    }

    private List<Ep002VoiceBeatResolver.BeatCue> directorBeats(String source)
            throws Exception {
        return Ep002VoiceBeatResolver.resolve(json,source,SECONDS,
                List.of("At nine","The software","API Gateway",
                        "arrival rate","User Database"),5);
    }

    @Test
    void sevenSpokenTermsMatchCurrentSelectedTakeAndDirectorBeatStarts()
            throws Exception {
        String source=alignment(NARRATION);
        var beats=directorBeats(source);
        var terms=Ep002Shot02TermResolver.resolve(json,source,SECONDS,beats);
        assertEquals(7,terms.size());
        assertEquals(List.of("LOGIN_REQUEST","API_GATEWAY","LOAD_BALANCER",
                        "AUTH_SERVERS","ARRIVAL_RATE","AUTH_SERVERS_REPRISE",
                        "USER_DATABASE"),
                terms.stream().map(Ep002Shot02TermResolver.TermCue::id).toList());
        assertEquals(beats.get(2).startFrame(),terms.get(1).startFrame());
        assertEquals(beats.get(3).startFrame(),terms.get(4).startFrame());
        assertEquals(beats.get(4).startFrame(),terms.get(6).startFrame());
        assertTrue(terms.get(5).startFrame()>terms.get(3).endFrame());
        for(int i=1;i<terms.size();i++) {
            assertTrue(terms.get(i).startFrame()>=terms.get(i-1).endFrame());
        }
    }

    @Test
    void fifthBeatMayStartAtSecondAuthMentionBeforeTheDatabaseName()
            throws Exception {
        String source=alignment(NARRATION);
        var beats=Ep002VoiceBeatResolver.resolve(json,source,SECONDS,
                List.of("At nine","The software","API Gateway",
                        "arrival rate","The Auth servers"),5);
        var terms=Ep002Shot02TermResolver.resolve(json,source,SECONDS,beats);
        assertEquals(7,terms.size());
        assertTrue(terms.get(5).startFrame()>=beats.get(4).startFrame());
        assertTrue(terms.get(5).startFrame()<beats.get(4).endFrame());
        assertTrue(terms.get(6).startFrame()>beats.get(4).startFrame());
    }

    @Test
    void missingSecondAuthMentionFailsWithoutInventedFrames() throws Exception {
        String source=alignment(NARRATION.replace(
                "The Auth servers share one", "Those services share one"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02TermResolver.resolve(json,source,SECONDS,
                        directorBeats(source)));
    }

    @Test
    void directorBeatCanStartBeforeItsExactSpokenTechnicalTerm()
            throws Exception {
        String source=alignment(NARRATION);
        var beats=Ep002VoiceBeatResolver.resolve(json,source,SECONDS,
                List.of("At nine","The software","Each tap",
                        "Engineers call","The Auth servers"),5);
        var terms=Ep002Shot02TermResolver.resolve(json,source,SECONDS,beats);
        assertEquals(7,terms.size());
        assertTrue(terms.get(1).startFrame()>beats.get(2).startFrame());
        assertTrue(terms.get(4).startFrame()>beats.get(3).startFrame());
        assertTrue(terms.get(6).startFrame()>beats.get(4).startFrame());
    }

    @Test
    void directorBeatStartingAfterSpokenGatewayFailsClosed() throws Exception {
        String source=alignment(NARRATION);
        var wrong=Ep002VoiceBeatResolver.resolve(json,source,SECONDS,
                List.of("At nine","The software","several Auth servers",
                        "arrival rate","User Database"),5);
        var failure=assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02TermResolver.resolve(json,source,SECONDS,wrong));
        assertEquals("SHOT02_TERMS_DISAGREE_WITH_DIRECTOR_BEATS",
                failure.getMessage());
    }

    @Test
    void absentOrCorruptAlignmentFailsClosed() throws Exception {
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02TermResolver.resolve(json,"{}",SECONDS,List.of()));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02TermResolver.resolve(json,"{}",SECONDS,
                        directorBeats(alignment(NARRATION))));
    }
}
