const { spawn } = require("child_process");

const targets = JSON.parse(process.env.MEDIA_OS_SPLINE_TARGETS_JSON || "[]");
const fingerprint = process.env.MEDIA_OS_SCENE_FINGERPRINT || "";
const splineExe = process.env.MEDIA_OS_SPLINE_EXE;
const mcpScript = process.env.MEDIA_OS_SPLINE_MCP_SCRIPT;

if (!Array.isArray(targets) || targets.length === 0) {
  console.error("Direct overlay discovery received no targets.");
  process.exit(2);
}

const child = spawn(
  splineExe,
  [mcpScript],
  {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: ["pipe", "pipe", "pipe"]
  }
);

let stdoutBuffer = "";
let bridgeDiagnostics = "";
let finished = false;
let sequence = 10;
let toolListAttempts = 0;
let callId = null;
let objectCallAttempts = 0;
const MAX_OBJECT_CALL_ATTEMPTS = 60;
const toolListIds = new Set();

function cleanup(exitCode) {
  if (finished) return;
  finished = true;
  clearTimeout(globalTimeout);
  try { child.stdin.end(); } catch {}
  try { child.kill(); } catch {}
  setTimeout(() => process.exit(exitCode), 10);
}

function fail(message) {
  if (finished) return;
  const suffix = bridgeDiagnostics.trim();
  console.error(suffix ? `${message}\n${suffix}` : message);
  cleanup(2);
}

function send(message) {
  child.stdin.write(JSON.stringify(message) + "\n");
}

function requestToolList() {
  toolListAttempts += 1;
  const id = sequence++;
  toolListIds.add(id);
  send({
    jsonrpc: "2.0",
    id,
    method: "tools/list",
    params: {}
  });
}

function targetIds(target) {
  const resolved = Array.isArray(target && target.authoringObjectIds)
    ? target.authoringObjectIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (resolved.length > 0) return [...new Set(resolved)];
  const fallback = String((target && target.objectUuid) || "").trim();
  return fallback ? [fallback] : [];
}

function callGetObjects() {
  objectCallAttempts += 1;
  callId = sequence++;
  const ids = [...new Set(targets.flatMap(targetIds))];
  if (ids.length === 0) {
    fail("Direct overlay discovery has no resolved authoring object ids.");
    return;
  }
  send({
    jsonrpc: "2.0",
    id: callId,
    method: "tools/call",
    params: {
      name: "3d_get_objects",
      arguments: { ids }
    }
  });
}

function isEditorNotConnected(value) {
  const encoded = JSON.stringify(value ?? "");
  const text = String(encoded ?? value ?? "").toLowerCase();
  return text.includes("editor") && (
    text.includes("not connected") ||
    text.includes("no editor is connected") ||
    text.includes("no 3d editor is connected") ||
    text.includes("no two editor is connected")
  );
}

function retryEditorReadiness(value) {
  if (!isEditorNotConnected(value)) return false;

  if (objectCallAttempts >= MAX_OBJECT_CALL_ATTEMPTS) {
    fail(
      `Spline editor did not connect to the MCP bridge after ${objectCallAttempts} ` +
      `3d_get_objects readiness attempts.`
    );
    return true;
  }

  setTimeout(callGetObjects, 300);
  return true;
}

function parseJsonCandidate(text) {
  if (typeof text !== "string") return null;
  let value = text.trim();
  value = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const attempts = [value];

  const firstObject = value.indexOf("{");
  const lastObject = value.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) {
    attempts.push(value.slice(firstObject, lastObject + 1));
  }

  const firstArray = value.indexOf("[");
  const lastArray = value.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    attempts.push(value.slice(firstArray, lastArray + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  return null;
}

function toolRoots(result) {
  const roots = [];
  if (!result || typeof result !== "object") return roots;

  if (result.structuredContent != null) roots.push(result.structuredContent);
  if (result.data != null) roots.push(result.data);

  if (Array.isArray(result.content)) {
    for (const part of result.content) {
      if (!part || typeof part !== "object") continue;
      if (part.json != null) roots.push(part.json);
      if (part.text != null) {
        const parsed = parseJsonCandidate(part.text);
        if (parsed != null) roots.push(parsed);
      }
    }
  }

  roots.push(result);
  return roots;
}

function findById(node, id, seen = new WeakSet(), depth = 0) {
  if (node == null || depth > 40) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findById(item, id, seen, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== "object") return null;
  if (seen.has(node)) return null;
  seen.add(node);

  for (const key of ["id", "uuid", "objectUuid", "objectId"]) {
    if (Object.prototype.hasOwnProperty.call(node, key) && String(node[key]) === id) {
      return node;
    }
  }

  for (const value of Object.values(node)) {
    const found = findById(value, id, seen, depth + 1);
    if (found) return found;
  }
  return null;
}

function ownArray(object, keys) {
  if (!object || typeof object !== "object") return { found: false, value: [] };
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key) && Array.isArray(object[key])) {
      return { found: true, value: object[key] };
    }
  }
  return { found: false, value: [] };
}

