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

    public Ep002DirectorMasterChatOnceLauncher(
            Ep002DirectorMasterController master,
            @Value("${MEDIAOS_EP002_MASTER_CHAT_RENDER_ONCE:false}")
                boolean explicitChatAuthorization) {
        this.master=master;
        this.explicitChatAuthorization=explicitChatAuthorization;
    }

    @Override
    public void run(ApplicationArguments args) {
        if(!explicitChatAuthorization)return;
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
}
