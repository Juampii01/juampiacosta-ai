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
