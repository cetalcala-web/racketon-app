import SchoolManager090 from './SchoolManager091';
import {PlayerEnrollments084} from './RankingEnrollments084';
import { useEffect, useState } from 'react';
import { Home, Trophy, CalendarDays, Users, UserRound, LogIn, LogOut, Menu, X, ChartNoAxesColumnIncreasing, ShieldCheck, ArrowRight, MapPin, Wallet, Bell, Dumbbell, CheckCircle2, RotateCcw, Search, Swords, ListChecks, Layers3, UserPen, History } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase } from './supabase';
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
const clubTabs:Tab[]=['Escuelas','Rankings','Torneos','Clubes'];
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

function PlayerProfile({user,mode='personal'}:{user:User;mode?:'personal'|'privacy'}) {
  const [details,setDetails] = useState<PlayerDetails>(emptyDetails);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState('');
  const [discoverable,setDiscoverable] = useState(true);
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
      else {setDiscoverable(visibility?.discoverable!==false);setCountry(visibility?.country??'');setNationality(visibility?.nationality??'');setShowNationality(visibility?.show_nationality===true);}
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
      </>:<div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Privacidad y visibilidad</h2><p>Tu perfil aparece en las búsquedas por defecto. Puedes ocultarlo cuando quieras.</p></div></div>
        <div className="rkt-personal-toggles"><label><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)}/><span><strong>Permitir que otros jugadores encuentren mi perfil</strong><small>Tu perfil es público por defecto. Si desactivas esta opción, dejarás de aparecer en las búsquedas y no recibirás nuevos desafíos de jugadores que te descubran allí. Tu correo electrónico y tus datos de contacto siempre serán privados.</small></span></label><label><input type="checkbox" checked={showNationality} onChange={e=>setShowNationality(e.target.checked)}/><span><strong>Mostrar mi nacionalidad</strong><small>Permite que otros jugadores vean tu nacionalidad en el perfil público.</small></span></label></div>
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

