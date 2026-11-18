/* EP004 episode-local machine contract. Source and visual direction are Director-LOCKED.
   No render, TTS, production admission or storyboard coordinates are authorized here.
   Gate functions below verify metadata only; live backend enforcement is separate. */
export const ep004ProductionContract = {
  "episodeId": "EP004",
  "title": "Why Microsoft 365 Went Down — And Why Failover Made It Worse",
  "scriptStatus": "DIRECTOR_LOCKED",
  "visualStoryStatus": "EPISODE_LEVEL_DIRECTOR_LOCKED",
  "approvalDate": "2026-11-18",
  "resolution": {
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "scriptSource": "docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md",
  "originalScriptSha256": "14c61a7d26f2be23ca30fef2280a4b13ad7ab110fadf32018b2ece6d59cb40a6",
  "visualSource": "docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md",
  "originalVisualSha256": "4f5f6a3c4b03e45f169222bf26fbc00b76dbdb88f6931fc0048153f4b19e3620",
  "authoritativeCueTiming": "REQUIRES_REAL_DIRECTOR_APPROVED_VOICE_TAKE_ALIGNMENT",
  "mediaMode": "OBJECT_STORAGE_ONLY",
  "directorPaidAuthorization": "REQUIRED_FOR_EACH_PAID_OPERATION",
  "allowedProductionServices": [
    "media-os-backend",
    "media-os-render-worker",
    "Postgres"
  ],
  "renderConcurrency": 1,
  "visualPolicy": {
    "world": "ONE_LIVING_MAP",
    "containerNesting": "FORBIDDEN",
    "genericInfoCards": "FORBIDDEN",
    "glossary": "SPOKEN_AND_EXPLAINED_TERMS_ONLY",
    "minSecondaryFontPx": 18,
    "minPrimaryFontPx": 20,
    "minTwoLineGlossaryDwellSeconds": 5.5,
    "packetMovement": "VISIBLE_PATH_GEOMETRY_SINGLE_SOURCE",
    "firstSeamFrame": "PREVIOUS_APPROVED_DECODED_LAST_FRAME",
    "afterSeam": "REAL_MOTION_FROM_FRAME_1",
    "breathing": "DIRECTOR_REVIEWED_VOICE_FREE_MOVING",
    "incidentTruth": "PRELIMINARY_MICROSOFT_PIR_NOT_ACTUAL_INTERNAL_TOPOLOGY"
  },
  "nodes": [
    {
      "id": "human-outlook",
      "kind": "client"
    },
    {
      "id": "client-teams",
      "kind": "client"
    },
    {
      "id": "traffic-router",
      "kind": "router"
    },
    {
      "id": "primary-gateway",
      "kind": "gateway"
    },
    {
      "id": "alternative-gateway",
      "kind": "gateway"
    },
    {
      "id": "exchange-online",
      "kind": "service"
    },
    {
      "id": "teams-destination",
      "kind": "service"
    },
    {
      "id": "gateway-fleet",
      "kind": "conceptual-focus"
    },
    {
      "id": "connection-handling",
      "kind": "conceptual-focus"
    },
    {
      "id": "shared-resource",
      "kind": "conceptual-focus"
    },
    {
      "id": "regional-partitions",
      "kind": "conceptual-focus"
    },
    {
      "id": "returning-workload",
      "kind": "conceptual-focus"
    }
  ],
  "routes": [
    {
      "id": "outlook-to-router",
      "from": "human-outlook",
      "to": "traffic-router",
      "usage": "OUTLOOK"
    },
    {
      "id": "teams-to-router",
      "from": "client-teams",
      "to": "traffic-router",
      "usage": "TEAMS"
    },
    {
      "id": "router-to-primary",
      "from": "traffic-router",
      "to": "primary-gateway",
      "usage": "SHARED_AFTER_FAILOVER"
    },
    {
      "id": "router-to-alternative",
      "from": "traffic-router",
      "to": "alternative-gateway",
      "usage": "TEAMS_BEFORE_FAILOVER"
    },
    {
      "id": "primary-to-exchange",
      "from": "primary-gateway",
      "to": "exchange-online",
      "usage": "OUTLOOK"
    },
    {
      "id": "alternative-to-teams",
      "from": "alternative-gateway",
      "to": "teams-destination",
      "usage": "TEAMS"
    },
    {
      "id": "primary-to-teams",
      "from": "primary-gateway",
      "to": "teams-destination",
      "usage": "TEAMS_AFTER_FAILOVER"
    }
  ],
  "shots": [
    {
      "id": "SHOT01",
      "title": "An Ordinary Workday Stops",
      "cameraFocus": "CLIENT_TO_ROUTER",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT01_P01",
          "semanticAnchor": "OUTLOOK_MAILBOX_BLOCKED",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT01_P02",
          "semanticAnchor": "RECOVERY_RELAPSE_FORESHADOW",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT01_P03",
          "semanticAnchor": "FAILOVER_PARADOX_QUESTION",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT02",
      "title": "The Promise of Failover",
      "cameraFocus": "ROUTING_JUNCTION",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT02_P01",
          "semanticAnchor": "NORMAL_ROUTING",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT02_P02",
          "semanticAnchor": "REDUNDANT_PATH_SUCCESS",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT02_P03",
          "semanticAnchor": "HEADROOM_ASSUMPTION",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        },
        {
          "id": "SHOT02_P04",
          "semanticAnchor": "INCIDENT_BRIDGE",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT03",
      "title": "Two Gateway Systems, One Shared Pressure",
      "cameraFocus": "TWO_GATEWAYS",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT03_P01",
          "semanticAnchor": "TWO_GATEWAY_SYSTEMS",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT03_P02",
          "semanticAnchor": "TEAMS_ROUTE_FAILOVER",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT03_P03",
          "semanticAnchor": "TRAFFIC_MIX_CHANGED",
          "evidenceClass": "PIR_FACT"
        }
      ]
    },
    {
      "id": "SHOT04",
      "title": "The Bug That Waited Since July",
      "cameraFocus": "CONNECTION_HANDLING",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT04_P01",
          "semanticAnchor": "GATEWAY_CODE_CHANGE_JULY",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT04_P02",
          "semanticAnchor": "LOCK_CONTENTION_INTERNAL",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT04_P03",
          "semanticAnchor": "LAB_VS_PRODUCTION_HARDWARE",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT04_P04",
          "semanticAnchor": "MULTICORE_TEST_PARADOX",
          "evidenceClass": "PIR_FACT"
        }
      ]
    },
    {
      "id": "SHOT05",
      "title": "Fourteen Percent of Capacity Was Already Missing",
      "cameraFocus": "CAPACITY_FLEET",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT05_P01",
          "semanticAnchor": "CAPACITY_14_UNAVAILABLE",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT05_P02",
          "semanticAnchor": "CAPACITY_HEADROOM",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT05_P03",
          "semanticAnchor": "TEAMS_LOAD_MIX",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT05_P04",
          "semanticAnchor": "COMBINED_PRECONDITIONS",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT06",
      "title": "When the Route Changes, So Does the Risk",
      "cameraFocus": "CONNECTION_HANDLING",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT06_P01",
          "semanticAnchor": "SLOW_RISE_IN_PRESSURE",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT06_P02",
          "semanticAnchor": "CONTENTED_GATEWAY_STOPS",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT06_P03",
          "semanticAnchor": "PER_ENDPOINT_LOAD",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT06_P04",
          "semanticAnchor": "ROUTING_TRIGGERS_BUG",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT07",
      "title": "The Cascade",
      "cameraFocus": "GATEWAY_FLEET",
      "reel": 1,
      "paragraphs": [
        {
          "id": "SHOT07_P01",
          "semanticAnchor": "REDIRECT_SURVIVORS",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT07_P02",
          "semanticAnchor": "CASCADE_80_PERCENT",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT07_P03",
          "semanticAnchor": "REEL_BACKUP_IS_NOT_RESCUE",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT08",
      "title": "Why the Regions Did Not Contain It",
      "cameraFocus": "REGIONAL_PARTITIONS",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT08_P01",
          "semanticAnchor": "REGIONAL_BULKHEAD_EXAMPLE",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT08_P02",
          "semanticAnchor": "REGION_CONTAINMENT_ISSUE",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT08_P03",
          "semanticAnchor": "SERVICE_DIFFERENCES",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT08_P04",
          "semanticAnchor": "EXCHANGE_DEPENDENCY",
          "evidenceClass": "PIR_FACT"
        }
      ]
    },
    {
      "id": "SHOT09",
      "title": "Why Healthy Is Not the Same as Safe",
      "cameraFocus": "HEALTH_AND_READINESS",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT09_P01",
          "semanticAnchor": "RESTART_AND_SIMPLE_PROBE",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT09_P02",
          "semanticAnchor": "ALIVE_VS_READY",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        },
        {
          "id": "SHOT09_P03",
          "semanticAnchor": "GREEN_WITH_HIDDEN_WEAKNESS",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT09_P04",
          "semanticAnchor": "PROVE_SERVICE_UNDER_REAL_LOAD",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        },
        {
          "id": "SHOT09_P05",
          "semanticAnchor": "HEALTH_IS_NOT_HEADROOM",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        }
      ]
    },
    {
      "id": "SHOT10",
      "title": "Restarting the Servers Made Recovery Harder",
      "cameraFocus": "RECOVERY_GATEWAY",
      "reel": 2,
      "paragraphs": [
        {
          "id": "SHOT10_P01",
          "semanticAnchor": "RETURNING_WORK_OVERLOAD",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT10_P02",
          "semanticAnchor": "REEL_RESTART_IS_NOT_RECOVERY",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        }
      ]
    },
    {
      "id": "SHOT11",
      "title": "The Incident Clock",
      "cameraFocus": "TIMELINE_OVER_MAP",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT11_P01",
          "semanticAnchor": "VERIFIED_UTC_MARKERS",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT11_P02",
          "semanticAnchor": "INVESTIGATION_AND_RELAPSE",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT11_P03",
          "semanticAnchor": "RECOVERY_FEEDBACK_LOOP",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT12",
      "title": "How Recovery Became Possible",
      "cameraFocus": "RECOVERY_GATEWAY",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT12_P01",
          "semanticAnchor": "KNOWN_GOOD_CODE_PATH",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT12_P02",
          "semanticAnchor": "FIX_AND_TRAFFIC_CONTROL",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT12_P03",
          "semanticAnchor": "RESTORATION_END_IMPACT",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT12_P04",
          "semanticAnchor": "MAILBOX_SUCCESS",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        }
      ]
    },
    {
      "id": "SHOT13",
      "title": "What Engineers Should Design For",
      "cameraFocus": "GENERAL_LESSONS",
      "reel": 3,
      "paragraphs": [
        {
          "id": "SHOT13_P01",
          "semanticAnchor": "FAILOVER_STILL_NEEDED",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        },
        {
          "id": "SHOT13_P02",
          "semanticAnchor": "REEL_HIGH_AVAILABILITY_REAL_RESILIENCE",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        }
      ]
    },
    {
      "id": "SHOT14",
      "title": "The Architecture Paradox",
      "cameraFocus": "FULL_MAP",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT14_P01",
          "semanticAnchor": "FACTUAL_CAUSAL_REPLAY",
          "evidenceClass": "PIR_FACT"
        },
        {
          "id": "SHOT14_P02",
          "semanticAnchor": "CASCADE_AND_RESTART_REPLAY",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT14_P03",
          "semanticAnchor": "LOCAL_CORRECT_GLOBAL_FAILURE",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        }
      ]
    },
    {
      "id": "SHOT15",
      "title": "The Human Consequence and the Next Question",
      "cameraFocus": "CLIENT_RETURN",
      "reel": null,
      "paragraphs": [
        {
          "id": "SHOT15_P01",
          "semanticAnchor": "INBOX_WORKS_AGAIN",
          "evidenceClass": "SCHEMATIC_EXPLANATION"
        },
        {
          "id": "SHOT15_P02",
          "semanticAnchor": "SYSTEM_QUESTION",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        },
        {
          "id": "SHOT15_P03",
          "semanticAnchor": "UNCERTAINTY_ENDING",
          "evidenceClass": "GENERAL_DESIGN_PRINCIPLE"
        }
      ]
    }
  ],
  "sourceOfTruth": "docs/engineering/EP004_PRODUCTION_FOUNDATION_V1_20261118.md"
} as const;

