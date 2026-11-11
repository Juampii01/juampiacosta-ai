## Qué hace

Es el flujo con el que hice más de 70.000 vistas en 14 días, convertido en skills para Claude Code. Tú solo te grabas:

| Paso | Escribes | Qué hace |
|---|---|---|
| 0 | `/maquina-perfil` | 8 preguntas: tu nicho, tus cuentas de referencia, qué vendes y cómo hablas |
| 1 | `/maquina-radar` | Trae los reels de tu nicho y los ordena por cuánto superaron a su propia cuenta (no por vistas) |
| 2 | `/maquina-guiones` | Saca la estructura de los ganadores y te escribe guiones nuevos en tu forma de hablar |
| — | **Tú** | Te grabas |
| 3 | `/nc-editar` | Corta silencios, muletillas y tomas repetidas, iguala el audio y pone subtítulos animados |
| 4 | `/nc-caption` | Descripción, comentario fijado y texto de portada con tu palabra clave |
| 5 | `/maquina-tablero` | Anota cómo le fue a cada reel y le dice al radar qué repetir |

Con `/maquina` corre todo en orden y retoma donde quedaste.

> No publica nada en tus redes, no se loguea en tu Instagram y no copia textos ajenos: toma la estructura de lo que funciona y escribe con tus palabras.

## Qué necesitas

- **Claude Code**: viene con el plan Pro de Claude o superior (también dentro de la app de escritorio).
- **Una cuenta gratis de Apify**: trae US$ 5 de crédito por mes, que alcanzan para unos 1.500 reels.
- **Para editar video**: ffmpeg y faster-whisper. Corren en tu computadora y tu video no se sube a ningún lado.

## 1. Descarga e instala

1. Descarga el ZIP con el botón de arriba y descomprímelo.
2. Abre la terminal **dentro de la carpeta** `maquina-de-contenido` y corre el instalador:

```bash
bash instalar.sh
```

En Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File instalar.ps1
```

## 2. Tu clave de Apify (2 minutos)

1. Crea una cuenta gratis en [apify.com](https://apify.com). No pide tarjeta.
2. Tu nombre (arriba a la izquierda) → **Settings** → **API & Integrations** → copia el token.
3. Ábrelo y pega la clave después del igual: `APIFY_TOKEN=apify_api_...`
   - Mac: `open -e ~/.claude/maquina/.env`
   - Windows: `notepad $env:USERPROFILE\.claude\maquina\.env`
4. Comprueba que esté todo:

```bash
python3 setup/chequeo.py
```

En Windows: `py setup\chequeo.py`. Tiene que marcar ✓ en las skills, Python, Claude Code y Apify.

> Nunca pegues la clave en el chat con Claude. Va solo en ese archivo.

## 3. Úsala

Crea una carpeta para tu contenido (por ejemplo `Contenido`), abre Claude Code adentro y escribe:

```
/maquina
```

Te hace las preguntas del perfil, te muestra cuánto cuesta el radar antes de gastar y al final te deja los guiones en `Contenido/maquina/guiones/`.

¿Quieres verla sin gastar crédito? Pídele a Claude: *"corre el radar en modo demo"*. Usa cuentas inventadas.

## 4. Edición de video (cuando tengas tu video)

La primera vez, en Claude Code escribe: *"instálame las dependencias del editor"*. Te guía paso a paso y te pide permiso antes de cada comando. Después:

```
/nc-editar
```

Le pasas la ruta de tu video crudo y te muestra el plan de cortes antes de renderizar.

## Si algo falla

| Problema | Qué hacer |
|---|---|
| `/maquina` no aparece | Cierra y abre Claude Code. Si sigue, corre de nuevo el instalador |
| "Falta la clave de Apify" | Revisa que el archivo `.env` tenga la clave pegada después de `APIFY_TOKEN=` |
| Apify 402 | Se terminó el crédito gratis del mes |
| El radar no trae reels | Las cuentas tienen que ser públicas y estar bien escritas |
| El editor dice que falta algo | Escribe en Claude Code: "instálame las dependencias del editor" |

> ¿Te trabaste? Pregúntale a **Maestro** (en el menú, [/maestro](/maestro)) con el mensaje de error exacto.
