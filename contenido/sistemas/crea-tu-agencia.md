## Qué es

Constructor de Agencia IA es una plataforma web donde cada usuario arma su agencia de IA con ayuda de Claude. Tiene un **Mapa de Ruta de 11 pasos** que entrega tres cosas para vender (cliente ideal, oferta y landing) y una **secretaria virtual de WhatsApp** para mostrar a los clientes:

1. Problemas que resuelves.
2. Soluciones con IA (cada problema convertido en lo que vendes).
3. Tu agencia y tu nicho.
4. Precios: deslizadores con los números de un negocio típico y la tabla de lo que puedes cobrar.
5. Cliente ideal.
6. Oferta.
7. Landing de venta.
8. Tu agente: ficha de un negocio típico del nicho y una secretaria que atiende, cualifica y agenda.
9. Probar el agente en un simulador de WhatsApp.
10. Demo para clientes: pegas la web de un negocio (o escribes sus datos) y sale su propia secretaria.
11. Conectar WhatsApp (beta): vinculas un número por QR y el agente contesta de verdad.

El acceso es **solo por invitación** y cada generación con IA cuesta **créditos** (cada usuario arranca con 30; el mapa completo cuesta unos 10). Si una generación falla, los créditos se devuelven solos.

Lo que puedes hacer con esto: usarlo para armar tu propia agencia, mostrarle a un negocio una secretaria virtual hecha con los datos de su web, o darle acceso a tu comunidad o a tus clientes con créditos controlados.

## Qué necesitas

| Qué | ¿Obligatorio? | Para qué |
|---|---|---|
| **GitHub** | Sí | Render despliega desde tu repo. |
| **Supabase** | Sí | Base de datos, login y las funciones de IA (Edge Functions). En el plan Free una función se corta a los 150 s y el proyecto se pausa tras una semana sin actividad. |
| **Render** | Sí | Hospeda la web (sitio estático). |
| **Anthropic** (API key) | Sí | Claude genera los entregables (Sonnet por defecto) y responde como secretaria (Haiku por defecto). Pago por uso. |
| **Node.js 20+ y pnpm** | Sí, en tu computadora | Para correr los comandos de Supabase y los scripts. pnpm se activa con `corepack enable`. |
| **SMTP propio** (Resend, Postmark...) | Solo para invitar por email | Para que lleguen los emails de invitación. Sin SMTP puedes dar de alta usuarios desde el panel de admin. |
| **Docker** | Solo para desarrollo local | Supabase local. |
| **Servidor WAHA** (Render, plan de pago con disco) | Opcional | Solo para el paso 11 (WhatsApp real, beta). |

> Antes de abrirlo a otras personas, fija un **límite de gasto mensual** en la consola de Anthropic.

## 1. Descarga y súbelo a tu GitHub

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo.
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `constructor-agencia`.
3. Abre una terminal dentro de la carpeta descomprimida y corre:

```bash
git init
git add .
git commit -m "Constructor de Agencia IA"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/constructor-agencia.git
git push -u origin main
```

