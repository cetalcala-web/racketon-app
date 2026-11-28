import {useCallback,useEffect,useState} from 'react';
import {Trophy,RefreshCw} from 'lucide-react';
import {supabase} from './supabase';
import {CountrySelect} from './CountrySelect';


type Sport='Tenis'|'Pádel'|'Pickleball';
type Row={position:number;user_id:string;display_name:string;country:string;city:string;rating:number;rating_status:string;matches_played:number;wins:number;losses:number};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:'10px 12px',border:'1px solid #d8d8df',borderRadius:9,background:'#fff',fontSize:14};
const statusLabel=(s:string)=>s==='consolidated'?'Consolidado':s==='calibrating'?'En calibración':'Provisional';
export default function RacketonNationalRanking108({userId,onChallenge}:{userId:string;onChallenge?:(player:{id:string;name:string})=>void}){
 const [sport,setSport]=useState<Sport>('Tenis');
 const [sex,setSex]=useState('all');const [country,setCountry]=useState('');const [city,setCity]=useState('');const [status,setStatus]=useState('all');
 const [rows,setRows]=useState<Row[]>([]);const [page,setPage]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const load=useCallback(async (p:number)=>{
  if(!supabase)return;
  setBusy(true);setError('');
  const {data,error:e}=await supabase.rpc('racketon_leaderboard_108',{p_sport:sport,p_sex:sex,p_country:country,p_city:city.trim(),p_status:status,p_limit:50,p_offset:p*50});
  if(e){setRows([]);setError(e.message);}else{setRows((data||[]) as Row[]);setPage(p);}
  setBusy(false);
 },[sport,sex,country,city,status]);
 useEffect(()=>{void load(0);},[load,userId]);
 return <section style={{maxWidth:1100,margin:'0 auto'}}>
  <div style={{display:'flex',gap:9,flexWrap:'wrap',margin:'0 0 20px'}}>{(['Tenis','Pádel','Pickleball'] as Sport[]).map(s=><button type="button" key={s} onClick={()=>{setSport(s);setPage(0);setRows([]);setError('');}} style={{padding:'12px 20px',borderRadius:12,border:s===sport?'2px solid #c8102e':'1px solid #dedee3',background:s===sport?'#c8102e':'white',fontWeight:700,cursor:'pointer',color:s===sport?'white':'#20202a'}}>{s}</button>)}</div>
  {<div style={{background:'white',border:'1px solid #e7e7eb',borderRadius:16,padding:'clamp(14px,3vw,24px)'}}>
   <div style={{display:'flex',alignItems:'center',gap:12,background:'linear-gradient(120deg,#d20b24,#a70820)',color:'#fff',borderRadius:20,padding:'22px 24px',boxShadow:'0 8px 22px #a7082020'}}><Trophy color="white"/><div><h2 style={{margin:0}}>Clasificación RACKETON · {sport}</h2><p style={{margin:'6px 0 0',fontSize:13,color:'#ffe2e7'}}>Escala {sport==='Tenis'?'RACKETON Tenis':sport==='Pádel'?'0–7':'2–8'} · rating propio RACKETON, no oficial de plataformas externas</p></div></div>
   <div style={{display:'flex',gap:9,flexWrap:'wrap',marginTop:18}}>{[{v:'all',l:'Global'},{v:'male',l:'Masculina'},{v:'female',l:'Femenina'}].map(x=><button key={x.v} type="button" onClick={()=>{setSex(x.v);setPage(0)}} style={{padding:'10px 17px',borderRadius:10,border:sex===x.v?'2px solid #c8102e':'1px solid #ddd',background:sex===x.v?'#fff1f2':'#fff',fontWeight:700,cursor:'pointer'}}>{x.l}</button>)}</div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,margin:'20px 0'}}>
    <label style={{fontSize:13,fontWeight:600}}>País<CountrySelect includeAll style={input} value={country} onChange={setCountry}/></label>
    <label style={{fontSize:13,fontWeight:600}}>Ciudad<input style={input} value={city} maxLength={100} onChange={e=>setCity(e.target.value)} placeholder="Todas"/></label>
    <label style={{fontSize:13,fontWeight:600}}>Estado<select style={input} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="provisional">Provisional</option><option value="calibrating">En calibración</option><option value="consolidated">Consolidado</option></select></label>
    <button type="button" className="outline" disabled={busy} onClick={()=>void load(0)} style={{alignSelf:'end'}}><RefreshCw size={15}/> Actualizar</button>
   </div>
   <p style={{fontSize:12,color:'#64748b'}}>Clasificación experimental. Las autoevaluaciones son provisionales y no acreditan resultados competitivos. Solo aparecen perfiles adultos que han autorizado su visibilidad.</p>
   {error&&<p role="alert" style={{color:'#b42332'}}>Error al cargar la clasificación: {error}</p>}
       <div style={{display:'grid',gap:9}}>{rows.map(r=><article key={r.user_id} style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',padding:14,borderRadius:14,border:r.user_id===userId?'1px solid #e9a0ad':'1px solid #e8e8ea',background:r.user_id===userId?'#fff0f2':'#fff',boxShadow:'0 3px 12px #00000006'}}><strong style={{width:30,color:'#c8102e',fontSize:20,textAlign:'center'}}>{r.position}</strong><span aria-hidden="true" style={{width:44,height:44,borderRadius:'50%',background:'#fce8ec',color:'#c8102e',display:'grid',placeItems:'center',fontWeight:850}}>{(r.display_name||'J').slice(0,2).toUpperCase()}</span><div style={{flex:'1 1 140px',minWidth:0}}><strong>{r.display_name}{r.user_id===userId?' · Tú':''}</strong><div style={{fontSize:12,color:'#667085'}}>{[r.country,r.city].filter(Boolean).join(' · ')}</div><small style={{color:'#667085'}}>{statusLabel(r.rating_status)} · {r.matches_played} PJ · {r.wins} G · {r.losses} P</small></div><div style={{textAlign:'right'}}><small style={{color:'#667085'}}>RATING</small><div style={{fontSize:25,fontWeight:900,color:'#c8102e'}}>{Number(r.rating).toFixed(2)}</div></div>{sport==='Tenis'&&onChallenge&&r.user_id!==userId&&<button type="button" className="outline" onClick={()=>onChallenge({id:r.user_id,name:r.display_name})}>Desafiar</button>}</article>)}</div>
{!busy&&!error&&rows.length===0&&<p style={{padding:20,textAlign:'center',color:'#64748b'}}>No hay jugadores visibles para estos filtros.</p>}
   {busy&&<p role="status">Cargando clasificación…</p>}
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}><button className="outline" type="button" disabled={busy||page===0} onClick={()=>void load(page-1)}>Anterior</button><span style={{fontSize:12}}>Página {page+1}</span><button className="outline" type="button" disabled={busy||rows.length<50} onClick={()=>void load(page+1)}>Siguiente</button></div>
  </div>}
 </section>;
}
