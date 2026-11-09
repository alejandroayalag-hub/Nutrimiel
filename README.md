# Nutrimiel

Personalización de **Mi Consul** para la Nutrióloga Laura Amiel Ramírez Mendoza (Nutrimiel · Miel Ramírez):
marca (logo en `frontend/public/logo.jpg`, color miel/café) y dos módulos de nutrición:

| Clave | Módulo |
|---|---|
| `seguimiento` | Mediciones por consulta (peso, talla, % grasa, músculo, agua, grasa visceral, cintura, cadera, brazo), IMC automático y gráficas de evolución. Pestaña en la ficha del paciente. |
| `planes` | Recetario de platillos con foto e ingredientes (alimento, cantidad, porción) y planes alimenticios por paciente con tiempos de comida, notas y vista de impresión/PDF con su formato. Duplicar plan para la siguiente consulta. |

`MODULOS=pacientes,agenda,seguimiento,planes,finanzas`. Fotos de platillos en `backend/uploads/platillos`.

---

## Base: Mi Consul

Plataforma para consultorios médicos, hecha sobre el núcleo de la Plataforma HAVOC (login, usuarios,
permisos por módulo, cargador de módulos). Cada consultorio es una **instalación propia** con su
nombre, color y módulos.

| Clave | Módulo |
|---|---|
| `pacientes` | Ficha del paciente + historia clínica (solo antecedentes: heredofamiliares, personales patológicos, medicamentos/alergias, no patológicos, gineco-obstétricos), imprimible. Base: HC-01 de Gioval sin valoraciones. |
| `agenda` | Citas por semana, estados (programada, confirmada, atendida, cancelada, no asistió), aviso de empalme. **Requiere `pacientes`** (ponerlo antes en `MODULOS`). |
| `finanzas` | Ingresos y gastos por mes, balance y totales por categoría. Cobro directo desde la cita y pagos en la ficha del paciente. |

`MODULOS=pacientes,agenda,finanzas` (el orden importa: las migraciones de agenda apuntan a pacientes).

## Local

```
cp backend/.env.example backend/.env   # solo si no existe; JWT_SECRET con openssl rand -hex 32
docker compose -p nutrimiel --env-file backend/.env up -d     # Postgres en 127.0.0.1:5453
cd backend && npm install && npm start                        # :3024, aplica migraciones
node src/scripts/seed_admin.js admin@cliente.com "Dr. Nombre" # imprime contraseña temporal
cd frontend && npm install && API_PORT=3024 npm run dev
```

## Servidor (Hetzner)

```
./instalar.sh <instancia> <puerto_backend> <puerto_db> <puerto_web> "<Consultorio>" "<#color>" "pacientes,agenda,finanzas" <email_admin> "<Nombre admin>"
./deploy.sh <instancia>
```

## Crear un módulo

- Backend: `backend/modulos/<clave>/index.js` exporta `{ nombre, router }`; tablas `<clave>_*` en `migrations/NNN_*.sql`. Se monta en `/api/<clave>` con sesión y permiso.
- Frontend: `frontend/src/modulos/<clave>/index.jsx` exporta `{ descripcion, Icono, menu, Rutas }`; se registra solo.
