package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;

import static org.junit.jupiter.api.Assertions.*;

class EpisodePublishingStudioServiceTest {
    private static final EpisodePublishingStudioService.Master MASTER=
        new EpisodePublishingStudioService.Master(UUID.randomUUID(),"a".repeat(64),34651,15,true);

    @Test void actualChapterClockAndMinimumSpacing(){
        assertDoesNotThrow(()->EpisodePublishingStudioService.validateChapters(
            "00:00 Intro\n01:07 Failover\n18:30 Conclusion",MASTER));
        for(String invalid:new String[]{
            "00:01 Intro\n00:20 Second\n00:40 Third",
            "00:00 Intro\n00:09 Second\n00:40 Third",
            "00:00 Intro\n00:20 Second\n19:10 Third",
            "00:00 Intro\n00:70 Bad\n02:00 Third",
            "00:00 Intro\n00:20 Only two"})
            assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioService.validateChapters(invalid,MASTER));
    }
    @Test void captionSyntaxCannotBeReplacedByPlainTranscriptOrOutsideMaster(){
        assertDoesNotThrow(()->EpisodePublishingStudioService.validateSrt(
            "1\n00:00:00,000 --> 00:00:02,000\nHello\n\n2\n00:00:02,000 --> 00:00:04,000\nArchitecture",MASTER));
        for(String invalid:new String[]{
            "Plain narration only",
            "1\n00:00:01,000 --> 00:00:00,000\nReversed",
            "1\n00:19:14,000 --> 00:19:16,000\nOutside",
            "1\n00:00:00,000 --> 00:00:03,000\nFirst\n\n2\n00:00:02,000 --> 00:00:04,000\nOverlap",
            "1\n00:00:00,000 --> 00:00:02,000\nOne\nTwo\nThree"})
            assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioService.validateSrt(invalid,MASTER));
    }
    @Test void metadataLimitsAndBlankApproval(){
        assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioService.validateText("TITLE","x".repeat(101),true,MASTER));
        assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioService.validateText("TAGS","x".repeat(501),true,MASTER));
        assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioService.validateText("SUBTITLES_SRT","",true,MASTER));
        assertDoesNotThrow(()->EpisodePublishingStudioService.validateText("SUBTITLES_SRT","",false,MASTER));
    }
    @Test void onlyExactDirectorPreflightAuditCanWrite(){
        var request=new MockHttpServletRequest();
        assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioController.requirePreflight(request));
        request.setAttribute("MEDIA_OS_CREATION_PREFLIGHT",Map.of("auditId","not-a-uuid"));
        assertThrows(ResponseStatusException.class,()->EpisodePublishingStudioController.requirePreflight(request));
        request.setAttribute("MEDIA_OS_CREATION_PREFLIGHT",Map.of("auditId",UUID.randomUUID()));
        assertDoesNotThrow(()->EpisodePublishingStudioController.requirePreflight(request));
    }
    @Test void thumbnailImageDecodingAndNamespacedIdentity() throws Exception{
        var output=new ByteArrayOutputStream();
        assertTrue(ImageIO.write(new BufferedImage(640,360,BufferedImage.TYPE_INT_RGB),"png",output));
        byte[] png=output.toByteArray();
        assertEquals("image/png",MediaObjectStore.publishingImageType(png));
        assertThrows(ResponseStatusException.class,()->MediaObjectStore.publishingImageType("<svg onload='x'/>".getBytes()));
        assertThrows(ResponseStatusException.class,()->MediaObjectStore.publishingImageType(new byte[2097153]));
        assertThrows(ResponseStatusException.class,()->MediaObjectStore.publishingImageType(java.util.Arrays.copyOf(png,12)));
        UUID id=UUID.randomUUID();
        assertEquals("mediaos/media/publishing/thumbnail/v1/"+id+"/"+"a".repeat(64)+".png",
            MediaObjectStore.publishingThumbnailKey(id,"a".repeat(64),"image/png"));
        assertThrows(IllegalArgumentException.class,()->MediaObjectStore.publishingThumbnailKey(id,"../../backup","image/png"));
        assertThrows(IllegalArgumentException.class,()->MediaObjectStore.publishingThumbnailKey(id,"a".repeat(64),"image/svg+xml"));
    }
    @Test void combinedDescriptionUsesOnlySavedMetadata(){
        var item=new EpisodePublishingStudioService.Item("DESCRIPTION",1,"Opening","APPROVED","test",MASTER.sha256(),null,null,null,null,null);
        var chapter=new EpisodePublishingStudioService.Item("CHAPTERS",1,"00:00 Intro","APPROVED","test",MASTER.sha256(),null,null,null,null,null);
        assertEquals("Opening\n\nChapters\n00:00 Intro",EpisodePublishingStudioService.assembled(Map.of("DESCRIPTION",item,"CHAPTERS",chapter)));
    }
}
