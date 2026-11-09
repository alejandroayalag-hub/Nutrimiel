import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe } from '../../ui';
import * as seg from './api';

const CAMPOS = [
  ['peso_kg', 'Peso (kg)'], ['talla_cm', 'Talla (cm)'], ['grasa_pct', '% Grasa'], ['musculo_kg', 'Músculo (kg)'],
  ['agua_pct', '% Agua'], ['grasa_visceral', 'Grasa visceral'], ['cintura_cm', 'Cintura (cm)'], ['cadera_cm', 'Cadera (cm)'],
  ['brazo_cm', 'Brazo (cm)'],
];
const fecha = (v) => new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { dateStyle: 'medium' });
const num = (v) => (v == null ? '—' : Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 }));

// IMC con la talla de la medición o, si no trae, la última conocida
export function imc(peso, tallaCm) {
  if (!peso || !tallaCm) return null;
  const m = tallaCm / 100;
  return peso / (m * m);
}
export function categoriaImc(v) {
  if (v == null) return '';
  return v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : v < 35 ? 'Obesidad I' : v < 40 ? 'Obesidad II' : 'Obesidad III';
}

function Grafica({ puntos, campo, label }) {
  const datos = puntos.filter(p => p[campo] != null).map(p => ({ f: p.fecha, v: Number(p[campo]) })).reverse();
  if (datos.length < 2) return null;
  const W = 600, H = 160, P = 28;
  const vs = datos.map(d => d.v), min = Math.min(...vs), max = Math.max(...vs), rango = max - min || 1;
  const x = (i) => P + (i * (W - 2 * P)) / (datos.length - 1);
  const y = (v) => H - P - ((v - min) * (H - 2 * P)) / rango;
  const dif = vs[vs.length - 1] - vs[0];
  return (
    <div className={`${tarjeta} p-4`}>
      <div className="flex text-sm mb-1">
        <span className="font-semibold flex-1">{label}</span>
        <span className={dif <= 0 ? 'text-emerald-700' : 'text-amber-700'}>{dif > 0 ? '+' : ''}{num(dif)} desde {fecha(datos[0].f)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label={`Evolución de ${label}`}>
        <polyline fill="none" stroke="var(--acento)" strokeWidth="2.5" points={datos.map((d, i) => `${x(i)},${y(d.v)}`).join(' ')} />
        {datos.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.v)} r="4" fill="var(--acento)"><title>{`${fecha(d.f)}: ${num(d.v)}`}</title></circle>
            {(i === 0 || i === datos.length - 1) && <text x={x(i)} y={y(d.v) - 9} fontSize="12" textAnchor="middle" fill="#52525b">{num(d.v)}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function MedicionModal({ pacienteId, med, tallaPrevia, onClose }) {
  const [form, setForm] = useState(() => ({
    fecha: med.fecha?.slice(0, 10) || new Date().toLocaleDateString('en-CA'),
    ...Object.fromEntries(CAMPOS.map(([k]) => [k, med[k] ?? (k === 'talla_cm' && !med.id ? tallaPrevia ?? '' : '')])),
    notas: med.notas || '',
  }));
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const vImc = imc(Number(form.peso_kg), Number(form.talla_cm));

  async function guardar(e) {
    e.preventDefault();
    try {
      if (med.id) await seg.editarMedicion(med.id, form); else await seg.crearMedicion(pacienteId, form);
      onClose(true);
    } catch (err) { setError(errorDe(err)); }
  }
  async function borrar() {
    if (!window.confirm('¿Eliminar esta medición?')) return;
    try { await seg.borrarMedicion(med.id); onClose(true); } catch (err) { setError(errorDe(err)); }
  }
  return (
    <Modal titulo={med.id ? 'Editar medición' : 'Nueva medición'} onClose={() => onClose(false)} ancho="max-w-lg">
      <form onSubmit={guardar} className="space-y-3">
        <Campo label="Fecha"><input className={input} type="date" required value={form.fecha} onChange={e => set('fecha', e.target.value)} /></Campo>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CAMPOS.map(([k, l]) => (
            <Campo key={k} label={l}>
              <input className={input} type="number" step="0.1" min="0" inputMode="decimal" value={form[k]} onChange={e => set(k, e.target.value)} />
            </Campo>
          ))}
        </div>
        {vImc && <p className="text-sm">IMC: <b>{num(vImc)}</b> · {categoriaImc(vImc)}</p>}
        <Campo label="Notas"><textarea className={input} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {med.id && <button type="button" className={`${botonSec} text-red-600`} onClick={borrar}>Eliminar</button>}
          <button className={`${boton} flex-1`}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function SeguimientoTab({ paciente }) {
  const [meds, setMeds] = useState([]);
  const [med, setMed] = useState(null);
  const cargar = () => seg.getMediciones(paciente.id).then(setMeds).catch(() => {});
  useEffect(() => { cargar(); }, [paciente.id]);

  const tallaPrevia = meds.find(m => m.talla_cm)?.talla_cm;
  const conImc = meds.map(m => ({ ...m, imc: imc(Number(m.peso_kg), Number(m.talla_cm || tallaPrevia)) }));
  const usados = CAMPOS.filter(([k]) => meds.some(m => m[k] != null));
  return (
    <div className="space-y-4">
      <div className="flex"><button className={`${boton} ml-auto`} onClick={() => setMed({})}>+ Nueva medición</button></div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Grafica puntos={meds} campo="peso_kg" label="Peso (kg)" />
        <Grafica puntos={meds} campo="grasa_pct" label="% Grasa" />
        <Grafica puntos={meds} campo="cintura_cm" label="Cintura (cm)" />
        <Grafica puntos={conImc} campo="imc" label="IMC" />
      </div>
      <div className={`${tarjeta} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              {usados.map(([k, l]) => <th key={k} className="px-3 py-2 text-right whitespace-nowrap">{l}</th>)}
              <th className="px-3 py-2 text-right">IMC</th>
            </tr>
          </thead>
          <tbody>
            {conImc.map(m => (
              <tr key={m.id} className="border-t border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={() => setMed(m)}>
                <td className="px-3 py-2 whitespace-nowrap">{fecha(m.fecha)}</td>
                {usados.map(([k]) => <td key={k} className="px-3 py-2 text-right">{num(m[k])}</td>)}
                <td className="px-3 py-2 text-right whitespace-nowrap" title={categoriaImc(m.imc)}>{m.imc ? num(m.imc) : '—'}</td>
              </tr>
            ))}
            {!meds.length && <tr><td colSpan={usados.length + 2} className="px-3 py-8 text-center text-zinc-400">Sin mediciones</td></tr>}
          </tbody>
        </table>
      </div>
      {med && <MedicionModal pacienteId={paciente.id} med={med} tallaPrevia={tallaPrevia} onClose={(r) => { setMed(null); if (r) cargar(); }} />}
    </div>
  );
}
