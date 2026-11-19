import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
type Challenge={id:string;challenger_id:string;challenged_id:string;challenger_name:string;challenged_name:string;status:string;kind:string};
type Result={challenge_id:string;submitted_by:string;sets:number[][];winner_id:string;status:'pending'|'confirmed'|'disputed';submitted_at:string;confirmed_at:string|null};
const panel:React.CSSProperties={border:'1px solid #e4e4e7',borderRadius:14,padding:18,background:'#fff',display:'grid',gap:12};
const input:React.CSSProperties={width:64,padding:10,border:'1px solid #d4d4d8',borderRadius:8,background:'#fff',fontWeight:800,fontSize:18,textAlign:'center'};
export default function TennisResults({userId}:{userId:string}){
 const [challenges,setChallenges]=useState<Challenge[]>([]),[results,setResults]=useState<Result[]>([]);
 const [stats,setStats]=useState({played:0,wins:0,losses:0,pending:0});
 const [editing,setEditing]=useState<string|null>(null),[sets,setSets]=useState<string[][]>([['',''],['','']]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{if(!supabase)return;setLoading(true);
  const [c,r,s]=await Promise.all([supabase.rpc('my_tennis_challenges'),supabase.rpc('my_tennis_results_070'),supabase.rpc('my_tennis_stats_070')]);
  setLoading(false);const err=c.error||r.error||s.error;
  if(err){setNotice('Error al consultar resultados: '+err.message);return;}
  setChallenges(((c.data??[]) as Challenge[]).filter(x=>x.status==='accepted'));
  setResults((r.data??[]) as Result[]);
  const x=Array.isArray(s.data)?s.data[0]:null;
  setStats({played:Number(x?.played??0),wins:Number(x?.wins??0),losses:Number(x?.losses??0),pending:Number(x?.pending??0)});
 },[]);
 useEffect(()=>{void load()},[load,userId]);
 const resultFor=(id:string)=>results.find(r=>r.challenge_id===id);
 const nameFor=(c:Challenge,id:string)=>id===c.challenger_id?c.challenger_name:c.challenged_name;
 const scoreboard=(c:Challenge,pairs:(number|string)[][],editable=false)=><div style={{border:'1px solid #d4d4d8',borderRadius:14,overflow:'hidden',background:'#18181b',color:'#fff'}}><div style={{display:'grid',gridTemplateColumns:`minmax(130px,1fr) repeat(${pairs.length},70px)`,padding:'12px 14px',gap:6,alignItems:'center',fontSize:12,color:'#f4b7bf'}}><span>MARCADOR · TENIS</span>{pairs.map((_,i)=><span key={i} style={{textAlign:'center'}}>SET {i+1}</span>)}</div>{[0,1].map(j=><div key={j} style={{display:'grid',gridTemplateColumns:`minmax(130px,1fr) repeat(${pairs.length},70px)`,gap:6,alignItems:'center',padding:'12px 14px',borderTop:'1px solid #3f3f46'}}><strong style={{overflowWrap:'anywhere',fontSize:14}}>{j===0?c.challenger_name:c.challenged_name}</strong>{pairs.map((pair,i)=><div key={i} style={{textAlign:'center'}}>{editable?<select aria-label={`Set ${i+1}, ${j===0?c.challenger_name:c.challenged_name}`} value={String(pair[j])} style={input} onChange={e=>setSets(old=>old.map((p,k)=>k===i?p.map((v,l)=>l===j?e.target.value:v):p))}><option value=''>–</option>{Array.from({length:8},(_,n)=><option key={n} value={n}>{n}</option>)}</select>:<strong style={{fontSize:23}}>{pair[j]}</strong>}</div>)}</div>)}</div>;
 async function submit(id:string){if(!supabase)return;const parsed=sets.map(pair=>pair.map(x=>Number(x)));
  if(sets.some(pair=>pair.some(x=>x.trim()===''))){setNotice('Completa todos los juegos de cada set.');return;}
  setBusy(true);setNotice('');const {error}=await supabase.rpc('submit_tennis_result',{p_challenge_id:id,p_sets:parsed});setBusy(false);
  if(error){setNotice(error.message);return;}setEditing(null);setNotice('Marcador enviado. Pendiente de confirmación del rival.');await load();}
 async function review(id:string,action:'confirm'|'dispute'){if(!supabase)return;setBusy(true);setNotice('');
  const {error}=await supabase.rpc('review_tennis_result',{p_challenge_id:id,p_action:action});setBusy(false);
  if(error){setNotice(error.message);return;}setNotice(action==='confirm'?'Resultado confirmado.':'Resultado rechazado; el autor puede corregirlo.');await load();}
 function start(id:string,r?:Result){setEditing(id);setSets(r?r.sets.map(s=>s.map(String)):[['',''],['','']]);setNotice('');}
 return <section style={{display:'grid',gap:16,margin:'24px auto',maxWidth:950}}>
  <div style={panel}><h2 style={{margin:0}}>Resultados e historial de tenis</h2>
   <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><strong>Partidos: {stats.played}</strong><span>Victorias: {stats.wins}</span><span>Derrotas: {stats.losses}</span><span>Pendientes: {stats.pending}</span><span>Victorias: {stats.played?Math.round(stats.wins/stats.played*100):0}%</span></div>
   <small style={{color:'#666'}}>Solo cuentan los resultados confirmados por ambos jugadores. El rating experimental se actualiza al confirmar, si está instalada la migración 0011.</small>
   <button type="button" className="outline" disabled={loading} onClick={()=>void load()} style={{justifySelf:'start'}}>Actualizar resultados</button>
  </div>
  {loading?<p>Cargando resultados…</p>:challenges.length===0?<div style={panel}>Acepta un desafío para poder registrar un partido.</div>:challenges.map(c=>{
   const r=resultFor(c.id);const other=nameFor(c,c.challenger_id===userId?c.challenged_id:c.challenger_id);
   const canEdit=!r||r.status==='disputed'&&r.submitted_by===userId;
   return <article key={c.id} style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>Contra {other}</strong><span>{c.kind==='ranking'?'Partido de ranking':'Amistoso'}</span></div>
    {r?<>{scoreboard(c,r.sets)}
     <div>Ganador: <strong>{nameFor(c,r.winner_id)}</strong> · {r.status==='confirmed'?'Confirmado':r.status==='disputed'?'Rechazado, pendiente de corrección':'Pendiente de confirmación'}</div>
     {r.status==='pending'&&r.submitted_by!==userId&&<div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="primary" disabled={busy} onClick={()=>void review(c.id,'confirm')}>Confirmar resultado</button><button className="outline" disabled={busy} onClick={()=>void review(c.id,'dispute')}>Rechazar marcador</button></div>}
     {r.status==='pending'&&r.submitted_by===userId&&<small>Esperando la confirmación del rival.</small>}
    </>:<p style={{margin:0,color:'#555'}}>Todavía no se ha registrado el marcador.</p>}
    {canEdit&&editing!==c.id&&<button type="button" className="outline" style={{justifySelf:'start'}} onClick={()=>start(c.id,r)}>{r?'Corregir marcador':'Registrar resultado'}</button>}
    {editing===c.id&&<div style={{display:'grid',gap:10,borderTop:'1px solid #eee',paddingTop:12}}>
     <strong>Introduce los juegos de cada set</strong><small>Selecciona los juegos en el marcador. Se permiten dos o tres sets estándar.</small>
     {scoreboard(c,sets,true)}
     <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{sets.length===2&&<button className="outline" type="button" onClick={()=>setSets(s=>[...s,['','']])}>Añadir tercer set</button>}{sets.length===3&&<button className="outline" type="button" onClick={()=>setSets(s=>s.slice(0,2))}>Quitar tercer set</button>}</div>
     <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="primary" disabled={busy} type="button" onClick={()=>void submit(c.id)}>Enviar marcador</button><button className="outline" type="button" onClick={()=>setEditing(null)}>Cancelar</button></div>
    </div>}
   </article>;
  })}
  {notice&&<p role="status" style={{color:notice.includes('Error')?'#a33':'#333'}}>{notice}</p>}
 </section>;
}
