## Qué es

Web Creator 360 es un panel web (Node.js + Express + Supabase) para conseguir clientes que necesitan una web. Tiene dos flujos:

- **Google Maps**: buscas negocios con Google Places, Claude lee su información y les escribe una web, se publica (en Vercel o como preview propia), se les manda un email con Resend y pueden pagar la web con Stripe ($497 por defecto).
- **LLCs nuevas (Connecticut)**: baja empresas recién registradas del registro público de Connecticut (data.ct.gov), o las importas por CSV, y las manda a una campaña de **Instantly**, que es quien envía los emails. Opcionalmente, a cada lead se le crea una web demo antes del email.

Lo que vendes: webs listas para negocios locales de EE. UU., con prospección y envío casi automáticos.

> Viene **apagado y en modo prueba** a propósito: el panel está bloqueado hasta que pongas usuario y contraseña, y con `OUTREACH_DRY_RUN=true` no sale ningún email real.

## Qué necesitas

| Cuenta | ¿Obligatoria? | Para qué |
|---|---|---|
| **GitHub** | Sí | Render despliega desde tu repo. |
| **Supabase** | Sí | Base de datos. |
| **Render** | Sí | Hosting. El `render.yaml` usa el plan `starter` (de pago) en los dos servicios. |
| **Anthropic** | Sí para crear webs | Claude Haiku lee el perfil del negocio y Claude Sonnet escribe la web. El código estima unos $0.25–0.30 por web completa. |
| **Google Places** | Para el flujo Google Maps | Búsqueda de negocios. No hace falta para LLCs. |
| **Resend** | Para el flujo Google Maps | Envío de emails y seguimientos. La campaña de LLCs no lo usa. |
| **Instantly** | Para la campaña de LLCs | Envía los emails de la campaña (API v2, sirve cualquier plan, incluida la prueba gratis). |
| **Vercel** | Opcional | Publica las webs. Sin Vercel queda una preview en `TU_BASE_URL/preview/<slug>`. Obligatorio para las webs demo de LLCs. |
| **Stripe** | Opcional | Cobro por web (checkout + webhook). |
| **Telegram** | Opcional | Avisos al celular cuando un lead pide llamada o responde. |

Para probarlo en tu computadora necesitas **Node.js 20 o superior**. Si vas a correr los tests (`npm test`), usa **Node.js 24**.

## 1. Descarga y súbelo a tu GitHub

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo.
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `web-creator-360`.
3. Abre una terminal dentro de la carpeta descomprimida y corre:

```bash
git init
git add .
git commit -m "Web Creator 360"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/web-creator-360.git
git push -u origin main
```

