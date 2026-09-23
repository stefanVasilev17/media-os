from pathlib import Path

path = Path('worker/spline-direct-overlay.js')
text = path.read_text(encoding='utf-8')

old = '''let callId = null;
const toolListIds = new Set();'''
new = '''let callId = null;
let objectCallAttempts = 0;
const MAX_OBJECT_CALL_ATTEMPTS = 60;
const toolListIds = new Set();'''
if old not in text:
    raise SystemExit('call state anchor not found')
text = text.replace(old, new, 1)

old = '''function requestToolList() {
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
'''
new = '''function requestToolList() {
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

function callGetObjects() {
  objectCallAttempts += 1;
  callId = sequence++;
  send({
    jsonrpc: "2.0",
    id: callId,
    method: "tools/call",
    params: {
      name: "3d_get_objects",
      arguments: {
        ids: targets.map((target) => String(target.objectUuid))
      }
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
'''
if old not in text:
    raise SystemExit('requestToolList anchor not found')
text = text.replace(old, new, 1)

old = '''      callId = sequence++;
      send({
        jsonrpc: "2.0",
        id: callId,
        method: "tools/call",
        params: {
          name: "3d_get_objects",
          arguments: {
            ids: targets.map((target) => String(target.objectUuid))
          }
        }
      });
      continue;'''
new = '''      setTimeout(callGetObjects, 300);
      continue;'''
if old not in text:
    raise SystemExit('initial get_objects call anchor not found')
text = text.replace(old, new, 1)

old = '''    if (callId != null && message.id === callId) {
      if (message.error) {
        fail(`3d_get_objects failed: ${JSON.stringify(message.error)}`);
        return;
      }
      if (!message.result || message.result.isError === true) {
        fail(`3d_get_objects returned an error result: ${JSON.stringify(message.result)}`);
        return;
      }
'''
new = '''    if (callId != null && message.id === callId) {
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
'''
if old not in text:
    raise SystemExit('get_objects response anchor not found')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('patched', path)
