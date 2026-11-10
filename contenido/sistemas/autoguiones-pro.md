## Qué es

AutoGuiones PRO es una web que arma guiones de video listos para grabar. Toma ideas de dos lados: **noticias de IA** (RSS, Hacker News, Reddit) y **videos virales de tu competencia** (Instagram, TikTok, YouTube). Puntúa cada noticia de 0 a 100, escribe guiones con la voz de tu marca, los autocritica de 0 a 10 y te dice cómo mejorarlos. Opcional: conviertes guiones en videos con tu avatar de **HeyGen** y los publicas con **Metricool**.

Es multiusuario: cada persona crea su cuenta y usa **sus propias claves de API**. El gasto va a la cuenta de cada uno.

| Pantalla | Qué hace |
|---|---|
| **Noticias** | Noticias de IA puntuadas por lo útiles que son para tu negocio. Desde ahí conviertes cualquiera en guion. |
| **Competencia** | Busca videos virales de otros creadores, los transcribe y los adapta a guiones tuyos. |
| **Guiones / Adaptados** | Guiones de noticias y guiones adaptados de la competencia, con nota, crítica y mejoras. |
| **Drive** | Tus audios, videos grabados y videos del avatar, vinculados a cada guion (no es Google Drive). |
| **Calendario** | Lo programado y lo publicado. |
| **Marca** | El "cerebro" de tus guiones: negocio, cliente ideal, oferta, tonalidad, historia. |
| **Ajustes** | Claves, generación, publicación y consumo. |
| **Admin** | Solo admins: cuentas, gasto y topes por cuenta. |

Un proceso de fondo (worker) corre cada 2 horas: trae noticias, las clasifica, genera guiones de las más relevantes y procesa los videos de competencia. Los videos con avatar **nunca se lanzan solos**: los eliges tú.

Lo que puedes vender: un sistema de contenido para la marca personal de un cliente, que le entrega guiones nuevos todos los días.

## Qué necesitas

| Qué | ¿Obligatorio? | Para qué | Costo (según el repo) |
|---|---|---|---|
| **GitHub** | Sí | Render despliega desde tu repo. | Gratis. |
| **Render** (plan Starter + disco) | Sí | Servidor 24/7 + disco para la base de datos y los archivos. | De pago. El plan free no tiene disco: pierdes cuentas y guiones en cada deploy, y el servicio se duerme. |
| **Clave de Anthropic** (`sk-ant-...`) | Sí | Clasificar noticias, escribir, puntuar y adaptar guiones. | Por uso. Tope diario por defecto: 5 USD por cuenta. |
| **Clave de OpenAI** | Para Competencia y subtítulos | Transcribir con Whisper. | Unos 0,006 USD por minuto de audio. |
| **Token de Apify** | Para Instagram | Traer reels de Instagram. | Unos 0,5–2 USD cada 1000 reels. Apify tiene crédito gratis mensual. |
| **yt-dlp + ffmpeg** en el servidor | Para TikTok y YouTube | Bajar videos de TikTok y YouTube. | Gratis, pero hay que cambiar el Build Command (paso 6). |
| **HeyGen** | Opcional | Videos con tu avatar. | Unos 4 USD por minuto de video. Tope diario por defecto: 10 USD. |
| **Metricool** | Opcional | Publicar los videos en tus redes. | Según tu plan. |

Para probarlo en tu computadora necesitas **Node.js 24** (usa el SQLite que viene con Node).

> No sirve en Vercel tal cual: necesita un servidor siempre encendido y disco.

## 1. Descarga y súbelo a tu GitHub

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo.
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `autoguiones-pro`.
3. Abre una terminal dentro de la carpeta descomprimida y corre:

```bash
git init
git add .
git commit -m "AutoGuiones PRO"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/autoguiones-pro.git
git push -u origin main
```