Los comandos son iguales en macOS, Linux y Windows (PowerShell). Si prefieres no usar la terminal, [GitHub Desktop](https://desktop.github.com) también sirve: **File → Add local repository**, elige la carpeta y publícala como privada.

> Nunca subas el archivo `.env` ni CSV con leads. El `.gitignore` ya los excluye: no lo fuerces. Antes del commit puedes revisar con `git status` que `.env` no aparezca.

## 2. Crea la base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor**. Vas a correr 3 archivos del repo **en este orden**: abres el archivo, copias todo, lo pegas y aprietas **Run**.
3. Primero `src/db/schema.sql` (tablas base).
4. Después `src/db/schema-saas.sql`.
5. Por último `src/db/schema-new-business-leads.sql` (leads de LLCs, supresiones, autopilot).
6. Ve a **Authentication → Users → Add user**, crea tu usuario y copia su **User UID**: es tu `NEW_LEADS_OWNER_USER_ID`.
7. En **Project Settings → API** copia la **Project URL** (`SUPABASE_URL`) y la clave `service_role` (`SUPABASE_SERVICE_KEY`).

Los 3 SQL se pueden correr más de una vez sin romper nada. Si actualizas el repo, vuelve a correr el tercero.

## 3. Variables de entorno

Leyenda: **W** = servicio web (el panel) · **C** = servicio campaign (solo para la campaña de LLCs).

| Variable | Obligatoria | Para qué | Dónde se saca |
|---|---|---|---|
| `DASHBOARD_USER` | Sí (W) | Usuario del login del panel. Sin él, el panel responde 503. | Lo inventas tú. |
| `DASHBOARD_PASSWORD` | Sí (W) | Contraseña del panel. | La inventas tú: larga y única. |
| `SUPABASE_URL` | Sí (W, C) | URL del proyecto. | Supabase → Project Settings → API → Project URL. |
| `SUPABASE_SERVICE_KEY` | Sí (W, C) | Clave de servidor. Secreta. | Supabase → Project Settings → API → `service_role`. |
| `NEW_LEADS_OWNER_USER_ID` | Sí (C) · Sí para LLCs (W) | UUID de tu usuario; cada lead lo lleva. Sin él, el servicio campaign no arranca. | Supabase → Authentication → Users → User UID. |
| `BASE_URL` | Sí (W) | URL pública del panel: links de preview, checkout y Stripe. | La URL `https://...onrender.com` de tu servicio web, sin `/` al final. |
| `ANTHROPIC_API_KEY` | Para crear webs (W; C si `LEAD_DEMOS=true`) | Claude escribe y analiza. | console.anthropic.com → API Keys → Create Key. |
| `GOOGLE_PLACES_API_KEY` | Para Google Maps (W) | Búsqueda de negocios. | Google Cloud Console → habilita Places API → Credentials → Create API key. |
| `RESEND_API_KEY` | Para Google Maps (W) | Envío de emails. | resend.com → API Keys. |
| `RESEND_FROM_EMAIL` | Con Resend (W) | Remitente. Tiene que ser de un dominio verificado en Resend. | Resend → Domains. |
| `SENDER_NAME` | No (W) | Tu nombre en la firma. Por defecto `Tu Nombre`. | Lo escribes tú. |
| `BRAND_NAME` | No (W, C) | Tu marca (firma y texto de consentimiento de llamada). Por defecto `Tu Marca`. | Lo escribes tú. |
| `POSTAL_ADDRESS` | Sí antes de enviar emails reales | Dirección postal al pie del email (la exige la ley CAN-SPAM de EE. UU.). | Tu dirección física o casilla postal (calle, ciudad, estado, ZIP). |
| `OUTREACH_DRY_RUN` | No (W, C) | `true` = modo prueba, no sale nada. Viene en `true`. | Lo pasas a `false` cuando probaste todo. |
| `INSTANTLY_API_KEY` | Para la campaña (W, C) | Clave API v2 con scope "leads". | Instantly → Settings → Integrations → API keys. |
| `INSTANTLY_CAMPAIGN_ID` | Para la campaña (W, C) | ID (UUID) de la campaña. | Instantly → abre la campaña → copia el ID de la URL. |
| `CAMPAIGN_PUBLIC_URL` | Para la campaña (W, C) | URL `https://` del servicio campaign. Los links de los emails apuntan ahí. No puede ser localhost. | La URL de tu servicio `web-creator-360-campaign` en Render. |
| `LEAD_DEMOS` | No (W, C) | `true` = a cada lead se le crea una web demo antes del email. Necesita Anthropic + Vercel. | Viene en `false`. |
| `VERCEL_TOKEN` | Con `LEAD_DEMOS=true` | Publica webs en Vercel. | vercel.com/account/tokens. |
| `VERCEL_SCOPE` | No | Equipo de Vercel. Vacío = cuenta personal. | El slug de tu team en Vercel. |
| `STRIPE_SECRET_KEY` | No (W) | Cobros. | Stripe → Developers → API keys. |
| `STRIPE_WEBHOOK_SECRET` | Con Stripe | Verifica el webhook `/webhooks/stripe`. | Stripe → Developers → Webhooks → endpoint `TU_BASE_URL/webhooks/stripe` → Signing secret (`whsec_...`). |
| `STRIPE_PRICE_AMOUNT` | No | Precio en centavos. Por defecto `49700` ($497). | — |
| `STRIPE_CURRENCY` | No | Moneda. Por defecto `usd`. | — |
| `CALENDAR_URL` | No (W) | Link de agenda para el botón de llamada en webs y emails de Google Maps. Sin él, el botón no aparece. | Tu Calendly o similar. |
| `TELEGRAM_BOT_TOKEN` | No (W, C) | Bot para avisos. | Telegram → @BotFather → `/newbot`. |
| `TELEGRAM_CHAT_ID` | No (W, C) | Tu chat. | Mándale un mensaje al bot y corre `npm run telegram:setup` en tu computadora. |
| `AUTO_PIPELINE` | No (W) | `true` = pipeline automático de Google Maps cada 30 min. Cuesta plata. | Viene apagado. |
| `PIPELINE_TIMEZONE` | No (W) | Zona horaria del pipeline. | Nombre IANA, por ejemplo `America/New_York`. |
| `SOCRATA_APP_TOKEN` | No | Evita el límite de peticiones de data.ct.gov. | `data.ct.gov/profile/edit/developer_settings` (gratis). |
| `SAAS_MODE` | No | Modo SaaS experimental. **Déjalo en `false`.** | — |

`PORT` y `NODE_ENV` las maneja Render: no las toques. `SUPABASE_ANON_KEY`, `ADMIN_EMAILS` y las `STRIPE_*_MONTHLY/ANNUAL` son solo para el modo SaaS: dejalas vacías.

## 4. Pruébalo en tu computadora (opcional)

macOS / Linux:

```bash
npm install
cp .env.example .env
```

Windows (PowerShell):

```powershell
npm install
copy .env.example .env
```

Completa en `.env` al menos `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEW_LEADS_OWNER_USER_ID`, `DASHBOARD_USER` y `DASHBOARD_PASSWORD`. Después:

```bash
npm run dev
```

Abre `http://localhost:3001`. Para correr los tests: `npm test`.

## 5. Publícalo en Render

1. En Render: **New → Blueprint** → elige tu repo. Render lee el `render.yaml` y crea dos servicios.
2. `web-creator-360` es el panel completo (privado, con usuario y contraseña). Lo necesitas siempre.
3. `web-creator-360-campaign` es el servidor público de la campaña de LLCs: la página que abre cada lead desde el email y el autopilot. Solo lo necesitas si usas la campaña con Instantly.
4. Si no vas a usar la campaña, puedes crear solo el servicio web: **New → Web Service**, build `npm install`, start `node src/index.js`.
5. Render te pide las variables marcadas como secretas. En el servicio web completa al menos `DASHBOARD_USER`, `DASHBOARD_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEW_LEADS_OWNER_USER_ID`, `BASE_URL` y las claves de los servicios que uses.
6. En el servicio campaign: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEW_LEADS_OWNER_USER_ID`, `INSTANTLY_API_KEY`, `INSTANTLY_CAMPAIGN_ID` y `CAMPAIGN_PUBLIC_URL`.
7. `BASE_URL` y `CAMPAIGN_PUBLIC_URL` las sabes recién después del primer deploy: cargalas y haz **Manual Deploy**.

## 6. Primer acceso

1. Abre tu `BASE_URL`. El navegador muestra un cuadro de usuario y contraseña: pon `DASHBOARD_USER` y `DASHBOARD_PASSWORD`.
2. Comprueba que `TU_BASE_URL/health` devuelva `{"status":"ok"}`. En el servicio campaign, `/health` además muestra qué partes del autopilot están activas y qué variables faltan.
3. El menú tiene **Resumen**, **Prospección**, **Scraping**, **Crear webs**, **Enviar** (flujo Google Maps), **Fuentes**, **Leads**, **Envío** (LLCs), **Seguimiento** y **Pagos**.

## 7. Del modo prueba a envíos reales

Con `OUTREACH_DRY_RUN=true` no sale nada: ni Instantly, ni Resend, ni Telegram. Todo se escribe en los logs de Render con `[dry-run]`.

1. Importa un CSV chico en **Fuentes**, ve a **Envío**, manda un lote y busca la línea `[dry-run]` en Render → Logs.
2. Para obtener el texto que tienes que pegar en tu campaña de Instantly, corre en tu computadora `npm run leads:email-template` (o `npm run leads:email-template -- --demo` si usas webs demo). Pega asunto y cuerpo tal cual, con las `{{variables}}`.
3. Cuando todo funcione: completa `POSTAL_ADDRESS`, pon `OUTREACH_DRY_RUN=false` en **los dos** servicios y redespliega.

El **autopilot** de la campaña viene encendido (20 leads por ciclo), pero solo corre en el servicio campaign y respeta el modo prueba. Revisa Connecticut todos los días a las 7:00 (Nueva York) y envía a Instantly cada 3 horas. Se prende y apaga desde la pestaña **Envío**, sin redeploy.

## Seguridad

- **`DASHBOARD_USER` y `DASHBOARD_PASSWORD` siempre.** La app no tiene otro login: sin ellas el panel responde 503; con una contraseña débil, cualquiera con la URL ve tus leads y puede mandar emails.
- **No actives `SAAS_MODE`.** Es experimental y no separa datos entre usuarios: todas las cuentas verían los datos de todos.
- **Arranca con `OUTREACH_DRY_RUN=true`** y pásalo a `false` recién cuando probaste todo.
- **`POSTAL_ADDRESS` antes de enviar emails reales.** La ley CAN-SPAM de EE. UU. exige una dirección postal en cada email comercial.
- **Nunca subas el `.env` ni CSV de leads a GitHub.**
- **`SUPABASE_SERVICE_KEY` es secreta**: va solo en Render o en tu `.env`. Las tablas tienen RLS activado sin políticas a propósito: no agregues políticas.
- **`AUTO_PIPELINE` viene apagado** porque cada web consume Claude. Actívalo solo si sabes cuánto vas a gastar.
- `ALLOW_NO_AUTH=true` es solo para desarrollo local y Render lo ignora. Nunca lo uses en un servidor.

## Errores frecuentes

| Mensaje | Qué hacer |
|---|---|
| `Panel bloqueado: configura DASHBOARD_USER y DASHBOARD_PASSWORD (o ALLOW_NO_AUTH=true solo en desarrollo local).` | Carga las dos variables en el servicio web y redespliega. |
| `Autenticación requerida` | Usuario o contraseña incorrectos. Revisa mayúsculas y espacios, o prueba en una ventana de incógnito. |
| `Falta NEW_LEADS_OWNER_USER_ID: sin él el servidor no sabe a qué usuario pertenecen los leads.` | Copia el User UID de Supabase → Authentication → Users y cárgalo en el servicio campaign. |
| `Falta NEW_LEADS_OWNER_USER_ID en tu .env (el UUID de tu usuario de Supabase)` | La misma variable, pero en el servicio web. |
| `SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file` | Carga las dos desde Project Settings → API (la `service_role`, no la `anon`). |
| `...¿Has ejecutado src/db/schema-new-business-leads.sql en Supabase?` | Corre los 3 SQL en orden (paso 2). Si actualizaste el repo, vuelve a correr el tercero. |
| `Falta la columna demo_all: ejecuta de nuevo src/db/schema-new-business-leads.sql en Supabase` | Vuelve a correr ese SQL. |
| `Configuración incompleta para enviar leads a Instantly. Revisa en tu .env: ...` | Revisa la variable que nombra el mensaje. `INSTANTLY_CAMPAIGN_ID` tiene que ser un UUID y `CAMPAIGN_PUBLIC_URL` tiene que ser `https://` (no localhost). |
| `Instantly respondió 401: ...` | Clave mal copiada o sin scope "leads". Crea una API key v2 nueva con ese scope. |
| `Falta ANTHROPIC_API_KEY en tu .env (Claude escribe las webs)` | Carga `ANTHROPIC_API_KEY`. |
| `Falta VERCEL_TOKEN en tu .env (las webs se publican en Vercel)` | Carga `VERCEL_TOKEN` (obligatorio con `LEAD_DEMOS=true`). |
| `Token de Vercel inválido — crea uno en vercel.com/account/tokens` | Crea un token nuevo. |
| `Vercel: tu cuenta alcanzó el límite de N proyectos; ...` | Borra proyectos viejos en Vercel. Las demos de LLCs se borran solas a los 7 días. |
| `Business has not been scraped yet. Run scraping first.` | Pasa primero por la pestaña **Scraping** y después por **Crear webs**. |
| `Sin email disponible para contactar este negocio` | Ese negocio no tiene email: cárgalo a mano o elige otro. |
| `Ya contactado en las últimas 24 horas` | Protección contra doble envío. Espera 24 h. |
| `Contacto dado de baja o con rebote (lista de supresiones)` | Ese email se dio de baja o rebotó. No se le escribe más, a propósito. |
| `data.ct.gov respondió 429 (límite de peticiones: pon SOCRATA_APP_TOKEN)` | Crea el token gratis en data.ct.gov y cárgalo en `SOCRATA_APP_TOKEN`. |
| `Webhook Error: ...` en `/webhooks/stripe` | El `STRIPE_WEBHOOK_SECRET` no corresponde a ese endpoint en Stripe. Copia el Signing secret correcto. |

Muchos errores muestran el detalle solo en los logs: Render → tu servicio → **Logs**.

## Cómo adaptarlo a tu cliente

- **Tu nombre, marca y dirección**: variables `SENDER_NAME`, `BRAND_NAME` y `POSTAL_ADDRESS` (se leen en `src/lib/brand.js`).
- **Precio de la web**: `STRIPE_PRICE_AMOUNT` (en centavos) y `STRIPE_CURRENCY`. Ojo: el texto "$497" también está escrito en `src/services/resend.js`, `src/prompts/generation.js`, algunas plantillas de `templates/sites/` y en `public/`. Si cambias el precio, busca y cambia también esos textos.
- **Cómo escribe Claude las webs**: `src/prompts/generation.js` (web del flujo Google Maps) y `src/prompts/scraping.js` (cómo lee la información del negocio).
- **Plantillas de las webs demo de LLCs**: `templates/sites/` (una por rubro: `construccion`, `limpieza`, `jardineria`, `comida`, `belleza`, `barberia`, `general`). Qué plantilla usa cada rubro se decide en `src/sitegen/templates.js`.
- **Email de la campaña de LLCs** (el que pegas en Instantly): `src/prompts/newBusinessEmails.js`. Después corre `npm run leads:email-template` para ver el texto final.
- **Emails del flujo Google Maps y seguimientos**: `src/services/resend.js`.
- **Botón de agendar llamada**: `CALENDAR_URL`.
- **Horario y zona del pipeline automático**: `PIPELINE_TIMEZONE`.
- **Interfaz del panel**: `public/index.html` y `public/app.js`.

Después de cambiar código, haz commit y push: Render redespliega solo desde tu repo.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
