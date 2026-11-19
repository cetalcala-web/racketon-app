import { useEffect, useState } from 'react';
import { Home, Trophy, CalendarDays, Users, UserRound, LogIn, LogOut, Menu, X, ChartNoAxesColumnIncreasing, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase } from './supabase';
import LevelAssessment from './LevelAssessmentAdvanced';
import PlayerSearch from './PlayerSearch';
import { CountrySelect } from './CountrySelect';
import TennisChallenges from './TennisChallenges';
import TennisLeaderboard from './TennisLeaderboard';

type Tab = 'Inicio'|'Jugadores'|'Desafíos'|'Rankings'|'Torneos'|'Reservas'|'Perfil';
const tabs: {name:Tab;icon:LucideIcon}[] = [{name:'Inicio',icon:Home},{name:'Jugadores',icon:Users},{name:'Desafíos',icon:Trophy},{name:'Rankings',icon:ChartNoAxesColumnIncreasing},{name:'Torneos',icon:Trophy},{name:'Reservas',icon:CalendarDays},{name:'Perfil',icon:UserRound}];
const sections: Record<Tab,{title:string;subtitle:string;icon:LucideIcon;items:string[]}> = {
  Inicio:{title:'Tu pista. Tu comunidad.',subtitle:'La plataforma de los deportes de raqueta.',icon:Home,items:[]},
  Jugadores:{title:'Encuentra jugadores',subtitle:'Conecta con rivales de tu deporte y nivel.',icon:Users,items:['Búsqueda por deporte y nivel','Desafíos entre jugadores','Historial de enfrentamientos']},
  'Desafíos':{title:'Mis desafíos',subtitle:'Gestiona propuestas de partidos amistosos y de ranking.',icon:Trophy,items:[]},
  Rankings:{title:'Rankings y niveles',subtitle:'Consulta clasificaciones y sigue tu progresión.',icon:ChartNoAxesColumnIncreasing,items:['Rating independiente por deporte','Clasificaciones territoriales','Divisiones y estadísticas']},
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
  const [nationality,setNationality] = useState('');
  const [showNationality,setShowNationality] = useState(false);
  useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      setLoading(true);setMessage('');
      const {data,error}=await supabase.from('player_details').select('display_name,city,birth_year,preferred_format,availability,sports').eq('user_id',user.id).maybeSingle();
      if(!active)return;
      if(error){setMessage('No se pudo cargar el perfil: '+error.message)}
      else if(data){
        const savedSports=data.sports && typeof data.sports==='object' ? data.sports as Record<string, Partial<SportChoice>> : {};
        const sports=defaultSports();
        for(const name of sportNames){const saved=savedSports[name];if(saved){sports[name]={enabled:saved.enabled===true,level:(['Sin evaluar','Iniciación','Intermedio','Avanzado','Competición'].includes(String(saved.level))?saved.level:'Sin evaluar') as SportLevel}}}
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
  function change<K extends Exclude<keyof PlayerDetails,'sports'>>(key:K,value:PlayerDetails[K]){setDetails(old=>({...old,[key]:value}));setMessage('')}
  function changeSport(name:SportName,update:Partial<SportChoice>){setDetails(old=>({...old,sports:{...old.sports,[name]:{...old.sports[name],...update}}}));setMessage('')}
  async function save(e:React.FormEvent){
    e.preventDefault();if(!supabase)return;
    const year=details.birth_year.trim()?Number(details.birth_year):null;
    if(year!==null && (!Number.isInteger(year)||year<1900||year>new Date().getFullYear())){setMessage('Introduce un año de nacimiento válido.');return}
    setSaving(true);setMessage('');
    const {error}=await supabase.from('player_details').upsert({user_id:user.id,display_name:details.display_name.trim(),city:details.city.trim(),birth_year:year,preferred_format:details.preferred_format,availability:details.availability.trim(),sports:details.sports},{onConflict:'user_id'});
    if(error){setSaving(false);setMessage('No se pudo guardar: '+error.message);return;}
    const {error:privacyError}=await supabase.from('player_discovery_preferences').upsert({user_id:user.id,discoverable,country:country.trim(),nationality:nationality.trim(),show_nationality:showNationality},{onConflict:'user_id'});
    setSaving(false);setMessage(privacyError?'Perfil guardado, pero no se pudo guardar la visibilidad: '+privacyError.message:'¡Perfil deportivo guardado correctamente!');
  }
  return <div style={{maxWidth:850,margin:'24px auto 48px'}}>
    <div className="profile-box"><ShieldCheck color="#C8102E"/><div><strong>Cuenta de jugador</strong><p>{user.email}</p></div></div>
    {loading?<p style={{padding:24}}>Cargando perfil...</p>:<form onSubmit={save} style={{background:'#fff',border:'1px solid #e6e6e9',borderRadius:16,padding:'clamp(18px,4vw,32px)',marginTop:20,display:'grid',gap:22}}>
      <div><h2 style={{margin:'0 0 8px'}}>Datos del jugador</h2><p style={{margin:0,color:'#666'}}>Puedes modificar esta información cuando quieras.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
        <label style={labelStyle}>Nombre público<input style={fieldStyle} maxLength={80} value={details.display_name} onChange={e=>change('display_name',e.target.value)} placeholder="Tu nombre deportivo"/></label>
        <label style={labelStyle}>Localidad<input style={fieldStyle} maxLength={100} value={details.city} onChange={e=>change('city',e.target.value)} placeholder="Ej. Alcalá de Henares"/></label>
        <label style={labelStyle}>Año de nacimiento<input style={fieldStyle} type="number" min="1900" max={new Date().getFullYear()} value={details.birth_year} onChange={e=>change('birth_year',e.target.value)} placeholder="Ej. 1990"/></label>
        <label style={labelStyle}>Modalidad preferida<select style={fieldStyle} value={details.preferred_format} onChange={e=>change('preferred_format',e.target.value)}><option>Individual y dobles</option><option>Individual</option><option>Dobles</option></select></label>
      </div>
      <div><h2 style={{margin:'0 0 6px'}}>Mis deportes</h2><p style={{color:'#666',margin:'0 0 14px'}}>Activa los deportes que practicas. El nivel seleccionado es una declaración personal; realiza el test para obtener una valoración provisional.</p>
        <div style={{display:'grid',gap:10}}>{sportNames.map(name=><div key={name} style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,padding:14,border:'1px solid #e5e5e9',borderRadius:10,background:details.sports[name].enabled?'#fff5f6':'#fafafa'}}><label style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,cursor:'pointer'}}><input type="checkbox" checked={details.sports[name].enabled} onChange={e=>changeSport(name,{enabled:e.target.checked})} style={{accentColor:'#C8102E',width:18,height:18}}/>{name}</label><select aria-label={'Nivel de '+name} disabled={!details.sports[name].enabled} style={{...fieldStyle,width:180,marginTop:0,opacity:details.sports[name].enabled?1:.5}} value={details.sports[name].level} onChange={e=>changeSport(name,{level:e.target.value as SportLevel})}><option>Sin evaluar</option><option>Iniciación</option><option>Intermedio</option><option>Avanzado</option><option>Competición</option></select></div>)}</div>
      </div>
      <LevelAssessment userId={user.id} enabledSports={sportNames.filter(name=>details.sports[name].enabled)} />
      <div style={{display:'grid',gap:12,padding:16,border:'1px solid #e4e4e9',borderRadius:12,background:'#fafafa'}}><h2 style={{margin:0}}>Visibilidad en el buscador de tenis</h2><label style={labelStyle}>País de residencia<CountrySelect style={fieldStyle} value={country} onChange={setCountry}/></label><label style={labelStyle}>Nacionalidad (opcional)<CountrySelect style={fieldStyle} value={nationality} onChange={setNationality}/></label><label style={{display:'flex',alignItems:'center',gap:8,fontSize:14}}><input type="checkbox" checked={showNationality} onChange={e=>setShowNationality(e.target.checked)} /> Mostrar mi nacionalidad a otros jugadores</label><label style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:14}}><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)} style={{marginTop:4,accentColor:'#c8102e'}}/><span><strong>Quiero aparecer en el buscador de jugadores</strong><br/>Se mostrarán mi nombre deportivo, ciudad, país, rating, estado, modalidad y disponibilidad. La nacionalidad solo se mostrará si lo autorizo. No se mostrarán mi email, edad ni respuestas del cuestionario. Puedo desactivar esta opción cuando quiera.</span></label>{discoverable&&(!country.trim()||!details.city.trim()||!details.display_name.trim())&&<p style={{color:'#a43d18',margin:0,fontSize:13}}>Para aparecer en los resultados, completa nombre deportivo, ciudad y país y guarda el perfil.</p>}</div>
      <label style={labelStyle}>Disponibilidad para jugar<textarea style={{...fieldStyle,minHeight:90,resize:'vertical'}} maxLength={500} value={details.availability} onChange={e=>change('availability',e.target.value)} placeholder="Ej. Tardes entre semana y sábados por la mañana"/></label>
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:14}}><button className="primary" type="submit" disabled={saving}>{saving?'Guardando...':'Guardar mi perfil'} <ArrowRight size={17}/></button>{message&&<span role="status" style={{color:message.startsWith('¡')?'#137442':'#b42332',fontWeight:600}}>{message}</span>}</div>
    </form>}
  </div>;
}

