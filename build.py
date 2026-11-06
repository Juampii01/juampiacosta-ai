"""Construye la web: index.html (inicio), recursos.html (biblioteca) y una página por guía en guias/.

1. contenido/guias.py escribe web/guias-web.json (el texto de las guías).
2. Este script genera web/guias-web.js, guias/<slug>.html y recursos.html con la versión de los archivos
   (?v=…) para que el navegador no use copias viejas.
Uso: python3 build.py
"""
import hashlib
import html
import json
import re
import runpy
from pathlib import Path

RAIZ = Path(__file__).parent
WEB = RAIZ / "web"


def version():
    suma = hashlib.sha1()
    for f in sorted(p for p in WEB.rglob("*") if p.is_file() and p.name != "guias-web.js"):
        suma.update(f.read_bytes())
    return suma.hexdigest()[:8]


TEMAS = {"Empezar", "Claude", "Claude Code", "Skills", "Negocio", "Ventas", "Contenido", "Productividad", "Automatizar",
         "Asistentes", "Conectores", "Video", "Agentes", "Desarrollo", "Vender IA"}


def lotes():
    """contenido/lotes/lote-*.json: guías, packs de prompts y herramientas nuevas, en orden de lote."""
    g, p, h = [], [], []
    for f in sorted((RAIZ / "contenido" / "lotes").glob("lote-*.json")):
        d = json.loads(f.read_text())
        g += d.get("guias", []); p += d.get("prompts", []); h += d.get("herramientas", [])
    return g, p, h


def validar(guias, prompts, herrs):
    """Para la construcción si falta algo que la web necesita: mejor fallar acá que mostrar una guía rota."""
    vistos = set()
    for g in guias:
        for k in ("slug", "t", "d", "tema", "min", "secciones"):
            assert g.get(k), f"guía {g.get('slug')}: falta {k}"
        assert g["slug"] not in vistos, f"slug repetido: {g['slug']}"
        vistos.add(g["slug"])
        assert g["tema"] in TEMAS, f"guía {g['slug']}: tema raro «{g['tema']}»"
        for s in g["secciones"]:
            assert s.get("h") and any(s.get(k) for k in ("p", "lista", "pasos", "prompts")), f"guía {g['slug']}: sección vacía"
            for x in s.get("prompts", []):
                assert x.get("t") and x.get("c"), f"guía {g['slug']}: prompt sin título o texto"
    for x in prompts:
        assert x.get("t") and x.get("tema") and x.get("prompts"), f"pack de prompts incompleto: {x.get('t')}"
    for x in herrs:
        assert x.get("cat") in ("Skills", "MCP", "Herramientas") and x.get("t") and x.get("url") and isinstance(x.get("cmds"), list), f"herramienta incompleta: {x.get('t')}"


BLOQUEADO = "🔒 Disponible con el acceso completo."


def datos_js(prompts, herrs):
    """prompts.js y herramientas.js (completos, solo para quien pagó) y sus versiones «vista» para el plan gratis:
    mismos títulos y descripciones, sin el texto de los prompts ni los comandos. El middleware elige cuál servir."""
    vista_p = [{**p, "prompts": [{"t": x["t"], "c": BLOQUEADO} for x in p["prompts"]]} for p in prompts]
    vista_h = [{**h, "cmds": [{"donde": c["donde"], "c": BLOQUEADO} for c in h["cmds"]]} for h in herrs]
    (WEB / "prompts-vista.js").write_text("// Generado por build.py: vista del plan gratis (sin el texto de los prompts).\n"
                                          f"var PROMPTS = {json.dumps(vista_p, ensure_ascii=False)};\n")
    (WEB / "herramientas-vista.js").write_text("// Generado por build.py: vista del plan gratis (sin los comandos).\n"
                                               f"var HERRAMIENTAS = {json.dumps(vista_h, ensure_ascii=False)};\n")
    (WEB / "prompts.js").write_text("// Generado por build.py desde contenido/base-prompts.json y contenido/lotes/. No editar a mano.\n"
                                    f"var PROMPTS = {json.dumps(prompts, ensure_ascii=False)};\n")
    (WEB / "herramientas.js").write_text("// Generado por build.py desde contenido/base-herramientas.json y contenido/lotes/. No editar a mano.\n"
                                         f"var HERRAMIENTAS = {json.dumps(herrs, ensure_ascii=False)};\n")


GRATIS_EXTRA = ["sistema-base-modulo-1-la-oferta"]


def es_gratis(g):
    """Abiertas para quien se registra gratis: las guías de los reels y el Módulo 1 del sistema base."""
    return bool(g.get("post")) or g["slug"] in GRATIS_EXTRA


