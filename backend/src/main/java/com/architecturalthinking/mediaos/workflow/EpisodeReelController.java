package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/reels")
public class EpisodeReelController {
    private final EpisodeReelService service;
    private final MediaObjectStore store;
    public EpisodeReelController(EpisodeReelService service,MediaObjectStore store){this.service=service;this.store=store;}
    @GetMapping
    public EpisodeReelService.View get(@PathVariable UUID packageId){return service.get(packageId);}
    @PostMapping("/extract")
    public EpisodeReelService.View extract(@PathVariable UUID packageId,@RequestBody EpisodeReelService.Extract input,HttpServletRequest request){
        return service.extract(packageId,input,audit(request));
    }
    @PostMapping("/{reelId}/lock")
    public EpisodeReelService.View lock(@PathVariable UUID packageId,@PathVariable UUID reelId,@RequestBody EpisodeReelService.Lock input,HttpServletRequest request){
        audit(request);return service.lock(packageId,reelId,input);
    }
    @GetMapping("/vertical")
    public java.util.List<EpisodeReelService.Vertical> vertical(@PathVariable UUID packageId){return service.vertical(packageId);}
    @PostMapping("/{reelId}/vertical/package")
    public java.util.List<EpisodeReelService.Vertical> packageVertical(@PathVariable UUID packageId,@PathVariable UUID reelId,
        @RequestBody EpisodeReelService.PackageVertical input,HttpServletRequest request){
        return service.packageVertical(packageId,reelId,input,audit(request));
    }
    @PostMapping("/{reelId}/vertical/lock")
    public java.util.List<EpisodeReelService.Vertical> lockVertical(@PathVariable UUID packageId,@PathVariable UUID reelId,
        @RequestBody EpisodeReelService.Lock input,HttpServletRequest request){
        audit(request);return service.lockVertical(packageId,reelId,input);
    }
    @GetMapping("/{reelId}/vertical/video")
    public ResponseEntity<StreamingResponseBody> verticalVideo(@PathVariable UUID packageId,@PathVariable UUID reelId,
        @RequestHeader(value=HttpHeaders.RANGE,required=false) String range,@RequestParam(defaultValue="false") boolean download){
        return stream(service.authorizedVerticalMedia(packageId,reelId),range,download,"vertical-"+reelId);
    }
    static UUID audit(HttpServletRequest request){
        Object attr=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(attr instanceof Map<?,?> map)||!(map.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Audited Director request required.");
        return id;
    }
    record Range(long first,long last){}
    static Range range(String header,long size){
        if(size<1)throw new IllegalArgumentException("Invalid media size.");
        if(header==null)return new Range(0,size-1);
        try{
            if(!header.matches("^bytes=[0-9]*-[0-9]*$"))throw new NumberFormatException();
            String[] parts=header.substring(6).split("-",2);
            long start,end=size-1;
            if(parts[0].isBlank()){
                long suffix=Long.parseLong(parts[1]);
                if(suffix<=0)throw new NumberFormatException();
                start=Math.max(0,size-suffix);
            }else{
                start=Long.parseLong(parts[0]);
                if(!parts[1].isBlank())end=Math.min(end,Long.parseLong(parts[1]));
            }
            if(start<0||start>=size||end<start)throw new NumberFormatException();
            return new Range(start,end);
        }catch(NumberFormatException ex){throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,"Invalid clip byte range.");}
    }
    @GetMapping("/{reelId}/video")
    public ResponseEntity<StreamingResponseBody> video(@PathVariable UUID packageId,@PathVariable UUID reelId,
        @RequestHeader(value=HttpHeaders.RANGE,required=false) String range,@RequestParam(defaultValue="false") boolean download){
        return stream(service.authorizedMedia(packageId,reelId),range,download,"reel-"+reelId);
    }
    private ResponseEntity<StreamingResponseBody> stream(EpisodeReelService.Media m,String range,boolean download,String filename){
        store.verifyVideoManifest(m.key(),m.sha(),m.bytes());
        Range r=range(range,m.bytes());
        HttpHeaders h=new HttpHeaders();
        h.setContentType(MediaType.valueOf("video/mp4"));h.setCacheControl("private, no-store");
        h.set(HttpHeaders.ACCEPT_RANGES,"bytes");h.setContentLength(r.last()-r.first()+1);
        if(download)h.set(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+filename+".mp4\"");
        if(range!=null)h.set(HttpHeaders.CONTENT_RANGE,"bytes "+r.first()+"-"+r.last()+"/"+m.bytes());
        StreamingResponseBody body=out->store.streamVideoRange(m.key(),m.sha(),m.bytes(),r.first(),r.last(),out);
        return new ResponseEntity<>(body,h,range==null?HttpStatus.OK:HttpStatus.PARTIAL_CONTENT);
    }
}
