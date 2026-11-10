## Qué es

Setter AI es tu propio ManyChat con IA para Instagram, corriendo en tu servidor:

- **Flujos**: comentario en un reel, palabra clave por DM, respuesta o mención en historia, enlace ig.me. Respuesta pública + DM con botones, condiciones («¿me sigue?»), esperas, etiquetas y carruseles, con un **constructor visual**.
- **Setter con IA**: Claude conversa con quien te escribe como una persona del equipo: hace preguntas, completa la ficha del lead y le pasa tu agenda o tu membresía. Tiene modo prueba, borradores y un **simulador**.
- **Métricas**: embudo por reel y por día, tablero de leads por etapa, clics en tu agenda y análisis de objeciones con IA.
- **Seguridad**: firma de Meta comprobada, token cifrado, límites anti-ban, pausa automática si Meta bloquea, y **BORRAR** por DM para borrar los datos de una persona.
- **Espacios**: varias cuentas de Instagram (tus clientes) en un mismo servidor, cada una con su base de datos.

Lo que vendes: el setter de Instagram de un creador o infoproductor, sin pagar ManyChat Pro y con la IA entrenada con su oferta.

> Licencia MIT (proyecto original de código abierto), adaptado para Forja IA.

## Qué necesitas

| Cuenta | ¿Obligatoria? | Para qué |
|---|---|---|
| **Instagram profesional** (empresa o creador) | Sí | La API de Instagram solo funciona con cuentas profesionales. |
| **Meta for Developers** | Sí | Crear tu app de Instagram. Gratis. |
| **GitHub** | Sí | Render despliega desde tu repo. |
| **Neon** | Sí | La base de datos (Postgres). Tiene plan gratis. |
| **Render** | Sí | El servidor, prendido 24/7. El `render.yaml` usa el plan **Starter** (de pago): los servicios gratis se duermen y los avisos de Meta se pierden. |
| **Anthropic** | Para el setter | La IA. Pago por uso, centavos por conversación. |

En tu computadora: **Node 22+**, **git** y **Docker** (solo para probar en local).

> Regla de oro: las claves (tokens, contraseñas, App Secret, API keys) van **solo** en tu `.env` o en Render. Nunca las pegues en un chat ni las subas a GitHub.

## 1. Descarga y súbelo a tu GitHub

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo.
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `setter-ai`.
3. Abre una terminal dentro de la carpeta descomprimida y corre:

```bash
git init
git add .
git commit -m "Setter AI"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/setter-ai.git
git push -u origin main
```

## 2. Pruébalo en tu computadora (opcional)

```bash
npm ci
docker run --name setter-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17
cp .env.example .env
```

En `.env` pon como mínimo:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable
ADMIN_PASSWORD=una-clave-de-12-o-mas
WEBHOOK_VERIFY_TOKEN=cualquier-texto
```

```bash
npm run build
npm run dev
```

Abre `http://localhost:3000/app` y crea tu cuenta de admin con la `ADMIN_PASSWORD`. En local Instagram no te puede avisar (necesita una dirección pública): para eso está Render.

> Con Claude Code: abre `claude` en la carpeta y dile «Lee docs/INSTALACION.md y guíame en el paso 2. No me muestres las claves en el chat». Cada paso de esa guía trae un prompt listo para copiar.

## 3. Base de datos en Neon

