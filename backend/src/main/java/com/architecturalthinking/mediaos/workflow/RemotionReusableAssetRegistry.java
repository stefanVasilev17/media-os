package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class RemotionReusableAssetRegistry {
    private static final String RESOURCE="episode-production/remotion-reusable-assets-v1.json";
    public record Asset(String assetId,String component,String sourcePath,String gitBlobSha,
                        String status,List<String> aliases) {}
    public record Catalog(String schemaVersion,String reviewedAt,String sourceGitCommit,
                          String sourceRegistryPath,String sourceRegistryGitBlobSha,
                          String importModule,String assetPolicy,String executorDependencyStatus,
                          List<Asset> assets) {}

    private final Catalog catalog;
    private final String catalogSha256;
    private final Map<String,Asset> byAlias;

    public RemotionReusableAssetRegistry(ObjectMapper mapper) {
        try(InputStream in=new ClassPathResource(RESOURCE).getInputStream()){
            String raw=new String(in.readAllBytes(),StandardCharsets.UTF_8);
            Catalog parsed=mapper.readValue(raw,Catalog.class);
            Map<String,Asset> aliases=new HashMap<>();
            validateHeader(parsed);
            Set<String> identifiers=new HashSet<>();
            for(Asset asset:parsed.assets()){
                validateAsset(asset);
                if(!identifiers.add(asset.assetId()))
                    throw new IllegalStateException("Duplicated Remotion asset ID: "+asset.assetId());
                for(String alias:asset.aliases()){
                    String normalized=normalize(alias);
                    if(!normalized.matches("[A-Z][A-Z0-9_]{0,79}"))
                        throw new IllegalStateException("Unsafe Remotion alias: "+alias);
                    Asset previous=aliases.putIfAbsent(normalized,asset);
                    if(previous!=null && !previous.assetId().equals(asset.assetId()))
                        throw new IllegalStateException("Asset alias overlaps: "+alias);
                }
            }
            this.catalog=parsed;
            this.catalogSha256=EpisodePackageValidator.sha256(raw);
            this.byAlias=Collections.unmodifiableMap(aliases);
        }catch(Exception ex){
            throw new IllegalStateException("Trusted Remotion reuse catalog unavailable or invalid.",ex);
        }
    }

    static String normalize(String declared){
        if(declared==null)return "";
        return declared.trim().replace('-','_').replace('.','_')
                .toUpperCase(Locale.ROOT);
    }

    private static void validateHeader(Catalog c){
        if(c==null || !"mediaos.remotion-reuse-registry.v1".equals(c.schemaVersion())
                || c.assets()==null || c.assets().size()<10 || c.assets().size()>100
                || c.sourceGitCommit()==null || !c.sourceGitCommit().matches("[a-f0-9]{40}")
                || c.sourceRegistryGitBlobSha()==null
                || !c.sourceRegistryGitBlobSha().matches("[a-f0-9]{40}")
                || !"../../components/architectural-thinking".equals(c.importModule())
                || !"REFERENCE_ONLY_NEVER_MODIFY_EXISTING_SOURCE".equals(c.assetPolicy())
                || !"PINNED_SOURCE_REVALIDATION_REQUIRED_BEFORE_PAID_EXECUTION"
                    .equals(c.executorDependencyStatus()))
            throw new IllegalStateException("Untrusted reuse catalog header.");
    }

    private static void validateAsset(Asset asset){
        if(asset==null || asset.assetId()==null
                || !asset.assetId().matches("AT[A-Za-z0-9]{2,60}")
                || !asset.assetId().equals(asset.component())
                || asset.sourcePath()==null
                || !Set.of(
                    "remotion-engine/src/components/architectural-thinking/ATVisualPrimitives.tsx",
                    "remotion-engine/src/components/architectural-thinking/ATArchitecturePrimitives.tsx")
                    .contains(asset.sourcePath())
                || asset.gitBlobSha()==null || !asset.gitBlobSha().matches("[a-f0-9]{40}")
                || !Set.of("DIRECTOR_LOCKED_REUSE_ONLY",
                           "EXISTING_REQUIRES_DIRECTOR_REVIEW").contains(asset.status())
                || asset.aliases()==null || asset.aliases().isEmpty()
                || asset.aliases().size()>20)
            throw new IllegalStateException("Invalid verified reusable Remotion asset.");
    }

    public Catalog catalog(){return catalog;}
    public String fingerprint(){return catalogSha256;}
    public Asset resolve(String alias){
        String key=normalize(alias);
        if(key.length()>80 || !key.matches("[A-Z][A-Z0-9_]*"))return null;
        return byAlias.get(key);
    }
}
