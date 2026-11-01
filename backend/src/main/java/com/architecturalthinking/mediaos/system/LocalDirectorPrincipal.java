package com.architecturalthinking.mediaos.system;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

public record LocalDirectorPrincipal(UUID id, String username)
        implements Serializable, java.security.Principal {
    @Override
    public String getName() {
        return id.toString();
    }

    @Serial
    private static final long serialVersionUID = 1L;
}
