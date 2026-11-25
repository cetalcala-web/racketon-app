import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
type Sport='Pádel'|'Pickleball';
type Player={user_id:string;name:string;team:number;slot:number;accepted:boolean|null};
type Match={id:string;sport:Sport;kind:string;status:string;location:string;proposed_at:string|null;score:number[][]|null;winning_team:number|null;submitted_by:string|null;review_deadline:string|null;players:Player[]};
type Candidate={user_id:string;display_name:string};
const field:React.CSSProperties={width:'100%',padding:10,border:'1px solid #ddd',borderRadius:9,background:'white',boxSizing:'border-box'};
const card:React.CSSProperties={padding:18,border:'1px solid #e5e5ea',borderRadius:14,background:'white',display:'grid',gap:12};
const labels:Record<string,string>={invited:'Esperando aceptación',accepted:'Partido aceptado',declined:'Rechazado',result_pending:'Resultado en revisión',disputed:'Impugnado',confirmed:'Resultado confirmado',cancelled:'Cancelado'};
export default function RacketonDoubles107({userId}:{userId:string}){
 const [sport,setSport]=useState<Sport>('Pádel'),[candidates,setCandidates]=useState<Candidate[]>([]),[matches,setMatches]=useState<Match[]>([]);
 const [partner,setPartner]=useState(''),[rival1,setRival1]=useState(''),[rival2,setRival2]=useState(''),[place,setPlace]=useState(''),[date,setDate]=useState('');
 const [kind,setKind]=useState<'ranking'|'friendly'>('ranking');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[scores,setScores]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{if(!supabase)return;const {data,error}=await supabase.rpc('my_doubles_107');if(error)setNotice(error.message);else setMatches((data||[]) as Match[])},[]);
 useEffect(()=>{void load()},[load,userId]);
 useEffect(()=>{let active=true;async function get(){if(!supabase)return;
 const {data,error}=await supabase.rpc('racketon_sport_leaderboard_106',{p_sport:sport,p_country:'',p_city:'',p_status:'all',p_limit:50,p_offset:0});
 if(!active)return;if(error){setNotice(error.message);return;}
 const mapped=((data||[]) as Array<{user_id:string;display_name:string}>).filter(x=>x.user_id!==userId).map(x=>({user_id:x.user_id,display_name:x.display_name}));
 setCandidates(mapped);setPartner('');setRival1('');setRival2('');
 }void get();return()=>{active=false}},[sport,userId]);
 async function call(name:string,args:Record<string,unknown>){if(!supabase)return;setBusy(true);setNotice('');
 const {error}=await supabase.rpc(name,args);setBusy(false);
 if(error)setNotice('Error: '+error.message);else{setNotice('Operación registrada correctamente.');await load();}
 }
 async function create(e:React.FormEvent){e.preventDefault();if(new Set([userId,partner,rival1,rival2]).size!==4){setNotice('Selecciona cuatro jugadores diferentes.');return;}
 await call('create_doubles_107',{p_sport:sport,p_partner:partner,p_opponent1:rival1,p_opponent2:rival2,p_kind:kind,p_location:place,p_proposed_at:date?new Date(date).toISOString():null});
 }
 function selector(label:string,value:string,set:(x:string)=>void,excluded:string[]){return <label style={{display:'grid',gap:5,fontSize:13}}>{label}<select required style={field} value={value} onChange={e=>set(e.target.value)}><option value="">Selecciona jugador</option>{candidates.filter(c=>c.user_id===value||!excluded.includes(c.user_id)).map(c=><option key={c.user_id} value={c.user_id}>{c.display_name||'Jugador'} · {c.user_id.slice(0,8)}</option>)}</select></label>}
 async function submit(m:Match){const raw=scores[m.id]||'';if(!/^\s*\d{1,3}\s*-\s*\d{1,3}(\s*,\s*\d{1,3}\s*-\s*\d{1,3}){1,2}\s*$/.test(raw)){setNotice('Introduce dos o tres juegos completos.');return;}const sets=raw.split(',').map(x=>x.trim().split('-').map(Number));
 if(sets.length<2||sets.length>3||sets.some(x=>x.length!==2||x.some(v=>!Number.isInteger(v)))){setNotice('Formato: 6-4, 6-3 (o tres sets)');return;}
 if(m.sport==='Pickleball'&&sets.some(([x,y])=>Math.max(x,y)!==Math.max(11,Math.min(x,y)+2)||Math.abs(x-y)<2)){setNotice('Pickleball: juegos a 11 puntos con diferencia de dos.');return;}
 const a=sets.filter(x=>x[0]>x[1]).length,b=sets.filter(x=>x[1]>x[0]).length;
 if((a!==2&&b!==2)||(sets.length===3&&((sets[0][0]>sets[0][1])===(sets[1][0]>sets[1][1])))){setNotice('El partido debe decidirse al mejor de tres sets.');return;}
 await call('submit_doubles_result_107',{p_match:m.id,p_score:sets,p_winning_team:a===2?1:2});
 }
 return <div style={{maxWidth:980,margin:'20px auto',display:'grid',gap:20}}>
 <form style={card} onSubmit={e=>void create(e)}>
 <h2 style={{margin:0}}>Nuevo desafío de dobles</h2>
 <p style={{margin:0,fontSize:13,color:'#666'}}>Los partidos competitivos se registran para el futuro rating; durante las pruebas no modifican el rating oficial. Los cuatro jugadores deben estar evaluados y visibles en el buscador.</p>
 <label>Deporte<select style={field} value={sport} onChange={e=>setSport(e.target.value as Sport)}><option>Pádel</option><option>Pickleball</option></select></label>
 <label>Modalidad<select style={field} value={kind} onChange={e=>setKind(e.target.value as 'ranking'|'friendly')}><option value="ranking">Competitivo (rating en pruebas)</option><option value="friendly">Amistoso (sin rating)</option></select></label>
 {selector('Tu pareja (equipo 1)',partner,setPartner,[rival1,rival2])}
 {selector('Rival 1 (equipo 2)',rival1,setRival1,[partner,rival2])}
 {selector('Rival 2 (equipo 2)',rival2,setRival2,[partner,rival1])}
 <label>Lugar<input style={field} maxLength={180} value={place} onChange={e=>setPlace(e.target.value)}/></label>
 <label>Fecha propuesta<input style={field} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
 <button className="primary" disabled={busy||!partner||!rival1||!rival2}>Invitar a los tres jugadores</button>
 </form>
 <div style={card}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><h2 style={{margin:0}}>Mis partidos de dobles</h2><button className="outline" disabled={busy} onClick={()=>void load()}>Actualizar</button></div>
 {matches.length===0?<p>No hay partidos de dobles todavía.</p>:matches.map(m=>{
 const me=m.players.find(x=>x.user_id===userId);
 const pending=me?.accepted===null&&m.status==='invited';
 const canReview=m.status==='result_pending'&&m.submitted_by!==userId;
 const canFinalize=m.status==='result_pending'&&m.review_deadline&&Date.now()>=new Date(m.review_deadline).getTime();
 return <article key={m.id} style={{border:'1px solid #eee',borderRadius:10,padding:14,display:'grid',gap:10}}>
 <strong>{m.sport} · {m.kind==='ranking'?'Competitivo':'Amistoso'} · {labels[m.status]||m.status}</strong>
 <div style={{fontSize:14}}>Equipo 1: {m.players.filter(p=>p.team===1).map(p=>p.name+(p.accepted===null?' (pendiente)':p.accepted===false?' (rechazó)':'')).join(' + ')}</div>
 <div style={{fontSize:14}}>Equipo 2: {m.players.filter(p=>p.team===2).map(p=>p.name+(p.accepted===null?' (pendiente)':p.accepted===false?' (rechazó)':'')).join(' + ')}</div>
 {m.location&&<span style={{fontSize:13}}>{m.location}</span>}
 {m.score&&<div><strong>Marcador: </strong>{m.score.map(s=>s.join('-')).join(', ')} · Gana equipo {m.winning_team}</div>}
 {m.review_deadline&&<p style={{fontSize:13,margin:0}}>Fin del plazo de impugnación: {new Date(m.review_deadline).toLocaleString('es-ES')}</p>}
 {pending&&<div style={{display:'flex',gap:8}}><button className="primary" disabled={busy} onClick={()=>void call('respond_doubles_107',{p_match:m.id,p_accept:true})}>Aceptar</button><button className="outline" disabled={busy} onClick={()=>void call('respond_doubles_107',{p_match:m.id,p_accept:false})}>Rechazar</button></div>}
 {m.status==='accepted'&&<div style={{display:'grid',gap:8}}><label>{m.sport==='Pickleball'?'Resultado a 11 puntos (mejor de 3 juegos)':'Resultado (ej.: 6-4, 6-3)'}<input style={field} placeholder={m.sport==='Pickleball'?'11-7, 11-9':'6-4, 6-3'} value={scores[m.id]||''} onChange={e=>setScores(s=>({...s,[m.id]:e.target.value}))}/></label><button className="primary" disabled={busy} onClick={()=>void submit(m)}>Registrar resultado</button></div>}
 {canReview&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="outline" disabled={busy} onClick={()=>void call('review_doubles_107',{p_match:m.id,p_action:'confirm'})}>Confirmar marcador</button><button className="outline" disabled={busy} onClick={()=>void call('review_doubles_107',{p_match:m.id,p_action:'dispute'})}>Impugnar resultado</button></div>}
 {canFinalize&&<button className="primary" disabled={busy} onClick={()=>void call('finalize_doubles_107',{p_match:m.id})}>Cerrar acta tras 24 horas</button>}
 {m.status==='disputed'&&<p style={{color:'#a33',margin:0}}>Acta bloqueada por impugnación. Pendiente de resolución administrativa (próxima versión).</p>}
 </article>})}
 </div>{notice&&<p role="status" style={{color:notice.startsWith('Error')?'#a33':'#155e39'}}>{notice}</p>}
 </div>;
}
