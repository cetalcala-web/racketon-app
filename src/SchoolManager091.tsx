import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import { GraduationCap, Sprout, Target, Activity, Trophy, Users, Plus, CalendarDays, ChevronRight, Layers3, CheckCircle2, ShieldCheck } from 'lucide-react';
type Club={id:string;name:string};
type School={id:string;club_id:string;name:string;sport:string};
type Season={id:string;school_id:string;name:string;starts_on:string;ends_on:string};
type Program={id:string;season_id:string;name:string};
type Group={id:string;program_id:string;name:string;capacity:number};
const panel:React.CSSProperties={padding:18,border:'1px solid #e4e4e7',borderRadius:14,background:'#fff',display:'grid',gap:12};
const field:React.CSSProperties={padding:11,border:'1px solid #ddd',borderRadius:9,width:'100%',boxSizing:'border-box'};
const btn:React.CSSProperties={padding:'11px 16px',background:'#c8102e',color:'#fff',border:0,borderRadius:9,fontWeight:700,cursor:'pointer'};
export default function SchoolManager090({userId}:{userId:string}){
 const [clubs,setClubs]=useState<Club[]>([]),[schools,setSchools]=useState<School[]>([]),[seasons,setSeasons]=useState<Season[]>([]),[programs,setPrograms]=useState<Program[]>([]),[groups,setGroups]=useState<Group[]>([]);
 const [club,setClub]=useState(''),[school,setSchool]=useState(''),[season,setSeason]=useState(''),[program,setProgram]=useState('');
 const [name,setName]=useState(''),[sport,setSport]=useState('tenis'),[seasonName,setSeasonName]=useState('2026/27'),[start,setStart]=useState('2026-09-01'),[end,setEnd]=useState('2027-06-30'),[programName,setProgramName]=useState(''),[groupName,setGroupName]=useState(''),[capacity,setCapacity]=useState(8);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const db=supabase;if(!db){setError('Supabase no está configurado');return}
 const results=await Promise.all([
  db.from('racketon_clubs').select('id,name').order('name'),
  db.from('racketon_schools').select('id,club_id,name,sport').order('created_at'),
  db.from('racketon_school_seasons').select('id,school_id,name,starts_on,ends_on').order('created_at'),
  db.from('racketon_school_programs').select('id,season_id,name').order('created_at'),
  db.from('racketon_training_groups').select('id,program_id,name,capacity').order('created_at')]);
 const first=results.find(x=>x.error);if(first?.error){setError(first.error.message);return}
 setClubs((results[0].data||[]) as Club[]);setSchools((results[1].data||[]) as School[]);setSeasons((results[2].data||[]) as Season[]);setPrograms((results[3].data||[]) as Program[]);setGroups((results[4].data||[]) as Group[]);
 },[]);
 useEffect(()=>{void load()},[load,userId]);
 useEffect(()=>{if(!clubs.some(c=>c.id===club))setClub(clubs[0]?.id||'')},[clubs,club]);
 useEffect(()=>{const match=schools.find(s=>s.club_id===club);if(match && (!school || !schools.some(s=>s.id===school&&s.club_id===club)))setSchool(match.id);else if(!match&&school)setSchool('')},[schools,school,club]);
 useEffect(()=>{const match=seasons.find(s=>s.school_id===school);if(match&&(!season||!seasons.some(s=>s.id===season&&s.school_id===school)))setSeason(match.id);else if(!match&&season)setSeason('')},[seasons,season,school]);
 useEffect(()=>{if(!programs.some(p=>p.id===program&&p.season_id===season))setProgram('')},[programs,program,season]);
 async function run(fn:string,args:Record<string,unknown>,message:string,after?:(id:string)=>void){const db=supabase;if(!db)return;setBusy(true);setError('');setNotice('');
 const {data,error:e}=await db.rpc(fn,args);if(e)setError(e.message);else{await load();setNotice(message);if(after&&typeof data==='string')after(data)}setBusy(false)}
 const schoolOptions=schools.filter(s=>s.club_id===club),seasonOptions=seasons.filter(s=>s.school_id===school),programOptions=programs.filter(p=>p.season_id===season),groupOptions=groups.filter(g=>g.program_id===program);
 const tiles=[{name:'Iniciación',icon:Sprout},{name:'Perfeccionamiento',icon:Target},{name:'Tecnificación',icon:Activity},{name:'Competición',icon:Trophy},{name:'Adultos',icon:Users}];
 const activeClub=clubs.find(c=>c.id===club);
 const card:React.CSSProperties={background:'#fff',border:'1px solid #e7e8eb',borderRadius:18,padding:22,boxShadow:'0 4px 20px rgba(15,23,42,.035)'};
 const smallLabel:React.CSSProperties={display:'block',fontSize:12,fontWeight:750,color:'#64748b',marginBottom:7};
 const action:React.CSSProperties={...btn,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,minHeight:44};
 return <section style={{maxWidth:1140,margin:'16px auto 48px',display:'grid',gap:20,fontFamily:'inherit',color:'#172033'}}>
  <div style={{...card,padding:28,background:'linear-gradient(125deg,#fff 5%,#f7f8fa 100%)'}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
    <div style={{display:'grid',gap:7}}><span style={{fontSize:11,letterSpacing:2,fontWeight:900,color:'#c8102e'}}>RACKETON CLUB MANAGER</span><h2 style={{fontSize:'clamp(24px,4vw,34px)',margin:0,letterSpacing:'-.7px'}}>{activeClub?.name||'Gestión del club'}</h2><span style={{color:'#64748b',fontSize:14}}>Gestión de escuelas y actividades · Temporada {seasons.find(s=>s.id===season)?.name||'por seleccionar'}</span></div>
    <div style={{width:62,height:62,borderRadius:18,display:'grid',placeItems:'center',background:'#fff0f2',color:'#b80d2b'}}><GraduationCap size={32}/></div>
   </div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:22}}>{[{label:'Programas',value:programOptions.length,icon:Layers3},{label:'Grupos',value:groups.filter(g=>programOptions.some(p=>p.id===g.program_id)).length,icon:Users},{label:'Temporadas',value:seasonOptions.length,icon:CalendarDays}].map(x=><div key={x.label} style={{display:'flex',alignItems:'center',gap:11,padding:'12px 16px',background:'#fff',border:'1px solid #edf0f2',borderRadius:12,minWidth:130}}><x.icon size={19} color='#c8102e'/><div><strong style={{display:'block',fontSize:19}}>{x.value}</strong><span style={{fontSize:11,color:'#64748b'}}>{x.label}</span></div></div>)}</div>
  </div>
  {error&&<div role="alert" style={{...card,color:'#b91c1c',borderColor:'#fecaca'}}>{error}</div>}{notice&&<div role="status" style={{...card,color:'#15803d',display:'flex',gap:10,alignItems:'center'}}><CheckCircle2 size={19}/>{notice}</div>}
  {!club&&<div style={card}>No se ha encontrado un club autorizado para este usuario.</div>}
  {club&&!school&&<div style={{...card,display:'grid',gap:12}}><h3 style={{margin:0}}>Preparar la gestión de actividades</h3><p style={{margin:0,color:'#64748b'}}>Activaremos la organización interna de {activeClub?.name}. No se creará otro club ni tendrás que introducir su nombre.</p><button style={{...action,justifySelf:'start'}} disabled={busy} onClick={()=>void run('racketon_create_school_090',{p_club:club,p_name:activeClub?.name||'Escuela del club',p_sport:'tenis'},'Gestión de actividades activada',setSchool)}><Plus size={17}/> Activar programas</button></div>}
  {school&&<div style={{...card,display:'grid',gap:15}}>
   <div style={{display:'flex',alignItems:'center',gap:10}}><CalendarDays size={21} color='#c8102e'/><h3 style={{margin:0,fontSize:18}}>Temporada de actividades</h3></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,alignItems:'end'}}>
    <label><span style={smallLabel}>Temporada activa</span><select style={field} value={season} onChange={e=>setSeason(e.target.value)}><option value="">Selecciona temporada</option>{seasonOptions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label><span style={smallLabel}>Nueva temporada</span><input style={field} value={seasonName} onChange={e=>setSeasonName(e.target.value)} placeholder="2026/27"/></label>
    <label><span style={smallLabel}>Fecha de inicio</span><input style={field} type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
    <label><span style={smallLabel}>Fecha de fin</span><input style={field} type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label>
    <button style={action} disabled={busy||!seasonName.trim()||!start||!end} onClick={()=>void run('racketon_create_season_090',{p_school:school,p_name:seasonName,p_start:start,p_end:end},'Temporada creada',setSeason)}><Plus size={17}/> Crear temporada</button>
   </div>
  </div>}
  {season&&<div style={{...card,display:'grid',gap:18}}>
   <div><h3 style={{fontSize:22,margin:'0 0 5px'}}>Programas de actividades</h3><p style={{margin:0,color:'#64748b',fontSize:14}}>Selecciona un programa para organizar sus grupos o crea uno nuevo.</p></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12}}>
    {tiles.map(t=>{const Icon=t.icon;const existing=programOptions.find(p=>p.name.toLocaleLowerCase('es')===t.name.toLocaleLowerCase('es'));const selected=existing?.id===program;return <button type="button" key={t.name} onClick={()=>{if(existing){setProgram(existing.id)}else{setProgramName(t.name);setProgram('')}}} style={{textAlign:'left',cursor:'pointer',minHeight:125,display:'grid',alignContent:'space-between',gap:14,border:selected?'2px solid #c8102e':'1px solid #e7e8eb',background:selected?'#fff7f8':'#fff',borderRadius:15,padding:18,color:'#172033'}}><Icon size={25} color='#c8102e'/><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}><strong style={{fontSize:14}}>{t.name}</strong>{existing?<CheckCircle2 size={16} color='#16a34a'/>:<Plus size={16} color='#94a3b8'/>}</div></button>})}
    <button type="button" onClick={()=>{setProgram('');setProgramName('')}} style={{textAlign:'left',cursor:'pointer',minHeight:125,display:'grid',alignContent:'space-between',gap:14,border:'1px dashed #b8bec8',background:'#fafbfc',borderRadius:15,padding:18,color:'#172033'}}><Plus size={25} color='#64748b'/><strong style={{fontSize:14}}>Nuevo programa</strong></button>
   </div>
   <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end',padding:16,background:'#f8fafc',borderRadius:13}}><label style={{flex:'1 1 230px'}}><span style={smallLabel}>Nombre del programa</span><input style={field} value={programName} onChange={e=>setProgramName(e.target.value)} placeholder="Ej.: Iniciación, Adultos, Mini tenis"/></label><button style={action} disabled={busy||programName.trim().length<2} onClick={()=>void run('racketon_create_program_090',{p_season:season,p_name:programName},'Programa creado',id=>{setProgram(id);setProgramName('')})}><Plus size={17}/> Crear programa</button></div>
   {programOptions.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8}}>{programOptions.map(p=><button key={p.id} onClick={()=>setProgram(p.id)} style={{cursor:'pointer',border:program===p.id?'1px solid #c8102e':'1px solid #e2e8f0',borderRadius:99,padding:'9px 14px',background:program===p.id?'#fff0f2':'white',color:program===p.id?'#a40b24':'#475569',fontWeight:650}}>{p.name} <ChevronRight size={13} style={{display:'inline',verticalAlign:'middle'}}/></button>)}</div>}
  </div>}
  {program&&<div style={{...card,display:'grid',gap:17}}>
   <div><span style={{fontSize:11,fontWeight:800,letterSpacing:1.5,color:'#c8102e'}}>ORGANIZACIÓN DE ENTRENAMIENTOS</span><h3 style={{fontSize:21,margin:'6px 0'}}>Grupos · {programOptions.find(p=>p.id===program)?.name}</h3><p style={{margin:0,color:'#64748b',fontSize:14}}>Define los grupos y su capacidad. Más adelante asignaremos pistas, técnicos y horarios.</p></div>
   <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end'}}><label style={{flex:'2 1 230px'}}><span style={smallLabel}>Nombre del grupo</span><input style={field} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ej.: Tecnificación A"/></label><label style={{flex:'1 1 120px'}}><span style={smallLabel}>Plazas máximas</span><input style={field} type="number" min={1} max={100} value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><button style={action} disabled={busy||groupName.trim().length<2||capacity<1||capacity>100} onClick={()=>void run('racketon_create_group_090',{p_program:program,p_name:groupName,p_capacity:capacity},'Grupo creado',()=>setGroupName(''))}><Plus size={17}/> Crear grupo</button></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{groupOptions.map(g=><div key={g.id} style={{border:'1px solid #e7e8eb',borderRadius:12,padding:16,display:'flex',gap:12,alignItems:'center'}}><Users size={22} color='#c8102e'/><div><strong>{g.name}</strong><div style={{fontSize:12,color:'#64748b',marginTop:3}}>Capacidad: {g.capacity} plazas</div></div></div>)}{!groupOptions.length&&<div style={{padding:16,color:'#64748b',background:'#f8fafc',borderRadius:12}}>Aún no hay grupos en este programa.</div>}</div>
  </div>}
  <div style={{display:'flex',alignItems:'center',gap:9,color:'#64748b',fontSize:12,padding:'0 4px'}}><ShieldCheck size={17}/> Los datos se guardan en el club autorizado. Esta fase todavía no incluye alumnos ni matrículas.</div>
 </section>;
}
