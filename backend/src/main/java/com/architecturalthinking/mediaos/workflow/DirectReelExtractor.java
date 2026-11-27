package com.architecturalthinking.mediaos.workflow;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

final class DirectReelExtractor {
    static final int FPS=30;
    static final long MAX_BYTES=128L*1024*1024;
    private DirectReelExtractor(){}
    static String seconds(int frames){return String.format(Locale.ROOT,"%.9f",frames/(double)FPS);}
    static void validateRange(int first,int end,int total){
        if(first<0||end<=first||end>total||end-first>5400)
            throw new IllegalArgumentException("Select a continuous interval of up to three minutes inside the master.");
    }
    static String extract(Path source,Path output,int first,int end,int total) throws IOException,InterruptedException{
        validateRange(first,end,total);
        Path dir=output.getParent();
        Map<String,String> input=probe(source,"v:0",dir.resolve("input-video.txt"),false);
        if(!"h264".equals(input.get("codec_name"))||!"30/1".equals(input.get("r_frame_rate"))
            ||!"1920".equals(input.get("width"))||!"1080".equals(input.get("height"))
            ||!Integer.toString(total).equals(input.get("nb_frames")))
            throw new IOException("Master does not match the verified 1080p30 frame clock.");
        Map<String,String> audio=probe(source,"a:0",dir.resolve("input-audio.txt"),false);
        if(!"aac".equals(audio.get("codec_name"))||!"48000".equals(audio.get("sample_rate"))
            ||!List.of("1","2").contains(audio.get("channels")))
            throw new IOException("Unsupported master audio clock.");
        int frames=end-first;
        // A copy is safe only when the boundary is both a video keyframe and an AAC packet boundary.
        // Confirm decoded source pixels and exact audio samples before retaining it.
        Path sourceHashes=dir.resolve("source.md5");
        hashes(source,sourceHashes,first,frames);
        List<String> expected=readHashes(sourceHashes);
        if(expected.size()!=frames)throw new IOException("Source interval did not decode to its exact frame count.");
        Path sourceAudio=dir.resolve("source-audio.sha");
        audioHash(source,sourceAudio,first,frames);
        try{
            if(!keyframeAt(source,first,dir.resolve("keyframes.txt")))
                throw new IOException("Non-keyframe interval requires an independent technical encode.");
            run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
                "-ss",seconds(first),"-i",source.toString(),"-t",seconds(frames),
                "-map","0:v:0","-map","0:a:0","-c","copy","-movflags","+faststart",
                "-fs",Long.toString(MAX_BYTES),"-y",output.toString()),dir.resolve("copy.log"),60);
            verify(output,frames,audio);
            Path actual=dir.resolve("copy.md5");
            hashes(output,actual,0,frames);
            Path actualAudio=dir.resolve("copy-audio.sha");
            audioHash(output,actualAudio,0,frames);
            if(expected.equals(readHashes(actual))&&Files.readString(sourceAudio).equals(Files.readString(actualAudio)))
                return "STREAM_COPY";
        }catch(IOException unsuitable){
            // Exact cut or audio verification failed. Only technical encoding is allowed.
        }
        Files.deleteIfExists(output);
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-threads","2",
            "-ss",seconds(first),"-i",source.toString(),"-t",seconds(frames),
            "-map","0:v:0","-map","0:a:0","-c:v","libx264","-preset","ultrafast","-crf","16",
            "-threads:v","2","-pix_fmt","yuv420p","-tag:v","avc1","-fps_mode","passthrough",
            "-c:a","aac","-b:a","192k","-movflags","+faststart","-fs",Long.toString(MAX_BYTES),
            "-y",output.toString()),dir.resolve("encode.log"),240);
        verify(output,frames,audio);
        // Full decoded visual comparison, with no crop, scale, overlay, or creative rendering.
        Path quality=dir.resolve("quality.log");
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","info","-xerror","-threads","2",
            "-ss",seconds(first),"-t",seconds(frames),"-i",source.toString(),
            "-threads","2","-i",output.toString(),"-filter_complex_threads","1",
            "-filter_complex","[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]psnr=shortest=1:repeatlast=0",
            "-an","-f","null","-"),quality,180);
        var match=java.util.regex.Pattern.compile("average:([0-9.]+|inf)").matcher(Files.readString(quality));
        if(!match.find()||(!"inf".equals(match.group(1))&&Double.parseDouble(match.group(1))<35))
            throw new IOException("Technical encoding visual comparison failed.");
        verifyAudioContent(source,output,first,frames,dir);
        return "TECHNICAL_ENCODE";
    }
    static void verify(Path output,int frames,Map<String,String> originalAudio) throws IOException,InterruptedException{
        if(!Files.isRegularFile(output)||Files.size(output)<1024||Files.size(output)>MAX_BYTES)
            throw new IOException("Extract exceeds bounded MP4 size or is missing.");
        Path dir=output.getParent();
        Map<String,String> v=probe(output,"v:0",dir.resolve("out-video.txt"),true);
        Map<String,String> a=probe(output,"a:0",dir.resolve("out-audio.txt"),true);
        if(!"h264".equals(v.get("codec_name"))||!"1920".equals(v.get("width"))||!"1080".equals(v.get("height"))
            ||!"30/1".equals(v.get("r_frame_rate"))||!Integer.toString(frames).equals(v.get("nb_read_frames"))
            ||!"aac".equals(a.get("codec_name"))||!originalAudio.get("channels").equals(a.get("channels"))
            ||!originalAudio.get("sample_rate").equals(a.get("sample_rate")))
            throw new IOException("Extract failed decoded frame count, dimensions or original audio format.");
        try{
            double duration=frames/30.0;
            if(Math.abs(Double.parseDouble(v.get("start_time")))>0.001
                ||Math.abs(Double.parseDouble(a.get("start_time")))>0.025
                ||Math.abs(Double.parseDouble(v.get("duration"))-duration)>0.002
                ||Math.abs(Double.parseDouble(a.get("duration"))-duration)>0.05)
                throw new IOException("Extract failed video/audio clock verification.");
        }catch(NumberFormatException|NullPointerException invalid){throw new IOException("Missing extract clock.",invalid);}
    }
    private static Map<String,String> probe(Path source,String stream,Path log,boolean count) throws IOException,InterruptedException{
        List<String> args=new ArrayList<>(List.of("ffprobe","-v","error","-select_streams",stream));
        if(count)args.add("-count_frames");
        args.addAll(List.of("-show_entries","stream=codec_name,width,height,r_frame_rate,nb_frames,nb_read_frames,sample_rate,channels,start_time,duration",
            "-of","default=nw=1",source.toString()));
        run(args,log,120);
        Map<String,String> result=new HashMap<>();
        for(String line:Files.readAllLines(log)){int i=line.indexOf('=');if(i>0)result.put(line.substring(0,i),line.substring(i+1));}
        return result;
    }
    private static void hashes(Path source,Path target,int first,int frames) throws IOException,InterruptedException{
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-threads","2",
            "-ss",seconds(first),"-i",source.toString(),"-t",seconds(frames),
            "-map","0:v:0","-an","-c:v","rawvideo","-threads:v","1","-f","framemd5","-y",target.toString()),
            target.resolveSibling(target.getFileName()+".log"),180);
    }
    private static List<String> readHashes(Path file) throws IOException{
        return Files.readAllLines(file).stream().filter(x->!x.startsWith("#")&&!x.isBlank())
            .map(x->x.substring(x.lastIndexOf(',')+1).strip()).toList();
    }
    private static void audioHash(Path source,Path target,int first,int frames) throws IOException,InterruptedException{
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-ss",seconds(first),"-i",source.toString(),
            "-t",seconds(frames),"-map","0:a:0","-vn","-c:a","pcm_s16le","-f","hash","-hash","sha256","-y",target.toString()),
            target.resolveSibling(target.getFileName()+".log"),90);
    }
    private static boolean keyframeAt(Path source,int first,Path log) throws IOException,InterruptedException{
        // ffprobe seeks to an earlier keyframe. Require a keyframe on the requested frame,
        // not an MP4 edit list that hides decoder preroll outside the requested interval.
        run(List.of("ffprobe","-v","error","-select_streams","v:0","-skip_frame","nokey",
            "-read_intervals",seconds(first)+"%+3","-show_frames","-show_entries","frame=best_effort_timestamp_time",
            "-of","csv=p=0",source.toString()),log,30);
        for(String line:Files.readAllLines(log)){
            String time=line.split(",",2)[0].strip();
            try{if(Math.abs(Double.parseDouble(time)-first/30.0)<0.00001)return true;}
            catch(NumberFormatException ignored){}
        }
        return false;
    }
    private static void verifyAudioContent(Path source,Path output,int first,int frames,Path dir) throws IOException,InterruptedException{
        Path before=dir.resolve("source.pcm"),after=dir.resolve("output.pcm");
        pcm(source,before,first,frames);pcm(output,after,0,frames);
        long size=Files.size(before);
        if(size<2||size>35L*1024*1024||Files.size(after)!=size||size%2!=0)
            throw new IOException("Technical encoding changed the selected narration sample count.");
        double reference=0,error=0;
        try(var a=new java.io.BufferedInputStream(Files.newInputStream(before));
            var b=new java.io.BufferedInputStream(Files.newInputStream(after))){
            for(long i=0;i<size/2;i++){
                int x=(short)(a.read()|(a.read()<<8)),y=(short)(b.read()|(b.read()<<8));
                reference+=(double)x*x;double delta=x-y;error+=delta*delta;
            }
        }
        // PCM waveform similarity: allow AAC quantization, reject displaced or substituted narration.
        if(error>Math.max(reference*0.04,(size/2)*64.0))
            throw new IOException("Technical encoding changed the original narration waveform.");
    }
    private static void pcm(Path source,Path target,int first,int frames) throws IOException,InterruptedException{
        run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-ss",seconds(first),"-i",source.toString(),
            "-t",seconds(frames),"-map","0:a:0","-vn","-c:a","pcm_s16le","-f","s16le","-y",target.toString()),
            target.resolveSibling(target.getFileName()+".log"),90);
    }
    private static void run(List<String> args,Path log,int timeout) throws IOException,InterruptedException{
        Process p=new ProcessBuilder(args).redirectErrorStream(true).redirectOutput(log.toFile()).start();
        try{
            if(!p.waitFor(timeout,TimeUnit.SECONDS))throw new IOException("Bounded FFmpeg operation timed out.");
            if(p.exitValue()!=0)throw new IOException("FFmpeg/ffprobe refused the requested interval.");
        }finally{if(p.isAlive())p.destroyForcibly();}
    }
}