Los comandos son iguales en macOS, Linux y Windows (PowerShell). Si prefieres no usar la terminal, [GitHub Desktop](https://desktop.github.com) también sirve: **File → Add local repository**, elige la carpeta y publícala como privada.

> Nunca subas el archivo `.env`. El `.gitignore` ya lo excluye. Antes del commit puedes revisar con `git status` que no aparezca.

## 2. Variables de entorno del servidor

Se cargan en Render → tu servicio → **Environment**. Ninguna es una clave de API: las claves las pone cada usuario dentro de la app, en **Ajustes**.

| Variable | Obligatoria | Para qué | Dónde se saca |
|---|---|---|---|
| `DB_PATH` | Sí (la pone el Blueprint) | Dónde se guarda la base de datos. Tiene que ser `/data/app.db`. | Viene en `render.yaml`. |
| `ADMIN_EMAILS` | Sí | Emails admin, separados por coma. Quien se registra con uno de esos emails es admin. | Tu email. |
| `REGISTRATION_CODE` | Muy recomendada | Código secreto que se pide al crear cuenta. Sin código, cualquiera con tu URL puede registrarse. | Lo inventas tú. |
| `ALLOW_REGISTRATION` | No | `false` = solo se puede registrar la primera cuenta o un email de `ADMIN_EMAILS`. Por defecto `true`. | — |
| `NODE_VERSION` | Sí (la pone el Blueprint) | Versión de Node: `24`. | Viene en `render.yaml`. |
| `POLL_CRON` | No | Cada cuánto corre el worker. Por defecto cada 2 horas. | Formato cron, por ejemplo `0 */2 * * *`. |
| `NEWS_RETENTION_DAYS` | No | Días que se guardan las noticias. Por defecto `21`. Los guiones no se borran. | — |
| `AI_PREFILTER` | No | Descarta al entrar noticias que claramente no son de IA. Por defecto `true`. | — |
| `USE_BATCH_CLASSIFY` | No | `true` = clasifica por lotes: más barato, pero tarda minutos u horas. | — |
| `MODEL_CLASSIFY` | No | Modelo para puntuar noticias. Por defecto `claude-haiku-4-5`. | — |
| `REDDIT_SUBS` | No | Subreddits a leer, separados por coma. | — |

`NODE_ENV` la maneja Render. Otras variables de `.env.example` (`MODEL_GENERATE`, `RELEVANCE_THRESHOLD`, `MAX_DAILY_USD`, `MAX_SCRIPTS_PER_DAY`...) hoy se configuran por usuario en **Ajustes** o por el admin en **Admin**. Twitter/X está desactivado: deja `TWITTER_ENABLED=false`.

### Claves que carga cada usuario en Ajustes

| Clave | Formato | Dónde se consigue | Para qué |
|---|---|---|---|
| Anthropic | empieza con `sk-ant-` | [console.anthropic.com](https://console.anthropic.com) | Todo lo de guiones. |
| OpenAI (transcripción) | empieza con `sk-` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Transcribir competencia y subtítulos del avatar. |
| Instagram (Apify) | `apify_api_...` | [console.apify.com/account/integrations](https://console.apify.com/account/integrations) | Traer reels de Instagram. |
| HeyGen | tu clave de HeyGen | [app.heygen.com/settings?nav=API](https://app.heygen.com/settings?nav=API) | Videos con avatar. Después de guardarla: **Cargar mis avatares** y elige uno. |
| Metricool | userToken + userId | [app.metricool.com/settings/api](https://app.metricool.com/settings/api) | Publicar. Después agregas las cuentas destino. |

Las claves quedan guardadas en el servidor y no se vuelven a mostrar en el navegador.

## 3. Pruébalo en tu computadora (opcional)

macOS / Linux:

```bash
cp .env.example .env
npm install
npm run dev
```

Windows (PowerShell):

```powershell
copy .env.example .env
npm install
npm run dev
```

Antes de arrancar, pon tu email en `ADMIN_EMAILS` dentro de `.env`. Abre `http://localhost:3000`: `npm run dev` levanta la web y el worker a la vez. Es normal ver un aviso `ExperimentalWarning` de `node:sqlite`.

Otros comandos útiles: `npm run worker:once` (un solo ciclo del worker y sale) y `npm run db:reset` (borra la base de datos local).

## 4. Publícalo en Render

1. En Render: **New + → Blueprint** → conecta tu repo.
2. Render lee `render.yaml` y crea el servicio web (plan Starter, región Frankfurt), un **disco de 1 GB montado en `/data`** y las variables `NODE_VERSION=24`, `DB_PATH=/data/app.db` y `POLL_CRON`.
3. Te pide dos valores: `ADMIN_EMAILS` (tu email, el mismo con el que te vas a registrar) y `REGISTRATION_CODE` (un código secreto que inventas).
4. Si quieres cerrar el registro del todo, agrega `ALLOW_REGISTRATION=false` en Environment.
5. Aprieta **Apply** y espera a que termine el build.
6. Revisa los **Logs**. Tiene que aparecer `[db] Base de datos: /data/app.db (DB_PATH)`. Si dice `local (efímero)`, no hay disco y tus datos se van a borrar.

## 5. Primer uso

1. Entra a tu URL → **Crear cuenta** con el email de `ADMIN_EMAILS`, una contraseña de 8 caracteres o más y el código de registro. Vas a ver la pestaña **Admin**.
2. **Ajustes → Conexiones**: carga como mínimo la clave de Anthropic. Para Competencia, también OpenAI y Apify.
3. **Marca**: completa negocio, cliente ideal, oferta, tonalidad e historia. Se usa al instante en el próximo guion.
4. **Competencia → escaneo puntual**: elige plataforma y pega la URL del perfil, por ejemplo `https://www.instagram.com/usuario/`. Los filtros por defecto son 50.000 vistas y 300 comentarios. Si no entra nada, bájalos.
5. Los videos nuevos se transcriben y adaptan solos en el siguiente ciclo del worker (o desde los botones de Competencia). Los guiones aparecen en **Adaptados**.
6. Para el avatar: marca guiones, aprieta **Generar vídeo con avatar**, y cuando HeyGen termine, **Continuar proceso de vídeos** para agregar subtítulos y publicar.

## 6. TikTok y YouTube (opcional)

Instagram funciona con Apify sin instalar nada. Para TikTok y YouTube el servidor necesita `yt-dlp` y `ffmpeg`. En Render → **Settings → Build Command**, el `DEPLOY.md` propone:

```bash
pip install yt-dlp && apt-get install -y ffmpeg || true && npm install && npm run build
```

Después haz **Manual Deploy**. Si al escanear sigue diciendo que falta yt-dlp, no quedó instalado; Instagram sigue funcionando igual.

En tu Mac, para probar en local: `brew install yt-dlp ffmpeg`.

## Seguridad

- **Usa siempre `REGISTRATION_CODE`.** Sin código, cualquiera que conozca tu URL puede crear una cuenta en tu instancia.
- **Admin = email en `ADMIN_EMAILS`.** No hay otro modo de ser admin. Si la dejas vacía, nadie puede ajustar topes de gasto.
- **Los topes de gasto solo los cambia el admin** desde **Admin**: Anthropic (5 USD/día por defecto) y HeyGen (10 USD/día por defecto). Se reinician a medianoche UTC. No pongas el tope en 0: significa sin límite.
- **No compartas tu instancia.** Las claves de cada usuario quedan guardadas en el servidor y quien lo administra podría verlas. La app lo avisa: "Úsala solo si confías en quien lo administra". Cada cliente, su propio deploy.
- **Límites anti-abuso:** 5 registros por hora por IP y 10 intentos de login cada 15 minutos por cuenta.
- **Nunca pongas claves de API en el repo ni en variables de entorno.** Van en Ajustes.

## Errores frecuentes

| Mensaje | Qué hacer |
|---|---|
| `Código de registro incorrecto` | Copia el código exacto de Render → Environment, sin espacios. |
| `El registro está cerrado en esta instancia` | Agrega el email a `ADMIN_EMAILS`, o pon `ALLOW_REGISTRATION=true` y redespliega. |
| `Ya existe una cuenta con ese email` | Entra por Login. Si "se borró", revisa el disco (último renglón de esta tabla). |
| `Demasiadas cuentas creadas desde aquí. Prueba de nuevo más tarde.` | Límite anti-abuso. Espera. |
| `Demasiados intentos. Prueba de nuevo en unos minutos.` | Límite de intentos de login. Espera. |
| `Configura tu clave de Anthropic en Ajustes.` | Ajustes → Conexiones → pega tu clave de Anthropic. |
| `Falta tu clave de Anthropic (debe empezar por 'sk-ant-'). Ponla en Ajustes.` | La clave no empieza con `sk-ant-`. Revisa que sea de Anthropic. |
| `Alcanzado el tope diario de gasto (USD)` / `Alcanzado el tope diario de guiones` | Espera a medianoche UTC, o el admin sube el tope en **Admin** / subes "guiones por día" en Ajustes. |
| `Tope diario de guiones adaptados alcanzado (X/Y)...` | Ajustes → "Tope de guiones adaptados por día" (0 = sin tope). |
| `Instagram requiere tu token de Apify (Ajustes → Instagram).` | Carga el token de Apify en Ajustes. |
| `Apify 401: ...` / `Apify 402: ...` | Token inválido o sin crédito. Revisa en console.apify.com. |
| `yt-dlp no está instalado en el servidor, hace falta para TikTok/YouTube.` | Cambia el Build Command (paso 6) o usa solo Instagram. |
| `URL inválida para instagram` (o tiktok/youtube) | Pega la URL completa del perfil, de la plataforma elegida. |
| `Configura tu clave de OpenAI en Ajustes para transcribir.` | Carga una clave de OpenAI (no de Anthropic). |
| `video XMB supera el límite de Whisper (24MB)` | Usa videos más cortos (reels o shorts). |
| `Sin transcripción disponible. El video debe estar transcrito primero.` | Transcríbelo primero o espera al worker. |
| `Configura tu clave y avatar de HeyGen en Ajustes.` | Ajustes → HeyGen → **Cargar mis avatares** → elige uno. |
| `No se pudo determinar la voz de tu avatar — vuelve a elegirlo en Ajustes.` | Vuelve a elegir el avatar. |
| `Tope diario de gasto en HeyGen alcanzado` | Espera a medianoche UTC o pídele al admin que lo suba. |
| `Falló el renderizado de subtítulos 3 veces seguidas (probable falta de memoria en el servidor)...` | El servidor se quedó sin RAM. Sube el plan de Render y vuelve a lanzar. |
| `Configura antes tu token de Metricool.` | Ajustes → Publicación → Metricool. |
| `Archivo demasiado grande (máx. 300MB)` / `Formato no admitido (usa un audio o video)` | Comprime el archivo o usa un formato de audio o video. |
| Los logs dicen `local (efímero)` o se te borra la cuenta en cada deploy | Falta el disco. Revisa Render → Settings → Disks (Mount Path `/data`) y `DB_PATH=/data/app.db`, y haz Manual Deploy. Lo más fácil: borrar el servicio y recrearlo con Blueprint. |

Reddit suele dar 403 desde Render: es normal, RSS y Hacker News siguen funcionando.

## Cómo adaptarlo a tu cliente

- **Lo principal no es código**: la pestaña **Marca** define negocio, cliente ideal, oferta, tonalidad e historia. Cada cliente con su cuenta (o mejor, su propio deploy).
- **Temática de las noticias**: el prompt que puntúa noticias está en la constante `SYSTEM` de `src/lib/classify.ts` (viene enfocado en IA aplicada a negocios digitales). Si tu cliente es de otro nicho, cámbialo ahí.
- **Fuentes de noticias**: RSS y términos de Hacker News en `src/lib/sources/feeds.ts`; subreddits con `REDDIT_SUBS`.
- **Cómo escribe los guiones**: `PERSONA` y `formatBrief` en `src/lib/generate.ts`; la autocrítica en `src/lib/critique.ts`; la adaptación de videos de competencia en `src/lib/competitor-generate.ts`.
- **Nombre de la app**: `src/components/AppShell.tsx` (menú), `src/app/layout.tsx` (título de la pestaña) y `src/app/compartido/[token]/page.tsx` (enlaces compartidos).
- **Colores**: `brand` y `brand2` en `tailwind.config.ts`.
- **Modelo de guiones**: por usuario en Ajustes (Opus 4.8 o Sonnet 4.6, más barato). El de clasificar noticias, con `MODEL_CLASSIFY`.

Después de cambiar código, haz commit y push: Render redespliega solo (`autoDeploy` está activo).

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
