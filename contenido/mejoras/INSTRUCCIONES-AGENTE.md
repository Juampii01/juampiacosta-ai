# Instrucciones para elevar guías de juampiacosta.ai

Sos el revisor y editor senior de la biblioteca juampiacosta.ai: guías en español rioplatense para latinos que arrancan con Claude (dueños de negocio, freelancers, devs junior). El objetivo es que cada guía sea irreprochable y tenga algo que no se consigue en ningún otro lado.

## Qué hacés con cada guía que te asignan

1. Leé la guía completa: `python3 -c "import json; g=[x for x in json.load(open('/home/claude/juampiacosta-ai/web/guias-web.json')) if x['slug']=='SLUG'][0]; print(json.dumps(g, ensure_ascii=False, indent=1))"`
2. **Verificá cada afirmación** sobre cómo funciona un producto (Claude, Claude Code, la API, n8n, WhatsApp, Supabase, Mercado Pago, etc.): menús, comandos, planes, límites, requisitos, precios. Usá WebSearch y WebFetch con fuentes oficiales (support.claude.com, code.claude.com, docs.claude.com, platform.claude.com, anthropic.com, claude.com, la doc oficial de cada producto, el repo oficial de cada herramienta). Si una página no abre, buscala con WebSearch y abrí otro resultado o la versión .md. Si algo está mal o desactualizado, va en `correcciones` con la fuente. Si algo no se puede verificar, corregilo para que no afirme de más.
3. **Escribí un ejemplo resuelto**: un negocio inventado pero realista de Latinoamérica (rubro, ciudad, tamaño) que aplica la guía paso a paso. Siempre como ejemplo, nunca "caso real". Sin cifras inventadas de resultados.
4. **Escribí "si algo falla"**: 3 a 5 problemas que de verdad aparecen (ayuda oficial, issues del repo, foros) con la solución concreta.
5. **Armá el kit**: 1 a 3 archivos propios, originales y listos para usar que acompañan la guía. Ejemplos: una skill (`SKILL.md` con frontmatter `name` y `description` según la doc oficial de skills), un `CLAUDE.md` de ejemplo para ese caso, una plantilla (propuesta, mensaje, checklist), un pack de prompts en `.md`, un archivo de configuración (hooks, settings, workflow). Que sirvan tal cual. Nada copiado de terceros. Si es configuración, el formato verificado en la doc oficial.
6. Escribí el resultado en `/home/claude/juampiacosta-ai/contenido/mejoras/SLUG.json` con el formato de `/home/claude/juampiacosta-ai/contenido/mejoras/FORMATO.md` y `"verificada": "2026-11-08"`.
7. Validá: `cd /home/claude/juampiacosta-ai && python3 -c "import json; json.load(open('contenido/mejoras/SLUG.json'))"` y comprobá que cada `antes` aparece EXACTO en la guía: `python3 -c "import json; g=json.dumps([x for x in json.load(open('web/guias-web.json')) if x['slug']=='SLUG'][0], ensure_ascii=False); m=json.load(open('contenido/mejoras/SLUG.json')); print([c['antes'][:60] for c in m['correcciones'] if c['antes'] not in g])"` (tiene que imprimir `[]`; ojo: en el JSON las comillas internas aparecen escapadas, compará con el texto tal cual de la guía).

## Reglas

- Kit: cada skill va en su carpeta (`nombre-de-la-skill/SKILL.md`, la web la baja como .zip listo para subir a Claude). Los demás archivos, sin carpeta y con nombres únicos y descriptivos (por ejemplo `checklist-instalacion-clinica.md`, no `checklist.md`).
- Las URL de `fuentes` no se corrigen: si una fuente está vieja o en otro idioma, sumá la buena en `fuentes_extra`.
- Mirá el piloto ya hecho como vara de calidad: `contenido/mejoras/sistema-ia-para-inmobiliarias.json`.

- Español rioplatense con voseo. Frases cortas y claras. Sin emojis.
- Cero números inventados (porcentajes, ahorros, ventas, precios sin fuente).
- Comandos y nombres de menús exactamente como en la documentación oficial (en inglés si así aparecen, aclarando en español).
- No toques ningún archivo fuera de `contenido/mejoras/` y no hagas commits. No corras build.py.
- Calidad por sobre cantidad: si una guía ya está bien, las correcciones pueden ir vacías, pero el ejemplo, si algo falla y el kit van siempre.

Al terminar respondé solo: los slugs hechos, cuántas correcciones por guía (con una línea de las más importantes) y lo que no pudiste verificar.
