import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const REPOSITORY='stefanVasilev17/media-os';
const BRANCH='feat/mediaos-ep002-unified-product-integration';
const REPO_URL='https://github.com/stefanVasilev17/media-os.git';
const STAGES=[
  {stage:'asset-check',timeout:120000},
  {stage:'backend',timeout:1800000},
  {stage:'frontend',timeout:1200000},
  {stage:'remotion',timeout:1200000},
];
const FORWARDED=['PATH','HOME','USER','LANG','LC_ALL','TMPDIR','TEMP','TMP',
  'XDG_CONFIG_HOME','XDG_DATA_HOME','GIT_CONFIG_GLOBAL'];
const STDOUT_LIMIT=2048;

function allowedLease(job){
  return Boolean(job &&
    job.repository===REPOSITORY && job.sourceBranch===BRANCH &&
    /^[0-9a-f]{40}$/.test(job.sourceCommit) &&
    /^[0-9a-f-]{36}$/.test(job.runId) &&
    /^[0-9a-f-]{36}$/.test(job.leaseId));
}

function commandEnvironment(sourceRoot=null){
  const env={CI:'true',GIT_TERMINAL_PROMPT:'0'};
  for(const key of FORWARDED){
    const value=process.env[key];
    if(value)env[key]=value;
  }
  if(sourceRoot)env.MEDIAOS_VERIFICATION_SOURCE_ROOT=sourceRoot;
  return env;
}

function execute(program,args,{cwd,timeoutMs,output=false,sourceRoot=null}){
  return new Promise(resolvePromise=>{
    let done=false;
    let killed=false;
    let child;
    let stdout='';
    const finish=(result)=>{
      if(done)return;
      done=true;
      clearTimeout(timer);
      resolvePromise(result);
    };
    try{
      child=spawn(program,args,{cwd,env:commandEnvironment(sourceRoot),
        shell:false,stdio:['ignore',output?'pipe':'ignore','ignore']});
    }catch(error){
      resolvePromise({exitCode:127,stdout:'',reason:'PROCESS_START_ERROR'});
      return;
    }
    if(output && child.stdout){
      child.stdout.setEncoding('utf8');
      child.stdout.on('data',chunk=>{
        if(stdout.length<STDOUT_LIMIT)
          stdout+=String(chunk).slice(0,STDOUT_LIMIT-stdout.length);
      });
    }
    const timer=setTimeout(()=>{
      killed=true;
      child.kill('SIGKILL');
    },timeoutMs);
    child.on('error',()=>finish({exitCode:127,stdout:'',reason:'PROCESS_START_ERROR'}));
    child.on('close',(code)=>finish({
      exitCode:killed?124:Number.isInteger(code)?code:1,
      stdout:stdout.trim(),reason:killed?'TIMEOUT':null,
    }));
  });
}

