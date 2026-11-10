## Qué es

Dashboard de Ventas es la app web de un equipo comercial (Next.js + Supabase). Reúne en un solo lugar lo que hoy suele estar repartido en planillas, GoHighLevel y WhatsApp:

- **CRM con pipelines**: los leads entran por formularios, CSV o GoHighLevel y se reparten solos entre el equipo.
- **Roles**: CEO, director, closer y caller. Cada uno ve solo lo suyo (permisos por rol, persona y pipeline).
- **Ventas, KPIs y finanzas**: ventas, comisiones, pagos, ranking del equipo, reportes diarios y objetivos.
- **Llamadas con IA (opcional)**: transcribe las llamadas (Fathom, GHL o Deepgram) y Claude las analiza: objeciones, puntaje y qué mejorar.
- **GoHighLevel (opcional)**: escribe contactos, etiquetas y oportunidades en GHL y lee de ahí citas, leads y grabaciones cada minuto.

Lo que vendes: el tablero de mando de un equipo de ventas (infoproductores, agencias, high ticket) con el dueño viendo cifras reales y no capturas de WhatsApp.

> La app está en español de España (textos como «pulsa» o «vale»). Más abajo te digo dónde cambiarlo si tu cliente es de Latinoamérica.

## Qué necesitas

| Cuenta | ¿Obligatoria? | Para qué |
|---|---|---|
| **GitHub** | Sí | Vercel publica desde tu repo. |
| **Supabase** | Sí | Base de datos, login y el programador (lecturas de GHL cada minuto, email diario). |
| **Vercel** | Sí | La web. Cada push a `main` se publica solo. |
| **Resend** | Recomendada | Emails: enlace mágico, avisos y el email diario. Necesita un dominio verificado. |
| **Anthropic** | Opcional | Analizar llamadas, coach y puntaje de leads. Pago por uso. |
| **Deepgram** | Opcional | Transcribir las llamadas que GHL no transcribió. |
| **GoHighLevel** | Opcional | Si el equipo ya trabaja en GHL. |

En tu computadora: **Node.js 20 o superior**, **git** y la **CLI de Supabase** (`brew install supabase/tap/supabase` en Mac, `scoop install supabase` en Windows).

## 1. Descarga y súbelo a tu GitHub

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo.
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `dashboard-ventas`.
3. Abre una terminal dentro de la carpeta descomprimida y corre:

```bash
git init
git add .
git commit -m "Dashboard de ventas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/dashboard-ventas.git
git push -u origin main
```

> Nunca subas `.env.local` ni `.env.produccion`. El `.gitignore` ya los excluye.

## 2. Crea la base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com). Guarda la contraseña de la base de datos.
2. En la carpeta del repo, enlaza el proyecto y aplica las migraciones (son 65 y crean todas las tablas, permisos y tareas programadas):

```bash
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase db push --dry-run
supabase db push
```

`--dry-run` te muestra qué va a aplicar sin tocar nada. El `project-ref` está en la URL de tu proyecto (`https://supabase.com/dashboard/project/<project-ref>`).

3. En **Authentication → Sign In / Providers**, apaga **Allow new users to sign up**: solo entra quien crea el CEO o un director.
4. En **Project Settings → API Keys** copia la **Project URL**, la clave **publishable** (`sb_publishable_…`) y la **secret** (`sb_secret_…`).

## 3. Variables de entorno

Copia `.env.example` como `.env.local` para probar en tu computadora. En producción van en Vercel → **Settings → Environment Variables**.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Dirección de Supabase. Tiene que estar **al compilar**: si la agregas después, vuelve a desplegar. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Clave pública, solo para iniciar sesión. |
| `SUPABASE_SECRET_KEY` | Sí | Clave secreta. Da acceso total: nunca la compartas. |
| `CLAVE_CIFRADO` | Sí | Cifra el token de GHL y las claves de Fathom. Genérala con `openssl rand -base64 32` y guárdala en tu gestor de contraseñas: si cambia, hay que volver a pegar esos tokens. |
| `RESEND_API_KEY` | Para emails | Clave de Resend con permiso de envío. |
| `APP_URL` | Para emails | La dirección pública de la app, para los enlaces de los emails. |
| `EMAIL_REMITENTE` | No | Remitente, por ejemplo `Tu Marca <no-reply@tudominio.com>`. |
| `ANTHROPIC_API_KEY` | No | Análisis de llamadas. Sin ella, la app funciona y avisa en amarillo. |
| `DEEPGRAM_API_KEY` | No | Transcripción de llamadas. |

## 4. Prepara el proyecto y crea tu equipo

Los scripts simulan primero y solo hacen cambios con `--confirmar`. Crea un archivo `.env.produccion` (fuera de GitHub) con las variables de Supabase y corre:

```bash
node --env-file=.env.produccion scripts/preparar-proyecto.mjs
node --env-file=.env.produccion scripts/preparar-proyecto.mjs --confirmar
```

Eso crea el proyecto con sus pipelines, columnas y productos (los defines en `scripts/proyecto-base.json`: cámbialos antes por los de tu cliente).

