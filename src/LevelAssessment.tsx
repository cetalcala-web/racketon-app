import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Sport = 'Tenis'|'Pádel'|'Pickleball'|'Squash'|'Bádminton';
type Answer = { label: string; points: number };
type Question = { title: string; answers: Answer[] };
type Assessment = { rating: number; answers: number[]; status: string; matches_played: number };
const experience: Answer[] = [
  {label:'Menos de 6 meses',points:0},{label:'Entre 6 meses y 2 años',points:1},
  {label:'Entre 2 y 5 años',points:2},{label:'Más de 5 años',points:3}
];
const training: Answer[] = [
  {label:'Juego ocasionalmente, sin entrenamiento',points:0},
  {label:'Juego o entreno 1 vez por semana',points:1},
  {label:'Entreno 2-3 veces por semana',points:2},
  {label:'Entreno 4 o más veces por semana',points:3}
];
const competition: Answer[] = [
  {label:'Nunca he competido',points:0},
  {label:'Partidos amistosos y eventos recreativos',points:1},
  {label:'Ligas o torneos locales con regularidad',points:2},
  {label:'Competiciones federadas o de alto nivel',points:3}
];
const frequency: Answer[] = [
  {label:'Menos de una vez al mes',points:0},
  {label:'1-3 veces al mes',points:1},
  {label:'1-2 veces por semana',points:2},
  {label:'3 o más veces por semana',points:3}
];
const technique: Record<Sport, Answer[]> = {
  'Tenis': [
    {label:'Me cuesta mantener un peloteo y controlar el saque',points:0},
    {label:'Mantengo intercambios sencillos y saco con irregularidad',points:1},
    {label:'Dirijo golpes, varío efectos y construyo puntos',points:2},
    {label:'Domino patrones tácticos, cambios de ritmo y saque bajo presión',points:3}
  ],
  'Pádel': [
    {label:'Estoy aprendiendo los golpes básicos y el rebote de pared',points:0},
    {label:'Mantengo peloteos y utilizo las paredes de forma básica',points:1},
    {label:'Manejo globos, bandejas, paredes y posición de pareja',points:2},
    {label:'Domino transiciones, víbora, defensa compleja y táctica competitiva',points:3}
  ],
  'Pickleball': [
    {label:'Estoy aprendiendo saque, devolución y reglas',points:0},
    {label:'Mantengo intercambios y empiezo a jugar en la zona de no volea',points:1},
    {label:'Utilizo tercer golpe, dinks y transiciones con intención',points:2},
    {label:'Controlo resets, presión en cocina y patrones avanzados',points:3}
  ],
  'Squash': [
    {label:'Estoy aprendiendo golpes básicos y desplazamientos',points:0},
    {label:'Mantengo intercambios y recupero el centro de pista a veces',points:1},
    {label:'Juego profundidad, voleas y desplazamientos con control',points:2},
    {label:'Domino longitud, cambios de ritmo, anticipación y táctica',points:3}
  ],
  'Bádminton': [
    {label:'Estoy aprendiendo saque, clear y desplazamientos',points:0},
    {label:'Mantengo intercambios con golpes básicos',points:1},
    {label:'Combino clear, drop, smash y desplazamientos eficaces',points:2},
    {label:'Domino engaños, transiciones rápidas y patrones competitivos',points:3}
  ]
};
const weights = [0.15,0.15,0.25,0.35,0.10];
const inputStyle: React.CSSProperties = {width:'100%',padding:'11px',border:'1px solid #d7d7dc',borderRadius:8,background:'white',color:'#202027',fontSize:14};
function ratingFor(answers:number[]):number {
  const normalized = answers.reduce((total,point,index)=>total+(point/3)*weights[index],0);
  return Math.round((1+6*normalized)*10)/10;
}
function levelLabel(rating:number):string {
  if(rating<2) return 'Iniciación';
  if(rating<3) return 'Básico';
  if(rating<4) return 'Intermedio';
  if(rating<5) return 'Avanzado';
  return 'Competición';
}
export default function LevelAssessment({userId,enabledSports}:{userId:string;enabledSports:Sport[]}) {
  const [sport,setSport] = useState<Sport>('Tenis');
  const [answers,setAnswers] = useState<(number|null)[]>([null,null,null,null,null]);
  const [records,setRecords] = useState<Partial<Record<Sport,Assessment>>>({});
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      const {data,error}=await supabase.from('player_ratings').select('sport,rating,answers,status,matches_played').eq('user_id',userId);
      if(!active)return;
      if(error){setNotice('No se pudieron cargar los niveles: '+error.message);return;}
      const next:Partial<Record<Sport,Assessment>>={};
      for(const item of data??[]){
        if(item.sport in technique)next[item.sport as Sport]={rating:Number(item.rating),answers:item.answers as number[],status:item.status,matches_played:item.matches_played};
      }
      setRecords(next);
    }
    void load();
    return()=>{active=false};
  },[userId]);
  useEffect(()=>{
    if(enabledSports.length>0 && !enabledSports.includes(sport))setSport(enabledSports[0]);
  },[enabledSports,sport]);
  useEffect(()=>{
    const saved=records[sport];
    setAnswers(saved?.answers?.length===5?saved.answers:[null,null,null,null,null]);
  },[sport,records]);
  const questions:Question[] = [
    {title:'¿Cuánto tiempo llevas practicando este deporte?',answers:experience},
    {title:'¿Qué entrenamiento has realizado habitualmente?',answers:training},
    {title:'¿Cómo describirías tu dominio técnico y táctico?',answers:technique[sport]},
    {title:'¿Cuál es tu experiencia en competición?',answers:competition},
    {title:'¿Con qué frecuencia juegas actualmente?',answers:frequency}
  ];
  const complete=answers.every(value=>value!==null);
  const score=complete?ratingFor(answers as number[]):null;
  async function save(){
    if(!supabase||score===null)return;
    setBusy(true);setNotice('');
    const {error}=await supabase.from('player_ratings').upsert({
      user_id:userId,sport,rating:score,answers,status:'provisional',matches_played:0,
      updated_at:new Date().toISOString()
    },{onConflict:'user_id,sport'});
    setBusy(false);
    if(error){setNotice('No se pudo guardar la evaluación: '+error.message);return;}
    setRecords(old=>({...old,[sport]:{rating:score,answers:answers as number[],status:'provisional',matches_played:0}}));
    setNotice('Nivel provisional de '+sport+' guardado correctamente.');
  }
  return <section style={{border:'1px solid #e5c3ca',background:'#fffafa',borderRadius:14,padding:'clamp(16px,3vw,24px)',display:'grid',gap:15}}>
    <div><h2 style={{margin:'0 0 6px'}}>Mi nivel RACKETON</h2><p style={{margin:0,color:'#5c5053'}}>Completa cinco preguntas por cada deporte. La puntuación de 1,0 a 7,0 es provisional y se ajustará cuando se implementen los resultados de partidos.</p></div>
    {enabledSports.length===0?<p>Activa primero un deporte en «Mis deportes».</p>:<>
      <label style={{fontWeight:700}}>Deporte a evaluar
        <select style={{...inputStyle,marginTop:6}} value={sport} onChange={e=>{setSport(e.target.value as Sport);setNotice('')}}>
          {enabledSports.map(name=><option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      {records[sport]&&<div style={{background:'#fff',borderRadius:9,padding:14,border:'1px solid #e9d4d9'}}>
        <strong>{sport}: {records[sport]!.rating.toFixed(1).replace('.',',')} / 7,0 · {levelLabel(records[sport]!.rating)}</strong>
        <p style={{margin:'4px 0 0',color:'#6b6265'}}>Nivel provisional · {records[sport]!.matches_played} partidos computados</p>
      </div>}
      {questions.map((q,index)=><label key={index} style={{display:'grid',gap:6,fontWeight:600,fontSize:14}}>
        {index+1}. {q.title}
        <select style={inputStyle} value={answers[index]===null?'':String(answers[index])}
          onChange={e=>setAnswers(old=>old.map((v,i)=>i===index?Number(e.target.value):v))}>
          <option value="" disabled>Selecciona una respuesta</option>
          {q.answers.map(answer=><option key={answer.points} value={answer.points}>{answer.label}</option>)}
        </select>
      </label>)}
      {score!==null&&<div style={{padding:14,background:'#fff',borderRadius:10}}>
        <strong>Resultado estimado: {score.toFixed(1).replace('.',',')} / 7,0 · {levelLabel(score)}</strong>
        <p style={{margin:'5px 0 0',color:'#686068'}}>Autoevaluación orientativa; no acredita un nivel competitivo verificado.</p>
      </div>}
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12}}>
        <button type="button" className="primary" disabled={!complete||busy} onClick={()=>void save()}>{busy?'Guardando...':'Guardar nivel provisional'}</button>
        {notice&&<span role="status" style={{color:notice.startsWith('Nivel')?'#147344':'#b42332',fontSize:14}}>{notice}</span>}
      </div>
      <p style={{margin:0,fontSize:12,color:'#736b6d'}}>Evaluación inicial experimental. La escala y sus ponderaciones deberán validarse con jugadores de distintos niveles antes de utilizarse como clasificación competitiva.</p>
    </>}
  </section>;
}