Los comandos son iguales en macOS, Linux y Windows (PowerShell). Si prefieres no usar la terminal, [GitHub Desktop](https://desktop.github.com) también sirve: **File → Add local repository**, elige la carpeta y publícala como privada.

> Nunca subas `.env`, `.env.local` ni `supabase/.env.local`. El `.gitignore` ya los excluye. Antes del commit puedes revisar con `git status` que no aparezcan.

## 2. Completa los datos de tu empresa

El repo viene limpio, con marcadores para que pongas lo tuyo. Antes de seguir:

1. `src/lib/legal.ts`: los datos que aparecen en la política de privacidad y los términos (empresa, identificación fiscal, dirección, email y fecha). Mientras algún valor empiece con `[`, esas páginas muestran un aviso de borrador.
2. `deploy/supabase-prod-auth/supabase/config.toml`: cambia `TU-APP` por la dirección real de tu web. Solo hace falta si vas a usar ese archivo (paso 3).
3. `.github/workflows/keepalive.yml`: es una tarea de GitHub que llama a Supabase cada dos días para que el plan Free no pause el proyecto. No hay que editarlo: en GitHub → tu repo → **Settings → Secrets and variables → Actions** crea la variable `SUPABASE_URL` y el secret `SUPABASE_ANON_KEY` (los consigues en el paso 3). Sin esas dos, no hace nada.

Después haz commit y push:

```bash
git add .
git commit -m "Configuración propia"
git push
```

## 3. Crea el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com). Anota la contraseña de la base de datos.
2. Tu **project ref** es la parte de la URL del proyecto: `https://TU-REF.supabase.co`.
3. En la carpeta del repo instala las dependencias (incluyen la CLI de Supabase) y conecta el proyecto:

```bash
corepack enable
pnpm install
pnpm exec supabase login
pnpm exec supabase link --project-ref TU-REF
pnpm exec supabase db push
```

`link` te pide la contraseña de la base de datos. `db push` crea las tablas, permisos y funciones desde `supabase/migrations/`.

Después, en el panel de Supabase:

- **Authentication → Providers → Email**: deja el email **activo** y **desactiva "Allow new users to sign up"** (acceso solo por invitación). Otra opción es aplicar el archivo del paso 2 con `pnpm exec supabase config push --project-ref TU-REF --workdir deploy/supabase-prod-auth`.
- Si vas a invitar por email, configura un SMTP propio (Resend, Postmark...).

## 4. Clave de IA y funciones

1. En el panel de Supabase, **Edge Functions → Secrets**, crea `ANTHROPIC_API_KEY` y `ALLOWED_ORIGIN` (por ahora puedes dejar `*`; en el paso 6 pones tu dominio). Es mejor cargarlas desde el panel que desde la terminal: así la clave no queda en el historial.
2. Despliega las funciones que usa la web:

```bash
pnpm exec supabase functions deploy generate
pnpm exec supabase functions deploy agent-chat
pnpm exec supabase functions deploy admin-students
pnpm exec supabase functions deploy load-sample
```

`generate` hace las generaciones con IA, `agent-chat` es el chat con la secretaria, `admin-students` es la pestaña de admin y `load-sample` carga el proyecto de ejemplo.

### Secretos de las funciones

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` las pone Supabase sola. El resto está explicado en `supabase/.env.example`.

| Variable | Obligatoria | Para qué | Dónde se saca |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Claude. Sin ella, la web dice que la IA no está configurada. | [console.anthropic.com](https://console.anthropic.com) → API Keys. |
| `ALLOWED_ORIGIN` | Sí en producción | Dominio de tu web (CORS). Por defecto `*`. | Tu URL de Render, por ejemplo `https://TU-SITIO.onrender.com`. |
| `ANTHROPIC_MODEL` | No | Modelo de los entregables. Por defecto `claude-sonnet-5-5`. | — |
| `ANTHROPIC_THINKING` | No | `off` quita el razonamiento: lo más rápido y barato. Por defecto `on`. | — |
| `AGENT_MODEL` | No | Modelo de la secretaria (Haiku por defecto). | — |
| `AGENT_CHAT_PER_MINUTE` / `AGENT_CHAT_PER_HOUR` | No | Límite de mensajes con la secretaria por usuario. Por defecto 20 y 300. | — |
| `RATE_LIMIT_PER_MINUTE` | No | Máximo de generaciones por usuario y minuto. Por defecto 10. | — |
| `GENERATION_TIMEOUT_SECONDS` | No | Tiempo máximo de una generación. Por defecto 140. Déjalo por debajo del límite de tu plan (Free: 150 s, Pro: 400 s). | — |

### Variables de la web (Render)

| Variable | Obligatoria | Para qué | Dónde se saca |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto de Supabase. | Supabase → Settings → API. |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anónima (es pública por diseño). | Supabase → Settings → API. |

## 5. Publica la web en Render

1. En Render: **New → Blueprint** → elige tu repo. Render lee el `render.yaml` (sitio estático con las reglas de la app y cabeceras de seguridad).
2. Te pide `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Espera el build. Cada `git push` a `main` redespliega.

## 6. Cierra la configuración con tu URL

Con la URL de Render ya puedes terminar:

1. Supabase → **Authentication → URL configuration**: **Site URL** = tu URL, y agrega `https://TU-SITIO.onrender.com/reset-password` a **Redirect URLs**.
2. Supabase → **Edge Functions → Secrets**: cambia `ALLOWED_ORIGIN` a tu URL exacta, sin `/` al final.

## 7. Primer acceso (tu cuenta de admin)

1. Supabase → **Authentication → Users → Add user**: crea tu usuario con email y contraseña.
2. Supabase → **SQL Editor**: hazlo admin con el comando de abajo (cambia el email).
3. Entra a tu URL e inicia sesión. Vas a ver la pestaña **Alumnos**.

```sql
update profiles set role = 'admin' where email = 'tu-email@ejemplo.com';
```

Desde **Alumnos** das de alta usuarios sin email: se muestra una contraseña temporal una sola vez, con un mensaje listo para copiar. También sumas o quitas créditos, generas contraseñas nuevas y eliminas usuarios.

### Invitar por email (opcional)

Necesita el SMTP del paso 3. Haz un CSV con columnas `email,nombre,creditos` y corre (la clave `service_role` está en Supabase → Settings → API; nunca la subas a git):

macOS / Linux:

```bash
SUPABASE_URL=https://TU-REF.supabase.co SUPABASE_SERVICE_ROLE_KEY=TU-CLAVE SITE_URL=https://TU-SITIO.onrender.com node scripts/invite.mjs csv alumnos.csv
```

Windows (PowerShell):

```powershell
$env:SUPABASE_URL="https://TU-REF.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="TU-CLAVE"; $env:SITE_URL="https://TU-SITIO.onrender.com"
node scripts/invite.mjs csv alumnos.csv
```

Otros comandos del mismo script: `invite ana@correo.com "Ana Pérez" --credits 30`, `grant ana@correo.com 20 "bonus"` y `balance ana@correo.com`.

## 8. Pruébalo en tu computadora (opcional)

Necesitas Node 20+, pnpm y Docker. Supabase local usa los puertos 554xx.

macOS / Linux:

```bash
pnpm install
pnpm db:start
cp .env.example .env.local
cp supabase/.env.example supabase/.env.local
pnpm fn:serve
pnpm dev
```

Windows (PowerShell):

```powershell
pnpm install
pnpm db:start
copy .env.example .env.local
copy supabase\.env.example supabase\.env.local
pnpm fn:serve
pnpm dev
```

`pnpm db:start` imprime la URL y las claves: pega la clave anónima en `.env.local` y tu `ANTHROPIC_API_KEY` real en `supabase/.env.local`. `pnpm fn:serve` y `pnpm dev` se quedan corriendo: usa una terminal para cada uno. La web abre en `http://localhost:5173`.

Para crear un usuario de prueba con contraseña (solo local):

```bash
SUPABASE_URL=http://127.0.0.1:55421 SUPABASE_SERVICE_ROLE_KEY=CLAVE-SECRETA-LOCAL node scripts/invite.mjs create alumno@test.com "Contraseña-Larga-1" --credits 30
```

## 9. WhatsApp real (beta, opcional)

Usa **WAHA**, una vía **no oficial** de Meta: puede terminar en el bloqueo del número. Por eso el agente solo responde (nunca inicia conversaciones), tiene topes por día y por chat, y se calla si el dueño contesta desde su celular.

1. En Render: **New → Web Service → Existing Image** → `docker.io/devlikeapro/waha:noweb`, plan de pago y un **Disk** montado en `/app/.sessions` (1 GB).
2. Variables de ese servicio: `WAHA_API_KEY` (clave larga aleatoria), `WHATSAPP_DEFAULT_ENGINE=NOWEB`, `PORT=3000`, `WAHA_DASHBOARD_ENABLED=false`, `WHATSAPP_SWAGGER_ENABLED=false`.
3. En Supabase → **Edge Functions → Secrets**: `WAHA_URL` (la URL del servicio de WAHA), `WAHA_API_KEY` (la misma), `WA_WEBHOOK_URL` (`https://TU-REF.supabase.co/functions/v1/wa-webhook`) y `WA_WEBHOOK_SECRET` (otro secreto largo).
Después despliega:

```bash
pnpm exec supabase db push
pnpm exec supabase functions deploy wa-connect
pnpm exec supabase functions deploy wa-webhook
```

Empieza con el plan más chico y vigila la memoria: si WAHA se reinicia por falta de RAM, sube de plan. Las conversaciones reales se guardan 30 días y solo las ve su dueño: **publica un aviso de privacidad antes de abrirlo a otras personas**.

## Seguridad

- **`SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` son secretos**: no van en el frontend, ni en Render, ni en git. La clave de Anthropic vive solo en los secretos de Supabase y nunca llega al navegador.
- **Cierra el registro público** ("Allow new users to sign up" desactivado): el acceso es solo por invitación.
- **Pon un límite de gasto mensual** en la consola de Anthropic antes de abrirlo a otras personas.
- **`ALLOWED_ORIGIN`** con tu dominio exacto en producción.
- **El rol admin se asigna a mano** por SQL. No lo des a cualquiera: puede crear y borrar usuarios y repartir créditos.
- `FETCH_ALLOW_HOSTS` es solo para pruebas locales: en producción, vacío.
- WhatsApp real es beta y no oficial: riesgo de bloqueo del número y datos de terceros. Aviso de privacidad obligatorio.

## Errores frecuentes

| Mensaje | Qué hacer |
|---|---|
| `Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example)` | Carga las dos variables en Render (o en `.env.local`) y vuelve a desplegar. |
| `Email o contraseña incorrectos.` | Revisa el email y la contraseña. Si el usuario no existe, créalo desde **Alumnos** o en Supabase. |
| `La IA aún no está configurada en el servidor.` | Falta el secreto `ANTHROPIC_API_KEY` en Supabase → Edge Functions → Secrets. |
| `Se interrumpió la conexión con la IA. Revisa tus créditos y vuelve a intentarlo.` | Revisa que la función `generate` esté desplegada y que `ALLOWED_ORIGIN` sea exactamente tu dominio. |
| `No te quedan créditos. Pide más a tu equipo.` | Suma créditos desde **Alumnos** o con `node scripts/invite.mjs grant`. |
| `Vas muy rápido. Espera unos segundos y vuelve a intentarlo.` | Límite por minuto (`RATE_LIMIT_PER_MINUTE`). Espera. |
| `La IA está saturada en este momento. Inténtalo de nuevo en un momento.` | Anthropic está ocupado. Reintenta. |
| `La IA ha tardado demasiado. Se te han devuelto los créditos: inténtalo de nuevo.` | Sube `GENERATION_TIMEOUT_SECONDS` (sin pasar el límite de tu plan) o pon `ANTHROPIC_THINKING=off`. |
| `La IA no respondió correctamente. No se ha descontado ningún crédito.` | Reintenta. Si se repite, revisa la clave y el crédito de Anthropic. |
| `Ya se está generando esto. Espera a que termine.` | Hay una generación en curso de ese mismo entregable. Espera. |
| `Tu sesión ha caducado. Vuelve a iniciar sesión.` | Vuelve a entrar. |
| `Para vincular un número tienes que aceptar el aviso sobre tus clientes.` | Acepta el aviso antes de vincular WhatsApp. |
| `Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY` | Al correr `scripts/invite.mjs` faltan esas variables. |
| `Falta SITE_URL (el dominio de tu web, ...)` | Agrega `SITE_URL` al comando de invitación. |

## Cómo adaptarlo a tu cliente

- **Marca**: logos en `public/brand/` y `public/favicon.png`; título en `index.html`; textos con el nombre de la marca en `src/pages/` (Login, ResetPassword, Settings, Admin, Legal), `src/components/AppShell.tsx` y los mensajes de `src/lib/api.ts`.
- **Colores**: `accent` en `tailwind.config.ts`.
- **Datos legales**: `src/lib/legal.ts` (empresa, dirección, email) y los textos de `src/pages/Legal.tsx`.
- **Pasos del mapa** (nombre, icono, descripción): `SECTIONS` en `src/lib/gamification.ts`. La pantalla de cada paso está en `src/components/sections/`.
- **Prompts de la IA**: `supabase/functions/generate/prompts.ts` (el `SYSTEM` define cómo escribe). Ojo: hoy los prompts usan euros y los negocios de ejemplo tienen ciudad y teléfono de España. Si tu público es de Latinoamérica o EE. UU., adáptalo ahí.
- **Moneda que muestra la web**: la función `eur` de `src/lib/calc.ts` (formato `es-ES`, EUR).
- **Catálogo de problemas y soluciones**: `supabase/functions/_shared/catalog.ts`.
- **Tabla de precios y valores por defecto**: `supabase/functions/_shared/pricing.ts`.
- **Secretaria virtual**: las instrucciones del chat se arman en `supabase/functions/_shared/agent.ts`.
- **Proyecto de ejemplo**: `supabase/functions/_shared/sample.ts` (una clínica dental).
- **Costo en créditos de cada generación**: `KINDS` en `supabase/functions/generate/index.ts`.
- **Créditos iniciales**: `initial_credits` en la tabla `app_settings` (30 por defecto).

Si cambias algo dentro de `supabase/functions/`, vuelve a desplegar esa función con `pnpm exec supabase functions deploy NOMBRE`. Si cambias la web, alcanza con commit y push.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