def guias_web(v):
    """web/guias-web.js lleva solo los datos para listar (sin el contenido); cada guía lleva su contenido dentro de su página.
    Así la biblioteca puede mostrar todas las guías, y el middleware decide quién abre cada una."""
    datos = json.loads((WEB / "guias-web.json").read_text())
    meta = [{k: g[k] for k in ("slug", "t", "d", "tema", "min", "post") if k in g} | ({"gratis": True} if es_gratis(g) else {}) for g in datos]
    (WEB / "guias-web.js").write_text(
        "// Generado por build.py: solo título, resumen, tema y minutos de cada guía. El contenido va en guias/<slug>.html.\n"
        f"var GUIAS_WEB = {json.dumps(meta, ensure_ascii=False)};\n"
    )
    (RAIZ / "lib" / "gratis.js").write_text(
        "// Generado por build.py: guías que abre quien se registra gratis (las de los reels y el Módulo 1).\n"
        f"export const GUIAS_GRATIS = new Set({json.dumps([g['slug'] for g in datos if es_gratis(g)])});\n"
    )
    carpeta = RAIZ / "guias"
    carpeta.mkdir(exist_ok=True)
    for viejo in carpeta.glob("*.html"):
        viejo.unlink()
    plantilla = (WEB / "guia.html").read_text()
    for g in datos:
        # </script> dentro del texto cortaría el script: se escapa la barra
        contenido = json.dumps(g, ensure_ascii=False).replace("</", "<\\/")
        pagina = (plantilla.replace("{{SLUG}}", g["slug"]).replace("{{V}}", v)
                  .replace("{{TITULO}}", html.escape(g["t"])).replace("{{DESC}}", html.escape(g["d"]))
                  .replace("{{GUIA}}", contenido))
        (carpeta / f"{g['slug']}.html").write_text(pagina)
    return len(datos)


# ---------------------------------------------------------------- Vitrina
AGRUPAR = {"Conectores": "Claude", "Asistentes": "Claude Code", "Video": "Contenido"}
ORDEN_TEMAS = ["Vender IA", "Agentes", "Desarrollo", "Claude Code", "Skills", "Negocio", "Automatizar", "Ventas", "Contenido",
               "Claude", "Productividad", "Empezar"]
LOGOS_VITRINA = ["claude", "github", "notion", "supabase", "vercel", "n8n", "zapier", "make", "figma", "googledrive", "gmail", "whatsapp"]


def rutas_py():
    """Lee web/rutas.js: id -> lista de slugs."""
    t = (WEB / "rutas.js").read_text()
    salida = {}
    for m in re.finditer(r'id: "([a-z0-9-]+)".*?pasos: \[(.*?)\]', t, flags=re.S):
        salida[m.group(1)] = re.findall(r'"([a-z0-9-]+)"', m.group(2))
    return salida


