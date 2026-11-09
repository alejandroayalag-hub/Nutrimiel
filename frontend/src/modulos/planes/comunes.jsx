import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Utensils } from 'lucide-react';
import { input, errorDe } from '../../ui';
import { subirFoto } from './api';

// Personalización Nutrimiel: firma del menú impreso
export const NUTRIOLOGA = 'Nutrióloga Laura Amiel Ramírez Mendoza';
export const TIEMPOS_BASE = [
  ['Al despertar', '08:30'], ['Desayuno', '09:00'], ['Medio día', '12:00'],
  ['Comida', '15:30'], ['Media tarde', '17:00'], ['Cena', '19:30'],
].map(([nombre, hora]) => ({ nombre, hora, nota: '', platillos: [] }));

export const fotoUrl = (f) => `/api/planes/publico/fotos/${f}`;
export const lineaIngrediente = (i) => [i.alimento, i.cantidad, i.porcion].filter(Boolean).join(', ');
export const fechaLarga = (v) => new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

export function Foto({ foto, className = "w-16 h-16 shrink-0" }) {
  return foto
    ? <img src={fotoUrl(foto)} alt="" className={`${className} object-cover rounded-lg`} />
    : <div className={`${className} rounded-lg bg-amber-50 flex items-center justify-center`}><Utensils className="w-5 h-5 text-amber-300" /></div>;
}

export function FotoPicker({ foto, onChange }) {
  const ref = useRef();
  const [subiendo, setSubiendo] = useState(false);
  async function elegir(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setSubiendo(true);
    try { onChange(await subirFoto(f)); } catch (err) { window.alert(errorDe(err, 'No se pudo subir la foto')); }
    setSubiendo(false);
  }
  return (
    <button type="button" onClick={() => ref.current.click()} title="Cambiar foto"
            className="relative shrink-0 group" disabled={subiendo}>
      <Foto foto={foto} />
      <span className="absolute inset-0 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center">
        <ImagePlus className="w-5 h-5" />
      </span>
      {subiendo && <span className="absolute inset-0 rounded-lg bg-white/70 text-xs flex items-center justify-center">Subiendo…</span>}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegir} />
    </button>
  );
}

// Ingredientes como en su menú: "Huevo entero fresco, 100g, 2 piezas"
export function IngredientesEditor({ value, onChange }) {
  const set = (i, k, v) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const chico = `${input} py-1.5`;
  return (
    <div className="space-y-1.5">
      {value.map((ing, i) => (
        <div key={i} className="grid grid-cols-[1fr_5rem_7rem_auto] gap-1.5 items-center">
          <input className={chico} placeholder="Alimento" value={ing.alimento} onChange={e => set(i, 'alimento', e.target.value)} />
          <input className={chico} placeholder="100g" value={ing.cantidad} onChange={e => set(i, 'cantidad', e.target.value)} />
          <input className={chico} placeholder="2 piezas" value={ing.porcion} onChange={e => set(i, 'porcion', e.target.value)} />
          <button type="button" aria-label="Quitar ingrediente" className="text-zinc-400 hover:text-red-600 p-1"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" className="text-sm text-[var(--acento)] hover:underline"
              onClick={() => onChange([...value, { alimento: '', cantidad: '', porcion: '' }])}>+ Ingrediente</button>
    </div>
  );
}