function apiConfig(){
  if(process.env.MEDIAOS_VERIFICATION_WORKER_ENABLED!=='true')
    throw new Error('VERIFICATION_WORKER_DISABLED');
  const endpoint=new URL(process.env.MEDIAOS_URL??'');
  if(endpoint.protocol!=='https:' &&
      !(endpoint.protocol==='http:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))
    throw new Error('MEDIAOS_URL_MUST_BE_HTTPS_OR_LOCALHOST');
  if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash)
    throw new Error('MEDIAOS_URL_MUST_NOT_CONTAIN_CREDENTIALS');
  const token=process.env.MEDIAOS_VERIFICATION_WORKLOAD_TOKEN??'';
  const worker=process.env.MEDIAOS_VERIFICATION_WORKER_ID??'';
  if(!/^[A-Za-z0-9_-]{43,128}$/.test(token) ||
      !/^[A-Za-z0-9._:-]{1,180}$/.test(worker))
    throw new Error('SCOPED_WORKER_CREDENTIAL_NOT_CONFIGURED');
  return {endpoint,token,worker};
}

async function request(config,path,payload){
  const url=new URL(path,config.endpoint);
  if(url.origin!==config.endpoint.origin)throw new Error('UNTRUSTED_VERIFICATION_ENDPOINT');
  const response=await fetch(url,{method:'POST',
    headers:{'Content-Type':'application/json','X-Worker-Id':config.worker,
      'X-MediaOS-Workload-Token':config.token},
    body:payload?JSON.stringify(payload):'{}',
    redirect:'error',credentials:'omit',
    signal:AbortSignal.timeout(15000)});
  if(response.status===204)return null;
  if(!response.ok)throw new Error('VERIFICATION_SERVER_HTTP_'+response.status);
  return await response.json();
}

async function verifyOne(lease){
  if(!allowedLease(lease))return {stages:[],failureCode:'WORKER_BOOTSTRAP_FAILED'};
  const work=await mkdtemp(join(tmpdir(),'mediaos-verify-'));
  const checkout=resolve(work,'source');
  const project='mediaosv'+lease.runId.replaceAll('-','').slice(0,13);
  // Test instructions must come from the trusted installed worker, not
  // from a mutable PR whose code we are evaluating.
  const compose=join(dirname(fileURLToPath(import.meta.url)),'compose.yaml');
  const stages=[];
  let failureCode=null;
  try{
    const cloned=await execute('git',[
      'clone','--depth','1','--single-branch','--branch',BRANCH,'--',
      REPO_URL,checkout],{cwd:work,timeoutMs:300000});
    if(cloned.exitCode!==0){
      failureCode='GIT_SOURCE_UNAVAILABLE';
      return {stages,failureCode};
    }
    const pinned=await execute('git',['fetch','--depth','1','origin',lease.sourceCommit],
      {cwd:checkout,timeoutMs:300000});
    if(pinned.exitCode!==0){
      failureCode='GIT_SOURCE_UNAVAILABLE';
      return {stages,failureCode};
    }
    const checkoutPinned=await execute('git',['checkout','--detach',lease.sourceCommit],
      {cwd:checkout,timeoutMs:30000});
    if(checkoutPinned.exitCode!==0){
      failureCode='SOURCE_COMMIT_MISMATCH';
      return {stages,failureCode};
    }
    const current=await execute('git',['rev-parse','HEAD'],
      {cwd:checkout,timeoutMs:10000,output:true});
    if(current.exitCode!==0 || current.stdout!==lease.sourceCommit){
      failureCode='SOURCE_COMMIT_MISMATCH';
      return {stages,failureCode};
    }
    const docker=await execute('docker',['info','--format','{{.ServerVersion}}'],
      {cwd:checkout,timeoutMs:10000});
    if(docker.exitCode!==0){
      failureCode='DOCKER_UNAVAILABLE';
      return {stages,failureCode};
    }
    for(const stage of STAGES){
      const begin=Date.now();
      const result=await execute('docker',[
        'compose','--project-name',project,'--file',compose,
        'run','--rm',stage.stage],{cwd:checkout,timeoutMs:stage.timeout,
          sourceRoot:checkout});
      stages.push({stage:stage.stage,exitCode:result.exitCode,
        durationMs:Math.min(7200000,Date.now()-begin)});
      if(result.exitCode!==0){
        failureCode='TEST_STAGE_FAILURE';
        break;
      }
    }
    return {stages,failureCode};
  }catch(error){
    return {stages,failureCode:'WORKER_BOOTSTRAP_FAILED'};
  }finally{
    await execute('docker',['compose','--project-name',project,'--file',compose,
      'down','--volumes','--remove-orphans'],
      {cwd:checkout,timeoutMs:120000,sourceRoot:checkout}).catch(()=>{});
    await rm(work,{recursive:true,force:true,maxRetries:2}).catch(()=>{});
  }
}

async function main(){
  const config=apiConfig();
  const pollMs=Math.min(300000,Math.max(15000,
    Number.parseInt(process.env.MEDIAOS_VERIFICATION_POLL_MS??'60000',10)||60000));
  while(true){
    try{
      const lease=await request(config,'/api/v1/worker/verification/claim');
      if(lease){
        const result=await verifyOne(lease);
        if(!allowedLease(lease))
          throw new Error('UNTRUSTED_CLAIM_RESULT');
        const payload={leaseId:lease.leaseId,sourceCommit:lease.sourceCommit,
          stages:result.stages,failureCode:result.failureCode};
        let completed=false;
        for(let attempt=0;attempt<3 && !completed;attempt++){
          try{
            await request(config,
              '/api/v1/worker/verification/'+lease.runId+'/complete',payload);
            completed=true;
          }catch(error){
            if(attempt<2)await sleep((attempt+1)*3000);
          }
        }
        if(!completed)console.error('VERIFICATION_RESULT_DELIVERY_UNCONFIRMED',lease.runId);
      }
    }catch(error){
      console.error('VERIFICATION_POLL_BLOCKED',String(error.message??error).slice(0,160));
    }
    await sleep(pollMs);
  }
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main().catch(error=>{
    console.error('VERIFICATION_WORKER_NOT_STARTED',String(error.message).slice(0,160));
    process.exitCode=1;
  });

export {allowedLease,STAGES,commandEnvironment};
