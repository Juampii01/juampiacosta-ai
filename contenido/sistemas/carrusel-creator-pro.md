## Qué es

Carrusel Creator Pro convierte carruseles virales de Instagram (o tu propio guion) en carruseles con **tu marca**, generados con **Codex** y listos para subir. Corre en tu computadora (**Mac o Windows**), en el navegador. Nada sale de tu computadora salvo las llamadas a ScrapeCreators (bajar el original), a Claude Code (redactar la ficha) y a Codex (generar las imágenes).

| Paso | Quién | Qué pasa |
|---|---|---|
| Link o guion | Tú | Pegas el link del carrusel original, o tu guion con bloques "SLIDE 1", "SLIDE 2"... |
| Ficha | Claude Code | Redacta la ficha de tu versión leyendo los slides del original. La editas en pantalla. |
| Comprobación | La app | Frena cifras que no están en el original, textos demasiado largos y palabras que ya dieron problemas. |
| Generar | Codex | Genera la escena de cada slide, sin pie ni contador. |
| Estampar | La app | Pone el contador y el pie idénticos en todos los slides. |
| Revisión | Tú | Ves cada slide en grande, corriges lo que falle (1 imagen por corrección) y apruebas. |
| Descripción | Claude Code | Texto para Instagram con 5 hashtags, y opcionalmente 5 variaciones con otro gancho. |
| Cerrar | La app | Exporta JPG a 1080×1350 sin metadatos de IA y los deja para descargar en ZIP. |

Tiene **varios clientes**: cada uno con su marca (fotos, @, color, lema, ropa), su ubicación para los metadatos y su biblioteca de carruseles.

Lo que puedes vender: producción de carruseles para la cuenta de Instagram de un cliente, con su cara y su marca.

> **Límite importante:** Codex, con un plan de ChatGPT, bloquea la generación de imágenes en torno a las **60 imágenes al día por cuenta** (medido, no publicado). Un carrusel de 7 slides con dos correcciones son 9 imágenes: da para 5 o 6 carruseles al día. Cada carrusel tarda de 5 a 12 minutos.

## Qué necesitas

