import { useMemo } from 'react';

// Códigos ISO 3166-1 alpha-2. Etiquetas localizadas al español por el navegador.
const COUNTRY_CODES = ["AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"] as const;
const COUNTRY_LABELS: Record<string, string> = { ES: 'España', GB: 'Reino Unido', US: 'Estados Unidos' };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export function CountrySelect({ value, onChange, includeAll = false, style, id }: {
  value: string;
  onChange: (country: string) => void;
  includeAll?: boolean;
  style?: React.CSSProperties;
  id?: string;
}) {
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(['es'], { type: 'region' });
    return COUNTRY_CODES.map(code => ({ code, name: COUNTRY_LABELS[code] ?? names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, []);
  const current = countries.find(c => normalize(c.name) === normalize(value));
  return <select id={id} style={style} value={current?.code ?? (value ? '__legacy__' : '')}
    onChange={e => onChange(countries.find(c => c.code === e.target.value)?.name ?? '')}>
    <option value="">{includeAll ? 'Todos los países' : 'Selecciona un país'}</option>
    {value && !current && <option value="__legacy__" disabled>{value} (selecciona un país de la lista)</option>}
    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
  </select>;
}
