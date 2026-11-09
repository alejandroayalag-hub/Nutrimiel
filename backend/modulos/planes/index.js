// Módulo Planes alimenticios: catálogo de platillos (con foto) y menús por paciente para imprimir. Requiere pacientes.
// Las fotos de platillos se sirven sin sesión (las usa el menú impreso); no son datos del paciente.
module.exports = {
  nombre: 'Planes alimenticios',
  router: require('./rutas'),
  publico: require('./publico'),
};
