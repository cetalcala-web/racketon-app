import {useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';

type Match={challenge_id:string;played_at:string;opponent_name:string;opponent_id:string;won:boolean;sets:number[][];rating_before:number;rating_after:number;rating_delta:number;match_kind:string};
type Rating={rating:number;status:string;matches_played:number};
const card:React.CSSProperties={background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:20};
const format=(n:number)=>n.toFixed(2).replace('.',',');
export default function TennisCompetitiveProfile({userId}:{userId:string}){
 const [matches,setMatches]=useState<Match[]>([]);
 const [rating,setRating]=useState<Rating|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;async function load(){if(!supabase){setError('Supabase no está configurado.');setLoading(false);return;}
  const [history,level]=await Promise.all([supabase.rpc('my_tennis_rating_history_072'),supabase.from('tennis_ratings').select('rating,status,matches_played').eq('user_id',userId).maybeSingle()]);
  if(!active)return;
  if(history.error||level.error)setError(history.error?.message||level.error?.message||'No se pudo cargar el perfil');
  else{setMatches((history.data??[]) as Match[]);setRating(level.data as Rating|null)}
  setLoading(false);
 }void load();return()=>{active=false}},[userId]);
 const stats=useMemo(()=>{const wins=matches.filter(m=>m.won).length;const losses=matches.length-wins;
  const byOpponent=new Map<string,{id:string;name:string;wins:number;losses:number;last:string}>();
  for(const m of matches){const o=byOpponent.get(m.opponent_id)??{id:m.opponent_id,name:m.opponent_name,wins:0,losses:0,last:m.played_at};o[m.won?'wins':'losses']++;if(m.played_at>o.last)o.last=m.played_at;byOpponent.set(m.opponent_id,o)}
  return {wins,losses,pct:matches.length?Math.round(wins/matches.length*100):0,opponents:[...byOpponent.values()].sort((a,b)=>b.wins+b.losses-a.wins-a.losses)};
 },[matches]);
 return <section style={{maxWidth:980,margin:'24px auto',display:'grid',gap:16}}>
  <div style={{...card,background:'#18181b',color:'#fff'}}><div style={{fontSize:12,color:'#fda4af',fontWeight:800,letterSpacing:1}}>RACKETON · TENIS</div><h2 style={{margin:'8px 0'}}>Mi perfil competitivo</h2><p style={{margin:0,color:'#d4d4d8'}}>Rating global y estadísticas de todos tus partidos confirmados, dentro y fuera del club.</p></div>
  {loading?<div style={card}>Cargando estadísticas…</div>:error?<div role="alert" style={{...card,color:'#b91c1c'}}>Error al cargar las estadísticas: {error}</div>:<>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
    {([['Rating global',rating?format(Number(rating.rating)):'—'],['Partidos',String(matches.length)],['Victorias',String(stats.wins)],['Derrotas',String(stats.losses)],['% victorias',stats.pct+' %']] as [string,string][]).map(([label,value])=><div key={label} style={card}><div style={{fontSize:12,color:'#71717a'}}>{label}</div><strong style={{fontSize:27}}>{value}</strong></div>)}
   </div>
   <div style={card}><h3 style={{margin:'0 0 12px'}}>Balance competitivo</h3><div style={{height:14,display:'flex',background:'#e4e4e7',borderRadius:10,overflow:'hidden'}}><div style={{width:stats.pct+'%',background:'#15803d'}}/></div><p style={{color:'#52525b',fontSize:13,margin:'10px 0 0'}}>{stats.wins} victorias · {stats.losses} derrotas · {rating?.status==='consolidated'?'Rating consolidado':'Rating en calibración o provisional'}</p></div>
   <div style={card}><h3 style={{margin:'0 0 12px'}}>Rivales y enfrentamientos directos</h3>{stats.opponents.length===0?<p style={{color:'#71717a'}}>Todavía no hay enfrentamientos confirmados.</p>:<div style={{display:'grid',gap:10}}>{stats.opponents.map(o=><div key={o.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 0',borderBottom:'1px solid #eee'}}><div><strong>{o.name}</strong><div style={{fontSize:12,color:'#71717a'}}>Último partido: {new Date(o.last).toLocaleDateString('es-ES')}</div></div><div style={{textAlign:'right'}}><strong>{o.wins} - {o.losses}</strong><div style={{fontSize:12,color:'#71717a'}}>G - P</div></div></div>)}</div>}</div>
   <div style={card}><h3 style={{margin:'0 0 12px'}}>Últimos resultados</h3>{matches.length===0?<p style={{color:'#71717a'}}>Sin resultados confirmados.</p>:<div style={{display:'grid',gap:10}}>{matches.slice(0,5).map(m=><div key={m.challenge_id} style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',borderBottom:'1px solid #eee',padding:'8px 0'}}><div><strong>{m.opponent_name}</strong><div style={{fontSize:12,color:'#71717a'}}>{new Date(m.played_at).toLocaleDateString('es-ES')} · {m.match_kind==='ranking'?'Ranking de club':'Amistoso'}</div></div><div style={{textAlign:'right'}}><strong style={{color:m.won?'#15803d':'#b91c1c'}}>{m.won?'Victoria':'Derrota'}</strong><div style={{fontSize:12,color:'#71717a'}}>Rating {Number(m.rating_delta)>=0?'+':''}{format(Number(m.rating_delta))}</div></div></div>)}</div>}</div>
  </>}
 </section>
}
