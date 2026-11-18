import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Sport = 'Tenis'|'Pádel'|'Pickleball'|'Squash'|'Bádminton';
const QUESTIONS = [{"block": "Experiencia", "question": "¿Cuánto tiempo has practicado tenis regularmente?", "options": ["Menos de un año", "Entre 1 y 3 años", "Entre 3 y 7 años", "Más de 7 años"]}, {"block": "Experiencia", "question": "¿Qué formación técnica has recibido?", "options": ["Ninguna formación estructurada", "Clases ocasionales", "Escuela o clases regulares durante varias temporadas", "Entrenamiento estructurado de competición"]}, {"block": "Técnica", "question": "En partidos exigentes, ¿cómo funciona tu segundo saque?", "options": ["Cometo dobles faltas frecuentes", "Lo introduzco, pero resulta fácilmente atacable", "Lo ejecuto con seguridad y cierto efecto o dirección", "Mantengo seguridad y variación bajo presión"]}, {"block": "Técnica", "question": "¿Qué puedes hacer con tu derecha ante una pelota profunda?", "options": ["Me cuesta devolverla con control", "La devuelvo corta o sin dirección", "Mantengo profundidad y dirección", "Neutralizo la presión y recupero iniciativa"]}, {"block": "Técnica", "question": "¿Qué puedes hacer con tu revés cuando te desplazan?", "options": ["Fallo o devuelvo de emergencia", "Devuelvo, pero pierdo profundidad", "Mantengo el intercambio y recupero posición", "Controlo dirección, altura y profundidad bajo presión"]}, {"block": "Técnica", "question": "¿Cómo restas un primer saque exigente?", "options": ["Tengo dificultades para ponerlo en juego", "Devuelvo saques moderados", "Bloqueo o resto con profundidad razonable", "Adapto posición y respuesta al servicio"]}, {"block": "Técnica", "question": "¿Qué eficacia tienes al subir a la red?", "options": ["Evito subir o fallo muchas voleas", "Resuelvo voleas sencillas", "Cierro puntos en situaciones favorables", "Selecciono subidas y resuelvo voleas exigentes"]}, {"block": "Técnica", "question": "¿Cómo utilizas efectos y cambios de trayectoria?", "options": ["No controlo voluntariamente los efectos", "Uso algún efecto irregularmente", "Varío altura y efecto con intención", "Adapto efecto, trayectoria y velocidad al rival"]}, {"block": "Táctica", "question": "En intercambios exigentes contra rivales similares, ¿qué ocurre?", "options": ["Fallo en los primeros golpes", "Mantengo intercambios cortos", "Sostengo intercambios y cambio dirección", "Mantengo ritmo alto y tomo la iniciativa"]}, {"block": "Táctica", "question": "Cuando te desplazan fuera de pista, ¿cómo respondes?", "options": ["Llego tarde o no recupero posición", "Devuelvo pero cedo la iniciativa", "Defiendo y recupero posición", "Neutralizo presión y contraataco"]}, {"block": "Táctica", "question": "¿Cómo construyes los puntos?", "options": ["Golpeo sin intención definida", "Busco principalmente no fallar", "Uso direcciones para generar ventajas", "Construyo patrones y adapto decisiones"]}, {"block": "Táctica", "question": "¿Qué haces cuando un rival cambia su patrón de juego?", "options": ["Mantengo mi juego aunque no funcione", "Detecto dificultades pero no me adapto", "Modifico direcciones o ritmo", "Realizo ajustes eficaces durante el partido"]}, {"block": "Táctica", "question": "En momentos de presión, ¿qué ocurre con tu nivel?", "options": ["Aumentan mucho mis errores", "Pierdo recursos y juego conservador", "Mantengo mi nivel habitual", "Selecciono riesgos y ejecuto con eficacia"]}, {"block": "Competición", "question": "¿Qué competiciones has disputado en los últimos 24 meses?", "options": ["Ninguna", "Torneos sociales o amistosos", "Ligas y torneos de club", "Competiciones oficiales o federadas"]}, {"block": "Competición", "question": "¿Qué referencias de nivel puedes aportar?", "options": ["Ninguna", "Solo estimación personal", "Resultados identificables", "Resultados verificables ante rivales identificados"]}, {"block": "Competición", "question": "¿Contra qué rivales consigues habitualmente tus victorias?", "options": ["No dispongo de resultados", "Jugadores recreativos", "Jugadores de ligas de club", "Jugadores con resultados oficiales o rating fiable"]}, {"block": "Competición", "question": "¿Qué información puedes aportar de tus últimos partidos?", "options": ["No recuerdo resultados", "Resultados aproximados", "Marcadores de varios partidos", "Marcadores, fechas y rivales verificables"]}, {"block": "Competición", "question": "¿Cuántos partidos completos has disputado en los últimos 12 meses?", "options": ["Ninguno", "Entre 1 y 5", "Entre 6 y 20", "Más de 20"]}, {"block": "Estado actual", "question": "¿Con qué frecuencia juegas actualmente?", "options": ["Menos de una vez al mes", "Entre 1 y 3 veces al mes", "Una o dos veces por semana", "Tres o más veces por semana"]}, {"block": "Estado actual", "question": "¿Cómo está tu nivel actual respecto a tu mejor etapa?", "options": ["Muy por debajo", "Algo por debajo", "Similar", "En mi mejor momento o progresando"]}] as {block:string;question:string;options:string[]}[];
const BLOCKS = ['Experiencia','Técnica','Táctica','Competición','Estado actual'];
const inputStyle: React.CSSProperties = {width:'100%',boxSizing:'border-box',padding:'11px',border:'1px solid #d7d7dc',borderRadius:8,background:'white',color:'#202027',fontSize:14};
function mean(xs:number[]){return xs.reduce((a,b)=>a+b,0)/xs.length}
export default function LevelAssessmentAdvanced({userId,enabledSports}:{userId:string;enabledSports:Sport[]}){
 const [sport,setSport]=useState<Sport>('Tenis');
 const [answers,setAnswers]=useState<Record<number,number>>({});
 const [block,setBlock]=useState(0);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [saved,setSaved]=useState(false);
 const [previous,setPrevious]=useState<number|null>(null);
 useEffect(()=>{if(enabledSports.length&&!enabledSports.includes(sport))setSport(enabledSports[0])},[enabledSports,sport]);
 useEffect(()=>{
  let active=true;
  async function load(){
   setNotice('');setSaved(false);setAnswers({});setPrevious(null);
   if(!supabase||sport!=='Tenis')return;
   const {data,error}=await supabase.from('player_assessments').select('answers,technical_index').eq('user_id',userId).eq('sport','Tenis').maybeSingle();
   if(!active)return;
   if(error){setNotice('Error al cargar la evaluación: '+error.message);return;}
   if(data){const a=data.answers as number[];if(Array.isArray(a)){const restored:Record<number,number>={};a.forEach((v,i)=>{if(Number.isInteger(v)&&v>=0&&v<=3)restored[i]=v});setAnswers(restored)}setPrevious(Number(data.technical_index));setSaved(true)}
  }
  void load();return()=>{active=false};
 },[userId,sport]);
 const completed=Object.keys(answers).length;
 const technical=completed===20?mean([2,3,4,5,6,7,8,9,10,11,12].map(i=>answers[i]))/3*100:null;
 const inconsistent=completed===20 && mean([2,3,4,5,6,7,8,9,10,11,12].map(i=>answers[i]))<1.5 && answers[13]>=3;
 async function save(){
  if(!supabase||technical===null||sport!=='Tenis')return;
  setBusy(true);setNotice('');
  const {error}=await supabase.from('player_assessments').upsert({user_id:userId,sport:'Tenis',assessment_version:'tennis-20-v1',answers:Array.from({length:20},(_,i)=>answers[i]),technical_index:Number(technical.toFixed(2)),status:'pending_calibration',updated_at:new Date().toISOString()},{onConflict:'user_id,sport'});
  setBusy(false);
  if(error){setNotice('No se pudo guardar: '+error.message);return}
  setSaved(true);setPrevious(technical);setNotice('Evaluación avanzada guardada. Tu rating 1–16+ se calculará cuando validemos la escala.');
 }
 return <section style={{border:'1px solid #e5c3ca',background:'#fffafa',borderRadius:14,padding:'clamp(16px,3vw,24px)',display:'grid',gap:16}}>
  <div><h2 style={{margin:'0 0 6px'}}>RACKETON Rating · Evaluación avanzada</h2><p style={{margin:0,color:'#5c5053'}}>20 preguntas para tenis. El resultado es un índice técnico experimental, no un rating internacional verificado.</p></div>
  <label style={{fontWeight:700}}>Deporte
   <select style={{...inputStyle,marginTop:6}} value={sport} onChange={e=>setSport(e.target.value as Sport)}>{enabledSports.map(s=><option key={s}>{s}</option>)}</select>
  </label>
  {enabledSports.length===0?<p>Activa primero un deporte en «Mis deportes».</p>:sport!=='Tenis'?<p>El cuestionario avanzado de {sport} está en preparación. Conservamos tu nivel anterior sin modificarlo.</p>:<>
   {saved&&<p style={{margin:0,color:'#147344'}}>Evaluación guardada{previous!==null?` · Índice técnico ${previous.toFixed(1)}/100`:''}. Puedes revisarla y volver a guardarla.</p>}
   <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{BLOCKS.map((b,i)=><button key={b} type="button" onClick={()=>setBlock(i)} style={{border:'1px solid #d9b5be',borderRadius:20,padding:'7px 10px',cursor:'pointer',background:i===block?'#C8102E':'white',color:i===block?'white':'#333'}}>{b}</button>)}</div>
   <p style={{margin:0,color:'#655'}}>Respondidas: {completed}/20</p>
   {QUESTIONS.map((q,i)=>q.block===BLOCKS[block]?<label key={i} style={{display:'grid',gap:6,fontWeight:600,fontSize:14}}>{i+1}. {q.question}
    <select style={inputStyle} value={answers[i]===undefined?'':String(answers[i])} onChange={e=>{setAnswers(a=>({...a,[i]:Number(e.target.value)}));setSaved(false)}}>
     <option value="" disabled>Selecciona tu respuesta</option>{q.options.map((o,j)=><option key={j} value={j}>{o}</option>)}
    </select></label>:null)}
   <div style={{display:'flex',justifyContent:'space-between',gap:10}}><button type="button" disabled={block===0} onClick={()=>setBlock(b=>b-1)}>Anterior</button><button type="button" disabled={block===4} onClick={()=>setBlock(b=>b+1)}>Siguiente bloque</button></div>
   {technical!==null&&<div style={{background:'white',borderRadius:9,padding:14,border:'1px solid #e9d4d9'}}><strong>Índice técnico-táctico declarado: {technical.toFixed(1)}/100</strong><p style={{margin:'5px 0 0'}}>No equivale a una puntuación 1–16+. Los resultados competitivos deberán calibrar la escala.</p>{inconsistent&&<p style={{color:'#b42332'}}>Revisión recomendada: competición oficial declarada y competencia técnica básica. Conviene aportar resultados verificables.</p>}</div>}
   <button type="button" className="primary" disabled={busy||completed!==20} onClick={()=>void save()}>{busy?'Guardando…':'Guardar evaluación avanzada'}</button>
   {notice&&<p role="status" style={{margin:0,color:notice.startsWith('Evaluación')?'#147344':'#b42332'}}>{notice}</p>}
   <p style={{margin:0,fontSize:12,color:'#736b6d'}}>Las valoraciones anteriores se mantienen sin cambios. Cuestionario piloto; no se usa aún para buscar rivales ni actualizar ratings.</p>
  </>}
 </section>;
}
