import SchoolManager090 from './SchoolManager091';
import {PlayerEnrollments084} from './RankingEnrollments084';
import { useEffect, useState } from 'react';
import { Home, Trophy, CalendarDays, Users, UserRound, LogIn, LogOut, Menu, X, ChartNoAxesColumnIncreasing, ShieldCheck, ArrowRight, MapPin, Wallet, Bell, Search, Swords, ListChecks, Layers3, UserPen, History } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase } from './supabase';
import LevelAssessment from './LevelAssessmentAdvanced';
import RacketSportAssessment105 from './RacketSportAssessment105';
import PlayerSearch from './PlayerSearch';
import { CountrySelect } from './CountrySelect';
import TennisChallenges from './TennisChallenges';
import TennisLeaderboard from './TennisLeaderboard';
import RacketonNationalRanking108 from './RacketonNationalRanking108';
import TennisResults from './TennisResults';
import RacketonDoubles107 from './RacketonDoubles107';
import TennisRatingHistory from './TennisRatingHistory';
import TennisRatingSimulation1091 from './TennisRatingSimulation1091';
import TennisCompetitiveProfile from './TennisCompetitiveProfile';
import {ClubPortal,PlayerLeagues} from './RacketonAccess085';
import ClubRankingsAdmin084 from './ClubRankingsAdmin084';

type Tab = 'Inicio'|'Jugadores'|'Desafíos'|'Rankings'|'Mis ligas'|'Clubes'|'Escuelas'|'Torneos'|'Reservas'|'Perfil';
const tabs: {name:Tab;icon:LucideIcon}[] = [{name:'Inicio',icon:Home},{name:'Jugadores',icon:Users},{name:'Desafíos',icon:Trophy},{name:'Rankings',icon:ChartNoAxesColumnIncreasing},{name:'Mis ligas',icon:Users},{name:'Clubes',icon:ShieldCheck},{name:'Escuelas',icon:Users},{name:'Torneos',icon:Trophy},{name:'Reservas',icon:CalendarDays},{name:'Perfil',icon:UserRound}];
const playerTabs:Tab[]=['Inicio','Jugadores','Desafíos','Rankings','Mis ligas','Torneos','Reservas','Perfil'];
const clubTabs:Tab[]=['Escuelas','Rankings','Clubes'];
const roleCards=[
 {id:'player',title:'Jugador',subtitle:'Mi ranking, resultados, historial, torneos, ligas y perfil',icon:'🎾'},
 {id:'club',title:'Club',subtitle:'Escuelas, alumnos, pistas, personal, tienda y administración',icon:'🏟️'},
 {id:'referee',title:'Árbitro',subtitle:'Área profesional de arbitraje · Próximamente',icon:'📋'},
 {id:'federation',title:'Federación',subtitle:'Gestión territorial y federativa · Próximamente',icon:'🏆'}
] as const;
const sections: Record<Tab,{title:string;subtitle:string;icon:LucideIcon;items:string[]}> = {
  Inicio:{title:'Tu pista. Tu comunidad.',subtitle:'La plataforma de los deportes de raqueta.',icon:Home,items:[]},
  Jugadores:{title:'Encuentra jugadores',subtitle:'Conecta con rivales de tu deporte y nivel.',icon:Users,items:['Búsqueda por deporte y nivel','Desafíos entre jugadores','Historial de enfrentamientos']},
  'Desafíos':{title:'Mis desafíos',subtitle:'Gestiona propuestas de partidos amistosos y de ranking.',icon:Trophy,items:[]},
  Rankings:{title:'Rankings y niveles',subtitle:'Consulta clasificaciones y sigue tu progresión.',icon:ChartNoAxesColumnIncreasing,items:['Rating independiente por deporte','Clasificaciones territoriales','Divisiones y estadísticas']},
  'Mis ligas':{title:'Mis ligas privadas',subtitle:'Organiza competiciones entre amigos.',icon:Users,items:[]},
  Escuelas:{title:'Escuelas y entrenamiento',subtitle:'Programas, temporadas y grupos del club.',icon:Users,items:[]},
  Clubes:{title:'Acceso profesional de clubes',subtitle:'Gestiona únicamente los clubes que te hayan autorizado.',icon:ShieldCheck,items:[]},
  Torneos:{title:'Torneos y cuadros',subtitle:'Compite en eventos adaptados a tu nivel.',icon:Trophy,items:['Inscripción a torneos','Cuadros eliminatorios','Fases de grupos y ligas']},
  Reservas:{title:'Reserva tu pista',subtitle:'La disponibilidad de pistas llegará con los clubes colaboradores.',icon:CalendarDays,items:['Instalaciones y pistas','Calendario de disponibilidad','Reservas y confirmaciones']},
  Perfil:{title:'Tu perfil deportivo',subtitle:'Una cuenta, todos tus deportes de raqueta.',icon:UserRound,items:['Perfil personal','Deportes y niveles','Historial deportivo']}
};
type SportLevel = 'Sin evaluar' | 'Iniciación' | 'Intermedio' | 'Avanzado' | 'Competición';
const sportNames = ['Tenis', 'Pádel', 'Pickleball', 'Squash', 'Bádminton'] as const;
type SportName = typeof sportNames[number];
type SportChoice = { enabled: boolean; level: SportLevel };
type SportsState = Record<SportName, SportChoice>;
type PlayerDetails = {
  display_name: string;
  city: string;
  birth_year: string;
  preferred_format: string;
  availability: string;
  sports: SportsState;
};
const defaultSports = (): SportsState => Object.fromEntries(sportNames.map(name => [name, {enabled:false, level:'Sin evaluar'}])) as SportsState;
const emptyDetails = (): PlayerDetails => ({display_name:'', city:'', birth_year:'', preferred_format:'Individual y dobles', availability:'', sports:defaultSports()});
const fieldStyle: React.CSSProperties = {display:'block',width:'100%',boxSizing:'border-box',padding:'12px',border:'1px solid #d8d8dc',borderRadius:9,marginTop:6,background:'#fff',color:'#202027',fontSize:15};
const labelStyle: React.CSSProperties = {display:'block',fontWeight:600,fontSize:14,color:'#303039'};

