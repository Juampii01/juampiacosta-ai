# Formato de un lote (lote-X.json)

Un solo archivo JSON con tres listas:

{
  "guias": [ GUIA, ... ],
  "prompts": [ PACK, ... ],
  "herramientas": [ HERRAMIENTA, ... ]
}

## GUIA
{
  "slug": "minusculas-con-guiones-unico",
  "t": "Título claro (máx. ~70 caracteres)",
  "d": "Resumen de 1 o 2 frases: qué vas a lograr.",
  "tema": "uno de: Empezar | Claude | Claude Code | Skills | Negocio | Ventas | Contenido | Productividad | Automatizar | Agentes | Desarrollo | Vender IA",
  "min": 6,                       // minutos de lectura estimados (entero)
  "ficha": [["Qué es", "..."], ["Necesitás", "..."], ["Cuánto cuesta", "..."], ["Qué no hace", "..."]],   // opcional, 3-5 filas
  "fichaNombre": "nombre corto",  // opcional
  "secciones": [                  // 4 a 7 secciones. Cada una tiene "h" y al menos uno de estos campos:
    {"h": "Título de la sección",
     "p": ["párrafo", "párrafo"],                    // texto corrido
     "lista": ["Nombre: explicación", "..."],       // tarjetas; "Algo: texto" pone "Algo" en negrita
     "pasos": ["Paso 1 ...", "Paso 2 ..."],         // pasos numerados que se tildan
     "prompts": [{"t": "Nombre del prompt", "c": "Texto exacto para copiar. Lo que hay que completar va entre corchetes: [TU NEGOCIO]"}],
     "aviso": "Una advertencia corta (opcional)"}
  ],
  "faq": [{"q": "Pregunta", "a": "Respuesta"}],     // 2 a 4
  "fuentes": ["https://url-oficial-que-usaste", "..."]   // OBLIGATORIO si la guía afirma cómo funciona un producto
}

## PACK de prompts
{"tema": "Negocio", "t": "Título del pack", "d": "Una frase", "para": "Para qué te sirve, una frase",
 "prompts": [{"t": "Nombre", "c": "Prompt completo"}, ...]}   // 3 a 6 prompts por pack

## HERRAMIENTA
{"cat": "Skills | MCP | Herramientas", "tipo": "Skill | Plugin | MCP | App | Librería", "t": "Nombre",
 "d": "Qué hace (1-2 frases)", "para": "Para qué te sirve (1 frase)",
 "cmds": [{"donde": "Claude Code | Terminal | App de Claude", "c": "comando exacto"}],
 "url": "https://repo-o-doc-oficial", "repo": "dueño/repo o dominio", "licencia": "MIT (solo si la verificaste)",
 "fuente": "URL donde verificaste el comando"}
