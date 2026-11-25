import RankingCompetition180 from './RankingCompetition180';
import {ClubEnrollmentAdmin084} from './RankingEnrollments084';
import RankingConfigurator083 from './RankingConfigurator083';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
type Club={id:string;name:string;city:string};
type Ranking={id:string;club_id:string;name:string;format:string;status:string};
type Group={id:string;ranking_id:string;name:string;sort_order:number};
const panel:React.CSSProperties={background:'#fff',border:'1px solid #e4e4e7',borderRadius:16,padding:20};
const input:React.CSSProperties={padding:12,border:'1px solid #d4d4d8',borderRadius:9,width:'100%',boxSizing:'border-box'};
const button:React.CSSProperties={padding:'11px 18px',background:'#c8102e',color:'#fff',border:0,borderRadius:9,cursor:'pointer',fontWeight:700};
export default function ClubRankingsAdmin081({userId}:{userId:string}){
 const [clubs,setClubs]=useState<Club[]>([]);
 const [rankings,setRankings]=useState<Ranking[]>([]);
 const [groups,setGroups]=useState<Group[]>([]);
 const [club,setClub]=useState('');
 const [ranking,setRanking]=useState('');
 const [rankingName,setRankingName]=useState('');
 const [format,setFormat]=useState('box');
 const [groupName,setGroupName]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [step,setStep]=useState(0); const [creating,setCreating]=useState(false);
 const load=useCallback(async()=>{
  if(!supabase)return;
  const a=await supabase.from('racketon_clubs').select('id,name,city').order('created_at',{ascending:false});
  if(a.error){setError(a.error.message);return}
  setClubs((a.data??[]) as Club[]);
  const b=await supabase.from('racketon_club_rankings').select('id,club_id,name,format,status').order('created_at',{ascending:false});
  if(b.error){setError(b.error.message);return}
  setRankings((b.data??[]) as Ranking[]);
  const c=await supabase.from('racketon_club_groups').select('id,ranking_id,name,sort_order').order('sort_order');
  if(c.error){setError(c.error.message);return}
  setGroups((c.data??[]) as Group[]);
 },[]);
 useEffect(()=>{void load()},[userId,load]);
 useEffect(()=>{if(!club&&clubs.length)setClub(clubs[0].id)},[clubs,club]);
 const run=async(fn:string,args:Record<string,unknown>,success:string)=>{
  if(!supabase)return;
  setBusy(true);setError('');setNotice('');
  try { const {data,error:e}=await supabase.rpc(fn,args).abortSignal(AbortSignal.timeout(20000));
  if(e){setError(e.message)}else{
   setNotice(success);
   await load();
   if(fn==='racketon_create_club_ranking_080'){setRanking(String(data));setRankingName('');setCreating(false);setStep(0)}
   if(fn==='racketon_add_group_080')setGroupName('');
  }
  } catch(e){setError("No se pudo confirmar la operación. Actualiza antes de repetirla. "+String(e));} finally {setBusy(false);}
 };
 const filtered=rankings.filter(r=>r.club_id===club);
 return <section style={{maxWidth:1050,margin:'20px auto',display:'grid',gap:16}}>
  <div style={panel}><span style={{color:'#c8102e',fontWeight:800,fontSize:12}}>RACKETON · RANKINGS OFICIALES</span><h2 style={{margin:'8px 0'}}>Gestión de rankings</h2><p style={{color:'#52525b'}}>Crea una competición o selecciona una existente para gestionarla.</p></div>
  {error&&<div role="alert" style={{...panel,color:'#b91c1c'}}>{error}</div>}
  {notice&&<div role="status" style={{...panel,color:'#15803d'}}>{notice}</div>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
   <div style={{...panel,display:'grid',gap:12,alignContent:'start'}}>
    <h3 style={{margin:0}}>Mis clubes</h3>
    <select style={input} value={club} onChange={e=>{setClub(e.target.value);setRanking('')}}><option value="">Selecciona un club</option>{clubs.map(c=><option key={c.id} value={c.id}>{c.name}{c.city?' · '+c.city:''}</option>)}</select>
    {!clubs.length&&<p style={{color:'#71717a'}}>Todavía no administras ningún club.</p>}
   </div>
  </div>
  {club&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
   <div style={panel}><button style={button} onClick={()=>setCreating(!creating)}>{creating?"Cancelar":"+ Crear competición"}</button>{creating&&<form style={{...panel,display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();void run('racketon_create_club_ranking_080',{p_club:club,p_name:rankingName,p_format:format},'Ranking creado como borrador')}}>
    <h3 style={{margin:0}}>1. Crear un ranking</h3>
    <label>Nombre<input required minLength={3} maxLength={120} style={input} value={rankingName} onChange={e=>setRankingName(e.target.value)} placeholder="Ej. Ranking social 2026/27"/></label>
    <label>Formato<select style={input} value={format} onChange={e=>setFormat(e.target.value)}><option value="box">Grupos (Box League)</option><option value="ladder">Escalera de desafíos</option><option value="points">Liga por puntos</option><option value="manual">Configuración manual</option></select></label>
    <button style={button} disabled={busy}>Crear ranking</button>
   </form>}</div>
   <div style={{...panel,display:'grid',gap:12,alignContent:'start'}}>
    <h3 style={{margin:0}}>Rankings del club ({filtered.length})</h3>
    <select style={input} value={ranking} onChange={e=>{setRanking(e.target.value);setStep(0)}}><option value="">Selecciona un ranking</option>{filtered.map(r=><option key={r.id} value={r.id}>{r.name} · {r.status==='draft'?'Borrador':r.status}</option>)}</select>
    {!filtered.length&&<p style={{color:'#71717a'}}>Todavía no hay rankings.</p>}
   </div>
  </div>}
  {ranking&&<div style={panel}><h2>{filtered.find(r=>r.id===ranking)?.name}</h2><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{['Reglamento','Participantes','Grupos','Ciclos y resultados'].map((t,i)=><button key={t} style={{...button,background:step===i?'#c8102e':'#f4f4f5',color:step===i?'white':'#27272a'}} onClick={()=>setStep(i)}>{i+1}. {t}</button>)}</div><p>{['Define las reglas y guarda la configuración.','Abre inscripciones o invita a jugadores. Deben aceptar antes de asignarlos.','Crea grupos y asigna los participantes activos.','Genera los partidos, registra resultados y consulta las promociones.'][step]}</p></div>}
  {ranking&&step===0&&<RankingConfigurator083 key={ranking} rankingId={ranking} onSaved={load}/>}
  {ranking&&step===1&&<ClubEnrollmentAdmin084 key={ranking} rankingId={ranking}/>}
  {ranking&&step===2&&<div style={{...panel,display:'grid',gap:14}}>
   <h3 style={{margin:0}}>2. Grupos del ranking</h3>
   <form onSubmit={e=>{e.preventDefault();void run('racketon_add_group_080',{p_ranking:ranking,p_name:groupName},'Grupo añadido')}} style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    <input required maxLength={100} style={{...input,flex:'1 1 220px',width:'auto'}} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ej. Grupo 1, División Oro…"/>
    <button style={button} disabled={busy}>Añadir grupo</button>
   </form>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
    {groups.filter(g=>g.ranking_id===ranking).map(g=><div key={g.id} style={{padding:14,border:'1px solid #e4e4e7',borderRadius:10}}><span style={{fontSize:12,color:'#71717a'}}>Posición {g.sort_order}</span><div style={{fontWeight:700}}>{g.name}</div></div>)}
   </div>
   <p style={{fontSize:13,color:'#71717a'}}>La clasificación interna de estos grupos es independiente del rating global RACKETON. Utiliza el panel competitivo para asignar jugadores y registrar resultados.</p>
  </div>}
  {ranking&&(step===2||step===3)&&<RankingCompetition180 view={step===2?"groups":"competition"} key={ranking+step} rankingId={ranking} groups={groups.filter(g=>g.ranking_id===ranking)}/>}
 {ranking&&step<3&&<button style={button} onClick={()=>setStep(step+1)}>Continuar a { ["participantes","grupos","ciclos y resultados"][step]}</button>}
 </section>;
}
