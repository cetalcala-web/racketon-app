import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
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
 useEffect(()=>{if(!schools.some(s=>s.id===school&&s.club_id===club))setSchool('')},[schools,school,club]);
 useEffect(()=>{if(!seasons.some(s=>s.id===season&&s.school_id===school))setSeason('')},[seasons,season,school]);
 useEffect(()=>{if(!programs.some(p=>p.id===program&&p.season_id===season))setProgram('')},[programs,program,season]);
 async function run(fn:string,args:Record<string,unknown>,message:string,after?:(id:string)=>void){const db=supabase;if(!db)return;setBusy(true);setError('');setNotice('');
 const {data,error:e}=await db.rpc(fn,args);if(e)setError(e.message);else{await load();setNotice(message);if(after&&typeof data==='string')after(data)}setBusy(false)}
 const schoolOptions=schools.filter(s=>s.club_id===club),seasonOptions=seasons.filter(s=>s.school_id===school),programOptions=programs.filter(p=>p.season_id===season),groupOptions=groups.filter(g=>g.program_id===program);
 return <section style={{maxWidth:1080,margin:'20px auto',display:'grid',gap:16}}>
 <div style={panel}><span style={{fontSize:12,fontWeight:800,color:'#c8102e'}}>RACKETON · GESTIÓN DE ESCUELAS</span><h2 style={{margin:0}}>Escuelas y grupos de entrenamiento</h2><p style={{margin:0,color:'#555'}}>Versión 0.9.0 · Estructura de escuelas, temporadas, programas y grupos. Sin matrículas ni datos de menores todavía.</p></div>
 {error&&<div role="alert" style={{...panel,color:'#b91c1c'}}>{error}</div>}{notice&&<div role="status" style={{...panel,color:'#15803d'}}>{notice}</div>}
 <div style={panel}><label>Club<select style={field} value={club} onChange={e=>setClub(e.target.value)}><option value="">Selecciona un club</option>{clubs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
 {club&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:14}}>
 <form style={panel} onSubmit={e=>{e.preventDefault();void run('racketon_create_school_090',{p_club:club,p_name:name,p_sport:sport},'Escuela creada',id=>{setSchool(id);setName('')})}}><h3 style={{margin:0}}>1 · Escuelas</h3><label>Escuela existente<select style={field} value={school} onChange={e=>setSchool(e.target.value)}><option value="">Selecciona una escuela</option>{schoolOptions.map(s=><option key={s.id} value={s.id}>{s.name} · {s.sport}</option>)}</select></label><label>Nombre de nueva escuela<input style={field} required minLength={3} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Escuela de tenis"/></label><label>Deporte<select style={field} value={sport} onChange={e=>setSport(e.target.value)}>{['tenis','padel','pickleball','squash','badminton'].map(s=><option key={s} value={s}>{s}</option>)}</select></label><button style={btn} disabled={busy}>Crear escuela</button></form>
 {school&&<form style={panel} onSubmit={e=>{e.preventDefault();void run('racketon_create_season_090',{p_school:school,p_name:seasonName,p_start:start,p_end:end},'Temporada creada',setSeason)}}><h3 style={{margin:0}}>2 · Temporadas</h3><label>Temporada existente<select style={field} value={season} onChange={e=>setSeason(e.target.value)}><option value="">Selecciona una temporada</option>{seasonOptions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Nombre<input style={field} required value={seasonName} onChange={e=>setSeasonName(e.target.value)}/></label><label>Desde<input style={field} type="date" required value={start} onChange={e=>setStart(e.target.value)}/></label><label>Hasta<input style={field} type="date" required min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label><button style={btn} disabled={busy}>Crear temporada</button></form>}
 {season&&<form style={panel} onSubmit={e=>{e.preventDefault();void run('racketon_create_program_090',{p_season:season,p_name:programName},'Programa creado',id=>{setProgram(id);setProgramName('')})}}><h3 style={{margin:0}}>3 · Programas</h3><label>Programa existente<select style={field} value={program} onChange={e=>setProgram(e.target.value)}><option value="">Selecciona un programa</option>{programOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Nuevo programa<input style={field} required minLength={2} maxLength={100} value={programName} onChange={e=>setProgramName(e.target.value)} placeholder="Tecnificación"/></label><button style={btn} disabled={busy}>Crear programa</button></form>}
 {program&&<form style={panel} onSubmit={e=>{e.preventDefault();void run('racketon_create_group_090',{p_program:program,p_name:groupName,p_capacity:capacity},'Grupo creado',()=>setGroupName(''))}}><h3 style={{margin:0}}>4 · Grupos de entrenamiento</h3><label>Nombre<input style={field} required minLength={2} maxLength={100} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Tecnificación A"/></label><label>Plazas máximas<input style={field} type="number" min={1} max={100} value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><button style={btn} disabled={busy}>Crear grupo</button><h4 style={{margin:0}}>Grupos existentes ({groupOptions.length})</h4>{groupOptions.map(g=><div key={g.id} style={{padding:10,border:'1px solid #eee',borderRadius:8}}>{g.name} · {g.capacity} plazas</div>)}</form>}
 </div>}
 </section>
}
