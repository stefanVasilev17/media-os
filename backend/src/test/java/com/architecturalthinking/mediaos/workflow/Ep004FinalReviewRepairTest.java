package com.architecturalthinking.mediaos.workflow;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Ep004FinalReviewRepairTest {
    @Test void exactFifteenShotClockAndLabelClearance(){
        assertEquals(34651,Arrays.stream(Ep004FinalReviewRepair.FRAMES).sum());
        assertEquals(29187,Arrays.stream(Ep004FinalReviewRepair.FRAMES,0,12).sum());
        assertEquals(31265,Arrays.stream(Ep004FinalReviewRepair.FRAMES,0,13).sum());
        assertEquals(33283,Arrays.stream(Ep004FinalReviewRepair.FRAMES,0,14).sum());
        assertEquals(422,Ep004FinalReviewRepair.pose(Ep004FinalReviewRepair.LABEL_START).baseline());
        assertEquals(447,Ep004FinalReviewRepair.pose(Ep004FinalReviewRepair.SHOT13+166).baseline());
        for(int frame:new int[]{29342,29353,29365,29969,29993,31264,31265,31339,31375,33110,33282,33283,33559,33595,33881,33917,34650}){
            var p=Ep004FinalReviewRepair.pose(frame);
            BufferedImage img=new BufferedImage(650,240,BufferedImage.TYPE_4BYTE_ABGR);
            Rectangle b=Ep004FinalReviewRepair.drawLabel(img,p);
            if(p.fleet()>=.999){assertTrue(b.y>=p.y(418));assertTrue(b.y+b.height<=p.y(455));}
        }
    }
    @Test void actualFooterPixelsAreRemovedWithoutChangingNearbyBackground(){
        var crop=Ep004FinalReviewRepair.FOOTER;
        BufferedImage input=new BufferedImage(crop.width(),crop.height(),BufferedImage.TYPE_3BYTE_BGR);
        Graphics2D g=input.createGraphics();
        g.setColor(new Color(8,13,22));g.fillRect(0,0,crop.width(),crop.height());
        g.setFont(new Font(Font.SANS_SERIF,Font.BOLD,15));g.setColor(new Color(105,126,140));
        g.drawString("EP004 / SHOT02 - DIRECTOR REVIEW CANDIDATE",90,32);g.dispose();
        byte[] source=((DataBufferByte)input.getRaster().getDataBuffer()).getData();
        byte[] patch=new byte[crop.width()*crop.height()*4];
        int before=Ep004FinalReviewRepair.footerPatch(source,patch);
        assertTrue(before>70);
        int changed=0;
        for(int i=0;i<crop.width()*crop.height();i++)if((patch[i*4]&255)==255){
            source[i*3]=patch[i*4+1];source[i*3+1]=patch[i*4+2];source[i*3+2]=patch[i*4+3];changed++;
            assertTrue(i/crop.width()>=10&&i/crop.width()<=37);
        }
        assertTrue(changed>before);
        assertEquals(0,Ep004FinalReviewRepair.footerPatch(source,null));
    }
    @Test void actualOldLabelIsRemovedAndRelocatedWithoutCoveringBody(){
        var p=Ep004FinalReviewRepair.pose(Ep004FinalReviewRepair.SHOT14+600);
        BufferedImage input=new BufferedImage(650,240,BufferedImage.TYPE_3BYTE_BGR);
        Graphics2D g=input.createGraphics();
        g.setColor(new Color(30,45,57));g.fillRect(0,0,650,240);
        g.setColor(new Color(16,26,37));g.fillRect(p.x(1190),p.y(286),p.x(1645)-p.x(1190),p.y(418)-p.y(286));
        g.setColor(new Color(130,150,166));g.drawLine(p.x(1190),p.y(418),p.x(1645),p.y(418));
        g.setFont(new Font(Font.SANS_SERIF,Font.BOLD,1).deriveFont((float)(30*p.scale())));
        g.setColor(new Color(0xE4EBF2));String text="Primary gateway";
        g.drawString(text,p.x(1417)-g.getFontMetrics().stringWidth(text)/2,p.y(422));g.dispose();
        byte[] src=((DataBufferByte)input.getRaster().getDataBuffer()).getData();
        BufferedImage overlay=new BufferedImage(650,240,BufferedImage.TYPE_4BYTE_ABGR);
        int before=Ep004FinalReviewRepair.labelPatch(src,overlay,Ep004FinalReviewRepair.SHOT14+600);
        assertTrue(before>70);
        byte[] patch=((DataBufferByte)overlay.getRaster().getDataBuffer()).getData();
        for(int i=0;i<650*240;i++)if((patch[i*4]&255)==255){
            src[i*3]=patch[i*4+1];src[i*3+1]=patch[i*4+2];src[i*3+2]=patch[i*4+3];
        }
        assertTrue(Ep004FinalReviewRepair.oldLabelPatch(src,null,p,true)<before/5);
    }
}
