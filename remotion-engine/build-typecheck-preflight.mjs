import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const knownBaseline = new Set([
  "src/episodes/ep001/live-diagram/Shot10SessionCreationPresentationV8.tsx(198,48): error TS2322: Type 'string' is not assignable to type 'number'.",
]);
const result = spawnSync(process.execPath, [
  path.join(root, 'node_modules/typescript/bin/tsc'),
  '--noEmit',
  '--pretty',
  'false',
], {cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
const output = [result.stdout || '', result.stderr || ''].join('\n');
const diagnostics = output.split(/\r?\n/).map(line => line.trim()).filter(line => /error TS\d+:/.test(line));
const unexpected = diagnostics.filter(line => !knownBaseline.has(line));

if (result.error || (result.status !== 0 && diagnostics.length === 0) || unexpected.length > 0 || result.signal) {
  process.stderr.write(output);
  throw new Error('Remotion preflight failed: ' + unexpected.length + ' unexpected diagnostics, exit=' + result.status + ', signal=' + (result.signal || 'none'));
}
if (diagnostics.length > 0) {
  process.stderr.write('Remotion TypeScript preflight: ' + diagnostics.length + ' documented LOCKED baseline diagnostic accepted; zero new errors.\n');
  for (const diagnostic of diagnostics) process.stderr.write(diagnostic + '\n');
} else {
  process.stdout.write('Remotion TypeScript preflight: zero errors.\n');
}
