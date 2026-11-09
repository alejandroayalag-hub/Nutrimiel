import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe } from '../../ui';
import { Foto, FotoPicker, IngredientesEditor, lineaIngrediente } from './comunes';
import * as planes from './api';

export function PlatilloModal({ platillo, onClose }) {
  const [form, setForm] = useState({ nombre: platillo.nombre || '', foto: platillo.foto || null, ingredientes: platillo.ingredientes || [] });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  async function guardar(e) {
    e.preventDefault();
    try {
      onClose(platillo.id ? await planes.editarPlatillo(platillo.id, form) : await planes.crearPlatillo(form));
    } catch (err) { setError(errorDe(err)); }
  }
  async function borrar() {
    if (!window.confirm('¿Quitar del catálogo? Los menús ya hechos no cambian.')) return;
    try { await planes.borrarPlatillo(platillo.id); onClose(true); } catch (err) { setError(errorDe(err)); }
  }
  return (
    <Modal titulo={platillo.id ? 'Editar platillo' : 'Nuevo platillo'} onClose={() => onClose(null)} ancho="max-w-xl">
      <form onSubmit={guardar} className="space-y-3">
        <div className="flex gap-3 items-end">
          <FotoPicker foto={form.foto} onChange={f => set('foto', f)} />
          <div className="flex-1">
            <Campo label="Nombre *"><input className={`${input} uppercase`} required autoFocus value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Campo>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Ingredientes (alimento · cantidad · porción)</p>
          <IngredientesEditor value={form.ingredientes} onChange={v => set('ingredientes', v)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {platillo.id && <button type="button" className={`${botonSec} text-red-600`} onClick={borrar}>Quitar</button>}
          <button className={`${boton} flex-1`}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function PlatillosPage() {
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState('');
  const [platillo, setPlatillo] = useState(null);
  const cargar = () => planes.getPlatillos(q).then(setLista).catch(() => {});
  useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [q]);

  return (
    <div>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold flex-1">Platillos</h1>
        <button className={boton} onClick={() => setPlatillo({})}>+ Nuevo platillo</button>
      </div>
      <p className="text-sm text-zinc-500 mb-3">Tu recetario: los platillos que guardes aquí los agregas a cualquier menú con un clic.</p>
      <input className={`${input} mb-3`} placeholder="Buscar platillo" value={q} onChange={e => setQ(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map(p => (
          <button key={p.id} onClick={() => setPlatillo(p)} className={`${tarjeta} p-3 flex gap-3 text-left hover:border-zinc-400`}>
            <Foto foto={p.foto} />
            <div className="min-w-0">
              <p className="font-medium uppercase text-sm">{p.nombre}</p>
              <p className="text-xs text-zinc-500 line-clamp-3">{p.ingredientes.map(lineaIngrediente).join(' · ')}</p>
            </div>
          </button>
        ))}
        {!lista.length && <p className="text-zinc-400 text-sm py-8 col-span-full text-center">Sin platillos</p>}
      </div>
      {platillo && <PlatilloModal platillo={platillo} onClose={(r) => { setPlatillo(null); if (r) cargar(); }} />}
    </div>
  );
}