1. Entra en [console.neon.tech](https://console.neon.tech/) y crea un proyecto (en una región cercana a la de Render).
2. Pulsa **Connect** y copia la **connection string** (empieza con `postgresql://` y termina en `sslmode=require`).
3. Esa es tu `DATABASE_URL`. Las tablas se crean solas al arrancar.

## 4. Servidor en Render

1. En [dashboard.render.com](https://dashboard.render.com/) → **New → Blueprint** y conecta tu repo.
2. Render lee `render.yaml` y crea el servicio `setter-ai`. `WEBHOOK_VERIFY_TOKEN` y `TOKEN_ENCRYPTION_KEY` se generan solos.
3. Completa `DATABASE_URL` (la de Neon) y `ADMIN_PASSWORD` (inventa una larga). Las demás las completas en el paso 6.
4. Cuando termine el despliegue, abre `https://TU-SERVICIO.onrender.com/healthz`: tiene que responder `{"ok":true}`.

## 5. Tu app de Meta (Instagram)

Es la «app» que le da permiso a tu servidor para leer comentarios y mandar mensajes de **tu** cuenta.

1. [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Crear app**, con el caso de uso **«Administrar mensajes y contenido en Instagram»**.
2. En ese caso de uso, menú de la izquierda → **«Configuración de la API con el inicio de sesión de Instagram»**:
   - **Identificador de la aplicación de Instagram** → `INSTAGRAM_APP_ID`.
   - **Clave secreta de la aplicación de Instagram** (botón Mostrar) → `META_APP_SECRET`.
   - **1. Añade los permisos**: `instagram_business_basic`, `instagram_business_manage_comments` e `instagram_business_manage_messages`.
   - **2. Genera identificadores de acceso**: agrega tu cuenta de Instagram y genera el token → `IG_ACCESS_TOKEN`.
   - **3. Configura los webhooks**: URL `https://TU-SERVICIO.onrender.com/webhooks/instagram` y, como token de verificación, el `WEBHOOK_VERIFY_TOKEN` de Render. Suscríbete a comentarios y mensajes.

> Si tu cuenta de Instagram tiene un rol en la app (administrador o evaluador), no necesitas pasar la revisión de Meta para usarla con **tu propia** cuenta. Para la cuenta de un cliente, agrégala como evaluador o usa **Espacios** (ver abajo).

> Meta marca hoy esta configuración como «heredada», aunque sigue funcionando. Si la retirara, habría que adaptar `src/instagram-connect.ts` y `src/meta/client.ts`.

## 6. Variables en Render

Render → tu servicio → **Environment**:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | Sí | La connection string de Neon. |
| `ADMIN_PASSWORD` | Sí | Para crear la cuenta de admin en la web. |
| `WEBHOOK_VERIFY_TOKEN` | Sí | La genera Render. La misma que pusiste en Meta. |
| `TOKEN_ENCRYPTION_KEY` | Sí | La genera Render. Cifra el token y firma los enlaces. |
| `META_APP_SECRET` | Sí | Clave secreta de la app de Instagram. |
| `IG_ACCESS_TOKEN` | Sí | Token de tu cuenta de Instagram. |
| `INSTAGRAM_APP_ID` | Sí | Identificador de la app de Instagram. |
| `ANTHROPIC_API_KEY` | Para el setter | Sin ella los DMs se guardan, pero la IA no responde. |
| `SETTER_MODEL` | No | Modelo de Claude del setter. Por defecto, Haiku. |
| `SEND_LIMIT_*` | No | Límites de envíos por hora (anti-ban). Vienen con valores seguros. |

Guarda: Render vuelve a desplegar solo. Todas las variables están explicadas en `.env.example`.

## 7. Primer arranque

1. Abre `https://TU-SERVICIO.onrender.com/app` y crea tu cuenta de admin con la `ADMIN_PASSWORD`.
2. **Configuración → Instagram y envíos**: comprueba que aparece tu cuenta y pulsa **Volver a suscribir los avisos de Meta**.

## 8. El setter con IA

1. **Setter IA → Documentos**: pega el documento de ejemplo (`ejemplos/documento-setter.md`) para probar y después cámbialo por el de tu negocio: cliente ideal, oferta, precios, objeciones, tono y lo que nunca debe decir.
2. **Setter IA → Modo → Tus enlaces**: tu agenda, tu enlace de pago y tu correo.
3. Déjalo en **Modo Prueba** y pon en *Usuarios de prueba* una cuenta tuya.
4. **Simulador**: elige un escenario y mira cómo contestaría (cuesta centavos).

> Con Claude Code: «Ayúdame a escribir el documento del setter de mi negocio a partir de ejemplos/documento-setter.md. Hazme las preguntas de a una. Lo que no sepa, márcalo como [COMPLETAR]».

## 9. Tu primer flujo y la prueba real

1. **Flujos → Crear flujo** con la plantilla **Recurso por comentario**.
2. Cambia los textos y el enlace del recurso y pulsa **Activar** (te pide escribir ACTIVAR).
3. Desde **otra** cuenta de Instagram, comenta en uno de tus reels.
4. Mira **Conversaciones**, **Contactos** y **Configuración → Registro**.

Cuando todo funcione con tu cuenta de prueba, saca el setter del Modo Prueba.

## Espacios: varios clientes en un servidor (opcional)

En **Configuración → Clientes** creas un espacio por cada cuenta de Instagram de un cliente. Cada espacio tiene su base de datos y sus usuarios. Un espacio nuevo nace con los **envíos bloqueados** hasta que el admin principal los activa. Si solo usas tu cuenta, no necesitas esto.

## Seguridad

- Prueba siempre primero en **Modo Prueba**: la IA solo contesta a las cuentas que pongas.
- La app solo escribe a quien comenta o te escribe primero, y tiene límites por hora. Aun así, Meta puede restringir una cuenta si hay muchos rechazos.
- Revisa las páginas legales (`/privacy`, `/terms`, `/data-deletion`, en `src/legal.ts`) y ponles los datos de tu negocio antes de usarlo con gente real.
- Quien escribe **BORRAR** por DM borra sus datos.

## Errores frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Meta no verifica el webhook | El token no coincide o la URL está mal | Revisa `WEBHOOK_VERIFY_TOKEN` en Render y la URL `…/webhooks/instagram`. |
| Registro: «Firma no válida» | `META_APP_SECRET` no es el de la app de Instagram | Copia la clave secreta de la **app de Instagram** (o prueba `META_APP_SECRET_ALT` con la de Facebook). |
| No responde a comentarios | Flujo inactivo, en modo prueba o sin avisos suscritos | Activa el flujo, revisa los usuarios de prueba y pulsa **Volver a suscribir los avisos de Meta**. |
| «Falta el token de Instagram» | `IG_ACCESS_TOKEN` vacío o vencido | Genera otro en Meta y ponlo en Render. |
| El setter no contesta | Modo apagado, sin enlaces, sin documento o sin `ANTHROPIC_API_KEY` | **Configuración → Registro** dice el motivo exacto. |
| Envíos pausados 24 h | Meta devolvió el error 368 (bloqueo por política) | Espera y revisa el estado de tu cuenta en Instagram antes de reanudar. |
| Algunos no reciben el DM | Meta no deja escribirle a esa persona (error 2534025) | Es normal. Activa el *plan B* del flujo: respuesta pública pidiéndole que te escriba. |

## Cómo adaptarlo a tu cliente

- **Lo que dice la IA**: el documento del setter (Setter IA → Documentos) es lo más importante. Uno por cliente, con su oferta y su tono.
- **Idioma y reglas fijas**: Setter IA → Marco técnico (por defecto contesta en español).
- **Enlaces**: agenda, membresía y correo en Setter IA → Modo, o con `SETTER_LINK_AGENDA`, `SETTER_LINK_MEMBERSHIP` y `SETTER_CONTACT_EMAIL`.
- **Nombre de la web**: el `<title>` de `web/index.html` («Setter IA»).
- **Colores**: las variables `--color-*` de `web/src/styles.css`. El sistema de diseño completo está en `design-system/`.
- **Páginas legales**: `src/legal.ts`.
- **Varios clientes**: un espacio por cliente en el mismo servidor, o un servidor y una base de datos por cliente si prefieres tenerlos separados.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
