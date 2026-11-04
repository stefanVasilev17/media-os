package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RemotionGitDependencyPinServiceTest {
    private static final String HEAD="a".repeat(40);
    private static final String BASE="b".repeat(40);
    private static final String CATALOG="c".repeat(64);
    private static final String REGISTRY="remotion-engine/src/components/architectural-thinking/registry.ts";
    private static final String COMPONENTS="remotion-engine/src/components/architectural-thinking/ATVisualPrimitives.tsx";

    private static RemotionGitDependencyPinService.GitHubEvidenceSource source(
            String blob,String commit) {
        return new RemotionGitDependencyPinService.GitHubEvidenceSource() {
            @Override
            public String branchHead(String repo,String branch) {
                assertEquals(RemotionGitDependencyPinService.REPOSITORY,repo);
                assertEquals("main",branch);
                return commit;
            }
            @Override
            public String fileBlob(String repo,String path,String sha) {
                assertEquals(HEAD,sha);
                return blob;
            }
        };
    }

    @Test
    void matchingHistoricalDirectorLockedAssetsAreVerifiedAndPinnedToExactGitCommit() {
        Map<String,String> expected=new LinkedHashMap<>();
        expected.put(COMPONENTS,BASE);
        expected.put(REGISTRY,BASE);
        var pin=RemotionGitDependencyPinService.verifyExactSources(
                source(BASE,HEAD),CATALOG,expected);
        assertEquals("GIT_DEPENDENCIES_PINNED_AND_VERIFIED",pin.status());
        assertEquals(HEAD,pin.pinnedCommit());
        assertEquals(2,pin.verifiedPaths());
        assertTrue(pin.blockers().isEmpty());
        assertEquals(64,pin.productionDependencySha256().length());
        assertFalse(pin.canDispatchProvider());
        assertTrue(pin.files().stream().allMatch(
                file->"MATCH_DIRECTOR_REVIEWED_BASELINE".equals(file.status())));
    }

    @Test
    void protectedSourceBlobChangesBlockAllAgentDispatch() {
        var pin=RemotionGitDependencyPinService.verifyExactSources(
                source("d".repeat(40),HEAD),CATALOG,Map.of(REGISTRY,BASE));
        assertEquals("GIT_DEPENDENCIES_BLOCKED",pin.status());
        assertNull(pin.productionDependencySha256());
        assertTrue(pin.blockers().contains("GIT_DEPENDENCY_INVALID_OR_DRIFTED"));
        assertEquals("CHANGED_FROM_DIRECTOR_REVIEWED_BASELINE",pin.files().get(0).status());
    }

    @Test
    void unavailableGitHubOrInvalidCommitBlocksInsteadOfTrustingHistoricalCatalog() {
        RemotionGitDependencyPinService.GitHubEvidenceSource noConnection=
                new RemotionGitDependencyPinService.GitHubEvidenceSource() {
                    @Override
                    public String branchHead(String repo,String branch) throws IOException {
                        throw new IOException("Private repository needs a read-only GitHub credential.");
                    }
                    @Override
                    public String fileBlob(String repo,String path,String commit) {
                        fail("No source read is allowed without verified commit.");return null;
                    }
                };
        var pin=RemotionGitDependencyPinService.verifyExactSources(
                noConnection,CATALOG,Map.of(REGISTRY,BASE));
        assertEquals("GIT_DEPENDENCIES_BLOCKED",pin.status());
        assertTrue(pin.blockers().contains("GITHUB_HEAD_UNAVAILABLE"));
        assertNull(pin.pinnedCommit());
        assertNull(pin.productionDependencySha256());

        var invalid=RemotionGitDependencyPinService.verifyExactSources(
                source(BASE,"invalid"),CATALOG,Map.of(REGISTRY,BASE));
        assertEquals("GIT_DEPENDENCIES_BLOCKED",invalid.status());
    }


    @Test
    void optionalSharedFilesUseExactCurrentGitBlobWhileMissingFilesBlock() {
        Map<String,String> optional=new LinkedHashMap<>();
        optional.put(REGISTRY,BASE);
        optional.put("remotion-engine/package.json",null);
        var pinned=RemotionGitDependencyPinService.verifyExactSources(
                source(BASE,HEAD),CATALOG,optional);
        assertEquals("GIT_DEPENDENCIES_PINNED_AND_VERIFIED",pinned.status());
        assertEquals("PINNED_CURRENT_GIT_DEPENDENCY",
                pinned.files().stream().filter(x->x.path().endsWith("package.json"))
                        .findFirst().orElseThrow().status());

        RemotionGitDependencyPinService.GitHubEvidenceSource missing=
                new RemotionGitDependencyPinService.GitHubEvidenceSource() {
                    @Override
                    public String branchHead(String repo,String branch) {return HEAD;}
                    @Override
                    public String fileBlob(String repo,String path,String commit) {
                        return path.equals(REGISTRY)?null:BASE;
                    }
                };
        var blocked=RemotionGitDependencyPinService.verifyExactSources(
                missing,CATALOG,optional);
        assertEquals("GIT_DEPENDENCIES_BLOCKED",blocked.status());
        assertNull(blocked.productionDependencySha256());
    }

    @Test
    void fixedGitDependencyDigestDoesNotDependOnMapInsertionOrder() {
        var one=RemotionGitDependencyPinService.verifyExactSources(source(BASE,HEAD),
                CATALOG,Map.of(REGISTRY,BASE,COMPONENTS,BASE));
        Map<String,String> reversed=new LinkedHashMap<>();
        reversed.put(COMPONENTS,BASE);
        reversed.put(REGISTRY,BASE);
        var two=RemotionGitDependencyPinService.verifyExactSources(source(BASE,HEAD),
                CATALOG,reversed);
        assertEquals(one.productionDependencySha256(),two.productionDependencySha256());
    }

    @Test
    void unsafeOrTraversalGitReadPathsNeverProduceVerifiedManifest() {
        for(String path:List.of("../AGENTS.md","remotion-engine/../AGENTS.md",
                "remotion-engine/src//components/AT.tsx","other-repo/src/scene.tsx",
                "remotion-engine/secrets.txt")) {
            assertFalse(RemotionGitDependencyPinService.safeReadPath(path),path);
        }
        var pin=RemotionGitDependencyPinService.verifyExactSources(
                source(BASE,HEAD),CATALOG,Map.of("remotion-engine/../AGENTS.md",BASE));
        assertTrue(pin.blockers().contains("UNSAFE_DEPENDENCY_PATH"));
        assertNull(pin.productionDependencySha256());
    }

    @Test
    void zeroPaidCallsAreRequiredForGitVerification() {
        var pin=RemotionGitDependencyPinService.verifyExactSources(
                source(BASE,HEAD),CATALOG,Map.of(REGISTRY,BASE));
        assertFalse(pin.canDispatchProvider());
    }
}
