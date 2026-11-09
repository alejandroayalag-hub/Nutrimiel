import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe } from '../../ui';
import { FotoPicker, IngredientesEditor, Foto, lineaIngrediente } from './comunes';
import * as planes from './api';

const mover = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function ElegirPlatillo({ onElegir, onClose }) {
  const [q, setQ] = useState('');
  const [lista, setLista] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => planes.getPlatillos(q).then(setLista).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Modal titulo="Agregar del recetario" onClose={onClose} ancho="max-w-lg">
      <input className={`${input} mb-3`} autoFocus placeholder="Buscar platillo" value={q} onChange={e => setQ(e.target.value)} />
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {lista.map(p => (
          <button key={p.id} className="flex gap-3 w-full text-left p-2 rounded-lg hover:bg-zinc-50" onClick={() => onElegir(p)}>
            <Foto foto={p.foto} className="w-12 h-12 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium uppercase">{p.nombre}</span>
              <span className="block text-xs text-zinc-500 truncate">{p.ingredientes.map(lineaIngrediente).join(' · ')}</span>
            </span>
          </button>
        ))}
        {!lista.length && <p className="text-sm text-zinc-400 text-center py-6">Sin resultados. Créalo en «Platillos» o usa «Platillo nuevo».</p>}
      </div>
    </Modal>
  );
}

export default function PlanEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [cambios, setCambios] = useState(false);
  const [error, setError] = useState('');
  const [eligiendo, setEligiendo] = useState(null); // índice del tiempo

  useEffect(() => { planes.getPlan(id).then(p => { setPlan(p); setCambios(false); }).catch(() => setError('No se encontró el plan')); }, [id]);
  if (!plan) return error ? <p className="text-red-600">{error}</p> : null;

  const set = (k, v) => { setPlan(p => ({ ...p, [k]: v })); setCambios(true); };
  const setTiempo = (i, k, v) => set('tiempos', plan.tiempos.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const setPlatillo = (ti, pi, k, v) => setTiempo(ti, 'platillos', plan.tiempos[ti].platillos.map((p, j) => (j === pi ? { ...p, [k]: v } : p)));

  async function guardar(ir) {
    setError('');
    try {
      await planes.editarPlan(plan.id, plan);
      setCambios(false);
      if (ir) navigate(ir);
    } catch (e) { setError(errorDe(e)); }
  }
  async function alCatalogo(p) {
    try { await planes.crearPlatillo(p); window.alert(`«${p.nombre}» guardado en tu recetario`); }
    catch (e) { setError(errorDe(e)); }
  }

  return (
    <div className="pb-20">
      <Link to={`/pacientes/${plan.paciente_id}`} className="text-sm text-zinc-500 hover:underline">← {plan.paciente}</Link>
      <div className="flex flex-wrap items-end gap-3 mt-1 mb-4">
        <h1 className="text-2xl font-bold flex-1">Plan alimenticio</h1>
        <button className={botonSec} onClick={() => guardar(`/planes/${plan.id}/imprimir`)}>Vista para imprimir</button>
        <button className={boton} disabled={!cambios} onClick={() => guardar()}>{cambios ? 'Guardar' : 'Guardado'}</button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className={`${tarjeta} p-4 mb-4 grid sm:grid-cols-[10rem_1fr] gap-3`}>
        <Campo label="Fecha"><input className={input} type="date" value={plan.fecha.slice(0, 10)} onChange={e => set('fecha', e.target.value)} /></Campo>
        <Campo label="Título (opcional)"><input className={input} placeholder="Ej. Semana 1 · Plan reducción" value={plan.titulo || ''} onChange={e => set('titulo', e.target.value)} /></Campo>
      </div>

      <div className="space-y-4">
        {plan.tiempos.map((t, ti) => (
          <section key={ti} className={`${tarjeta} p-4`}>
            <div className="flex flex-wrap gap-2 items-end mb-3">
              <div className="flex-1 min-w-40"><Campo label="Tiempo de comida"><input className={`${input} font-semibold`} value={t.nombre} onChange={e => setTiempo(ti, 'nombre', e.target.value)} /></Campo></div>
              <div className="w-28"><Campo label="Hora"><input className={input} type="time" value={t.hora} onChange={e => setTiempo(ti, 'hora', e.target.value)} /></Campo></div>
              <button className={botonSec} aria-label="Subir" onClick={() => set('tiempos', mover(plan.tiempos, ti, -1))}><ArrowUp className="w-4 h-4" /></button>
              <button className={botonSec} aria-label="Bajar" onClick={() => set('tiempos', mover(plan.tiempos, ti, 1))}><ArrowDown className="w-4 h-4" /></button>
              <button className={`${botonSec} text-red-600`} aria-label="Quitar tiempo"
                      onClick={() => (!t.platillos.length || window.confirm(`¿Quitar ${t.nombre} con sus platillos?`)) && set('tiempos', plan.tiempos.filter((_, j) => j !== ti))}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {t.platillos.map((p, pi) => (
                <div key={pi} className="border border-zinc-200 rounded-lg p-3">
                  <div className="flex gap-3 items-start mb-2">
                    <FotoPicker foto={p.foto} onChange={f => setPlatillo(ti, pi, 'foto', f)} />
                    <input className={`${input} uppercase font-medium`} placeholder="Nombre del platillo" value={p.nombre} onChange={e => setPlatillo(ti, pi, 'nombre', e.target.value)} />
                    <button className="text-zinc-400 hover:text-red-600 p-2" aria-label="Quitar platillo"
                            onClick={() => setTiempo(ti, 'platillos', t.platillos.filter((_, j) => j !== pi))}><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <IngredientesEditor value={p.ingredientes} onChange={v => setPlatillo(ti, pi, 'ingredientes', v)} />
                  {p.nombre && <button className="text-xs text-zinc-500 hover:underline mt-2" onClick={() => alCatalogo(p)}>Guardar en mi recetario</button>}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button className={botonSec} onClick={() => setEligiendo(ti)}>+ Del recetario</button>
              <button className={botonSec} onClick={() => setTiempo(ti, 'platillos', [...t.platillos, { nombre: '', foto: null, ingredientes: [{ alimento: '', cantidad: '', porcion: '' }] }])}>+ Platillo nuevo</button>
            </div>
            <div className="mt-3"><Campo label="Nota (opcional)"><input className={input} placeholder="Ej. Las tortillas las puede cambiar por 1 reb de pan de caja integral" value={t.nota} onChange={e => setTiempo(ti, 'nota', e.target.value)} /></Campo></div>
          </section>
        ))}
        <button className={`${botonSec} w-full`} onClick={() => set('tiempos', [...plan.tiempos, { nombre: '', hora: '', nota: '', platillos: [] }])}>+ Tiempo de comida</button>
        <div className={`${tarjeta} p-4`}>
          <Campo label="Indicaciones generales (salen al final del menú)">
            <textarea className={input} rows={3} value={plan.notas || ''} onChange={e => set('notas', e.target.value)} />
          </Campo>
        </div>
      </div>

      {cambios && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 print:hidden">
          <span className="text-sm text-amber-700">Cambios sin guardar</span>
          <button className={`${boton} rounded-full`} onClick={() => guardar()}>Guardar</button>
        </div>
      )}
      {eligiendo != null && (
        <ElegirPlatillo onClose={() => setEligiendo(null)} onElegir={(p) => {
          setTiempo(eligiendo, 'platillos', [...plan.tiempos[eligiendo].platillos, { nombre: p.nombre, foto: p.foto, ingredientes: p.ingredientes }]);
          setEligiendo(null);
        }} />
      )}
    </div>
  );
}