export default function App(){
 const [tab,setTab]=useState<Tab>('Inicio');const [challengeOpponent,setChallengeOpponent]=useState<{id:string;name:string}|null>(null);const [user,setUser]=useState<User|null>(null);const [menu,setMenu]=useState(false);const [authOpen,setAuthOpen]=useState(false);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [authMode,setAuthMode]=useState<'login'|'signup'>('signup');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!supabase)return;supabase.auth.getUser().then(({data})=>setUser(data.user));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));return()=>subscription.unsubscribe()},[]);
 async function submitAuth(e:React.FormEvent){e.preventDefault();if(!supabase){setNotice('Configura Supabase para activar el registro.');return;}setBusy(true);setNotice('');try{const res=authMode==='signup'?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(res.error)throw res.error;setNotice(authMode==='signup'?'Registro solicitado. Comprueba tu correo si la confirmación está activada.':'Sesión iniciada.');if(authMode==='login')setAuthOpen(false);}catch(err){setNotice(err instanceof Error?err.message:'No se pudo completar la operación.')}finally{setBusy(false)}}
 async function logout(){await supabase?.auth.signOut();setTab('Inicio')}
 function navigate(next:Tab){setTab(next);setMenu(false);setNotice('')}
 const current=sections[tab];const Icon=current.icon;
 return <div className="shell"><header className="header"><button className="brand" onClick={()=>navigate('Inicio')} aria-label="Ir a inicio"><span className="brand-mark">R<span className="brand-dot">●</span></span><span>RACKET<span>ON</span></span></button><nav className="desktop-nav">{tabs.map(({name})=><button key={name} className={tab===name?'active':''} onClick={()=>navigate(name)}>{name}</button>)}</nav><div className="header-actions">{user?<button className="outline small" onClick={logout}><LogOut size={16}/> Salir</button>:<button className="outline small" onClick={()=>setAuthOpen(true)}><LogIn size={16}/> Acceder</button>}<button className="menu-button" onClick={()=>setMenu(!menu)} aria-label="Menú">{menu?<X/>:<Menu/>}</button></div></header>
 {menu&&<nav className="mobile-menu">{tabs.map(({name,icon:NavIcon})=><button key={name} onClick={()=>navigate(name)}><NavIcon size={18}/>{name}</button>)}</nav>}
 <main>{tab==='Inicio'?<><section className="hero"><div className="hero-copy"><span className="eyebrow">TU COMUNIDAD DE DEPORTES DE RAQUETA</span><h1>Juega.<br/>Compite.<br/><em>Evoluciona.</em></h1><p>Encuentra rivales, mejora tu nivel, participa en torneos y reserva pistas. Todo en una sola plataforma.</p><div className="hero-actions"><button className="primary" onClick={()=>user?navigate('Perfil'):setAuthOpen(true)}>{user?'Mi perfil':'Únete a RACKETON'} <ArrowRight size={18}/></button><button className="outline light" onClick={()=>navigate('Torneos')}>Explorar torneos</button></div></div><div className="hero-art"><div className="court"><span className="court-net"/><span className="ball"/></div><div className="hero-card"><span>RACKETON</span><strong>Tu próximo partido empieza aquí</strong><small>TENIS · PÁDEL · PICKLEBALL · SQUASH</small></div></div></section><section className="content"><div className="section-head"><div><span className="eyebrow red">TODO EN UNA PLATAFORMA</span><h2>El deporte de raqueta, conectado.</h2></div></div><div className="features">{[{icon:Users,title:'Encuentra rivales',body:'Conecta con jugadores de nivel similar.',tab:'Jugadores' as Tab},{icon:ChartNoAxesColumnIncreasing,title:'Mejora tu ranking',body:'Sigue tu evolución deportiva.',tab:'Rankings' as Tab},{icon:Trophy,title:'Compite en torneos',body:'Inscríbete en competiciones por nivel.',tab:'Torneos' as Tab},{icon:CalendarDays,title:'Reserva pistas',body:'Encuentra instalaciones colaboradoras.',tab:'Reservas' as Tab}].map(({icon:FeatureIcon,title,body,tab:dest})=><button className="feature" key={title} onClick={()=>navigate(dest)}><span className="feature-icon"><FeatureIcon size={26}/></span><strong>{title}</strong><p>{body}</p><span className="feature-link">Explorar <ArrowRight size={15}/></span></button>)}</div><div className="sports"><strong>Una plataforma para todos tus deportes</strong><div>{['TENIS','PÁDEL','PICKLEBALL','SQUASH','BÁDMINTON'].map(s=><span key={s}>{s}</span>)}</div></div></section></>:<section className="content interior"><span className="eyebrow red">RACKETON / {tab.toUpperCase()}</span><div className="page-title"><span className="page-icon"><Icon size={30}/></span><div><h1>{current.title}</h1><p>{current.subtitle}</p></div></div>{tab==='Perfil'&&user?<PlayerProfile user={user}/>:tab==='Jugadores'&&user?<><TennisLeaderboard userId={user.id}/><PlayerSearch userId={user.id} onChallenge={p=>{setChallengeOpponent(p);navigate('Desafíos');}}/></>:tab==='Desafíos'&&user?<TennisChallenges userId={user.id} opponent={challengeOpponent} onClose={()=>setChallengeOpponent(null)}/>:<div className="placeholder"><div className="placeholder-icon"><Icon size={38}/></div><h2>{tab==='Perfil'&&!user?'Crea tu perfil deportivo':'Módulo en preparación'}</h2><p>{tab==='Perfil'&&!user?'Regístrate para empezar a construir tu historial deportivo.':'Esta pantalla está prevista para próximas versiones.'}</p><div className="planned">{current.items.map(item=><div key={item}><span className="tick">✓</span>{item}</div>)}</div>{tab==='Perfil'&&!user?<button className="primary" onClick={()=>setAuthOpen(true)}>Crear cuenta <ArrowRight size={16}/></button>:null}</div>}</section>}</main>
 <footer><span className="footer-brand">RACKET<span>ON</span></span><span>Juega · Compite · Evoluciona</span><span>Versión 0.6.1 · Plataforma independiente</span><span><MapPin size={14}/> España</span></footer>
 <nav className="bottom-nav">{tabs.filter(t=>t.name!=='Jugadores').map(({name,icon:NavIcon})=><button key={name} className={tab===name?'active':''} onClick={()=>navigate(name)}><NavIcon size={21}/><span>{name}</span></button>)}</nav>
 {authOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Acceso RACKETON"><button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Cerrar"><X/></button><span className="eyebrow red">BIENVENIDO A RACKETON</span><h2>{authMode==='signup'?'Crea tu cuenta':'Accede a tu cuenta'}</h2><p>{configured?'Utiliza tu correo electrónico para continuar.':'Modo de demostración: configura Supabase para activar cuentas reales.'}</p><form onSubmit={submitAuth}><label>Correo electrónico<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label><label>Contraseña<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label><button className="primary" disabled={busy||!configured}>{busy?'Procesando...':authMode==='signup'?'Crear cuenta':'Entrar'} <ArrowRight size={16}/></button></form>{notice&&<p className="notice" role="status">{notice}</p>}<button className="switch-auth" onClick={()=>{setAuthMode(authMode==='signup'?'login':'signup');setNotice('')}}>{authMode==='signup'?'¿Ya tienes cuenta? Inicia sesión':'¿No tienes cuenta? Regístrate'}</button></div></div>}
 </div>
}
