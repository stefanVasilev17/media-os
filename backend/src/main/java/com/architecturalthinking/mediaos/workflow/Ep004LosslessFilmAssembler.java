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
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Streams already-encoded, trusted SHOT MP4s into one lossless film.
 * It fails closed if the real video/audio tracks do not match or frames are lost.
 */
final class Ep004LosslessFilmAssembler {
    private static final int FPS=30;
    private static final int MAX_SHOTS=40;
    private static final Logger LOG=LoggerFactory.getLogger(Ep004LosslessFilmAssembler.class);

    private Ep004LosslessFilmAssembler() {}

    record Track(String codec,String descriptor) {}

    static void assemble(Path directory,int shotCount,int expectedFrames)
            throws IOException,InterruptedException {
        if(directory==null||shotCount<2||shotCount>MAX_SHOTS||expectedFrames<shotCount)
            throw new IllegalArgumentException("Invalid bounded full film assembly request.");
        List<String> files=new ArrayList<>();
        Track referenceVideo=null,referenceAudio=null;
        int counted=0;
        List<String> sourceHashes=new ArrayList<>();
        String firstConfig=null;boolean mixedConfig=false;
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
            referenceVideo=video;referenceAudio=audio;
            String config=v.get("extradata_hash");
            if(config==null||config.isBlank())throw new IOException("Missing H264 codec configuration.");
            if(firstConfig==null)firstConfig=config;
            else if(!firstConfig.equals(config))mixedConfig=true;
            LOG.info("Full Video input {} frames={} videoTimeBase={} profile={} codecTag={} extradataHash={} audioTimeBase={}",
                file,frames,v.get("time_base"),v.get("profile"),v.get("codec_tag_string"),
                v.get("extradata_hash"),a.get("time_base"));
            List<String> hashes=decodedVideoHashes(input,directory.resolve("source-"+i+".md5"),false);
            if(hashes.size()!=frames)throw new IOException("Source decoded frame hash count mismatch.");
            sourceHashes.addAll(hashes);
            String normalized=String.format(Locale.ROOT,"normalized%02d.mp4",i);
            run(List.of("ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                "-i",input.toString(),"-map","0:v:0","-map","0:a:0",
                "-c","copy","-video_track_timescale","90000","-movflags","+faststart",
                "-y",directory.resolve(normalized).toString()),directory.resolve("normalize-"+i+".log"),60);
            files.add(normalized);
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
                "-f","concat","-safe","1","-auto_convert","1",
                "-i",directory.resolve("sequence.txt").toString(),
                "-map","0:v:0","-map","0:a:0","-c","copy",
                "-tag:v",mixedConfig?"avc3":"avc1","-video_track_timescale","90000",
                "-movflags","+faststart","-y",output.toString());
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
                ||!Integer.toString(expectedFrames).equals(filmVideo.get("nb_read_frames"))
                ||!(mixedConfig?"avc3":"avc1").equals(filmVideo.get("codec_tag_string"))
                ||!"1/90000".equals(filmVideo.get("time_base")))
            throw new IOException("Full film readback failed exact frame, resolution or audio verification.");
        List<String> assembledHashes=decodedVideoHashes(output,directory.resolve("assembled.md5"),true);
        if(!sourceHashes.equals(assembledHashes))
            throw new IOException("Full Video decoded pixels do not match the complete locked source sequence.");
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-threads","2","-i",output.toString(),"-map","0:a:0","-vn","-f","null","-"),
            directory.resolve("audio-decode.log"),120);
        LOG.info("FULL_VIDEO_SOURCE_SEQUENCE_QA_PASS frames={} pixelHashesMatch=true audioDecoded=true timeBase=1/90000",
            expectedFrames);
        if(mixedConfig){
            Path intermediate=directory.resolve("verified-lossless.mp4");
            Files.move(output,intermediate);
            browserCompatible(intermediate,output,expectedFrames);
        }
    }

    /** A review derivative, not a new Remotion render or modification of locked SHOTs.
     * A single AVC1 configuration avoids browser-specific AVC3 decoding failures.
     * AAC packets are copied unchanged; the verified lossless input remains untouched.
     */
    static void browserCompatible(Path input,Path output,int expectedFrames)
            throws IOException,InterruptedException {
        Path directory=output.getParent();
        if(expectedFrames<1||expectedFrames>180000||Files.size(input)>MediaObjectStore.MAX_FILM_BYTES)
            throw new IOException("Browser-compatible derivative exceeds bounded assembly limits.");
        String originalAudio=audioPacketHash(input,directory.resolve("input-audio.sha"));
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-threads","2","-i",input.toString(),"-map","0:v:0","-map","0:a:0",
            "-vf","settb=1/90000,setpts=N*3000,format=yuv420p",
            "-r","30","-enc_time_base","1:30","-fps_mode","passthrough",
            "-c:v","libx264","-preset","ultrafast","-crf","16","-threads:v","2",
            "-profile:v","high","-level:v","4.1","-tag:v","avc1",
            "-g","60","-c:a","copy","-video_track_timescale","90000",
            "-movflags","+faststart","-y",output.toString()),directory.resolve("browser-encode.log"),600);
        Map<String,String> video=probe(output,"v:0",true);
        Map<String,String> audio=probe(output,"a:0",false);
        LOG.info("FULL_VIDEO_BROWSER_PROBE expectedFrames={} video={} audio={}",expectedFrames,video,audio);
        if(!"h264".equals(video.get("codec_name"))||!"avc1".equals(video.get("codec_tag_string"))
                ||!"1920".equals(video.get("width"))||!"1080".equals(video.get("height"))
                ||!"30/1".equals(video.get("r_frame_rate"))||!"1/90000".equals(video.get("time_base"))
                ||!"yuv420p".equals(video.get("pix_fmt"))
                ||!Integer.toString(expectedFrames).equals(video.get("nb_read_frames"))
                ||!"aac".equals(audio.get("codec_name")))
            throw new IOException("Browser-compatible derivative failed AVC1 verification; expectedFrames="+
                expectedFrames+" video="+video+" audio="+audio);
        if(!originalAudio.equals(audioPacketHash(output,directory.resolve("output-audio.sha"))))
            throw new IOException("Browser-compatible derivative changed original AAC packets.");
        // Verify the full decoder timeline, including the last frame, not only container metadata.
        if(decodedVideoHashes(output,directory.resolve("browser-decoded.md5"),true).size()!=expectedFrames)
            throw new IOException("Browser-compatible derivative lost decoded frames.");
        LOG.info("FULL_VIDEO_BROWSER_COMPATIBLE_QA_PASS frames={} codec=avc1 pixFmt=yuv420p audioPacketsUnchanged=true",
            expectedFrames);
    }

    private static String audioPacketHash(Path input,Path output)
            throws IOException,InterruptedException {
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-i",input.toString(),"-map","0:a:0","-c","copy","-f","streamhash",
            "-hash","sha256","-y",output.toString()),output.resolveSibling(output.getFileName()+".log"),60);
        String hash=Files.readString(output).trim();
        if(!hash.matches("0,a,SHA256=[a-f0-9]{64}"))
            throw new IOException("Could not verify original AAC packet hash.");
        return hash;
    }

    static List<String> decodedVideoHashes(Path video,Path hashes,boolean checkClock)
            throws IOException,InterruptedException {
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-threads","2","-i",video.toString(),"-map","0:v:0","-an",
            "-c:v","rawvideo","-threads:v","1","-fps_mode","passthrough",
            "-f","framemd5","-y",hashes.toString()),
            hashes.resolveSibling(hashes.getFileName()+".log"),240);
        List<String> pixels=new ArrayList<>();
        long previous=Long.MIN_VALUE; double ticksPerFrame=1;
        for(String line:Files.readAllLines(hashes)){
            if(line.startsWith("#tb 0:")){
                String[] parts=line.substring(line.indexOf(':')+1).trim().split("/");
                ticksPerFrame=Double.parseDouble(parts[1])/(FPS*Double.parseDouble(parts[0]));
                continue;
            }
            if(line.startsWith("#")||line.isBlank())continue;
            String[] cells=line.split(",");
            if(cells.length!=6)throw new IOException("Invalid decoded frame hash record.");
            long pts=Long.parseLong(cells[2].trim());
            if(checkClock&&previous!=Long.MIN_VALUE&&
                    (pts<=previous||pts-previous>Math.ceil(ticksPerFrame*2.1)))
                throw new IOException("Non-continuous decoded presentation clock near frame "+pixels.size());
            previous=pts;
            pixels.add(cells[5].trim());
        }
        if(pixels.isEmpty())throw new IOException("No decoded video frames.");
        return pixels;
    }

    private static void run(List<String> args,Path log,int seconds)
            throws IOException,InterruptedException {
        Process process=new ProcessBuilder(args).redirectErrorStream(true)
            .redirectOutput(log.toFile()).start();
        try{
            if(!process.waitFor(seconds,TimeUnit.SECONDS))
                throw new IOException("Bounded FFmpeg verification timed out.");
            if(process.exitValue()!=0){
                String reason=Files.readString(log);
                throw new IOException("FFmpeg verification failed: "+
                    reason.substring(0,Math.min(450,reason.length())));
            }
        }finally{
            if(process.isAlive())process.destroyForcibly();
        }
    }

    private static Map<String,String> probe(Path video,String stream,boolean count)
            throws IOException,InterruptedException {
        List<String> command=new ArrayList<>(List.of(
                "ffprobe","-v","error","-select_streams",stream));
        if(count)command.add("-count_frames");
        command.addAll(List.of("-show_entries",
                "stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,time_base,profile,codec_tag_string,extradata_hash,pix_fmt",
                "-show_data_hash","sha256",
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
