import { useCallback, useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { supabase } from './supabase';
import { CountrySelect } from './CountrySelect';

type Row = {user_id:string;display_name:string;country:string;city:string;nationality:string;rating:number;rating_status:string;matches_played:number;wins:number;losses:number;position:number};
const control:React.CSSProperties={width:'100%',padding:'10px 12px',border:'1px solid #dedee3',borderRadius:9,background:'#fff',color:'#24242a',fontSize:14,boxSizing:'border-box'};
const formatStatus=(s:string)=>s==='consolidated'?'Consolidado':s==='calibrating'?'En calibración':'Provisional';
export default function TennisLeaderboard({userId}:{userId:string}){
 const [country,setCountry]=useState('');const [city,setCity]=useState('');const [status,setStatus]=useState('all');
 const [rows,setRows]=useState<Row[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [page,setPage]=useState(0);
 const load=useCallback(async (offset:number)=>{
  if(!supabase)return;
  setBusy(true);setError('');
  const {data,error:err}=await supabase.rpc('tennis_leaderboard_061',{p_country:country,p_city:city.trim(),p_status:status,p_limit:50,p_offset:offset*50});
  setBusy(false);
  if(err){setRows([]);setError(err.message);}else{setRows((data??[]) as Row[]);setPage(offset);}
 },[country,city,status]);
 useEffect(()=>{void load(0);},[load,userId]);
 return <section style={{background:'#fff',border:'1px solid #e7e7eb',borderRadius:15,padding:'clamp(14px,3vw,24px)',margin:'24px auto',maxWidth:1100}}>
  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}><Trophy color="#c8102e"/><div><h2 style={{margin:0,fontSize:22}}>Clasificación mundial · Tenis</h2><p style={{margin:'5px 0 0',color:'#666',fontSize:13}}>Ordenada por RACKETON Rating. Incluye solo perfiles que autorizan aparecer públicamente.</p></div></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:16}}>
   <label style={{fontSize:13,fontWeight:600}}>País de residencia<CountrySelect style={control} includeAll value={country} onChange={setCountry}/></label>
   <label style={{fontSize:13,fontWeight:600}}>Ciudad<input style={control} value={city} maxLength={100} onChange={e=>setCity(e.target.value)} placeholder="Todas las ciudades"/></label>
   <label style={{fontSize:13,fontWeight:600}}>Estado del rating<select style={control} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="provisional">Provisionales</option><option value="calibrating">En calibración</option><option value="consolidated">Consolidados</option></select></label>
   <div style={{display:'flex',alignItems:'end'}}><button type="button" className="outline" onClick={()=>void load(0)} disabled={busy}><RefreshCw size={16}/> Actualizar</button></div>
  </div>
  <p style={{fontSize:12,color:'#666',lineHeight:1.5}}>Clasificación experimental por rating. Los jugadores provisionales aparecen identificados; todavía no constituye una clasificación competitiva verificada. Los resultados, victorias y derrotas se activarán cuando implementemos la confirmación de partidos.</p>
  {error&&<p role="alert" style={{color:'#b42332'}}>No se pudo cargar la clasificación: {error}. Comprueba que has ejecutado el SQL 0009.</p>}
  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',minWidth:680,fontSize:14}}><thead><tr style={{background:'#f7f7f8'}}>{['#','Jugador','País / ciudad','Rating','Estado','PJ','G','P'].map(h=><th key={h} style={{padding:10,borderBottom:'1px solid #e7e7eb'}}>{h}</th>)}</tr></thead><tbody>
   {rows.map(r=><tr key={r.user_id} style={{borderBottom:'1px solid #ededf0',background:r.user_id===userId?'#fff5f6':'transparent'}}><td style={{padding:10,fontWeight:700}}>{r.position}</td><td style={{padding:10}}><strong>{r.display_name}</strong>{r.user_id===userId?' (tú)':''}{r.nationality&&<div style={{fontSize:11,color:'#666'}}>Nacionalidad: {r.nationality}</div>}</td><td style={{padding:10}}>{r.country}<div style={{fontSize:12,color:'#777'}}>{r.city}</div></td><td style={{padding:10,fontWeight:700,color:'#c8102e'}}>{Number(r.rating).toFixed(2)}</td><td style={{padding:10,fontSize:12}}>{formatStatus(r.rating_status)}</td><td style={{padding:10}}>{r.matches_played}</td><td style={{padding:10}}>{r.wins}</td><td style={{padding:10}}>{r.losses}</td></tr>)}
  </tbody></table></div>
  {!busy&&!error&&rows.length===0&&<p style={{padding:20,textAlign:'center',color:'#777'}}>No hay jugadores visibles con estos filtros.</p>}
  {busy&&<p role="status">Cargando clasificación…</p>}
  <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:14}}><button className="outline" type="button" disabled={busy||page===0} onClick={()=>void load(page-1)}>Anterior</button><span style={{fontSize:12,color:'#777',alignSelf:'center'}}>Página {page+1}</span><button className="outline" type="button" disabled={busy||rows.length<50} onClick={()=>void load(page+1)}>Siguiente</button></div>
 </section>;
}