- **Un Mac o una PC con Windows 10/11.** Corre en tu computadora: no se puede subir a Vercel (Codex y Claude Code usan la sesión de tu plan y cada carrusel tarda minutos).
- Para instalar las herramientas: [Homebrew](https://brew.sh) en Mac, o **winget** en Windows (ya viene en Windows 10 y 11).
- **Codex CLI** conectado a tu cuenta de ChatGPT (`codex login`): genera las imágenes con tu plan, sin pagar API.
- **Claude Code** conectado a tu cuenta (`claude`): redacta las fichas y las descripciones.
- Una clave de [ScrapeCreators](https://scrapecreators.com) para bajar los carruseles originales (1 crédito por carrusel). Sin clave puedes trabajar con tu propio guion.
- Las fotos del cliente: de 1 a 3 del personaje (con 2 o 3 la cara sale más fiel) y de 1 a 3 referencias de estilo.
- Google Chrome (la app se abre en Chrome y se puede instalar como app).

Cada persona usa **sus propias cuentas** y **su propia marca**. Tus fotos, fichas, carruseles y claves viven en la carpeta `datos/`, que nunca se sube a GitHub.

## 1. Descarga y súbelo a tu GitHub

Es una app local, así que GitHub no es obligatorio, pero te sirve de respaldo y para llevar tus cambios.

1. Descarga el ZIP con el botón de arriba de esta guía y descomprímelo donde la vayas a dejar (si después la mueves, hay que rehacer el lanzador del paso 5).
2. En GitHub, crea un repositorio nuevo **privado** y vacío (sin README), por ejemplo `carrusel-creator-pro`.
3. Abre una terminal dentro de la carpeta descomprimida (en Windows sirve PowerShell) y corre:

```bash
git init
git add .
git commit -m "Carrusel Creator Pro"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/carrusel-creator-pro.git
git push -u origin main
```

Si prefieres no usar la terminal, [GitHub Desktop](https://desktop.github.com) también sirve: **File → Add local repository**, elige la carpeta y publícala como privada.

> Nunca subas la carpeta `datos/`: tiene tus fotos, tus claves y los carruseles de tus clientes. El `.gitignore` ya la excluye.

## 2. Instala

**Mac** (en la Terminal, dentro de la carpeta):

```bash
chmod +x instalar.sh arrancar.sh crear-lanzador.sh
./instalar.sh
```

El `chmod` es por si al descomprimir el ZIP los scripts perdieron el permiso de ejecución. El instalador usa Homebrew para Node (20 o más), Python, ffmpeg y exiftool, instala Pillow (con eso se dibuja el pie), Codex CLI en la versión probada (0.158.0), Claude Code y las dependencias de la app.

**Windows** (en PowerShell, dentro de la carpeta):

```powershell
powershell -ExecutionPolicy Bypass -File .\instalar.ps1
```

Instala con winget Node, Python, ffmpeg, ExifTool y Git, después Pillow, Codex CLI, Claude Code y las dependencias, y crea un acceso directo **Carrusel Creator Pro** en el escritorio.

- Si dice que no encuentra algo que acaba de instalar, cierra PowerShell, abre una nueva y vuelve a correrlo.
- Si `python` no responde, entra a **Configuración → Aplicaciones → Alias de ejecución de aplicaciones**, desactiva los dos de python y vuelve a correrlo.

**En los dos sistemas**, al final te dice si Codex tiene sesión. Si no la tiene, corre:

```bash
codex login
```

Se abre el navegador con tu cuenta de ChatGPT. Para Claude Code, corre `claude` una vez e inicia sesión. También puedes conectar los dos desde la app, en **Ajustes**.

**Lo más fácil: que la instale tu Claude.** Abre Claude Code dentro de la carpeta (`claude`) y dile "instálame esta app". Sigue los pasos de `CLAUDE.md` en Mac o en Windows y te dice qué tienes que hacer tú (por ejemplo `codex login`).

## 3. Arranca

- **Mac:** `./arrancar.sh`
- **Windows:** doble clic en el acceso directo **Carrusel Creator Pro** del escritorio (o en `arrancar.cmd`).

Se abre sola en `http://carrusel.localhost:3000`. Usa siempre esa dirección (no `localhost:3000` a secas) y usa Chrome. Deja abierta la ventana de la terminal mientras uses la app: al cerrarla, se apaga.

## 4. Primera vez: la bienvenida

La primera vez aparece una **bienvenida** de 11 pasos (unos 3 minutos): tu nombre, tu @, el color, a quién le hablas, el lema del pie, tus fotos, tus referencias de estilo, la ropa, la clave de ScrapeCreators, la comprobación de Codex y Claude Code, y la ubicación de los metadatos.

Se repite desde **Ajustes → Repetir bienvenida**, y todo se puede cambiar después en **Branding** y **Ajustes**. Las claves las pegas tú en la app: no las pases por ningún chat.

Para sumar un cliente: selector de arriba en la barra lateral → **+ Nuevo cliente** (bienvenida corta de 9 pasos).

## 5. Solo en Mac: instálala como app del Dock (opcional)

En Windows no hace falta: ya tienes el acceso directo del escritorio.

1. Con `./arrancar.sh` en marcha, en Chrome aprieta el ícono de **Instalar** de la barra de direcciones (o menú ⋮ → Transmitir, guardar y compartir → Instalar página como aplicación).
2. Cierra el servidor que arrancaste (Ctrl+C en la Terminal) y corre una vez:

```bash
./crear-lanzador.sh
```

Crea el ícono **Carrusel Creator Pro** en `~/Applications`. Arrástralo al Dock y quita el que instaló Chrome (clic derecho → Opciones → Quitar del Dock). Desde ahí:

- Al abrirlo se enciende el servidor y se abre la app.
- Al cerrar la app (X o Cmd+Q) el servidor se apaga solo.
- El registro queda en `~/Library/Logs/carrusel-creator-pro.log`.
- Si mueves la carpeta, vuelve a correr `./crear-lanzador.sh`. Para quitarlo: `./crear-lanzador.sh --quitar`.

## Actualizar

Cuando haya una versión nueva, descarga el ZIP nuevo, reemplaza los archivos (sin tocar tu carpeta `datos/`) y vuelve a correr el instalador (`./instalar.sh` en Mac, `instalar.ps1` en Windows). Tus datos no se tocan.

## Seguridad

- **`datos/` es tuyo y de tus clientes**: fotos, claves y carruseles. Nunca lo subas a GitHub ni lo compartas.
- **Las claves se pegan en la app**, no en un chat ni en archivos sueltos. `codex login` lo haces tú en tu navegador.
- **Contenido de terceros:** los carruseles virales son de otras personas. Úsalos como referencia para hacer tu versión.
- **Metadatos:** al cerrar, cada imagen se recodifica como JPEG y se le borran todos los metadatos, incluido el manifiesto de contenido de IA. Como único dato se escribe una ubicación (por defecto Newark, New Jersey). La marca de agua invisible en los píxeles se degrada, pero no hay forma de confirmar que desaparece. Úsalo bajo tu criterio y el de las normas de la plataforma donde publiques.
- Eliminar un cliente no borra nada: su carpeta pasa a `datos/_papelera/`.

## Errores frecuentes

| Mensaje | Qué hacer |
|---|---|
| `Este instalador es para Mac. En Windows usa instalar.ps1 (ver README).` | En Windows corre `powershell -ExecutionPolicy Bypass -File .\instalar.ps1`. |
| `No encuentro ... después de instalarlo. Cierra esta ventana, abre una nueva y vuelve a ejecutar el script.` | (Windows) Cierra PowerShell, abre una nueva y vuelve a correr `instalar.ps1`. |
| `'python' no responde: ... Alias de ejecución de aplicaciones` | (Windows) Desactiva los alias de python en Configuración y vuelve a correr el instalador. |
| `Falta Homebrew. Instálalo desde https://brew.sh y vuelve a ejecutar este script.` | Instala Homebrew (te pide tu contraseña del Mac) y vuelve a correr `./instalar.sh`. |
| `Node ... es antiguo: la app necesita Node 20 o más (brew upgrade node)` | Corre `brew upgrade node` y vuelve a instalar. |
| `Codex sin sesión: ejecuta  codex login  (se abre el navegador)` | Corre `codex login` y entra con tu cuenta de ChatGPT. |
| `Primero ejecuta ./instalar.sh` / `Primero ejecuta instalar.ps1` | Falta instalar las dependencias: corre el instalador de tu sistema. |
| `SESION_CLAUDE_CADUCADA: tu sesión de Claude caducó. Inicia sesión y vuelve a probar.` | Corre `claude` en la terminal (o conéctalo desde **Ajustes**), inicia sesión y reintenta. |
| `Falta Claude Code. Instálalo (npm install -g @anthropic-ai/claude-code) y entra con: claude` | Instala Claude Code con ese comando e inicia sesión. |
| `Falta SCRAPECREATORS_API_KEY` | Carga tu clave de ScrapeCreators en **Ajustes**, o trabaja con tu propio guion. |
| `FALLO_SCRAPECREATORS: Ese post tiene restricción de edad…` / `…cuenta privada…` | ScrapeCreators solo baja posts públicos: prueba con otro carrusel. No se gasta crédito. |
| `FALLO_SCRAPECREATORS: ScrapeCreators respondió 404` | El post no existe: copia el link desde la barra del navegador, no lo tipees (una `l` y un `1` se confunden). |
| `LIMITE_DE_USO` | Codex llegó al cupo de imágenes del día. Espera al día siguiente o usa otra cuenta de ChatGPT. |
| `FALTA_MARCA: este cliente no tiene fotos del personaje. Súbelas en Branding.` | Sube de 1 a 3 fotos del personaje en **Branding**. |
| `SOBRAN: Codex generó ... imágenes para ... slides` | Codex rehízo alguna imagen. Elige en la app cuál es la buena de cada slide. |
| `Pega el link de un carrusel de Instagram (https://www.instagram.com/p/…)` | El link no es de un post de Instagram. |
| `Ese link es de un reel, no de un carrusel.` | Pega el link de un post con varios slides. |
| `No encontré ningún "SLIDE 1", "SLIDE 2"… en el guion` | Separa tu guion en bloques que empiecen con "SLIDE 1", "SLIDE 2", etc. |
| `Espera a que termine la generación` | Codex genera de a un carrusel por vez entre todos los clientes. Espera. |
| Falla al generar con un error de opciones de Codex | Vuelve a la versión probada: `npm install -g @openai/codex@0.158.0`. |

Si algo tapa el @ del pie, sin gastar imágenes: `python3 motor/carrusel.py encoger NOMBRE-DEL-CARRUSEL NUMERO-DE-SLIDE` (en Windows, `python` en vez de `python3`) encoge la escena de ese slide.

## Cómo adaptarlo a tu cliente

- **Marca de cada cliente** (lo principal, sin tocar código): pestaña **Branding**: fotos del personaje, referencias de estilo, @, color, lema, ángulo, ropa y ubicación. Cada cliente queda en `datos/perfiles/NOMBRE-DEL-CLIENTE/`.
- **Prompt que recibe Codex**: `motor/PROMPT_BASE.txt` (y `motor/PROMPT_BASE_CLARO.txt`). Ahí está fijo, por ejemplo, que el carrusel es "sobre AI", el fondo oscuro y futurista y la tipografía Montserrat. Si tu cliente es de otro rubro o estilo, cámbialo ahí.
- **Prompt de la ficha, la descripción y las variaciones**: `motor/PROMPT_FICHA.txt`, `motor/PROMPT_DESCRIPCION.txt` y `motor/PROMPT_VARIACIONES.txt`.
- **Reglas del motor** (ficha, comprobaciones): `motor/REGLAS.md`.
- **Pie y contador** (se dibujan con Pillow, en Python): `motor/plantilla/plantilla.py`. En Mac usa Helvetica Neue; en Windows, la fuente Inter que viene en `motor/plantilla/fuentes/`.
- **Logo e íconos de la app**: `app/public/` (`icon-192.png`, `icon-512.png`, `forja.png`) y la intro en `app/public/intro`.
- **Probar otra marca sin tocar la tuya**: en Mac, `CCP_DATOS=/ruta/a/otra/carpeta ./arrancar.sh`; en Windows, en PowerShell, `$env:CCP_DATOS="C:\ruta"; .\arrancar.ps1`.

Después de tocar el motor, corre `python3 motor/pruebas/correr.py` (en Windows, `python motor\pruebas\correr.py`): tiene que terminar con "fallan 0". No gasta imágenes ni créditos.

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
