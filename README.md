<<<<<<< HEAD
# Amigo Secreto — Despliegue gratis

Este proyecto es una app de Next.js (App Router) con rutas de API en `app/api/*`.
La forma más fácil y gratuita de hospedarlo es con Vercel (plan Hobby $0), que soporta Next.js nativamente, incluidas Server Components y Serverless Functions.

## Desarrollo en Windows (pnpm)

En este proyecto, Turbopack puede fallar en Windows cuando la ruta del proyecto contiene espacios (por ejemplo, `Proyecto AS`). Para evitarlo, la tarea de desarrollo usa Webpack por defecto.

## Opción recomendada: Vercel (gratis)

### Requisitos
- Cuenta gratuita en Vercel: https://vercel.com/signup
- Código en un repositorio (GitHub recomendado)

### Despliegue conectando el repo (GUI)
1. Sube este proyecto a GitHub (público o privado).
2. En Vercel, haz clic en “Add New…” → “Project” y conecta tu cuenta de GitHub.
3. Importa el repo y acepta los valores por defecto:
   - Framework: Next.js
   - Comando de build: `next build`
   - Directorio de salida: (deja en blanco para Next.js)
4. Haz clic en “Deploy”. Al terminar, tendrás una URL pública gratuita.

Notas importantes:
- Vercel usa Node.js 18/20 por defecto, compatible con Next 16.
- Las rutas de API (`app/api/...`) se despliegan como Serverless Functions.
- Para que los enlaces funcionen entre dispositivos, se requiere persistencia. Este repo ya usa Vercel KV (free tier) si está configurado; de lo contrario, cae en memoria y los enlaces pueden decir "Sesión no encontrada".

### Activar persistencia con Vercel KV (gratis)
1. En el proyecto en Vercel, ve a Integrations → busca "KV" e instálala (Vercel KV by Upstash).
2. Acepta crear la base gratis y añadir variables de entorno.
3. Vuelve a desplegar. No necesitas código extra: la app detecta KV automáticamente.

#### Si ves “Sesión no encontrada” al abrir el enlace
- En Vercel, sin KV, los datos se guardan solo en memoria de la función que creó la sesión. Al abrir el enlace, otra función diferente intenta leer y no encuentra nada → aparece el mensaje.
- Solución: habilita Vercel KV como arriba. Verifica que existan estas variables en Project Settings → Environment Variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_URL` (opcional)
- Con eso, las sesiones se persisten y los enlaces funcionan entre dispositivos y después de un redeploy.

### Despliegue desde tu PC (CLI)
Si prefieres desplegar sin GitHub, usa la CLI de Vercel.

Instala la CLI globalmente:

```powershell
npm i -g vercel
# o con pnpm
# pnpm add -g vercel
```

Autentícate e inicia el proyecto:

```powershell
vercel login
vercel
```

Para un despliegue de producción:

```powershell
vercel --prod
```

La CLI te devolverá la URL del sitio.

## Alternativas 100% gratis
- Cloudflare Pages: funciona bien con Next.js, pero para rutas de API SSR puede requerir adaptador (next-on-pages). Ideal si la app es principalmente estática.
- Netlify: soporta Next.js; para API/SSR usa funciones de Netlify. Sencillo si ya usas Netlify.
- GitHub Pages: estático puro (no soporta API/SSR) → no recomendable para este proyecto con `app/api`.

## Solución de problemas
- Build falla con Next/React muy nuevos: asegúrate de usar Node 18 o 20, y que el bloque `scripts` tenga `build`, `dev`, `start`.
- Estilos/Tailwind no aplican: verifica que `globals.css` esté importado en `app/layout.tsx` y que Tailwind esté configurado (ya lo está en este repo).
- Rutas de API dan 404: confirma que el árbol es `app/api/.../route.ts` y que exportas `GET/POST` correctamente.
- Error “Sesión no encontrada”: desde 29/10/2025 las rutas `/api/sessions/[id]` y derivadas fueron corregidas para esperar los datos del store y no cachear respuestas. Aun así, necesitas KV para persistencia en Vercel.

## Comandos útiles (local)
```powershell
pnpm install
pnpm dev   # iniciar en http://localhost:3000
pnpm build # compilar para producción
pnpm start # ejecutar build localmente
```

## Instrucciones para desarrollo en Windows

- Iniciar en desarrollo (Webpack):

   PowerShell
   ```powershell
   pnpm run dev
   ```

- Intentar con Turbopack (opcional):

   ```powershell
   pnpm run dev:turbo
   ```

- Compilar para producción (Webpack):

   ```powershell
   pnpm run build
   ```

Si deseas usar Turbopack siempre, mueve el proyecto a una ruta sin espacios o mantén `pnpm run dev:turbo` y asegúrate de tener Next.js 16.0.1+.
```

