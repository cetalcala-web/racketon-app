import { useEffect, useState } from 'react';
import { Search, MapPin, ShieldCheck, Users } from 'lucide-react';
import { supabase } from './supabase';
import { CountrySelect } from './CountrySelect';

type Player = { user_id: string; display_name: string; country: string; city: string; rating: number; rating_status: string; matches_played: number; preferred_format: string; availability: string; nationality: string };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #dedee3', borderRadius: 9, padding: '11px 12px', fontSize: 15, background: '#fff', color: '#24242a' };
const labelStyle: React.CSSProperties = { display: 'grid', gap: 6, fontWeight: 650, fontSize: 13 };
export default function PlayerSearch({ userId, onChallenge }: { userId: string; onChallenge?: (player:{id:string;name:string})=>void }) {
 const [country, setCountry] = useState(''); const [city, setCity] = useState('');
 const [min, setMin] = useState('1'); const [max, setMax] = useState('20');
 const [availability, setAvailability] = useState('');
 const [players, setPlayers] = useState<Player[]>([]); const [busy, setBusy] = useState(false);
 const [error, setError] = useState(''); const [searched, setSearched] = useState(false);
 async function search() {
  if (!supabase) return;
  const low = Number(min), high = Number(max);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 1 || high > 20 || low > high) { setError('Introduce un intervalo válido entre 1 y 20.'); return; }
  setBusy(true); setError(''); setSearched(true);
  const { data, error: queryError } = await supabase.rpc('search_tennis_players', { p_country: country.trim(), p_city: city.trim(), p_min_rating: low, p_max_rating: high, p_availability: availability.trim() });
  setBusy(false);
  if (queryError) { setPlayers([]); setError(queryError.message); } else setPlayers((data ?? []) as Player[]);
 }
 useEffect(() => { setPlayers([]); setSearched(false); setError(''); }, [userId]);
 return <div style={{maxWidth:980,margin:'24px auto 48px',display:'grid',gap:20}}>
  <div style={{padding:20,background:'#fff',border:'1px solid #e7e7eb',borderRadius:15}}>
   <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16}}><Search color="#c8102e"/><div><strong>Buscar rivales de tenis</strong><p style={{margin:'4px 0 0',color:'#65656c',fontSize:14}}>Solo aparecen jugadores que han autorizado expresamente su visibilidad.</p></div></div>
   <form onSubmit={e=>{e.preventDefault();void search()}} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14}}>
    <label style={labelStyle}>País<CountrySelect style={inputStyle} value={country} onChange={setCountry} includeAll/></label>
    <label style={labelStyle}>Ciudad<input style={inputStyle} maxLength={100} value={city} onChange={e=>setCity(e.target.value)} placeholder="Ej. Madrid"/></label>
    <label style={labelStyle}>Rating mínimo<input style={inputStyle} type="number" step="0.01" min="1" max="20" value={min} onChange={e=>setMin(e.target.value)}/></label>
    <label style={labelStyle}>Rating máximo<input style={inputStyle} type="number" step="0.01" min="1" max="20" value={max} onChange={e=>setMax(e.target.value)}/></label>
    <label style={labelStyle}>Disponibilidad (texto)<input style={inputStyle} maxLength={100} value={availability} onChange={e=>setAvailability(e.target.value)} placeholder="Ej. tardes"/></label>
    <div style={{display:'flex',alignItems:'end'}}><button type="submit" className="primary" disabled={busy} style={{width:'100%',justifyContent:'center'}}><Search size={17}/>{busy?'Buscando…':'Buscar jugadores'}</button></div>
   </form>
  </div>
  {error&&<p role="alert" style={{color:'#b42332'}}>{error}</p>}
  {searched&&!busy&&!error&&<p style={{color:'#64646d',margin:0}}>{players.length===0?'No hay jugadores visibles que coincidan con los filtros.':`${players.length} jugador(es) encontrado(s)${players.length===50?' (máximo mostrado: 50)':''}.`}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{players.map(p=><article key={p.user_id} style={{padding:20,background:'#fff',border:'1px solid #e7e7eb',borderRadius:15,display:'grid',gap:12}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><strong style={{fontSize:18}}>{p.display_name}</strong><Users size={20} color="#c8102e"/></div>
   <div style={{display:'flex',alignItems:'center',gap:6,color:'#64646d',fontSize:14}}><MapPin size={15}/>{p.city}, {p.country}</div>
   {p.nationality&&<div style={{fontSize:13,color:'#555'}}>Nacionalidad: {p.nationality}</div>}
   <div style={{display:'flex',alignItems:'baseline',gap:10}}><strong style={{fontSize:30,color:'#c8102e'}}>{Number(p.rating).toFixed(2)}</strong><span style={{fontSize:12,color:'#65656c'}}>RACKETON · {p.rating_status==='provisional'?'Provisional':p.rating_status==='consolidated'?'Consolidado':'En calibración'}</span></div>
   <div style={{fontSize:13,color:'#555'}}>Partidos registrados: {p.matches_played} · {p.preferred_format}</div>
   {p.availability&&<div style={{fontSize:14,background:'#f7f7f8',padding:10,borderRadius:8}}>Disponibilidad: {p.availability}</div>}
   <button className="primary" type="button" onClick={()=>{onChallenge?.({id:p.user_id,name:p.display_name})}}>Desafiar</button>
   <div style={{display:'flex',gap:6,alignItems:'center',fontSize:12,color:'#667'}}><ShieldCheck size={14}/> Perfil visible por decisión del jugador</div>
  </article>)}</div>
  {!searched&&<div style={{textAlign:'center',padding:40,color:'#777'}}><Users size={36} style={{margin:'0 auto 12px'}}/><p>Utiliza los filtros para encontrar jugadores de tenis.</p></div>}
 </div>;
}
