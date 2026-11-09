import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getPlatillos    = (q) => d(api.get('/planes/platillos', { params: { q } }));
export const crearPlatillo   = (data) => d(api.post('/planes/platillos', data));
export const editarPlatillo  = (id, data) => d(api.put(`/planes/platillos/${id}`, data));
export const borrarPlatillo  = (id) => d(api.delete(`/planes/platillos/${id}`));
export const subirFoto = (archivo) => {
  const fd = new FormData();
  fd.append('foto', archivo);
  return d(api.post('/planes/fotos', fd)).then(r => r.foto);
};
export const getPlanes       = (pacienteId) => d(api.get(`/planes/pacientes/${pacienteId}`));
export const getPlan         = (id) => d(api.get(`/planes/${id}`));
export const crearPlan       = (pacienteId, data) => d(api.post(`/planes/pacientes/${pacienteId}`, data));
export const editarPlan      = (id, data) => d(api.put(`/planes/${id}`, data));
export const duplicarPlan    = (id) => d(api.post(`/planes/${id}/duplicar`, {}));
export const borrarPlan      = (id) => d(api.delete(`/planes/${id}`));
