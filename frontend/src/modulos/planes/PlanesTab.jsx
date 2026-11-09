import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boton, botonSec, tarjeta, errorDe } from '../../ui';
import { TIEMPOS_BASE, fechaLarga } from './comunes';
import * as planes from './api';

export default function PlanesTab({ paciente }) {
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cargar = () => planes.getPlanes(paciente.id).then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, [paciente.id]);

  async function nuevo() {
    try {
      const { id } = await planes.crearPlan(paciente.id, { fecha: new Date().toLocaleDateString('en-CA'), tiempos: TIEMPOS_BASE });
      navigate(`/planes/${id}`);
    } catch (e) { setError(errorDe(e)); }
  }
  async function duplicar(p) {
    try { const { id } = await planes.duplicarPlan(p.id); navigate(`/planes/${id}`); } catch (e) { setError(errorDe(e)); }
  }
  async function borrar(p) {
    if (!window.confirm(`¿Eliminar el plan del ${fechaLarga(p.fecha)}?`)) return;
    try { await planes.borrarPlan(p.id); cargar(); } catch (e) { setError(errorDe(e)); }
  }

  return (
    <div>
      <div className="flex mb-3"><button className={`${boton} ml-auto`} onClick={nuevo}>+ Nuevo plan</button></div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className={`${tarjeta} divide-y divide-zinc-100`}>
        {lista.map(p => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <Link to={`/planes/${p.id}`} className="flex-1 min-w-40 hover:underline">
              <span className="font-medium">{fechaLarga(p.fecha)}</span>{p.titulo && <span className="text-zinc-500"> · {p.titulo}</span>}
            </Link>
            <Link to={`/planes/${p.id}/imprimir`} className={botonSec}>Ver / imprimir</Link>
            <button className={botonSec} onClick={() => duplicar(p)} title="Copia este plan con fecha de hoy">Duplicar</button>
            <button className={`${botonSec} text-red-600`} onClick={() => borrar(p)}>Eliminar</button>
          </div>
        ))}
        {!lista.length && <p className="text-center text-zinc-400 py-8 text-sm">Sin planes. «Nuevo plan» trae los 6 tiempos de comida listos para llenar.</p>}
      </div>
    </div>
  );
}
