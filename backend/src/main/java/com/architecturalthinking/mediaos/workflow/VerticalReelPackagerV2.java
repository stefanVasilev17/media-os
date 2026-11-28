package com.architecturalthinking.mediaos.workflow;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import javax.imageio.ImageIO;

/** Versioned technical packaging. Full source by default; only the registered exact compact stage may use a crop. */
final class VerticalReelPackagerV2 {
    static final String VERSION="AT_VERTICAL_V2";
    static final int WIDTH=1080,HEIGHT=1920,VIDEO_X=0,VIDEO_Y=520,VIDEO_WIDTH=1080,VIDEO_HEIGHT=1056;
    private VerticalReelPackagerV2(){}
    static void template(Path png,String title) throws IOException {
        if(title==null||title.isBlank()||title.length()>160)throw new IOException("Invalid approved title.");
        if(!"FreeSans".equals(new Font("FreeSans",Font.BOLD,37).getFamily(Locale.ROOT)))throw new IOException("Approved packaging font unavailable.");
        BufferedImage image=new BufferedImage(WIDTH,HEIGHT,BufferedImage.TYPE_INT_ARGB);
        Graphics2D g=image.createGraphics();
        try{
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setPaint(new GradientPaint(0,0,new Color(13,32,50),WIDTH,HEIGHT,new Color(6,13,23)));
            g.fillRect(0,0,WIDTH,HEIGHT);
            Color cyan=new Color(91,217,233),white=new Color(243,246,250);
            g.setColor(cyan);g.setStroke(new BasicStroke(5));
            int[] xx={105,146,146,105,64,64},yy={104,127,173,196,173,127};
            g.drawPolygon(xx,yy,6);
            g.setFont(new Font("FreeSans",Font.BOLD,37));g.drawString("AT",81,163);
            g.setColor(white);g.setFont(new Font("FreeSans",Font.BOLD,31));
            g.drawString("ARCHITECTURAL",174,141);g.drawString("T H I N K I N G",174,181);
            g.setColor(cyan);g.setFont(new Font("FreeSans",Font.BOLD,28));
            g.drawString("ARCHITECTURE EXPLAINED",64,245);
            List<String> lines=null;
            for(int size=76;size>=34;size-=2){
                g.setFont(new Font("FreeSans",Font.BOLD,size));
                var candidate=wrap(g.getFontMetrics(),title,870);
                if(candidate.size()<=4 && candidate.size()*(size+10)<=208){lines=candidate;break;}
            }
            if(lines==null)throw new IOException("Approved title cannot fit safely.");
            int y=325;
            for(String line:lines){g.setColor(white);g.drawString(line,64,y);y+=g.getFont().getSize()+10;}
            g.setColor(cyan);g.fillRoundRect(64,Math.min(y+3,502),140,7,5,5);
            g.setColor(new Color(159,180,200));g.setFont(new Font("FreeSans",Font.PLAIN,34));
            g.drawString("How systems work. Why systems fail.",64,1642);
            g.setFont(new Font("FreeSans",Font.BOLD,26));g.setColor(cyan);
            g.drawString("FULL EPISODE ON YOUTUBE",64,1692);
            g.setColor(new Color(37,65,84));g.fillRect(64,1730,690,2);
            // Transparent aperture; no title, branding or caption can cover the source.
            g.setComposite(AlphaComposite.Clear);
            g.fillRect(VIDEO_X,VIDEO_Y,VIDEO_WIDTH,VIDEO_HEIGHT);
        }finally{g.dispose();}
        if(!ImageIO.write(image,"png",png.toFile()))throw new IOException("PNG writer unavailable.");
    }
    private static List<String> wrap(FontMetrics fm,String title,int max){
        List<String> lines=new ArrayList<>();String line="";
        for(String word:title.strip().split("\\s+")){
            if(fm.stringWidth(word)>max)return List.of("","","","","");
            String next=line.isEmpty()?word:line+" "+word;
            if(fm.stringWidth(next)>max){lines.add(line);line=word;}else line=next;
        }
        if(!line.isEmpty())lines.add(line);
        return lines;
    }
    static void packageClip(Path input,Path output,int frames,String title,Integer focusStart) throws IOException,InterruptedException{
        DirectReelExtractor.validateRange(0,frames,frames);
        Path dir=output.getParent(),png=dir.resolve("vertical-template.png");
        var audio=DirectReelExtractor.probe(input,"a:0",dir.resolve("vertical-audio.txt"),false);
        DirectReelExtractor.verify(input,frames,audio);
        if(!"48000".equals(audio.get("sample_rate"))||!List.of("1","2").contains(audio.get("channels")))
            throw new IOException("Unsupported original audio format.");
        template(png,title);
        String aperture=apertureFilter(frames,focusStart);
        String filter=aperture+";[aperture]pad=1080:1920:0:520:color=0x081421[base];[base][1:v]overlay=0:0:format=yuv420:repeatlast=1";
        DirectReelExtractor.run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-threads","2",
            "-i",input.toString(),"-i",png.toString(),"-filter_complex_threads","1","-filter_complex",filter,
            "-map","0:a:0","-c:v","libx264","-preset","veryfast","-crf","18","-maxrate","4500k","-bufsize","9000k",
            "-threads:v","2","-pix_fmt","yuv420p","-tag:v","avc1","-fps_mode","passthrough",
            "-c:a","copy","-movflags","+faststart","-fs",Long.toString(DirectReelExtractor.MAX_BYTES),"-y",output.toString()),
            dir.resolve("vertical-encode.log"),600);
        DirectReelExtractor.verifyDimensions(output,frames,audio,WIDTH,HEIGHT);
        Path before=dir.resolve("vertical-source-audio.sha"),after=dir.resolve("vertical-output-audio.sha");
        audioDigest(input,before,false,frames);
        audioDigest(output,after,false,frames);
        if(!Files.readString(before).equals(Files.readString(after)))throw new IOException("Decoded narration changed during packaging.");
        Path packetsBefore=dir.resolve("vertical-source-packets.sha"),packetsAfter=dir.resolve("vertical-output-packets.sha");
        audioDigest(input,packetsBefore,true,frames);
        audioDigest(output,packetsAfter,true,frames);
        if(!Files.readString(packetsBefore).equals(Files.readString(packetsAfter)))throw new IOException("Original AAC packets changed during packaging.");
        Path quality=dir.resolve("vertical-quality.log");
        String comparison=aperture+";[1:v]crop=1080:1056:0:520,setsar=1,settb=1/30,setpts=N[b];[aperture][b]psnr=shortest=1:repeatlast=0";
        DirectReelExtractor.run(List.of("ffmpeg","-hide_banner","-nostdin","-v","info","-xerror","-threads","2",
            "-i",input.toString(),"-threads","2","-i",output.toString(),"-filter_complex_threads","1",
            "-filter_complex",comparison,"-an","-f","null","-"),quality,360);
        var match=java.util.regex.Pattern.compile("average:([0-9.]+|inf)").matcher(Files.readString(quality));
        if(!match.find()||(!"inf".equals(match.group(1))&&Double.parseDouble(match.group(1))<35))
            throw new IOException("V2 aperture visual verification failed.");
    }
    // The full view never crops. The known compact stage crops only its background, using
    // the exact locked SHOT07 render's geometry and actual event frame, never guessed timestamps.
    private static final String WIDE="scale=1056:594:flags=lanczos,pad=1080:1056:12:230:color=0x081421,setsar=1";
    private static final String FOCUS="crop=864:1056:528:24,pad=1080:1056:108:0:color=0x081421,setsar=1";
    static String apertureFilter(int frames,Integer focus){
        if(frames<1||frames>5400||focus!=null&&(focus<0||focus>=frames))throw new IllegalArgumentException("Invalid verified framing interval.");
        if(focus==null||focus==0)
            return "[0:v]"+(focus==null?WIDE:FOCUS)+",settb=1/30,setpts=N[aperture]";
        return "[0:v]split=2[w][f];[w]trim=end_frame="+focus+",setpts=PTS-STARTPTS,"+WIDE+"[wide];"+
            "[f]trim=start_frame="+focus+",setpts=PTS-STARTPTS,"+FOCUS+"[focus];"+
            "[wide][focus]concat=n=2:v=1:a=0,settb=1/30,setpts=N[aperture]";
    }
    private static void audioDigest(Path input,Path output,boolean packets,int frames) throws IOException,InterruptedException{
        // Never seek: seeking even at zero may discard AAC decoder priming differently across MP4 edit lists.
        List<String> args=new ArrayList<>(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-i",input.toString(),
            "-map","0:a:0","-vn","-c:a",packets?"copy":"pcm_s16le"));
        if(!packets)args.addAll(List.of("-t",DirectReelExtractor.seconds(frames)));
        args.addAll(List.of("-f","hash","-hash","sha256","-y",output.toString()));
        DirectReelExtractor.run(args,output.resolveSibling(output.getFileName()+".log"),90);
    }
}
