package com.architecturalthinking.mediaos.workflow;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.font.TextLayout;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * One bounded, source-specific postproduction derivative of the accepted EP004
 * fifteen-shot master. Original LOCKED Remotion MP4s and original AAC are immutable.
 * Restore only the known metadata/label glyph pixels from adjacent clean pixels
 * in the same decoded frame; put the label in the source-approved clear slot.
 * Do not use this as a generic logo-removal, arbitrary inpainting, or render path.
 */
final class Ep004FinalReviewRepair {
    private static final Logger LOG=LoggerFactory.getLogger(Ep004FinalReviewRepair.class);
    static final int[] FRAMES={2001,2124,2234,2791,2573,2373,2606,2719,2457,2059,2637,2613,2078,2018,1368};
    static final int TOTAL=34651;
    static final int SHOT02=2001,SHOT03=4125,SHOT13=29187,SHOT14=31265,SHOT15=33283;
    static final int FOOTER_END=SHOT03+191,LABEL_START=SHOT13+154;
    static final String VERSION="EP004_FINAL_REVIEW_AT_VIS_0021_V1";
    private static final String LABEL="Primary gateway";
    private static final Color INK=new Color(0xE4EBF2);
    private static final long MAX_OVERLAYS=128L*1024*1024;
    record Crop(int x,int y,int width,int height) {
        int bytes(){return width*height*3;}
    }
    static final Crop FOOTER=new Crop(1370,1008,530,58);
    static final Crop GATEWAY=new Crop(1100,320,650,240);
    private static final Crop FULL=new Crop(0,0,1920,1080);
    record Pose(double scale,double tx,double ty,double move,double fleet,boolean behind) {
        int x(double world){return (int)Math.round(tx+scale*world)-GATEWAY.x();}
        int y(double world){return (int)Math.round(ty+scale*world)-GATEWAY.y();}
        double baseline(){return 422+25*move;}
        double fontSize(){return 30-3*move;}
    }
    private Ep004FinalReviewRepair(){}
    static double smooth(double x){double t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);}
    static Pose pose(int frame){
        if(frame<LABEL_START||frame>=TOTAL)throw new IllegalArgumentException("Outside exact EP004 label repair clock");
        if(frame<SHOT14){
            int f=frame-SHOT13;
            double open=smooth((f-74)/12.0),compact=smooth((f-782)/24.0);
            return new Pose(.92+.08*open-.04*compact,75*(1-open)+32*compact,
                20*(1-open)+22*compact,smooth((f-154)/12.0),smooth((f-166)/12.0),true);
        }
        if(frame<SHOT15){
            int f=frame-SHOT14;
            double wide=smooth((f-74)/36.0),home=smooth((f-1845)/45.0);
            return new Pose(.96-.14*wide+.035*home,32+98*wide-30*home,
                22+54*wide-9*home,1,1,f==0);
        }
        int f=frame-SHOT15;
        double wide=smooth((f-598)/36.0),close=smooth((f-276)/36.0)*(1-wide);
        return new Pose(.855+.145*close-.035*wide,100-76*close+20*wide,
            67-35*close+8*wide,1,1,false);
    }

    private static int pixel(byte[] b,Crop c,int x,int y){
        int i=(y*c.width()+x)*3;
        return ((b[i+2]&255)<<16)|((b[i+1]&255)<<8)|(b[i]&255);
    }
    private static int lum(int p){return (54*((p>>>16)&255)+183*((p>>>8)&255)+19*(p&255))/256;}
    private static int blend(int a,int b,double t){
        t=Math.max(0,Math.min(1,t));
        int r=(int)Math.round(((a>>>16)&255)*(1-t)+((b>>>16)&255)*t);
        int g=(int)Math.round(((a>>>8)&255)*(1-t)+((b>>>8)&255)*t);
        int blue=(int)Math.round((a&255)*(1-t)+(b&255)*t);
        return (r<<16)|(g<<8)|blue;
    }
    private static int average(byte[] src,Crop c,int x,int y,boolean horizontal){
        int r=0,g=0,b=0;
        for(int d=-2;d<=2;d++){
            int p=pixel(src,c,x+(horizontal?d:0),y+(horizontal?0:d));
            r+=(p>>>16)&255;g+=(p>>>8)&255;b+=p&255;
        }
        return ((r/5)<<16)|((g/5)<<8)|(b/5);
    }
    private static void opaque(byte[] out,Crop c,int x,int y,int rgb){
        int i=(y*c.width()+x)*4;
        out[i]=(byte)255;out[i+1]=(byte)rgb;out[i+2]=(byte)(rgb>>>8);out[i+3]=(byte)(rgb>>>16);
    }
    private static byte[] abgr(BufferedImage image){
        return ((DataBufferByte)image.getRaster().getDataBuffer()).getData();
    }
    private static BufferedImage transparent(Crop c){
        return new BufferedImage(c.width(),c.height(),BufferedImage.TYPE_4BYTE_ABGR);
    }

    // Static footer is screen-space, independent of the camera. Vertical samples
    // preserve the actual radial background and SHOT03's moving spatial blend.
    static int footerPatch(byte[] src,byte[] out){
        Crop c=FOOTER;
        int n=0,top=10,bottom=37;
        boolean[] seeds=new boolean[c.width()*c.height()];
        int[] upper=new int[c.width()],lower=new int[c.width()];
        for(int x=0;x<c.width();x++){
            upper[x]=average(src,c,x,6,false);
            lower[x]=average(src,c,x,43,false);
            for(int y=top;y<=bottom;y++){
                int expected=blend(upper[x],lower[x],(y-6)/37.0);
                if(lum(pixel(src,c,x,y))-lum(expected)>9){
                    seeds[y*c.width()+x]=true;n++;
                }
            }
        }
        if(out!=null)for(int y=top;y<=bottom;y++)for(int x=0;x<c.width();x++){
            if(!near(seeds,c,x,y,2,0,c.width()-1,top,bottom))continue;
            opaque(out,c,x,y,blend(upper[x],lower[x],(y-6)/37.0));
        }
        return n;
    }
    private static boolean near(boolean[] mask,Crop c,int x,int y,int radius,int x0,int x1,int y0,int y1){
        for(int yy=Math.max(y0,y-radius);yy<=Math.min(y1,y+radius);yy++)
            for(int xx=Math.max(x0,x-radius);xx<=Math.min(x1,x+radius);xx++)
                if(mask[yy*c.width()+xx])return true;
        return false;
    }
    private static boolean covered(Pose p,int x,int y){
        // SHOT13 draws the alternative body AFTER the old label, so do not
        // change its already-occluding pixels; only the exposed glyph remnants.
        if(!p.behind()||p.fleet()<=0)return false;
        return x>=p.x(1417-227.5*p.fleet())&&x<=p.x(1417+227.5*p.fleet())
            &&y>=p.y(352-66*p.fleet())&&y<=p.y(352+66*p.fleet());
    }
    static int oldLabelPatch(byte[] src,byte[] out,Pose p,boolean upperOnly){
        Crop c=GATEWAY;
        int x0=p.x(1281),x1=p.x(1553),y0=p.y(396),y1=p.y(upperOnly?420:431);
        int left=p.x(1274),right=p.x(1560);
        if(left<3||right>=c.width()-3||y0<3||y1>=c.height()-3||x0<=left||x1>=right)
            throw new IllegalStateException("Source label crop outside safe geometry.");
        boolean[] seeds=new boolean[c.width()*c.height()];
        int[] a=new int[c.height()],b=new int[c.height()];
        int n=0;
        for(int y=y0;y<=y1;y++){
            a[y]=average(src,c,left,y,true);b[y]=average(src,c,right,y,true);
            for(int x=x0;x<=x1;x++){
                if(covered(p,x,y))continue;
                int expected=blend(a[y],b[y],(x-left)/(double)(right-left));
                if(lum(pixel(src,c,x,y))-lum(expected)>10){
                    seeds[y*c.width()+x]=true;n++;
                }
            }
        }
        if(out!=null)for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++){
            if(covered(p,x,y)||!near(seeds,c,x,y,2,x0,x1,y0,y1))continue;
            // Keep the gateway's same-row metal, face, bottom edge, and shadow,
            // not a guessed flat box or blur over its body.
            opaque(out,c,x,y,blend(a[y],b[y],(x-left)/(double)(right-left)));
        }
        return n;
    }
    private static Font font(double size){
        String[] available=GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
        for(String family:List.of("Arial","Liberation Sans","FreeSans","DejaVu Sans"))
            if(Arrays.asList(available).contains(family))return new Font(family,Font.BOLD,1).deriveFont((float)size);
        return new Font(Font.SANS_SERIF,Font.BOLD,1).deriveFont((float)size);
    }
    static Rectangle drawLabel(BufferedImage out,Pose p){
        Graphics2D g=out.createGraphics();
        try{
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS,RenderingHints.VALUE_FRACTIONALMETRICS_ON);
            g.setColor(INK);
            TextLayout layout=new TextLayout(LABEL,font(p.fontSize()*p.scale()),g.getFontRenderContext());
            float x=(float)(p.tx()+1417*p.scale()-GATEWAY.x()-layout.getAdvance()/2);
            float y=(float)(p.ty()+p.baseline()*p.scale()-GATEWAY.y());
            Rectangle bounds=layout.getPixelBounds(g.getFontRenderContext(),x,y);
            if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>GATEWAY.width()||bounds.y+bounds.height>GATEWAY.height())
                throw new IllegalStateException("Corrected label outside exact crop.");
            if(p.fleet()>=.999&&(bounds.y<p.y(418)||bounds.y+bounds.height>p.y(455)))
                throw new IllegalStateException("Corrected label intersects neighboring gateway body.");
            layout.draw(g,x,y);
            return bounds;
        }finally{g.dispose();}
    }
    static int labelPatch(byte[] source,BufferedImage out,int frame){
        Pose p=pose(frame);
        if(p.move()==0)return 0;
        int n=oldLabelPatch(source,abgr(out),p,false);
        drawLabel(out,p);
        return n;
    }

    private static String seconds(int frames){
        return String.format(Locale.ROOT,"%.6f",frames/30.0);
    }
    private static List<String> decodeArgs(Path input,Crop c,int start,int end){
        return new ArrayList<>(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-threads","2","-ss",seconds(Math.max(0,start-60)),"-copyts","-i",input.toString(),
            "-an","-map","0:v:0","-filter_threads","1","-vf",
            "settb=1/90000,trim=start_pts="+(start*3000L)+":end_pts="+(end*3000L)+
                ",setpts=PTS-STARTPTS,crop="+c.width()+":"+c.height()+":"+c.x()+":"+c.y()+",format=bgr24",
            "-fps_mode","passthrough","-threads:v","1","-f","rawvideo"));
    }
    private static byte[] sample(Path input,Crop c,int frame,Path folder,String name)throws IOException,InterruptedException{
        Path raw=folder.resolve(name+".raw");
        try{
            List<String> args=decodeArgs(input,c,frame,frame+1);
            args.addAll(List.of("-y",raw.toString()));
            Ep004LosslessFilmAssembler.run(args,folder.resolve(name+".log"),45);
            byte[] data=Files.readAllBytes(raw);
            if(data.length!=c.bytes())throw new IOException("Exact source sample frame unavailable: "+frame);
            return data;
        }finally{Files.deleteIfExists(raw);}
    }

    private static void overlay(Path input,Path output,Crop crop,int start,int end,boolean footer)
            throws IOException,InterruptedException {
        Path folder=output.getParent();
        List<String> decoderArgs=decodeArgs(input,crop,start,end);decoderArgs.add("pipe:1");
        Process dec=new ProcessBuilder(decoderArgs).redirectError(folder.resolve(output.getFileName()+"-decode.log").toFile()).start();
        Process enc=null;
        ExecutorService executor=Executors.newSingleThreadExecutor();
        try{
            enc=new ProcessBuilder("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
                "-f","rawvideo","-pixel_format","abgr","-video_size",crop.width()+"x"+crop.height(),
                "-framerate","30","-i","pipe:0","-an","-c:v","ffv1","-pix_fmt","bgra","-threads","2",
                "-y",output.toString()).redirectError(folder.resolve(output.getFileName()+"-encode.log").toFile())
                .redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
            final Process encoder=enc;
            Future<Long> task=executor.submit(()->{
                byte[] src=new byte[crop.bytes()];
                BufferedImage patch=transparent(crop);
                byte[] dst=abgr(patch);
                long seeds=0;
                try(var in=dec.getInputStream();var out=encoder.getOutputStream()){
                    for(int frame=start;frame<end;frame++){
                        if(in.readNBytes(src,0,src.length)!=src.length)
                            throw new IOException("Decoded patch input ended at frame "+frame);
                        Arrays.fill(dst,(byte)0);
                        seeds+=footer?footerPatch(src,dst):labelPatch(src,patch,frame);
                        out.write(dst);
                    }
                    if(in.read()!=-1)throw new IOException("Decoded patch input has unexpected extra frames.");
                }
                return seeds;
            });
            long seeds;
            try{seeds=task.get(360,TimeUnit.SECONDS);}
            catch(TimeoutException e){task.cancel(true);throw new IOException("Bounded source patch timed out.",e);}
            catch(ExecutionException e){throw new IOException("Source-derived patch generation failed.",e.getCause());}
            if(!dec.waitFor(30,TimeUnit.SECONDS)||dec.exitValue()!=0
                ||!enc.waitFor(30,TimeUnit.SECONDS)||enc.exitValue()!=0)
                throw new IOException("Source patch FFmpeg stream failed.");
            if(seeds<1000||Files.size(output)<1024||Files.size(output)>MAX_OVERLAYS)
                throw new IOException("Exact reported glyph evidence or overlay size failed.");
            LOG.info("EP004_FINAL_REVIEW_PATCH_PASS type={} start={} end={} sourceGlyphPixels={} bytes={}",
                footer?"footer":"gateway",start,end,seeds,Files.size(output));
        }finally{
            executor.shutdownNow();
            if(dec.isAlive())dec.destroyForcibly();
            if(enc!=null&&enc.isAlive())enc.destroyForcibly();
        }
    }

    private static double psnr(byte[] a,byte[] b){
        if(a.length!=b.length)throw new IllegalArgumentException("Image length mismatch");
        double sum=0;
        for(int i=0;i<a.length;i++){int d=(a[i]&255)-(b[i]&255);sum+=d*d;}
        return sum==0?100:10*Math.log10(255.0*255*a.length/sum);
    }
    private static double labelCoverage(byte[] actual,Pose p){
        BufferedImage template=transparent(GATEWAY);
        Rectangle bounds=drawLabel(template,p);
        byte[] mask=abgr(template);
        int total=0,bright=0;
        for(int y=bounds.y;y<bounds.y+bounds.height;y++)for(int x=bounds.x;x<bounds.x+bounds.width;x++){
            if((mask[(y*GATEWAY.width()+x)*4]&255)<190)continue;
            total++;
            if(lum(pixel(actual,GATEWAY,x,y))>145)bright++;
        }
        return total==0?0:bright/(double)total;
    }
    static void repair(Path input,Path output,int frames)throws IOException,InterruptedException{
        if(frames!=TOTAL||Files.size(input)>MediaObjectStore.MAX_FILM_BYTES)
            throw new IOException("Only the exact bounded fifteen-shot master may be repaired.");
        Path folder=output.getParent();
        Map<String,String> before=Ep004LosslessFilmAssembler.probe(input,"v:0");
        if(!"avc1".equals(before.get("codec_tag_string"))||!"1/90000".equals(before.get("time_base"))
            ||!"30/1".equals(before.get("r_frame_rate"))||!"1920".equals(before.get("width"))
            ||!"1080".equals(before.get("height")))throw new IOException("Unexpected verified master video clock.");
        Ep004LosslessFilmAssembler.verifyMetadataFrameCount(before,frames);
        String audio=Ep004LosslessFilmAssembler.audioPacketHash(input,folder.resolve("original-aac.sha"));
        // Actual decoded evidence, not merely a source-code assumption about the footer side.
        int footerBefore=footerPatch(sample(input,FOOTER,SHOT02+150,folder,"footer-before"),null);
        int labelBefore=oldLabelPatch(sample(input,GATEWAY,SHOT14+600,folder,"gateway-before"),null,pose(SHOT14+600),true);
        if(footerBefore<70||labelBefore<70)
            throw new IOException("Reported glyphs not found in exact source-derived regions; original master retained.");
        Path watermark=folder.resolve("footer-alpha.mkv"),labels=folder.resolve("gateway-alpha.mkv");
        overlay(input,watermark,FOOTER,SHOT02,FOOTER_END,true);
        overlay(input,labels,GATEWAY,LABEL_START,TOTAL,false);
        if(Files.size(watermark)+Files.size(labels)>MAX_OVERLAYS)throw new IOException("Bounded overlays too large.");
        String filters="[0:v]settb=1/90000,setpts=N*3000[v0];"+
            "[1:v]settb=1/90000,setpts=N*3000+"+(SHOT02*3000L)+"[footer];"+
            "[v0][footer]overlay="+FOOTER.x()+":"+FOOTER.y()+":format=yuv420:eof_action=pass:repeatlast=0[v1];"+
            "[2:v]settb=1/90000,setpts=N*3000+"+(LABEL_START*3000L)+"[labels];"+
            "[v1][labels]overlay="+GATEWAY.x()+":"+GATEWAY.y()+":format=yuv420:eof_action=pass:repeatlast=0,"+
            "settb=1/90000,setpts=N*3000,format=yuv420p,setparams=range=limited[video]";
        Ep004LosslessFilmAssembler.run(List.of("ffmpeg","-hide_banner","-nostdin","-v","error","-xerror",
            "-threads","2","-i",input.toString(),"-i",watermark.toString(),"-i",labels.toString(),
            "-filter_complex_threads","1","-filter_complex",filters,"-map","[video]","-map","0:a:0",
            "-enc_time_base","1:30","-fps_mode","passthrough","-c:v","libx264","-preset","ultrafast",
            "-crf","14","-threads:v","2","-profile:v","high","-level:v","4.1","-color_range","tv",
            "-tag:v","avc1","-g","60","-c:a","copy","-video_track_timescale","90000",
            "-movflags","+faststart","-y",output.toString()),folder.resolve("final-review-encode.log"),600);
        Map<String,String> video=Ep004LosslessFilmAssembler.probe(output,"v:0");
        if(!"avc1".equals(video.get("codec_tag_string"))||!"1/90000".equals(video.get("time_base"))
            ||!"30/1".equals(video.get("r_frame_rate"))||!"1920".equals(video.get("width"))||!"1080".equals(video.get("height"))
            ||!"yuv420p".equals(video.get("pix_fmt"))||Files.size(output)>MediaObjectStore.MAX_FILM_BYTES)
            throw new IOException("Corrected master failed exact AVC1 format.");
        Ep004LosslessFilmAssembler.verifyMetadataFrameCount(video,frames);
        if(!audio.equals(Ep004LosslessFilmAssembler.audioPacketHash(output,folder.resolve("corrected-aac.sha"))))
            throw new IOException("Original AAC packets changed; refuse publication.");
        if(Ep004LosslessFilmAssembler.decodedVideoHashes(output,folder.resolve("corrected-decoded.md5"),true,frames).size()!=frames)
            throw new IOException("Corrected master lost source frames.");
        int footerAfter=footerPatch(sample(output,FOOTER,SHOT02+150,folder,"footer-after"),null);
        int inheritedAfter=footerPatch(sample(output,FOOTER,SHOT03,folder,"inherited-after"),null);
        if(footerAfter>Math.max(12,footerBefore/12)||inheritedAfter>Math.max(12,footerBefore/12))
            throw new IOException("Actual corrected footer still has foreground glyph evidence.");
        int labelAfter=oldLabelPatch(sample(output,GATEWAY,SHOT14+600,folder,"gateway-after"),null,pose(SHOT14+600),true);
        if(labelAfter>Math.max(30,labelBefore/5))
            throw new IOException("Old primary label remains in the alternative gateway.");
        double minCoverage=1;
        for(int frame:new int[]{SHOT13+180,SHOT13+600,SHOT13+2077,SHOT14,SHOT14+600,SHOT15,SHOT15+500,TOTAL-1}){
            byte[] actual=sample(output,GATEWAY,frame,folder,"label-"+frame);
            double coverage=labelCoverage(actual,pose(frame));minCoverage=Math.min(minCoverage,coverage);
            if(coverage<.80)throw new IOException("Actual relocated label unreadable at frame "+frame+" coverage="+coverage);
        }
        double minPsnr=100;
        for(int frame:new int[]{1000,20000}){
            double score=psnr(sample(input,FULL,frame,folder,"original-"+frame),sample(output,FULL,frame,folder,"corrected-"+frame));
            minPsnr=Math.min(minPsnr,score);
            if(score<36)throw new IOException("Unrelated visual region degraded at frame "+frame+" PSNR="+score);
        }
        LOG.info("EP004_FINAL_REVIEW_VISUAL_QA_PASS frames={} footerBefore={} footerAfter={} inheritedAfter={} oldLabelBefore={} oldLabelAfter={} relocatedLabelMinCoverage={} untouchedFrameMinPSNR={} audioPacketsUnchanged=true",
            frames,footerBefore,footerAfter,inheritedAfter,labelBefore,labelAfter,minCoverage,minPsnr);
    }
}
