package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end local CPU test of the *actual* production lossless join code.
 * No ElevenLabs calls, no Remotion CPU renders, no S3 writes.
 */
class Ep004LosslessFilmAssemblerTest {
    @TempDir Path folder;

    private static void command(List<String> args) throws Exception {
        Process process=new ProcessBuilder(args).redirectErrorStream(true).start();
        if(!process.waitFor(75,TimeUnit.SECONDS)){
            process.destroyForcibly();
            fail("Fixture FFmpeg process timed out");
        }
        String output=new String(process.getInputStream().readAllBytes());
        assertEquals(0,process.exitValue(),output);
    }

    private void shot(int ordinal,int frames,int sampleRate,boolean audio) throws Exception {
        String name=String.format(java.util.Locale.ROOT,"shot%02d.mp4",ordinal);
        String color=switch(ordinal){case 1->"112233";case 2->"334455";default->"556677";};
        List<String> argv=new java.util.ArrayList<>(List.of(
            "ffmpeg","-hide_banner","-nostdin","-loglevel","error",
            "-f","lavfi","-i","color=c=0x"+color+":s=1920x1080:r=30",
            "-f","lavfi","-i","sine=frequency="+(350+ordinal*110)
                +":sample_rate="+sampleRate));
        argv.addAll(List.of("-frames:v",Integer.toString(frames),
            "-c:v","libx264","-preset","veryfast","-crf",ordinal==2?"16":"28",
            "-threads","2","-video_track_timescale",ordinal==2?"15360":"90000",
            "-pix_fmt","yuv420p"));
        if(audio)argv.addAll(List.of("-c:a","aac","-b:a","96k",
            "-ar",Integer.toString(sampleRate),"-ac","2"));
        else argv.add("-an");
        argv.addAll(List.of("-shortest","-movflags","+faststart",
            "-y",folder.resolve(name).toString()));
        command(argv);
        assertTrue(Files.size(folder.resolve(name))>1024);
    }

    private static String sha(Path path) throws Exception {
        MessageDigest md=MessageDigest.getInstance("SHA-256");
        md.update(Files.readAllBytes(path));
        return HexFormat.of().formatHex(md.digest());
    }

    @Test void threeMixedH264ShotsBecomeOneBrowserCompatible135FrameFilm() throws Exception {
        shot(1,30,48000,true);
        shot(2,45,48000,true);
        shot(3,60,48000,true);
        String first=sha(folder.resolve("shot01.mp4"));
        String second=sha(folder.resolve("shot02.mp4"));
        String third=sha(folder.resolve("shot03.mp4"));
        assertEquals(first,MediaObjectStore.sha256(folder.resolve("shot01.mp4")));
        assertEquals(second,MediaObjectStore.sha256(folder.resolve("shot02.mp4")));
        assertEquals(third,MediaObjectStore.sha256(folder.resolve("shot03.mp4")));

        Ep004LosslessFilmAssembler.assemble(folder,3,135);

        Path film=folder.resolve("full-video.mp4");
        assertTrue(Files.size(film)>1024);
        assertEquals(first,sha(folder.resolve("shot01.mp4")));
        assertEquals(second,sha(folder.resolve("shot02.mp4")));
        assertEquals(third,sha(folder.resolve("shot03.mp4")));
        assertEquals(3,Files.readAllLines(folder.resolve("sequence.txt")).size());
        assertEquals(135,Ep004LosslessFilmAssembler.decodedVideoHashes(film,folder.resolve("test-film.md5"),true).size());
        assertTrue(Files.isRegularFile(folder.resolve("verified-lossless.mp4")));
        assertEquals(135,Ep004LosslessFilmAssembler.decodedVideoHashes(
            folder.resolve("verified-lossless.mp4"),folder.resolve("lossless-test.md5"),true).size());
        Process probe=new ProcessBuilder("ffprobe","-v","error","-select_streams","v:0",
            "-show_entries","stream=codec_tag_string,pix_fmt","-of","default=noprint_wrappers=1",
            film.toString()).redirectErrorStream(true).start();
        assertTrue(probe.waitFor(30,TimeUnit.SECONDS));
        String info=new String(probe.getInputStream().readAllBytes());
        assertEquals(0,probe.exitValue(),info);
        assertTrue(info.contains("codec_tag_string=avc1"),info);
        assertTrue(info.contains("pix_fmt=yuv420p"),info);
        assertEquals(List.of("file 'normalized01.mp4'","file 'normalized02.mp4'",
                "file 'normalized03.mp4'"),
            Files.readAllLines(folder.resolve("sequence.txt")));
    }

    @Test void wrongExpectedFrameCountCannotPublishAFalseCompletedFilm() throws Exception {
        shot(1,30,48000,true);
        shot(2,45,48000,true);
        IOException rejected=assertThrows(IOException.class,
                ()->Ep004LosslessFilmAssembler.assemble(folder,2,76));
        assertTrue(rejected.getMessage().contains("frame count"));
        assertFalse(Files.exists(folder.resolve("full-video.mp4")));
    }

    @Test void mismatchedAudioSampleRateCannotSilentlyCorruptStreamCopy() throws Exception {
        shot(1,30,48000,true);
        shot(2,30,44100,true);
        IOException rejected=assertThrows(IOException.class,
                ()->Ep004LosslessFilmAssembler.assemble(folder,2,60));
        assertTrue(rejected.getMessage().contains("format mismatch"));
        assertFalse(Files.exists(folder.resolve("full-video.mp4")));
    }

    @Test void sourceWithoutAudioIsRejectedAndNothingIsPublished() throws Exception {
        shot(1,30,48000,true);
        shot(2,30,48000,false);
        IOException rejected=assertThrows(IOException.class,
                ()->Ep004LosslessFilmAssembler.assemble(folder,2,60));
        assertTrue(rejected.getMessage().contains("AAC audio"));
        assertFalse(Files.exists(folder.resolve("full-video.mp4")));
    }
}
