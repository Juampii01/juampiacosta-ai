## Qué es

Jarvis OS es tu asistente personal en WhatsApp, con Claude como cerebro. Le escribes o le mandas notas de voz desde tu WhatsApp personal y él:

- te contesta y te transcribe los audios («Te entendí: …»),
- te prepara mensajes de seguimiento para tus clientes,
- te arma **contratos en Word** con los datos de tu empresa,
- crea **enlaces de pago de Stripe** (opcional),
- y **solo envía algo a un cliente cuando tú respondes `sí N`**.

Todo corre en tu Mac: WhatsApp (WAHA, en Docker), la transcripción (Whisper) y el puente con Claude Code. No hay servidor ni base de datos en la nube.

Lo que vendes: un asistente de WhatsApp para dueños de negocio, coaches o agencias que viven en el teléfono. Lo instalas en la computadora del cliente, con **su** cuenta de Claude.

## Qué necesitas

| Necesitas | Cómo |
|---|---|
| **Una Mac** | El instalador de un comando es para Mac. En Windows hay scripts aparte (ver abajo). |
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Ábrelo una vez y acepta los permisos. |
| **Node 22 o más** | `brew install node` |
| **Claude Code con tu propia cuenta de Claude** | `brew install --cask claude-code`, después abre `claude` y escribe `/login`. |
| **Un número secundario de WhatsApp** en un celular | Será el número de Jarvis. Tus clientes verán ese número. |
| **Unos 4 GB libres** | La primera instalación baja entre 2 y 3 GB. |
| **Stripe** | Opcional, para los enlaces de pago. |

## 1. Descarga

1. Descarga el ZIP con el botón de arriba de esta guía.
2. Descomprímelo en tu **carpeta personal** con el nombre `jarvis-os` (queda en `~/jarvis-os`). **No** lo pongas en Escritorio ni en Documentos: macOS puede bloquear ahí el arranque automático.

No hace falta subirlo a GitHub: Jarvis vive en tu Mac.

## 2. Instala (un comando)

Abre la Terminal y corre:

```bash
cd ~/jarvis-os && bash scripts/setup.sh
```

El instalador va en 8 pasos:

1. Comprueba Docker, Node y que Claude Code tenga la sesión iniciada.
2. Te pide tu nombre, a qué te dedicas, tu WhatsApp **personal** (con prefijo, por ejemplo `+5491122334455`) y tu zona horaria (por ejemplo `America/Argentina/Buenos_Aires` o `Mexico_City`).
3. Genera las claves (quedan en `.secrets/`, fuera de git).
4. Arranca WAHA y Whisper en Docker.
5. Te muestra un **QR**: escanéalo con el celular del número **secundario** (WhatsApp → Dispositivos vinculados → Vincular dispositivo).
6. Guarda tu configuración.
7. Lo deja siempre encendido (arranca solo cuando prendes la Mac).
8. Te manda un «Hola, soy Jarvis» a tu WhatsApp personal.

> Si la zona horaria que escribes no existe, usa `Europe/Madrid`. Escríbela bien para que las fechas de los contratos salgan con tu hora.

## 3. Datos para los contratos

El instalador crea `perfil/emisor.txt`. Ábrelo y completa los datos de tu empresa: nombre legal, estado o país, dirección, quién firma, email, moneda e idioma. Jarvis los lee en cada mensaje y nunca se suben a ningún lado.

## 4. Enlaces de pago con Stripe (opcional)

1. En Stripe → **Desarrolladores → Claves de API → Crear clave restringida**.
2. Dale permiso de **Escritura** solo a **Products**, **Prices** y **Payment Links**. Todo lo demás en **Ninguno**.
3. Pega la clave en `.secrets/stripe.env` así: `STRIPE_API_KEY=rk_live_…`

Sin esa clave, Jarvis funciona igual pero sin enlaces de pago. Crear un enlace no cobra nada.

## 5. Cómo se usa

| Le dices | Qué pasa |
|---|---|
| Cualquier mensaje o nota de voz | Te contesta. Los audios los transcribe primero. |
| «Haz seguimiento a Ana (+5491122334455) sobre la propuesta» | Te muestra un **Borrador N** con el texto exacto. |
| «Hazme un contrato de mentoría para Ana, 3 meses, 1.500 USD» | Te llega el contrato en **Word** por WhatsApp. Es un borrador: revísalo. |
| «Envíaselo a Ana (+5491122334455)» | **Borrador N** con el Word adjunto. |
| «Enlace de pago de 1.500 USD por la mentoría de Ana» | Te llega el enlace de Stripe. |
| `sí N` (escrito) | El borrador se envía. Por voz no vale, a propósito. |
| `no N` | El borrador se descarta. |
| `/nuevo` | Empieza una conversación desde cero. |

## En Windows

Funciona igual con Docker Desktop, pero sin el instalador de un comando: usa `scripts/start-jarvis.ps1` para arrancarlo y `scripts/install-task.ps1` para que arranque solo al iniciar sesión. Copia `config.example.env` como `config.env` y complétalo antes.

## Seguridad

- **Solo tu WhatsApp personal le da órdenes.** Lo que escriban otros (texto o audio) te llega reenviado como información; nunca lo obedece.
- **Nada sale sin tu `sí N`.** Claude no tiene herramientas: el envío lo hace el puente, no Claude.
- WAHA, Whisper y el puente solo escuchan en tu Mac (`127.0.0.1`). Las claves se generan en tu Mac y viven en `.secrets/`.
- Cada persona usa **su propia** cuenta de Claude. No instales Jarvis de un cliente con tu cuenta.

## Errores frecuentes

| Problema | Qué hacer |
|---|---|
| No contesta | Mira `logs/start.log`, `logs/bridge.log` y `logs/bridge-console.log`. |
| «Claude Code no tiene sesión» | Abre `claude`, escribe `/login` y vuelve a correr el instalador. |
| «Ya hay un Jarvis configurado aquí» | Para empezar de cero borra `config.env`, `.secrets/` y `waha/.sessions/`. |
| Docker no arranca | Ábrelo a mano, espera a que diga «running» y repite. |
| Reiniciar Jarvis | `launchctl kickstart -k gui/$(id -u)/com.jarvis.agent` |
| Apagarlo | `launchctl bootout gui/$(id -u)/com.jarvis.agent` |
| Volver a vincular WhatsApp | Borra `config.env`, `.secrets/` y `waha/.sessions/` y repite `bash scripts/setup.sh`. |
| Contestan dos Jarvis | Vinculaste el mismo número en dos computadoras. Un número secundario = un solo Jarvis. |

Si la Mac se duerme, Jarvis no contesta hasta que despierte. En una Mac que queda prendida, desactiva el reposo en **Ajustes → Batería / Energía**.

## Cómo adaptarlo a tu cliente

- **Su personalidad y reglas**: `bridge/system-prompt.txt`. Ahí defines cómo habla Jarvis, qué hace y qué nunca hace. Cambia el tono al de tu cliente (por ejemplo, tú en vez de vos, o más formal).
- **Datos de su empresa**: `perfil/emisor.txt` (contratos).
- **Nombre y a qué se dedica**: los pide el instalador y quedan en `config.env` (`OWNER_NAME`, `OWNER_ABOUT`).
- **Idioma de los audios**: `WHISPER_LANGUAGE` en `config.env`.
- **Un Jarvis por persona**: cada cliente con su Mac, su número secundario y su cuenta de Claude.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
