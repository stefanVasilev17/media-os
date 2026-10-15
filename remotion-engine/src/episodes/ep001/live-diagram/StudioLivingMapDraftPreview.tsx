import React from 'react';
import {Html5Audio, Sequence, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {ATBackground, AT_FONT} from '../../../components/architectural-thinking/ATVisualPrimitives';
import {ATCameraRig, ATPrimaryNode} from '../../../components/architectural-thinking/ATArchitecturePrimitives';

const voiceClip=z.object({
  src:z.string().url(),fromFrame:z.number().int().nonnegative(),
  durationInFrames:z.number().int().positive(),
});
export const studioLivingMapDraftSchema=z.object({
  shotKey:z.string().default(''),shotTitle:z.string().default('Architecture'),
  focusNode:z.string().default('API Gateway'),
  routeNodes:z.array(z.string()).default(['Client','API Gateway','Auth Service']),
  cameraMode:z.enum(['FOCUS','FOLLOW','WIDE']).default('FOCUS'),
  annotation:z.string().default(''),
  audioClips:z.array(voiceClip).default([]),
  durationInFrames:z.number().int().positive().default(600),
});
type Props=z.infer<typeof studioLivingMapDraftSchema>;
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const fade=(frame:number,a:number,b:number)=>interpolate(frame,[a,Math.max(a+1,b)],[0,1],{
  easing:Easing.inOut(Easing.cubic),extrapolateLeft:'clamp',extrapolateRight:'clamp'
});

export const StudioLivingMapDraftPreview:React.FC<Props>=({
  shotKey,shotTitle,focusNode,routeNodes,cameraMode,annotation,audioClips,durationInFrames
})=>{
  const frame=useCurrentFrame();
  const d=Math.max(120,durationInFrames);
  const nodes=(routeNodes.length>0?routeNodes:['Client',focusNode,'Service']).slice(0,4);
  const index=Math.max(0,nodes.findIndex(n=>n.toLowerCase()===focusNode.toLowerCase()));
  const reveal=fade(frame,0,55);
  const focus=fade(frame,34,Math.min(160,d*.3));
  const route=fade(frame,55,Math.round(d*.72));
  const cameraPush=cameraMode==='WIDE'?.025:cameraMode==='FOLLOW'?.045:.09;
  const centers=nodes.map((_,i)=>130+(1920-260)/Math.max(1,nodes.length)*(i+.5));
  const packetX=centers[0]+(centers[centers.length-1]-centers[0])*route;
  return <ATBackground>
    <ATCameraRig scale={1+cameraPush*focus} x={cameraMode==='FOLLOW'?-80*route:-(index-1)*28*focus} y={-18*focus}>
      <div style={{position:'absolute',inset:0,opacity:.18}}>
        <svg width="1920" height="1080">
          {Array.from({length:15},(_,i)=><line key={'h'+i} x1={0} y1={150+i*58} x2={1920} y2={150+i*58} stroke="#345270" strokeWidth={.6}/>)}
          {Array.from({length:26},(_,i)=><line key={'v'+i} x1={100+i*70} y1={0} x2={100+i*70} y2={1080} stroke="#345270" strokeWidth={.6}/>)}
        </svg>
      </div>
      <svg width="1920" height="1080" style={{position:'absolute',inset:0,zIndex:4}}>
        {nodes.slice(0,-1).map((_,i)=><g key={i} opacity={reveal*.85}>
          <line x1={centers[i]+108} y1={566} x2={centers[i+1]-108} y2={566} stroke="#38658C" strokeWidth={4} strokeLinecap="round"/>
          <line x1={centers[i]+108} y1={566} x2={centers[i]+108+(centers[i+1]-centers[i]-216)*clamp(route*nodes.length-i)} y2={566}
            stroke="#38E3AA" strokeWidth={5} strokeLinecap="round" opacity={.86}/>
        </g>)}
        <circle cx={packetX} cy={566} r={16} fill="#3BF1AB" opacity={reveal}/>
        <circle cx={packetX} cy={566} r={30} fill="none" stroke="#3BF1AB" strokeWidth={3} opacity={reveal*.25}/>
      </svg>
      {nodes.map((node,i)=>{
        const active=i===index?focus:Math.max(.08,reveal*.18);
        const arrived=clamp((route*nodes.length-i)*1.2);
        return <div key={node+'-'+i} style={{position:'absolute',left:centers[i]-100,top:456,width:200,zIndex:6,opacity:reveal,transform:'translateY('+((1-reveal)*18)+'px)'}}>
          <div style={{borderRadius:20,minHeight:207,border:'2px solid rgba('+(i===index?'147,120,254':'58,121,181')+','+(.36+active*.58)+')',
            background:'linear-gradient(150deg,rgba(13,37,64,.98),rgba(7,17,32,.99))',
            boxShadow:'0 0 '+(14+active*32)+'px rgba(92,151,242,'+(.05+active*.19)+')',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:12,textAlign:'center'}}>
            <div style={{width:58,height:58,borderRadius:17,border:'1px solid rgba(157,194,255,.4)',background:'rgba(64,105,176,.16)',
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:790,color:'#A9D5FC',fontSize:26,marginBottom:18}}>{i+1}</div>
            <div style={{fontFamily:AT_FONT,fontWeight:800,color:'#ECF5FF',fontSize:Math.min(24,400/Math.max(16,node.length)),lineHeight:1.15}}>{node}</div>
            <div style={{fontFamily:AT_FONT,marginTop:12,letterSpacing:'.10em',fontWeight:700,fontSize:10,color:i===index?'#BBAAFF':'#65CCB0'}}>
              {arrived>.6?'REQUEST ARRIVED':'STANDBY'}</div>
          </div>
        </div>;
      })}
      <ATPrimaryNode title={focusNode} subtitle="THE CURRENT ARCHITECTURAL FOCUS"
        reveal={fade(frame,12,38)*Math.min(1,Math.max(0,(d-frame)/38))}
        active={focus} left="50%" top={165} width={560} height={180}
        compact micro visualScale={1} quiet={.1} zIndex={10}>
        <div style={{textAlign:'center',fontFamily:AT_FONT,fontSize:16,color:'#A9BFE2'}}>The request moves through the living system</div>
      </ATPrimaryNode>
      <div style={{position:'absolute',top:71,left:96,zIndex:15,color:'#829FBF',fontFamily:AT_FONT,fontSize:16,fontWeight:760,letterSpacing:'.14em'}}>
        {shotKey} · STUDIO DRAFT</div>
      <div style={{position:'absolute',bottom:90,left:110,right:110,zIndex:15,display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:AT_FONT}}>
        <div style={{fontSize:25,fontWeight:790,color:'#F6FAFF',maxWidth:1130}}>{shotTitle}</div>
        <div style={{fontSize:13,color:'#8CAAC5',letterSpacing:'.10em'}}>PREVIEW ONLY · NOT DIRECTOR LOCKED</div>
      </div>
      {annotation&&<div style={{position:'absolute',bottom:155,left:110,zIndex:15,fontFamily:AT_FONT,
        fontSize:18,color:'#9EBAD4',maxWidth:1080,opacity:fade(frame,50,90)}}>{annotation.slice(0,170)}</div>}
    </ATCameraRig>
    {audioClips.map((clip,i)=><Sequence key={clip.src+'-'+i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}>
      <Html5Audio src={clip.src}/>
    </Sequence>)}
  </ATBackground>;
};