function PlayerAccountSettings119({user}:{user:User}){
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [newEmail,setNewEmail]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [noticeError,setNoticeError]=useState(false);
 const initialPreferences=(user.user_metadata?.racketon_notifications??{}) as Record<string,unknown>;
 const [challengeNotices,setChallengeNotices]=useState(initialPreferences.challenges!==false);
 const [competitionNotices,setCompetitionNotices]=useState(initialPreferences.competitions!==false);
 const [newsNotices,setNewsNotices]=useState(initialPreferences.news===true);
 async function updatePassword(e:React.FormEvent){
  e.preventDefault();if(!supabase)return;
  if(newPassword.length<8){setNoticeError(true);setNotice('La contraseña debe tener al menos 8 caracteres.');return;}
  if(newPassword!==confirmPassword){setNoticeError(true);setNotice('Las contraseñas no coinciden.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.auth.updateUser({password:newPassword});
  setBusy(false);setNoticeError(!!error);
  setNotice(error?'No se pudo cambiar la contraseña: '+error.message:'Contraseña actualizada correctamente.');
  if(!error){setNewPassword('');setConfirmPassword('');}
 }
 async function updateEmail(e:React.FormEvent){
  e.preventDefault();if(!supabase)return;
  const email=newEmail.trim();
  if(!email||email.toLowerCase()===user.email?.toLowerCase()){setNoticeError(true);setNotice('Introduce una dirección de correo diferente.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.auth.updateUser({email});
  setBusy(false);setNoticeError(!!error);
  setNotice(error?'No se pudo solicitar el cambio: '+error.message:'Solicitud enviada. Revisa los correos de confirmación necesarios antes de que cambie tu dirección.');
  if(!error)setNewEmail('');
 }
 async function savePreferences(){
  if(!supabase)return;
  setBusy(true);setNotice('');
  const existing=user.user_metadata?.racketon_notifications??{};
  const {error}=await supabase.auth.updateUser({data:{racketon_notifications:{...existing,challenges:challengeNotices,competitions:competitionNotices,news:newsNotices}}});
  setBusy(false);setNoticeError(!!error);
  setNotice(error?'No se pudieron guardar las preferencias: '+error.message:'Preferencias guardadas correctamente.');
 }
 return <div className="rkt-personal-wrap">
  <div className="rkt-personal-account"><div className="rkt-personal-account-icon"><ShieldCheck size={21}/></div><div><strong>Seguridad de tu cuenta</strong><span>{user.email}</span></div><span className="rkt-personal-account-state">Cuenta activa</span></div>
  <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Correo electrónico</h2><p>Tu dirección de acceso es privada y nunca aparece en las búsquedas.</p></div></div>
   <form className="rkt-settings-form" onSubmit={updateEmail}><label>Correo actual<input type="email" value={user.email??''} readOnly aria-label="Correo electrónico actual"/></label><label>Nuevo correo electrónico<input type="email" required autoComplete="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="nuevo@correo.com"/></label><button className="primary" type="submit" disabled={busy}>Solicitar cambio de correo</button><p className="rkt-settings-help">Por seguridad, Supabase puede solicitar confirmación por correo antes de aplicar el cambio.</p></form>
  </div>
  <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Cambiar contraseña</h2><p>Actualiza la contraseña con la que accedes a RACKETON.</p></div></div>
   <form className="rkt-settings-form" onSubmit={updatePassword}><label>Nueva contraseña<input type={showPassword?'text':'password'} minLength={8} required autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres"/></label><label>Repetir nueva contraseña<input type={showPassword?'text':'password'} minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña"/></label><label className="rkt-settings-checkbox"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/> Mostrar contraseñas</label><button className="primary" type="submit" disabled={busy}>Actualizar contraseña</button></form>
  </div>
  <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Preferencias de comunicaciones</h2><p>Guarda qué comunicaciones deseas recibir. La entrega automática de avisos se activará cuando esté disponible el sistema de notificaciones.</p></div></div>
   <div className="rkt-personal-toggles"><label><input type="checkbox" checked={challengeNotices} onChange={e=>setChallengeNotices(e.target.checked)}/><span><strong>Desafíos y resultados</strong><small>Solicitudes de partidos, confirmaciones y resultados pendientes.</small></span></label><label><input type="checkbox" checked={competitionNotices} onChange={e=>setCompetitionNotices(e.target.checked)}/><span><strong>Competiciones y reservas</strong><small>Información sobre tus inscripciones y actividades.</small></span></label><label><input type="checkbox" checked={newsNotices} onChange={e=>setNewsNotices(e.target.checked)}/><span><strong>Novedades de RACKETON</strong><small>Noticias y comunicaciones generales, desactivadas por defecto.</small></span></label></div>
   <div className="rkt-settings-footer"><button className="primary" type="button" disabled={busy} onClick={()=>void savePreferences()}>Guardar preferencias</button></div>
  </div>
  {notice&&<div role="status" className={'rkt-settings-notice '+(noticeError?'error':'success')}>{notice}</div>}
 </div>;
}

function PlayerWallet120(){
 return <div className="rkt-personal-wrap">
  <div className="rkt-personal-card rkt-wallet-hero">
   <div className="rkt-personal-card-title"><div><h2>Mi monedero RACKETON</h2><p>Gestiona desde aquí los futuros pagos de inscripciones, reservas y servicios de la plataforma.</p></div><Wallet size={27}/></div>
   <div className="rkt-wallet-balance"><span>Saldo disponible</span><strong>— €</strong><small>Saldo no disponible: los pagos todavía no están activados.</small></div>
   <div className="rkt-wallet-actions"><button type="button" disabled>Recargar saldo</button><button type="button" disabled>Retirar saldo</button></div>
  </div>
  <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Movimientos</h2><p>Aquí aparecerán los cargos, recargas, devoluciones y pagos cuando se active el servicio.</p></div><History size={21}/></div>
   <div className="rkt-wallet-empty"><Wallet size={30}/><strong>Todavía no hay movimientos disponibles</strong><span>No se han habilitado operaciones con dinero real.</span></div>
  </div>
  <div className="rkt-personal-card"><div className="rkt-personal-card-title"><div><h2>Seguridad y pagos</h2><p>Los pagos se habilitarán cuando RACKETON integre un proveedor de pagos autorizado.</p></div><ShieldCheck size={22}/></div>
   <p className="rkt-wallet-note">RACKETON no almacena números de tarjeta en esta pantalla. Hasta completar la integración de pagos y su verificación, no se aceptarán recargas ni se mostrará un saldo ficticio.</p>
  </div>
  <style>{`.rkt-wallet-hero{background:linear-gradient(125deg,#fff 55%,#fff0f0)}.rkt-wallet-balance{border:1px solid #f0d9d9;border-radius:16px;padding:23px;margin-top:16px;background:#fff;display:flex;flex-direction:column;gap:7px}.rkt-wallet-balance>span{font-size:13px;color:#64748b;font-weight:700}.rkt-wallet-balance strong{font-size:39px;color:#1e293b;letter-spacing:-1px}.rkt-wallet-balance small{color:#64748b}.rkt-wallet-actions{display:flex;gap:10px;margin-top:15px;flex-wrap:wrap}.rkt-wallet-actions button{padding:11px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#f1f5f9;color:#94a3b8;cursor:not-allowed;font-weight:700}.rkt-wallet-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;padding:35px 12px;color:#64748b}.rkt-wallet-empty strong{color:#334155}.rkt-wallet-note{color:#475569;line-height:1.65;margin-bottom:0}`}</style>
 </div>;
}

type TrainingConfig122={sport:string;level:string;days:number;duration:number;goal:string;weekdays:number[];equipment:string[];start_date?:string};
const trainingDefault122:TrainingConfig122={sport:'Tenis',level:'Intermedio',days:3,duration:30,goal:'Preparación general',weekdays:[1,3,5],equipment:['Peso corporal']};
type TrainingExercise122={name:string;sets:number;reps:string;rest:number;tip:string};
type TrainingSession122={name:string;category:string;exercises:TrainingExercise122[]};
function TrainingPlanner122({userId}:{userId:string}){
 const [config,setConfig]=useState<TrainingConfig122>(trainingDefault122);
 const [draft,setDraft]=useState<TrainingConfig122>(trainingDefault122);
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(true);
 const [msg,setMsg]=useState('');
 const [activeDay,setActiveDay]=useState<number|null>(null);
 const [completed,setCompleted]=useState<Record<string,boolean>>({});
 const [doneSets,setDoneSets]=useState<Record<string,boolean>>({});
 const [seconds,setSeconds]=useState(0);
 useEffect(()=>{let alive=true;async function load(){if(!supabase){setMsg('Supabase no está disponible.');setBusy(false);return;}const r=await supabase.from('player_training_settings').select('sport,level,days,duration,goal,weekdays,equipment,start_date').eq('user_id',userId).maybeSingle();if(!alive)return;if(r.error){setMsg('Para guardar tu plan, instala primero el SQL de RACKETON Training: '+r.error.message)}else if(r.data){const c={...trainingDefault122,...r.data,weekdays:Array.isArray(r.data.weekdays)?r.data.weekdays:trainingDefault122.weekdays,equipment:Array.isArray(r.data.equipment)?r.data.equipment:trainingDefault122.equipment} as TrainingConfig122;setConfig(c);setDraft(c);setReady(true)}setBusy(false)}void load();return()=>{alive=false}},[userId]);
 const save=async()=>{if(!supabase)return;if(draft.weekdays.length!==draft.days){setMsg('Selecciona exactamente '+draft.days+' días.');return;}setBusy(true);const savedConfig={...draft,start_date:config.start_date||trainingDate126(trainingMonday126(new Date()))};const r=await supabase.from('player_training_settings').upsert({user_id:userId,...savedConfig,updated_at:new Date().toISOString()},{onConflict:'user_id'});setBusy(false);if(r.error){setMsg('No se pudo guardar: '+r.error.message)}else{setConfig(savedConfig);setReady(true);setMsg('Plan guardado: tus sesiones ya aparecen en el calendario de la temporada.');window.dispatchEvent(new Event('racketon-training-saved'))}};
 const updateDays=(n:number)=>{setDraft(v=>({...v,days:n,weekdays:v.weekdays.slice(0,n)}))};
 const materials=['Peso corporal','Bandas elásticas','Mancuernas','Kettlebell','Esterilla','Banco','Gimnasio completo','Máquinas de cardio'];
 const [yearWeek,setYearWeek]=useState(1);
 const [openedDate,setOpenedDate]=useState<string|null>(null);
 useEffect(()=>{const open=(ev:Event)=>{const detail=(ev as CustomEvent<{week:number;day:number;date:string}>).detail;if(!detail)return;setYearWeek(Math.max(1,Math.min(52,detail.week)));setActiveDay(detail.day);setOpenedDate(detail.date);setDoneSets({});setSeconds(0)};window.addEventListener('racketon-open-training',open);return()=>window.removeEventListener('racketon-open-training',open)},[]);
 const exercisePool124:{category:string;name:string;sets:number;reps:string;rest:number;tip:string;gear:string[]}[]=[
  {category:'Fuerza',name:'Sentadilla controlada',sets:3,reps:'10–12',rest:60,tip:'Rodillas alineadas y tronco estable.',gear:[]},
  {category:'Fuerza',name:'Zancada atrás',sets:3,reps:'8 por pierna',rest:60,tip:'Controla la bajada y el equilibrio.',gear:[]},
  {category:'Fuerza',name:'Puente de glúteos',sets:3,reps:'12–15',rest:45,tip:'Aprieta glúteos sin arquear la espalda.',gear:[]},
  {category:'Fuerza',name:'Sentadilla isométrica en pared',sets:3,reps:'25 segundos',rest:45,tip:'Mantén una postura cómoda y estable.',gear:[]},
  {category:'Fuerza',name:'Elevaciones de gemelos',sets:3,reps:'15',rest:40,tip:'Sube y baja de forma controlada.',gear:[]},
  {category:'Fuerza',name:'Flexiones inclinadas',sets:3,reps:'8–12',rest:60,tip:'Utiliza un apoyo estable y evita arquear la espalda.',gear:[]},
  {category:'Fuerza',name:'Plancha frontal',sets:3,reps:'25–35 segundos',rest:45,tip:'Mantén abdomen firme y respira.',gear:[]},
  {category:'Fuerza',name:'Plancha lateral',sets:2,reps:'20 segundos por lado',rest:45,tip:'Alinea hombros, caderas y pies.',gear:[]},
  {category:'Fuerza',name:'Sentadilla goblet',sets:3,reps:'10',rest:75,tip:'Sujeta la mancuerna cerca del pecho; empieza con poca carga.',gear:['Mancuernas']},
  {category:'Fuerza',name:'Peso muerto rumano con mancuernas',sets:3,reps:'10',rest:75,tip:'Bisagra de cadera, espalda neutra y carga próxima al cuerpo.',gear:['Mancuernas']},
  {category:'Fuerza',name:'Remo con mancuernas',sets:3,reps:'10 por lado',rest:60,tip:'Controla la escápula y evita girar el tronco.',gear:['Mancuernas']},
  {category:'Fuerza',name:'Paseo del granjero',sets:3,reps:'30 segundos',rest:60,tip:'Camina erguido sin inclinarte.',gear:['Mancuernas']},
  {category:'Fuerza',name:'Sentadilla con kettlebell',sets:3,reps:'10',rest:75,tip:'Controla el recorrido y la postura.',gear:['Kettlebell']},
  {category:'Fuerza',name:'Peso muerto con kettlebell',sets:3,reps:'10',rest:75,tip:'Inicia el movimiento desde la cadera.',gear:['Kettlebell']},
  {category:'Fuerza',name:'Remo con banda',sets:3,reps:'12',rest:45,tip:'Ancla la banda de forma segura y controla el retorno.',gear:['Bandas elásticas']},
  {category:'Fuerza',name:'Pallof press con banda',sets:3,reps:'10 por lado',rest:45,tip:'Evita la rotación del tronco.',gear:['Bandas elásticas']},
  {category:'Fuerza',name:'Prensa de piernas',sets:3,reps:'12',rest:75,tip:'Recorrido controlado, sin bloquear rodillas.',gear:['Gimnasio completo']},
  {category:'Fuerza',name:'Jalón al pecho',sets:3,reps:'12',rest:60,tip:'Lleva los codos hacia abajo sin balancearte.',gear:['Gimnasio completo']},
  {category:'Resistencia',name:'Caminata rápida',sets:1,reps:'20 minutos',rest:0,tip:'Ritmo que permita mantener una conversación.',gear:[]},
  {category:'Resistencia',name:'Carrera continua suave',sets:1,reps:'18 minutos',rest:0,tip:'Reduce a caminata si no puedes mantener un ritmo cómodo.',gear:[]},
  {category:'Resistencia',name:'Intervalos caminar y correr',sets:5,reps:'2 minutos suaves',rest:60,tip:'Alterna carrera cómoda y caminata de recuperación.',gear:[]},
  {category:'Resistencia',name:'Bicicleta estática',sets:1,reps:'20 minutos',rest:0,tip:'Pedalea con intensidad cómoda y constante.',gear:['Máquinas de cardio']},
  {category:'Resistencia',name:'Elíptica',sets:1,reps:'20 minutos',rest:0,tip:'Mantén una cadencia suave y estable.',gear:['Máquinas de cardio']},
  {category:'Agilidad',name:'Pasos laterales',sets:3,reps:'20 segundos',rest:50,tip:'Frena con control y evita cruzar los pies.',gear:[]},
  {category:'Agilidad',name:'Desplazamiento en V',sets:3,reps:'20 segundos',rest:60,tip:'Cambia de dirección con pasos cortos.',gear:[]},
  {category:'Agilidad',name:'Arranques de 5 metros',sets:4,reps:'1 salida',rest:60,tip:'Acelera de forma progresiva y frena con espacio.',gear:[]},
  {category:'Agilidad',name:'Split step y desplazamiento',sets:3,reps:'8 por lado',rest:50,tip:'Aterriza suave y sal hacia el lado indicado.',gear:[]},
  {category:'Movilidad',name:'Movilidad de tobillos',sets:2,reps:'10 por lado',rest:20,tip:'Talón apoyado y movimiento sin dolor.',gear:[]},
  {category:'Movilidad',name:'Rotaciones torácicas',sets:2,reps:'8 por lado',rest:20,tip:'Gira desde la espalda alta.',gear:[]},
  {category:'Movilidad',name:'Movilidad de cadera',sets:2,reps:'8 por lado',rest:20,tip:'Movimiento lento y sin forzar.',gear:[]},
  {category:'Movilidad',name:'Equilibrio monopodal',sets:3,reps:'25 segundos por pierna',rest:30,tip:'Apóyate si necesitas estabilidad.',gear:[]},
  {category:'Movilidad',name:'Retracción escapular',sets:2,reps:'12',rest:30,tip:'Acerca las escápulas sin subir hombros.',gear:[]},
  {category:'Movilidad',name:'Rotación externa con banda',sets:2,reps:'12 por brazo',rest:30,tip:'Codo cerca del tronco y resistencia ligera.',gear:['Bandas elásticas']},
  {category:'Recuperación',name:'Caminata de recuperación',sets:1,reps:'15 minutos',rest:0,tip:'Ritmo muy cómodo.',gear:[]},
  {category:'Recuperación',name:'Respiración diafragmática',sets:2,reps:'2 minutos',rest:20,tip:'Respira lento, sin retener el aire.',gear:[]},
  {category:'Recuperación',name:'Movilidad general suave',sets:2,reps:'8 por articulación',rest:20,tip:'Sin rebotes ni dolor.',gear:[]}
 ];
 const available124=(gear:string[])=>gear.length===0||gear.every(g=>config.equipment.includes(g)||config.equipment.includes('Gimnasio completo')&&['Mancuernas','Bandas elásticas','Kettlebell'].includes(g));
 const makeSession124=(_day:number,index:number):TrainingSession122=>{
  const block=Math.floor((yearWeek-1)/4),phase=(yearWeek-1)%4;
  const categories=['Fuerza','Resistencia','Movilidad','Agilidad','Fuerza','Recuperación'];
  const priority=config.goal==='Fuerza'?'Fuerza':config.goal==='Resistencia'?'Resistencia':config.goal==='Movilidad'?'Movilidad':null;
  const category=priority&&index===0?priority:categories[(index+block+(config.sport==='Pádel'?1:0))%categories.length];
  const pool=exercisePool124.filter(e=>e.category===category&&available124(e.gear));
  const desired=category==='Resistencia'||category==='Recuperación'?2:Math.max(3,Math.min(5,Math.round(config.duration/10)+1));
  const chosen=Array.from({length:Math.min(desired,pool.length)},(_,j)=>pool[(block*3+phase+j*2+index)%pool.length]);
  const exercises=chosen.map(ex=>({name:ex.name,sets:phase===3?Math.max(1,ex.sets-1):phase===2&&config.level!=='Iniciación'&&ex.sets>1?ex.sets+1:ex.sets,reps:ex.reps,rest:ex.rest,tip:ex.tip}));
  return {name:category+' · '+(block+1)+'.'+(phase+1),category,exercises};
 };
 const week=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const plan=config.weekdays.map((d,i)=>({day:d,session:makeSession124(d,i)})).sort((a,b)=>a.day-b.day);
 const chosen=plan.find(p=>p.day===activeDay);
 const dateFor=(day:number)=>{const base=config.start_date?new Date(config.start_date+'T12:00:00'):trainingMonday126(new Date());base.setDate(base.getDate()+(yearWeek-1)*7+day);return trainingDate126(base)};
 const finish=async()=>{if(!chosen||!supabase)return;const day=openedDate||dateFor(chosen.day);const key=day+':'+chosen.session.name;setBusy(true);const r=await supabase.from('player_training_sessions').upsert({user_id:userId,session_date:day,session_name:chosen.session.name,category:chosen.session.category,completed_at:new Date().toISOString()},{onConflict:'user_id,session_date,session_name'});setBusy(false);if(r.error)setMsg('No se pudo registrar la sesión: '+r.error.message);else{setCompleted(v=>({...v,[key]:true}));setMsg('Entrenamiento registrado en tu historial.');window.dispatchEvent(new Event('racketon-training-saved'))}};
 useEffect(()=>{if(!ready||!supabase)return;let live=true;const start=dateFor(0),end=dateFor(6);void supabase.from('player_training_sessions').select('session_date,session_name').eq('user_id',userId).gte('session_date',start).lte('session_date',end).then(({data})=>{if(live&&data){const next:Record<string,boolean>={};for(const r of data)next[String(r.session_date)+':'+String(r.session_name)]=true;setCompleted(next)}});return()=>{live=false}},[ready,userId,config,yearWeek]);
 useEffect(()=>{if(seconds<=0)return;const timer=window.setInterval(()=>setSeconds(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(timer)},[seconds]);
 return <div className="rkt-training"><div className="rkt-training-head"><div><span>RACKETON TRAINING</span><h2>Tu preparación física</h2><p>Sesiones complementarias para deportes de raqueta. Configura tus días y sigue un plan guiado.</p></div><Dumbbell size={29}/></div>
 {msg&&<p className="rkt-training-message" role="status">{msg}</p>}
 <details className="rkt-training-config" open={!ready}><summary>{ready?'Modificar mi planificación':'Configurar mi plan semanal'}</summary><div className="rkt-training-form"><label>Deporte<select value={draft.sport} onChange={e=>setDraft(v=>({...v,sport:e.target.value}))}>{['Tenis','Pádel','Pickleball','Squash','Bádminton'].map(x=><option key={x}>{x}</option>)}</select></label><label>Experiencia física<select value={draft.level} onChange={e=>setDraft(v=>({...v,level:e.target.value}))}>{['Iniciación','Intermedio','Avanzado','Competición'].map(x=><option key={x}>{x}</option>)}</select></label><label>Sesiones por semana<select value={draft.days} onChange={e=>updateDays(Number(e.target.value))}>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>{x} días</option>)}</select></label><label>Tiempo por sesión<select value={draft.duration} onChange={e=>setDraft(v=>({...v,duration:Number(e.target.value)}))}>{[20,30,45,60].map(x=><option key={x} value={x}>{x} minutos</option>)}</select></label><label>Objetivo<select value={draft.goal} onChange={e=>setDraft(v=>({...v,goal:e.target.value}))}>{['Preparación general','Fuerza','Resistencia','Movilidad'].map(x=><option key={x}>{x}</option>)}</select></label></div><p className="rkt-training-label">¿Qué material tienes disponible?</p><div className="rkt-training-equipment">{materials.map(m=><button key={m} type="button" className={draft.equipment.includes(m)?'chosen':''} onClick={()=>setDraft(v=>({...v,equipment:v.equipment.includes(m)?v.equipment.filter(x=>x!==m):[...v.equipment,m]}))}><span>{draft.equipment.includes(m)?'✓':'+'}</span>{m}</button>)}</div><p className="rkt-training-hint">Puedes elegir varias opciones. Los ejercicios se adaptarán al material indicado.</p><p className="rkt-training-label">Días de entrenamiento ({draft.weekdays.length}/{draft.days})</p><div className="rkt-training-week">{week.map((d,i)=><button type="button" key={d} className={draft.weekdays.includes(i)?'chosen':''} onClick={()=>setDraft(v=>({...v,weekdays:v.weekdays.includes(i)?v.weekdays.filter(x=>x!==i):v.weekdays.length<v.days?[...v.weekdays,i].sort((a,b)=>a-b):v.weekdays}))}>{d.slice(0,3)}</button>)}</div><button className="rkt-training-primary" disabled={busy||draft.weekdays.length!==draft.days} onClick={()=>void save()}>{busy?'Guardando…':'Guardar mi planificación'}</button></details>
 {ready&&<><div className="rkt-training-plan"><h3>Tu plan · {config.days} sesiones semanales</h3><p className="rkt-training-hint">{plan.filter(p=>completed[dateFor(p.day)+':'+p.session.name]).length} de {plan.length} sesiones completadas esta semana</p><div className="rkt-training-cycle"><button type="button" disabled={yearWeek===1} onClick={()=>{setYearWeek(v=>Math.max(1,v-1));setActiveDay(null);setDoneSets({})}}>‹ Anterior</button><strong>Semana {yearWeek} de 52 · Bloque {Math.ceil(yearWeek/4)} de 13</strong><button type="button" disabled={yearWeek===52} onClick={()=>{setYearWeek(v=>Math.min(52,v+1));setActiveDay(null);setDoneSets({})}}>Siguiente ›</button></div><p className="rkt-training-hint">Programa anual de 13 bloques de cuatro semanas. En cada bloque cambian las sesiones y los ejercicios; la cuarta semana reduce el volumen. La intensidad debe ajustarse a la fatiga y a los partidos.</p><p>{config.sport} · {config.level} · {config.duration} minutos orientativos por sesión</p><div className="rkt-training-days">{plan.map(({day,session})=>{const key=(activeDay===day&&openedDate?openedDate:dateFor(day))+':'+session.name;return <button type="button" key={day} className={activeDay===day?'active':''} onClick={()=>{setActiveDay(day);setOpenedDate(null);setDoneSets({});setSeconds(0)}}><small>{week[day]}</small><strong>{session.name}</strong><span>{completed[key]?'✓ Realizado':session.category}</span></button>})}</div></div>{chosen&&<div className="rkt-training-session"><h3>{chosen.session.name}</h3><p>{week[chosen.day]} · {chosen.session.category} · duración orientativa {config.duration} min</p><div className="rkt-training-exercises">{chosen.session.exercises.map((ex,i)=><div className="rkt-training-exercise" key={ex.name}><strong>{i+1}. {ex.name}</strong><span>{ex.sets} series · {ex.reps} · descanso {ex.rest} s</span><p>{ex.tip}</p><div className="rkt-training-setrow">{Array.from({length:ex.sets},(_,j)=>{const id=chosen.day+':'+i+':'+j;return <button type="button" key={j} className={doneSets[id]?'done':''} onClick={()=>{setDoneSets(v=>({...v,[id]:!v[id]}));if(!doneSets[id]&&ex.rest>0)setSeconds(ex.rest)}}>{doneSets[id]?'✓ ':''}Serie {j+1}</button>})}</div></div>)}</div><div className="rkt-training-bottom"><span>{seconds>0?`Descanso: ${seconds} s`:'Descanso listo'}</span><button type="button" onClick={()=>setSeconds(0)}><RotateCcw size={15}/> Omitir descanso</button></div><button type="button" className="rkt-training-primary" disabled={busy||!chosen.session.exercises.every((ex,i)=>Array.from({length:ex.sets},(_,j)=>doneSets[chosen.day+':'+i+':'+j]).every(Boolean))} onClick={()=>void finish()}><CheckCircle2 size={17}/> Registrar entrenamiento completado</button></div>}</>}
 <p className="rkt-training-safety">Plan orientativo para personas sin contraindicaciones. Reduce o suspende la carga si hay dolor, lesión o fatiga importante. Las sesiones no sustituyen una valoración profesional y aún no se ajustan automáticamente a los partidos. La variedad anual se genera por bloques; la duración sigue siendo orientativa.</p>
 <style>{`.rkt-training{display:grid;gap:16px;margin-top:20px;max-width:1000px}.rkt-training-head,.rkt-training-config,.rkt-training-plan,.rkt-training-session{background:#fff;border:1px solid #e6e9ef;border-radius:17px;padding:22px}.rkt-training-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.rkt-training-head>svg{color:#c8102e}.rkt-training-head span{color:#c8102e;font-size:11px;letter-spacing:1.4px;font-weight:850}.rkt-training-head h2{font-size:22px;margin:7px 0}.rkt-training-head p,.rkt-training-plan p,.rkt-training-session>p{font-size:13px;color:#64748b;margin:5px 0}.rkt-training-config summary{cursor:pointer;font-weight:800;color:#172033}.rkt-training-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}.rkt-training-form label{display:grid;gap:6px;color:#475569;font-size:12px;font-weight:750}.rkt-training-form select{width:100%;min-width:0;border:1px solid #dbe0e7;border-radius:9px;padding:11px;background:#fff;color:#1e293b}.rkt-training-label{font-size:12px;font-weight:750;margin:18px 0 9px}.rkt-training-week{display:flex;gap:6px;flex-wrap:wrap}.rkt-training-week button{border:1px solid #e2e8f0;background:#f8fafc;border-radius:9px;padding:10px 13px;cursor:pointer}.rkt-training-week button.chosen{background:#fff0f3;border-color:#c8102e;color:#b70e2d;font-weight:800}.rkt-training-primary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;padding:12px 18px;background:#c8102e;color:white;font-weight:800;cursor:pointer;margin-top:16px}.rkt-training-primary:disabled{opacity:.5;cursor:not-allowed}.rkt-training-message{padding:12px 15px;border-radius:10px;background:#fff8e9;color:#805700;font-size:13px}.rkt-training-plan h3,.rkt-training-session h3{margin:0 0 6px}.rkt-training-days{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin-top:15px}.rkt-training-days button{display:grid;gap:6px;text-align:left;border:1px solid #e5e7eb;background:#fafbfc;border-radius:12px;padding:13px;cursor:pointer}.rkt-training-days button.active{border-color:#c8102e;background:#fff3f5}.rkt-training-days small{color:#64748b}.rkt-training-days strong{font-size:13px}.rkt-training-days span{font-size:11px;color:#b80f31}.rkt-training-exercises{display:grid;gap:10px;margin-top:16px}.rkt-training-exercise{border:1px solid #e9edf2;border-radius:12px;padding:15px;display:grid;gap:7px}.rkt-training-exercise>span{font-size:13px;color:#b80f31;font-weight:750}.rkt-training-exercise p{font-size:12px;color:#64748b;margin:0}.rkt-training-setrow{display:flex;gap:7px;flex-wrap:wrap;margin-top:6px}.rkt-training-setrow button{border:1px solid #dbe0e7;border-radius:8px;background:#f8fafc;padding:8px 10px;font-size:12px;cursor:pointer}.rkt-training-setrow button.done{background:#e9f8ef;border-color:#8bcba2;color:#176b39}.rkt-training-bottom{display:flex;gap:10px;justify-content:space-between;align-items:center;margin-top:16px;font-weight:800}.rkt-training-bottom button{display:flex;align-items:center;gap:5px;background:white;border:1px solid #e5e7eb;border-radius:8px;padding:9px;cursor:pointer}.rkt-training-equipment{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin-bottom:8px}.rkt-training-equipment button{display:flex;align-items:center;gap:9px;text-align:left;padding:13px 11px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-weight:700;color:#334155;cursor:pointer}.rkt-training-equipment button.chosen{background:#fff1f3;border-color:#c8102e;color:#a50d28}.rkt-training-equipment button span{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:white;border:1px solid #e2e8f0}.rkt-training-hint{font-size:12px;color:#64748b;line-height:1.6}.rkt-training-cycle{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.rkt-training-cycle button{border:1px solid #e2e8f0;background:#f8fafc;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:700}.rkt-training-cycle button.active{border-color:#c8102e;background:#fff0f3;color:#c8102e}.rkt-training-safety{font-size:12px;line-height:1.6;color:#64748b;padding:0 4px}.rkt-training{--rt-red:#c8102e;--rt-ink:#182033;--rt-muted:#64748b;gap:20px;max-width:1100px;padding-bottom:24px}.rkt-training-head{position:relative;overflow:hidden;background:linear-gradient(120deg,#161c2c 0%,#292235 58%,#8b1731 100%);color:#fff;border:0;border-radius:22px;padding:30px 32px;box-shadow:0 15px 32px rgba(30,24,42,.14);min-height:145px}.rkt-training-head:before{content:'';position:absolute;width:270px;height:270px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-75px;top:-115px;box-shadow:0 0 0 34px rgba(255,255,255,.035),0 0 0 68px rgba(255,255,255,.025)}.rkt-training-head>div{position:relative;z-index:1}.rkt-training-head>svg{color:#fff;position:relative;z-index:1;background:rgba(255,255,255,.13);padding:13px;width:62px;height:62px;border-radius:18px}.rkt-training-head span{color:#ffbac5;letter-spacing:2px;font-size:11px}.rkt-training-head h2{font-size:clamp(25px,3.5vw,35px);letter-spacing:-.8px;margin:8px 0}.rkt-training-head p{color:#e6dfe6;font-size:14px;line-height:1.55;max-width:560px}.rkt-training-config,.rkt-training-plan,.rkt-training-session{border:1px solid #e8ebf1;border-radius:20px;padding:25px;box-shadow:0 5px 22px rgba(18,30,55,.035)}.rkt-training-config summary{list-style:none;display:flex;align-items:center;justify-content:space-between;font-size:16px;padding:3px 0}.rkt-training-config summary::-webkit-details-marker{display:none}.rkt-training-config summary:after{content:'⌄';display:grid;place-items:center;background:#f3f5f8;color:#b90e2b;width:32px;height:32px;border-radius:10px;font-size:22px}.rkt-training-config[open] summary:after{content:'⌃'}.rkt-training-form select{border-radius:12px;padding:13px 12px;transition:border-color .2s,box-shadow .2s}.rkt-training-form select:focus{outline:0;border-color:#c8102e;box-shadow:0 0 0 3px rgba(200,16,46,.12)}.rkt-training-label{font-size:13px;color:#1e293b;margin-top:23px}.rkt-training-equipment{grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}.rkt-training-equipment button{min-height:63px;border-radius:13px;transition:transform .18s,box-shadow .18s,border-color .18s}.rkt-training-equipment button:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(20,30,50,.08)}.rkt-training-equipment button.chosen{box-shadow:0 0 0 1px rgba(200,16,46,.12)}.rkt-training-week button{min-width:59px;border-radius:12px;padding:13px 16px;font-weight:700}.rkt-training-plan h3,.rkt-training-session h3{font-size:21px;letter-spacing:-.35px;color:#172033}.rkt-training-cycle{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;margin:19px 0;padding:10px;background:#f5f6f9;border-radius:15px}.rkt-training-cycle strong{text-align:center;font-size:13px;color:#273047}.rkt-training-cycle button{background:#fff;border:1px solid #e7e9ef;box-shadow:0 2px 5px rgba(0,0,0,.025);white-space:nowrap}.rkt-training-cycle button:disabled{opacity:.4;cursor:not-allowed}.rkt-training-days{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:21px}.rkt-training-days button{position:relative;min-height:125px;padding:18px;border-radius:16px;border:1px solid #e7eaf0;background:linear-gradient(145deg,#fff,#f7f8fb);gap:9px;transition:transform .18s,box-shadow .18s,border-color .18s}.rkt-training-days button:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(20,30,55,.09)}.rkt-training-days button.active{background:linear-gradient(140deg,#fff5f6,#fff);border:2px solid #c8102e;box-shadow:0 7px 20px rgba(200,16,46,.09)}.rkt-training-days button small{text-transform:uppercase;letter-spacing:1px;font-size:10px;font-weight:850}.rkt-training-days button strong{font-size:15px;line-height:1.35;color:#172033}.rkt-training-days button span{justify-self:start;align-self:end;background:#fff0f2;border-radius:99px;padding:5px 9px;font-weight:750}.rkt-training-session{border-top:4px solid #c8102e}.rkt-training-session>p{line-height:1.7}.rkt-training-exercises{gap:13px;margin-top:20px;counter-reset:exercise}.rkt-training-exercise{position:relative;border-radius:16px;padding:19px 20px;border:1px solid #e7eaf0;background:linear-gradient(120deg,#fff,#fcfcfe);gap:10px}.rkt-training-exercise>strong{font-size:15px;color:#1e293b;line-height:1.4}.rkt-training-exercise>span{display:inline-flex;justify-self:start;background:#fff0f2;color:#b80f31;border-radius:9px;padding:7px 10px;font-size:12px}.rkt-training-exercise p{line-height:1.65;font-size:13px}.rkt-training-setrow button{border-radius:10px;padding:10px 14px;font-weight:750;min-height:39px}.rkt-training-setrow button:hover{border-color:#c8102e}.rkt-training-setrow button.done{background:#e7f7ec;border-color:#75c591}.rkt-training-bottom{background:#f5f6f9;padding:13px 15px;border-radius:13px}.rkt-training-primary{min-height:46px;border-radius:12px;box-shadow:0 5px 12px rgba(200,16,46,.14);transition:transform .15s,background .15s}.rkt-training-primary:hover:not(:disabled){transform:translateY(-1px);background:#a90d27}.rkt-training-message{border-left:4px solid #dba128}.rkt-training-safety{background:#f6f7f9;border-radius:12px;padding:13px 16px;line-height:1.7}@media(max-width:600px){.rkt-training-head{padding:23px 20px;min-height:140px}.rkt-training-head>svg{width:47px;height:47px;padding:10px}.rkt-training-head h2{font-size:25px}.rkt-training-config,.rkt-training-plan,.rkt-training-session{padding:17px}.rkt-training-cycle{grid-template-columns:1fr 1fr}.rkt-training-cycle strong{grid-column:1/-1;grid-row:1}.rkt-training-cycle button{grid-row:2}.rkt-training-days{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.rkt-training-days button{min-height:132px;padding:12px}.rkt-training-days button strong{font-size:13px}.rkt-training-equipment{grid-template-columns:repeat(2,minmax(0,1fr))}.rkt-training-equipment button{font-size:12px;padding:10px}.rkt-training-bottom{flex-wrap:wrap}.rkt-training-setrow button{flex:1}}@media(max-width:600px){.rkt-training-form{grid-template-columns:1fr}.rkt-training-head,.rkt-training-config,.rkt-training-plan,.rkt-training-session{padding:16px}}`}</style>
 </div>
}

type AgendaEvent121={id:string;date:string;title:string;category:'Desafíos'|'Competiciones'|'Reservas'|'Entrenamientos';subtitle:string;status:string;venue:string};
function trainingDate126(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function trainingMonday126(date:Date){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
function PlayerAgenda121({userId}:{userId:string}){
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)});
 const [selected,setSelected]=useState(()=>new Date().getDate());
 const [filter,setFilter]=useState('Todos');
 const [view,setView]=useState<'calendario'|'lista'>('calendario');
 const [events,setEvents]=useState<AgendaEvent121[]>([]);
 const [loading,setLoading]=useState(true);
 const [warning,setWarning]=useState('');
 const [training,setTraining]=useState<TrainingConfig122|null>(null);
 const [trainingCompleted,setTrainingCompleted]=useState<Record<string,boolean>>({});
 const [trainingRevision,setTrainingRevision]=useState(0);
 const [moved,setMoved]=useState<Record<string,string>>({});
 const [moving,setMoving]=useState<string|null>(null);
 const [targetDate,setTargetDate]=useState('');
 const [moveBusy,setMoveBusy]=useState(false);
 const [moveError,setMoveError]=useState('');
 useEffect(()=>{const update=()=>setTrainingRevision(v=>v+1);window.addEventListener('racketon-training-saved',update);return()=>window.removeEventListener('racketon-training-saved',update)},[]);
 useEffect(()=>{let alive=true;if(!supabase)return;void Promise.all([
  supabase.from('player_training_settings').select('sport,level,days,duration,goal,weekdays,equipment,start_date').eq('user_id',userId).maybeSingle(),
  supabase.from('player_training_sessions').select('session_date').eq('user_id',userId).limit(1000),
  supabase.from('player_training_reschedules').select('original_date,new_date').eq('user_id',userId).limit(1000)
 ]).then(([a,b,c])=>{if(!alive)return;if(!a.error&&a.data)setTraining(a.data as TrainingConfig122);else setTraining(null);if(!b.error&&b.data){const map:Record<string,boolean>={};for(const row of b.data)map[String(row.session_date)]=true;setTrainingCompleted(map)}if(!c.error&&c.data){const next:Record<string,string>={};for(const row of c.data)next[String(row.original_date)]=String(row.new_date);setMoved(next)}});return()=>{alive=false}},[userId,trainingRevision]);
 const trainingEvents:AgendaEvent121[]=(()=>{
  if(!training?.start_date||!Array.isArray(training.weekdays))return [];
  const start=new Date(training.start_date+'T12:00:00');if(Number.isNaN(start.getTime()))return [];
  const result:AgendaEvent121[]=[];
  for(let w=0;w<52;w++)for(const day of training.weekdays){
   if(!Number.isInteger(day)||day<0||day>6)continue;
   const date=new Date(start);date.setDate(start.getDate()+w*7+day);
   const original=trainingDate126(date);const dateStr=moved[original]||original;
   const kinds=training.goal==='Movilidad'?['Movilidad','Estabilidad','Recuperación','Fuerza']:training.goal==='Resistencia'?['Resistencia','Fuerza','Movilidad','Agilidad']:['Fuerza','Resistencia','Agilidad','Movilidad'];
   const position=training.weekdays.indexOf(day);
   const category=kinds[(w+position)%kinds.length];
   result.push({id:'training-'+original,date:dateStr,title:'Entrenamiento · '+category,category:'Entrenamientos',subtitle:`${training.sport} · ${training.duration} min · Semana ${w+1}/52`,status:trainingCompleted[dateStr]?'Realizado':dateStr<trainingDate126(new Date())?'No realizado':'Programado',venue:'RACKETON TRAINING'});
  }
  return result;
 })();
 const calendarEvents=[...events,...trainingEvents];
 const trainingStats={planned:trainingEvents.filter(e=>e.date.slice(0,7)===trainingDate126(month).slice(0,7)).length,done:trainingEvents.filter(e=>e.date.slice(0,7)===trainingDate126(month).slice(0,7)&&e.status==='Realizado').length};
 const saveMove=async()=>{if(!supabase||!moving||!targetDate)return;const original=moving.replace('training-','');if(targetDate===original){setMoving(null);return;}if(!training?.start_date||targetDate<training.start_date){setMoveError('Selecciona una fecha dentro de la temporada.');return;}const end=new Date(training.start_date+'T12:00:00');end.setDate(end.getDate()+364);if(targetDate>trainingDate126(end)){setMoveError('La fecha debe estar dentro de las 52 semanas.');return;}if(trainingEvents.some(e=>e.id!==moving&&e.date===targetDate)){setMoveError('Ya tienes otro entrenamiento ese día.');return;}if(events.some(e=>e.date.slice(0,10)===targetDate)){setMoveError('Hay un desafío programado ese día. Selecciona otro.');return;}setMoveBusy(true);const r=await supabase.from('player_training_reschedules').upsert({user_id:userId,original_date:original,new_date:targetDate,updated_at:new Date().toISOString()},{onConflict:'user_id,original_date'});setMoveBusy(false);if(r.error){setMoveError('No se pudo reprogramar: '+r.error.message);return;}setMoved(v=>({...v,[original]:targetDate}));setMoving(null);setMoveError('')};

 useEffect(()=>{let live=true;async function load(){if(!supabase){setLoading(false);setWarning('No se ha configurado la conexión con Supabase.');return;}
  const res=await supabase.from('tennis_challenges').select('*').or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`).limit(200);
  if(!live)return;
  if(res.error){setWarning('No se pudieron consultar los desafíos. Comprueba los permisos de lectura de Supabase.');setEvents([])}else{
   setWarning('');const rows=(res.data||[]) as Record<string,unknown>[];
   const mapped=rows.flatMap((r):AgendaEvent121[]=>{
    const raw=r.scheduled_at??r.match_date??r.played_at??r.scheduled_date??r.date;
    if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}/.test(raw))return [];
    const status=String(r.status??'Sin confirmar');
    const venue=String(r.venue_name??r.club_name??r.location_name??r.venue??'Instalación no indicada');
    const other=String(r.challenger_id===userId?(r.challenged_name??r.opponent_name??'Rival por confirmar'):(r.challenger_name??r.opponent_name??'Rival por confirmar'));
    return [{id:String(r.id??raw),date:raw,title:'Desafío de tenis',category:'Desafíos',subtitle:other,status,venue}];
   });setEvents(mapped.sort((a,b)=>a.date.localeCompare(b.date)));
  }setLoading(false);
 }void load();return()=>{live=false}},[userId]);
 const y=month.getFullYear(),m=month.getMonth(),days=new Date(y,m+1,0).getDate(),offset=(new Date(y,m,1).getDay()+6)%7;
 const dateKey=(d:number)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const matches=(e:AgendaEvent121)=>filter==='Todos'||e.category===filter;
 const dayEvents=calendarEvents.filter(e=>e.date.slice(0,10)===dateKey(selected)&&matches(e));
 const monthEvents=calendarEvents.filter(e=>e.date.slice(0,7)===dateKey(1).slice(0,7)&&matches(e));
 const shift=(delta:number)=>{setMonth(new Date(y,m+delta,1));setSelected(1)};
 const displayTime=(date:string)=>date.includes('T')?date.slice(11,16):'Hora pendiente';
 return <div className="rkt-agenda">
  <div className="rkt-agenda-intro"><div><span className="rkt-agenda-kicker">TU ACTIVIDAD</span><h2>Calendario personal</h2><p>Tus entrenamientos de la temporada y tus partidos, juntos en un calendario.</p></div><CalendarDays size={29}/></div>
  <div className="rkt-agenda-toolbar"><div className="rkt-agenda-month"><button type="button" onClick={()=>shift(-1)} aria-label="Mes anterior">‹</button><strong>{month.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>shift(1)} aria-label="Mes siguiente">›</button></div><div className="rkt-agenda-view"><button type="button" className={view==='calendario'?'active':''} onClick={()=>setView('calendario')}>Calendario</button><button type="button" className={view==='lista'?'active':''} onClick={()=>setView('lista')}>Lista</button></div></div>
  {training&&<div className="rkt-agenda-progress"><strong>Entrenamientos del mes</strong><span>{trainingStats.done} de {trainingStats.planned} completados</span><div><i style={{width:(trainingStats.planned?100*trainingStats.done/trainingStats.planned:0)+'%'}}/></div></div>}
  <div className="rkt-agenda-filters">{['Todos','Entrenamientos','Desafíos','Competiciones','Reservas'].map(f=><button type="button" key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
  {warning&&<div className="rkt-agenda-warning" role="status">{warning}</div>}
  {loading?<div className="rkt-agenda-empty">Cargando tu agenda…</div>:<>
  {view==='calendario'&&<div className="rkt-agenda-calendar"><div className="rkt-agenda-grid">{['L','M','X','J','V','S','D'].map((d,i)=><div className="rkt-agenda-weekday" key={i}>{d}</div>)}{Array.from({length:offset},(_,i)=><div key={'blank'+i} className="rkt-agenda-blank"/>)}{Array.from({length:days},(_,i)=>i+1).map(d=>{const count=calendarEvents.filter(e=>e.date.slice(0,10)===dateKey(d)&&matches(e)).length;return <button type="button" key={d} onClick={()=>setSelected(d)} className={'rkt-agenda-day '+(selected===d?'selected':'')} aria-label={`${d} de ${month.toLocaleDateString('es-ES',{month:'long'})}${count?', '+count+' actividades':''}`}><span>{d}</span>{count>0&&<i aria-hidden="true"/>}</button>})}</div></div>}
  <div className="rkt-agenda-events"><div className="rkt-agenda-events-head"><h3>{view==='lista'?'Actividad del mes':`Actividad del ${selected} de ${month.toLocaleDateString('es-ES',{month:'long'})}`}</h3><span>{(view==='lista'?monthEvents:dayEvents).length} eventos</span></div>{(view==='lista'?monthEvents:dayEvents).length===0?<div className="rkt-agenda-empty"><CalendarDays size={30}/><strong>Sin actividades registradas</strong><span>{filter==='Competiciones'||filter==='Reservas'?'Esta sección se conectará cuando estén disponibles las inscripciones y reservas.':'No hay actividades programadas para esta selección.'}</span></div>:(view==='lista'?monthEvents:dayEvents).map(e=><div className="rkt-agenda-event" key={e.id} onClick={e.category==='Entrenamientos'?()=>{const original=e.id.replace('training-','');if(!training?.start_date)return;const delta=Math.round((new Date(original+'T12:00:00').getTime()-new Date(training.start_date+'T12:00:00').getTime())/86400000);const week=Math.floor(delta/7)+1;const day=((new Date(original+'T12:00:00').getDay()+6)%7);window.dispatchEvent(new CustomEvent('racketon-open-training',{detail:{week,day,date:e.date}}));document.getElementById('racketon-training-plan')?.scrollIntoView({behavior:'smooth'});}:undefined} style={e.category==='Entrenamientos'?{cursor:'pointer',borderLeft:'4px solid #c8102e'}:undefined}><div className="rkt-agenda-event-icon">{e.category==='Entrenamientos'?<Dumbbell size={20}/>:<Swords size={20}/>}</div><div className="rkt-agenda-event-main"><strong>{e.title}</strong><span>{e.category==='Entrenamientos'?e.subtitle:`Rival: ${e.subtitle}`}</span><small><MapPin size={13}/>{e.venue}</small></div><div className="rkt-agenda-event-meta"><strong>{view==='lista'?e.date.slice(0,10).split('-').reverse().join('/'):displayTime(e.date)}</strong><span>{e.status}</span>{view==='lista'&&<small>{displayTime(e.date)}</small>}</div>{e.category==='Entrenamientos'&&<button type="button" className="rkt-agenda-move" onClick={ev=>{ev.stopPropagation();setMoving(e.id);setTargetDate(e.date);setMoveError('')}}>Cambiar día</button>}</div>)}</div>
  </>}
  {moving&&<div className="rkt-agenda-move-panel"><strong>Reprogramar entrenamiento</strong><label>Nueva fecha <input type="date" value={targetDate} onChange={e=>{setTargetDate(e.target.value);setMoveError('')}}/></label>{moveError&&<p role="alert">{moveError}</p>}<div><button type="button" onClick={()=>setMoving(null)}>Cancelar</button><button type="button" disabled={moveBusy||!targetDate} onClick={()=>void saveMove()}>{moveBusy?'Guardando…':'Guardar nueva fecha'}</button></div></div>}
  <div id="racketon-training-plan"><TrainingPlanner122 userId={userId}/></div>
  <div className="rkt-agenda-disclaimer"><ShieldCheck size={17}/> Los entrenamientos se programan según tus preferencias guardadas; los desafíos se muestran únicamente si tienen fecha registrada. Las competiciones y reservas se integrarán cuando sus módulos dispongan de fechas confirmadas.</div>
  <style>{`.rkt-agenda-progress{padding:16px 20px;background:#fff;border:1px solid #e6e9ef;border-radius:14px;display:grid;gap:8px}.rkt-agenda-progress span{font-size:12px;color:#64748b}.rkt-agenda-progress>div{height:8px;border-radius:20px;background:#f1f5f9;overflow:hidden}.rkt-agenda-progress>div i{display:block;height:100%;background:#c8102e;border-radius:20px}.rkt-agenda-move{border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:8px;font-size:11px;cursor:pointer}.rkt-agenda-move-panel{background:#fff;border:1px solid #c8102e;border-radius:14px;padding:20px;display:grid;gap:12px}.rkt-agenda-move-panel label{display:grid;gap:7px}.rkt-agenda-move-panel input{padding:10px;border:1px solid #cbd5e1;border-radius:8px}.rkt-agenda-move-panel>div{display:flex;gap:10px}.rkt-agenda-move-panel button{padding:10px 16px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}.rkt-agenda-move-panel button:last-child{background:#c8102e;color:#fff;border-color:#c8102e}.rkt-agenda{max-width:1000px;display:grid;gap:17px}.rkt-agenda-intro,.rkt-agenda-calendar,.rkt-agenda-events{background:#fff;border:1px solid #e6e9ef;border-radius:17px;padding:22px}.rkt-agenda-intro{display:flex;justify-content:space-between;align-items:center;gap:15px}.rkt-agenda-intro svg{color:#c8102e}.rkt-agenda-kicker{font-size:11px;letter-spacing:1.4px;font-weight:850;color:#c8102e}.rkt-agenda-intro h2{font-size:23px;margin:7px 0}.rkt-agenda-intro p{font-size:13px;color:#64748b;margin:0}.rkt-agenda-toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}.rkt-agenda-month,.rkt-agenda-view{display:flex;align-items:center;gap:9px}.rkt-agenda-month strong{text-transform:capitalize;min-width:175px;text-align:center}.rkt-agenda-month button{background:white;border:1px solid #e5e7eb;border-radius:9px;width:37px;height:37px;cursor:pointer;font-size:24px}.rkt-agenda-view{background:#eef0f4;padding:4px;border-radius:10px}.rkt-agenda-view button{border:0;border-radius:8px;padding:9px 12px;background:transparent;color:#64748b;font-weight:750;cursor:pointer}.rkt-agenda-view button.active{background:white;color:#c8102e;box-shadow:0 2px 6px #00000010}.rkt-agenda-filters{display:flex;gap:8px;flex-wrap:wrap}.rkt-agenda-filters button{border:1px solid #e5e7eb;background:white;border-radius:20px;padding:9px 14px;color:#475569;cursor:pointer;font-size:12px;font-weight:750}.rkt-agenda-filters button.active{background:#c8102e;color:white;border-color:#c8102e}.rkt-agenda-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.rkt-agenda-weekday{text-align:center;color:#94a3b8;font-size:12px;font-weight:800;padding:7px}.rkt-agenda-day,.rkt-agenda-blank{min-height:65px}.rkt-agenda-day{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;background:#f8fafc;border:1px solid transparent;border-radius:10px;cursor:pointer;color:#334155;font-weight:750}.rkt-agenda-day.selected{background:#fff0f3;border-color:#c8102e;color:#c8102e}.rkt-agenda-day i{width:6px;height:6px;background:#c8102e;border-radius:50%}.rkt-agenda-events-head{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid #eef0f3;padding-bottom:15px;margin-bottom:10px}.rkt-agenda-events-head h3{font-size:17px;margin:0}.rkt-agenda-events-head>span{color:#64748b;font-size:12px}.rkt-agenda-empty{padding:40px 15px;display:flex;align-items:center;flex-direction:column;gap:10px;text-align:center;color:#64748b;font-size:13px}.rkt-agenda-empty strong{color:#334155;font-size:15px}.rkt-agenda-event{display:flex;gap:14px;align-items:center;padding:15px 4px;border-bottom:1px solid #eef0f3}.rkt-agenda-event:last-child{border:0}.rkt-agenda-event-icon{background:#fff0f3;color:#c8102e;border-radius:12px;padding:12px}.rkt-agenda-event-main{display:grid;gap:5px;flex:1;min-width:0}.rkt-agenda-event-main strong{font-size:14px}.rkt-agenda-event-main span,.rkt-agenda-event-main small{font-size:12px;color:#64748b}.rkt-agenda-event-main small{display:flex;gap:5px;align-items:center}.rkt-agenda-event-meta{display:grid;gap:5px;text-align:right;font-size:12px}.rkt-agenda-event-meta span,.rkt-agenda-event-meta small{color:#64748b}.rkt-agenda-warning{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px;font-size:13px;color:#9a3412}.rkt-agenda-disclaimer{display:flex;align-items:flex-start;gap:10px;color:#64748b;font-size:12px;line-height:1.5}.rkt-agenda-disclaimer svg{flex-shrink:0;color:#c8102e}@media(max-width:580px){.rkt-agenda-intro,.rkt-agenda-calendar,.rkt-agenda-events{padding:15px}.rkt-agenda-day,.rkt-agenda-blank{min-height:45px}.rkt-agenda-grid{gap:3px}.rkt-agenda-month strong{min-width:145px}.rkt-agenda-event-icon{padding:9px}}`}</style>
 </div>;
}


type PlayerNotice128={id:string;kind:'challenge'|'training';title:string;detail:string;date:string;action:'Desafíos'|'Mi agenda';urgent:boolean};
function PlayerNotices128({userId,onNavigate}:{userId:string;onNavigate:(area:PlayerArea,sub:string)=>void}){
 const [notices,setNotices]=useState<PlayerNotice128[]>([]);
 const [seen,setSeen]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [filter,setFilter]=useState<'Todos'|'Pendientes'|'Leídos'>('Todos');
 const [saving,setSaving]=useState<string|null>(null);
 useEffect(()=>{let active=true;async function load(){if(!supabase)return;
  setLoading(true);setError('');
  const [challenges,settings,done,read]=await Promise.all([
   supabase.from('tennis_challenges').select('id,status,created_at,challenger_id,challenged_id').or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`).order('created_at',{ascending:false}).limit(80),
   supabase.from('player_training_settings').select('start_date,weekdays,sport,duration').eq('user_id',userId).maybeSingle(),
   supabase.from('player_training_sessions').select('session_date').eq('user_id',userId).limit(1000),
   supabase.from('player_notice_reads').select('notice_id').eq('user_id',userId).limit(1000)
  ]);
  if(!active)return;
  if(challenges.error)setError('No se han podido consultar los desafíos. '+challenges.error.message);
  if(read.error)setError(v=>v||'No se ha podido consultar el estado de lectura: '+read.error.message);
  const list:PlayerNotice128[]=[];
  for(const c of challenges.data||[]){
   const status=String(c.status||'').toLowerCase();const incoming=c.challenged_id===userId;
   if(status==='pending'||status==='proposed'||status==='accepted'||status==='confirmed'){
    const isPending=status==='pending'||status==='proposed';
    list.push({id:'challenge-'+c.id,kind:'challenge',title:isPending?(incoming?'Tienes un desafío pendiente':'Desafío enviado pendiente de respuesta'):'Desafío confirmado',detail:isPending?(incoming?'Revisa la invitación y responde desde Competir → Desafíos.':'Puedes consultar el estado de tu propuesta en Desafíos.'):'Consulta los detalles y la fecha del partido en Desafíos.',date:String(c.created_at||''),action:'Desafíos',urgent:isPending&&incoming});
   }
  }
  if(settings.data?.start_date&&Array.isArray(settings.data.weekdays)){
   const completed=new Set((done.data||[]).map(r=>String(r.session_date)));
   const start=new Date(String(settings.data.start_date)+'T12:00:00');const today=trainingDate126(new Date());
   if(!Number.isNaN(start.getTime())){
    for(let w=0;w<52;w++)for(const day of settings.data.weekdays as number[]){
     if(!Number.isInteger(day)||day<0||day>6)continue;
     const d=new Date(start);d.setDate(start.getDate()+w*7+day);const date=trainingDate126(d);
     if(date<today||date>trainingDate126(new Date(Date.now()+7*86400000))||completed.has(date))continue;
     list.push({id:'training-'+date,kind:'training',title:date===today?'Entrenamiento programado para hoy':'Próximo entrenamiento',detail:`${settings.data.sport||'Deporte'} · ${settings.data.duration||30} minutos · Semana ${w+1} de 52`,date,action:'Mi agenda',urgent:date===today});
    }
   }
  }
  setNotices(list.sort((a,b)=>Number(b.urgent)-Number(a.urgent)||b.date.localeCompare(a.date)));
  setSeen((read.data||[]).map(r=>String(r.notice_id)));
  setLoading(false);
 }void load();return()=>{active=false}},[userId]);
 const mark=async(id:string)=>{if(!supabase||saving)return;setSaving(id);const {error:saveError}=await supabase.from('player_notice_reads').upsert({user_id:userId,notice_id:id,read_at:new Date().toISOString()},{onConflict:'user_id,notice_id'});if(saveError)setError('No se pudo guardar el estado de lectura: '+saveError.message);else setSeen(v=>v.includes(id)?v:[...v,id]);setSaving(null)};
 const unread=notices.filter(n=>!seen.includes(n.id)).length;
 const visible=notices.filter(n=>filter==='Todos'||(filter==='Pendientes'?!seen.includes(n.id):seen.includes(n.id)));
 return <div className="rkt-notices"><div className="rkt-notices-hero"><div><span>MI CENTRO DE ACTIVIDAD</span><h2>Siempre al día de tu deporte</h2><p>Desafíos que requieren atención y próximos entrenamientos, reunidos en un solo lugar.</p></div><div className="rkt-notices-counter"><strong>{unread}</strong><small>sin leer</small></div></div>
  <div className="rkt-notices-toolbar"><div>{(['Todos','Pendientes','Leídos'] as const).map(f=><button type="button" className={filter===f?'active':''} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><span>{visible.length} avisos</span></div>
  {error&&<p className="rkt-notices-error" role="alert">{error}</p>}
  {loading?<div className="rkt-notices-empty">Cargando avisos…</div>:visible.length===0?<div className="rkt-notices-empty"><Bell size={32}/><h3>{filter==='Todos'?'No tienes avisos por ahora':'No hay avisos en este filtro'}</h3><p>Las nuevas invitaciones y los entrenamientos próximos aparecerán aquí.</p></div>:<div className="rkt-notices-list">{visible.map(n=><article key={n.id} className={'rkt-notice '+(!seen.includes(n.id)?'unread':'')}><div className={'rkt-notice-icon '+n.kind}>{n.kind==='training'?<Dumbbell size={21}/>:<Swords size={21}/>}</div><div className="rkt-notice-main"><div className="rkt-notice-tags"><span>{n.kind==='training'?'ENTRENAMIENTO':'DESAFÍO'}</span>{n.urgent&&<em>Requiere atención</em>}{!seen.includes(n.id)&&<b>Nuevo</b>}</div><h3>{n.title}</h3><p>{n.detail}</p><small>{n.date?new Date(n.date.includes('T')?n.date:n.date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):'Fecha pendiente'}</small><div className="rkt-notice-actions"><button type="button" onClick={()=>onNavigate(n.action==='Desafíos'?'Competir':'Inicio',n.action)}> {n.kind==='training'?'Ver entrenamiento':'Ver desafío'} <ArrowRight size={15}/></button>{!seen.includes(n.id)&&<button type="button" className="secondary" disabled={saving===n.id} onClick={()=>void mark(n.id)}>{saving===n.id?'Guardando…':'Marcar como leído'}</button>}</div></div></article>)}</div>}
  <p className="rkt-notices-footnote">Los avisos se generan a partir de tus desafíos y entrenamientos registrados. No se envían notificaciones push ni correos desde esta pantalla.</p>
 </div>
}


type RacketonCompetition130={
 id:string;title:string;sport:string;format:string;city:string;region:string;
 venue_name:string|null;starts_on:string;ends_on:string|null;
 registration_opens_on:string|null;registration_closes_on:string|null;
 capacity:number|null;level_min:string|null;level_max:string|null;
 description:string|null;rules_url:string|null;status:string;poster_url:string|null;categories:string[]|null;events:string[]|null;category_system:string|null;
};
function CompetitionExplorer130({userId}:{userId:string}){
 const [items,setItems]=useState<RacketonCompetition130[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [sport,setSport]=useState('Todos');
 const [region,setRegion]=useState('');
 const [query,setQuery]=useState('');
 const [status,setStatus]=useState('Todas');
 const [selected,setSelected]=useState<RacketonCompetition130|null>(null);
 const [categoryFilter,setCategoryFilter]=useState('Todas');
 const [publicEvents,setPublicEvents]=useState<CompetitionEvent133[]>([]);
 const [registrations,setRegistrations]=useState<Array<{id:string;event_id:string;player_id:string;partner_id:string|null;status:string}>>([]);
 const [counts,setCounts]=useState<Record<string,number>>({});
 const [partner,setPartner]=useState<Record<string,string>>({});
 const [enrolling,setEnrolling]=useState<string|null>(null);
 const [enrollMessage,setEnrollMessage]=useState('');
 const [enrollError,setEnrollError]=useState(false);
 const refreshEnrollments=async()=>{
  if(!supabase)return;
  const [mine,totals]=await Promise.all([
   supabase.from('racketon_event_entries').select('id,event_id,player_id,partner_id,status').or(`player_id.eq.${userId},partner_id.eq.${userId}`),
   supabase.from('racketon_event_entry_counts').select('event_id,confirmed_count')
  ]);
  if(mine.error||totals.error){setEnrollError(true);setEnrollMessage('Error al consultar inscripciones: '+(mine.error?.message||totals.error?.message));return;}
  setRegistrations((mine.data||[]) as Array<{id:string;event_id:string;player_id:string;partner_id:string|null;status:string}>);
  setCounts(Object.fromEntries((totals.data||[]).map((x:{event_id:string;confirmed_count:number})=>[x.event_id,x.confirmed_count])));
 };
 const enroll=async(ev:CompetitionEvent133)=>{
  if(!supabase||enrolling)return;
  setEnrolling(ev.id);setEnrollMessage('');
  const doubles=ev.discipline.toLowerCase().includes('dobles');
  const partnerId=doubles?(partner[ev.id]||'').trim():null;
  if(doubles&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId||'')){
   setEnrollError(true);setEnrollMessage('Para dobles necesitas el identificador de usuario RACKETON (UUID) de tu compañero.');setEnrolling(null);return;
  }
  const {error:e}=await supabase.rpc('racketon_register_event_135',{p_event_id:ev.id,p_partner_id:partnerId});
  setEnrolling(null);setEnrollError(!!e);
  setEnrollMessage(e?'No se pudo inscribir: '+e.message:doubles?'Invitación de pareja enviada. Pendiente de confirmación del compañero.':'Inscripción confirmada correctamente.');
  if(!e)await refreshEnrollments();
 };
 const confirmPartner=async(entryId:string,accept:boolean)=>{
  if(!supabase)return;setEnrolling(entryId);
  const {error:e}=await supabase.rpc('racketon_confirm_partner_135',{p_entry_id:entryId,p_accept:accept});
  setEnrolling(null);setEnrollError(!!e);setEnrollMessage(e?'No se pudo responder: '+e.message:accept?'Pareja confirmada.':'Invitación rechazada.');
  if(!e)await refreshEnrollments();
 };
 useEffect(()=>{void refreshEnrollments()},[userId]);
 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase){setError('Supabase no está configurado.');setLoading(false);return;}
   const {data,error:err}=await supabase.from('racketon_competitions')
    .select('id,title,sport,format,city,region,venue_name,starts_on,ends_on,registration_opens_on,registration_closes_on,capacity,level_min,level_max,description,rules_url,status,poster_url,categories,events,category_system')
    .eq('is_published',true).order('starts_on',{ascending:true}).limit(250);
   if(!active)return;
   setLoading(false);
   if(err){setError('No se pudieron consultar las competiciones: '+err.message);return;}
   setItems((data||[]) as RacketonCompetition130[]);
   const {data:eventData,error:eventError}=await supabase.from('racketon_competition_events').select('id,competition_id,category,discipline,capacity,status,starts_on,registration_closes_on,notes,is_active').eq('is_active',true).order('category');
   if(!active)return;
   if(eventError){setError('No se pudieron cargar las pruebas: '+eventError.message);return;}
   setPublicEvents((eventData||[]) as CompetitionEvent133[]);
  }
  void load();return()=>{active=false};
 },[]);
 const today=new Date().toISOString().slice(0,10);
 const phase=(x:RacketonCompetition130)=>{
  if(x.status==='cancelled')return 'Cancelada';
  if(x.ends_on&&x.ends_on<today)return 'Finalizada';
  if(x.starts_on<=today)return 'En curso';
  if(x.registration_closes_on&&x.registration_closes_on<today)return 'Inscripción cerrada';
  if(x.registration_opens_on&&x.registration_opens_on>today)return 'Próximamente';
  return 'Inscripción abierta';
 };
 const filtered=items.filter(x=>(sport==='Todos'||x.sport===sport)
  &&(!region||[x.city,x.region,x.venue_name||''].join(' ').toLocaleLowerCase('es').includes(region.toLocaleLowerCase('es')))
  &&(!query||[x.title,x.sport,x.format,x.description||''].join(' ').toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')))
  &&(status==='Todas'||phase(x)===status)
  &&(categoryFilter==='Todas'||(x.categories||[]).includes(categoryFilter)));
 const date=(x:string|null)=>x?new Date(x+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'Por confirmar';
 return <div className="rkt-comp130">
  <style>{`.rkt-comp130{max-width:1120px;display:grid;gap:19px}.rkt-comp130 *{box-sizing:border-box}.rkt-comp130-hero{background:linear-gradient(115deg,#171b29,#4b1427 72%,#bd1539);color:white;padding:30px;border-radius:20px}.rkt-comp130-hero small{color:#ffb5c4;font-weight:900;letter-spacing:1.6px}.rkt-comp130-hero h2{font-size:clamp(24px,3vw,35px);margin:10px 0}.rkt-comp130-hero p{max-width:630px;color:#e8dce2;font-size:14px;line-height:1.6}.rkt-comp130-filter{background:#fff;border:1px solid #e8eaf0;padding:18px;border-radius:16px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.rkt-comp130-filter label{display:grid;gap:7px;font-size:11px;font-weight:850;color:#667085}.rkt-comp130-filter input,.rkt-comp130-filter select{width:100%;padding:12px;border-radius:9px;border:1px solid #dfe3e9;background:white;color:#1b2636;font-size:13px}.rkt-comp130-count{font-size:13px;color:#667085}.rkt-comp130-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.rkt-comp130-card{background:white;border:1px solid #e7eaf0;border-radius:16px;padding:20px;display:grid;gap:12px}.rkt-comp130-card h3{margin:0;font-size:19px;color:#182032}.rkt-comp130-card p{margin:0;font-size:13px;color:#697487}.rkt-comp130-top{display:flex;align-items:center;justify-content:space-between;gap:9px}.rkt-comp130-tag{border-radius:100px;background:#fff0f3;color:#b81235;padding:7px 11px;font-size:11px;font-weight:850}.rkt-comp130-status{font-size:11px;font-weight:850;color:#667085}.rkt-comp130-details{display:grid;gap:9px;font-size:12px;color:#475467}.rkt-comp130-card button,.rkt-comp130-back{border:0;background:#c8102e;color:white;border-radius:10px;padding:12px 16px;cursor:pointer;font-weight:850;text-align:center}.rkt-comp130-empty{background:white;border:1px dashed #d7dce5;border-radius:16px;padding:40px 20px;text-align:center;color:#667085;line-height:1.6}.rkt-comp130-info{background:#fff7ed;border:1px solid #fed7aa;color:#92400e;padding:13px;border-radius:10px;font-size:12px}.rkt-comp130-detail{background:white;border:1px solid #e8eaf0;padding:24px;border-radius:18px;display:grid;gap:16px}.rkt-comp130-detail h2{margin:0}.rkt-comp130-detail p{line-height:1.7;color:#536075;white-space:pre-wrap}.rkt-comp130-detail dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rkt-comp130-detail dl div{padding:12px;background:#f8fafc;border-radius:10px}.rkt-comp130-detail dt{font-size:11px;color:#667085}.rkt-comp130-detail dd{margin:5px 0 0;font-weight:800;font-size:13px}.rkt-comp130-detail a{color:#c8102e;font-weight:800;overflow-wrap:anywhere}.rkt135-entry{display:grid;gap:16px}.rkt135-entry h3{margin:6px 0 0}.rkt135-tabs{display:flex;flex-wrap:wrap;gap:8px}.rkt135-tabs button{border:1px solid #e5e7eb;background:#fff;border-radius:100px;padding:9px 13px;color:#475569;font-weight:800;cursor:pointer}.rkt135-tabs button.active{background:#c8102e;color:white;border-color:#c8102e}.rkt135-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rkt135-card{border:1px solid #e5e7eb;border-radius:14px;padding:17px;display:grid;gap:10px;background:#fff}.rkt135-card-top{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:11px;font-weight:800}.rkt135-card h4{margin:0;font-size:16px}.rkt135-card p{margin:0;color:#64748b;font-size:12px}.rkt135-card small{color:#64748b}.rkt135-card button,.rkt135-invite button{border:0;background:#c8102e;color:white;padding:12px;border-radius:9px;font-weight:850;cursor:pointer}.rkt135-card button:disabled{background:#e5e7eb;color:#667085;cursor:not-allowed}.rkt135-open{color:#166534}.rkt135-closed{color:#9f1239}.rkt135-partner{font-size:12px;font-weight:800;color:#475569;display:grid;gap:5px}.rkt135-partner input{border:1px solid #dbe1e9;border-radius:8px;padding:10px;width:100%;min-width:0}.rkt135-confirmed{background:#f0fdf4;color:#166534;padding:10px;border-radius:9px;font-weight:800;font-size:12px}.rkt135-feedback,.rkt135-invite{padding:13px;border-radius:10px;background:#f8fafc}.rkt135-invite{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.rkt135-invite span{font-size:12px}.rkt135-invite button{padding:9px}.rkt135-invite button:last-child{background:#64748b}@media(max-width:700px){.rkt135-grid{grid-template-columns:1fr}}@media(max-width:760px){.rkt-comp130-filter{grid-template-columns:repeat(2,minmax(0,1fr))}.rkt-comp130-grid{grid-template-columns:1fr}.rkt-comp130-detail dl{grid-template-columns:1fr}}@media(max-width:420px){.rkt-comp130-filter{grid-template-columns:1fr}}`}</style>
  <header className="rkt-comp130-hero"><small>RACKETON · COMPETIR</small><h2>Explora competiciones</h2><p>Encuentra torneos y ligas publicados por los organizadores. Filtra por deporte, ubicación y periodo de inscripción.</p></header>
  {selected?<div className="rkt-comp130-detail"><button className="rkt-comp130-back" type="button" onClick={()=>setSelected(null)}>← Volver a competiciones</button><span className="rkt-comp130-tag">{selected.sport} · {selected.format}</span>{selected.poster_url&&<img src={selected.poster_url} alt={"Cartel de "+selected.title} style={{width:"100%",maxHeight:480,objectFit:"contain",borderRadius:14,background:"#f8fafc"}}/>}<h2>{selected.title}</h2><p>{selected.description||'El organizador todavía no ha añadido una descripción.'}</p><dl><div><dt>Ubicación</dt><dd>{selected.venue_name||selected.city} · {selected.city}, {selected.region}</dd></div><div><dt>Fechas</dt><dd>{date(selected.starts_on)}{selected.ends_on?' – '+date(selected.ends_on):''}</dd></div><div><dt>Inscripciones</dt><dd>{phase(selected)} · cierre {date(selected.registration_closes_on)}</dd></div><div><dt>Nivel</dt><dd>{selected.level_min||'Sin especificar'}{selected.level_max?' – '+selected.level_max:''}</dd></div></dl>{selected.rules_url&&/^https:\/\//i.test(selected.rules_url)&&<a href={selected.rules_url} target="_blank" rel="noopener noreferrer">Consultar reglamento del organizador ↗</a>}<div className="rkt135-entry"><h3>Elige tu categoría y prueba</h3><div className="rkt135-tabs">{Array.from(new Set(publicEvents.filter(ev=>ev.competition_id===selected.id).map(ev=>ev.category))).map(cat=><button key={cat} type="button" className={categoryFilter===cat?'active':''} onClick={()=>setCategoryFilter(cat)}>{cat}</button>)}<button type="button" className={categoryFilter==='Todas'?'active':''} onClick={()=>setCategoryFilter('Todas')}>Todas</button></div><div className="rkt135-grid">{publicEvents.filter(ev=>ev.competition_id===selected.id&&(categoryFilter==='Todas'||categoryFilter===ev.category)).map(ev=>{const mine=registrations.find(r=>r.event_id===ev.id&&r.status!=='cancelled');const doubles=ev.discipline.toLowerCase().includes('dobles');const used=counts[ev.id]||0;const full=ev.capacity!==null&&used>=ev.capacity;const open=ev.status==='registration_open'&&selected.status!=='cancelled'&&(!selected.registration_opens_on||selected.registration_opens_on<=today)&&(!ev.registration_closes_on||ev.registration_closes_on>=today)&&(!selected.registration_closes_on||selected.registration_closes_on>=today)&&(!selected.ends_on||selected.ends_on>=today);return <article key={ev.id} className="rkt135-card"><div className="rkt135-card-top"><span>{doubles?'👥':'🎾'} {ev.category}</span><span className={open?'rkt135-open':'rkt135-closed'}>{open?'Inscripción abierta':eventStatuses133.find(([v])=>v===ev.status)?.[1]||'Cerrada'}</span></div><h4>{ev.discipline}</h4><p>{ev.capacity===null?'Plazas por confirmar':`${Math.max(0,ev.capacity-used)} de ${ev.capacity} ${doubles?'parejas':'jugadores'} disponibles`}</p>{ev.starts_on&&<small>📅 {date(ev.starts_on)}</small>}{ev.registration_closes_on&&<small>Cierre: {date(ev.registration_closes_on)}</small>}{ev.notes&&<small>{ev.notes}</small>}{mine?<div className="rkt135-confirmed">{mine.status==='pending_partner'?'⏳ Pendiente de confirmar pareja':'✓ '+(mine.status==='confirmed'?'Inscripción confirmada':mine.status)}</div>:<>{doubles&&open&&!full&&<label className="rkt135-partner">ID RACKETON del compañero<input value={partner[ev.id]||''} onChange={e=>setPartner(v=>({...v,[ev.id]:e.target.value}))} placeholder="UUID del compañero"/></label>}<button type="button" disabled={!open||full||!!enrolling} onClick={()=>void enroll(ev)}>{enrolling===ev.id?'Inscribiendo…':full?'Plazas agotadas':open?'Inscribirme':'No disponible'}</button></>}</article>})}</div>{publicEvents.filter(ev=>ev.competition_id===selected.id).length===0&&<p>No hay pruebas activas publicadas.</p>}{enrollMessage&&<div role="status" className="rkt135-feedback" style={{color:enrollError?'#9f1239':'#166534'}}>{enrollMessage}</div>}{registrations.filter(r=>r.status==='pending_partner'&&r.partner_id===userId&&publicEvents.some(ev=>ev.id===r.event_id&&ev.competition_id===selected.id)).map(r=><div className="rkt135-invite" key={r.id}><strong>Invitación de dobles pendiente</strong><span>Te han propuesto formar pareja en esta competición.</span><button type="button" disabled={!!enrolling} onClick={()=>void confirmPartner(r.id,true)}>Confirmar pareja</button><button type="button" disabled={!!enrolling} onClick={()=>void confirmPartner(r.id,false)}>Rechazar</button></div>)}</div></div>:<>
  <div className="rkt-comp130-filter"><label>Deporte<select value={sport} onChange={e=>setSport(e.target.value)}>{['Todos','Tenis','Pádel','Pickleball','Squash','Bádminton'].map(x=><option key={x}>{x}</option>)}</select></label><label>Ciudad o región<input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Madrid, Alcalá..."/></label><label>Buscar competición<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre o modalidad"/></label><label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}>{['Todas','Inscripción abierta','Próximamente','Inscripción cerrada','En curso','Finalizada','Cancelada'].map(x=><option key={x}>{x}</option>)}</select></label><label>Categoría<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>Todas</option>{Array.from(new Set(items.flatMap(x=>x.categories||[]))).sort().map(c=><option key={c}>{c}</option>)}</select></label></div>
  <div className="rkt-comp130-count">{loading?'Consultando competiciones…':`${filtered.length} competiciones encontradas`}</div>
  {error?<div className="rkt-comp130-info">{error}. Comprueba que has ejecutado el SQL 0041.</div>:!loading&&filtered.length===0?<div className="rkt-comp130-empty"><strong>No hay competiciones publicadas con estos filtros.</strong><div>Cuando los clubes publiquen torneos, aparecerán aquí. No mostramos competiciones ficticias.</div></div>:<div className="rkt-comp130-grid">{filtered.map(x=><article className="rkt-comp130-card" key={x.id}><div className="rkt-comp130-top"><span className="rkt-comp130-tag">{x.sport} · {x.format}</span><span className="rkt-comp130-status">{phase(x)}</span></div><h3>{x.title}</h3>{x.poster_url&&<img src={x.poster_url} alt={"Cartel de "+x.title} loading="lazy" style={{width:"100%",height:190,objectFit:"cover",borderRadius:11}}/>}<p>{x.city} · {x.region}</p><div className="rkt-comp130-details"><span>📅 {date(x.starts_on)}{x.ends_on?' – '+date(x.ends_on):''}</span><span>📍 {x.venue_name||'Sede por confirmar'}</span><span>🎯 {(x.categories||[]).join(", ")||"Categorías por definir"}</span><span>🏆 {(x.events||[]).join(", ")||"Pruebas por definir"}</span></div><button type="button" onClick={()=>setSelected(x)}>Ver competición</button></article>)}</div>}
  </>}
 </div>;
}


type ClubCompetitionForm131={
 title:string;sport:string;format:string;city:string;region:string;venue_name:string;
 starts_on:string;ends_on:string;registration_opens_on:string;registration_closes_on:string;
 capacity:string;level_min:string;level_max:string;description:string;rules_url:string;
 poster_url:string;category_system:string;categories:string[];events:string[];
};
const emptyCompetition131:ClubCompetitionForm131={
 title:'',sport:'Tenis',format:'Individual',city:'',region:'',venue_name:'',
 starts_on:'',ends_on:'',registration_opens_on:'',registration_closes_on:'',
 capacity:'',level_min:'',level_max:'',description:'',rules_url:'',
 poster_url:'',category_system:'Edad',categories:[],events:[]
};

type CompetitionEvent133={is_active:boolean;id:string;competition_id:string;category:string;discipline:string;capacity:number|null;status:string;starts_on:string|null;registration_closes_on:string|null;notes:string|null};
const eventStatuses133=[['draft','Borrador'],['registration_open','Inscripción abierta'],['registration_closed','Inscripción cerrada'],['draw_published','Cuadro publicado'],['in_progress','En juego'],['completed','Finalizada'],['cancelled','Cancelada']];
function CompetitionEventsManager133({competitionId}:{competitionId:string}){
 const [events,setEvents]=useState<CompetitionEvent133[]>([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState<string|null>(null);
 const [showInactive,setShowInactive]=useState(false);
 const [showEntries,setShowEntries]=useState<Record<string,boolean>>({});
 const load=async()=>{
  if(!supabase)return;
  const {data,error:e}=await supabase.from('racketon_competition_events').select('id,competition_id,category,discipline,capacity,status,starts_on,registration_closes_on,notes,is_active').eq('competition_id',competitionId).order('category').order('discipline');
  setLoading(false);if(e){setError(e.message);return;}setEvents((data||[]) as CompetitionEvent133[]);
 };
 useEffect(()=>{void load()},[competitionId]);
 const patch=(id:string,values:Partial<CompetitionEvent133>)=>setEvents(a=>a.map(x=>x.id===id?{...x,...values}:x));
 const save=async(x:CompetitionEvent133)=>{
  if(!supabase)return;setSaving(x.id);setError('');
  const {error:e}=await supabase.from('racketon_competition_events').update({capacity:x.capacity,status:x.status,starts_on:x.starts_on,registration_closes_on:x.registration_closes_on,notes:x.notes}).eq('id',x.id).eq('competition_id',competitionId);
  setSaving(null);if(e)setError(e.message);
 };
 const setActive=async(x:CompetitionEvent133,active:boolean)=>{
  if(!supabase)return;
  if(!active&&!window.confirm('¿Retirar esta prueba? Se conservará en la base de datos y podrás reactivarla.'))return;
  setSaving(x.id);setError('');
  const {error:e}=await supabase.from('racketon_competition_events').update({is_active:active}).eq('id',x.id).eq('competition_id',competitionId);
  setSaving(null);if(e)setError(e.message);else await load();
 };
 const activeEvents=events.filter(x=>x.is_active);
 const shownEvents=events.filter(x=>x.is_active||showInactive);
 return <div style={{display:'grid',gap:10,marginTop:12}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><strong>{activeEvents.length} pruebas activas · {events.length-activeEvents.length} retiradas</strong><button type="button" onClick={()=>setShowInactive(v=>!v)}>{showInactive?'Ocultar retiradas':'Ver retiradas'}</button></div>
 {error&&<p style={{color:'#b91c1c',fontSize:12}}>No se pudieron gestionar las pruebas: {error}. Comprueba el SQL 0044.</p>}
 {loading?<p>Cargando pruebas…</p>:events.length===0?<p style={{fontSize:13,color:'#64748b'}}>No hay pruebas. Edita el torneo y selecciona categorías y modalidades.</p>:shownEvents.map(x=><div key={x.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:14,background:'#f8fafc',display:'grid',gap:10}}>
 <strong style={{fontSize:14}}>{x.category} · {x.discipline} {!x.is_active?'(retirada)':''}</strong>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
 <label style={{fontSize:12}}>Estado<select style={{display:'block',width:'100%',padding:8}} value={x.status} onChange={e=>patch(x.id,{status:e.target.value})}>{eventStatuses133.map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label>
 <label style={{fontSize:12}}>Plazas<input style={{display:'block',width:'100%',padding:8}} type="number" min={1} value={x.capacity??''} onChange={e=>patch(x.id,{capacity:e.target.value?Number(e.target.value):null})}/></label>
 <label style={{fontSize:12}}>Fecha de prueba<input style={{display:'block',width:'100%',padding:8}} type="date" value={x.starts_on||''} onChange={e=>patch(x.id,{starts_on:e.target.value||null})}/></label>
 <label style={{fontSize:12}}>Cierre inscripción<input style={{display:'block',width:'100%',padding:8}} type="date" value={x.registration_closes_on||''} onChange={e=>patch(x.id,{registration_closes_on:e.target.value||null})}/></label>
 </div><label style={{fontSize:12}}>Observaciones<input style={{display:'block',width:'100%',padding:8}} value={x.notes||''} onChange={e=>patch(x.id,{notes:e.target.value})}/></label>
 <div><button type="button" onClick={()=>setShowEntries(v=>({...v,[x.id]:!v[x.id]}))}>{showEntries[x.id]?'Ocultar inscritos':'Ver inscritos'}</button></div>
 {showEntries[x.id]&&<ClubEntries136 eventId={x.id}/>}
 <div><button type="button" onClick={()=>void save(x)} disabled={saving===x.id}>{saving===x.id?'Guardando…':'Guardar esta prueba'}</button> <button type="button" disabled={saving===x.id} onClick={()=>void setActive(x,!x.is_active)}>{x.is_active?'Retirar prueba':'Reactivar prueba'}</button></div>
 </div>)}
 </div>;
}

function ClubCompetitionManager131({userId}:{userId:string}){
 const [form,setForm]=useState<ClubCompetitionForm131>(emptyCompetition131);
 const [editing,setEditing]=useState<string|null>(null);
 const [posterFile,setPosterFile]=useState<File|null>(null);
 const [items,setItems]=useState<Array<RacketonCompetition130&{is_published:boolean}>>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [expandedCompetition,setExpandedCompetition]=useState<string|null>(null);
 const [notice,setNotice]=useState('');
 const [isError,setIsError]=useState(false);
 const set=(k:keyof ClubCompetitionForm131,v:string)=>setForm(f=>({...f,[k]:v}));
 const ageCategories=['Sub-8','Benjamín (Sub-10)','Alevín (Sub-12)','Infantil (Sub-14)','Cadete (Sub-16)','Junior (Sub-18)','Absoluto','Veteranos +30','Veteranos +35','Veteranos +40','Veteranos +45','Veteranos +50','Veteranos +55','Veteranos +60','Veteranos +65','Veteranos +70'];
 const ratingCategories=Array.from({length:20},(_,i)=>'RACKETON '+(i+1));
 const eventOptions=['Individual masculino','Individual femenino','Dobles masculino','Dobles femenino','Dobles mixto'];
 const toggle=(key:'categories'|'events',v:string)=>setForm(f=>({...f,[key]:f[key].includes(v)?f[key].filter(x=>x!==v):[...f[key],v]}));
 const refresh=async()=>{
  if(!supabase)return;
  const {data,error}=await supabase.from('racketon_competitions')
   .select('id,title,sport,format,city,region,venue_name,starts_on,ends_on,registration_opens_on,registration_closes_on,capacity,level_min,level_max,description,rules_url,status,is_published')
   .eq('organizer_id',userId).order('created_at',{ascending:false});
  setLoading(false);
  if(error){setNotice('No se han podido consultar las competiciones: '+error.message);setIsError(true);return;}
  setItems((data||[]) as Array<RacketonCompetition130&{is_published:boolean}>);
 };
 useEffect(()=>{void refresh()},[userId]);
 const edit=(x:RacketonCompetition130)=>{
  setEditing(x.id);setForm({title:x.title,sport:x.sport,format:x.format,city:x.city,region:x.region,
   venue_name:x.venue_name||'',starts_on:x.starts_on,ends_on:x.ends_on||'',
   registration_opens_on:x.registration_opens_on||'',registration_closes_on:x.registration_closes_on||'',
   capacity:x.capacity==null?'':String(x.capacity),level_min:x.level_min||'',level_max:x.level_max||'',
   description:x.description||'',rules_url:x.rules_url||'',poster_url:x.poster_url||'',category_system:x.category_system||'Edad',categories:x.categories||[],events:x.events||[]});setPosterFile(null);
  window.scrollTo({top:0,behavior:'smooth'});
 };
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();if(!supabase||saving)return;
  if(form.ends_on&&form.ends_on<form.starts_on){setNotice('La fecha final debe ser posterior a la inicial.');setIsError(true);return;}
  if(form.registration_opens_on&&form.registration_closes_on&&form.registration_closes_on<form.registration_opens_on){setNotice('Revisa las fechas de inscripción.');setIsError(true);return;}
  if(form.rules_url&&!/^https:\/\//i.test(form.rules_url)){setNotice('El reglamento debe tener una dirección HTTPS válida.');setIsError(true);return;}
  if(!form.categories.length||!form.events.length){setNotice('Selecciona al menos una categoría y una prueba.');setIsError(true);return;}
  setSaving(true);setNotice('');
  let posterUrl=form.poster_url;
  if(posterFile){
   const ext=posterFile.type==='image/png'?'png':posterFile.type==='image/webp'?'webp':'jpg';
   const path=userId+'/'+crypto.randomUUID()+'.'+ext;
   const upload=await supabase.storage.from('competition-posters').upload(path,posterFile,{contentType:posterFile.type,upsert:false});
   if(upload.error){setSaving(false);setNotice('No se pudo subir el cartel: '+upload.error.message);setIsError(true);return;}
   posterUrl=supabase.storage.from('competition-posters').getPublicUrl(path).data.publicUrl;
  }
  const payload={title:form.title.trim(),sport:form.sport,format:form.format,city:form.city.trim(),
   region:form.region.trim(),venue_name:form.venue_name.trim()||null,starts_on:form.starts_on,
   ends_on:form.ends_on||null,registration_opens_on:form.registration_opens_on||null,
   registration_closes_on:form.registration_closes_on||null,
   capacity:form.capacity?Number(form.capacity):null,level_min:form.level_min.trim()||null,
   level_max:form.level_max.trim()||null,description:form.description.trim()||null,
   rules_url:form.rules_url.trim()||null,poster_url:posterUrl||null,category_system:form.category_system,
   categories:form.categories,events:form.events};
  const result=editing
   ?await supabase.from('racketon_competitions').update(payload).eq('id',editing).eq('organizer_id',userId)
   :await supabase.from('racketon_competitions').insert({...payload,organizer_id:userId,is_published:false});
  setSaving(false);
  if(result.error){setNotice('No se pudo guardar: '+result.error.message);setIsError(true);return;}
  setNotice(editing?'Competición actualizada.':'Borrador creado. Publícalo cuando esté listo.');
  setIsError(false);setEditing(null);setForm(emptyCompetition131);setPosterFile(null);await refresh();
 };
 const publish=async(x:RacketonCompetition130&{is_published:boolean})=>{
  if(!supabase)return;
  const next=!x.is_published;
  if(next&&!window.confirm('¿Publicar esta competición para todos los jugadores?'))return;
  const {error}=await supabase.from('racketon_competitions')
   .update({is_published:next}).eq('id',x.id).eq('organizer_id',userId);
  if(error){setNotice('No se pudo cambiar la publicación: '+error.message);setIsError(true);return;}
  setNotice(next?'Competición publicada. Ya aparece en Explorar competiciones.':'Competición retirada del catálogo público.');
  setIsError(false);await refresh();
 };
 return <section className="rkt-club131">
  <style>{`.rkt-club131{max-width:1150px;display:grid;gap:18px}.rkt-club131 *{box-sizing:border-box}.rkt-club131-hero{padding:26px;border-radius:18px;background:linear-gradient(115deg,#171b29,#82142f);color:white}.rkt-club131-hero h2{margin:5px 0 10px;font-size:28px}.rkt-club131-hero p{margin:0;color:#f0dbe1;line-height:1.6}.rkt-club131-panel{background:white;border:1px solid #e5e7eb;border-radius:16px;padding:22px}.rkt-club131-panel h3{margin:0 0 18px}.rkt-club131-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.rkt-club131-grid label{display:grid;gap:6px;color:#526074;font-size:12px;font-weight:800}.rkt-club131-grid input,.rkt-club131-grid select,.rkt-club131-grid textarea{border:1px solid #dce1e8;border-radius:9px;padding:12px;color:#172033;background:white;font-size:14px;min-width:0;width:100%}.rkt-club131-grid textarea{min-height:100px;resize:vertical}.rkt-club131-wide{grid-column:span 3}.rkt-club131-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.rkt-club131 button{border:1px solid #dce1e8;background:white;padding:10px 14px;border-radius:9px;font-weight:800;cursor:pointer}.rkt-club131 button:disabled{opacity:.55;cursor:wait}.rkt-club131 button.rkt-club131-primary{background:#c8102e;color:white;border-color:#c8102e}.rkt-club131-list{display:grid;gap:10px}.rkt-club131-item{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px;border:1px solid #e5e7eb;border-radius:12px;flex-wrap:wrap}.rkt-club131-item strong{display:block;font-size:15px}.rkt-club131-item small{color:#667085;display:block;margin-top:5px}.rkt-club131-note{padding:12px;border-radius:9px;background:#f1f5f9;color:#475569;font-size:13px;line-height:1.5}.rkt-club131-alert{padding:12px;border-radius:9px;background:#f0fdf4;color:#166534}.rkt-club131-alert.error{background:#fff1f2;color:#9f1239}@media(max-width:750px){.rkt-club131-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rkt-club131-wide{grid-column:span 2}}@media(max-width:470px){.rkt-club131-grid{grid-template-columns:1fr}.rkt-club131-wide{grid-column:span 1}}`}</style>
  <header className="rkt-club131-hero"><small>RACKETON · ESPACIO CLUB</small><h2>Gestión de competiciones</h2><p>Crea torneos y ligas, completa sus datos y publícalos en el catálogo de jugadores cuando estén preparados.</p></header>
  <div className="rkt-club131-panel"><h3>{editing?'Editar competición':'Crear nueva competición'}</h3><form onSubmit={save}><div className="rkt-club131-grid">
  <label className="rkt-club131-wide">Nombre de la competición<input required minLength={3} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Nombre oficial"/></label>
  <label>Deporte<select value={form.sport} onChange={e=>set('sport',e.target.value)}>{['Tenis','Pádel','Pickleball','Squash','Bádminton'].map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Modalidad<select value={form.format} onChange={e=>set('format',e.target.value)}>{['Individual','Dobles','Mixto','Equipos','Liga','Round Robin'].map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Plazas máximas<input type="number" min={1} value={form.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="Opcional"/></label>
  <label className="rkt-club131-wide">Cartel del torneo (JPG, PNG o WebP, máximo 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0]||null;if(f&&(f.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){setNotice('El cartel debe ser JPG, PNG o WebP y ocupar como máximo 5 MB.');setIsError(true);e.target.value='';return;}setPosterFile(f);}}/>{(posterFile||form.poster_url)&&<img src={posterFile?URL.createObjectURL(posterFile):form.poster_url} alt="Vista previa del cartel" style={{maxWidth:230,maxHeight:310,objectFit:'contain',borderRadius:12,marginTop:8}}/>}</label>
  <label className="rkt-club131-wide">Sistema de categorías<select value={form.category_system} onChange={e=>setForm(f=>({...f,category_system:e.target.value,categories:[]}))}><option value="Edad">Categorías por edad (tenis)</option><option value="Rating">Niveles RACKETON Rating (tenis 1–20)</option></select></label>
  <div className="rkt-club131-wide"><strong style={{display:'block',marginBottom:9}}>Categorías convocadas · selecciona una o varias</strong><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(form.category_system==='Edad'?ageCategories:ratingCategories).map(c=><label key={c} style={{display:'flex',alignItems:'center',gap:6,border:'1px solid #dce1e8',borderRadius:9,padding:'9px 11px',cursor:'pointer',background:form.categories.includes(c)?'#fff1f2':'white'}}><input type="checkbox" checked={form.categories.includes(c)} onChange={()=>toggle('categories',c)} style={{width:'auto'}}/>{c}</label>)}</div></div>
  <div className="rkt-club131-wide"><strong style={{display:'block',marginBottom:9}}>Pruebas convocadas · selecciona una o varias</strong><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{eventOptions.map(v=><label key={v} style={{display:'flex',alignItems:'center',gap:6,border:'1px solid #dce1e8',borderRadius:9,padding:'9px 11px',cursor:'pointer',background:form.events.includes(v)?'#fff1f2':'white'}}><input type="checkbox" checked={form.events.includes(v)} onChange={()=>toggle('events',v)} style={{width:'auto'}}/>{v}</label>)}</div></div>
  <label>Ciudad<input required value={form.city} onChange={e=>set('city',e.target.value)}/></label>
  <label>Provincia o comunidad<input required value={form.region} onChange={e=>set('region',e.target.value)}/></label>
  <label>Sede<input value={form.venue_name} onChange={e=>set('venue_name',e.target.value)}/></label>
  <label>Fecha de inicio<input required type="date" value={form.starts_on} onChange={e=>set('starts_on',e.target.value)}/></label>
  <label>Fecha de finalización<input type="date" value={form.ends_on} onChange={e=>set('ends_on',e.target.value)}/></label>
  <label>Inicio de inscripción<input type="date" value={form.registration_opens_on} onChange={e=>set('registration_opens_on',e.target.value)}/></label>
  <label>Cierre de inscripción<input type="date" value={form.registration_closes_on} onChange={e=>set('registration_closes_on',e.target.value)}/></label>
  <label>Nivel mínimo<input value={form.level_min} onChange={e=>set('level_min',e.target.value)} placeholder="Opcional"/></label>
  <label>Nivel máximo<input value={form.level_max} onChange={e=>set('level_max',e.target.value)} placeholder="Opcional"/></label>
  <label className="rkt-club131-wide">Descripción y condiciones<textarea value={form.description} onChange={e=>set('description',e.target.value)}/></label>
  <label className="rkt-club131-wide">Enlace HTTPS al reglamento<input type="url" value={form.rules_url} onChange={e=>set('rules_url',e.target.value)} placeholder="https://..."/></label>
  </div><div className="rkt-club131-actions"><button className="rkt-club131-primary" type="submit" disabled={saving}>{saving?'Guardando…':editing?'Guardar cambios':'Guardar borrador'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(emptyCompetition131);setPosterFile(null)}}>Cancelar edición</button>}</div></form></div>
  {notice&&<div role="status" className={'rkt-club131-alert'+(isError?' error':'')}>{notice}</div>}
  <div className="rkt-club131-panel"><h3>Mis competiciones</h3><div className="rkt-club131-note">Solo puedes editar las competiciones creadas con tu cuenta autorizada de club. Publicar las hará visibles para todos los jugadores. Las inscripciones se gestionan desde cada prueba.</div><div className="rkt-club131-list" style={{marginTop:14}}>{loading?'Cargando competiciones…':items.length===0?'Todavía no has creado competiciones.':items.map(x=><div className="rkt-club131-item" key={x.id}><div><strong>{x.title}</strong><small>{x.sport} · {x.city} · {x.starts_on} · {x.is_published?'🟢 Publicada':'⚪ Borrador'}</small></div><div className="rkt-club131-actions"><button type="button" onClick={()=>setExpandedCompetition(v=>v===x.id?null:x.id)}>{expandedCompetition===x.id?"Ocultar pruebas":"Gestionar pruebas"}</button><button type="button" onClick={()=>edit(x)}>Editar</button><button type="button" className={x.is_published?'':'rkt-club131-primary'} onClick={()=>void publish(x)}>{x.is_published?'Retirar':'Publicar'}</button></div>{expandedCompetition===x.id&&<div style={{flexBasis:"100%",width:"100%"}}><CompetitionEventsManager133 competitionId={x.id}/></div>}</div>)}</div></div>
 </section>;
}


type EventEntry136={id:string;event_id:string;player_id:string;partner_id:string|null;status:string;created_at:string};
function PlayerCompetitions136({userId}:{userId:string}){
 const [entries,setEntries]=useState<EventEntry136[]>([]);
 const [events,setEvents]=useState<CompetitionEvent133[]>([]);
 const [comps,setComps]=useState<RacketonCompetition130[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState<string|null>(null);
 const load=async()=>{
  if(!supabase)return;
  const {data,error:e}=await supabase.from('racketon_event_entries')
   .select('id,event_id,player_id,partner_id,status,created_at')
   .or(`player_id.eq.${userId},partner_id.eq.${userId}`)
   .order('created_at',{ascending:false});
  if(e){setError(e.message);setLoading(false);return;}
  const mine=(data||[]) as EventEntry136[];
  setEntries(mine);
  const ids=Array.from(new Set(mine.map(x=>x.event_id)));
  if(!ids.length){setEvents([]);setComps([]);setLoading(false);return;}
  const {data:ev,error:evErr}=await supabase.from('racketon_competition_events')
   .select('id,competition_id,category,discipline,capacity,status,starts_on,registration_closes_on,notes,is_active').in('id',ids);
  if(evErr){setError(evErr.message);setLoading(false);return;}
  const found=(ev||[]) as CompetitionEvent133[];
  setEvents(found);
  const compIds=Array.from(new Set(found.map(x=>x.competition_id)));
  if(compIds.length){
   const {data:cs,error:ce}=await supabase.from('racketon_competitions')
    .select('id,title,sport,format,city,region,venue_name,starts_on,ends_on,registration_opens_on,registration_closes_on,capacity,level_min,level_max,description,rules_url,status')
    .in('id',compIds);
   if(ce)setError(ce.message);else setComps((cs||[]) as RacketonCompetition130[]);
  }
  setLoading(false);
 };
 useEffect(()=>{void load()},[userId]);
 const cancel=async(x:EventEntry136)=>{
  if(!supabase||!window.confirm('¿Cancelar tu inscripción? La plaza quedará libre.'))return;
  setBusy(x.id);setError('');
  const {error:e}=await supabase.rpc('racketon_cancel_entry_136',{p_entry_id:x.id});
  setBusy(null);
  if(e){setError(e.message);return;}await load();
 };
 const reply=async(x:EventEntry136,accept:boolean)=>{
  if(!supabase)return;
  setBusy(x.id);setError('');
  const {error:e}=await supabase.rpc('racketon_confirm_partner_135',{p_entry_id:x.id,p_accept:accept});
  setBusy(null);if(e){setError(e.message);return;}await load();
 };
 return <div className="rkt136">
 <style>{`.rkt136{display:grid;gap:15px}.rkt136-hero{background:linear-gradient(110deg,#172033,#8d1233);border-radius:17px;color:white;padding:25px}.rkt136-hero h2{margin:0 0 7px;font-size:25px}.rkt136-hero p{margin:0;color:#f5dbe2;font-size:13px}.rkt136-stats{display:flex;gap:12px;flex-wrap:wrap}.rkt136-stat{background:white;border:1px solid #e4e7ec;border-radius:12px;padding:14px 18px;flex:1;min-width:125px}.rkt136-stat strong{display:block;font-size:24px;color:#c8102e}.rkt136-stat span{font-size:12px;color:#667085}.rkt136-list{display:grid;gap:12px}.rkt136-item{background:white;border:1px solid #e4e7ec;border-radius:14px;padding:18px;display:grid;gap:10px}.rkt136-item h3{margin:0;font-size:18px}.rkt136-item small{color:#667085}.rkt136-pill{background:#f3f4f6;color:#475467;border-radius:100px;padding:6px 10px;font-size:11px;font-weight:800;display:inline-block}.rkt136-item button{border:1px solid #d7dce5;border-radius:9px;background:white;padding:9px 12px;font-weight:800;cursor:pointer}.rkt136-item button.primary{background:#c8102e;border-color:#c8102e;color:white}.rkt136-actions{display:flex;gap:8px;flex-wrap:wrap}.rkt136-error{background:#fff1f2;color:#9f1239;padding:13px;border-radius:10px}`}</style>
 <header className="rkt136-hero"><h2>Mis competiciones</h2><p>Todas tus inscripciones, pruebas y solicitudes de pareja, en un mismo lugar.</p></header>
 <div className="rkt136-stats"><div className="rkt136-stat"><strong>{entries.filter(x=>x.status==='confirmed').length}</strong><span>Inscripciones confirmadas</span></div><div className="rkt136-stat"><strong>{entries.filter(x=>x.status==='pending_partner').length}</strong><span>Parejas pendientes</span></div><div className="rkt136-stat"><strong>{entries.filter(x=>x.status==='cancelled').length}</strong><span>Canceladas</span></div></div>
 {error&&<div className="rkt136-error">{error}</div>}
 {loading?<p>Cargando inscripciones…</p>:entries.length===0?<div className="rkt136-item">Todavía no tienes inscripciones. Explora competiciones para participar en una prueba.</div>:<div className="rkt136-list">{entries.map(x=>{
 const ev=events.find(v=>v.id===x.event_id);const c=comps.find(v=>v.id===ev?.competition_id);
 const partnerInvite=x.partner_id===userId&&x.status==='pending_partner';
 return <article className="rkt136-item" key={x.id}><div><span className="rkt136-pill">{x.status==='confirmed'?'✓ Confirmada':x.status==='pending_partner'?'⏳ Pendiente de pareja':'Cancelada'}</span></div><h3>{c?.title||'Competición'}</h3><strong>{ev?`${ev.category} · ${ev.discipline}`:'Prueba'}</strong><small>{c?.city||''} · {ev?.starts_on||c?.starts_on||'Fecha pendiente'}</small><small>{x.partner_id?'Modalidad de dobles':'Modalidad individual'}</small><div className="rkt136-actions">{partnerInvite&&<><button className="primary" disabled={busy===x.id} onClick={()=>void reply(x,true)}>Aceptar pareja</button><button disabled={busy===x.id} onClick={()=>void reply(x,false)}>Rechazar</button></>}{x.status!=='cancelled'&&x.player_id===userId&&<button disabled={busy===x.id} onClick={()=>void cancel(x)}>Cancelar inscripción</button>}</div></article>})}</div>}
 </div>;
}
function ClubEntries136({eventId}:{eventId:string}){
 const [entries,setEntries]=useState<EventEntry136[]>([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const load=async()=>{
  if(!supabase)return;
  const {data,error:e}=await supabase.rpc('racketon_organizer_entries_136',{p_event_id:eventId});
  setLoading(false);if(e){setError(e.message);return;}
  setEntries((data||[]) as EventEntry136[]);
 };
 useEffect(()=>{void load()},[eventId]);
 const cancel=async(x:EventEntry136)=>{
  if(!supabase||!window.confirm('¿Dar de baja esta inscripción?'))return;
  setBusy(x.id);
  const {error:e}=await supabase.rpc('racketon_organizer_cancel_entry_136',{p_entry_id:x.id});
  setBusy(null);if(e){setError(e.message);return;}await load();
 };
 return <div style={{background:'#fff',border:'1px solid #e4e7ec',padding:14,borderRadius:12,display:'grid',gap:10}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><strong>Inscripciones · {entries.filter(x=>x.status!=='cancelled').length} activas</strong><button type="button" onClick={()=>void load()}>Actualizar</button></div>
  {error&&<p style={{color:'#b91c1c'}}>No se pudieron consultar los inscritos: {error}</p>}
  {loading?<span>Cargando participantes…</span>:entries.length===0?<span style={{fontSize:12,color:'#667085'}}>Todavía no hay inscritos.</span>:entries.map(x=><div key={x.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,borderTop:'1px solid #e4e7ec',paddingTop:9,flexWrap:'wrap'}}>
  <div><strong style={{fontSize:12}}>Jugador {x.player_id.slice(0,8)}{x.partner_id?' + pareja '+x.partner_id.slice(0,8):''}</strong><div style={{fontSize:11,color:'#667085'}}>{x.status==='confirmed'?'Confirmada':x.status==='pending_partner'?'Pendiente de pareja':'Cancelada'} · {new Date(x.created_at).toLocaleDateString('es-ES')}</div></div>
  {x.status!=='cancelled'&&<button type="button" disabled={busy===x.id} onClick={()=>void cancel(x)}>Dar de baja</button>}
  </div>)}
  <small style={{color:'#667085'}}>La identificación por nombre y el rating se incorporarán cuando conectemos el directorio público de jugadores con controles de privacidad.</small>
 </div>;
}

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


  .rkt-notices{max-width:1050px}.rkt-notices-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;background:linear-gradient(120deg,#161c2c,#421525 75%,#b70e31);border-radius:20px;color:#fff;padding:30px;margin-bottom:19px}.rkt-notices-hero span{font-size:11px;letter-spacing:1.5px;font-weight:850;color:#ffbdc9}.rkt-notices-hero h2{font-size:clamp(23px,3vw,32px);margin:9px 0;letter-spacing:-.7px}.rkt-notices-hero p{color:#f1dce1;font-size:13px;max-width:580px;line-height:1.6;margin:0}.rkt-notices-counter{background:#ffffff20;border:1px solid #ffffff30;min-width:105px;border-radius:16px;padding:14px;text-align:center;display:flex;flex-direction:column}.rkt-notices-counter strong{font-size:35px}.rkt-notices-counter small{font-size:11px}.rkt-notices-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:15px 0}.rkt-notices-toolbar>div{display:flex;gap:7px;flex-wrap:wrap}.rkt-notices-toolbar button{background:#fff;border:1px solid #e3e7ee;border-radius:30px;padding:9px 14px;color:#667085;font-size:12px;font-weight:800;cursor:pointer}.rkt-notices-toolbar button.active{background:#c8102e;border-color:#c8102e;color:#fff}.rkt-notices-toolbar>span{font-size:12px;color:#667085}.rkt-notices-list{display:grid;gap:12px}.rkt-notice{display:flex;gap:17px;padding:21px;background:#fff;border:1px solid #e8eaf0;border-radius:16px}.rkt-notice.unread{border-color:#e7a2b1;box-shadow:0 5px 22px #c8102e0b}.rkt-notice-icon{display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;border-radius:13px;background:#fff0f3;color:#c8102e}.rkt-notice-icon.training{background:#edf5ff;color:#2365b2}.rkt-notice-main{flex:1;min-width:0}.rkt-notice-tags{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rkt-notice-tags span{font-size:10px;letter-spacing:.6px;font-weight:850;color:#7b8595}.rkt-notice-tags em,.rkt-notice-tags b{font-size:10px;font-style:normal;border-radius:20px;padding:4px 7px;background:#fff2df;color:#9b4c0b}.rkt-notice-tags b{background:#fff0f3;color:#bc1034}.rkt-notice h3{font-size:16px;color:#1e293b;margin:9px 0 5px}.rkt-notice p{font-size:13px;color:#667085;margin:0 0 8px;line-height:1.5}.rkt-notice small{font-size:11px;color:#8993a3}.rkt-notice-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.rkt-notice-actions button{border:0;background:#c8102e;color:#fff;border-radius:9px;padding:10px 13px;display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:12px;cursor:pointer}.rkt-notice-actions button.secondary{background:#f3f5f8;color:#475467}.rkt-notice-actions button:disabled{opacity:.6;cursor:wait}.rkt-notices-empty{display:flex;align-items:center;flex-direction:column;gap:7px;background:#fff;border:1px dashed #dce1e9;border-radius:17px;padding:50px 20px;text-align:center;color:#8791a0}.rkt-notices-empty h3{margin:8px 0 0;color:#344054}.rkt-notices-empty p{margin:0;font-size:13px}.rkt-notices-error{color:#b42332;background:#fff0f3;border:1px solid #f1c4ca;padding:12px;border-radius:10px;font-size:12px}.rkt-notices-footnote{font-size:11px;color:#8b95a5;line-height:1.5;margin-top:18px}@media(max-width:580px){.rkt-notices-hero{padding:22px 18px;gap:10px}.rkt-notices-counter{min-width:65px;padding:10px}.rkt-notices-counter strong{font-size:25px}.rkt-notice{padding:15px;gap:10px}.rkt-notice-icon{width:36px;height:36px}}
  .rkt-personal-section{max-width:980px}.rkt-personal-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.rkt-personal-tabs button{display:flex;align-items:center;gap:9px;border:1px solid #e4e7ed;background:white;border-radius:11px;padding:12px 15px;font-size:13px;font-weight:750;color:#536075;cursor:pointer}.rkt-personal-tabs button.active{background:#fff0f3;border-color:#e6a4b1;color:#b90d31}.rkt-personal-wrap{display:grid;gap:16px}.rkt-personal-account{display:flex;align-items:center;gap:13px;padding:16px 20px;background:#fff;border:1px solid #e6e9ef;border-radius:15px}.rkt-personal-account-icon{display:grid;place-items:center;background:#fff0f3;color:#c8102e;border-radius:12px;width:43px;height:43px}.rkt-personal-account>div:nth-child(2){display:flex;flex-direction:column;gap:3px;min-width:0}.rkt-personal-account strong{font-size:14px}.rkt-personal-account span{font-size:12px;color:#6b7585;overflow-wrap:anywhere}.rkt-personal-account-state{margin-left:auto;background:#edf9f1;color:#137442!important;padding:6px 10px;border-radius:30px;white-space:nowrap;font-weight:750}.rkt-personal-form{display:grid;gap:16px}.rkt-personal-card{background:#fff;border:1px solid #e6e9ef;border-radius:16px;padding:clamp(18px,2.6vw,28px)}.rkt-personal-card-title{border-bottom:1px solid #eff0f4;padding-bottom:17px;margin-bottom:20px}.rkt-personal-card-title h2{margin:0 0 5px;font-size:19px;letter-spacing:-.45px}.rkt-personal-card-title p{margin:0;color:#778294;font-size:13px}.rkt-personal-photo-row{display:flex;gap:22px;align-items:center;flex-wrap:wrap}.rkt-personal-avatar{width:104px;height:104px;object-fit:cover;border-radius:50%;border:3px solid #f3d9de;flex-shrink:0}.rkt-personal-avatar-empty{display:grid;place-items:center;background:#f3f4f7;color:#9aa4b2}.rkt-personal-photo-info{display:flex;flex-direction:column;gap:9px;flex:1;min-width:200px}.rkt-personal-photo-info strong{font-size:14px}.rkt-personal-photo-info>span{font-size:12px;color:#778294;line-height:1.6}.rkt-personal-actions{display:flex;gap:8px;flex-wrap:wrap}.rkt-personal-upload,.rkt-personal-secondary{border:1px solid #c8102e;background:#c8102e;color:white;border-radius:9px;padding:10px 13px;font-size:12px;font-weight:800;cursor:pointer}.rkt-personal-secondary{background:#fff;border-color:#e0e4ea;color:#475467}.rkt-personal-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.rkt-personal-fields label{display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:800;color:#344054}.rkt-personal-fields input,.rkt-personal-fields select{box-sizing:border-box;width:100%;border:1px solid #dce1e9;border-radius:10px;background:#fff;padding:12px 13px;font:inherit;font-size:14px;font-weight:500;color:#172033;min-height:46px}.rkt-personal-fields input:focus,.rkt-personal-fields select:focus{outline:2px solid #e8a5b2;border-color:#c8102e}.rkt-personal-email{display:flex;flex-direction:column;gap:7px}.rkt-personal-email span{font-size:12px;color:#6b7585}.rkt-personal-email strong{font-size:14px;overflow-wrap:anywhere}.rkt-personal-email small{font-size:12px;color:#8b95a5}.rkt-personal-toggles{display:grid;gap:18px}.rkt-personal-toggles label{display:flex;align-items:flex-start;gap:12px;cursor:pointer}.rkt-personal-toggles input{width:18px;height:18px;accent-color:#c8102e;flex-shrink:0}.rkt-personal-toggles label span{display:flex;flex-direction:column;gap:5px}.rkt-personal-toggles strong{font-size:14px}.rkt-personal-toggles small{font-size:12px;color:#778294;line-height:1.5}.rkt-personal-warning{color:#a43d18;font-size:13px}.rkt-personal-save{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:4px 0 14px}.rkt-personal-save .primary{display:inline-flex;align-items:center;justify-content:center;min-width:170px}.rkt-personal-section .rkt-personal-fields .country-select{max-width:100%}@media(max-width:580px){.rkt-personal-fields{grid-template-columns:1fr}.rkt-personal-tabs button{flex:1 1 42%;justify-content:center}.rkt-personal-account-state{display:none}}
  .rkt-settings-form{display:grid;gap:15px;max-width:580px}.rkt-settings-form>label:not(.rkt-settings-checkbox){display:grid;gap:7px;color:#344054;font-size:12px;font-weight:800}.rkt-settings-form input:not([type=checkbox]){width:100%;box-sizing:border-box;border:1px solid #dce1e9;border-radius:10px;padding:12px 13px;font-size:14px;color:#172033;background:#fff;min-height:46px}.rkt-settings-form input[readonly]{background:#f5f6f9;color:#667085}.rkt-settings-form .primary,.rkt-settings-footer .primary{justify-self:start;width:fit-content;min-height:42px}.rkt-settings-checkbox{display:flex;align-items:center;gap:9px;font-size:12px;color:#475467}.rkt-settings-checkbox input{accent-color:#c8102e}.rkt-settings-help{font-size:12px;line-height:1.5;color:#778294;margin:0}.rkt-settings-footer{margin-top:20px}.rkt-settings-notice{border:1px solid #b6e4c5;border-radius:11px;background:#f0fbf3;color:#137442;padding:13px 16px;font-size:13px;font-weight:700}.rkt-settings-notice.error{border-color:#f1c4ca;background:#fff2f4;color:#b42332}
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
  area==='Competir'&&sub==='Mis competiciones'?<PlayerCompetitions136 userId={user.id}/>:
  area==='Competir'&&sub==='Explorar competiciones'?<CompetitionExplorer130 userId={user.id}/>:
  area==='Competir'&&sub==='Desafíos'?<><div style={navCard}><h2>Buscar rivales y organizar partidos libres</h2><p>Los desafíos son partidos individuales o de dobles fuera de las competiciones organizadas.</p><PlayerSearch userId={user.id} onChallenge={p=>{onChallenge(p);go('Competir','Desafíos')}}/></div><div style={navCard}><h2>Desafíos individuales</h2><TennisChallenges userId={user.id} opponent={opponent} onClose={onClearOpponent}/></div><div style={navCard}><h2>Resultados y confirmaciones</h2><TennisResults userId={user.id}/></div><div style={navCard}><h2>Desafíos de dobles</h2><RacketonDoubles107 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Clasificaciones RACKETON'?<RacketonNationalRanking108 userId={user.id} onChallenge={(p:{id:string;name:string})=>{onChallenge(p);go('Competir','Desafíos')}}/>:
  area==='Clasificaciones'&&sub==='Mis ligas'?<><PlayerLeagues userId={user.id}/><div style={navCard}><h2>Rankings y ligas de club</h2><PlayerEnrollments084 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Mi rating'?<><div style={navCard}><h2>Mi rating y perfil competitivo</h2><TennisCompetitiveProfile userId={user.id}/></div><div style={navCard}><h2>Simulador de rating · Tenis</h2><TennisRatingSimulation1091 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Historial'?<div style={navCard}><h2>Historial y evolución del rating · Tenis</h2><TennisRatingHistory userId={user.id}/><p style={{fontSize:13,color:'#64748b'}}>Las estadísticas históricas de pádel y pickleball se incorporarán cuando haya resultados competitivos disponibles.</p></div>:
  area==='Inicio'&&sub==='Mi agenda'?<PlayerAgenda121 userId={user.id}/>: 
  area==='Inicio'&&sub==='Avisos'?<PlayerNotices128 userId={user.id} onNavigate={go}/>: 
  area==='Inicio'&&sub==='Mis datos'?<div className="rkt-personal-section">
    <div className="rkt-personal-tabs">{([{name:'Datos personales',icon:UserRound},{name:'Privacidad',icon:ShieldCheck},{name:'Configuración',icon:UserPen},{name:'Mi monedero',icon:Wallet}] as {name:string;icon:LucideIcon}[]).map(item=>{const I=item.icon;return <button key={item.name} className={dataTab===item.name?'active':''} type="button" onClick={()=>setDataTab(item.name)}><I size={17}/>{item.name}</button>})}</div>
    {dataTab==='Datos personales'?<PlayerProfile user={user} mode="personal"/>:dataTab==='Privacidad'?<PlayerProfile user={user} mode="privacy"/>:dataTab==='Configuración'?<PlayerAccountSettings119 user={user}/>:dataTab==='Mi monedero'?<PlayerWallet120/>:<PendingPlayerModule title={dataTab} description={planned[dataTab]||'Esta sección se desarrollará próximamente.'}/>}
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
 <main>{mode==='player'&&user?<PlayerNavigation112 user={user} opponent={challengeOpponent} onClearOpponent={()=>setChallengeOpponent(null)} onChallenge={p=>setChallengeOpponent(p)}/>:mode==='choose'?<section className="content interior" style={{maxWidth:1180,margin:'30px auto 70px'}}><span className="eyebrow red">RACKETON · ACCESO POR PERFIL</span><h1 style={{fontSize:'clamp(30px,5vw,48px)',margin:'12px 0'}}>¿Cómo quieres entrar?</h1><p style={{color:'#64748b',marginBottom:28}}>Cada perfil tiene su propio espacio de trabajo y menú. Selecciona tu función para continuar.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:18}}>{roleCards.map(r=><button key={r.id} type="button" onClick={()=>{if(r.id==='player'){if(user){chooseMode('player')}else{openAccess('login')}}else if(r.id==='club'){if(!user){openAccess('login')}else if(!accessChecked){setNotice('Comprobando autorización del club. Inténtalo de nuevo en unos segundos.')}else if(clubAccess){chooseMode('club')}else{setNotice('Esta cuenta no tiene acceso autorizado a un club. Solicita autorización desde el área Clubes como jugador.')}}else{setNotice('El espacio de '+r.title.toLowerCase()+' estará disponible en una próxima fase.')}}} style={{textAlign:'left',padding:24,border:'1px solid #e3e5e9',borderRadius:18,background:'#fff',cursor:'pointer',minHeight:205,display:'flex',flexDirection:'column',gap:13,boxShadow:'0 5px 24px #0f172a0a'}}><span style={{fontSize:38}}>{r.icon}</span><strong style={{fontSize:23,color:'#172033'}}>{r.title}</strong><span style={{fontSize:14,color:'#64748b',lineHeight:1.5}}>{r.subtitle}</span><span style={{marginTop:'auto',color:'#c8102e',fontSize:13,fontWeight:800}}>{r.id==='player'||r.id==='club'?'Acceder →':'Próximamente'}</span></button>)}</div>{notice&&<p role="status" style={{padding:14,background:'#fff1f2',borderRadius:10,color:'#9f1239',marginTop:20}}>{notice}</p>}</section>:tab==='Inicio'?<><section className="hero"><div className="hero-copy"><span className="eyebrow">TU COMUNIDAD DE DEPORTES DE RAQUETA</span><h1>Juega.<br/>Compite.<br/><em>Evoluciona.</em></h1><p>Encuentra rivales, mejora tu nivel, participa en torneos y reserva pistas. Todo en una sola plataforma.</p><div className="hero-actions"><button className="primary" onClick={()=>user?navigate('Perfil'):setAuthOpen(true)}>{user?'Mi perfil':'Únete a RACKETON'} <ArrowRight size={18}/></button><button className="outline light" onClick={()=>navigate('Torneos')}>Explorar torneos</button></div></div><div className="hero-art"><div className="court"><span className="court-net"/><span className="ball"/></div><div className="hero-card"><span>RACKETON</span><strong>Tu próximo partido empieza aquí</strong><small>TENIS · PÁDEL · PICKLEBALL · SQUASH</small></div></div></section><section className="content"><div className="section-head"><div><span className="eyebrow red">TODO EN UNA PLATAFORMA</span><h2>El deporte de raqueta, conectado.</h2></div></div><div className="features">{[{icon:Users,title:'Encuentra rivales',body:'Conecta con jugadores de nivel similar.',tab:'Jugadores' as Tab},{icon:ChartNoAxesColumnIncreasing,title:'Mejora tu ranking',body:'Sigue tu evolución deportiva.',tab:'Rankings' as Tab},{icon:Trophy,title:'Compite en torneos',body:'Inscríbete en competiciones por nivel.',tab:'Torneos' as Tab},{icon:CalendarDays,title:'Reserva pistas',body:'Encuentra instalaciones colaboradoras.',tab:'Reservas' as Tab}].map(({icon:FeatureIcon,title,body,tab:dest})=><button className="feature" key={title} onClick={()=>navigate(dest)}><span className="feature-icon"><FeatureIcon size={26}/></span><strong>{title}</strong><p>{body}</p><span className="feature-link">Explorar <ArrowRight size={15}/></span></button>)}</div><div className="sports"><strong>Una plataforma para todos tus deportes</strong><div>{['TENIS','PÁDEL','PICKLEBALL','SQUASH','BÁDMINTON'].map(s=><span key={s}>{s}</span>)}</div></div></section></>:<section className="content interior"><span className="eyebrow red">RACKETON / {tab.toUpperCase()}</span><div className="page-title"><span className="page-icon"><Icon size={30}/></span><div><h1>{current.title}</h1><p>{current.subtitle}</p></div></div>{tab==='Perfil'&&user?<><PlayerProfile user={user}/><TennisCompetitiveProfile userId={user.id}/></>:tab==='Jugadores'&&user?<><TennisLeaderboard userId={user.id} onChallenge={p=>{setChallengeOpponent(p);navigate('Desafíos');}}/><PlayerSearch userId={user.id} onChallenge={p=>{setChallengeOpponent(p);navigate('Desafíos');}}/></>:tab==='Rankings'&&user?(mode==='club'?<ClubRankingsAdmin084 userId={user.id}/>:<><RacketonNationalRanking108 userId={user.id} onChallenge={(p:{id:string;name:string})=>{setChallengeOpponent(p);navigate('Desafíos');}}/><PlayerEnrollments084 userId={user.id}/></>):tab==='Torneos'&&user&&mode==='club'?<ClubCompetitionManager131 userId={user.id}/>: tab==='Escuelas'&&user&&mode==='club'?<SchoolManager090 userId={user.id}/>:tab==='Clubes'?user?<ClubPortal userId={user.id}/>:<div className="placeholder"><h2>Acceso profesional</h2><p>Inicia sesión para solicitar o utilizar tu acceso autorizado al club.</p><button className="primary" onClick={()=>setAuthOpen(true)}>Acceder <ArrowRight size={16}/></button></div>:tab==='Mis ligas'?user?<PlayerLeagues userId={user.id}/>:<div className="placeholder"><h2>Mis ligas privadas</h2><p>Inicia sesión para crear una liga con amigos.</p><button className="primary" onClick={()=>setAuthOpen(true)}>Acceder <ArrowRight size={16}/></button></div>:tab==='Desafíos'&&user?<><TennisChallenges userId={user.id} opponent={challengeOpponent} onClose={()=>setChallengeOpponent(null)}/><TennisResults userId={user.id}/><RacketonDoubles107 userId={user.id}/><TennisRatingHistory userId={user.id}/><TennisRatingSimulation1091 userId={user.id}/></>:<div className="placeholder"><div className="placeholder-icon"><Icon size={38}/></div><h2>{tab==='Perfil'&&!user?'Crea tu perfil deportivo':'Módulo en preparación'}</h2><p>{tab==='Perfil'&&!user?'Regístrate para empezar a construir tu historial deportivo.':'Esta pantalla está prevista para próximas versiones.'}</p><div className="planned">{current.items.map(item=><div key={item}><span className="tick">✓</span>{item}</div>)}</div>{tab==='Perfil'&&!user?<button className="primary" onClick={()=>setAuthOpen(true)}>Crear cuenta <ArrowRight size={16}/></button>:null}</div>}</section>}</main>
 <footer><span className="footer-brand">RACKET<span>ON</span></span><span>Juega · Compite · Evoluciona</span><span>RACKETON · Espacios por perfil</span><span><MapPin size={14}/> España</span></footer>
 {mode!=='choose'&&<nav className="bottom-nav">{(mode==='player'&&user?[]:tabs.filter(t=>visibleTabs.includes(t.name))).map(({name,icon:NavIcon})=><button key={name} className={tab===name?'active':''} onClick={()=>navigate(name)}><NavIcon size={21}/><span>{name}</span></button>)}</nav>}
 {authOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Acceso RACKETON" style={{maxWidth:650,maxHeight:'92vh',overflowY:'auto'}}><button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Cerrar"><X/></button><span className="eyebrow red">RACKETON · {authMode==='signup'?'NUEVO REGISTRO':'USUARIOS REGISTRADOS'}</span><h2>{authStep==='roles'?'Selecciona cómo quieres entrar':authMode==='signup'?'Crear una cuenta':'Iniciar sesión'}</h2><div style={{display:'flex',gap:8,margin:'14px 0 20px',flexWrap:'wrap'}}><button type="button" onClick={()=>{setAuthMode('login');setAuthStep('roles');setNotice('')}} style={{padding:'11px 16px',borderRadius:10,border:authMode==='login'?'2px solid #c8102e':'1px solid #ddd',background:authMode==='login'?'#fff1f3':'white',fontWeight:700,cursor:'pointer'}}>Ya tengo cuenta · Iniciar sesión</button><button type="button" onClick={()=>{setAuthMode('signup');setAuthStep('roles');setNotice('')}} style={{padding:'11px 16px',borderRadius:10,border:authMode==='signup'?'2px solid #c8102e':'1px solid #ddd',background:authMode==='signup'?'#fff1f3':'white',fontWeight:700,cursor:'pointer'}}>Soy nuevo · Registrarme</button></div>{authStep==='roles'?<><p>Elige tu perfil. Cada uno tendrá su propio menú y funcionalidades. Una cuenta puede tener varios perfiles autorizados.</p><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12,margin:'18px 0 10px'}}>{roleCards.map(r=><button key={r.id} type="button" onClick={()=>{setRequestedRole(r.id);setNotice('');if(r.id==='player'||r.id==='club')setAuthStep('credentials')}} style={{border:'1px solid #dce0e6',background:'#fff',borderRadius:14,padding:18,textAlign:'left',cursor:'pointer',minHeight:135,display:'flex',flexDirection:'column',gap:8}}><span style={{fontSize:30}}>{r.icon}</span><strong style={{fontSize:18,color:'#1e293b'}}>{r.title}</strong><small style={{color:'#64748b'}}>{r.id==='referee'||r.id==='federation'?'Próximamente':r.id==='club'?'Requiere autorización del club':'Ranking nacional y competiciones'}</small></button>)}</div>{notice&&<p className="notice" role="status">{notice}</p>}</>:<><button type="button" onClick={()=>{setAuthStep('roles');setNotice('')}} style={{border:0,background:'transparent',padding:'4px 0 14px',cursor:'pointer',color:'#c8102e',fontWeight:700}}>← Volver a los perfiles</button><p><strong>{requestedRole==='club'?'🏟️ Club':'🎾 Jugador'}</strong> · {authMode==='signup'?'Nuevo registro':'Acceso de usuario registrado'}</p>{requestedRole==='club'&&<p style={{fontSize:13,color:'#64748b'}}>Para gestionar un club necesitas autorización previa. Registrarte no concede permisos administrativos.</p>}<form onSubmit={submitAuth}><label>Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label><label>Contraseña<input required minLength={6} type="password" autoComplete={authMode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tu contraseña"/></label><button className="primary" disabled={busy||!configured}>{busy?'Procesando...':authMode==='signup'?'Crear cuenta':'Entrar como '+(requestedRole==='club'?'club':'jugador')} <ArrowRight size={16}/></button></form>{notice&&<p className="notice" role="status">{notice}</p>}</>}</div></div>}
 </div>
}
