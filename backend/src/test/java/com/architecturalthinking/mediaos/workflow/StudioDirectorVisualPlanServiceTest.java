package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class StudioDirectorVisualPlanServiceTest {
    private final ObjectMapper json=new ObjectMapper();

    @Test
    void statusIsTiedToActuallySpokenCharactersNotAnArbitraryPercentage() throws Exception{
        String spoken="The gateway answers 404 and the request stops.";
        List<String> characters=spoken.chars().mapToObj(x->String.valueOf((char)x)).toList();
        List<Double> starts=new ArrayList<>(),ends=new ArrayList<>();
        for(int i=0;i<characters.size();i++){starts.add(i*.052);ends.add((i+1)*.052);}
        var payload=Map.of("normalized_alignment",Map.of(
            "characters",characters,
            "character_start_times_seconds",starts,
            "character_end_times_seconds",ends
        ));
        var root=json.valueToTree(payload);
        int position=spoken.indexOf("404");
        assertEquals(Math.round((float)(position*.052*30)),
            StudioDirectorVisualPlanService.termFrame(root,"404"));
        assertEquals(Math.round((float)(spoken.indexOf("gateway")*.052*30)),
            StudioDirectorVisualPlanService.termFrame(root,"GATEWAY"));
        assertEquals(-1,StudioDirectorVisualPlanService.termFrame(root,"429"));
        assertEquals(spoken.length()*.052,StudioDirectorVisualPlanService.audioEnd(root),.000001);
    }

    @Test
    void noWordAlignmentMeansNoInventedTrigger() throws Exception{
        var root=json.readTree("{\"alignment\":null,\"normalized_alignment\":null}");
        assertEquals(-1,StudioDirectorVisualPlanService.termFrame(root,"404"));
        assertEquals(0,StudioDirectorVisualPlanService.audioEnd(root));
    }

    @Test
    void storyboardValidatorRejectsMissingCasesWrongClipOrderingAndOutOfBoundsFrames(){
        int[] lengths={17,21,20,23,20,18,11};
        String[] kind={"GATEWAY_ARRIVAL","ROUTE_404","METHOD_405",
          "RATE_LIMIT_429","WAF_403","SCHEMA_400","LOAD_BALANCER_HANDOFF"};
        List<Map<String,Object>> sections=new ArrayList<>();
        List<Map<String,Object>> events=new ArrayList<>();
        int cursor=0;
        for(int i=0;i<7;i++){
            int start=cursor,end=cursor+lengths[i]*30;
            String key=String.format("SHOT 05-C%02d",i+1);
            sections.add(new LinkedHashMap<>(Map.of("clipKey",key,"startFrame",start,"endFrame",end)));
            events.add(new LinkedHashMap<>(Map.of("clipKey",key,"kind",kind[i],"frame",start+10)));
            cursor=end;
        }
        var plan=new LinkedHashMap<String,Object>();
        plan.put("recipeId","EP001_GATEWAY_DIAGNOSTICS_V1");
        plan.put("durationInFrames",3900);
        plan.put("sections",sections);
        plan.put("events",events);
        assertDoesNotThrow(()->StudioDirectorVisualPlanService.validatePlan(plan));
        var status=events.get(1);
        status.put("frame",sections.get(1).get("endFrame"));
        var err=assertThrows(ResponseStatusException.class,
            ()->StudioDirectorVisualPlanService.validatePlan(plan));
        assertEquals(HttpStatus.CONFLICT,err.getStatusCode());
        status.put("frame",sections.get(1).get("startFrame"));
        status.put("kind","RANDOM_UNKNOWN_EVENT");
        assertThrows(ResponseStatusException.class,
            ()->StudioDirectorVisualPlanService.validatePlan(plan));
    }

    @Test
    void expandedAudioSectionsAreAllowedButCannotExceedThreeMinutes(){
        int[] lengths={19,21,20,23,20,18,11};
        String[] kind={"GATEWAY_ARRIVAL","ROUTE_404","METHOD_405",
          "RATE_LIMIT_429","WAF_403","SCHEMA_400","LOAD_BALANCER_HANDOFF"};
        var sections=new ArrayList<Map<String,Object>>();
        var events=new ArrayList<Map<String,Object>>();
        int cursor=0;
        for(int i=0;i<7;i++){
            String key=String.format("SHOT 05-C%02d",i+1);
            sections.add(Map.of("clipKey",key,"startFrame",cursor,
                "endFrame",cursor+lengths[i]*30));
            events.add(Map.of("clipKey",key,"kind",kind[i],"frame",cursor+12));
            cursor+=lengths[i]*30;
        }
        var plan=new LinkedHashMap<String,Object>();
        plan.put("recipeId","EP001_GATEWAY_DIAGNOSTICS_V1");
        plan.put("durationInFrames",cursor);
        plan.put("sections",sections);plan.put("events",events);
        assertDoesNotThrow(()->StudioDirectorVisualPlanService.validatePlan(plan));
        plan.put("durationInFrames",5401);
        assertThrows(ResponseStatusException.class,
            ()->StudioDirectorVisualPlanService.validatePlan(plan));
    }
}
