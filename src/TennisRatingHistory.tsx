import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';

type HistoryRow={
 challenge_id:string;played_at:string;opponent_name:string;opponent_id:string;
 won:boolean;sets:number[][];rating_before:number;rating_after:number;
 rating_delta:number;opponent_rating_before:number;opponent_rating_after:number;
 match_kind:string;
};
const box:React.CSSProperties={background:'#fff',border:'1px solid #e4e4e7',borderRadius:16,padding:20};
const fmt=(n:number)=>Number(n).toFixed(2).replace('.',',');
const date=(s:string)=>new Date(s).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});
export default function TennisRatingHistory({userId}:{userId:string}){
 const [rows,setRows]=useState<HistoryRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('Supabase no está configurado.');setLoading(false);return;}
  setLoading(true);setError('');
  const {data,error:e}=await supabase.rpc('my_tennis_rating_history_072');
  setLoading(false);
  if(e){setError(e.message);return;}
  setRows((data??[]) as HistoryRow[]);
 },[]);
 useEffect(()=>{void load()},[load,userId]);
 const ordered=useMemo(()=>[...rows].reverse(),[rows]);
 const points=useMemo(()=>{
  if(!ordered.length)return [];
  const values=[Number(ordered[0].rating_before),...ordered.map(r=>Number(r.rating_after))];
  const min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*0.25,0.1);
  return values.map((v,i)=>({x:34+i*(Math.max(700,values.length*55)-68)/Math.max(1,values.length-1),y:200-((v-(min-pad))/(max-min+2*pad))*155,v}));
 },[ordered]);
 const chartWidth=Math.max(700,(ordered.length+1)*55);
 const wins=rows.filter(r=>r.won).length;
 return <section style={{display:'grid',gap:16,margin:'24px auto',maxWidth:1000}}>
  <div style={{...box,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
   <div><span style={{color:'#b91c1c',fontWeight:800,fontSize:12,letterSpacing:1}}>RACKETON · TENIS</span>
    <h2 style={{margin:'6px 0'}}>Mi evolución competitiva</h2>
    <p style={{margin:0,color:'#52525b'}}>Cada punto corresponde a un partido confirmado que ha modificado tu rating global.</p>
   </div>
   <button type="button" className="outline" disabled={loading} onClick={()=>void load()}>Actualizar historial</button>
  </div>
  {error&&<div role="alert" style={{...box,color:'#b91c1c'}}>No se pudo cargar el historial: {error}. Comprueba que se ha ejecutado el SQL 0012.</div>}
  {loading?<div style={box}>Cargando historial…</div>:!error&&rows.length===0?<div style={box}>Todavía no hay partidos confirmados con un evento de rating. Cuando confirméis el primer resultado, aparecerá aquí.</div>:!error&&<>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12}}>
    {[['Rating actual',fmt(Number(ordered[ordered.length-1].rating_after))],['Partidos',String(rows.length)],['Victorias',String(wins)],['Derrotas',String(rows.length-wins)]].map(([label,value])=><div key={label} style={box}><div style={{fontSize:12,color:'#71717a'}}>{label}</div><strong style={{fontSize:28}}>{value}</strong></div>)}
   </div>
   <div style={box}>
    <h3 style={{margin:'0 0 8px'}}>Evolución del rating</h3>
    <p style={{fontSize:12,color:'#71717a'}}>Desde el rating previo al primer partido registrado hasta el último confirmado.</p>
    <div style={{overflowX:'auto',width:'100%'}}>
     <svg width={chartWidth} height="240" viewBox={`0 0 ${chartWidth} 240`} role="img" aria-label="Gráfico de evolución del rating RACKETON">
      {[45,95,145,195].map(y=><line key={y} x1="25" x2={chartWidth-20} y1={y} y2={y} stroke="#e4e4e7"/>)}
      <polyline points={points.map(pt=>`${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#b91c1c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((pt,i)=><g key={i}><circle cx={pt.x} cy={pt.y} r="5" fill="#b91c1c"/><title>{i===0?'Inicial':`Partido ${i}`}: {fmt(pt.v)}</title></g>)}
      <text x="34" y="230" fill="#71717a" fontSize="12">Inicial</text>
      <text x={chartWidth-25} y="230" textAnchor="end" fill="#71717a" fontSize="12">Último partido</text>
     </svg>
    </div>
   </div>
   <div style={box}>
    <h3 style={{margin:'0 0 16px'}}>Historial de partidos</h3>
    <div style={{display:'grid',gap:10}}>
     {rows.map(r=><article key={r.challenge_id} style={{border:'1px solid #e4e4e7',borderRadius:12,padding:14,display:'grid',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
       <div><strong>{r.opponent_name}</strong><div style={{fontSize:12,color:'#71717a'}}>{date(r.played_at)} · {r.match_kind==='ranking'?'Ranking':'Amistoso'}</div></div>
       <strong style={{color:r.won?'#15803d':'#b91c1c'}}>{r.won?'Victoria':'Derrota'}</strong>
      </div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
       <span style={{fontWeight:700}}>Sets: {r.sets.map((s,i)=><span key={i} style={{marginRight:8}}>{s[0]}-{s[1]}</span>)}</span>
       <span style={{color:'#52525b'}}>Rating: {fmt(Number(r.rating_before))} → <strong>{fmt(Number(r.rating_after))}</strong></span>
       <strong style={{color:Number(r.rating_delta)>=0?'#15803d':'#b91c1c'}}>{Number(r.rating_delta)>=0?'+':''}{fmt(Number(r.rating_delta))}</strong>
      </div>
     </article>)}
    </div>
   </div>
  </>}
 </section>;
}
