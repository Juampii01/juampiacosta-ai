# Mejoras de una guía (contenido/mejoras/<slug>.json)

Una mejora se superpone a la guía original al construir (build.py). No se edita el lote de origen.
La construcción FALLA si una corrección no encuentra su texto: así nada queda a medias.

```json
{
  "slug": "slug-de-la-guia",
  "verificada": "2026-11-08",
  "correcciones": [
    {"antes": "texto EXACTO que hoy está en la guía (copiado tal cual)",
     "despues": "texto corregido",
     "motivo": "por qué: qué dice la fuente oficial",
     "fuente": "https://url-oficial"}
  ],
  "fuentes_extra": ["https://url-oficial-nueva", "..."],
  "ejemplo": {
    "titulo": "Ejemplo resuelto: [qué se logra]",
    "negocio": "Quién es (negocio ficticio pero realista de Latinoamérica: rubro, ciudad, tamaño)",
    "punto_de_partida": "La situación antes, en 1 o 2 frases",
    "pasos": ["Lo que hizo, paso a paso, con lo que pegó o configuró", "..."],
    "resultado": "Qué quedó funcionando (sin números inventados de ahorro o ventas)"
  },
  "si_falla": [
    {"sintoma": "Lo que ve la persona cuando algo sale mal", "solucion": "Qué hacer, concreto"}
  ],
  "kit": [
    {"archivo": "nombre-del-archivo.md", "que_es": "Una frase: qué es y cómo se usa",
     "contenido": "El archivo completo, listo para usar (markdown, texto, JSON o YAML)"}
  ],
  "notas_revision": "Resumen corto de qué verificaste y qué no se pudo verificar (no se muestra en la web)"
}
```

## Reglas

- **correcciones**: solo errores reales (datos desactualizados, menús o comandos mal escritos, afirmaciones sin respaldo). Cada una con fuente oficial. Si una afirmación no se puede verificar, corregila para que no afirme de más o sacala (despues: texto más prudente). `antes` tiene que coincidir carácter por carácter con un texto de la guía (dentro de un párrafo, ítem de lista, paso, prompt, FAQ o ficha). Si no hay errores, lista vacía.
- **ejemplo**: SIEMPRE marcado como ejemplo (nunca "caso real" ni nombres de empresas reales). Negocio latino creíble. Pasos que cualquiera puede repetir con lo que está en la guía. Sin cifras inventadas de resultados.
- **si_falla**: 3 a 5 problemas comunes de verdad (los que aparecen en la ayuda oficial, en los issues del repo o en foros), con solución concreta.
- **kit**: 1 a 3 archivos PROPIOS y originales que la persona descarga y usa directo: una skill (SKILL.md con frontmatter name/description), un CLAUDE.md de ejemplo, una plantilla, una checklist, un pack de prompts en .md, un archivo de configuración. Nada copiado de terceros. Que funcione tal cual (formatos verificados en la doc oficial).
- Español rioplatense con voseo, frases cortas, sin emojis.
- Cero números inventados. Comandos y nombres de menús exactamente como en la documentación oficial.
