package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class Shot05ImportRebaseTest {
    static final String[] WORDS = {
        "When you press Login, your request reaches the first stop on the server side. Here, a few rules are checked before the password. This stop is called the API Gateway.",
        "The request must find the right service. The app now uses version two of the login address. But the gateway still knows only version one. It answers 404. The password check never starts. Choosing where a request goes is called routing.",
        "The address is right, but the app sends GET instead of POST. The gateway answers 405: Method Not Allowed. POST is for sending login details. GET asks to read data. This difference is called the HTTP method.",
        "The app gets no answer, so it tries again and again. Soon, too many requests arrive. The gateway answers 429: Too Many Requests. A few quick requests are fine. That is a burst. A limit per minute is a quota. Together, these rules are called rate limiting.",
        "Some requests look unsafe. A rule stops them. But a bad rule can also stop a normal login. The gateway answers 403: Forbidden. This kind of check is done by a Web Application Firewall, or WAF.",
        "The app should send a field called email. After an update, it sends userEmail instead. The gateway cannot find the field it needs, so it answers 400: Bad Request. This check is called schema validation.",
        "Those were examples of what can go wrong. Our real request passes every check. Next, the load balancer picks a healthy server."
    };
    static final int[] OFFSET = {0, 17, 38, 58, 81, 101, 119, 130};

    static List<Map<String, Object>> canonical() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i=1; i<=16; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("shotKey", String.format("SHOT %02d", i));
            row.put("startSecond", i==5 ? 264 : i < 5 ? (i-1)*60 : 344+(i-6)*70);
            row.put("endSecond", i==5 ? 344 : i < 5 ? i*60 : 344+(i-5)*70);
            row.put("narration", "Original locked narration "+i);
            result.add(row);
        }
        return result;
    }

    static List<LockedScriptImportController.TimelineBlock> proposed() {
        List<LockedScriptImportController.TimelineBlock> items = new ArrayList<>();
        for (int i=0; i<WORDS.length; i++) {
            items.add(new LockedScriptImportController.TimelineBlock(
                    "SHOT05-"+i,"API Gateway","SHOT 05",
                    225+OFFSET[i],225+OFFSET[i+1],WORDS[i],"Natural"));
        }
        return items;
    }

    @Test
    void importsApprovedSevenClipsEvenWhenUnrelatedSuppliedShotsDiffer() {
        List<LockedScriptImportController.TimelineBlock> fullFile = new ArrayList<>();
        fullFile.add(new LockedScriptImportController.TimelineBlock(
                "OUTDATED-SHOT01","Legacy","SHOT 01",0,9,
                "This is NOT the live SHOT 01 narration","Natural"));
        fullFile.addAll(proposed());
        assertEquals(7, DirectorScriptAmendmentController.scopedApprovedShot05(canonical(),fullFile).size());
    }

    @Test
    void refusesUnapprovedVoiceText() {
        var invalid = new ArrayList<>(proposed());
        var clip = invalid.get(0);
        invalid.set(0,new LockedScriptImportController.TimelineBlock(
                clip.sectionId(),clip.sectionTitle(),clip.shotKey(),
                clip.startSecond(),clip.endSecond(),"Changed after approval",clip.voiceDirection()));
        assertThrows(ResponseStatusException.class, () ->
                DirectorScriptAmendmentController.scopedApprovedShot05(canonical(),invalid));
    }

    @Test
    void rebasesHearSeeByActualLiveStartAndKeepsSevenExactNarrations() {
        List<Map<String, Object>> live = new ArrayList<>();
        List<ProductionContractController.TimelineSegment> supplied = new ArrayList<>();
        for (int i=0;i<WORDS.length;i++) {
            Map<String,Object> row=new LinkedHashMap<>();
            row.put("shotKey","SHOT 05");row.put("startSecond",264+OFFSET[i]);
            row.put("endSecond",264+OFFSET[i+1]);row.put("narration",WORDS[i]);
            live.add(row);
            supplied.add(new ProductionContractController.TimelineSegment(
                    "SEG-"+i,"SHOT 05",String.format("SHOT 05-C%02d",i+1),
                    225+OFFSET[i],225+OFFSET[i+1],WORDS[i],"Natural",
                    new ProductionContractController.VisualContract(
                            "Narrated diagnostic",List.of(),"wide","",List.of(),List.of(),"")));
        }
        Map<String,Object> amendment = new LinkedHashMap<>();
        amendment.put("directorAmendment","SHOT 05");
        amendment.put("timeline",live);
        var result=ProductionContractController.rebaseDirectorShot05(supplied,amendment);
        assertEquals(264,result.get(0).startSecond());
        assertEquals(394,result.get(6).endSecond());
        assertEquals(WORDS[3],result.get(3).hear());
    }

    @Test
    void neverRebasesContractWithoutAnActiveDirectorAmendment() {
        List<ProductionContractController.TimelineSegment> input=List.of(
                new ProductionContractController.TimelineSegment(
                        "SEG-X","SHOT 05","SHOT 05-C01",225,242,WORDS[0],"Natural",
                        new ProductionContractController.VisualContract(
                                "Diagnostic",List.of(),"wide","",List.of(),List.of(),"")));
        assertSame(input,ProductionContractController.rebaseDirectorShot05(input,Map.of("timeline",List.of())));
    }
}
