package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/publishing")
public class EpisodePublishingStudioController {
    private final EpisodePublishingStudioService studio;
    public EpisodePublishingStudioController(EpisodePublishingStudioService studio){this.studio=studio;}

    @GetMapping
    public EpisodePublishingStudioService.Studio get(@PathVariable UUID packageId){
        return studio.get(packageId);
    }
    @GetMapping("/items/{fieldKey}/history")
    public List<EpisodePublishingStudioService.Item> history(@PathVariable UUID packageId,@PathVariable String fieldKey){
        return studio.history(packageId,fieldKey);
    }
    @PostMapping("/items/{fieldKey}")
    public EpisodePublishingStudioService.Studio change(@PathVariable UUID packageId,@PathVariable String fieldKey,
        @RequestBody EpisodePublishingStudioService.Change change,HttpServletRequest request){
        requirePreflight(request);
        return studio.change(packageId,fieldKey,change);
    }
    @PostMapping(value="/thumbnail",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public EpisodePublishingStudioService.Studio upload(@PathVariable UUID packageId,
        @RequestParam Integer expectedRevision,@RequestParam boolean confirm,@RequestParam MultipartFile file,
        HttpServletRequest request) throws IOException{
        requirePreflight(request);
        if(file.getSize()<1||file.getSize()>MediaObjectStore.MAX_THUMBNAIL_BYTES)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"Thumbnail must be at most 2 MiB.");
        return studio.uploadThumbnail(packageId,expectedRevision,confirm,file.getBytes());
    }
    @GetMapping("/thumbnail/{revision}")
    public ResponseEntity<byte[]> image(@PathVariable UUID packageId,@PathVariable int revision){
        var image=studio.image(packageId,revision);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options","nosniff")
            .header("Content-Disposition","inline")
            .contentType(MediaType.parseMediaType(image.type()))
            .eTag("\""+image.sha256()+"\"").body(image.bytes());
    }
    static void requirePreflight(HttpServletRequest request){
        Object attr=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(attr instanceof Map<?,?> data)||!(data.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Audited publishing preflight required.");
    }
}
