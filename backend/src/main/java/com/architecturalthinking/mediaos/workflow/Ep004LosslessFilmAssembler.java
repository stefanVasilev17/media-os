package com.architecturalthinking.mediaos.workflow;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Streams already-encoded, trusted SHOT MP4s into one lossless film.
 * It fails closed if the real video/audio tracks do not match or frames are lost.
 */
final class Ep004LosslessFilmAssembler {
    private static final int FPS=30;
    private static final int MAX_SHOTS=40;

    private Ep004LosslessFilmAssembler() {}

    record Track(String codec,String descriptor) {}

    static void assemble(Path directory,int shotCount,int expectedFrames)
            throws IOException,InterruptedException {
        if(directory==null||shotCount<2||shotCount>MAX_SHOTS||expectedFrames<shotCount)
            throw new IllegalArgumentException("Invalid bounded full film assembly request.");
        List<String> files=new ArrayList<>();
        Track referenceVideo=null,referenceAudio=null;
        int counted=0;
        for(int i=1;i<=shotCount;i++) {
            String file=String.format(java.util.Locale.ROOT,"shot%02d.mp4",i);
            Path input=directory.resolve(file);
            if(!Files.isRegularFile(input)||Files.size(input)<1024)
                throw new IOException("A Director-locked source MP4 is missing.");
            Map<String,String> v=probe(input,"v:0",true);
            Map<String,String> a=probe(input,"a:0",false);
            if(!"h264".equals(v.get("codec_name"))||
                    !"1920".equals(v.get("width"))||
                    !"1080".equals(v.get("height"))||
                    !"30/1".equals(v.get("r_frame_rate"))||
                    !"aac".equals(a.get("codec_name")))
                throw new IOException("All LOCKED SHOTs must contain 1080p/30 H264 video and AAC audio.");
            int frames;
            try{frames=Integer.parseInt(v.getOrDefault("nb_read_frames","-1"));}
            catch(NumberFormatException ex){frames=-1;}
            if(frames<1)throw new IOException("SHOT MP4 has no verified video frames.");
            counted=Math.addExact(counted,frames);
            Track video=new Track(v.get("codec_name"),v.get("width")+"x"+v.get("height")
                    +"@"+v.get("r_frame_rate"));
            Track audio=new Track(a.get("codec_name"),a.get("sample_rate")
                    +"Hz/"+a.get("channels")+"ch");
            if(referenceVideo!=null&&(!referenceVideo.equals(video)||
                    !referenceAudio.equals(audio)))
                throw new IOException("Locked SHOT codec or audio format mismatch. Lossless join refused.");
            referenceVideo=video;referenceAudio=audio;files.add(file);
        }
        if(counted!=expectedFrames)
            throw new IOException("Expected film frame count does not match source MP4 frames.");
        StringBuilder concat=new StringBuilder();
        for(String name:files)concat.append("file '").append(name).append("'\n");
        Files.writeString(directory.resolve("sequence.txt"),concat.toString(),
                StandardCharsets.UTF_8);
        Path output=directory.resolve("full-video.mp4");
        Path log=directory.resolve("ffmpeg.log");
        List<String> argv=List.of("ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                "-f","concat","-safe","0","-i",directory.resolve("sequence.txt").toString(),
                "-c","copy","-movflags","+faststart","-y",output.toString());
        Process process=new ProcessBuilder(argv).directory(directory.toFile())
                .redirectErrorStream(true).redirectOutput(log.toFile()).start();
        if(!process.waitFor(120,TimeUnit.SECONDS)){
            process.destroyForcibly();
            throw new IOException("Full film lossless join exceeded its 120-second CPU limit.");
        }
        if(process.exitValue()!=0){
            String reason=Files.readString(log);
            throw new IOException("Lossless joining refused: "+
                    reason.substring(0,Math.min(450,reason.length())));
        }
        if(!Files.isRegularFile(output)||Files.size(output)<1024)
            throw new IOException("Full film has no valid MP4 output.");
        Map<String,String> filmVideo=probe(output,"v:0",true);
        Map<String,String> filmAudio=probe(output,"a:0",false);
        if(!"h264".equals(filmVideo.get("codec_name"))
                ||!"aac".equals(filmAudio.get("codec_name"))
                ||!"1920".equals(filmVideo.get("width"))
                ||!"1080".equals(filmVideo.get("height"))
                ||!"30/1".equals(filmVideo.get("r_frame_rate"))
                ||!referenceAudio.descriptor().equals(
                    filmAudio.get("sample_rate")+"Hz/"+filmAudio.get("channels")+"ch")
                ||!Integer.toString(expectedFrames).equals(filmVideo.get("nb_read_frames")))
            throw new IOException("Full film readback failed exact frame, resolution or audio verification.");
    }

    private static Map<String,String> probe(Path video,String stream,boolean count)
            throws IOException,InterruptedException {
        List<String> command=new ArrayList<>(List.of(
                "ffprobe","-v","error","-select_streams",stream));
        if(count)command.add("-count_frames");
        command.addAll(List.of("-show_entries",
                "stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels",
                "-of","default=noprint_wrappers=1",video.toString()));
        Process process=new ProcessBuilder(command).redirectErrorStream(true).start();
        if(!process.waitFor(45,TimeUnit.SECONDS)){
            process.destroyForcibly();
            throw new IOException("MP4 stream inspection timed out.");
        }
        String output=new String(process.getInputStream().readAllBytes(),StandardCharsets.UTF_8);
        if(process.exitValue()!=0)
            throw new IOException("MP4 media inspection failed.");
        Map<String,String> values=new HashMap<>();
        for(String line:output.split("\\R")){
            int eq=line.indexOf('=');
            if(eq>0)values.put(line.substring(0,eq).trim(),line.substring(eq+1).trim());
        }
        return values;
    }
}