function collectActions(node, seen = new WeakSet(), depth = 0) {
  const result = { found: false, actions: [] };
  if (node == null || depth > 8) return result;

  if (Array.isArray(node)) {
    for (const item of node) {
      const child = collectActions(item, seen, depth + 1);
      result.found = result.found || child.found;
      result.actions.push(...child.actions);
    }
    return result;
  }

  if (typeof node !== "object") return result;
  if (seen.has(node)) return result;
  seen.add(node);

  for (const [key, value] of Object.entries(node)) {
    if (key.toLowerCase() === "actions" && Array.isArray(value)) {
      result.found = true;
      result.actions.push(...value);
      continue;
    }

    if (
      ["containers", "actioncontainers", "eventactions", "handlers", "actiongroups"].includes(key.toLowerCase())
    ) {
      const child = collectActions(value, seen, depth + 1);
      result.found = result.found || child.found;
      result.actions.push(...child.actions);
    }
  }

  return result;
}

function normalizeStates(states) {
  return states.map((state) => {
    if (!state || typeof state !== "object") return state;
    const out = {};
    for (const key of ["id", "name", "selected"]) {
      if (Object.prototype.hasOwnProperty.call(state, key)) out[key] = state[key];
    }
    return Object.keys(out).length ? out : state;
  });
}

function normalizeEvents(events) {
  return events.map((event) => {
    if (!event || typeof event !== "object") return event;
    const out = {};
    for (const key of ["id", "type", "mode", "key", "steps", "target", "variableId"]) {
      if (Object.prototype.hasOwnProperty.call(event, key)) out[key] = event[key];
    }
    return Object.keys(out).length ? out : event;
  });
}

function normalizeTarget(target, object) {
  const statesInfo = ownArray(object, ["states", "stateDefinitions"]);
  const eventsInfo = ownArray(object, ["events", "eventBindings"]);

  if (!statesInfo.found || !eventsInfo.found) {
    throw new Error(
      `Direct parser could not confirm states/events fields for ${target.slotKey || target.objectUuid}.`
    );
  }

  const states = normalizeStates(statesInfo.value);
  const events = normalizeEvents(eventsInfo.value);
  const actionGraph = [];
  let everyEventExposedActions = true;
  let anyActionContainer = false;
  let actionCount = 0;

  for (const event of eventsInfo.value) {
    const collected = collectActions(event);
    anyActionContainer = anyActionContainer || collected.found;
    everyEventExposedActions = everyEventExposedActions && collected.found;
    actionCount += collected.actions.length;

    if (collected.actions.length > 0) {
      actionGraph.push({
        eventId:
          event && typeof event === "object"
            ? (event.id ?? event.eventId ?? null)
            : null,
        actions: collected.actions
      });
    }
  }

  let actionsCoverage;
  if (eventsInfo.value.length === 0) {
    actionsCoverage = "CONFIRMED_EMPTY";
  } else if (everyEventExposedActions && actionCount === 0) {
    actionsCoverage = "CONFIRMED_EMPTY";
  } else if (anyActionContainer && actionCount > 0) {
    actionsCoverage = everyEventExposedActions ? "EXPOSED" : "PARTIAL";
  } else {
    actionsCoverage = "NOT_EXPOSED";
  }

  const coverage = {
    label: "NOT_EXPOSED",
    states: statesInfo.value.length > 0 ? "EXPOSED" : "CONFIRMED_EMPTY",
    events: eventsInfo.value.length > 0 ? "EXPOSED" : "CONFIRMED_EMPTY",
    actions: actionsCoverage
  };

  const notes =
    `Direct 3d_get_objects read: ${statesInfo.value.length} state(s), ` +
    `${eventsInfo.value.length} event(s), ${actionCount} action(s); ` +
    `exact-object detail does not expose subtree label text.`;

  return {
    slotKey: target.slotKey,
    objectName: target.objectName,
    editorPath: target.editorPath ?? null,
    label: {
      status: "NOT_EXPOSED",
      targetPath: null,
      currentText: null
    },
    states,
    eventBindings: events,
    actionGraph,
    coverage,
    notes
  };
}

function sourceTagged(value, sourceObjectId) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value, sourceObjectId };
  }
  return { value, sourceObjectId };
}

function mergeCoverage(results, key) {
  const values = results.map((item) => item.coverage[key]);
  if (values.includes("PARTIAL")) return "PARTIAL";
  const unique = new Set(values);
  if (unique.size === 1) return values[0];
  if (unique.has("EXPOSED") && unique.has("NOT_EXPOSED")) return "PARTIAL";
  if (unique.has("EXPOSED")) return "EXPOSED";
  if (unique.has("NOT_EXPOSED")) return "NOT_EXPOSED";
  return "CONFIRMED_EMPTY";
}