---
=======
# Amigo Secreto — Despliegue gratis

Este proyecto es una app de Next.js (App Router) con rutas de API en `app/api/*`.
La forma más fácil y gratuita de hospedarlo es con Vercel (plan Hobby $0), que soporta Next.js nativamente, incluidas Server Components y Serverless Functions.

## Opción recomendada: Vercel (gratis)

### Requisitos
- Cuenta gratuita en Vercel: https://vercel.com/signup
- Código en un repositorio (GitHub recomendado)

### Despliegue conectando el repo (GUI)
1. Sube este proyecto a GitHub (público o privado).
2. En Vercel, haz clic en “Add New…” → “Project” y conecta tu cuenta de GitHub.
3. Importa el repo y acepta los valores por defecto:
   - Framework: Next.js
   - Comando de build: `next build`
   - Directorio de salida: (deja en blanco para Next.js)
4. Haz clic en “Deploy”. Al terminar, tendrás una URL pública gratuita.

Notas importantes:
- Vercel usa Node.js 18/20 por defecto, compatible con Next 16.
- Las rutas de API (`app/api/...`) se despliegan como Serverless Functions.
- Para que los enlaces funcionen entre dispositivos, se requiere persistencia. Este repo ya usa Vercel KV (free tier) si está configurado; de lo contrario, cae en memoria y los enlaces pueden decir "Sesión no encontrada".

### Activar persistencia con Vercel KV (gratis)
1. En el proyecto en Vercel, ve a Integrations → busca "KV" e instálala (Vercel KV by Upstash).
2. Acepta crear la base gratis y añadir variables de entorno.
3. Vuelve a desplegar. No necesitas código extra: la app detecta KV automáticamente.

#### Si ves “Sesión no encontrada” al abrir el enlace
- En Vercel, sin KV, los datos se guardan solo en memoria de la función que creó la sesión. Al abrir el enlace, otra función diferente intenta leer y no encuentra nada → aparece el mensaje.
- Solución: habilita Vercel KV como arriba. Verifica que existan estas variables en Project Settings → Environment Variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_URL` (opcional)
- Con eso, las sesiones se persisten y los enlaces funcionan entre dispositivos y después de un redeploy.

### Despliegue desde tu PC (CLI)
Si prefieres desplegar sin GitHub, usa la CLI de Vercel.

Instala la CLI globalmente:

```powershell
npm i -g vercel
# o con pnpm
# pnpm add -g vercel
```

Autentícate e inicia el proyecto:

```powershell
vercel login
vercel
```

Para un despliegue de producción:

```powershell
vercel --prod
```

La CLI te devolverá la URL del sitio.

## Alternativas 100% gratis
- Cloudflare Pages: funciona bien con Next.js, pero para rutas de API SSR puede requerir adaptador (next-on-pages). Ideal si la app es principalmente estática.
- Netlify: soporta Next.js; para API/SSR usa funciones de Netlify. Sencillo si ya usas Netlify.
- GitHub Pages: estático puro (no soporta API/SSR) → no recomendable para este proyecto con `app/api`.

## Solución de problemas
- Build falla con Next/React muy nuevos: asegúrate de usar Node 18 o 20, y que el bloque `scripts` tenga `build`, `dev`, `start`.
- Estilos/Tailwind no aplican: verifica que `globals.css` esté importado en `app/layout.tsx` y que Tailwind esté configurado (ya lo está en este repo).
- Rutas de API dan 404: confirma que el árbol es `app/api/.../route.ts` y que exportas `GET/POST` correctamente.
- Error “Sesión no encontrada”: desde 29/10/2025 las rutas `/api/sessions/[id]` y derivadas fueron corregidas para esperar los datos del store y no cachear respuestas. Aun así, necesitas KV para persistencia en Vercel.

## Comandos útiles (local)
```powershell
pnpm install
pnpm dev   # iniciar en http://localhost:3000
pnpm build # compilar para producción
pnpm start # ejecutar build localmente
```

---
>>>>>>> 6e715b8b (cambios)
¿Quieres que lo deje desplegado ya con Vercel? Puedo guiarte paso a paso o preparar el repo para conectar y publicar en un par de minutos.