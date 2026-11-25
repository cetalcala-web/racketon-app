import {useEffect,useState} from 'react';
import {supabase} from './supabase';

type Ranking={id:string;name:string;format:string;status:string;settings?:Record<string,unknown>};
const field:React.CSSProperties={width:'100%',padding:11,border:'1px solid #d4d4d8',borderRadius:9,boxSizing:'border-box'};
const card:React.CSSProperties={background:'#fff',border:'1px solid #e4e4e7',borderRadius:16,padding:20,display:'grid',gap:13};
const action:React.CSSProperties={background:'#c8102e',color:'#fff',border:0,borderRadius:9,padding:'12px 18px',fontWeight:700,cursor:'pointer'};
export default function RankingConfigurator083({rankingId,onSaved}:{rankingId:string;onSaved:()=>Promise<void>|void}){
 const [ranking,setRanking]=useState<Ranking|null>(null);
 const [format,setFormat]=useState('box'),[seeding,setSeeding]=useState('global'),[promotion,setPromotion]=useState('playoff');
 const [size,setSize]=useState('4'),[weeks,setWeeks]=useState('4'),[win,setWin]=useState('3'),[loss,setLoss]=useState('0');
 const [count,setCount]=useState(4),[prefix,setPrefix]=useState('Grupo'),[challenges,setChallenges]=useState(false);
 const [existing,setExisting]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;setError('');setNotice('');
  async function load(){
   if (!supabase) { if(active)setError('Supabase no está configurado.'); return; }
   const [r,g]=await Promise.all([
    supabase.from('racketon_club_rankings').select('id,name,format,status,settings').eq('id',rankingId).single(),
    supabase.from('racketon_club_groups').select('id',{count:'exact',head:true}).eq('ranking_id',rankingId)
   ]);
   if(!active)return;
   if(r.error||g.error){setError(r.error?.message||g.error?.message||'Error de lectura');return}
   const item=r.data as Ranking;setRanking(item);setFormat(item.format);setExisting(g.count??0);
   const s=item.settings||{};
   if(typeof s.seeding==='string')setSeeding(s.seeding);
   if(typeof s.promotion==='string')setPromotion(s.promotion);
   if(typeof s.group_size==='number')setSize(String(s.group_size));
   if(typeof s.cycle_weeks==='number')setWeeks(String(s.cycle_weeks));
   if(typeof s.points_win==='number')setWin(String(s.points_win));
   if(typeof s.points_loss==='number')setLoss(String(s.points_loss));
   if(typeof s.allow_challenges==='boolean')setChallenges(s.allow_challenges);
  }
  void load();return()=>{active=false};
 },[rankingId]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!ranking)return;
  if (!supabase) { setError('Supabase no está configurado.'); return; }
  setBusy(true);setError('');setNotice('');
  const settings={seeding,promotion,group_size:Number(size),cycle_weeks:Number(weeks),points_win:Number(win),points_loss:Number(loss),allow_challenges:challenges,configuration_version:'0.8.3'};
  try { const {error:err}=await supabase.rpc('racketon_configure_ranking_083',{
   p_ranking:rankingId,p_format:format,p_settings:settings,p_group_count:format==='box'&&existing===0?count:0,p_group_prefix:prefix
  }).abortSignal(AbortSignal.timeout(20000));
  if(err)setError(err.message);else{setNotice('Configuración guardada correctamente. El ranking sigue en borrador.');await onSaved()}
  } catch(e){setError("No se pudo confirmar el guardado. Actualiza antes de volver a intentarlo. "+String(e));} finally {setBusy(false);}
 }
 return <form style={card} onSubmit={e=>void save(e)}>
  <div><span style={{color:'#c8102e',fontSize:12,fontWeight:800}}>PASO 1 · REGLAMENTO</span><h3 style={{margin:'6px 0'}}>Reglas de competición</h3><p style={{fontSize:13,color:'#52525b'}}>Personaliza el ranking oficial. La generación de grupos crea su estructura, todavía no asigna jugadores.</p></div>
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
  {notice&&<p role="status" style={{color:'#15803d'}}>{notice}</p>}
  <label>Formato<select style={field} value={format} onChange={e=>setFormat(e.target.value)}><option value="box">Grupos · Box League</option><option value="ladder">Escalera de desafíos</option><option value="points">Liga por puntos</option><option value="manual">Manual</option></select></label>
  <label>Clasificación inicial<select style={field} value={seeding} onChange={e=>setSeeding(e.target.value)}><option value="global">Rating RACKETON</option><option value="internal">Ranking interno del club</option><option value="external">Valoración externa importada</option><option value="random">Sorteo aleatorio</option><option value="manual">Asignación manual</option></select></label>
  {format==='box'&&<>
   <label>Jugadores por grupo<select style={field} value={size} onChange={e=>setSize(e.target.value)}>{['4','5','6','8'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
   <label>Movimientos entre grupos<select style={field} value={promotion} onChange={e=>setPromotion(e.target.value)}><option value="direct">Ascensos y descensos directos</option><option value="playoff">Con partidos de promoción</option><option value="manual">Gestión manual</option></select></label>
   {existing===0?<><label>Número de grupos iniciales<input style={field} type="number" min={0} max={50} value={count} onChange={e=>setCount(Number(e.target.value))}/></label><label>Nombre de los grupos<input style={field} maxLength={40} value={prefix} onChange={e=>setPrefix(e.target.value)}/></label><small>Se crearán {count} grupos con nombres como «{prefix} 1», «{prefix} 2»…</small></>:<small>Este ranking ya tiene {existing} grupos. No se generarán otros automáticamente para evitar duplicados.</small>}
  </>}
  <label>Duración de cada ciclo<select style={field} value={weeks} onChange={e=>setWeeks(e.target.value)}>{['2','3','4','6','8','12'].map(v=><option key={v} value={v}>{v} semanas</option>)}</select></label>
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
   <label>Puntos por victoria<select style={field} value={win} onChange={e=>setWin(e.target.value)}>{['1','2','3'].map(v=><option key={v}>{v}</option>)}</select></label>
   <label>Puntos por derrota<select style={field} value={loss} onChange={e=>setLoss(e.target.value)}>{['0','1'].map(v=><option key={v}>{v}</option>)}</select></label>
  </div>
  <label style={{display:'flex',alignItems:'center',gap:9}}><input type="checkbox" checked={challenges} onChange={e=>setChallenges(e.target.checked)}/>Permitir desafíos entre participantes</label>
  <button style={action} disabled={busy||ranking?.status!=='draft'}>{busy?'Guardando…':'Guardar configuración'}</button>
  {ranking?.status!=='draft'&&<small>Este ranking no está en borrador. La configuración está bloqueada.</small>}
  <small style={{color:'#71717a'}}>Guarda las reglas y continúa a Participantes. La asignación de grupos se realiza en el paso 3.</small>
 </form>;
}