def vitrina(guias, prompts, herrs, en_biblioteca):
    """Tarjetas grandes con lo más completo. En la biblioteca cada guía es un link; en el inicio, solo texto."""
    por = {g["slug"]: g for g in guias}
    rutas = rutas_py()
    e = html.escape

    def item(i, slug, quitar=""):
        g = por[slug]
        titulo = e(re.sub(quitar, "", g["t"])) if quitar else e(g["t"])
        dentro = f'<b>{i:02d}</b><span>{titulo}</span><small>{g["min"]} min</small>'
        return f'<li><a href="guias/{slug}.html">{dentro}</a></li>' if en_biblioteca else f"<li>{dentro}</li>"

    def pie(slugs, extra=()):
        minutos = sum(por[s]["min"] for s in slugs)
        return '<div class="v-pie">' + "".join(f"<span>{x}</span>" for x in (f"{len(slugs)} guías", f"~{minutos} min de lectura", *extra)) + "</div>"

    def ir(slug_o_hash, texto):
        if not en_biblioteca:
            return ""
        return f'<a class="v-ir" href="{slug_o_hash}">{texto} →</a>'

    tarjetas = []
    # 1. El sistema base (grande)
    sb = rutas["sistema-base"]
    plantillas = [p for p in prompts if p["tema"] == "Vender IA"]
    tarjetas.append(
        '<article class="v-card v-card--grande"><div class="v-top"><span class="v-etq"><i></i>El método</span><span class="v-num">9</span></div>'
        "<h3>El sistema base para vender IA a negocios</h3>"
        "<p>Paso a paso para armar tu oferta, conseguir a quién venderle, hacer la llamada de diagnóstico, cobrar, instalarlo y mantenerlo todos los meses. Con plantillas para cada etapa.</p>"
        '<ol class="v-pasos">' + "".join(item(i + 1, s, r"^Módulo \d+ · ") for i, s in enumerate(sb)) + "</ol>"
        + '<span class="v-etq" style="align-self:flex-start;margin-top:6px"><i></i>Plantillas incluidas</span>'
        + '<div class="v-chips">' + "".join(f"<span>{e(p['t'])}</span>" for p in plantillas) + "</div>"
        + pie(sb, (f"{len(plantillas)} packs de plantillas",)) + ir(f"guias/{sb[0]}.html", "Empezar por el módulo 1") + "</article>")
    # 2. Rubros
    rubros = [g["slug"] for g in guias if g["slug"].startswith("sistema-ia-para-")]
    chips = "".join(
        (f'<a href="guias/{s}.html">' if en_biblioteca else "<span>") + e(re.sub(r"^Sistema con Claude para ", "", por[s]["t"]).split(",")[0]).capitalize()
        + ("</a>" if en_biblioteca else "</span>") for s in rubros)
    tarjetas.append(
        f'<article class="v-card"><div class="v-top"><span class="v-etq"><i></i>Listo para replicar</span><span class="v-num">{len(rubros)}</span></div>'
        "<h3>Sistemas por rubro</h3><p>Qué le come el tiempo a cada negocio, qué le instalás, los prompts listos y cómo ofrecérselo.</p>"
        f'<div class="v-chips">{chips}</div>' + pie(rubros) + "</article>")
    # 3. Herramientas con logos
    cuenta = {c: sum(1 for h in herrs if h["cat"] == c) for c in ("Skills", "MCP", "Herramientas")}
    logos = "".join(f'<i><img src="web/logos/{n}.svg" alt="" loading="lazy"></i>' for n in LOGOS_VITRINA)
    tarjetas.append(
        f'<article class="v-card"><div class="v-top"><span class="v-etq"><i></i>Oficiales y verificadas</span><span class="v-num">{len(herrs)}</span></div>'
        "<h3>Skills, MCP y herramientas</h3><p>Cada una con el comando exacto para instalarla, sacado de la documentación de quien la publica.</p>"
        f'<div class="v-logos">{logos}</div><div class="v-pie"><span>{cuenta["Skills"]} skills</span><span>{cuenta["MCP"]} MCP</span><span>{cuenta["Herramientas"]} herramientas</span></div>'
        + ir("#mcp", "Ver las herramientas") + "</article>")
    # 4-6. Agentes, desarrollo, Claude Code
    for rid, etq, titulo, desc, n_items in (
        ("agentes", "Agentes", "Armá tus propios agentes", "De qué es un agente de verdad al Agent SDK oficial: investigación, atención, ventas, contenido y seguridad.", 5),
        ("desarrollo", "Desarrollo", "De la idea a tu app publicada", "Especificación, base de datos, login, cobros con Stripe y Mercado Pago, dominio y lo que le falta a una demo para ser producto.", 5),
        ("claude-code", "Claude Code", "Claude Code a fondo", "Instalarlo sin miedo, planificar, memoria del proyecto, subagentes, tareas programadas y permisos con cuidado.", 5),
    ):
        slugs = rutas[rid]
        mas = len(slugs) - n_items
        tarjetas.append(
            f'<article class="v-card"><div class="v-top"><span class="v-etq"><i></i>{etq}</span><span class="v-num">{len(slugs)}</span></div>'
            f"<h3>{titulo}</h3><p>{desc}</p>"
            '<ol class="v-pasos">' + "".join(item(i + 1, s) for i, s in enumerate(slugs[:n_items])) + "</ol>"
            + (f'<span class="v-mas">+ {mas} guías más en la ruta</span>' if mas > 0 else "")
            + pie(slugs) + ir(f"guias/{slugs[0]}.html", "Empezar la ruta") + "</article>")
    return '<div class="v-grid">' + "".join(tarjetas) + "</div>"


