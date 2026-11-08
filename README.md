# juampiacosta.ai · Biblioteca

Biblioteca paga de recursos para armar sistemas con Claude: guías paso a paso, prompts, skills, MCP y herramientas.
Web estática + una función (`api/entrar.js`) + `middleware.js`, en Vercel.

## Cómo está armada

| Qué | Dónde |
|---|---|
| Texto de las guías | `contenido/guias.py` (una llamada `guia(...)` por guía) |
| Precio y link de pago | `contenido/config.json` |
| Prompts, skills/MCP/herramientas, rutas, redes | `web/prompts.js`, `web/herramientas.js`, `web/rutas.js`, `web/redes.js` |
| Diseño | `web/*.css`, `web/menu.js`, `web/guia.js`, `web/comun.js` |
| Plantillas | `web/inicio.html` → `index.html`, `web/recursos.html` → `recursos.html`, `web/guia.html` → `guias/<slug>.html` |

Después de cambiar cualquier cosa: `python3 build.py` (o `npm run construir`) y subir los archivos generados (`index.html`, `recursos.html`, `guias/`, `web/guias-web.*`).

## Sumar una guía

1. Copiá un bloque `guia(...)` en `contenido/guias.py` y cambiá el texto. Si viene de un reel, poné `post="PALABRA"`.
2. Si querés que esté en una ruta, sumá su `slug` en `web/rutas.js`.
3. `python3 build.py`, revisá en el navegador (`python3 -m http.server`) y subilo.

## Plan gratis (registro con email)

- En el inicio, «Empezá gratis» pide nombre y email (`api/registro.js`). El registro se guarda en la tabla `registros` de Supabase.
- Quien se registra abre las guías de los reels (las que tienen palabra clave) y el Módulo 1 del sistema base. El resto lo ve bloqueado.
  La lista sale sola de `build.py` (`es_gratis`) y queda en `lib/gratis.js`.
- Prompts y herramientas: el plan gratis ve títulos y descripciones; el texto y los comandos, solo el pago (`web/*-vista.js`).
- Para crear la tabla: correr `supabase/registros.sql` en el SQL Editor de tu proyecto de Supabase (una vez).
- Variables en Vercel: `SUPABASE_URL` (Project Settings → API → Project URL) y `SUPABASE_SECRET_KEY` (Project Settings → API Keys → Secret keys, empieza con `sb_secret_`; la vieja `SUPABASE_SERVICE_ROLE_KEY` también funciona)
  (la clave secreta service_role: solo en Vercel, nunca en el código ni en el navegador).

## Acceso (quién entra)

- Sin acceso se ve solo la página de inicio. La biblioteca, las guías y sus datos piden la cookie firmada.
- El comprador escribe su clave en «Ya compré» y entra (`api/entrar.js`).
- Variables en Vercel (Settings → Environment Variables):
  - `ACCESS_SECRET`: un texto largo al azar (por ejemplo, el resultado de `openssl rand -hex 32`). Si lo cambiás, todos tienen que volver a entrar con su clave.
  - `CLAVES_ACCESO`: las claves válidas separadas por comas, por ejemplo `FUNDADOR-7K2P,FUNDADOR-9X4M`.
- Para cortar una clave que se filtró: sacala de `CLAVES_ACCESO`.

## Cobrar

- `contenido/config.json` → `pago_url`: el link de pago (Mercado Pago, Hotmart, Stripe…). Mientras esté vacío, el botón lleva al DM de Instagram.
- En la plataforma de pago, poné la clave en el mensaje o el mail de después de la compra.

## Probar

`npm test` (entrada con clave y cookie firmada). Para ver la web: `python3 -m http.server 4321` y abrir http://localhost:4321 (en local no hay middleware: se ve todo).

## Formulario de bienvenida

Quien se registra gratis entra a /recursos y le aparece un formulario animado de 7 preguntas (web/bienvenida.js y .css):
qué hace, rubro, nivel con IA, objetivo, qué quiere resolver primero, si está para invertir, país y WhatsApp. Guarda en la fila de su email por /api/perfil
al cerrar cada bloque y al terminar, y al final le recomienda una ruta. Las opciones válidas están en lib/perfil.js.
Para verlo de nuevo: /recursos?bienvenida=1. Los que eligieron «Que me lo instalen en mi negocio» son clientes para instalación.

## Orden de la biblioteca y recomendados

- `contenido/orden.json` define las 3 partes y las 13 categorías, y en qué orden va cada guía y cada pack de prompts.
  Una guía nueva tiene que sumarse ahí o la construcción falla (así nada queda suelto).
- Con las respuestas del formulario, `web/recomendados.js` arma «Recomendados para vos» arriba de todo en Inicio:
  9 guías elegidas (por rubro, por lo que quiere resolver, objetivo, situación y nivel, y siempre una para gastar menos tokens), su ruta y packs de prompts.