function mergeTargetResults(target, normalized) {
  if (normalized.length === 1) return normalized[0].result;

  const states = normalized.flatMap(({ id, result }) =>
    result.states.map((value) => sourceTagged(value, id))
  );
  const eventBindings = normalized.flatMap(({ id, result }) =>
    result.eventBindings.map((value) => sourceTagged(value, id))
  );
  const actionGraph = normalized.flatMap(({ id, result }) =>
    result.actionGraph.map((value) => sourceTagged(value, id))
  );

  return {
    slotKey: target.slotKey,
    objectName: target.objectName,
    editorPath: target.editorPath ?? null,
    label: {
      status: "NOT_EXPOSED",
      targetPath: null,
      currentText: null
    },
    states,
    eventBindings,
    actionGraph,
    coverage: {
      label: "NOT_EXPOSED",
      states: mergeCoverage(normalized.map((item) => item.result), "states"),
      events: mergeCoverage(normalized.map((item) => item.result), "events"),
      actions: mergeCoverage(normalized.map((item) => item.result), "actions")
    },
    notes:
      `Direct 3d_get_objects family read: ${normalized.length} authoring object(s), ` +
      `${states.length} state(s), ${eventBindings.length} event(s), ${actionGraph.length} action group(s); ` +
      `subtree label text is not inferred.`
  };
}

function emitOverlay(result) {
  const roots = toolRoots(result);
  const items = [];

  for (const target of targets) {
    const ids = targetIds(target);
    if (ids.length === 0) {
      throw new Error(`No authoring object ids resolved for ${target.slotKey || target.objectName}.`);
    }

    const normalized = [];
    for (const objectId of ids) {
      let object = null;
      for (const root of roots) {
        object = findById(root, objectId);
        if (object) break;
      }

      if (!object) {
        throw new Error(`Direct 3d_get_objects response omitted authoring target ${objectId}.`);
      }

      normalized.push({ id: objectId, result: normalizeTarget(target, object) });
    }

    items.push(mergeTargetResults(target, normalized));
  }

  console.log("MEDIA_OS_AUTHORING_OVERLAY_BEGIN");
  console.log(JSON.stringify({ sceneFingerprint: fingerprint, items }));
  console.log("MEDIA_OS_AUTHORING_OVERLAY_END");
  console.log("MEDIA_OS_SPLINE_RESULT: SUCCEEDED - direct authoring overlay batch read");
}

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  bridgeDiagnostics = (bridgeDiagnostics + chunk).slice(-12000);
});

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;

  while (stdoutBuffer.includes("\n")) {
    const index = stdoutBuffer.indexOf("\n");
    const line = stdoutBuffer.slice(0, index).trim();
    stdoutBuffer = stdoutBuffer.slice(index + 1);

    if (!line) continue;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }

    if (message.id === 1) {
      if (message.error) {
        fail(`Spline MCP initialize failed: ${JSON.stringify(message.error)}`);
        return;
      }

      send({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {}
      });

      setTimeout(requestToolList, 150);
      continue;
    }

    if (toolListIds.has(message.id)) {
      const tools = message.result && Array.isArray(message.result.tools)
        ? message.result.tools
        : [];
      const hasTool = tools.some((tool) => tool && tool.name === "3d_get_objects");

      if (!hasTool) {
        if (toolListAttempts >= 30) {
          fail("Spline MCP editor manifest did not expose 3d_get_objects.");
          return;
        }
        setTimeout(requestToolList, 250);
        continue;
      }

      setTimeout(callGetObjects, 300);
      continue;
    }

    if (callId != null && message.id === callId) {
      if (message.error) {
        if (retryEditorReadiness(message.error)) return;
        fail(`3d_get_objects failed: ${JSON.stringify(message.error)}`);
        return;
      }
      if (!message.result || message.result.isError === true) {
        if (retryEditorReadiness(message.result)) return;
        fail(`3d_get_objects returned an error result: ${JSON.stringify(message.result)}`);
        return;
      }

      try {
        emitOverlay(message.result);
        cleanup(0);
      } catch (error) {
        fail(error && error.message ? error.message : String(error));
      }
    }
  }
});

child.on("error", (error) => {
  fail(`Could not start Spline MCP bridge: ${error.message}`);
});

child.on("exit", (code) => {
  if (!finished && code !== 0) {
    fail(`Spline MCP bridge exited before direct overlay discovery completed (exit ${code}).`);
  }
});

const globalTimeout = setTimeout(() => {
  fail("Direct Spline MCP overlay discovery timed out.");
}, 90000);

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "media-os-direct-overlay",
      version: "2.0.0"
    }
  }
});
