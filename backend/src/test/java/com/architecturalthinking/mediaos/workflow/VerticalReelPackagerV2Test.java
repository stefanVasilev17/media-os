package com.architecturalthinking.mediaos.workflow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;

class VerticalReelPackagerV2Test {
    @TempDir Path temp;
    @Test void templateHasExactTransparentApertureAndNoSourceOverlap() throws Exception{
        Path png=temp.resolve("template.png");
        VerticalReelPackagerV2.template(png,"When Faster Hardware Reveals Hidden Concurrency Bugs");
        var image=ImageIO.read(png.toFile());
        assertEquals(1080,image.getWidth());assertEquals(1920,image.getHeight());
        for(int y=0;y<1920;y++)for(int x=0;x<1080;x++){
            boolean aperture=y>=520&&y<1576;
            if((image.getRGB(x,y)>>>24)!=(aperture?0:255))fail("Unexpected alpha at "+x+","+y);
        }
    }
    @Test void realPackagingKeepsOriginalAndAudioAndAllFrames() throws Exception{
        Path input=temp.resolve("source.mp4"),output=temp.resolve("vertical.mp4");
        var p=new ProcessBuilder("ffmpeg","-v","error","-nostdin","-f","lavfi","-i",
            "testsrc2=size=1920x1080:rate=30","-f","lavfi","-i","sine=frequency=550:sample_rate=48000",
            "-t","2","-c:v","libx264","-preset","ultrafast","-threads:v","2","-pix_fmt","yuv420p",
            "-c:a","aac","-movflags","+faststart","-y",input.toString())
            .redirectErrorStream(true).redirectOutput(temp.resolve("fixture.log").toFile()).start();
        assertTrue(p.waitFor(60,TimeUnit.SECONDS));assertEquals(0,p.exitValue());
        String sha=MediaObjectStore.sha256(input);
        VerticalReelPackagerV2.packageClip(input,output,60,"When Failover Spreads the Failure",30);
        assertTrue(Files.size(output)>1024);assertEquals(sha,MediaObjectStore.sha256(input));
    }
    @Test void noFocusKeepsFullFrameAndOnlyExactBoundariesAllowed() throws Exception{
        String wide=VerticalReelPackagerV2.apertureFilter(60,null);
        assertFalse(wide.contains("crop="));assertTrue(wide.contains("scale=1056:594"));
        assertTrue(VerticalReelPackagerV2.apertureFilter(60,0).contains("crop=864:1056:528:24"));
        assertThrows(IllegalArgumentException.class,()->VerticalReelPackagerV2.apertureFilter(60,60));
        assertThrows(IllegalArgumentException.class,()->VerticalReelPackagerV2.apertureFilter(60,-1));
    }
}
