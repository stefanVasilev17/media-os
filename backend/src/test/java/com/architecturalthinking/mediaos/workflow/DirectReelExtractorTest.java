package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

class DirectReelExtractorTest {
    @TempDir Path temp;

    @Test void exactFrameIntervalAndLimits(){
        assertDoesNotThrow(()->DirectReelExtractor.validateRange(14096,16702,34651));
        assertThrows(IllegalArgumentException.class,()->DirectReelExtractor.validateRange(-1,10,100));
        assertThrows(IllegalArgumentException.class,()->DirectReelExtractor.validateRange(10,10,100));
        assertThrows(IllegalArgumentException.class,()->DirectReelExtractor.validateRange(0,5401,6000));
        assertThrows(IllegalArgumentException.class,()->DirectReelExtractor.validateRange(10,101,100));
        assertEquals("1.033333333",DirectReelExtractor.seconds(31));
    }
    @Test void exactDirectorAuditAndProtectedByteRanges(){
        var req=new MockHttpServletRequest();
        assertThrows(ResponseStatusException.class,()->EpisodeReelController.audit(req));
        UUID audit=UUID.randomUUID();
        req.setAttribute("MEDIA_OS_CREATION_PREFLIGHT",Map.of("auditId",audit));
        assertEquals(audit,EpisodeReelController.audit(req));
        assertEquals(new EpisodeReelController.Range(0,999),EpisodeReelController.range(null,1000));
        assertEquals(new EpisodeReelController.Range(10,19),EpisodeReelController.range("bytes=10-19",1000));
        assertEquals(new EpisodeReelController.Range(900,999),EpisodeReelController.range("bytes=-100",1000));
        assertThrows(ResponseStatusException.class,()->EpisodeReelController.range("bytes=0-1,4-5",1000));
        assertThrows(ResponseStatusException.class,()->EpisodeReelController.range("bytes=1000-",1000));
    }
    @Test void extractsNonKeyframeIntervalFromRealMp4WithoutChangingMaster() throws Exception{
        Path source=temp.resolve("source.mp4"),output=temp.resolve("reel.mp4");
        var p=new ProcessBuilder("ffmpeg","-v","error","-nostdin","-f","lavfi","-i",
            "testsrc2=size=1920x1080:rate=30","-f","lavfi","-i","sine=frequency=550:sample_rate=48000",
            "-t","3","-c:v","libx264","-preset","ultrafast","-threads:v","2","-g","60","-pix_fmt","yuv420p",
            "-c:a","aac","-movflags","+faststart","-y",source.toString())
            .redirectErrorStream(true).redirectOutput(temp.resolve("fixture.log").toFile()).start();
        assertTrue(p.waitFor(60,TimeUnit.SECONDS));
        assertEquals(0,p.exitValue());
        String sha=MediaObjectStore.sha256(source);
        String method=DirectReelExtractor.extract(source,output,17,62,90);
        assertEquals("TECHNICAL_ENCODE",method);
        assertTrue(Files.size(output)>1024);
        assertEquals(sha,MediaObjectStore.sha256(source));
    }
}
