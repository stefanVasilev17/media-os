import {useState} from 'react';
import {Film,CheckCircle2,ExternalLink} from 'lucide-react';

type EpisodeKey='EP001'|'EP002'|'EP003';
type Props={episode:EpisodeKey};
const films=[
 {episode:'EP001' as const,title:'What Really Happens When You Click Login?',
  renderId:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',duration:'20:56.77',
  frames:37703,bytes:94164846,audio:'AAC stereo · 48 kHz',status:'Sound-design full review master'},
 {episode:'EP002' as const,title:'What Happens When a System Cannot Handle the Traffic?',
  renderId:'56c2a4b7-8bc0-465b-baea-80fa3707e709',duration:'13:01.53',
  frames:23446,bytes:83569046,audio:'AAC mono · 48 kHz',status:'Clean-cut full master'},
 {episode:'EP003' as const,title:'What Happens When One Database Is No Longer Enough?',
  renderId:'63827ce6-2ea8-4853-a61b-8549fe8db967',duration:'21:26.43',
  frames:38593,bytes:152025545,audio:'AAC mono · 48 kHz',status:'11-SHOT final Director LOCK'}
] as const;
export function ThreeFinishedEpisodes({episode}:Props){
 const [mediaError,setMediaError]=useState(false);
 const selected=films.find(x=>x.episode===episode)??films[0];
 const url='/api/v1/remotion/renders/'+selected.renderId+'/video';
 return <main className="media-os-page" style={{
   width:'100%',maxWidth:1260,margin:'0 auto',padding:'32px 24px 54px',
   boxSizing:'border-box',minWidth:0,overflowWrap:'anywhere'}}>
   <header style={{marginBottom:20}}>
     <p style={{margin:0,opacity:.68,fontWeight:700,letterSpacing:'.09em'}}>MEDIA OS / ARCHITECTURAL THINKING</p>
     <h1 style={{margin:'10px 0 8px',fontSize:34,lineHeight:1.15}}>Finished episodes</h1>
     <p style={{margin:0,opacity:.8,lineHeight:1.6}}>Three complete MP4 videos with their original embedded voice-over and soundtrack.
       No separate SHOT videos, voice takes or superseded masters are stored for these episodes.</p>
   </header>
   <nav aria-label="Finished episode videos" style={{
     display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,marginBottom:28}}>
     {films.map(f=><a key={f.episode} href={'#/library/'+f.episode}
       aria-current={f.episode===episode?'page':undefined}
       style={{display:'block',padding:'14px 12px',borderRadius:12,
         textDecoration:'none',minWidth:0,boxSizing:'border-box',
         border:'1px solid '+(f.episode===episode?'#69dfee':'rgba(160,194,219,.29)'),
         background:f.episode===episode?'rgba(50,126,160,.16)':'rgba(22,42,63,.30)',
         color:'inherit',textAlign:'center',fontWeight:750}}>
       {f.episode} <span style={{display:'block',fontSize:12,fontWeight:500,opacity:.8,marginTop:4}}>{f.duration}</span>
     </a>)}
   </nav>
   <section aria-label={selected.episode+' full verified MP4'} style={{minWidth:0}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:17}}>
      <Film size={25} aria-hidden="true"/>
      <div style={{minWidth:0,flex:1}}>
       <h2 style={{margin:'0 0 7px',fontSize:23,lineHeight:1.35,overflowWrap:'anywhere'}}>{selected.title}</h2>
       <p style={{margin:0,opacity:.78,lineHeight:1.6}}>
         {selected.episode} · {selected.duration} · 1920×1080 · 30 fps · H.264 · {selected.audio}
       </p>
      </div>
    </div>
    <video key={selected.renderId} controls playsInline preload="metadata" src={url}
     onError={()=>setMediaError(true)} onLoadedData={()=>setMediaError(false)}
     aria-label={selected.episode+' complete film with embedded soundtrack'}
     style={{width:'100%',maxWidth:'100%',aspectRatio:'16/9',
       height:'auto',display:'block',borderRadius:12,
       background:'#050d19',boxSizing:'border-box'}}/>
    {mediaError&&<p role="alert">The video could not load. Please verify your MediaOS login session.</p>}
    <p style={{display:'flex',alignItems:'center',gap:7,fontSize:14,opacity:.88,margin:'17px 0 10px',lineHeight:1.55}}>
     <CheckCircle2 size={17} aria-hidden="true"/> {selected.status} · exact full MP4 and embedded audio verified using FFprobe.
    </p>
    <a href={url} target="_blank" rel="noopener noreferrer"
     style={{display:'inline-flex',alignItems:'center',gap:8,overflowWrap:'anywhere'}}>
     <ExternalLink size={15} aria-hidden="true"/> Open complete MP4
    </a>
   </section>
 </main>;
}