export type Ep004EvidenceClass = "PIR_FACT" | "SCHEMATIC_EXPLANATION" | "GENERAL_DESIGN_PRINCIPLE";
export type Ep004ShotId = typeof ep004ProductionContract.shots[number]["id"];
export type Ep004RouteId = typeof ep004ProductionContract.routes[number]["id"];

export function validateEp004ProductionContract(): string[] {
  const errors: string[] = [];
  const contract = ep004ProductionContract;
  if (contract.shots.length !== 15) errors.push("SHOT_COUNT");
  if (contract.shots.reduce((count, shot) => count + shot.paragraphs.length, 0) !== 51) errors.push("PARAGRAPH_COUNT");
  const reelShots = contract.shots.filter(shot => shot.reel !== null);
  if (reelShots.length !== 3 || reelShots[0]?.id !== "SHOT07" || reelShots[1]?.id !== "SHOT10" || reelShots[2]?.id !== "SHOT13") errors.push("REEL_LOCATIONS");
  const seen = new Set<string>();
  const nodeIds = new Set<string>(contract.nodes.map(node => node.id));
  for (const [index, shot] of contract.shots.entries()) {
    const expectedId = "SHOT" + String(index + 1).padStart(2, "0");
    if (shot.id !== expectedId) errors.push("SHOT_ORDER:" + shot.id);
    if (seen.has(shot.id)) errors.push("DUPLICATE_ID:" + shot.id);
    seen.add(shot.id);
    for (const [paragraphIndex, paragraph] of shot.paragraphs.entries()) {
      if (paragraph.id !== shot.id + "_P" + String(paragraphIndex + 1).padStart(2, "0")) errors.push("PARAGRAPH_ORDER:" + paragraph.id);
      if (seen.has(paragraph.id)) errors.push("DUPLICATE_ID:" + paragraph.id);
      seen.add(paragraph.id);
      if (!["PIR_FACT", "SCHEMATIC_EXPLANATION", "GENERAL_DESIGN_PRINCIPLE"].includes(paragraph.evidenceClass)) errors.push("UNKNOWN_EVIDENCE:" + paragraph.id);
    }
  }
  for (const route of contract.routes) {
    if (!nodeIds.has(route.from) || !nodeIds.has(route.to)) errors.push("ORPHAN_ROUTE:" + route.id);
    if (seen.has(route.id)) errors.push("DUPLICATE_ID:" + route.id);
    seen.add(route.id);
  }
  if (contract.mediaMode !== "OBJECT_STORAGE_ONLY") errors.push("UNSAFE_MEDIA_STORAGE");
  if (contract.allowedProductionServices.join("|") !== "media-os-backend|media-os-render-worker|Postgres") errors.push("UNAUTHORIZED_RAILWAY_SERVICES");
  if (contract.renderConcurrency !== 1) errors.push("UNBOUNDED_RENDER_CONCURRENCY");
  if (contract.visualPolicy.containerNesting !== "FORBIDDEN") errors.push("NESTED_CONTAINERS");
  if (contract.visualPolicy.packetMovement !== "VISIBLE_PATH_GEOMETRY_SINGLE_SOURCE") errors.push("PACKET_NOT_ON_PATH");
  return errors;
}