Después arma un CSV con el equipo, por ejemplo `equipo.csv`:

```csv
nombre,email,rol,proyecto,admin
Ana Pérez,ana@tuempresa.com,ceo,Forja,
Luis Gómez,luis@tuempresa.com,director,Forja,si
Sofía Ruiz,sofia@tuempresa.com,closer,Forja,
```

```bash
node --env-file=.env.produccion scripts/crear-usuarios.mjs equipo.csv
node --env-file=.env.produccion scripts/crear-usuarios.mjs equipo.csv --confirmar
```

Las contraseñas temporales quedan en `scripts/salida/` (no salen en pantalla). Mándalas a cada persona y **borra ese archivo**. Al entrar por primera vez, cada uno hace su onboarding.

## 5. Pruébalo en tu computadora (opcional)

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000` y entra con tu usuario. Para correr las pruebas: `npm test`.

## 6. Publícalo en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** e importa tu repo.
2. Carga las variables del paso 3 (las `NEXT_PUBLIC_` también).
3. **Deploy**. Cuando termine, pon la URL en `APP_URL` y vuelve a desplegar (**Deployments → Redeploy**).
4. Si tienes dominio, agrégalo en **Settings → Domains** (por ejemplo `dashboard.tuempresa.com`).

## 7. Conecta GoHighLevel (opcional)

1. En GHL → **Settings → Private Integrations**, crea una integración con todos los permisos y copia el token. Copia también el **Location ID**.
2. En el dashboard → **Administración → Integraciones GHL**, pega los dos y pulsa **Probar conexión**. El token se guarda cifrado y no se vuelve a mostrar.
3. **Administración → Entradas**: crea una Entrada por cada web o formulario. Cada una tiene su dirección secreta, su pipeline y qué hacer en GHL (campos, etiquetas, oportunidades).

La guía completa está en `docs/GUIA-GHL.md` y el manual para conectar una landing en `Team/Template-landing.md`. Si usas Claude Code, la skill `Team/skills/conectar-web-al-dashboard` lo hace contigo.

## 8. Llamadas con IA (opcional)

- **Fathom de cada closer**: Agendas → Llamadas → Grabaciones → Cuentas → Añadir cuenta (su API key de Fathom) → Probar → Sincronizar.
- **Contexto de la IA**: Agendas → Análisis → Configurar IA. Ahí escribes qué vende el negocio, a quién y cómo, para que el análisis sea útil.

## Seguridad

- Registro abierto **apagado** en Supabase: nadie se crea una cuenta solo.
- Nunca compartas `SUPABASE_SECRET_KEY`, `CLAVE_CIFRADO`, el token de GHL ni la clave del proyecto (`x-forja-secreto`).
- Las direcciones de las Entradas son secretas. Si una se filtra, usa **Cambiar la dirección** en su tarjeta.
- Ya viene hecho: RLS en todas las tablas, permisos por rol, límite de intentos en el login y en los webhooks, claves cifradas y nunca en el navegador, y CSV protegidos contra fórmulas.

## Errores frecuentes

| Síntoma | Qué mirar |
|---|---|
| La web da error al entrar | Vercel → Deployments → Logs. Casi siempre es una variable mal copiada. |
| «Email o contraseña incorrectos» con la buena | Que el usuario exista. Un administrador le pone otra en su ficha → Acceso. |
| No llegan emails | `RESEND_API_KEY` en Vercel y el dominio «Verified» en Resend. Cada envío aparece en Resend → Logs. |
| Llamadas «En cola» que no avanzan | `ANTHROPIC_API_KEY` (y `DEEPGRAM_API_KEY`) en Vercel; después «Analizar pendientes». |
| «Falta la variable CLAVE_CIFRADO» | Agrégala y Redeploy. Si la cambiaste, vuelve a pegar el token de GHL. |
| No se suben PDF ni CSV | `NEXT_PUBLIC_SUPABASE_URL` tiene que estar al compilar: revísala y Redeploy. |
| `supabase db push` falla | Corre `supabase link` otra vez y revisa la contraseña de la base de datos. |

## Cómo adaptarlo a tu cliente

- **Logos**: `public/marca/` (`forja-marca.png` es el favicon y el logo del menú). Lo más simple: reemplázalos con el mismo nombre de archivo (se usan en el menú, el login, la bienvenida, el onboarding y los emails).
- **Colores**: los tokens de `src/app/globals.css` (`--primario`, `--oro` y el resto), en modo claro y oscuro. Todo el detalle está en `docs/manual-branding.md`.
- **Pipelines, columnas y productos**: `scripts/proyecto-base.json`, antes de correr `preparar-proyecto.mjs`.
- **Textos de España a Latinoamérica**: están en las páginas de `src/app/(panel)/`. Pídele a Claude Code: «pasa los textos visibles de la app a español neutro con tú, sin tocar nombres de variables».
- **Remitente de los emails**: `EMAIL_REMITENTE` en Vercel.
- **Un dashboard por cliente**: un repo, un proyecto de Supabase y un proyecto de Vercel por cliente. No mezcles datos de dos negocios en la misma base.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
