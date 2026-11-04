import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';

const engine=path.dirname(fileURLToPath(import.meta.url));
const episodeRoot=path.join(engine,'src/episodes');
const protectedComponents=path.join(engine,'src/components/architectural-thinking');
const allowedExternal=new Set([
  'react','remotion','@remotion/three','@remotion/zod-types',
  '@react-three/fiber','three','zod',
]);
const forbidden=new Set([
  'eval','Function','require','process','globalThis','fetch','WebSocket',
  'XMLHttpRequest','Worker','Deno','Bun','document','window','navigator',
  'localStorage','sessionStorage','location','setTimeout','setInterval',
  '__dirname','__filename','Buffer',
]);
const supported=/(\.tsx?|\.json)$/;

export function validateFactorySource(fileName,code,episodeDir){
  const errors=[];
  const parsed=ts.createSourceFile(fileName,code,ts.ScriptTarget.Latest,true,
    fileName.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const checkImport=value=>{
    if(!value){errors.push('DYNAMIC_OR_UNRESOLVED_IMPORT');return;}
    if(value.startsWith('.')){
      const abs=path.resolve(path.dirname(fileName),value);
      if(!abs.startsWith(episodeDir+path.sep)
          && abs!==episodeDir
          && !abs.startsWith(protectedComponents+path.sep)
          && abs!==protectedComponents)
        errors.push('IMPORT_OUTSIDE_EPISODE_OR_REVIEWED_SHARED_PRIMITIVES: '+value);
    }else if(!allowedExternal.has(value)){
      errors.push('UNTRUSTED_NEW_EXTERNAL_IMPORT: '+value);
    }
  };
  function visit(node){
    if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){
      if(node.moduleSpecifier)checkImport(
        ts.isStringLiteral(node.moduleSpecifier)?node.moduleSpecifier.text:null);
    }else if(ts.isImportEqualsDeclaration(node)){
      errors.push('TYPESCRIPT_REQUIRE_IMPORT_FORBIDDEN');
    }
    if(ts.isIdentifier(node) && forbidden.has(node.text)){
      errors.push('DISALLOWED_GLOBAL_OR_RUNTIME_API: '+node.text);
    }
    if(ts.isCallExpression(node)){
      if(node.expression.kind===ts.SyntaxKind.ImportKeyword)
        errors.push('DYNAMIC_IMPORT_FORBIDDEN');
      if(ts.isPropertyAccessExpression(node.expression)){
        const name=node.expression.name.text;
        if(['eval','exec','spawn','fork','writeFile','readFile','open',
          'connect','createServer','sendBeacon'].includes(name))
          errors.push('DISALLOWED_RUNTIME_SIDE_EFFECT: '+name);
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  if(parsed.parseDiagnostics.length>0)errors.push('TYPESCRIPT_SOURCE_PARSE_FAILED');
  return [...new Set(errors)];
}

export async function validateFactoryTree(root=episodeRoot){
  let checked=0;
  for(const dirent of await fs.readdir(root,{withFileTypes:true})){
    if(!dirent.isDirectory() || !/^ep[0-9]{3,}$/.test(dirent.name)
        ||['ep001','ep002'].includes(dirent.name))continue;
    const episode=path.join(root,dirent.name);
    for(const entity of await fs.readdir(episode,{withFileTypes:true})){
      if(!entity.isFile())throw Error('Factory episode-local dependencies must be files only: '+entity.name);
      if(!/^[A-Za-z][A-Za-z0-9_-]{0,90}\.tsx?$/.test(entity.name))
        throw Error('Factory contains unsupported source file type: '+entity.name);
      const filename=path.join(episode,entity.name);
      const content=await fs.readFile(filename,'utf8');
      if(content.length>200000)throw Error('Factory scene exceeds 200k source bound');
      const errors=validateFactorySource(filename,content,episode);
      if(errors.length)throw Error('Factory scene blocked '+entity.name+': '+errors.join(', '));
      checked++;
    }
  }
  return checked;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const scenes=await validateFactoryTree();
  console.log('Factory episode source safety validation PASS: '+scenes+' files');
}
