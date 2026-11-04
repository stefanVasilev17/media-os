package com.architecturalthinking.mediaos.workflow;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Component
public class EpisodePackageAudioDurationProbe {
    public BigDecimal measure(byte[] audio,String contentType) {
        if(audio == null || audio.length == 0) return null;
        Path temp = null;
        try {
            String suffix="audio/wav".equals(contentType)?".wav":".mp3";
            temp=Files.createTempFile("mediaos-episode-voice-",suffix);
            Files.write(temp,audio);
            Process process=new ProcessBuilder(
                    "ffprobe","-v","error","-show_entries","format=duration",
                    "-of","default=noprint_wrappers=1:nokey=1",temp.toString()
            ).redirectErrorStream(true).start();
            if(!process.waitFor(8,TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return null;
            }
            if(process.exitValue()!=0) return null;
            return parse(new String(process.getInputStream().readAllBytes(),StandardCharsets.UTF_8));
        } catch(IOException ignored) {
            return null;
        } catch(InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return null;
        } finally {
            if(temp!=null)try {Files.deleteIfExists(temp);}catch(IOException ignored) {}
        }
    }

    static BigDecimal parse(String duration) {
        if(duration==null)return null;
        try {
            double value=Double.parseDouble(duration.trim());
            if(!Double.isFinite(value)||value<=0||value>=86400)return null;
            return BigDecimal.valueOf(value).setScale(3,RoundingMode.HALF_UP);
        } catch(NumberFormatException ignored) {
            return null;
        }
    }
}
