import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

type Challenge = { id:string; challenger_id:string; challenged_id:string; kind:'friendly'|'ranking'; ranking_id:string|null; ranking_name:string|null; proposed_at:string|null; location:string; message:string; status:string; created_at:string; challenger_name:string; challenged_name:string };
type Ranking = {id:string;name:string};
const field:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:11,border:'1px solid #ddd',borderRadius:9,background:'#fff',color:'#222'};
const card:React.CSSProperties={padding:18,border:'1px solid #e5e5ea',borderRadius:14,background:'#fff',display:'grid',gap:12};
const statusNames:Record<string,string>={pending:'Pendiente',accepted:'Aceptado',declined:'Rechazado',cancelled:'Cancelado'};
export default function TennisChallenges({userId,opponent,onClose}:{userId:string;opponent?:{id:string;name:string}|null;onClose?:()=>void}){
 const [items,setItems]=useState<Challenge[]>([]),[rankings,setRankings]=useState<Ranking[]>([]);
 const [kind,setKind]=useState<'friendly'|'ranking'>('friendly'),[ranking,setRanking]=useState('');
 const [date,setDate]=useState(''),[location,setLocation]=useState(''),[message,setMessage]=useState('');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.rpc('my_tennis_challenges');setLoading(false);if(error)setNotice(error.message);else setItems((data??[]) as Challenge[])},[]);
 useEffect(()=>{void load()},[load,userId]);
 useEffect(()=>{let active=true;setKind('friendly');setRanking('');setRankings([]);if(!opponent||!supabase)return;void supabase.rpc('shared_tennis_rankings',{p_opponent:opponent.id}).then(({data,error})=>{if(active){if(error)setNotice(error.message);else setRankings((data??[]) as Ranking[])}});return()=>{active=false}},[opponent?.id]);
 async function send(e:React.FormEvent){e.preventDefault();if(!supabase||!opponent)return;
 if(kind==='ranking'&&!ranking){setNotice('Selecciona un ranking compartido.');return;}
 setBusy(true);setNotice('');const {error}=await supabase.rpc('create_tennis_challenge',{p_opponent:opponent.id,p_kind:kind,p_ranking_id:kind==='ranking'?ranking:null,p_proposed_at:date?new Date(date).toISOString():null,p_location:location.trim(),p_message:message.trim()});setBusy(false);
 if(error){setNotice('No se pudo enviar: '+error.message);return;}
 setNotice('¡Desafío enviado!');setDate('');setLocation('');setMessage('');await load();
 }
 async function respond(id:string,action:'accepted'|'declined'|'cancelled'){if(!supabase)return;setBusy(true);setNotice('');const {error}=await supabase.rpc('respond_tennis_challenge',{p_challenge_id:id,p_action:action});setBusy(false);if(error)setNotice(error.message);else await load()}
 return <div style={{display:'grid',gap:18,maxWidth:950,margin:'20px auto 50px'}}>
  {opponent&&<form onSubmit={e=>void send(e)} style={card}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 style={{margin:0}}>Desafiar a {opponent.name}</h2>{onClose&&<button type="button" className="outline" onClick={onClose}>Cerrar</button>}</div>
   <label style={{display:'grid',gap:6}}>Tipo de partido<select style={field} value={kind} onChange={e=>{setKind(e.target.value as 'friendly'|'ranking');setRanking('')}}><option value="friendly">Partido amistoso</option>{rankings.length>0&&<option value="ranking">Partido de ranking</option>}</select></label>
   {kind==='ranking'&&<label style={{display:'grid',gap:6}}>Ranking compartido<select required style={field} value={ranking} onChange={e=>setRanking(e.target.value)}><option value="">Selecciona ranking</option>{rankings.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}
   {rankings.length===0&&<p style={{fontSize:13,color:'#666',margin:0}}>No compartís ningún ranking todavía. Puedes proponer un amistoso.</p>}
   <label style={{display:'grid',gap:6}}>Fecha y hora propuestas (opcional)<input style={field} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label style={{display:'grid',gap:6}}>Lugar o club (opcional)<input style={field} maxLength={180} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Ej. Pistas municipales, Alcalá"/></label>
   <label style={{display:'grid',gap:6}}>Mensaje (opcional)<textarea style={field} rows={3} maxLength={500} value={message} onChange={e=>setMessage(e.target.value)} placeholder="¿Te apetece jugar el sábado?"/></label>
   <button type="submit" className="primary" disabled={busy}>{busy?'Enviando…':'Enviar desafío'}</button>
  </form>}
  <div style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 style={{margin:0}}>Mis desafíos de tenis</h2><button type="button" className="outline" onClick={()=>void load()} disabled={loading}>Actualizar</button></div>
   {loading?<p>Cargando desafíos…</p>:items.length===0?<p style={{color:'#666'}}>Todavía no tienes desafíos.</p>:items.map(c=>{const incoming=c.challenged_id===userId;const other=incoming?c.challenger_name:c.challenged_name;return <article key={c.id} style={{border:'1px solid #eee',borderRadius:10,padding:14,display:'grid',gap:8}}>
    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}><strong>{incoming?'De: ':'Para: '}{other}</strong><span>{statusNames[c.status]??c.status}</span></div>
    <div style={{fontSize:14,color:'#555'}}>{c.kind==='ranking'?`Ranking: ${c.ranking_name??'Ranking'}`:'Amistoso'}{c.proposed_at?` · ${new Date(c.proposed_at).toLocaleString('es-ES')}`:''}{c.location?` · ${c.location}`:''}</div>
    {c.message&&<p style={{margin:0,fontSize:14}}>{c.message}</p>}
    {c.status==='pending'&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{incoming?<><button className="primary" type="button" disabled={busy} onClick={()=>void respond(c.id,'accepted')}>Aceptar</button><button className="outline" type="button" disabled={busy} onClick={()=>void respond(c.id,'declined')}>Rechazar</button></>:<button className="outline" type="button" disabled={busy} onClick={()=>void respond(c.id,'cancelled')}>Cancelar desafío</button>}</div>}
   </article>})}
  </div>
  {notice&&<p role="status" style={{color:notice.startsWith('¡')?'#137442':'#a33',fontWeight:600}}>{notice}</p>}
  <p style={{fontSize:13,color:'#666'}}>Aceptar un desafío todavía no registra un resultado ni modifica el rating. La confirmación del partido y su resultado se incorporarán en la siguiente versión.</p>
 </div>;
}
