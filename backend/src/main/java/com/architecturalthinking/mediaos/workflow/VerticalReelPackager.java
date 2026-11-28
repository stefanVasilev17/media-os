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

/** Technical packaging only. The complete original picture occupies a fixed 16:9 aperture. */
final class VerticalReelPackager {
    static final String VERSION="AT_VERTICAL_V1";
    static final int WIDTH=1080,HEIGHT=1920,VIDEO_X=24,VIDEO_Y=850,VIDEO_WIDTH=960,VIDEO_HEIGHT=540;
    private VerticalReelPackager(){}
    static void template(Path png,String title) throws IOException {
        if(title==null||title.isBlank()||title.length()>160)throw new IOException("Invalid approved title.");
        BufferedImage image=new BufferedImage(WIDTH,HEIGHT,BufferedImage.TYPE_INT_ARGB);
        Graphics2D g=image.createGraphics();
        try{
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setPaint(new GradientPaint(0,0,new Color(13,32,50),WIDTH,HEIGHT,new Color(6,13,23)));
            g.fillRect(0,0,WIDTH,HEIGHT);
            Color cyan=new Color(91,217,233),white=new Color(243,246,250);
            g.setColor(cyan);g.setStroke(new BasicStroke(5));
            int[] xx={136,177,177,136,95,95},yy={170,193,239,262,239,193};
            g.drawPolygon(xx,yy,6);
            g.setFont(new Font("Liberation Sans",Font.BOLD,37));g.drawString("AT",112,229);
            g.setColor(white);g.setFont(new Font("Liberation Sans",Font.BOLD,31));
            g.drawString("ARCHITECTURAL",205,207);g.drawString("T H I N K I N G",205,247);
            g.setColor(cyan);g.setFont(new Font("Liberation Sans",Font.BOLD,28));
            g.drawString("ARCHITECTURE EXPLAINED",96,388);
            List<String> lines=null;
            for(int size=78;size>=40;size-=2){
                g.setFont(new Font("Liberation Sans",Font.BOLD,size));
                var candidate=wrap(g.getFontMetrics(),title,870);
                if(candidate.size()<=4 && candidate.size()*(size+10)<=350){lines=candidate;break;}
            }
            if(lines==null)throw new IOException("Approved title cannot fit safely.");
            int y=485;
            for(String line:lines){g.setColor(white);g.drawString(line,96,y);y+=g.getFont().getSize()+10;}
            g.setColor(cyan);g.fillRoundRect(96,Math.min(y+8,805),140,7,5,5);
            g.setColor(new Color(159,180,200));g.setFont(new Font("Liberation Sans",Font.PLAIN,34));
            g.drawString("How systems work. Why systems fail.",96,1510);
            g.setFont(new Font("Liberation Sans",Font.BOLD,26));g.setColor(cyan);
            g.drawString("FULL EPISODE ON YOUTUBE",96,1576);
            g.setColor(new Color(37,65,84));g.fillRect(96,1640,690,2);
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
    static void packageClip(Path input,Path output,int frames,String title) throws IOException,InterruptedException{
        DirectReelExtractor.validateRange(0,frames,frames);
        Path dir=output.getParent(),png=dir.resolve("vertical-template.png");
        var audio=DirectReelExtractor.probe(input,"a:0",dir.resolve("vertical-audio.txt"),false);
        DirectReelExtractor.verify(input,frames,audio);
        if(!"48000".equals(audio.get("sample_rate"))||!List.of("1","2").contains(audio.get("channels")))
            throw new IOException("Unsupported original audio format.");
        template(png,title);
        String filter="[0:v]scale="+VIDEO_WIDTH+":"+VIDEO_HEIGHT+":flags=lanczos,pad="+WIDTH+":"+HEIGHT+":"+VIDEO_X+":"+VIDEO_Y+
            ":color=0x081421,setsar=1[base];[base][1:v]overlay=0:0:format=yuv420:repeatlast=1";
        DirectReelExtractor.run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror","-threads","2",
            "-i",input.toString(),"-i",png.toString(),"-filter_complex_threads","1","-filter_complex",filter,
            "-map","0:a:0","-c:v","libx264","-preset","veryfast","-crf","18","-maxrate","4500k","-bufsize","9000k",
            "-threads:v","2","-pix_fmt","yuv420p","-tag:v","avc1","-fps_mode","passthrough",
            "-c:a","copy","-movflags","+faststart","-fs",Long.toString(DirectReelExtractor.MAX_BYTES),"-y",output.toString()),
            dir.resolve("vertical-encode.log"),600);
        DirectReelExtractor.verifyDimensions(output,frames,audio,WIDTH,HEIGHT);
        Path before=dir.resolve("vertical-source-audio.sha"),after=dir.resolve("vertical-output-audio.sha");
        DirectReelExtractor.audioHash(input,before,0,frames);
        DirectReelExtractor.audioHash(output,after,0,frames);
        if(!Files.readString(before).equals(Files.readString(after)))throw new IOException("Narration changed during packaging.");
        Path quality=dir.resolve("vertical-quality.log");
        String comparison="[0:v]scale="+VIDEO_WIDTH+":"+VIDEO_HEIGHT+":flags=lanczos,setsar=1,setpts=PTS-STARTPTS[a];"+
            "[1:v]crop="+VIDEO_WIDTH+":"+VIDEO_HEIGHT+":"+VIDEO_X+":"+VIDEO_Y+",setsar=1,setpts=PTS-STARTPTS[b];[a][b]psnr=shortest=1:repeatlast=0";
        DirectReelExtractor.run(List.of("ffmpeg","-hide_banner","-nostdin","-v","info","-xerror","-threads","2",
            "-i",input.toString(),"-threads","2","-i",output.toString(),"-filter_complex_threads","1",
            "-filter_complex",comparison,"-an","-f","null","-"),quality,360);
        var match=java.util.regex.Pattern.compile("average:([0-9.]+|inf)").matcher(Files.readString(quality));
        if(!match.find()||(!"inf".equals(match.group(1))&&Double.parseDouble(match.group(1))<35))
            throw new IOException("Full-aperture visual verification failed.");
    }
}
