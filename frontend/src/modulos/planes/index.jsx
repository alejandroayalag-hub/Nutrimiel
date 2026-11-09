import { Routes, Route, Navigate } from 'react-router-dom';
import { Salad } from 'lucide-react';
import PlatillosPage from './PlatillosPage';
import PlanEditorPage from './PlanEditorPage';
import PlanImprimirPage from './PlanImprimirPage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<PlatillosPage />} />
      <Route path=":id" element={<PlanEditorPage />} />
      <Route path=":id/imprimir" element={<PlanImprimirPage />} />
      <Route path="*" element={<Navigate to="/planes" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Recetario de platillos y menús por paciente para imprimir',
  Icono: Salad,
  menu: [{ to: '/planes', label: 'Platillos' }],
  Rutas,
};
