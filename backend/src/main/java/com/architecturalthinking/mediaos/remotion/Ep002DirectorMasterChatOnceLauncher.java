package com.architecturalthinking.mediaos.remotion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class Ep002DirectorMasterChatOnceLauncher implements ApplicationRunner {
    private static final Logger log =
            LoggerFactory.getLogger(Ep002DirectorMasterChatOnceLauncher.class);

    private final Ep002DirectorMasterController master;
    private final boolean explicitChatAuthorization;
    private final boolean exactHttp403RepairAuthorized;

    public Ep002DirectorMasterChatOnceLauncher(
            Ep002DirectorMasterController master,
            @Value("${MEDIAOS_EP002_MASTER_CHAT_RENDER_ONCE:false}")
                boolean explicitChatAuthorization,
            @Value("${MEDIAOS_EP002_MASTER_CHAT_ROUTE_REPAIR_ONCE:false}")
                boolean exactHttp403RepairAuthorized) {
        this.master=master;
        this.explicitChatAuthorization=explicitChatAuthorization;
        this.exactHttp403RepairAuthorized=exactHttp403RepairAuthorized;
    }

    @Override
    public void run(ApplicationArguments args) {
        if(explicitChatAuthorization) {
        try {
            Map<String,Object> result=master.queueVerifiedChatMasterOnce(
                    Ep002DirectorMasterController.CHAT_AUTHORIZATION);
            log.info("EP002_MASTER_CHAT_ONE_TIME_RESULT status={} renderId={} reason={}",
                    result.get("status"),result.get("renderId"),result.get("reason"));
        } catch(Exception failure) {
            log.error("EP002_MASTER_CHAT_ONE_TIME_NOT_QUEUED: {}",
                    failure.toString());
        }
        }
        if(exactHttp403RepairAuthorized) {
            try {
                Map<String,Object> repaired=master.queueScopedRouteRepairOnce(
                        Ep002DirectorMasterController.SCOPED_ROUTE_REPAIR_AUTHORIZATION);
                log.info("EP002_MASTER_CHAT_HTTP403_REPAIR_RESULT status={} renderId={} reason={}",
                        repaired.get("status"),repaired.get("renderId"),repaired.get("reason"));
            } catch(Exception issue) {
                log.error("EP002_MASTER_CHAT_HTTP403_REPAIR_NOT_QUEUED: {}",issue.toString());
            }
        }
    }
}
