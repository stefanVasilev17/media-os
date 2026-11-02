package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/{shotKey}/production-contract")
public class Ep002ProductionContractController {
    private final Ep002ProductionContractService contracts;

    public Ep002ProductionContractController(Ep002ProductionContractService contracts) {
        this.contracts=contracts;
    }

    @GetMapping
    public Map<String,Object> contract(@PathVariable String shotKey) {
        return contracts.contract(shotKey);
    }
}
