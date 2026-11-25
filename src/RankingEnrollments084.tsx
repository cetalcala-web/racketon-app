import PlayerRanking182 from './PlayerRanking182';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
type Enrollment={id:string;ranking_id:string;player_id:string;status:string;origin:string;invited_email:string|null};
type Ranking={id:string;club_id:string;name:string;enrollment_open:boolean};
type Club={id:string;name:string;city:string};
const card:React.CSSProperties={background:'#fff',border:'1px solid #e4e4e7',borderRadius:14,padding:18,display:'grid',gap:12};
const button:React.CSSProperties={padding:'10px 14px',background:'#c8102e',color:'#fff',border:0,borderRadius:9,cursor:'pointer',fontWeight:700};
const field:React.CSSProperties={padding:11,border:'1px solid #ddd',borderRadius:9,width:'100%',boxSizing:'border-box'};
const status=(s:string)=>({pending_club:'Pendiente de aprobación del club',pending_player:'Pendiente de aceptación del jugador',active:'Inscripción activa',rejected:'Rechazada',declined:'Rechazada por el jugador',withdrawn:'Baja voluntaria'} as Record<string,string>)[s]||s;
export function ClubEnrollmentAdmin084({rankingId}:{rankingId:string}){
 const [ranking,setRanking]=useState<Ranking|null>(null),[items,setItems]=useState<Enrollment[]>([]),[email,setEmail]=useState(''),[bulk,setBulk]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const db=supabase;if(!db)return;
 const [a,b]=await Promise.all([db.from('racketon_club_rankings').select('id,club_id,name,enrollment_open').eq('id',rankingId).single(),db.from('racketon_ranking_enrollments').select('id,ranking_id,player_id,status,origin,invited_email').eq('ranking_id',rankingId).order('created_at',{ascending:false})]);
 if(a.error||b.error){setError(a.error?.message||b.error?.message||'Error al cargar');return}
 setRanking(a.data as Ranking);setItems((b.data||[]) as Enrollment[])},[rankingId]);
 useEffect(()=>{void load()},[load]);
 async function run(fn:string,args:Record<string,unknown>,message:string){const db=supabase;if(!db)return;setBusy(true);setError('');setNotice('');
 try{const {error:e}=await db.rpc(fn,args).abortSignal(AbortSignal.timeout(20000));if(e)setError(e.message);else{setNotice(message);await load()}}catch(e){setError("No se pudo confirmar la operación. Actualiza antes de repetirla. "+String(e))}finally{setBusy(false)}}
 const share=new URL(window.location.origin);share.searchParams.set('ranking',rankingId);
 async function inviteBulk(){const db=supabase;if(!db)return;const emails=[...new Set(bulk.split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean))];if(!emails.length)return;setBusy(true);setError('');setNotice('');let ok=0;const failures:string[]=[];try{for(const address of emails){try{const {error}=await db.rpc('racketon_invite_ranking_084',{p_ranking:rankingId,p_email:address}).abortSignal(AbortSignal.timeout(20000));if(error)failures.push(address+': '+error.message);else ok++}catch{failures.push(address+': estado no confirmado')}}setNotice(ok+' invitaciones procesadas');setError(failures.join(' | '));await load()}finally{setBusy(false)}}
 return <section style={card}><h3 style={{margin:0}}>Participantes e invitaciones</h3>
 <p style={{margin:0,color:'#555',fontSize:13}}>Nadie entra en el ranking sin aceptación del jugador y aprobación del club.</p>
 {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}{notice&&<p role="status" style={{color:'#15803d'}}>{notice}</p>}
 <label style={{display:'flex',alignItems:'center',gap:9}}><input type="checkbox" disabled={busy||!ranking} checked={ranking?.enrollment_open||false} onChange={e=>void run('racketon_set_enrollment_open_084',{p_ranking:rankingId,p_open:e.target.checked},'Visibilidad de inscripciones actualizada')}/>Permitir que los jugadores encuentren este ranking y soliciten participar</label>
 {ranking?.enrollment_open&&<div style={{display:'grid',gap:8}}><strong>Enlace de inscripción</strong><input style={field} readOnly value={share.href}/><button style={button} onClick={async()=>{try{await navigator.clipboard.writeText(share.href);setNotice('Enlace copiado')}catch{setError('Copia manualmente el enlace')}}}>Copiar enlace</button><a href={'https://wa.me/?text='+encodeURIComponent('Inscríbete en '+ranking.name+' en RACKETON: '+share.href)} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a></div>}
 <form onSubmit={e=>{e.preventDefault();void run('racketon_invite_ranking_084',{p_ranking:rankingId,p_email:email.trim()},'Invitación registrada; el jugador debe aceptarla');setEmail('')}} style={{display:'flex',gap:10,flexWrap:'wrap'}}>
 <input style={{...field,flex:'1 1 200px',width:'auto'}} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo de un jugador registrado"/>
 <button style={button} disabled={busy}>Invitar jugador</button></form>
 <small style={{color:'#666'}}>La invitación aparece en la cuenta RACKETON del destinatario; no se envía correo electrónico automáticamente.</small>
 <label>Invitación múltiple por correo<textarea style={field} rows={4} value={bulk} onChange={e=>setBulk(e.target.value)} placeholder="Un correo por línea"/></label><button style={button} disabled={busy||!bulk.trim()} onClick={()=>void inviteBulk()}>Procesar invitaciones</button>
 <h4 style={{margin:'5px 0'}}>Solicitudes recibidas e invitaciones</h4>
 {!items.length&&<p style={{color:'#666'}}>Aún no hay solicitudes ni invitaciones.</p>}
 {items.map(x=><div key={x.id} style={{border:'1px solid #eee',borderRadius:10,padding:12,display:'grid',gap:8}}>
 <strong>{x.invited_email||'Jugador · '+x.player_id.slice(0,8)}</strong><span style={{fontSize:13}}>{status(x.status)}</span>
 {x.status==='pending_club'&&<div style={{display:'flex',gap:8}}><button style={button} disabled={busy} onClick={()=>void run('racketon_decide_enrollment_084',{p_enrollment:x.id,p_accept:true,p_as_club:true},'Solicitud aprobada')}>Aprobar</button><button type="button" disabled={busy} onClick={()=>void run('racketon_decide_enrollment_084',{p_enrollment:x.id,p_accept:false,p_as_club:true},'Solicitud rechazada')}>Rechazar</button></div>}
 </div>)}
 <small style={{color:'#666'}}>Cuando acepten la invitación, continúa al paso Grupos para asignarlos.</small>
 </section>
}
export function PlayerEnrollments084({userId,rankingId}:{userId:string;rankingId?:string}){
 const [rankings,setRankings]=useState<Ranking[]>([]),[clubs,setClubs]=useState<Club[]>([]),[mine,setMine]=useState<Enrollment[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const db=supabase;if(!db)return;
 const [r,c,m]=await Promise.all([db.from('racketon_club_rankings').select('id,club_id,name,enrollment_open').eq('enrollment_open',true),db.from('racketon_clubs').select('id,name,city'),db.from('racketon_ranking_enrollments').select('id,ranking_id,player_id,status,origin,invited_email').eq('player_id',userId)]);
 if(r.error||c.error||m.error){setError(r.error?.message||c.error?.message||m.error?.message||'Error de consulta');return}
 setRankings((r.data||[]) as Ranking[]);setClubs((c.data||[]) as Club[]);setMine((m.data||[]) as Enrollment[])},[userId]);
 useEffect(()=>{void load()},[load]);
 async function run(fn:string,args:Record<string,unknown>,message:string){const db=supabase;if(!db)return;setBusy(true);setError('');setNotice('');try{const {error:e}=await db.rpc(fn,args).abortSignal(AbortSignal.timeout(20000));if(e)setError(e.message);else{setNotice(message);await load()}}catch(e){setError("No se pudo confirmar la operación. Actualiza antes de repetirla. "+String(e))}finally{setBusy(false)}}
 return <section style={{...card,maxWidth:1050,margin:'20px auto'}}><h2 style={{margin:0}}>Mis inscripciones a rankings oficiales</h2><p style={{margin:0,color:'#555'}}>Puedes solicitar entrar en un ranking abierto o aceptar una invitación. Nunca se te inscribirá sin tu consentimiento.</p>
 {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}{notice&&<p role="status" style={{color:'#15803d'}}>{notice}</p>}
 <h3 style={{margin:'8px 0 0'}}>Mis solicitudes e invitaciones</h3>
 {!mine.length&&<p style={{color:'#666'}}>No tienes solicitudes ni invitaciones.</p>}
 {mine.map(x=><div key={x.id} style={{border:'1px solid #eee',padding:12,borderRadius:10,display:'grid',gap:7}}><strong>{rankings.find(r=>r.id===x.ranking_id)?.name||'Ranking oficial · '+x.ranking_id.slice(0,8)}</strong><span>{status(x.status)}</span>
 {x.status==='pending_player'&&<div style={{display:'flex',gap:8}}><button style={button} disabled={busy} onClick={()=>void run('racketon_decide_enrollment_084',{p_enrollment:x.id,p_accept:true,p_as_club:false},'Invitación aceptada')}>Aceptar invitación</button><button disabled={busy} onClick={()=>void run('racketon_decide_enrollment_084',{p_enrollment:x.id,p_accept:false,p_as_club:false},'Invitación rechazada')}>Rechazar</button></div>}
 {x.status==='active'&&<PlayerRanking182 rankingId={x.ranking_id}/>}
 {['active','pending_club','pending_player'].includes(x.status)&&<button style={{justifySelf:'start'}} disabled={busy} onClick={()=>{if(window.confirm('¿Quieres retirar tu participación o solicitud?'))void run('racketon_withdraw_enrollment_084',{p_enrollment:x.id},'Baja registrada')}}>Retirarme</button>}
 </div>)}
 <h3 style={{margin:'8px 0 0'}}>Rankings abiertos</h3>
 {!rankings.filter(r=>!rankingId||r.id===rankingId).length&&<p style={{color:'#666'}}>No hay rankings abiertos para nuevas solicitudes.</p>}
 {rankings.filter(r=>!rankingId||r.id===rankingId).map(r=>{const existing=mine.find(m=>m.ranking_id===r.id);return <div key={r.id} style={{border:'1px solid #eee',borderRadius:10,padding:12,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><strong>{r.name}</strong><div style={{fontSize:13,color:'#666'}}>{clubs.find(c=>c.id===r.club_id)?.name||'Club oficial'}</div></div><button style={button} disabled={busy||existing?.status==='active'||existing?.status==='pending_club'} onClick={()=>void run('racketon_request_ranking_084',{p_ranking:r.id},'Solicitud enviada al club')}>{existing?.status==='active'?'Inscrito':existing?.status==='pending_club'?'Solicitud pendiente':existing?.status==='pending_player'?'Aceptar invitación':'Solicitar incorporación'}</button></div>})}
 </section>
}
