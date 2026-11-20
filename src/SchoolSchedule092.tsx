import {useCallback,useEffect,useState} from 'react';
import {CalendarDays,Clock3,MapPin,UserRound,Plus,Trash2} from 'lucide-react';
import {supabase} from './supabase';
type Group={id:string;name:string;program_id:string};
type Program={id:string;name:string;season_id:string};
type Season={id:string;school_id:string};
type School={id:string;club_id:string};
type Court={id:string;club_id:string;name:string};
type Coach={id:string;club_id:string;display_name:string};
type Slot={id:string;club_id:string;group_id:string;court_id:string;coach_id:string|null;weekday:number;start_time:string;end_time:string;active:boolean};
const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const input:React.CSSProperties={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:10,boxSizing:'border-box',background:'#fff',color:'#172033'};
const button:React.CSSProperties={border:0,borderRadius:10,padding:'11px 16px',background:'#c8102e',color:'#fff',fontWeight:750,cursor:'pointer'};
const card:React.CSSProperties={border:'1px solid #e7e8eb',borderRadius:17,padding:20,background:'#fff',boxShadow:'0 4px 20px rgba(15,23,42,.035)'};
export default function SchoolSchedule092({clubId,seasonId}:{clubId:string;seasonId:string}){
 const [courts,setCourts]=useState<Court[]>([]),[coaches,setCoaches]=useState<Coach[]>([]),[slots,setSlots]=useState<Slot[]>([]),[groups,setGroups]=useState<Group[]>([]),[programs,setPrograms]=useState<Program[]>([]),[seasons,setSeasons]=useState<Season[]>([]),[schools,setSchools]=useState<School[]>([]);
 const [courtName,setCourtName]=useState(''),[coachName,setCoachName]=useState(''),[group,setGroup]=useState(''),[court,setCourt]=useState(''),[coach,setCoach]=useState(''),[day,setDay]=useState(1),[start,setStart]=useState('18:00'),[end,setEnd]=useState('19:30'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{const db=supabase;if(!db){setError('Supabase no configurado');return}
 const result=await Promise.all([
 db.from('racketon_club_courts_092').select('id,club_id,name').eq('club_id',clubId),
 db.from('racketon_club_coaches_092').select('id,club_id,display_name').eq('club_id',clubId),
 db.from('racketon_group_schedule_092').select('id,club_id,group_id,court_id,coach_id,weekday,start_time,end_time,active').eq('club_id',clubId).eq('active',true),
 db.from('racketon_training_groups').select('id,name,program_id'),
 db.from('racketon_school_programs').select('id,name,season_id'),
 db.from('racketon_school_seasons').select('id,school_id'),
 db.from('racketon_schools').select('id,club_id').eq('club_id',clubId)]);
 const failure=result.find(x=>x.error);if(failure?.error){setError(failure.error.message);return}
 setCourts((result[0].data||[]) as Court[]);setCoaches((result[1].data||[]) as Coach[]);setSlots((result[2].data||[]) as Slot[]);setGroups((result[3].data||[]) as Group[]);setPrograms((result[4].data||[]) as Program[]);setSeasons((result[5].data||[]) as Season[]);setSchools((result[6].data||[]) as School[]);
 },[clubId]);
 useEffect(()=>{void refresh()},[refresh]);
 const validSchoolIds=new Set(schools.map(s=>s.id));
 const validSeasonIds=new Set(seasons.filter(s=>validSchoolIds.has(s.school_id)&&s.id===seasonId).map(s=>s.id));
 const currentPrograms=programs.filter(p=>validSeasonIds.has(p.season_id));
 const validProgramIds=new Set(currentPrograms.map(p=>p.id));
 const currentGroups=groups.filter(g=>validProgramIds.has(g.program_id));
 const validGroupIds=new Set(currentGroups.map(g=>g.id));
 const currentSlots=slots.filter(s=>validGroupIds.has(s.group_id));
 async function mutate(fn:string,args:Record<string,unknown>,success:string,reset?:()=>void){const db=supabase;if(!db)return;setBusy(true);setError('');setNotice('');const {error:e}=await db.rpc(fn,args);if(e)setError(e.message);else{reset?.();await refresh();setNotice(success)}setBusy(false)}
 const nameGroup=(id:string)=>currentGroups.find(g=>g.id===id)?.name||'Grupo';
 const nameProgram=(id:string)=>currentPrograms.find(p=>p.id===currentGroups.find(g=>g.id===id)?.program_id)?.name||'';
 return <div style={{display:'grid',gap:18,marginTop:8}}>
 <div style={{...card,background:'linear-gradient(125deg,#fff,#f7f8fa)'}}><div style={{display:'flex',gap:12,alignItems:'center'}}><CalendarDays size={27} color="#c8102e"/><div><span style={{fontSize:11,fontWeight:850,color:'#c8102e',letterSpacing:1.5}}>PLANIFICACIÓN DE ACTIVIDADES</span><h3 style={{margin:'5px 0',fontSize:23}}>Parrilla semanal</h3><p style={{margin:0,color:'#64748b',fontSize:13}}>Organiza los grupos por día, pista y entrenador. Los solapamientos se bloquean automáticamente.</p></div></div></div>
 {error&&<div role="alert" style={{...card,color:'#b91c1c',borderColor:'#fecaca'}}>{error}</div>}{notice&&<div role="status" style={{...card,color:'#15803d'}}>{notice}</div>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
 <form style={{...card,display:'grid',gap:10}} onSubmit={e=>{e.preventDefault();void mutate('racketon_add_court_092',{p_club:clubId,p_name:courtName},'Pista añadida',()=>setCourtName(''))}}><strong><MapPin size={17} style={{verticalAlign:'middle'}}/> Pistas</strong><label>Nombre de pista<input style={input} value={courtName} onChange={e=>setCourtName(e.target.value)} minLength={2} maxLength={80} required placeholder="Pista 1"/></label><button style={button} disabled={busy||courtName.trim().length<2}><Plus size={16} style={{verticalAlign:'middle'}}/> Añadir pista</button><span style={{fontSize:12,color:'#64748b'}}>{courts.length} pistas registradas</span></form>
 <form style={{...card,display:'grid',gap:10}} onSubmit={e=>{e.preventDefault();void mutate('racketon_add_coach_092',{p_club:clubId,p_name:coachName},'Entrenador añadido',()=>setCoachName(''))}}><strong><UserRound size={17} style={{verticalAlign:'middle'}}/> Entrenadores</strong><label>Nombre del entrenador<input style={input} value={coachName} onChange={e=>setCoachName(e.target.value)} minLength={2} maxLength={100} required placeholder="Nombre y apellidos"/></label><button style={button} disabled={busy||coachName.trim().length<2}><Plus size={16} style={{verticalAlign:'middle'}}/> Añadir entrenador</button><span style={{fontSize:12,color:'#64748b'}}>{coaches.length} entrenadores registrados</span></form>
 </div>
 <form style={{...card,display:'grid',gap:14}} onSubmit={e=>{e.preventDefault();void mutate('racketon_add_schedule_092',{p_club:clubId,p_group:group,p_court:court,p_coach:coach||null,p_weekday:day,p_start:start,p_end:end},'Sesión añadida a la parrilla')}}><strong><Clock3 size={17} style={{verticalAlign:'middle'}}/> Nueva sesión semanal</strong><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12}}>
 <label>Grupo<select style={input} required value={group} onChange={e=>setGroup(e.target.value)}><option value="">Seleccionar</option>{currentGroups.map(g=><option key={g.id} value={g.id}>{nameProgram(g.id)} · {g.name}</option>)}</select></label>
 <label>Día<select style={input} value={day} onChange={e=>setDay(Number(e.target.value))}>{days.map((d,i)=><option key={d} value={i+1}>{d}</option>)}</select></label>
 <label>Inicio<input style={input} type="time" required value={start} onChange={e=>setStart(e.target.value)}/></label>
 <label>Fin<input style={input} type="time" required min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label>
 <label>Pista<select style={input} required value={court} onChange={e=>setCourt(e.target.value)}><option value="">Seleccionar</option>{courts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Entrenador<select style={input} value={coach} onChange={e=>setCoach(e.target.value)}><option value="">Sin asignar</option>{coaches.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label>
 </div><button style={{...button,justifySelf:'start'}} disabled={busy||!group||!court||!start||!end||end<=start}><Plus size={16} style={{verticalAlign:'middle'}}/> Programar sesión</button></form>
 <div style={{...card,display:'grid',gap:14}}><div><h3 style={{margin:0,fontSize:19}}>Semana tipo</h3><span style={{fontSize:12,color:'#64748b'}}>Horario recurrente · {currentSlots.length} sesiones activas</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{days.map((d,i)=><div key={d} style={{background:'#f8fafc',borderRadius:12,padding:12,minHeight:115}}><strong style={{fontSize:13}}>{d}</strong><div style={{display:'grid',gap:8,marginTop:10}}>{currentSlots.filter(s=>s.weekday===i+1).sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(s=><div key={s.id} style={{padding:11,background:'#fff',border:'1px solid #e7e8eb',borderLeft:'3px solid #c8102e',borderRadius:9,fontSize:12,display:'grid',gap:4}}><strong>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</strong><span>{nameGroup(s.group_id)}</span><span style={{color:'#64748b'}}>{courts.find(c=>c.id===s.court_id)?.name||'Pista'} · {coaches.find(c=>c.id===s.coach_id)?.display_name||'Sin entrenador'}</span><button type="button" title="Retirar esta sesión" disabled={busy} onClick={()=>{if(window.confirm('¿Retirar esta sesión de la parrilla semanal?'))void mutate('racketon_remove_schedule_092',{p_id:s.id},'Sesión retirada')}} style={{justifySelf:'end',border:0,background:'transparent',color:'#b91c1c',cursor:'pointer'}}><Trash2 size={15}/></button></div>)}{!currentSlots.some(s=>s.weekday===i+1)&&<span style={{fontSize:12,color:'#94a3b8'}}>Sin actividades</span>}</div></div>)}</div></div>
 </div>;
}
