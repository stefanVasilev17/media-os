import {afterEach,describe,expect,it,vi} from 'vitest';

afterEach(()=>{
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('MediaOS Director CSRF protection',()=>{
  it('loads a real same-origin CSRF token and its approved header name',async()=>{
    const native=vi.fn().mockResolvedValue({
      ok:true,json:async()=>({token:'server-issued-token',header:'X-XSRF-TOKEN'}),
    });
    vi.stubGlobal('fetch',native);
    const {ensureLocalCsrf}=await import('./localSession');
    await expect(ensureLocalCsrf()).resolves.toEqual({
      token:'server-issued-token',header:'X-XSRF-TOKEN',
    });
    expect(native).toHaveBeenCalledWith('/api/v1/auth/csrf',{
      cache:'no-store',credentials:'same-origin',
    });
  });

  it('never sends a cue POST when CSRF token is absent',async()=>{
    const native=vi.fn().mockResolvedValue({
      ok:true,json:async()=>({token:'',header:'X-XSRF-TOKEN'}),
    });
    vi.stubGlobal('fetch',native);
    const {ensureLocalCsrf}=await import('./localSession');
    await expect(ensureLocalCsrf()).rejects.toThrow('missing or invalid');
    expect(native).toHaveBeenCalledTimes(1);
  });

  it('preserves the freshly fetched CSRF header over a stale cookie',async()=>{
    const native=vi.fn(async(_input:Request)=>new Response('ok',{status:200}));
    vi.stubGlobal('window',{
      fetch:native,
      location:{origin:'https://mediaos.example'},
      dispatchEvent:vi.fn(),
    });
    vi.stubGlobal('document',{cookie:'XSRF-TOKEN=stale-cookie-token'});
    const {installLocalSessionFetch}=await import('./localSession');
    installLocalSessionFetch();
    await window.fetch(
      'https://mediaos.example/api/v1/creative/episodes/EP002/voice-cue-review/SHOT01',
      {method:'POST',headers:{'X-XSRF-TOKEN':'fresh-server-token','Content-Type':'application/json'},body:'{}'},
    );
    expect(native).toHaveBeenCalledTimes(1);
    const request=native.mock.calls[0][0];
    expect(request.headers.get('X-XSRF-TOKEN')).toBe('fresh-server-token');
    expect(request.credentials).toBe('same-origin');
  });

  it('still attaches the CSRF cookie for existing Director POST flows',async()=>{
    const native=vi.fn(async(_input:Request)=>new Response('ok',{status:200}));
    vi.stubGlobal('window',{
      fetch:native,
      location:{origin:'https://mediaos.example'},
      dispatchEvent:vi.fn(),
    });
    vi.stubGlobal('document',{cookie:'XSRF-TOKEN=existing-cookie-token'});
    const {installLocalSessionFetch}=await import('./localSession');
    installLocalSessionFetch();
    await window.fetch('https://mediaos.example/api/v1/creative/episodes/EP002/shots/SHOT01/approve',{
      method:'POST',body:'{}',
    });
    const request=native.mock.calls[0][0];
    expect(request.headers.get('X-XSRF-TOKEN')).toBe('existing-cookie-token');
  });
});

describe('Publishing authenticated mutations',()=>{
  it('fetches a fresh token before multipart upload and preserves the exact file and browser boundary',async()=>{
    vi.stubGlobal('window',{location:{origin:'https://mediaos.example'}});
    const native=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({token:'fresh',header:'X-XSRF-TOKEN'})})
      .mockResolvedValueOnce(new Response('{}',{status:200}));
    vi.stubGlobal('fetch',native);
    const {directorMutation}=await import('./localSession');
    const form=new FormData();form.append('file',new Blob(['original-bytes'],{type:'image/png'}),'thumbnail.png');form.append('expectedRevision','0');form.append('confirm','true');
    await directorMutation('/api/v1/episode-packages/test/publishing/thumbnail',{method:'POST',body:form});
    expect(native).toHaveBeenCalledTimes(2);
    expect(native.mock.calls[0][0]).toBe('/api/v1/auth/csrf');
    const init=native.mock.calls[1][1] as RequestInit;
    expect(new Headers(init.headers).get('X-XSRF-TOKEN')).toBe('fresh');
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
    expect(init.body).toBe(form);
    expect(init.credentials).toBe('same-origin');
  });
  it('does not send a mutation when token retrieval fails or repeat a rejected write',async()=>{
    vi.stubGlobal('window',{location:{origin:'https://mediaos.example'}});
    const native=vi.fn().mockResolvedValueOnce({ok:false,status:403});
    vi.stubGlobal('fetch',native);
    const {directorMutation}=await import('./localSession');
    const path='/api/v1/episode-packages/test/publishing/thumbnail';
    await expect(directorMutation(path,{method:'POST',body:new FormData()})).rejects.toThrow('403');
    expect(native).toHaveBeenCalledTimes(1);
    native.mockResolvedValueOnce({ok:true,json:async()=>({token:'fresh',header:'X-XSRF-TOKEN'})})
      .mockResolvedValueOnce(new Response('',{status:403}));
    expect((await directorMutation(path,{method:'POST',body:new FormData()})).status).toBe(403);
    expect(native).toHaveBeenCalledTimes(3);
  });
});
