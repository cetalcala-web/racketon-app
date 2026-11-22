import SchoolManager090 from './SchoolManager091';
import {PlayerEnrollments084} from './RankingEnrollments084';
import { useEffect, useState } from 'react';
import { Home, Trophy, CalendarDays, Users, UserRound, LogIn, LogOut, Menu, X, ChartNoAxesColumnIncreasing, ShieldCheck, ArrowRight, MapPin, Wallet, Bell } from 'lucide-react';
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

function PlayerProfile({user}:{user:User}) {
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
    setSaving(false);setMessage(privacyError?'Perfil guardado, pero no se pudo guardar la visibilidad: '+privacyError.message:'¡Perfil deportivo guardado correctamente!');
  }
  return <div style={{maxWidth:850,margin:'24px auto 48px'}}>
    <div className="profile-box"><ShieldCheck color="#C8102E"/><div><strong>Cuenta de jugador</strong><p>{user.email}</p></div></div>
    {loading?<p style={{padding:24}}>Cargando perfil...</p>:<form onSubmit={save} style={{background:'#fff',border:'1px solid #e6e6e9',borderRadius:16,padding:'clamp(18px,4vw,32px)',marginTop:20,display:'grid',gap:22}}>
      <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',padding:18,background:'#f8fafc',borderRadius:14}}>
        {photoUrl?<img src={photoUrl} alt="Mi fotografía de jugador" style={{width:108,height:108,borderRadius:'50%',objectFit:'cover',border:'3px solid #c8102e'}}/>:<div aria-label="Sin fotografía" style={{width:108,height:108,borderRadius:'50%',display:'grid',placeItems:'center',background:'#e2e8f0',color:'#64748b'}}><UserRound size={52}/></div>}
        <div style={{display:'grid',gap:9,flex:1,minWidth:220}}><strong>Fotografía de jugador</strong><span style={{fontSize:13,color:'#64748b'}}>JPG, PNG o WebP · Máximo 2 MB. La foto será pública y visible en las fichas. Por ahora solo para adultos con perfil visible.</span>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><label style={{background:'#c8102e',color:'#fff',padding:'10px 14px',borderRadius:9,cursor:photoBusy?'wait':'pointer',fontWeight:700}}>{photoBusy?'Procesando…':photoUrl?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadPhoto(f);e.target.value='';}}/></label>{photoUrl&&<button type="button" disabled={photoBusy} onClick={()=>void removePhoto()} style={{padding:'10px 14px',borderRadius:9,border:'1px solid #cbd5e1',background:'#fff',cursor:'pointer'}}>Eliminar foto</button>}</div>
        </div>
      </div>
      <div><h2 style={{margin:'0 0 8px'}}>Datos del jugador</h2><p style={{margin:0,color:'#666'}}>Puedes modificar esta información cuando quieras.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
        <label style={labelStyle}>Nombre público<input style={fieldStyle} maxLength={80} value={details.display_name} onChange={e=>change('display_name',e.target.value)} placeholder="Tu nombre deportivo"/></label>
        <label style={labelStyle}>Localidad<input style={fieldStyle} maxLength={100} value={details.city} onChange={e=>change('city',e.target.value)} placeholder="Ej. Alcalá de Henares"/></label>
        <label style={labelStyle}>Año de nacimiento<input style={fieldStyle} type="number" min="1900" max={new Date().getFullYear()} value={details.birth_year} onChange={e=>change('birth_year',e.target.value)} placeholder="Ej. 1990"/></label>
        <label style={labelStyle}>Sexo<select style={fieldStyle} value={rankingSex} onChange={e=>setRankingSex(e.target.value)}><option value="">Sin indicar</option><option value="male">Masculino</option><option value="female">Femenino</option><option value="other">Otro</option></select></label>
        <label style={labelStyle}>Modalidad preferida<select style={fieldStyle} value={details.preferred_format} onChange={e=>change('preferred_format',e.target.value)}><option>Individual y dobles</option><option>Individual</option><option>Dobles</option></select></label>
      </div>
      <div><h2 style={{margin:'0 0 6px'}}>Mis deportes</h2><p style={{color:'#666',margin:'0 0 14px'}}>Activa los deportes que practicas. El nivel seleccionado es una declaración personal; realiza el test para obtener una valoración provisional.</p>
        <div style={{display:'grid',gap:10}}>{sportNames.map(name=><div key={name} style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,padding:14,border:'1px solid #e5e5e9',borderRadius:10,background:details.sports[name].enabled?'#fff5f6':'#fafafa'}}><label style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,cursor:'pointer'}}><input type="checkbox" checked={details.sports[name].enabled} onChange={e=>changeSport(name,{enabled:e.target.checked})} style={{accentColor:'#C8102E',width:18,height:18}}/>{name}</label><select aria-label={'Nivel de '+name} disabled={!details.sports[name].enabled} style={{...fieldStyle,width:180,marginTop:0,opacity:details.sports[name].enabled?1:.5}} value={details.sports[name].level} onChange={e=>changeSport(name,{level:e.target.value as SportLevel})}><option>Sin evaluar</option><option>Iniciación</option><option>Intermedio</option><option>Avanzado</option><option>Competición</option></select></div>)}</div>
      </div>
      <LevelAssessment userId={user.id} enabledSports={sportNames.filter(name=>name==='Tenis' && details.sports[name].enabled)} />
      <RacketSportAssessment105 userId={user.id} enabledSports={sportNames.filter(name=>(name==='Pádel'||name==='Pickleball') && details.sports[name].enabled)} />
      <div style={{display:'grid',gap:12,padding:16,border:'1px solid #e4e4e9',borderRadius:12,background:'#fafafa'}}><h2 style={{margin:0}}>Visibilidad en el buscador de tenis</h2><label style={labelStyle}>País de residencia<CountrySelect style={fieldStyle} value={country} onChange={setCountry}/></label><label style={labelStyle}>Nacionalidad (opcional)<CountrySelect style={fieldStyle} value={nationality} onChange={setNationality}/></label><label style={{display:'flex',alignItems:'center',gap:8,fontSize:14}}><input type="checkbox" checked={showNationality} onChange={e=>setShowNationality(e.target.checked)} /> Mostrar mi nacionalidad a otros jugadores</label><label style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:14}}><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)} style={{marginTop:4,accentColor:'#c8102e'}}/><span><strong>Quiero aparecer en el buscador de jugadores</strong><br/>Se mostrarán mi nombre deportivo, ciudad, país, rating, estado, modalidad y disponibilidad. La nacionalidad solo se mostrará si lo autorizo. No se mostrarán mi email, edad ni respuestas del cuestionario. Puedo desactivar esta opción cuando quiera.</span></label>{discoverable&&(!country.trim()||!details.city.trim()||!details.display_name.trim())&&<p style={{color:'#a43d18',margin:0,fontSize:13}}>Para aparecer en los resultados, completa nombre deportivo, ciudad y país y guarda el perfil.</p>}</div>
      <label style={labelStyle}>Disponibilidad para jugar<textarea style={{...fieldStyle,minHeight:90,resize:'vertical'}} maxLength={500} value={details.availability} onChange={e=>change('availability',e.target.value)} placeholder="Ej. Tardes entre semana y sábados por la mañana"/></label>
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:14}}><button className="primary" type="submit" disabled={saving}>{saving?'Guardando...':'Guardar mi perfil'} <ArrowRight size={17}/></button>{message&&<span role="status" style={{color:message.startsWith('¡')?'#137442':'#b42332',fontWeight:600}}>{message}</span>}</div>
    </form>}
  </div>;
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
 const [recent,setRecent]=useState<{opponent_name:string;won:boolean;rating_delta:number;played_at:string}[]>([]);
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
   setRecent(Array.isArray(historyResult.data)?historyResult.data.slice(0,3).map((x:{opponent_name:string;won:boolean;rating_delta:number;played_at:string})=>({opponent_name:x.opponent_name,won:x.won,rating_delta:Number(x.rating_delta),played_at:x.played_at})):[]);
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
  <p style={{color:'#64748b',margin:'0 0 24px'}}>Tus datos principales, tu nivel deportivo y tu actividad en un mismo lugar. <button type="button" onClick={()=>onNavigate('Perfil')} style={{border:0,background:'transparent',color:'#c8102e',fontWeight:800,cursor:'pointer'}}>Editar mis datos →</button></p>
  <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:22}}>{launchSports.map(x=><button key={x} type="button" onClick={()=>setSport(x)} aria-pressed={sport===x} style={{padding:'11px 20px',borderRadius:99,border:sport===x?'2px solid #c8102e':'1px solid #d7dce4',background:sport===x?'#fff1f3':'#fff',color:'#172033',fontWeight:700,cursor:'pointer'}}>{x}</button>)}</div>
  {error&&<p role="status" style={{background:'#fff1f2',color:'#9f1239',padding:12,borderRadius:9}}>{error}</p>}
  {loading?<p>Cargando tus datos deportivos…</p>:<>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:15}}>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>RATING · {sport.toUpperCase()}</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px',color:'#c8102e'}}>{activeRating?activeRating.rating.toFixed(2):'—'}</div><div style={{color:'#64748b',fontSize:13}}>{activeRating?({provisional:'Provisional',calibrating:'En calibración',consolidated:'Consolidado'}[activeRating.status]??activeRating.status):'Sin rating disponible'}</div></div>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>PARTIDOS DE RANKING · {sport.toUpperCase()}</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px'}}>{activeRating?activeRating.matches_played:'—'}</div><div style={{color:'#64748b',fontSize:13}}>{sport==='Tenis'?'Partidos computados en el rating':'Partidos competitivos: integración pendiente'}</div></div>
    <div style={card}><div style={{color:'#64748b',fontSize:13,fontWeight:700}}>DESAFÍOS RECIBIDOS · TENIS</div><div style={{fontSize:38,fontWeight:850,margin:'10px 0 4px'}}>{pending??'—'}</div><button type="button" onClick={()=>onNavigate('Desafíos')} style={{background:'transparent',border:0,padding:0,color:'#c8102e',fontWeight:750,cursor:'pointer'}}>Ver desafíos →</button></div>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16,marginTop:20}}>
    <div style={card}><h2 style={{margin:'0 0 10px',fontSize:22}}>Tu deporte: {sport}</h2><p style={{color:'#64748b',lineHeight:1.6}}>{!selectedEnabled?'Todavía no has activado este deporte en tu perfil.':sport==='Tenis'?(rating?'Tu rating de tenis está conectado con tus resultados confirmados.':'Completa la evaluación inicial para obtener tu rating provisional de tenis.'):(activeRating?'Tu rating inicial de '+sport+' ya está disponible. Puedes buscar rivales de un nivel similar.':'Completa el cuestionario específico de '+sport+' para obtener tu rating provisional.')}</p><button type="button" onClick={()=>onNavigate('Perfil')} style={action}>{!selectedEnabled?'Activar deporte en mi perfil':sport==='Tenis'&&!rating?'Completar mi evaluación':'Ver mi perfil deportivo'}</button></div>
    <div style={card}><h2 style={{margin:'0 0 12px',fontSize:22}}>Accesos rápidos</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>{([{label:'Buscar rivales',dest:'Jugadores'},{label:'Rankings',dest:'Rankings'},{label:'Mis desafíos',dest:'Desafíos'},{label:'Mis ligas',dest:'Mis ligas'},{label:'Torneos',dest:'Torneos'},{label:'Mis datos',dest:'Perfil'}] as {label:string;dest:Tab}[]).map(x=><button key={x.dest} onClick={()=>onNavigate(x.dest)} style={{padding:'13px 8px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,color:'#172033',fontWeight:700,cursor:'pointer'}}>{x.label} →</button>)}</div></div>
   </div>
   <div style={{...card,marginTop:18}}><h2 style={{margin:'0 0 14px',fontSize:22}}>Últimos partidos · Tenis</h2>{recent.length?recent.map((x,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',gap:12,borderTop:'1px solid #e2e8f0',padding:'12px 0',flexWrap:'wrap'}}><span><strong>{x.won?'Victoria':'Derrota'}</strong> · {x.opponent_name}</span><span style={{color:'#64748b'}}>{new Date(x.played_at).toLocaleDateString('es-ES')} · Rating {x.rating_delta>0?'+':''}{x.rating_delta.toFixed(2)}</span></div>):<p style={{color:'#64748b'}}>Todavía no hay partidos de tenis confirmados en tu historial.</p>}<button type="button" onClick={()=>onNavigate('Desafíos')} style={{background:'transparent',border:0,color:'#c8102e',fontWeight:700,cursor:'pointer',padding:0}}>Ver resultados e historial →</button></div>
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
  .rkt-player-shell{--rk-red:#cc1237;--rk-ink:#172033;--rk-muted:#667085;display:grid;grid-template-columns:256px minmax(0,1fr);min-height:calc(100vh - 160px);width:100%;max-width:1600px;margin:0 auto;background:#f5f6f9;color:var(--rk-ink);font-family:inherit}
  .rkt-sidebar{background:#fff;border-right:1px solid #e9ebf0;padding:28px 15px 30px;display:flex;flex-direction:column;gap:7px}
  .rkt-sidebar-title{font-size:10px;letter-spacing:2px;color:#9299a6;font-weight:900;padding:0 14px;margin:6px 0 13px}
  .rkt-nav-btn{width:100%;border:0;border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:13px;background:transparent;color:#475467;text-align:left;font-size:14px;font-weight:750;cursor:pointer;transition:background .15s}
  .rkt-nav-btn:hover{background:#f5f6f9}.rkt-nav-btn.active{background:#fff0f3;color:#b90d31}.rkt-nav-btn.active:before{content:'';width:3px;height:20px;border-radius:6px;background:#c8102e;margin-left:-9px;margin-right:6px}
  .rkt-nav-sub{margin:2px 0 12px 39px;border-left:1px solid #e8eaf0;display:flex;flex-direction:column;gap:2px}
  .rkt-nav-sub button{border:0;background:transparent;text-align:left;padding:10px 12px;color:#667085;font-size:12px;font-weight:650;cursor:pointer;border-radius:0 9px 9px 0}.rkt-nav-sub button:hover{background:#f5f6f9}.rkt-nav-sub button.active{color:#bd1235;background:#fff1f4;border-left:3px solid #c8102e;margin-left:-2px;font-weight:850}
  .rkt-workspace{min-width:0;padding:29px clamp(18px,3vw,52px) 70px}.rkt-topline{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:28px}.rkt-breadcrumb{font-size:12px;font-weight:800;letter-spacing:.3px;color:#88909e}.rkt-breadcrumb strong{color:#c8102e}.rkt-header-actions{display:flex;align-items:center;gap:9px}.rkt-header-chip{border:1px solid #e7e9ef;background:white;border-radius:11px;padding:10px 13px;display:flex;align-items:center;gap:7px;color:#344054;font-size:12px;font-weight:800}.rkt-header-chip svg{color:#c8102e}.rkt-section-heading{margin:0 0 24px}.rkt-section-heading h1{font-size:clamp(25px,2.6vw,34px);letter-spacing:-1px;margin:0 0 5px;color:#182230}.rkt-section-heading p{color:#667085;margin:0;font-size:14px}.rkt-mobile-trigger{display:none}
  .rkt-workspace .content.interior{max-width:100%!important;margin:0!important;padding:0!important}.rkt-workspace .content{max-width:100%!important}.rkt-workspace .eyebrow.red{display:none}.rkt-workspace section{max-width:100%}.rkt-workspace .page-title{margin-top:0}.rkt-workspace>div>section{max-width:100%}
  @media(max-width:900px){.rkt-player-shell{grid-template-columns:1fr}.rkt-sidebar{display:none}.rkt-workspace{padding:20px 16px 105px}.rkt-mobile-trigger{display:flex;border:1px solid #e5e7eb;border-radius:10px;background:white;padding:10px 12px;align-items:center;gap:8px;font-weight:800}.rkt-mobile-sub{display:flex;gap:7px;overflow-x:auto;padding:0 0 14px;margin-bottom:15px}.rkt-mobile-sub button{white-space:nowrap;border:1px solid #e6e8ed;border-radius:100px;padding:9px 12px;background:#fff;font-size:12px;font-weight:750;color:#667085}.rkt-mobile-sub button.active{border-color:#c8102e;background:#fff0f3;color:#b80f31}.rkt-bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:80;display:grid;grid-template-columns:repeat(4,1fr);background:white;border-top:1px solid #e6e8ed;box-shadow:0 -8px 30px #1118270d;padding:8px 2px max(8px,env(safe-area-inset-bottom))}.rkt-bottom-nav button{border:0;background:none;display:flex;align-items:center;flex-direction:column;gap:4px;color:#667085;font-size:10px;font-weight:750;padding:5px 0}.rkt-bottom-nav button.active{color:#c8102e}.rkt-header-actions{margin-left:auto}.rkt-section-heading{margin-bottom:16px}}
  @media(min-width:901px){.rkt-bottom-nav,.rkt-mobile-sub{display:none}}
  `}</style>
  <aside className="rkt-sidebar" aria-label="Navegación del jugador"><div className="rkt-sidebar-title">ESPACIO JUGADOR</div>{playerArchitecture.map((x,i)=>{const NavIcon=[Home,Trophy,ChartNoAxesColumnIncreasing,CalendarDays][i];return <div key={x.name}><button type="button" className={'rkt-nav-btn '+(area===x.name?'active':'')} onClick={()=>go(x.name)}><NavIcon size={19}/><span>{x.name}</span></button>{area===x.name&&<div className="rkt-nav-sub">{x.children.map(child=><button key={child} type="button" className={sub===child?'active':''} onClick={()=>setSub(child)}>{child}</button>)}</div>}</div>})}</aside>
  <div className="rkt-workspace"><div className="rkt-topline"><div className="rkt-breadcrumb">RACKETON / {area.toUpperCase()} / <strong>{sub.toUpperCase()}</strong></div><div className="rkt-header-actions"><div className="rkt-header-chip" title="Monedero pendiente de integración" ><Wallet size={15}/> Monedero · Próximamente</div><button type="button" className="rkt-header-chip" onClick={()=>go('Inicio','Avisos')} aria-label="Avisos"><Bell size={15}/> Avisos</button></div></div>
  <div className="rkt-section-heading"><h1>{sub==='Mi panel'?'Mi RACKETON':sub}</h1><p>{sub==='Mi panel'?'Tu actividad deportiva, tus rivales y tu evolución en un solo lugar.':area+' · '+sub}</p></div>
  <div className="rkt-mobile-sub">{playerArchitecture.find(x=>x.name===area)!.children.map(child=><button key={child} className={sub===child?'active':''} onClick={()=>setSub(child)}>{child}</button>)}</div>
  <div className="rkt-screen-body">
  {area==='Inicio'&&sub==='Mi panel'?<PlayerHome102 user={user} onNavigate={(old:Tab)=>{if(old==='Desafíos'||old==='Jugadores')go('Competir','Desafíos');else if(old==='Rankings'||old==='Mis ligas')go('Clasificaciones',old==='Mis ligas'?'Mis ligas':'Clasificaciones RACKETON');else if(old==='Perfil'){setDataTab('Perfil deportivo');go('Inicio','Mis datos')};else if(old==='Reservas')go('Reservas');else if(old==='Torneos')go('Competir','Explorar competiciones');}}/>:
  area==='Competir'&&sub==='Desafíos'?<><div style={navCard}><h2>Buscar rivales y organizar partidos libres</h2><p>Los desafíos son partidos individuales o de dobles fuera de las competiciones organizadas.</p><PlayerSearch userId={user.id} onChallenge={p=>{onChallenge(p);go('Competir','Desafíos')}}/></div><div style={navCard}><h2>Desafíos individuales</h2><TennisChallenges userId={user.id} opponent={opponent} onClose={onClearOpponent}/></div><div style={navCard}><h2>Resultados y confirmaciones</h2><TennisResults userId={user.id}/></div><div style={navCard}><h2>Desafíos de dobles</h2><RacketonDoubles107 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Clasificaciones RACKETON'?<RacketonNationalRanking108 userId={user.id} onChallenge={(p:{id:string;name:string})=>{onChallenge(p);go('Competir','Desafíos')}}/>:
  area==='Clasificaciones'&&sub==='Mis ligas'?<><PlayerLeagues userId={user.id}/><div style={navCard}><h2>Rankings y ligas de club</h2><PlayerEnrollments084 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Mi rating'?<><div style={navCard}><h2>Mi rating y perfil competitivo</h2><TennisCompetitiveProfile userId={user.id}/></div><div style={navCard}><h2>Simulador de rating · Tenis</h2><TennisRatingSimulation1091 userId={user.id}/></div></>:
  area==='Clasificaciones'&&sub==='Historial'?<div style={navCard}><h2>Historial y evolución del rating · Tenis</h2><TennisRatingHistory userId={user.id}/><p style={{fontSize:13,color:'#64748b'}}>Las estadísticas históricas de pádel y pickleball se incorporarán cuando haya resultados competitivos disponibles.</p></div>:
  area==='Inicio'&&sub==='Mis datos'?<div style={{display:'grid',gap:14}}>
   <div style={{...navCard,marginTop:0}}><h2 style={{margin:'0 0 8px'}}>Mis datos</h2><p style={{color:'#667085',margin:'0 0 15px'}}>Gestiona tus datos personales, deportivos y las preferencias de tu cuenta.</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{['Datos personales','Perfil deportivo','Mi monedero','Privacidad','Configuración'].map(t=><button key={t} type="button" onClick={()=>setDataTab(t)} style={{border:dataTab===t?'1px solid #c8102e':'1px solid #e2e8f0',background:dataTab===t?'#fff0f3':'#fff',color:dataTab===t?'#b70f31':'#475467',padding:'10px 13px',borderRadius:10,fontWeight:750,cursor:'pointer'}}>{t}</button>)}</div></div>
   {dataTab==='Datos personales'?<PlayerProfile user={user}/>:dataTab==='Perfil deportivo'?<><div style={navCard}><h2>Mis niveles y evaluaciones</h2><p>Los cuestionarios son independientes para cada deporte y solo se completan una vez.</p><PlayerProfile user={user}/></div><div style={navCard}><TennisCompetitiveProfile userId={user.id}/></div></>:<PendingPlayerModule title={dataTab} description={planned[dataTab]||'Esta sección se desarrollará próximamente.'}/>}
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
