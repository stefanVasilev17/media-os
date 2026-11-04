import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.join(root,'src/episodes');
const target=path.join(root,'src/factory/generated-scene-registry.ts');
const imports=[];
const entries=[];
const exported=[];
const dirs=(await fs.readdir(source,{withFileTypes:true}))
  .filter(e=>e.isDirectory()&&/^ep[0-9]{3,}$/.test(e.name)&&!['ep001','ep002'].includes(e.name))
  .map(e=>e.name).sort();
for(const dir of dirs){
  const shots=(await fs.readdir(path.join(source,dir),{withFileTypes:true}))
    .filter(e=>e.isFile()&&/^Shot([0-9]{2})GeneratedScene\.tsx$/.test(e.name))
    .map(e=>e.name).sort();
  for(const filename of shots){
    const index=filename.slice(4,6);
    const key=dir.toUpperCase()+'-SHOT'+index;
    const symbol='Episode'+dir.slice(2)+'Shot'+index;
    const named='Shot'+index+'GeneratedScene';
    imports.push(`import {${named} as ${symbol}} from '../episodes/${dir}/${filename.slice(0,-4)}';`);
    entries.push(`  '${key}': ${symbol},`);
    exported.push(key);
  }
}
const content=[
  '// AUTO-GENERATED FROM EXACT episode-local ShotNNGeneratedScene.tsx PATHS.',
  '// Run npm run generate:factory. Do not hand-edit this registry.',
  "import type {ComponentType} from 'react';",
  ...imports,
  'export const factoryScenes:Record<string,ComponentType<any>>={',
  ...entries,
  '};',
  'export const factorySceneKeys='+JSON.stringify(exported)+' as const;',
  ''
].join('\n');
await fs.mkdir(path.dirname(target),{recursive:true});
await fs.writeFile(target,content,'utf8');
console.log('Factory scenes discovered:',exported.join(', ')||'none (Codex not configured)');