function PlayerProfile({user,mode='personal'}:{user:User;mode?:'personal'|'privacy'}) {
  const [details,setDetails] = useState<PlayerDetails>(emptyDetails);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState('');
  const [discoverable,setDiscoverable] = useState(false);
  const [country,setCountry] = useState('');
  const [rankingSex,setRankingSex] = useState('');
  const [nationality,setNationality] = useState('');
  const [showNationality,setShowNationality] = useState(false);
  const [photoUrl,setPhotoUrl] = useState('');
  const [photoBusy,setPhotoBusy] = useState(false);
  useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      setLoading(true);setMessage('');
      const {data,error}=await supabase.from('player_details').select('display_name,city,birth_year,preferred_format,availability,sports,photo_url,ranking_sex').eq('user_id',user.id).maybeSingle();
      if(!active)return;
      if(error){setMessage('No se pudo cargar el perfil: '+error.message)}
      else if(data){
        const savedSports=data.sports && typeof data.sports==='object' ? data.sports as Record<string, Partial<SportChoice>> : {};
        const sports=defaultSports();
        for(const name of sportNames){const saved=savedSports[name];if(saved){sports[name]={enabled:saved.enabled===true,level:(['Sin evaluar','Iniciación','Intermedio','Avanzado','Competición'].includes(String(saved.level))?saved.level:'Sin evaluar') as SportLevel}}}
        setPhotoUrl(typeof data.photo_url==='string'?data.photo_url:'');
        setRankingSex(data.ranking_sex??'');
        setDetails({display_name:data.display_name??'',city:data.city??'',birth_year:data.birth_year==null?'':String(data.birth_year),preferred_format:data.preferred_format??'Individual y dobles',availability:data.availability??'',sports});
      }
      const {data:visibility,error:visibilityError}=await supabase.from('player_discovery_preferences').select('discoverable,country,nationality,show_nationality').eq('user_id',user.id).maybeSingle();
      if(!active)return;
      if(visibilityError)setMessage('No se pudo cargar la visibilidad: '+visibilityError.message);
      else {setDiscoverable(visibility?.discoverable===true);setCountry(visibility?.country??'');setNationality(visibility?.nationality??'');setShowNationality(visibility?.show_nationality===true);}
      setLoading(false);
    }
    void load();return()=>{active=false};
  },[user.id]);
  async function uploadPhoto(file:File){
    if(!supabase)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setMessage('Selecciona JPG, PNG o WebP.');return;}
    if(file.size>2*1024*1024){setMessage('La fotografía debe ocupar menos de 2 MB.');return;}
    const year=Number(details.birth_year);
    if(!details.birth_year||!Number.isInteger(year)||new Date().getFullYear()-year<19){setMessage('Por ahora, la fotografía pública solo está disponible para mayores de edad con año de nacimiento indicado.');return;}
    if(!discoverable){setMessage('Para publicar tu foto, activa primero la visibilidad en el buscador y guarda tu perfil.');return;}
    setPhotoBusy(true);setMessage('');
    const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${user.id}/avatar.${extension}`;
    const {error:uploadError}=await supabase.storage.from('racketon-player-photos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'60'});
    if(uploadError){setMessage('Error al subir foto: '+uploadError.message);setPhotoBusy(false);return;}
    const url=supabase.storage.from('racketon-player-photos').getPublicUrl(path).data.publicUrl+'?v='+Date.now();
    const {error:saveError}=await supabase.from('player_details').upsert({user_id:user.id,photo_url:url},{onConflict:'user_id'});
    if(saveError){setMessage('Foto subida, pero no se pudo asociar: '+saveError.message);}
    else{setPhotoUrl(url);setMessage('Fotografía actualizada correctamente.');}
    setPhotoBusy(false);
  }
  async function removePhoto(){
    if(!supabase||!photoUrl)return;
    setPhotoBusy(true);setMessage('');
    const {error}=await supabase.from('player_details').update({photo_url:null}).eq('user_id',user.id);
    if(error){setMessage('No se pudo quitar la foto: '+error.message);setPhotoBusy(false);return;}
    await supabase.storage.from('racketon-player-photos').remove([`${user.id}/avatar.jpg`,`${user.id}/avatar.png`,`${user.id}/avatar.webp`]);
    setPhotoUrl('');setMessage('Fotografía eliminada del perfil.');setPhotoBusy(false);
  }
  function change<K extends Exclude<keyof PlayerDetails,'sports'>>(key:K,value:PlayerDetails[K]){setDetails(old=>({...old,[key]:value}));setMessage('')}
  function changeSport(name:SportName,update:Partial<SportChoice>){setDetails(old=>({...old,sports:{...old.sports,[name]:{...old.sports[name],...update}}}));setMessage('')}
  async function save(e:React.FormEvent){
    e.preventDefault();if(!supabase)return;
    const year=details.birth_year.trim()?Number(details.birth_year):null;
    if(year!==null && (!Number.isInteger(year)||year<1900||year>new Date().getFullYear())){setMessage('Introduce un año de nacimiento válido.');return}
    setSaving(true);setMessage('');
    const {error}=await supabase.from('player_details').upsert({user_id:user.id,display_name:details.display_name.trim(),city:details.city.trim(),birth_year:year,preferred_format:details.preferred_format,availability:details.availability.trim(),sports:details.sports,ranking_sex:rankingSex||null},{onConflict:'user_id'});
    if(error){setSaving(false);setMessage('No se pudo guardar: '+error.message);return;}
    const {error:privacyError}=await supabase.from('player_discovery_preferences').upsert({user_id:user.id,discoverable,country:country.trim(),nationality:nationality.trim(),show_nationality:showNationality},{onConflict:'user_id'});
    setSaving(false);setMessage(privacyError?'Datos guardados, pero no se pudo guardar la privacidad: '+privacyError.message:'¡Cambios guardados correctamente!');
  }
  return <div className="rkt-personal-wrap">
    <div className="rkt-personal-account"><div className="rkt-personal-account-icon"><ShieldCheck size={21}/></div><div><strong>Cuenta RACKETON</strong><span>{user.email}</span></div><span className="rkt-personal-account-state">Cuenta activa</span></div>
    {loading?<div className="rkt-personal-card" style={{padding:28}}>Cargando información...</div>:<form onSubmit={save} className="rkt-personal-form">
      {mode==='personal'?<>
      <div className="rkt-personal-card">
        <div className="rkt-personal-card-title"><div><h2>Fotografía de perfil</h2><p>Personaliza cómo te ven otros jugadores en RACKETON.</p></div></div>
        <div className="rkt-personal-photo-row">
          {photoUrl?<img src={photoUrl} alt="Fotografía de perfil" className="rkt-personal-avatar"/>:<div className="rkt-personal-avatar rkt-personal-avatar-empty"><UserRound size={43}/></div>}
          <div className="rkt-personal-photo-info"><strong>Tu imagen en RACKETON</strong><span>JPG, PNG o WebP · Máximo 2 MB. La fotografía pública requiere mayoría de edad y perfil visible.</span><div className="rkt-personal-actions"><label className="rkt-personal-upload">{photoBusy?'Procesando…':photoUrl?'Cambiar fotografía':'Subir fotografía'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadPhoto(f);e.target.value='';}}/></label>{photoUrl&&<button className="rkt-personal-secondary" type="button" disabled={photoBusy} onClick={()=>void removePhoto()}>Eliminar</button>}</div></div>
        </div>
      </div>
      <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Información personal</h2><p>Estos datos identifican tu cuenta y permiten personalizar tu experiencia.</p></div></div>
        <div className="rkt-personal-fields">
          <label>Nombre visible en RACKETON<input maxLength={80} value={details.display_name} onChange={e=>change('display_name',e.target.value)} placeholder="Nombre y apellidos"/></label>
          <label>Localidad<input maxLength={100} value={details.city} onChange={e=>change('city',e.target.value)} placeholder="Tu ciudad"/></label>
          <label>Año de nacimiento<input type="number" min="1900" max={new Date().getFullYear()} value={details.birth_year} onChange={e=>change('birth_year',e.target.value)} placeholder="Año de nacimiento"/></label>
          <label>Sexo<select value={rankingSex} onChange={e=>setRankingSex(e.target.value)}><option value="">Prefiero no indicarlo</option><option value="male">Masculino</option><option value="female">Femenino</option><option value="other">Otro</option></select></label>
          <label>País de residencia<CountrySelect value={country} onChange={setCountry} style={fieldStyle}/></label>
          <label>Nacionalidad (opcional)<CountrySelect value={nationality} onChange={setNationality} style={fieldStyle}/></label>
        </div>
      </div>
      <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Mi cuenta</h2><p>Información de acceso a la aplicación.</p></div></div><div className="rkt-personal-email"><span>Correo electrónico de acceso</span><strong>{user.email}</strong><small>El cambio de correo y contraseña se gestionará desde Configuración.</small></div></div>
      </>:<div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Privacidad y visibilidad</h2><p>Decide qué información puede consultar la comunidad de jugadores.</p></div></div>
        <div className="rkt-personal-toggles"><label><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)}/><span><strong>Mostrar mi perfil en el buscador de jugadores</strong><small>Otros jugadores podrán encontrar tu nombre deportivo, ciudad y datos deportivos públicos. Nunca se mostrará tu correo electrónico.</small></span></label><label><input type="checkbox" checked={showNationality} onChange={e=>setShowNationality(e.target.checked)}/><span><strong>Mostrar mi nacionalidad</strong><small>Permite que otros jugadores vean tu nacionalidad en el perfil público.</small></span></label></div>
        {discoverable&&(!country.trim()||!details.city.trim()||!details.display_name.trim())&&<p className="rkt-personal-warning">Para aparecer en el buscador, completa el nombre, la localidad y el país en Datos personales.</p>}
      </div>}
      <div className="rkt-personal-save"><button className="primary" type="submit" disabled={saving}>{saving?'Guardando...':'Guardar cambios'}</button>{message&&<span role="status" style={{color:message.includes('correctamente')?'#137442':'#b42332',fontWeight:650,fontSize:13}}>{message}</span>}</div>
    </form>}
  </div>;
}

// El RPC my_tennis_rating_history_072 devuelve sets como [[juegos_retador,juegos_desafiado], ...].
function formatTennisSets116(raw:unknown, challengerId:string|undefined, currentUserId:string):string {
 let value:unknown=raw;
 if(typeof value==='string'){try{value=JSON.parse(value)}catch{return ''}}
 if(!Array.isArray(value))return '';
 const myFirst=challengerId===currentUserId;
 return value.map((set:unknown)=>{
  if(!Array.isArray(set)||set.length<2)return '';
  const a=Number(set[myFirst?0:1]);const b=Number(set[myFirst?1:0]);
  return Number.isFinite(a)&&Number.isFinite(b)?`${a}-${b}`:'';
 }).filter(Boolean).join(' / ');
}
type PlayerHomeSport = 'Tenis' | 'Pádel' | 'Pickleball';
const launchSports:PlayerHomeSport[]=['Tenis','Pádel','Pickleball'];
function PlayerHome102({user,onNavigate}:{user:User;onNavigate:(tab:Tab)=>void}){
 const [sport,setSport]=useState<PlayerHomeSport>('Tenis');
 const [rating,setRating]=useState<{rating:number;status:string;matches_played:number}|null>(null);
 const [otherRatings,setOtherRatings]=useState<Record<string,{rating:number;status:string;matches_played:number}>>({});
 const [name,setName]=useState('');
 const [city,setCity]=useState('');
 const [homePhoto,setHomePhoto]=useState('');
 const [enabled,setEnabled]=useState<Record<string,boolean>>({});
 const [pending,setPending]=useState<number|null>(null);
 const [recent,setRecent]=useState<{opponent_name:string;won:boolean;rating_delta:number;played_at:string;score:string;venue:string}[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase)return;
   setLoading(true);setError('');
   const client=supabase;
   const [profileResult,ratingResult,incomingResult,historyResult,otherResult]=await Promise.all([
    client.from('player_details').select('display_name,sports,photo_url,city').eq('user_id',user.id).maybeSingle(),
    client.from('tennis_ratings').select('rating,status,matches_played').eq('user_id',user.id).maybeSingle(),
    client.from('tennis_challenges').select('id',{count:'exact',head:true}).eq('challenged_id',user.id).eq('status','pending'),
    client.rpc('my_tennis_rating_history_072'),
    client.from('racket_sport_ratings').select('sport,rating,status,matches_played').eq('user_id',user.id)
   ]);
   if(!active)return;
   if(profileResult.error)setError('No se pudo cargar el perfil deportivo.');
   const details=profileResult.data;
   setName(typeof details?.display_name==='string'?details.display_name:'');
   setCity(typeof details?.city==='string'?details.city:'');
   const sports=details?.sports as Record<string,{enabled?:boolean}>|null|undefined;
   setEnabled(Object.fromEntries(launchSports.map(x=>[x,sports?.[x]?.enabled===true])));
   if(ratingResult.error)setError('No se pudo cargar el rating de tenis.');
   setRating(ratingResult.data?{rating:Number(ratingResult.data.rating),status:String(ratingResult.data.status),matches_played:Number(ratingResult.data.matches_played)}:null);
   if(!otherResult.error)setOtherRatings(Object.fromEntries((otherResult.data??[]).map((x:{sport:string;rating:number;status:string;matches_played:number})=>[x.sport,{rating:Number(x.rating),status:x.status,matches_played:Number(x.matches_played)}])));
   if(incomingResult.error)setError('No se pudieron consultar todos los desafíos.');
   setHomePhoto(typeof profileResult.data?.photo_url==='string'?profileResult.data.photo_url:'');
   setPending(incomingResult.error?null:incomingResult.count??0);
   if(historyResult.error)setError('Algunos datos del historial no están disponibles.');
   const recentRows=Array.isArray(historyResult.data)?historyResult.data.slice(0,3) as Record<string,unknown>[]:[];
   // La consulta histórica ya trae el marcador real en `sets`. Consultamos el retador
   // para mostrar los juegos desde la perspectiva del usuario conectado.
   const ids=recentRows.map(x=>String(x.challenge_id??'')).filter(Boolean);
   const challengeLookup=ids.length?await client.from('tennis_challenges').select('id,challenger_id').in('id',ids):null;
   if(!active)return;
   const challengerById=new Map<string,string>((challengeLookup?.data??[]).map((c:{id:string;challenger_id:string})=>[c.id,c.challenger_id]));
   setRecent(recentRows.map(x=>{const firstText=(...values:unknown[])=>values.find(v=>typeof v==='string'&&v.trim().length>0) as string|undefined;
    const challenger=challengerById.get(String(x.challenge_id??''));
    const score=challenger?formatTennisSets116(x.sets,challenger,user.id):'';
    return {opponent_name:String(x.opponent_name??''),won:x.won===true,rating_delta:Number(x.rating_delta??0),played_at:String(x.played_at??''),score:score||(!challenger&&Array.isArray(x.sets)?'Marcador disponible en resultados':firstText(x.score,x.match_score,x.final_score,x.result_score,x.sets_score)??''),venue:firstText(x.venue_name,x.club_name,x.facility_name,x.location_name,x.venue,x.club)??''};
   }));
   setLoading(false);
  }
  void load();return()=>{active=false};
 },[user.id]);
 const selectedEnabled=enabled[sport]===true;
 const activeRating=sport==='Tenis'?rating:otherRatings[sport]??null;
 const card:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:22,boxShadow:'0 4px 18px #0f172a08'};
 const action:React.CSSProperties={padding:'12px 16px',background:'#c8102e',border:0,borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer'};
 return <section className="content interior" style={{maxWidth:1160,margin:'24px auto 60px'}}>
  <span className="eyebrow red">RACKETON · ESPACIO JUGADOR</span>
  <div style={{display:'flex',alignItems:'center',gap:15,margin:'10px 0'}}>{homePhoto?<img src={homePhoto} alt="Mi foto" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover'}}/>:<div style={{width:64,height:64,borderRadius:'50%',background:'#e2e8f0',display:'grid',placeItems:'center'}}><UserRound size={34}/></div>}<div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:850,letterSpacing:1.5,color:'#c8102e'}}>MI PERFIL DEPORTIVO</div><h1 style={{fontSize:'clamp(25px,3.2vw,36px)',margin:'3px 0 4px',overflowWrap:'anywhere'}}>{name||'Jugador RACKETON'}</h1><div style={{color:'#667085',fontSize:13}}>Nombre de usuario: <strong>{name||'Sin configurar'}</strong>{city?' · '+city:''}</div></div></div>
  <p style={{color:'#64748b',margin:'0 0 24px'}}>Tus datos principales, tu nivel deportivo y tu actividad en un mismo lugar. <button type="button" onClick={()=>onNavigate('Perfil')} className="rkt-inline-action"><UserPen size={15}/> Editar mis datos</button></p>
  <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:22}}>{launchSports.map(x=><button key={x} type="button" onClick={()=>setSport(x)} aria-pressed={sport===x} style={{padding:'11px 20px',borderRadius:99,border:sport===x?'2px solid #c8102e':'1px solid #d7dce4',background:sport===x?'#fff1f3':'#fff',color:'#172033',fontWeight:700,cursor:'pointer'}}>{x}</button>)}</div>
  {error&&<p role="status" style={{background:'#fff1f2',color:'#9f1239',padding:12,borderRadius:9}}>{error}</p>}
  {loading?<p>Cargando tus datos deportivos…</p>:<>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:15}}>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>RATING · {sport.toUpperCase()}</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px',color:'#c8102e'}}>{activeRating?activeRating.rating.toFixed(2):'—'}</div><div style={{color:'#64748b',fontSize:13}}>{activeRating?({provisional:'Provisional',calibrating:'En calibración',consolidated:'Consolidado'}[activeRating.status]??activeRating.status):'Sin rating disponible'}</div></div>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>PARTIDOS DE RANKING · {sport.toUpperCase()}</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px'}}>{activeRating?activeRating.matches_played:'—'}</div><div style={{color:'#64748b',fontSize:13}}>{sport==='Tenis'?'Partidos computados en el rating':'Partidos competitivos: integración pendiente'}</div></div>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>DESAFÍOS RECIBIDOS · TENIS</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px'}}>{pending??'—'}</div><button type="button" onClick={()=>onNavigate('Desafíos')} className="rkt-inline-action"><Swords size={15}/> Gestionar desafíos</button></div>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16,marginTop:20}}>
    <div style={card}><h2 style={{margin:'0 0 10px',fontSize:22}}>Tu deporte: {sport}</h2><p style={{color:'#64748b',lineHeight:1.6}}>{!selectedEnabled?'Todavía no has activado este deporte en tu perfil.':sport==='Tenis'?(rating?'Tu rating de tenis está conectado con tus resultados confirmados.':'Completa la evaluación inicial para obtener tu rating provisional de tenis.'):(activeRating?'Tu rating inicial de '+sport+' ya está disponible. Puedes buscar rivales de un nivel similar.':'Completa el cuestionario específico de '+sport+' para obtener tu rating provisional.')}</p><button type="button" onClick={()=>onNavigate('Perfil')} style={action}>{!selectedEnabled?'Activar deporte en mi perfil':sport==='Tenis'&&!rating?'Completar mi evaluación':'Ver mi perfil deportivo'}</button></div>
    <div style={{...card,padding:24}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:17,gap:10}}><h2 style={{margin:0,fontSize:21,letterSpacing:'-.5px'}}>Accesos rápidos</h2><span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:'#9ca3af'}}>EXPLORAR</span></div><div className="rkt-quick-grid">{([{label:'Buscar rivales',hint:'Encuentra jugadores',dest:'Jugadores',icon:Search},{label:'Clasificaciones',hint:'Consulta tu posición',dest:'Rankings',icon:ListChecks},{label:'Desafíos',hint:'Organiza un partido',dest:'Desafíos',icon:Swords},{label:'Mis ligas',hint:'Sigue tus ligas',dest:'Mis ligas',icon:Layers3},{label:'Competiciones',hint:'Descubre torneos',dest:'Torneos',icon:Trophy},{label:'Mis datos',hint:'Gestiona tu cuenta',dest:'Perfil',icon:UserPen}] as {label:string;hint:string;dest:Tab;icon:LucideIcon}[]).map(x=>{const QuickIcon=x.icon;return <button className="rkt-quick-action" key={x.dest} type="button" onClick={()=>onNavigate(x.dest)}><span className="rkt-quick-icon"><QuickIcon size={19} strokeWidth={2.1}/></span><span className="rkt-quick-copy"><strong>{x.label}</strong><small>{x.hint}</small></span></button>})}</div></div>
   </div>
   <div style={{...card,marginTop:20,padding:'25px 26px'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:20}}>
     <div><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}><span style={{display:'grid',placeItems:'center',width:38,height:38,borderRadius:12,background:'#fff1f2',color:'#be123c'}}><History size={21}/></span><h2 style={{margin:0,fontSize:23,letterSpacing:'-.5px'}}>Últimos partidos disputados</h2></div><p style={{margin:'0 0 0 48px',color:'#64748b',fontSize:13}}>Tus resultados confirmados más recientes · Tenis</p></div>
     <span style={{border:'1px solid #e2e8f0',borderRadius:99,padding:'7px 12px',fontSize:12,fontWeight:750,color:'#475569',background:'#f8fafc'}}>{recent.length} {recent.length===1?'partido reciente':'partidos recientes'}</span>
    </div>
    {recent.length?<div style={{display:'grid',gap:12}}>{recent.map((x,i)=><div key={i} style={{padding:'18px 20px',border:'1px solid #e7eaf0',borderLeft:x.won?'4px solid #16a34a':'4px solid #dc2626',borderRadius:14,background:'linear-gradient(105deg,#f8fafc 0%,#fff 80%)'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}><span style={{width:42,height:42,flexShrink:0,display:'grid',placeItems:'center',borderRadius:12,background:x.won?'#dcfce7':'#fee2e2',color:x.won?'#15803d':'#b91c1c'}}><Trophy size={20}/></span><div><div style={{fontSize:11,color:'#64748b',fontWeight:750,marginBottom:4}}>RIVAL</div><strong style={{fontSize:17,color:'#0f172a'}}>{x.opponent_name||'Rival no disponible'}</strong></div></div>
      <span style={{fontSize:12,fontWeight:850,borderRadius:8,padding:'8px 12px',background:x.won?'#dcfce7':'#fee2e2',color:x.won?'#166534':'#991b1b'}}>{x.won?'VICTORIA':'DERROTA'}</span>
     </div>
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:14,marginTop:17,paddingTop:15,borderTop:'1px solid #e7eaf0'}}>
      <div><div style={{fontSize:11,color:'#64748b',fontWeight:750,marginBottom:6}}>FECHA</div><div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:650,color:'#334155'}}><CalendarDays size={15}/>{x.played_at?new Date(x.played_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'No registrada'}</div></div>
      <div><div style={{fontSize:11,color:'#64748b',fontWeight:750,marginBottom:6}}>RESULTADO · MARCADOR</div><div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>{x.score||'Marcador no registrado'}</div></div>
      <div><div style={{fontSize:11,color:'#64748b',fontWeight:750,marginBottom:6}}>CLUB / INSTALACIÓN</div><div style={{fontSize:13,fontWeight:650,color:'#334155'}}>{x.venue||'No registrado'}</div></div>
      <div><div style={{fontSize:11,color:'#64748b',fontWeight:750,marginBottom:6}}>CAMBIO DE RATING</div><div style={{fontSize:20,fontWeight:850,color:x.rating_delta>0?'#15803d':x.rating_delta<0?'#dc2626':'#475569',fontVariantNumeric:'tabular-nums'}}>{x.rating_delta>0?'+':''}{x.rating_delta.toFixed(2)}</div></div>
     </div>
    </div>)}</div>:<div style={{textAlign:'center',padding:'32px 20px',border:'1px dashed #cbd5e1',borderRadius:14,background:'#f8fafc'}}><Trophy size={28} color="#94a3b8"/><p style={{margin:'10px 0 3px',fontWeight:750,color:'#334155'}}>Todavía no hay partidos confirmados</p><p style={{margin:0,fontSize:13,color:'#64748b'}}>Tus próximos resultados aparecerán aquí automáticamente.</p></div>}
    <div style={{display:'flex',justifyContent:'flex-end',marginTop:17}}><button type="button" onClick={()=>onNavigate('Rankings')} className="rkt-inline-action" style={{display:'inline-flex',alignItems:'center',gap:7,fontWeight:750}}><ChartNoAxesColumnIncreasing size={17}/> Consultar clasificaciones</button></div>
   </div>
   <p style={{fontSize:12,color:'#64748b',marginTop:15}}>Tenis: rating competitivo existente. Pádel (escala 0–7) y pickleball (2–8): rating inicial RACKETON, no oficial de Playtomic ni DUPR. Los resultados competitivos de estos dos deportes se incorporarán después.</p>
  </>}
 </section>;
}


type PlayerArea = 'Inicio'|'Competir'|'Clasificaciones'|'Reservas';
const playerArchitecture: {name:PlayerArea;children:string[]}[] = [
 {name:'Inicio',children:['Mi panel','Mis datos','Mi agenda','Avisos']},
 {name:'Competir',children:['Mis competiciones','Explorar competiciones','Desafíos']},
 {name:'Clasificaciones',children:['Clasificaciones RACKETON','Mis ligas','Mi rating','Historial']},
 {name:'Reservas',children:['Buscar pistas','Mis reservas','Mis clubes']}
];
const navCard:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:22,marginTop:18};
function PendingPlayerModule({title,description}:{title:string;description:string}){
 return <div style={navCard}><h2 style={{marginTop:0}}>{title}</h2><p style={{color:'#64748b'}}>{description}</p><span style={{fontSize:12,color:'#9a3412',fontWeight:700}}>PENDIENTE DE DESARROLLO · No disponible todavía</span></div>;
}
function PlayerNavigation112({user,opponent,onClearOpponent,onChallenge}:{user:User;opponent:{id:string;name:string}|null;onClearOpponent:()=>void;onChallenge:(p:{id:string;name:string})=>void}){
 const [area,setArea]=useState<PlayerArea>('Inicio');
 const [sub,setSub]=useState('Mi panel');
 const [dataTab,setDataTab]=useState('Datos personales');
 const go=(next:PlayerArea,child?:string)=>{setArea(next);setSub(child||playerArchitecture.find(x=>x.name===next)!.children[0]);window.scrollTo?.({top:0,behavior:'smooth'});};

 const planned:Record<string,string>={
 'Mi agenda':'Calendario unificado de partidos, competiciones, reservas y actividades. Vistas calendario/lista y filtros.',
 'Avisos':'Notificaciones, invitaciones y resultados pendientes de confirmar, separados de los avisos informativos.',
 'Mis competiciones':'Mis torneos, ligas, rankings de club y ligas privadas en curso, próximos partidos e inscripciones. La gestión existente de ligas privadas se encuentra en Clasificaciones → Mis ligas.',
 'Explorar competiciones':'Buscar torneos, ligas, rankings de club y ligas privadas públicas; filtrar por deporte, territorio y estado de inscripción.',
 'Buscar pistas':'Búsqueda de instalaciones, disponibilidad y reserva online. Aún no está conectada a los clubes.',
 'Mis reservas':'Próximas reservas, historial, pagos y cancelaciones. No se han habilitado reservas reales.',
 'Mis clubes':'Clubes vinculados, favoritos, escuelas, actividades e inscripciones.',
 'Mi monedero':'Saldo, recargas, pagos y movimientos. Requiere integración con un proveedor de pagos autorizado antes de operar con dinero real.',
 'Privacidad':'Configuración específica de visibilidad y permisos. La visibilidad existente puede editarse por ahora en Datos personales.',
 'Configuración':'Preferencias de cuenta, seguridad y notificaciones.'
 };
 return <section className="rkt-player-shell">
  <style>{`

  .rkt-personal-section{max-width:980px}.rkt-personal-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.rkt-personal-tabs button{display:flex;align-items:center;gap:9px;border:1px solid #e4e7ed;background:white;border-radius:11px;padding:12px 15px;font-size:13px;font-weight:750;color:#536075;cursor:pointer}.rkt-personal-tabs button.active{background:#fff0f3;border-color:#e6a4b1;color:#b90d31}.rkt-personal-wrap{display:grid;gap:16px}.rkt-personal-account{display:flex;align-items:center;gap:13px;padding:16px 20px;background:#fff;border:1px solid #e6e9ef;border-radius:15px}.rkt-personal-account-icon{display:grid;place-items:center;background:#fff0f3;color:#c8102e;border-radius:12px;width:43px;height:43px}.rkt-personal-account>div:nth-child(2){display:flex;flex-direction:column;gap:3px;min-width:0}.rkt-personal-account strong{font-size:14px}.rkt-personal-account span{font-size:12px;color:#6b7585;overflow-wrap:anywhere}.rkt-personal-account-state{margin-left:auto;background:#edf9f1;color:#137442!important;padding:6px 10px;border-radius:30px;white-space:nowrap;font-weight:750}.rkt-personal-form{display:grid;gap:16px}.rkt-personal-card{background:#fff;border:1px solid #e6e9ef;border-radius:16px;padding:clamp(18px,2.6vw,28px)}.rkt-personal-card-title{border-bottom:1px solid #eff0f4;padding-bottom:17px;margin-bottom:20px}.rkt-personal-card-title h2{margin:0 0 5px;font-size:19px;letter-spacing:-.45px}.rkt-personal-card-title p{margin:0;color:#778294;font-size:13px}.rkt-personal-photo-row{display:flex;gap:22px;align-items:center;flex-wrap:wrap}.rkt-personal-avatar{width:104px;height:104px;object-fit:cover;border-radius:50%;border:3px solid #f3d9de;flex-shrink:0}.rkt-personal-avatar-empty{display:grid;place-items:center;background:#f3f4f7;color:#9aa4b2}.rkt-personal-photo-info{display:flex;flex-direction:column;gap:9px;flex:1;min-width:200px}.rkt-personal-photo-info strong{font-size:14px}.rkt-personal-photo-info>span{font-size:12px;color:#778294;line-height:1.6}.rkt-personal-actions{display:flex;gap:8px;flex-wrap:wrap}.rkt-personal-upload,.rkt-personal-secondary{border:1px solid #c8102e;background:#c8102e;color:white;border-radius:9px;padding:10px 13px;font-size:12px;font-weight:800;cursor:pointer}.rkt-personal-secondary{background:#fff;border-color:#e0e4ea;color:#475467}.rkt-personal-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.rkt-personal-fields label{display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:800;color:#344054}.rkt-personal-fields input,.rkt-personal-fields select{box-sizing:border-box;width:100%;border:1px solid #dce1e9;border-radius:10px;background:#fff;padding:12px 13px;font:inherit;font-size:14px;font-weight:500;color:#172033;min-height:46px}.rkt-personal-fields input:focus,.rkt-personal-fields select:focus{outline:2px solid #e8a5b2;border-color:#c8102e}.rkt-personal-email{display:flex;flex-direction:column;gap:7px}.rkt-personal-email span{font-size:12px;color:#6b7585}.rkt-personal-email strong{font-size:14px;overflow-wrap:anywhere}.rkt-personal-email small{font-size:12px;color:#8b95a5}.rkt-personal-toggles{display:grid;gap:18px}.rkt-personal-toggles label{display:flex;align-items:flex-start;gap:12px;cursor:pointer}.rkt-personal-toggles input{width:18px;height:18px;accent-color:#c8102e;flex-shrink:0}.rkt-personal-toggles label span{display:flex;flex-direction:column;gap:5px}.rkt-personal-toggles strong{font-size:14px}.rkt-personal-toggles small{font-size:12px;color:#778294;line-height:1.5}.rkt-personal-warning{color:#a43d18;font-size:13px}.rkt-personal-save{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:4px 0 14px}.rkt-personal-save .primary{display:inline-flex;align-items:center;justify-content:center;min-width:170px}.rkt-personal-section .rkt-personal-fields .country-select{max-width:100%}@media(max-width:580px){.rkt-personal-fields{grid-template-columns:1fr}.rkt-personal-tabs button{flex:1 1 42%;justify-content:center}.rkt-personal-account-state{display:none}}
  .rkt-player-shell{--rk-red:#cc1237;--rk-ink:#172033;--rk-muted:#667085;display:grid;grid-template-columns:256px minmax(0,1fr);min-height:calc(100vh - 160px);width:100%;max-width:1600px;margin:0 auto;background:#f5f6f9;color:var(--rk-ink);font-family:inherit}
  .rkt-sidebar{background:#fff;border-right:1px solid #e9ebf0;padding:28px 15px 30px;display:flex;flex-direction:column;gap:7px}
  .rkt-sidebar-title{font-size:10px;letter-spacing:2px;color:#9299a6;font-weight:900;padding:0 14px;margin:6px 0 13px}
  .rkt-nav-btn{width:100%;border:0;border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:13px;background:transparent;color:#475467;text-align:left;font-size:14px;font-weight:750;cursor:pointer;transition:background .15s}
  .rkt-nav-btn:hover{background:#f5f6f9}.rkt-nav-btn.active{background:#fff0f3;color:#b90d31}.rkt-nav-btn.active:before{content:'';width:3px;height:20px;border-radius:6px;background:#c8102e;margin-left:-9px;margin-right:6px}
  .rkt-nav-sub{margin:2px 0 12px 39px;border-left:1px solid #e8eaf0;display:flex;flex-direction:column;gap:2px}
  .rkt-nav-sub button{border:0;background:transparent;text-align:left;padding:10px 12px;color:#667085;font-size:12px;font-weight:650;cursor:pointer;border-radius:0 9px 9px 0}.rkt-nav-sub button:hover{background:#f5f6f9}.rkt-nav-sub button.active{color:#bd1235;background:#fff1f4;border-left:3px solid #c8102e;margin-left:-2px;font-weight:850}
  .rkt-workspace{min-width:0;padding:29px clamp(18px,3vw,52px) 70px}.rkt-topline{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:28px}.rkt-breadcrumb{font-size:12px;font-weight:800;letter-spacing:.3px;color:#88909e}.rkt-breadcrumb strong{color:#c8102e}.rkt-header-actions{display:flex;align-items:center;gap:9px}.rkt-header-chip{border:1px solid #e7e9ef;background:white;border-radius:11px;padding:10px 13px;display:flex;align-items:center;gap:7px;color:#344054;font-size:12px;font-weight:800}.rkt-header-chip svg{color:#c8102e}.rkt-section-heading{margin:0 0 24px}.rkt-section-heading h1{font-size:clamp(25px,2.6vw,34px);letter-spacing:-1px;margin:0 0 5px;color:#182230}.rkt-section-heading p{color:#667085;margin:0;font-size:14px}.rkt-mobile-trigger{display:none}
  .rkt-player-shell .rkt-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
  .rkt-player-shell .rkt-quick-action{display:flex;align-items:center;text-align:left;gap:13px;min-height:76px;padding:13px 14px;background:#fff;border:1px solid #e6e9ef;border-radius:14px;cursor:pointer;color:#172033;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
  .rkt-player-shell .rkt-quick-action:hover{border-color:#e6a4b1;box-shadow:0 8px 22px rgba(23,32,51,.07);transform:translateY(-2px)}
  .rkt-player-shell .rkt-quick-action:focus-visible,.rkt-player-shell .rkt-inline-action:focus-visible{outline:3px solid #d34a68;outline-offset:3px}
  .rkt-player-shell .rkt-quick-icon{display:grid;place-items:center;width:43px;height:43px;flex:none;border-radius:12px;background:#fff0f3;color:#c8102e}
  .rkt-player-shell .rkt-quick-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
  .rkt-player-shell .rkt-quick-copy strong{font-size:13px;line-height:1.2;font-weight:800}
  .rkt-player-shell .rkt-quick-copy small{font-size:11px;line-height:1.35;color:#758092}
  .rkt-player-shell .rkt-inline-action{display:inline-flex;align-items:center;gap:7px;padding:8px 0;border:0;background:transparent;color:#bc1233;font-weight:800;font-size:13px;cursor:pointer}
  .rkt-player-shell .rkt-inline-action:hover{text-decoration:underline;text-underline-offset:3px}
  @media(max-width:580px){.rkt-player-shell .rkt-quick-grid{grid-template-columns:1fr 1fr;gap:8px}.rkt-player-shell .rkt-quick-action{min-height:74px;padding:10px;gap:8px}.rkt-player-shell .rkt-quick-icon{width:34px;height:34px}.rkt-player-shell .rkt-quick-copy strong{font-size:12px}.rkt-player-shell .rkt-quick-copy small{font-size:10px}}
  .rkt-workspace .content.interior{max-width:100%!important;margin:0!important;padding:0!important}.rkt-workspace .content{max-width:100%!important}.rkt-workspace .eyebrow.red{display:none}.rkt-workspace section{max-width:100%}.rkt-workspace .page-title{margin-top:0}.rkt-workspace>div>section{max-width:100%}
  @media(max-width:900px){.rkt-player-shell{grid-template-columns:1fr}.rkt-sidebar{display:none}.rkt-workspace{padding:20px 16px 105px}.rkt-mobile-trigger{display:flex;border:1px solid #e5e7eb;border-radius:10px;background:white;padding:10px 12px;align-items:center;gap:8px;font-weight:800}.rkt-mobile-sub{display:flex;gap:7px;overflow-x:auto;padding:0 0 14px;margin-bottom:15px}.rkt-mobile-sub button{white-space:nowrap;border:1px solid #e6e8ed;border-radius:100px;padding:9px 12px;background:#fff;font-size:12px;font-weight:750;color:#667085}.rkt-mobile-sub button.active{border-color:#c8102e;background:#fff0f3;color:#b80f31}.rkt-bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:80;display:grid;grid-template-columns:repeat(4,1fr);background:white;border-top:1px solid #e6e8ed;box-shadow:0 -8px 30px #1118270d;padding:8px 2px max(8px,env(safe-area-inset-bottom))}.rkt-bottom-nav button{border:0;background:none;display:flex;align-items:center;flex-direction:column;gap:4px;color:#667085;font-size:10px;font-weight:750;padding:5px 0}.rkt-bottom-nav button.active{color:#c8102e}.rkt-header-actions{margin-left:auto}.rkt-section-heading{margin-bottom:16px}}
  @media(min-width:901px){.rkt-bottom-nav,.rkt-mobile-sub{display:none}}
  `}</style>
  <aside className="rkt-sidebar" aria-label="Navegación del jugador"><div className="rkt-sidebar-title">ESPACIO JUGADOR</div>{playerArchitecture.map((x,i)=>{const NavIcon=[Home,Trophy,ChartNoAxesColumnIncreasing,CalendarDays][i];return <div key={x.name}><button type="button" className={'rkt-nav-btn '+(area===x.name?'active':'')} onClick={()=>go(x.name)}><NavIcon size={19}/><span>{x.name}</span></button>{area===x.name&&<div className="rkt-nav-sub">{x.children.map(child=><button key={child} type="button" className={sub===child?'active':''} onClick={()=>setSub(child)}>{child}</button>)}</div>}</div>})}</aside>
  <div className="rkt-workspace"><div className="rkt-topline"><div className="rkt-breadcrumb">RACKETON / {area.toUpperCase()} / <strong>{sub.toUpperCase()}</strong></div><div className="rkt-header-actions"><div className="rkt-header-chip" title="Monedero pendiente de integración" ><Wallet size={15}/> Monedero · Próximamente</div><button type="button" className="rkt-header-chip" onClick={()=>go('Inicio','Avisos')} aria-label="Avisos"><Bell size={15}/> Avisos</button></div></div>
  <div className="rkt-section-heading"><h1>{sub==='Mi panel'?'Mi RACKETON':sub}</h1><p>{sub==='Mi panel'?'Tu actividad deportiva, tus rivales y tu evolución en un solo lugar.':area+' · '+sub}</p></div>
  <div className="rkt-mobile-sub">{playerArchitecture.find(x=>x.name===area)!.children.map(child=><button key={child} className={sub===child?'active':''} onClick={()=>setSub(child)}>{child}</button>)}</div>
  <div className="rkt-screen-body">
  {area==='Inicio'&&sub==='Mi panel'?<PlayerHome102 user={user} onNavigate={(old:Tab)=>{if(old==='Desafíos'||old==='Jugadores')go('Competir','Desafíos');else if(old==='Rankings'||old==='Mis ligas')go('Clasificaciones',old==='Mis ligas'?'Mis ligas':'Clasificaciones RACKETON');else if(old==='Perfil'){setDataTab('Datos personales');go('Inicio','Mis datos')}else if(old==='Reservas')go('Reservas');else if(old==='Torneos')go('Competir','Explorar competiciones');}}/>:
  area==='Competir'&&sub==='Desafíos'?<><div style={navCard}><h2>Buscar rivales y organizar partidos libres</h2><p>Los desafíos son partidos individuales o de dobles fuera de las competiciones organizadas.</p><PlayerSearch userId={user.id} onChallenge={p=>{onChallenge(p);go('Competir','Desafíos')}}/></div><div style={navCard}><h2>Desafíos individuales</h2><TennisChallenges userId={user.id} opponent={opponent} onClose={onClearOpponent}/></div><div style={navCard}><h2>Resultados y confirmaciones</h2><TennisResults userId={user.id}/></div><div style={navCard}><h2>Desafíos de dobles</h2><RacketonDoubles107 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Clasificaciones RACKETON'?<RacketonNationalRanking108 userId={user.id} onChallenge={(p:{id:string;name:string})=>{onChallenge(p);go('Competir','Desafíos')}}/>:
  area==='Clasificaciones'&&sub==='Mis ligas'?<><PlayerLeagues userId={user.id}/><div style={navCard}><h2>Rankings y ligas de club</h2><PlayerEnrollments084 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Mi rating'?<><div style={navCard}><h2>Mi rating y perfil competitivo</h2><TennisCompetitiveProfile userId={user.id}/></div><div style={navCard}><h2>Simulador de rating · Tenis</h2><TennisRatingSimulation1091 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Historial'?<div style={navCard}><h2>Historial y evolución del rating · Tenis</h2><TennisRatingHistory userId={user.id}/><p style={{fontSize:13,color:'#64748b'}}>Las estadísticas históricas de pádel y pickleball se incorporarán cuando haya resultados competitivos disponibles.</p></div>:
  area==='Inicio'&&sub==='Mis datos'?<div className="rkt-personal-section">
    <div className="rkt-personal-tabs">{([{name:'Datos personales',icon:UserRound},{name:'Privacidad',icon:ShieldCheck},{name:'Configuración',icon:UserPen},{name:'Mi monedero',icon:Wallet}] as {name:string;icon:LucideIcon}[]).map(item=>{const I=item.icon;return <button key={item.name} className={dataTab===item.name?'active':''} type="button" onClick={()=>setDataTab(item.name)}><I size={17}/>{item.name}</button>})}</div>
    {dataTab==='Datos personales'?<PlayerProfile user={user} mode="personal"/>:dataTab==='Privacidad'?<PlayerProfile user={user} mode="privacy"/>:<PendingPlayerModule title={dataTab} description={planned[dataTab]||'Esta sección se desarrollará próximamente.'}/>}
  </div>:
  <PendingPlayerModule title={sub} description={planned[sub]||'Este módulo se implementará de forma independiente, manteniendo la navegación aprobada.'}/>}
  </div></div>
  <nav className="rkt-bottom-nav" aria-label="Menú principal del jugador">{playerArchitecture.map((x,i)=>{const NavIcon=[Home,Trophy,ChartNoAxesColumnIncreasing,CalendarDays][i];return <button key={x.name} type="button" className={area===x.name?'active':''} onClick={()=>go(x.name)}><NavIcon size={20}/><span>{x.name}</span></button>})}</nav>
 </section>;
}
export default function App(){
 const [tab,setTab]=useState<Tab>('Inicio');const [challengeOpponent,setChallengeOpponent]=useState<{id:string;name:string}|null>(null);const [user,setUser]=useState<User|null>(null);const [menu,setMenu]=useState(false);const [authOpen,setAuthOpen]=useState(false);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [authMode,setAuthMode]=useState<'login'|'signup'>('signup');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [requestedRole,setRequestedRole]=useState<'player'|'club'|'referee'|'federation'>('player');const [authStep,setAuthStep]=useState<'roles'|'credentials'>('roles');
 useEffect(()=>{if(!supabase)return;supabase.auth.getUser().then(({data})=>setUser(data.user));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));return()=>subscription.unsubscribe()},[]);
 async function submitAuth(e:React.FormEvent){e.preventDefault();if(!supabase){setNotice('Configura Supabase para activar el registro.');return;}setBusy(true);setNotice('');try{const res=authMode==='signup'?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(res.error)throw res.error;setNotice(authMode==='signup'?'Registro solicitado. Comprueba tu correo si la confirmación está activada.':'Sesión iniciada.');if(authMode==='login'){setAuthOpen(false);setMode('choose');}else{setAuthStep('roles');}}catch(err){setNotice(err instanceof Error?err.message:'No se pudo completar la operación.')}finally{setBusy(false)}}
 async function logout(){await supabase?.auth.signOut();setTab('Inicio')}
 function navigate(next:Tab){setTab(next);setMenu(false);setNotice('')}
 const [clubAccess,setClubAccess]=useState(false);
 const [accessChecked,setAccessChecked]=useState(false);
 const [mode,setMode]=useState<'choose'|'player'|'club'>('player');
 useEffect(()=>{
  let active=true;
  setClubAccess(false);setAccessChecked(false);setMode('player');
  if(!user||!supabase)return;
  const client=supabase;
  void (async()=>{
   const {data,error}=await client.from('racketon_club_staff').select('club_id').eq('user_id',user.id).limit(1);
   if(!active)return;
   const allowed=!error&&(data?.length??0)>0;
   setClubAccess(allowed);setAccessChecked(true);setMode(requestedRole==='club'&&allowed?'club':requestedRole==='club'?'choose':'player');setTab(requestedRole==='club'&&allowed?'Escuelas':'Inicio');if(requestedRole==='club'&&!allowed)setNotice('Tu cuenta no tiene acceso autorizado a un club. Puedes acceder como jugador.');
  })();
  return()=>{active=false};
 },[user?.id]);
 function chooseMode(next:'player'|'club'){
  if(next==='club'&&!clubAccess){setNotice('Esta cuenta no tiene autorización para gestionar un club.');return;}
  setMode(next);setTab(next==='club'?'Escuelas':'Inicio');setMenu(false);setNotice('');
 }
 function openAccess(kind:'login'|'signup'='login'){setRequestedRole('player');setAuthMode(kind);setAuthStep('roles');setNotice('');setAuthOpen(true)}
 const current=sections[tab];const Icon=current.icon;const visibleTabs=mode==='club'?clubTabs:playerTabs;
 return <div className="shell">
 {user&&mode!=='choose'&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,padding:'10px 16px',background:'#171717',color:'#fff',flexWrap:'wrap'}}>
 <strong style={{fontSize:13}}>Espacio activo: {mode==='club'?'Club':'Jugador'}</strong>
 <button type="button" onClick={()=>{setMode('choose');setTab('Inicio');setNotice('')}} style={{padding:'7px 14px',borderRadius:8,border:'1px solid #aaa',background:'transparent',color:'#fff',cursor:'pointer'}}>Cambiar de espacio</button>
 </div>}
 <header className="header"><button className="brand" onClick={()=>{if(user){setMode('choose')}else{setMode('player')}navigate('Inicio')}} aria-label="Inicio RACKETON"><span className="brand-mark">R<span className="brand-dot">●</span></span><span>RACKET<span>ON</span></span></button><nav className="desktop-nav">{(mode==='player'&&user?[]:tabs.filter(t=>visibleTabs.includes(t.name))).map(({name})=><button key={name} className={tab===name?'active':''} onClick={()=>navigate(name)}>{name}</button>)}</nav><div className="header-actions">{user?<button className="outline small" onClick={logout}><LogOut size={16}/> Salir</button>:<><button className="outline small" onClick={()=>openAccess('login')}><LogIn size={16}/> Iniciar sesión</button><button className="outline small" onClick={()=>openAccess('signup')}>Registrarse</button></>}<button className="menu-button" onClick={()=>setMenu(!menu)} aria-label="Menú">{menu?<X/>:<Menu/>}</button></div></header>
 {menu&&<nav className="mobile-menu">{(mode==='player'&&user?[]:tabs.filter(t=>visibleTabs.includes(t.name))).map(({name,icon:NavIcon})=><button key={name} onClick={()=>navigate(name)}><NavIcon size={18}/>{name}</button>)}</nav>}
 <main>{mode==='player'&&user?<PlayerNavigation112 user={user} opponent={challengeOpponent} onClearOpponent={()=>setChallengeOpponent(null)} onChallenge={p=>setChallengeOpponent(p)}/>:mode==='choose'?<section className="content interior" style={{maxWidth:1180,margin:'30px auto 70px'}}><span className="eyebrow red">RACKETON · ACCESO POR PERFIL</span><h1 style={{fontSize:'clamp(30px,5vw,48px)',margin:'12px 0'}}>¿Cómo quieres entrar?</h1><p style={{color:'#64748b',marginBottom:28}}>Cada perfil tiene su propio espacio de trabajo y menú. Selecciona tu función para continuar.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:18}}>{roleCards.map(r=><button key={r.id} type="button" onClick={()=>{if(r.id==='player'){if(user){chooseMode('player')}else{openAccess('login')}}else if(r.id==='club'){if(!user){openAccess('login')}else if(!accessChecked){setNotice('Comprobando autorización del club. Inténtalo de nuevo en unos segundos.')}else if(clubAccess){chooseMode('club')}else{setNotice('Esta cuenta no tiene acceso autorizado a un club. Solicita autorización desde el área Clubes como jugador.')}}else{setNotice('El espacio de '+r.title.toLowerCase()+' estará disponible en una próxima fase.')}}} style={{textAlign:'left',padding:24,border:'1px solid #e3e5e9',borderRadius:18,background:'#fff',cursor:'pointer',minHeight:205,display:'flex',flexDirection:'column',gap:13,boxShadow:'0 5px 24px #0f172a0a'}}><span style={{fontSize:38}}>{r.icon}</span><strong style={{fontSize:23,color:'#172033'}}>{r.title}</strong><span style={{fontSize:14,color:'#64748b',lineHeight:1.5}}>{r.subtitle}</span><span style={{marginTop:'auto',color:'#c8102e',fontSize:13,fontWeight:800}}>{r.id==='player'||r.id==='club'?'Acceder →':'Próximamente'}</span></button>)}</div>{notice&&<p role="status" style={{padding:14,background:'#fff1f2',borderRadius:10,color:'#9f1239',marginTop:20}}>{notice}</p>}</section>:tab==='Inicio'?<><section className="hero"><div className="hero-copy"><span className="eyebrow">TU COMUNIDAD DE DEPORTES DE RAQUETA</span><h1>Juega.<br/>Compite.<br/><em>Evoluciona.</em></h1><p>Encuentra rivales, mejora tu nivel, participa en torneos y reserva pistas. Todo en una sola plataforma.</p><div className="hero-actions"><button className="primary" onClick={()=>user?navigate('Perfil'):setAuthOpen(true)}>{user?'Mi perfil':'Únete a RACKETON'} <ArrowRight size={18}/></button><button className="outline light" onClick={()=>navigate('Torneos')}>Explorar torneos</button></div></div><div className="hero-art"><div className="court"><span className="court-net"/><span className="ball"/></div><div className="hero-card"><span>RACKETON</span><strong>Tu próximo partido empieza aquí</strong><small>TENIS · PÁDEL · PICKLEBALL · SQUASH</small></div></div></section><section className="content"><div className="section-head"><div><span className="eyebrow red">TODO EN UNA PLATAFORMA</span><h2>El deporte de raqueta, conectado.</h2></div></div><div className="features">{[{icon:Users,title:'Encuentra rivales',body:'Conecta con jugadores de nivel similar.',tab:'Jugadores' as Tab},{icon:ChartNoAxesColumnIncreasing,title:'Mejora tu ranking',body:'Sigue tu evolución deportiva.',tab:'Rankings' as Tab},{icon:Trophy,title:'Compite en torneos',body:'Inscríbete en competiciones por nivel.',tab:'Torneos' as Tab},{icon:CalendarDays,title:'Reserva pistas',body:'Encuentra instalaciones colaboradoras.',tab:'Reservas' as Tab}].map(({icon:FeatureIcon,title,body,tab:dest})=><button className="feature" key={title} onClick={()=>navigate(dest)}><span className="feature-icon"><FeatureIcon size={26}/></span><strong>{title}</strong><p>{body}</p><span className="feature-link">Explorar <ArrowRight size={15}/></span></button>)}</div><div className="sports"><strong>Una plataforma para todos tus deportes</strong><div>{['TENIS','PÁDEL','PICKLEBALL','SQUASH','BÁDMINTON'].map(s=><span key={s}>{s}</span>)}</div></div></section></>:<section className="content interior"><span className="eyebrow red">RACKETON / {tab.toUpperCase()}</span><div className="page-title"><span className="page-icon"><Icon size={30}/></span><div><h1>{current.title}</h1><p>{current.subtitle}</p></div></div>{tab==='Perfil'&&user?<><PlayerProfile user={user}/><TennisCompetitiveProfile userId={user.id}/></>:tab==='Jugadores'&&user?<><TennisLeaderboard userId={user.id} onChallenge={p=>{setChallengeOpponent(p);navigate('Desafíos');}}/><PlayerSearch userId={user.id} onChallenge={p=>{setChallengeOpponent(p);navigate('Desafíos');}}/></>:tab==='Rankings'&&user?(mode==='club'?<ClubRankingsAdmin084 userId={user.id}/>:<><RacketonNationalRanking108 userId={user.id} onChallenge={(p:{id:string;name:string})=>{setChallengeOpponent(p);navigate('Desafíos');}}/><PlayerEnrollments084 userId={user.id}/></>):tab==='Escuelas'&&user&&mode==='club'?<SchoolManager090 userId={user.id}/>:tab==='Clubes'?user?<ClubPortal userId={user.id}/>:<div className="placeholder"><h2>Acceso profesional</h2><p>Inicia sesión para solicitar o utilizar tu acceso autorizado al club.</p><button className="primary" onClick={()=>setAuthOpen(true)}>Acceder <ArrowRight size={16}/></button></div>:tab==='Mis ligas'?user?<PlayerLeagues userId={user.id}/>:<div className="placeholder"><h2>Mis ligas privadas</h2><p>Inicia sesión para crear una liga con amigos.</p><button className="primary" onClick={()=>setAuthOpen(true)}>Acceder <ArrowRight size={16}/></button></div>:tab==='Desafíos'&&user?<><TennisChallenges userId={user.id} opponent={challengeOpponent} onClose={()=>setChallengeOpponent(null)}/><TennisResults userId={user.id}/><RacketonDoubles107 userId={user.id}/><TennisRatingHistory userId={user.id}/><TennisRatingSimulation1091 userId={user.id}/></>:<div className="placeholder"><div className="placeholder-icon"><Icon size={38}/></div><h2>{tab==='Perfil'&&!user?'Crea tu perfil deportivo':'Módulo en preparación'}</h2><p>{tab==='Perfil'&&!user?'Regístrate para empezar a construir tu historial deportivo.':'Esta pantalla está prevista para próximas versiones.'}</p><div className="planned">{current.items.map(item=><div key={item}><span className="tick">✓</span>{item}</div>)}</div>{tab==='Perfil'&&!user?<button className="primary" onClick={()=>setAuthOpen(true)}>Crear cuenta <ArrowRight size={16}/></button>:null}</div>}</section>}</main>
 <footer><span className="footer-brand">RACKET<span>ON</span></span><span>Juega · Compite · Evoluciona</span><span>RACKETON · Espacios por perfil</span><span><MapPin size={14}/> España</span></footer>
 {mode!=='choose'&&<nav className="bottom-nav">{(mode==='player'&&user?[]:tabs.filter(t=>visibleTabs.includes(t.name))).map(({name,icon:NavIcon})=><button key={name} className={tab===name?'active':''} onClick={()=>navigate(name)}><NavIcon size={21}/><span>{name}</span></button>)}</nav>}
 {authOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Acceso RACKETON" style={{maxWidth:650,maxHeight:'92vh',overflowY:'auto'}}><button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Cerrar"><X/></button><span className="eyebrow red">RACKETON · {authMode==='signup'?'NUEVO REGISTRO':'USUARIOS REGISTRADOS'}</span><h2>{authStep==='roles'?'Selecciona cómo quieres entrar':authMode==='signup'?'Crear una cuenta':'Iniciar sesión'}</h2><div style={{display:'flex',gap:8,margin:'14px 0 20px',flexWrap:'wrap'}}><button type="button" onClick={()=>{setAuthMode('login');setAuthStep('roles');setNotice('')}} style={{padding:'11px 16px',borderRadius:10,border:authMode==='login'?'2px solid #c8102e':'1px solid #ddd',background:authMode==='login'?'#fff1f3':'white',fontWeight:700,cursor:'pointer'}}>Ya tengo cuenta · Iniciar sesión</button><button type="button" onClick={()=>{setAuthMode('signup');setAuthStep('roles');setNotice('')}} style={{padding:'11px 16px',borderRadius:10,border:authMode==='signup'?'2px solid #c8102e':'1px solid #ddd',background:authMode==='signup'?'#fff1f3':'white',fontWeight:700,cursor:'pointer'}}>Soy nuevo · Registrarme</button></div>{authStep==='roles'?<><p>Elige tu perfil. Cada uno tendrá su propio menú y funcionalidades. Una cuenta puede tener varios perfiles autorizados.</p><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12,margin:'18px 0 10px'}}>{roleCards.map(r=><button key={r.id} type="button" onClick={()=>{setRequestedRole(r.id);setNotice('');if(r.id==='player'||r.id==='club')setAuthStep('credentials')}} style={{border:'1px solid #dce0e6',background:'#fff',borderRadius:14,padding:18,textAlign:'left',cursor:'pointer',minHeight:135,display:'flex',flexDirection:'column',gap:8}}><span style={{fontSize:30}}>{r.icon}</span><strong style={{fontSize:18,color:'#1e293b'}}>{r.title}</strong><small style={{color:'#64748b'}}>{r.id==='referee'||r.id==='federation'?'Próximamente':r.id==='club'?'Requiere autorización del club':'Ranking nacional y competiciones'}</small></button>)}</div>{notice&&<p className="notice" role="status">{notice}</p>}</>:<><button type="button" onClick={()=>{setAuthStep('roles');setNotice('')}} style={{border:0,background:'transparent',padding:'4px 0 14px',cursor:'pointer',color:'#c8102e',fontWeight:700}}>← Volver a los perfiles</button><p><strong>{requestedRole==='club'?'🏟️ Club':'🎾 Jugador'}</strong> · {authMode==='signup'?'Nuevo registro':'Acceso de usuario registrado'}</p>{requestedRole==='club'&&<p style={{fontSize:13,color:'#64748b'}}>Para gestionar un club necesitas autorización previa. Registrarte no concede permisos administrativos.</p>}<form onSubmit={submitAuth}><label>Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label><label>Contraseña<input required minLength={6} type="password" autoComplete={authMode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tu contraseña"/></label><button className="primary" disabled={busy||!configured}>{busy?'Procesando...':authMode==='signup'?'Crear cuenta':'Entrar como '+(requestedRole==='club'?'club':'jugador')} <ArrowRight size={16}/></button></form>{notice&&<p className="notice" role="status">{notice}</p>}</>}</div></div>}
 </div>
}
