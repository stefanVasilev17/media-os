insert into project_creative_policy(project_id, version, payload)
values (
  '11111111-1111-1111-1111-111111111111',
  'bible-v2.1-mediaos-2026-09-30',
  $$
  {
    "source": {
      "name": "Architectural Thinking — Core Production Bible v2.1",
      "role": "Canonical channel-level creative and production policy for MediaOS agents",
      "principle": "ONE WORLD. ONE LIVING MAP. MANY ENGINEERING STORIES.",
      "reusePrinciple": "Repeat the world, not the lesson.",
      "scopeRule": "Episode-specific truth, object state, approved assets, and current episode decisions belong to the episode source snapshot; this policy defines the reusable channel rules."
    },
    "channelIdentity": {
      "positioning": "Premium engineering channel about how real software systems carry human actions through clients, boundaries, networks, services, data, state, failures, retries, trade-offs, and recovery.",
      "corePhilosophy": "Architecture is not about technology names. Architecture is about responsibility, boundaries, trust, state, scale, reliability, uncertainty, and the consequences of engineering decisions.",
      "targetAudience": [
        "Senior Engineers",
        "Software Architects",
        "Tech Leads",
        "Engineering Managers",
        "Experienced developers who want to understand systems beyond code"
      ],
      "accessibility": "Language should remain accessible to a solid mid-level engineer while reasoning remains senior.",
      "notThisChannel": [
        "Programming tutorial channel",
        "Framework or library tutorial channel",
        "General technology-news channel",
        "AI hype channel",
        "Productivity channel",
        "Beginner career-advice channel",
        "Slideshow of definitions",
        "Company architecture tour whose value is only naming technologies"
      ],
      "mustExplain": [
        "Why an architectural decision exists",
        "What problem it solves",
        "What assumptions it makes",
        "What it depends on",
        "What happens under scale",
        "What happens under failure",
        "What trade-off is accepted",
        "What the technical decision means for the human or business at the edge of the system"
      ]
    },
    "languageAndCommunication": {
      "creatorDiscussion": "Bulgarian",
      "audienceFacing": "English",
      "englishIncludes": ["Narration", "Video titles", "On-screen labels", "Component names", "State names", "Filenames", "Spline object names", "Viewer-facing prompts"],
      "narration": ["Clear", "Simple", "Professional", "Causal", "Human-focused", "Free from hype", "Free from unnecessary jargon"],
      "rule": "Simple English does not mean shallow reasoning.",
      "productionInstructions": "Be concrete about what an object represents, where it sits, what is visible, current state, incoming path, behavior, camera, and what changes next."
    },
    "viewerPromise": {
      "outcomes": [
        "Viewer can visualize the system in their head",
        "Viewer can explain the main causal journey in simple language",
        "Viewer can identify at least one non-obvious architectural trade-off",
        "Viewer understands at least one failure or dependency problem",
        "Viewer can connect technical behavior to a human or business consequence"
      ],
      "completionRule": "A video is complete when system behavior makes sense as a journey, not when every term has been mentioned."
    },
    "editorialThesis": {
      "episodeStartsFrom": ["A human action", "A production conflict"],
      "humanActionExamples": ["Clicking Login", "Paying", "Sending a message", "Uploading a file", "Starting a video", "Searching", "Receiving stale information", "Seeing an error", "Waiting on a spinner"],
      "productionConflictExamples": ["Healthy service that still cannot complete the user journey", "Retry that amplifies an incident", "Cache that improves latency but returns stale data", "Queue that protects services but hides growing work", "Correct operations that still create incorrect state", "Timeout that does not reveal whether the action succeeded"],
      "rule": "Do not begin with a box diagram only because the subject is architecture. The diagram becomes necessary after the viewer understands the question."
    },
    "topicQuality": {
      "preferProblemFirst": true,
      "strongTopicSignals": [
        "Visible human or business consequence",
        "Hidden architecture question",
        "Trade-off",
        "Visible movement through a system",
        "At least one counterintuitive moment",
        "Failure, uncertainty, or dependency",
        "Final lesson larger than the specific technology",
        "Evergreen search intent",
        "Mass-entry click clarity",
        "Senior engineering depth"
      ],
      "reject": ["Technology catalogues", "Definitions without a production conflict", "Weak sequels kept only because they fit a cluster"],
      "titleRule": "Frame the production problem or human question before the technology name whenever possible."
    },
    "contentPillars": [
      "Distributed Systems",
      "System Design",
      "Software Architecture",
      "Scalability",
      "Reliability",
      "Cloud Architecture",
      "Data Architecture",
      "Event-Driven Systems",
      "Identity and Trust",
      "Payments and Correctness",
      "Failure Engineering",
      "Observability",
      "Architecture Trade-offs",
      "Business-Critical Systems",
      "Real-world problem stories"
    ],
    "highValueUmbrella": "Architecture of Trust, Money, Failure, and Correctness",
    "runtimeAndRetention": {
      "workingScriptTargetSeconds": 1200,
      "workingScriptAllowedSeconds": [1140, 1260],
      "finalEditTargetMinutes": [16, 18],
      "overrideNote": "The current MediaOS workflow intentionally uses an approximately 20-minute working script and cuts to a strong 16–18 minute final episode; this supersedes the older Bible quick-reference default of 13–16 minutes.",
      "narrationPaceWpm": [130, 145],
      "newMeaningfulValueEverySeconds": [45, 60],
      "microTensionEverySeconds": [60, 90],
      "cognitiveReliefEveryMinutes": [3, 4],
      "minimumAhaMoments": 3,
      "minimumReelReadyScenes": 3,
      "maximumListStyleNarrationPassages": 2,
      "rules": [
        "Motion alone does not count as new value",
        "Never introduce more than one genuinely new concept at a time",
        "Use deliberate pauses after strong ideas",
        "Aha moments must change the viewer's mental model",
        "Reel-ready passages need their own hook, visible mechanism or causal insight, and payoff"
      ]
    },
    "episodeStoryGrammar": [
      "Cold Open / Human Hook",
      "Question and Promise",
      "Entry into the System",
      "Journey Through Major Layers",
      "Central Deep Dive",
      "Failure / Trade-off Branch",
      "Resolution / Return Path",
      "Final Zoom-out / Architectural Lesson"
    ],
    "visualWorld": {
      "name": "Architectural Thinking — Living Technical Interface",
      "definition": "A persistent technical interface in which software architecture behaves visibly.",
      "feel": ["Dark", "Premium", "Technical", "Spatial", "Precise", "Engineered", "2.5D / light 3D", "Readable", "Restrained rather than sci-fi chaotic"],
      "mayInclude": ["Dark navy or near-black space", "Subtle engineering grid", "Layered mechanical pedestals", "Technical node housings", "Glass or translucent surfaces", "Emissive edge geometry", "Controlled light", "Thin flow paths", "Compact diagnostic UI"],
      "avoid": ["White consumer UI", "Generic rounded cards", "Childish icons", "Rainbow diagrams", "Generic shiny 3D objects", "Excessive bloom", "Decorative movement", "Gaming HUD visuals without architectural meaning"],
      "depthRule": "Depth exists to clarify architecture, not to demonstrate 3D skill."
    },
    "livingArchitectureMap": {
      "principle": "Every episode should feel like one persistent architectural world rather than disconnected slides.",
      "spatialMemory": "Nodes remain in quieter states after explanation so the viewer builds spatial memory.",
      "backbone": ["System boundaries", "Service/server nodes", "Data/storage nodes", "Trust/state nodes", "Dependencies", "Request/event paths", "Active vs inactive flows", "Failures and waiting"],
      "majorRule": "The backbone is architecture nodes plus dependencies plus paths. It is not browser UI.",
      "clientRule": "Client/browser context must exist but must not visually dominate backend architecture.",
      "humanAnchor": "Phone / Device",
      "clientPreferredRole": "Compact Client Boundary / Request Assembly transition or temporary teaching reveal."
    },
    "componentIdentity": {
      "principle": "Shape first → label second.",
      "unityPrinciple": "Unique identity inside a unified system.",
      "identityOrder": ["Silhouette / massing", "Internal geometry", "Behavior / motion signature", "Small icon or cue", "Subtle accent family", "Label as confirmation"],
      "recognitionRule": "A major component should be inferable from shape, internal structure, behavior, and context before reading its label.",
      "families": {
        "humanClient": "Interface-facing, human consequence, local action",
        "entryRouting": "Boundary, direction, selection, flow splitting or entering",
        "serviceDecision": "Processing core, decision structure, logic hub, stable central mass",
        "dataStorage": "Stored state, layered/rack/vault/record geometry, retrieval behavior",
        "trustState": "Proof or credential/state artifact, visually distinct from ordinary storage",
        "observabilitySupport": "Quieter secondary context that never competes with the primary path"
      }
    },
    "colorSystem": {
      "primaryIdentity": "Shape and internal structure identify the component.",
      "secondaryIdentity": "Use subtle accent families rather than painting whole nodes in bright colors.",
      "statePriority": "State semantics override component accent when semantic meaning is more important.",
      "states": {
        "inactive": "Dark blue-gray / low contrast",
        "active": "Brighter component accent or cyan",
        "success": "Green",
        "waitingSlowCaution": "Amber",
        "failureRejection": "Red",
        "disabledFutureSecondary": "Dim low-contrast"
      },
      "rule": "Never make color the only signal; combine icon, path behavior, motion, shape, opacity, or interruption."
    },
    "motionGrammar": {
      "cycle": "ARRIVE → ACTIVATE → ASK / REVEAL → EXPLAIN → COLLAPSE → CONTINUE",
      "allowedPurposes": ["Show causal flow", "Transfer attention", "Show state change", "Visualize uncertainty", "Compare behaviors", "Show waiting or failure", "Resolve a question"],
      "noiseRule": "Motion that exists only to make the screen feel alive is noise."
    },
    "activePaths": {
      "states": ["Inactive connection", "Active request", "Response return", "Waiting", "Slow dependency", "Retry", "Duplicated request", "Failure", "Fan-out", "Selected route", "Blocked path", "Recovery"],
      "hierarchy": "Only the current route should dominate. Past context remains visible but quieter. Future nodes stay subdued until needed.",
      "legibility": "The primary path must remain legible even when the full architecture is visible."
    },
    "storyTokens": {
      "principle": "The moving request or event is often the protagonist of the episode.",
      "style": "Use small technical semantic tokens rather than pretending to show literal low-level packets.",
      "semanticTransformation": "Request, lookup, record, decision, trust state, and response may share a family but should visibly transform with meaning."
    },
    "teachingIdentity": {
      "mapIdentity": "The object as it exists in the full architecture.",
      "teachingIdentity": "A temporary reveal that explains internal decision or process through behavior.",
      "rule": "Mini-worlds must not become bullet-list cards; they should show behavior.",
      "questionCards": "Show only when relevant; never display every question simultaneously."
    },
    "cameraSystem": {
      "tool": "Spline-first",
      "principle": "Use one world. The camera travels through it.",
      "storyRule": "Camera movement is storytelling, not decoration.",
      "moveWhen": "Focus changes",
      "holdWhen": "Reasoning is deep",
      "avoid": ["Constant drifting", "Aggressive zooms", "Flashy rotations", "Movement competing with narration"],
      "projection": "Orthographic-first for readability, mild perspective only when it improves spatial understanding",
      "overviewRule": "Full-map views are occasional establishing or payoff shots; most shots intentionally focus on the current subsystem."
    },
    "splineShotWorkflow": {
      "rule": "Do not render one uninterrupted long Spline animation.",
      "approach": "Use multiple controlled shot segments and assemble them in the video editor.",
      "benefits": ["Corrections easier", "Rendering safer", "Narration timing easier", "Re-export cheaper", "Iteration faster"],
      "execution": "Spline owns spatial world, node depth, materials, camera, path movement, technical 3D/2.5D composition, reuse, and shot animation."
    },
    "assetRules": {
      "svg": "SVGs are construction assets, not final renders.",
      "build": "Build assets because a locked story or scene requires them, not because they seem cool.",
      "reuse": "Each episode should reuse most of the world and add only a small number of new components, behaviors, or story modules.",
      "reusableCategories": ["Architecture nodes", "Path styles", "Story tokens", "State indicators", "Question shells", "Reveal shells", "Pedestals", "Camera beats", "Failure motion patterns", "Return-response patterns"],
      "splinePaths": "Important animated architecture routes should preferably be native Spline 3D Paths."
    },
    "productionPipeline": {
      "canonical": ["Research", "Truth Map", "Scope Lock", "Script", "Timecoded Visual Plan", "Asset List", "SVG Construction Assets", "Spline Vertical Slice", "Rough Voice-over", "Spline Master World", "Animation + Camera", "Shot Exports", "Video Edit", "Sound + Captions", "QA", "Publish"],
      "truthBeforeBeauty": ["Who sends the request", "Who decides", "Who waits", "Where state exists", "What is synchronous", "What is a dependency", "What is returned", "Where failure becomes visible"],
      "verticalSliceBeforeScale": true,
      "roughVoiceBeforeFinalAnimationTiming": true,
      "cloudOnly": true,
      "windowsRequired": false
    },
    "verticalSliceQuality": {
      "targetSeconds": [20, 30],
      "mustProve": ["Visual style", "Component readability", "Active paths", "State changes", "Camera", "Narration timing", "Sound potential", "Reveal logic"],
      "comprehensionRule": "The viewer must be able to identify the exact moment the meaningful request leaves the client when that boundary is part of the story."
    },
    "editorAndAudio": {
      "editorOwns": ["Rough/final voice-over placement", "Music", "Sound design", "Pacing refinements", "Subtitles", "Transitions between exported shots", "Final polish", "Export"],
      "timingRule": "Visual timing follows speech and reasoning; narration should not be forced to rush for animation.",
      "sound": "Technical and restrained. Do not make architecture sound like a video game. Silence is useful."
    },
    "humanConsequenceLoop": {
      "rule": "On major technical conflicts, return to the human; if no direct human consequence exists, show a business consequence.",
      "businessExamples": ["Failed order", "Violated SLA", "Duplicate charge", "Wrong state", "Expensive operational load", "Lost trust"]
    },
    "failureVisualization": {
      "rule": "Failure branches should be short and attached to the main story, then return to the primary path.",
      "contrast": "Show happy path versus wait/time-budget/dependency failure and its visible consequence; do not start a second documentary inside the episode."
    },
    "visualHierarchy": {
      "rule": "At any moment one node or flow dominates.",
      "currentRoute": "Brightest",
      "nearbyContext": "Visible",
      "secondaryNodes": "Faded",
      "futureRoutes": "Quiet",
      "avoid": "Do not illuminate the whole system equally or show all reveals and diagnostics at once."
    },
    "textRules": {
      "purpose": "On-screen technical text is for orientation, not for replacing narration.",
      "nodeNames": "Short",
      "reasoningOwner": "Narration",
      "labelRule": "Label confirms identity; it must not rescue an unreadable component."
    },
    "qualityTests": {
      "visualRecognition": "Hide a major component label and verify its architectural role is inferable from shape, internal structure, behavior, and context.",
      "silentComprehension": "Watch important scenes without narration and verify the viewer can infer where the request is, active node, waiting state, direction, and success/failure."
    },
    "antiPatterns": [
      "Generic rounded rectangle for every component",
      "Bright rainbow color for every component",
      "Browser/UI dominating a backend architecture story",
      "Every node equally bright",
      "Decorative motion",
      "Constant camera movement",
      "Building before story/truth lock",
      "Creating dozens of assets before needed",
      "Disconnected slide worlds when the map can stay persistent",
      "Reteaching familiar nodes from zero in later episodes",
      "Implementation-specific details presented as universal truth",
      "Turning an episode into a technology catalogue"
    ],
    "contextReuse": {
      "fiveSecondRule": "Once viewers know a component, give about 5–10 seconds of context and move to the new behavior, failure, or trade-off.",
      "competitiveAdvantage": "The reusable system is the production advantage, but the engineering lesson must remain new."
    },
    "seriesStrategy": {
      "principle": "One human action can open an architectural story world.",
      "progression": ["ENTRY", "BRIDGE", "DEPTH"],
      "entry": "Broad human question with maximum click clarity, low cognitive load, and the core architectural promise.",
      "bridge": "Natural question created by the Entry outcome; deepen one mechanism and reuse spatial memory.",
      "depth": "Scale, failure, correctness, distributed-state, security, cost, or reliability conflict on the same world.",
      "continuity": "Whenever natural, the final unresolved architectural consequence of one video becomes the opening question of the next.",
      "rules": ["Reuse context. Advance the question.", "Repeat the world, not the lesson.", "The strongest series are causal, not categorical.", "Entry creates understanding. Bridge creates continuity. Depth creates authority.", "Do not force a weak topic into a series."]
    },
    "clusterAgentContract": {
      "questions": [
        "What is the broad Entry video?",
        "What natural question remains for the Bridge?",
        "What happens under scale, failure, uncertainty, security pressure, correctness pressure, or cost pressure for Depth?",
        "What familiar components can be reused?",
        "What engineering lesson must be new?",
        "What is the human or business consequence?",
        "What is the natural forward bridge?",
        "Does every proposed episode independently pass the Topic Quality Test?"
      ],
      "prefer": ["Evergreen search intent", "Mass entry", "Senior engineering depth", "Reusable visual architecture", "High-value business or reliability consequences", "Distinct lessons inside a recognizable system world"],
      "reject": "Technology catalogues such as a sequence of protocol names without a causal architectural journey."
    },
    "contentPortfolio": {
      "strategy": "Build several recognizable architectural story worlds rather than a flat list of unrelated uploads.",
      "worlds": {
        "IdentityAndTrust": "Login → remembered identity → scale/failure → MFA → logout/revocation → service-to-service user context",
        "PaymentsTrustCorrectness": "Add card → tap to pay → authorization → payment failure → retry/duplicate charge → refund/reconciliation",
        "Messaging": "Send message → delivery → offline user → ordering → retry → high-scale messaging",
        "VideoStreaming": "Press Play → CDN path → buffering → traffic spike → regional failure → recovery",
        "Commerce": "Add to Cart → checkout → inventory → payment → order creation → overselling / consistency conflict"
      },
      "rule": "These are strategic worlds, not fixed upload schedules; every actual video still requires research, truth mapping, scope lock, title testing, and editorial approval."
    },
    "agentHandoffPolicy": {
      "principle": "Every downstream agent must reduce ambiguity rather than transfer it.",
      "requirements": ["Exact timings", "Canonical object names when known", "Explicit dependencies", "Expected outcomes", "Structured handoff contracts", "No invented missing upstream decisions"],
      "creatorControl": "Autonomous initial builds never auto-lock creator decisions. The creator reviews, corrects, and explicitly locks each stage.",
      "revisionRule": "If an upstream artifact changes, invalidate stale unlocked downstream work rather than pretending it is still aligned."
    },
    "mediaOsExecution": {
      "initialBuild": "After topic/scope is established, agents may create a cloud-only dependency-aware first pass through Truth → Script → Scene → handoff without requiring the creator to stay online.",
      "reviewOrder": ["Script", "Scene", "Spline"],
      "creatorRole": "Review, correct, approve, and lock. Automation produces the first serious pass but does not make final creative decisions.",
      "infrastructure": "No Windows machine dependency for agent pages or autonomous creative work."
    }
  }
  $$::jsonb
)
on conflict (project_id) do update
set version=excluded.version,
    payload=excluded.payload,
    updated_at=now();