export type Ep004PreflightEvidence = {
  railwayServiceNames: readonly string[];
  objectWriterVerified: boolean;
  authenticatedRangeReaderVerified: boolean;
  retentionAndCleanupVerified: boolean;
  sha256VerificationVerified: boolean;
  postgresBinaryWriteBlocked: boolean;
  diskMeasurementFresh: boolean;
  postgresVolumeUsedRatio: number;
  activeCostlyRenders: number;
  currentVoiceTakeApproved: boolean;
  genuineAlignmentPresent: boolean;
  explicitlyAuthorizedForThisOperation: boolean;
};

/** Metadata-only fail-closed evidence check. NOT wired into MediaOS backend or Railway. */
export function ep004PreflightBlockers(e: Ep004PreflightEvidence): string[] {
  const blockers = validateEp004ProductionContract();
  const expected = [...ep004ProductionContract.allowedProductionServices].sort().join("|");
  if ([...e.railwayServiceNames].sort().join("|") !== expected) blockers.push("RAILWAY_BASELINE_MISMATCH");
  if (!e.objectWriterVerified || !e.authenticatedRangeReaderVerified || !e.retentionAndCleanupVerified || !e.sha256VerificationVerified || !e.postgresBinaryWriteBlocked) blockers.push("MEDIA_STORAGE_P0_NOT_VERIFIED");
  if (!e.diskMeasurementFresh || !Number.isFinite(e.postgresVolumeUsedRatio) || e.postgresVolumeUsedRatio < 0 || e.postgresVolumeUsedRatio > 1) blockers.push("DISK_MEASUREMENT_MISSING");
  else if (e.postgresVolumeUsedRatio >= 0.75) blockers.push("DISK_PROTECT_75");
  else if (e.postgresVolumeUsedRatio >= 0.65) blockers.push("MEDIA_BLOCK_65");
  if (e.activeCostlyRenders !== 0) blockers.push("SHARED_WORKER_BUSY");
  if (!e.currentVoiceTakeApproved || !e.genuineAlignmentPresent) blockers.push("VOICE_OR_ALIGNMENT_NOT_READY");
  if (!e.explicitlyAuthorizedForThisOperation) blockers.push("DIRECTOR_AUTHORIZATION_MISSING");
  return blockers;
}
