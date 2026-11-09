import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getMediciones   = (pacienteId) => d(api.get(`/seguimiento/pacientes/${pacienteId}`));
export const crearMedicion   = (pacienteId, data) => d(api.post(`/seguimiento/pacientes/${pacienteId}`, data));
export const editarMedicion  = (id, data) => d(api.put(`/seguimiento/${id}`, data));
export const borrarMedicion  = (id) => d(api.delete(`/seguimiento/${id}`));
