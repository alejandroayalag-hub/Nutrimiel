// Menú para entregar al paciente, con el formato de Nutrimiel. Imprimir → "Guardar como PDF" para mandarlo por WhatsApp.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { boton } from '../../ui';
import { NUTRIOLOGA, Foto, lineaIngrediente, fechaLarga } from './comunes';
import { getPlan } from './api';

export default function PlanImprimirPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  useEffect(() => { getPlan(id).then(setPlan).catch(() => {}); }, [id]);
  if (!plan) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <Link to={`/planes/${plan.id}`} className="text-sm text-zinc-500 hover:underline flex-1">← Editar plan</Link>
        <button className={boton} onClick={() => { document.title = `Menú ${plan.paciente} ${plan.fecha.slice(0, 10)}`; window.print(); }}>Imprimir / PDF</button>
      </div>
      <article className="print-area menu-nutrimiel overflow-hidden bg-white mx-auto max-w-[800px] w-full shadow print:shadow-none text-zinc-800">
        <header className="relative h-28 overflow-hidden" style={{ background: '#3F1D0B' }}>
          <div className="absolute inset-y-0 left-0 w-2/5" style={{ background: '#FFC502', clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }} />
          <p className="absolute left-5 top-1/2 -translate-y-1/2 w-56 text-sm font-semibold italic" style={{ color: '#3F1D0B' }}>{NUTRIOLOGA}</p>
          <img src="/logo.jpg" alt="Nutrimiel" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white object-contain p-1 border-4 border-white" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-right text-white">
            <p className="text-xl font-semibold uppercase tracking-wide">{plan.paciente}</p>
            {plan.titulo && <p className="text-xs opacity-80">{plan.titulo}</p>}
          </div>
        </header>
        <p className="text-center text-zinc-500 mt-4">{fechaLarga(plan.fecha)}</p>

        <div className="px-8 pb-8">
          {plan.tiempos.filter(t => t.platillos.length || t.nota).map((t, i) => (
            <section key={i} className="mt-6 break-inside-avoid-page">
              <h2 className="text-lg text-zinc-500 border-b-2 pb-0.5 mb-3" style={{ borderColor: '#FFC502' }}>
                {t.nombre}{t.hora && ` (${t.hora})`}
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {t.platillos.map((p, j) => (
                  <div key={j} className="flex gap-3 break-inside-avoid">
                    <Foto foto={p.foto} className="w-20 h-20 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="uppercase border-b border-zinc-200 pb-0.5 mb-1">{p.nombre}</p>
                      {p.ingredientes.map((ing, k) => <p key={k} className="leading-snug">{lineaIngrediente(ing)}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              {t.nota && <p className="mt-3 text-sm italic border border-zinc-100 rounded px-3 py-2">Nota: {t.nota}</p>}
            </section>
          ))}
          {plan.notas && (
            <section className="mt-8 break-inside-avoid">
              <h2 className="text-lg text-zinc-500 border-b-2 pb-0.5 mb-2" style={{ borderColor: '#FFC502' }}>Indicaciones</h2>
              <p className="text-sm whitespace-pre-line">{plan.notas}</p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
