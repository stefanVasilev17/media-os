package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/{shotKey}/remotion-scene-contract")
public class Ep002RemotionSceneContractController {
    private final Ep002RemotionSceneContractService scenes;

    public Ep002RemotionSceneContractController(Ep002RemotionSceneContractService scenes) {
        this.scenes=scenes;
    }

    @GetMapping
    public Ep002RemotionSceneContractService.SceneContract scene(@PathVariable String shotKey) {
        return scenes.contract(shotKey);
    }
}