def catalogo(guias, en_biblioteca):
    """Todas las guías: pestañas por tema y una grilla de tarjetas del tema elegido (la primera, abierta)."""
    grupos = {}
    for g in guias:
        grupos.setdefault(AGRUPAR.get(g["tema"], g["tema"]), []).append(g)
    orden = [t for t in ORDEN_TEMAS if t in grupos] + [t for t in grupos if t not in ORDEN_TEMAS]
    e = html.escape
    tabs = "".join(f'<button type="button" class="v-tab" role="tab" aria-selected="{"true" if k == 0 else "false"}" data-tema="{k}">'
                   f'{e(tema)}<span>{len(grupos[tema])}</span></button>' for k, tema in enumerate(orden))
    paneles = []
    for k, tema in enumerate(orden):
        tarjetas = []
        for n, g in enumerate(grupos[tema], 1):
            cuerpo = (f'<span class="v-g-num">{n:02d}</span><h4>{e(g["t"])}</h4><p>{e(g["d"])}</p>'
                      f'<span class="v-g-pie"><b>{g["min"]} min</b>' + (f'<i>Reel · {e(g["post"])}</i>' if g.get("post") else "") + '</span>')
            tarjetas.append(f'<a class="v-g" href="guias/{g["slug"]}.html">{cuerpo}</a>' if en_biblioteca else f'<div class="v-g">{cuerpo}</div>')
        paneles.append(f'<div class="v-panel" role="tabpanel" data-tema="{k}"{"" if k == 0 else " hidden"}>' + "".join(tarjetas) + "</div>")
    script = ("<script>(function(){var c=document.currentScript.previousElementSibling;"
              "c.querySelector('.v-tabs').addEventListener('click',function(ev){var b=ev.target.closest('.v-tab');if(!b)return;"
              "c.querySelectorAll('.v-tab').forEach(function(x){x.setAttribute('aria-selected',x===b);});"
              "c.querySelectorAll('.v-panel').forEach(function(p){p.hidden=p.dataset.tema!==b.dataset.tema;});});})();</script>")
    return f'<div class="v-catalogo"><div class="v-tabs" role="tablist">{tabs}</div>' + "".join(paneles) + "</div>" + script


def inicio(v):
    """Página de inicio: cifras y títulos de las guías desde los datos, precio y link de pago desde contenido/config.json.
    Sin pago_url, el botón lleva al DM de Instagram para comprar a mano."""
    cfg = json.loads((RAIZ / "contenido" / "config.json").read_text())
    guias = json.loads((WEB / "guias-web.json").read_text())
    js = (WEB / "prompts.js").read_text()
    n_prompts = js.count('"c":')
    n_herr = (WEB / "herramientas.js").read_text().count('"cat":')
    n_packs = js.count('"tema":')
    prompts = json.loads(re.search(r"var PROMPTS = (.*);\n", js).group(1))
    herrs = json.loads(re.search(r"var HERRAMIENTAS = (.*);\n", (WEB / "herramientas.js").read_text()).group(1))
    if cfg.get("pago_url"):
        url, target, nota = cfg["pago_url"], 'target="_blank" rel="noopener"', "Pago seguro. Después del pago te llega tu clave de acceso."
    else:
        url, target, nota = "https://ig.me/m/juampiiacosta.ia", 'target="_blank" rel="noopener"', "Escribime «ACCESO» por Instagram y te paso el link de pago y tu clave."
    reemplazos = {"{{V}}": v, "{{PRECIO}}": cfg["precio"], "{{PRECIO_DESPUES}}": cfg["precio_despues"], "{{PAGO_URL}}": html.escape(url),
                  "{{PAGO_TARGET}}": target, "{{PAGO_NOTA}}": nota, "{{VITRINA}}": vitrina(guias, prompts, herrs, False), "{{CATALOGO}}": catalogo(guias, False),
                  "{{N_GUIAS}}": str(len(guias)), "{{N_PROMPTS}}": str(n_prompts), "{{N_RECURSOS}}": str(len(guias) + n_packs + n_herr)}
    t = (WEB / "inicio.html").read_text()
    for k, val in reemplazos.items():
        t = t.replace(k, val)
    assert "{{" not in t, "inicio.html: quedó un {{…}} sin rellenar"
    (RAIZ / "index.html").write_text(t)


if __name__ == "__main__":
    runpy.run_path(str(RAIZ / "contenido" / "guias.py"), run_name="__main__")
    g_lotes, p_lotes, h_lotes = lotes()
    guias = json.loads((WEB / "guias-web.json").read_text()) + g_lotes
    prompts = json.loads((RAIZ / "contenido" / "base-prompts.json").read_text()) + p_lotes
    herrs = json.loads((RAIZ / "contenido" / "base-herramientas.json").read_text()) + h_lotes
    validar(guias, prompts, herrs)
    rutas = (WEB / "rutas.js").read_text()
    slugs = {g["slug"] for g in guias}
    faltan = [s for s in re.findall(r'"([a-z0-9-]{8,})"', rutas) if s not in slugs and s not in ("empezar", "conectar", "skills", "claude-code", "negocio", "contenido", "vender", "sistema-base", "agentes", "desarrollo")]
    assert not faltan, f"rutas.js nombra guías que no existen: {faltan}"
    (WEB / "guias-web.json").write_text(json.dumps(guias, ensure_ascii=False, indent=1))
    datos_js(prompts, herrs)
    v = version()
    n = guias_web(v)
    (RAIZ / "recursos.html").write_text((WEB / "recursos.html").read_text().replace("{{V}}", v)
                                        .replace("{{VITRINA}}", vitrina(guias, prompts, herrs, True)))
    inicio(v)
    print(f"ok · {n} guías · versión {v}")
