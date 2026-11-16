# RACKETON 0.1

Primera versión del producto privado RACKETON: interfaz roja y blanca, navegación responsive, PWA y autenticación por correo con Supabase. Las secciones de ranking, torneos, reservas y jugadores son **pantallas de preparación**, todavía no ofrecen operaciones reales. No introducir datos personales de menores en el piloto.

## 1. Requisitos

Node.js 20.19+ o 22.12+ y npm. Una cuenta GitHub y, para autenticación, un proyecto Supabase.

## 2. Ejecutar en tu ordenador

```bash
npm install
cp .env.example .env
npm run dev
```

En Windows, copia manualmente `.env.example` como `.env`. Abre la URL que indique Vite (habitualmente http://localhost:5173).

## 3. Activar Supabase

1. Crea un proyecto en https://supabase.com/dashboard.
2. En SQL Editor ejecuta `supabase/migrations/0001_initial.sql` una vez.
3. En Project Settings / API (o Connect, según la versión del panel), copia **Project URL** y **publishable key** (también puede aparecer como `anon` key).
4. Introduce ambos valores en `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. En Authentication / URL Configuration configura la URL del sitio de desarrollo y después la URL pública definitiva. Revisa si quieres exigir confirmación por correo.
6. Reinicia `npm run dev`. Registro e inicio de sesión se activarán.

**Nunca** uses `service_role` ni claves secretas en variables `VITE_`. No subas `.env` a GitHub.

## 4. Publicar con GitHub y Vercel

1. Crea repositorio **privado** `racketon-app` en GitHub.
2. Sube los archivos del proyecto (el contenido de esta carpeta, no la carpeta contenedora). También puedes usar `git init`, `git add .`, `git commit -m "RACKETON 0.1"` y `git push` con el remoto de tu repositorio.
3. En https://vercel.com/new importa el repositorio. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
4. Añade en Vercel las dos variables de entorno de Supabase y vuelve a desplegar.
5. En Supabase Authentication configura la URL de Vercel como Site URL y añade URLs de redirección autorizadas cuando sea necesario.
6. Comprueba registro, confirmación de correo, login y logout en la URL pública.

## 5. Compilar

```bash
npm run build
npm run preview
```

## 6. Límites de esta versión

- No hay todavía rating Glicko-2, resultados, ranking público, cuadros automáticos ni reservas reales.
- El esquema SQL incluye entidades de futuro, pero las políticas RLS restringen por defecto las tablas no habilitadas.
- La PWA se puede instalar desde navegadores compatibles; en iPhone la instalación se hace desde Compartir > Añadir a pantalla de inicio.
- Antes de abrir al público: revisión de RGPD, condiciones, protección de menores, accesibilidad y pruebas de seguridad.
- RACKETON es un nombre de trabajo sujeto a verificación registral; no es una aplicación oficial de ninguna federación.
