import {useEffect,useState} from 'react';
import {supabase} from './supabase';
type Sport='Pádel'|'Pickleball';
type Rating={rating:number;status:string;matches_played:number};
const QUESTIONS:Record<Sport,string[]>={
 'Pádel':["¿Cuántos años llevas jugando al pádel con regularidad?", "¿Con qué frecuencia entrenas o juegas?", "¿Qué formación técnica de pádel has recibido?", "¿Controlas la dirección y profundidad de derecha y revés?", "¿Cómo utilizas el globo defensivo para recuperar la red?", "¿Cómo defiendes una pelota tras rebotar en el cristal de fondo?", "¿Cómo interpretas y juegas las dobles paredes?", "¿Qué dominio tienes de la volea de derecha y revés?", "¿Cómo ejecutas la bandeja para conservar la posición en red?", "¿Qué control tienes de la víbora y sus direcciones?", "¿Cómo seleccionas cuándo rematar y cuándo mantener el punto?", "¿Cómo te desplazas y coordinas con tu pareja?", "¿Cómo realizas las transiciones entre fondo y red?", "¿Cómo gestionas los cambios de ritmo y la elección de golpes?", "¿Cómo juegas bajo presión en puntos importantes?", "¿En qué nivel de ligas o torneos has competido?", "¿Qué resultados tienes ante parejas de nivel conocido?", "¿Cuántos partidos competitivos has disputado el último año?", "¿Puedes aportar resultados verificables de tus partidos?", "¿Qué nivel de oposición sueles superar en partidos equilibrados?"],
 'Pickleball':["¿Cuánto tiempo llevas jugando al pickleball regularmente?", "¿Con qué frecuencia entrenas o juegas?", "¿Qué formación técnica específica has recibido?", "¿Qué consistencia tienes en saque y devolución profundos?", "¿Cómo ejecutas el tercer golpe drop?", "¿Cómo ejecutas el tercer golpe drive cuando conviene?", "¿Qué control tienes de los dinks cruzados y paralelos?", "¿Cómo resuelves intercambios rápidos de voleas en la cocina?", "¿Cómo utilizas el reset cuando te presionan?", "¿Cómo realizas la transición hacia la zona de no volea?", "¿Qué control tienes de los bloqueos frente a ataques rápidos?", "¿Cómo seleccionas golpes y posiciones jugando dobles?", "¿Cómo cubres el centro y coordinas cambios con tu pareja?", "¿Cómo gestionas ataques, contraataques y paciencia táctica?", "¿Cómo mantienes el rendimiento en puntos decisivos?", "¿En qué nivel de ligas o torneos has competido?", "¿Qué resultados tienes frente a jugadores de nivel conocido?", "¿Cuántos partidos competitivos has disputado el último año?", "¿Puedes aportar resultados verificables de tus partidos?", "¿Qué nivel de oposición sueles superar en partidos equilibrados?"]
};
const OPTIONS=[
 ['Sin experiencia o menos de 6 meses','Entre 6 meses y 2 años','Entre 2 y 5 años','Más de 5 años'],
 ['Ocasionalmente','Una vez por semana','Dos o tres veces por semana','Cuatro o más veces por semana'],
 ['Sin formación','Clases ocasionales','Entrenamiento regular','Entrenamiento competitivo estructurado']
];
const SKILL=['No lo domino o fallo habitualmente','Lo consigo en situaciones sencillas','Lo realizo con consistencia en partido','Lo domino ante rivales exigentes y bajo presión'];
const COMP=['Sin experiencia competitiva','Partidos amistosos','Ligas y torneos de club','Competición avanzada con resultados contrastables'];
const RESULTS=['Sin referencias de nivel','Referencias solo estimadas','Resultados contra rivales identificables','Resultados verificables ante rivales de nivel contrastado'];
const MATCHES=['Ninguno','Entre 1 y 5','Entre 6 y 20','Más de 20'];
const EVIDENCE=['No dispongo de resultados','Solo recuerdo resultados aproximados','Conservo marcadores de varios partidos','Conservo marcadores, fechas y rivales verificables'];
function options(i:number){return i<3?OPTIONS[i]:i<15?SKILL:i===15?COMP:i===16||i===19?RESULTS:i===17?MATCHES:EVIDENCE}
const field:React.CSSProperties={width:'100%',padding:'10px',border:'1px solid #d4d7de',borderRadius:8,background:'#fff',color:'#202027',boxSizing:'border-box'};
export default function RacketSportAssessment104({userId,enabledSports}:{userId:string;enabledSports:string[]}){
 const [sport,setSport]=useState<Sport>('Pádel');
 const [answers,setAnswers]=useState<(number|null)[]>(Array(20).fill(null));
 const [rating,setRating]=useState<Rating|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [page,setPage]=useState(0);
 const available=(['Pádel','Pickleball'] as Sport[]).filter(x=>enabledSports.includes(x));
 useEffect(()=>{if(available.length&&!available.includes(sport))setSport(available[0])},[enabledSports.join(','),sport]);
 useEffect(()=>{let live=true;setNotice('');setPage(0);setRating(null);setAnswers(Array(20).fill(null));if(!supabase)return;
  void Promise.all([supabase.from('racket_sport_assessments').select('answers').eq('user_id',userId).eq('sport',sport).maybeSingle(),supabase.from('racket_sport_ratings').select('rating,status,matches_played').eq('user_id',userId).eq('sport',sport).maybeSingle()]).then(([a,r])=>{
   if(!live)return;if(a.error||r.error){setNotice('No se pudieron cargar los datos de '+sport+'. Comprueba que has ejecutado el SQL 0027.');return}
   if(Array.isArray(a.data?.answers)&&a.data.answers.length===20)setAnswers(a.data.answers.map((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<=3?Number(n):null));
   if(r.data)setRating({rating:Number(r.data.rating),status:r.data.status,matches_played:Number(r.data.matches_played)});
  });return()=>{live=false}},[userId,sport]);
 const completed=answers.filter(v=>v!==null).length;
 const preview=completed===20?(()=>{const mean=(a:number[])=>a.reduce((x,y)=>x+y,0)/a.length/3;const vals=answers as number[];const score=.15*mean(vals.slice(0,3))+.6*mean(vals.slice(3,15))+.25*mean(vals.slice(15));return sport==='Pádel'?Math.min(5.5,Math.round(score*5.5*100)/100):Math.min(5,Math.round((2+score*3)*100)/100)})():null;
 async function save(){if(!supabase||completed!==20)return;setBusy(true);setNotice('');const {data,error}=await supabase.rpc('racketon_save_sport_assessment_104',{p_sport:sport,p_answers:answers});setBusy(false);if(error){setNotice('Error: '+error.message);return}setRating({rating:Number(data),status:'provisional',matches_played:0});setNotice('Evaluación guardada. Tu rating provisional ya está disponible.');}
 if(!available.length)return null;
 return <section style={{marginTop:22,border:'1px solid #e3d5d9',borderRadius:15,padding:'clamp(16px,3vw,24px)',background:'#fff',display:'grid',gap:15}}>
 <div><h2 style={{margin:'0 0 5px'}}>Rating inicial · Pádel y pickleball</h2><p style={{color:'#64748b',margin:0,fontSize:14}}>20 preguntas específicas por deporte. El resultado es provisional y propio de RACKETON; no es un rating oficial de Playtomic o DUPR.</p></div>
 <div style={{display:'flex',gap:8}}>{available.map(s=><button type="button" key={s} onClick={()=>setSport(s)} style={{padding:'10px 18px',borderRadius:9,border:sport===s?'2px solid #c8102e':'1px solid #ddd',background:sport===s?'#fff1f3':'white',fontWeight:700}}>{s}</button>)}</div>
 {rating&&<div style={{padding:16,borderRadius:10,background:'#f8fafc'}}><strong style={{fontSize:25,color:'#c8102e'}}>{rating.rating.toFixed(2)}</strong><span style={{fontSize:13,color:'#64748b'}}> / {sport==='Pádel'?'7,00':'8,00'} · {rating.status==='provisional'?'Provisional':rating.status==='calibrating'?'En calibración':'Consolidado'} · {rating.matches_played} partidos computados</span></div>}
 <div style={{fontSize:13,color:'#64748b'}}>Bloque {page+1} de 4 · {completed}/20 respuestas</div>
 {QUESTIONS[sport].slice(page*5,page*5+5).map((question,i)=>{const index=page*5+i;return <label key={index} style={{display:'grid',gap:6,fontWeight:650,fontSize:14}}>{index+1}. {question}<select style={field} value={answers[index]===null?'':String(answers[index])} onChange={e=>setAnswers(old=>old.map((v,j)=>j===index?Number(e.target.value):v))}><option value="" disabled>Selecciona una respuesta</option>{options(index).map((o,n)=><option value={n} key={n}>{o}</option>)}</select></label>})}
 <div style={{display:'flex',gap:10,justifyContent:'space-between'}}><button type="button" disabled={page===0} onClick={()=>setPage(x=>Math.max(0,x-1))} style={{...field,width:'auto',cursor:'pointer'}}>Anterior</button><button type="button" disabled={page===3} onClick={()=>setPage(x=>Math.min(3,x+1))} style={{...field,width:'auto',cursor:'pointer'}}>Siguiente</button></div>
 {preview!==null&&<p style={{margin:0}}>Resultado provisional estimado: <strong>{preview.toFixed(2)}</strong> ({sport==='Pádel'?'escala 0–7':'escala 2–8'}).</p>}
 <button type="button" className="primary" disabled={busy||completed!==20||Boolean(rating&&rating.matches_played>0)} onClick={()=>void save()}>{busy?'Guardando…':rating?'Actualizar evaluación provisional':'Guardar mi rating inicial'}</button>
 {rating&&rating.matches_played>0&&<p style={{fontSize:13,color:'#64748b'}}>El rating ya tiene resultados competitivos; no se puede reiniciar mediante una autoevaluación.</p>}
 {notice&&<p role="status" style={{color:notice.startsWith('Error')?'#b42332':'#166534',margin:0}}>{notice}</p>}
 <p style={{fontSize:12,color:'#64748b',margin:0}}>La autoevaluación sirve para encontrar rivales aproximados. Se validará y calibrará con resultados de partidos confirmados. No existe conversión oficial a Playtomic o DUPR.</p>
 </section>
}
