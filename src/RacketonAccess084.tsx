import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import ClubRankingsAdmin084 from './ClubRankingsAdmin084';

const card:React.CSSProperties={padding:22,border:'1px solid #e5e7eb',borderRadius:16,background:'#fff',display:'grid',gap:12};
const field:React.CSSProperties={width:'100%',padding:12,border:'1px solid #d4d4d8',borderRadius:9,boxSizing:'border-box'};
const action:React.CSSProperties={background:'#c8102e',color:'#fff',border:0,borderRadius:9,padding:'12px 18px',cursor:'pointer',fontWeight:700};

type Club={id:string;name:string;city:string};
type League={id:string;name:string;format:string};
type Request={id:string;club_name:string;status:string};
export function ClubPortal({userId}:{userId:string}){
 const [clubs,setClubs]=useState<Club[]>([]);const [requests,setRequests]=useState<Request[]>([]);
 const [name,setName]=useState('');const [city,setCity]=useState('');const [email,setEmail]=useState('');const [message,setMessage]=useState('');
 const [error,setError]=useState('');const [success,setSuccess]=useState('');const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  if(!supabase)return;
  const [c,r]=await Promise.all([supabase.from('racketon_clubs').select('id,name,city').order('name'),supabase.from('racketon_club_access_requests').select('id,club_name,status').order('created_at',{ascending:false})]);
  if(c.error)setError(c.error.message);else setClubs((c.data??[]) as Club[]);
  if(r.error)setError(r.error.message);else setRequests((r.data??[]) as Request[]);
 },[]);
 useEffect(()=>{void load()},[userId,load]);
 async function request(e:React.FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');setSuccess('');
  const {error:err}=await supabase.rpc('racketon_request_club_access_081',{p_name:name,p_city:city,p_email:email,p_message:message});
  if(err)setError(err.message);else{setSuccess('Solicitud registrada. El acceso de dirección requiere verificación y aprobación.');setName('');setCity('');setMessage('');await load()}
  setBusy(false);
 }
 return <div style={{display:'grid',gap:18,maxWidth:1050,margin:'20px auto'}}>
  <div style={card}><span style={{fontSize:12,color:'#c8102e',fontWeight:800}}>RACKETON · ACCESO PROFESIONAL</span><h2 style={{margin:0}}>Panel de clubes</h2><p style={{margin:0,color:'#52525b'}}>Solo los responsables autorizados pueden gestionar rankings oficiales, usuarios, torneos e instalaciones. Una cuenta de jugador no concede permisos de dirección.</p></div>
  {error&&<div role="alert" style={{...card,color:'#b91c1c'}}>{error}. Comprueba que has ejecutado el SQL 0014.</div>}
  {success&&<div role="status" style={{...card,color:'#15803d'}}>{success}</div>}
  {clubs.length>0?<><div style={card}><h3 style={{margin:0}}>Clubes que puedes administrar</h3>{clubs.map(c=><div key={c.id}><strong>{c.name}</strong> <span style={{color:'#71717a'}}>{c.city}</span></div>)}</div><ClubRankingsAdmin084 userId={userId}/></>:<div style={card}><h3 style={{margin:0}}>No tienes acceso administrativo a ningún club</h3><p style={{margin:0,color:'#52525b'}}>Puedes solicitar acceso al club que diriges. La solicitud no crea un club ni te asigna permisos automáticamente.</p></div>}
  {clubs.length===0&&<form style={card} onSubmit={request}><h3 style={{margin:0}}>Solicitar alta o acceso profesional</h3><label>Nombre del club<input style={field} required minLength={3} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Localidad<input style={field} maxLength={100} value={city} onChange={e=>setCity(e.target.value)}/></label><label>Correo de contacto<input style={field} required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Tu relación con el club<textarea style={field} maxLength={1000} rows={3} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ej. Director del club"/></label><button style={action} disabled={busy}>{busy?'Enviando...':'Solicitar verificación'}</button></form>}
  {requests.length>0&&<div style={card}><h3 style={{margin:0}}>Mis solicitudes</h3>{requests.map(r=><div key={r.id}>{r.club_name} · <strong>{r.status==='pending'?'Pendiente de verificación':r.status==='approved'?'Aprobada':'Rechazada'}</strong></div>)}</div>}
 </div>;
}
export function PlayerLeagues({userId}:{userId:string}){
 const [leagues,setLeagues]=useState<League[]>([]);const [name,setName]=useState('');const [format,setFormat]=useState('box');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{if(!supabase)return;const {data,error:e}=await supabase.from('racketon_private_leagues').select('id,name,format').order('created_at',{ascending:false});if(e)setError(e.message);else setLeagues((data??[]) as League[])},[]);
 useEffect(()=>{void load()},[userId,load]);
 async function create(e:React.FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');const {error:err}=await supabase.rpc('racketon_create_private_league_081',{p_name:name,p_format:format});if(err)setError(err.message);else{setName('');await load()}setBusy(false)}
 return <div style={{display:'grid',gap:16,maxWidth:900,margin:'20px auto'}}><div style={card}><h2 style={{margin:0}}>Mis ligas privadas</h2><p style={{margin:0,color:'#52525b'}}>Organiza competiciones entre amigos. Estas ligas son independientes de los rankings oficiales de los clubes.</p></div>{error&&<div role="alert" style={{...card,color:'#b91c1c'}}>{error}. Comprueba que has ejecutado el SQL 0014.</div>}
 <form style={card} onSubmit={create}><h3 style={{margin:0}}>Crear liga privada</h3><label>Nombre<input required minLength={3} maxLength={120} style={field} value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Liga de los viernes"/></label><label>Formato<select style={field} value={format} onChange={e=>setFormat(e.target.value)}><option value="box">Por grupos</option><option value="ladder">Escalera de desafíos</option><option value="points">Liga por puntos</option><option value="manual">Manual</option></select></label><button style={action} disabled={busy}>{busy?'Creando...':'Crear liga'}</button><small style={{color:'#71717a'}}>La inscripción de participantes y el calendario se incorporarán en una siguiente fase.</small></form>
 <div style={card}><h3 style={{margin:0}}>Ligas creadas</h3>{leagues.length?leagues.map(l=><div key={l.id} style={{padding:12,border:'1px solid #e5e7eb',borderRadius:9}}><strong>{l.name}</strong><div style={{fontSize:12,color:'#71717a'}}>Formato: {l.format} · Borrador</div></div>):<p style={{color:'#71717a'}}>Aún no tienes ligas privadas.</p>}</div></div>;
}
