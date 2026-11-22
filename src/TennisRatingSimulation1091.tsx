import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
type Entry={challenge_id:string;played_at:string;opponent_name:string;match_kind:string;score:number[][];won:boolean;actual_before:number;actual_after:number;simulated_before:number;simulated_after:number;simulated_delta:number;opponent_before:number;opponent_simulated_delta:number;expected_share:number;observed_share:number;note:string};
const box:React.CSSProperties={border:'1px solid #e4e4e7',borderRadius:14,padding:18,background:'#fff',display:'grid',gap:12};
const fmt=(n:number)=>Number(n).toFixed(2).replace('.',',');
export default function TennisRatingSimulation1091({userId}:{userId:string}){
 const [rows,setRows]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{if(!supabase)return;setLoading(true);setError('');const {data,error:e}=await supabase.rpc('my_tennis_rating_simulation_1091',{p_limit:50});setLoading(false);if(e)setError(e.message);else setRows((data||[]) as Entry[])},[]);
 useEffect(()=>{void load()},[load,userId]);
 return <section style={{...box,maxWidth:980,margin:'24px auto'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><h2 style={{margin:0}}>Laboratorio de rating · Partidos reales</h2><button type="button" className="outline" disabled={loading} onClick={()=>void load()}>Actualizar</button></div>
 <p style={{margin:0,color:'#555'}}>Modo simulación: consulta partidos de tenis confirmados y compara el rating histórico con el cálculo experimental. No escribe ni modifica ninguna puntuación.</p>
 <p style={{margin:0,fontSize:13,color:'#92400e'}}>Cada fila simula un partido por separado utilizando sus ratings históricos. No es una proyección acumulada del ranking. Los partidos amistosos tienen variación simulada cero.</p>
 {error&&<p role="alert" style={{color:'#b91c1c'}}>No se pudo consultar la simulación: {error}</p>}
 {loading?<p>Cargando…</p>:rows.length===0?<p>No hay eventos históricos de tenis confirmados asociados a tu cuenta. Cuando existan, aparecerán aquí.</p>:<div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',fontSize:13,minWidth:740}}><thead><tr>{['Fecha','Rival','Tipo','Antes','Actual después','Simulado después','Δ simulado','Juegos % / esperado %'].map(h=><th key={h} style={{textAlign:'left',padding:9,borderBottom:'1px solid #ddd'}}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.challenge_id}><td style={{padding:9}}>{new Date(r.played_at).toLocaleDateString('es-ES')}</td><td style={{padding:9}}>{r.opponent_name}</td><td style={{padding:9}}>{r.match_kind==='ranking'?'Puntuable':'Amistoso'}</td><td style={{padding:9}}>{fmt(r.actual_before)}</td><td style={{padding:9}}>{fmt(r.actual_after)}</td><td style={{padding:9,fontWeight:700}}>{fmt(r.simulated_after)}</td><td style={{padding:9,color:r.simulated_delta>=0?'#15803d':'#b91c1c'}}>{r.simulated_delta>0?'+':''}{fmt(r.simulated_delta)}</td><td style={{padding:9}}>{Math.round(r.observed_share*100)}% / {Math.round(r.expected_share*100)}%</td></tr>)}</tbody></table></div>}
 </section>;
}
