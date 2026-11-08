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


SKILLS_LARGAS = []


def mejorar(guias):
    """contenido/mejoras/<slug>.json: correcciones verificadas, ejemplo, si algo falla, kit y fecha de verificación.
    Cada corrección tiene que encontrar su texto exacto en la guía, si no la construcción falla."""
    por = {g["slug"]: g for g in guias}
    n = 0
    for f in sorted((RAIZ / "contenido" / "mejoras").glob("*.json")):
        m = json.loads(f.read_text())
        g = por.get(m["slug"])
        assert g, f"{f.name}: no existe la guía {m['slug']}"

        def reemplazar(x, antes, despues, cuenta):
            if isinstance(x, str):
                if antes in x:
                    cuenta[0] += 1
                    return x.replace(antes, despues)
                return x
            if isinstance(x, list):
                return [reemplazar(y, antes, despues, cuenta) for y in x]
            if isinstance(x, dict):
                return {k: (v if k in ("slug", "fuentes") else reemplazar(v, antes, despues, cuenta)) for k, v in x.items()}
            return x

        for c in m.get("correcciones", []):
            cuenta = [0]
            nuevo = reemplazar(g, c["antes"], c["despues"], cuenta)
            assert cuenta[0], f"{f.name}: no encontré el texto a corregir: {c['antes'][:80]}"
            g.clear(); g.update(nuevo)
        fu = list(g.get("fuentes", []))
        for u in m.get("fuentes_extra", []) + [c["fuente"] for c in m.get("correcciones", []) if c.get("fuente")]:
            if u not in fu:
                fu.append(u)
        if fu:
            g["fuentes"] = fu
        for k in ("ejemplo", "si_falla", "kit", "verificada"):
            if m.get(k):
                g[k] = m[k]
        for k in m.get("kit", []):
            assert k.get("archivo") and k.get("contenido") and k.get("que_es"), f"{f.name}: archivo del kit incompleto"
            if k["archivo"].endswith("SKILL.md"):
                # Límites de la app al subir una skill (ayuda oficial 12512198): name hasta 64, description hasta 200
                fm = re.match(r"^---\n(.*?)\n---", k["contenido"], re.S)
                assert fm, f"{f.name}: {k['archivo']} sin encabezado"
                d = re.search(r"^description:\s*(.*)$", fm.group(1), re.M)
                nom = re.search(r"^name:\s*(.*)$", fm.group(1), re.M)
                assert d and nom, f"{f.name}: {k['archivo']} sin name o description"
                largo = len(d.group(1).strip().strip("\"'"))
                if largo > 200:
                    SKILLS_LARGAS.append(f"{f.name}: {k['archivo']} ({largo})")
        n += 1
    return n


def ordenar(guias, prompts):
    """contenido/orden.json manda: cada guía y cada pack va en una sola categoría, en el orden de la lista.
    Pisa el tema de origen con el nombre de la categoría (así toda la web usa los mismos nombres) y suma cat y parte."""
    o = json.loads((RAIZ / "contenido" / "orden.json").read_text())
    por_g = {g["slug"]: g for g in guias}
    por_p = {p["t"]: p for p in prompts}
    usados_g, usados_p, g_out, p_out = set(), set(), [], []
    for c in o["categorias"]:
        for slug in c["guias"]:
            assert slug in por_g, f"orden.json: la guía {slug} no existe"
            assert slug not in usados_g, f"orden.json: la guía {slug} está en dos categorías"
            usados_g.add(slug)
            g_out.append({**por_g[slug], "tema": c["n"], "cat": c["id"], "parte": c["parte"]})
        for t in c["prompts"]:
            assert t in por_p, f"orden.json: el pack «{t}» no existe"
            assert t not in usados_p, f"orden.json: el pack «{t}» está en dos categorías"
            usados_p.add(t)
            p_out.append({**por_p[t], "tema": c["n"], "cat": c["id"], "parte": c["parte"]})
    faltan = [g["slug"] for g in guias if g["slug"] not in usados_g] + [p["t"] for p in prompts if p["t"] not in usados_p]
    assert not faltan, f"orden.json: falta ubicar {faltan}"
    cats = [{k: c[k] for k in ("id", "parte", "e", "n", "d")} | ({"destacada": True} if c.get("destacada") else {}) for c in o["categorias"]]
    (WEB / "categorias.js").write_text("// Generado por build.py desde contenido/orden.json: partes y categorías de la biblioteca.\n"
                                       f"var PARTES = {json.dumps(o['partes'], ensure_ascii=False)};\n"
                                       f"var CATEGORIAS = {json.dumps(cats, ensure_ascii=False)};\n")
    return g_out, p_out, [c["n"] for c in o["categorias"]]


def ordenar_herramientas(herrs):
    """Grupos dentro de Skills, MCP y Herramientas (orden.json → herramientas). Cada herramienta en un solo grupo."""
    o = json.loads((RAIZ / "contenido" / "orden.json").read_text())["herramientas"]
    por = {}
    for h in herrs:
        assert (h["cat"], h["t"]) not in por, f"herramienta repetida: {h['t']}"
        por[(h["cat"], h["t"])] = h
    salida, usados, grupos = [], set(), []
    for cat, lista in o.items():
        for gr in lista:
            grupos.append({"id": gr["id"], "seccion": cat, "e": gr["e"], "n": gr["n"], "d": gr["d"]})
            for t in gr["items"]:
                assert (cat, t) in por, f"orden.json: la herramienta «{t}» no está en {cat}"
                assert (cat, t) not in usados, f"orden.json: «{t}» está en dos grupos"
                usados.add((cat, t))
                salida.append({**por[(cat, t)], "grupo": gr["id"]})
    faltan = [t for (c, t) in por if (c, t) not in usados]
    assert not faltan, f"orden.json: falta ubicar las herramientas {faltan}"
    with open(WEB / "categorias.js", "a") as f:
        f.write(f"var GRUPOS_HERR = {json.dumps(grupos, ensure_ascii=False)};\n")
    return salida


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


# Módulo 1 y las 5 guías de «Gastá menos tokens» (las que se mandan por la palabra TOKEN)
GRATIS_EXTRA = ["sistema-base-modulo-1-la-oferta", "errores-que-agotan-tu-plan-de-claude", "por-que-claude-se-vuelve-torpe-en-chats-largos",
                "que-modelo-de-claude-uso", "markitdown-para-ahorrar-tokens", "ahorra-tokens-graphify-obsidian"]


def es_gratis(g):
    """Abiertas para quien se registra gratis: las guías de los reels, el Módulo 1 y las de gastar menos tokens."""
    return bool(g.get("post")) or g["slug"] in GRATIS_EXTRA


def guias_web(v, datos):
    """web/guias-web.js lleva solo los datos para listar (sin el contenido); cada guía lleva su contenido dentro de su página.
    Así la biblioteca puede mostrar todas las guías, y el middleware decide quién abre cada una."""
    meta = [{k: g[k] for k in ("slug", "t", "d", "tema", "cat", "parte", "min", "post") if k in g} | ({"gratis": True} if es_gratis(g) else {}) for g in datos]
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
ORDEN_CATS = []  # lo llena ordenar() con el orden de contenido/orden.json
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
    plantillas = [p for p in prompts if p.get("cat") in ("sistema-base", "rubros")]
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
    # 4. Gastá menos tokens: franja ancha y destacada
    cat = next(c for c in json.loads((RAIZ / "contenido" / "orden.json").read_text())["categorias"] if c["id"] == "ahorrar")
    ah = cat["guias"]
    tarjetas.append(
        '<article class="v-card v-card--franja"><div class="v-franja-txt"><div class="v-top"><span class="v-etq"><i></i>Que no se te corte el plan</span>'
        f'<span class="v-num">{len(ah)}</span></div><h3>Gastá menos tokens con Claude</h3><p>{e(cat["d"])}</p>'
        + pie(ah) + ir(f"guias/{ah[0]}.html", "Empezar por acá") + "</div>"
        '<div><ol class="v-pasos">' + "".join(item(i + 1, sl) for i, sl in enumerate(ah[:6])) + "</ol>"
        + (f'<span class="v-mas">+ {len(ah) - 6} guías más en la categoría</span>' if len(ah) > 6 else "") + "</div></article>")
    # 5-7. Agentes, desarrollo, Claude Code
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
    """Todas las guías: pestañas agrupadas por parte (como la biblioteca) y una grilla con las guías de la categoría elegida."""
    o = json.loads((RAIZ / "contenido" / "orden.json").read_text())
    grupos = {}
    for g in guias:
        grupos.setdefault(g["cat"], []).append(g)
    cats = [c for c in o["categorias"] if c["id"] in grupos]
    e = html.escape
    filas = []
    for i, p in enumerate(o["partes"], 1):
        tabs = "".join(f'<button type="button" class="v-tab" role="tab" aria-selected="{"true" if c is cats[0] else "false"}" data-tema="{c["id"]}">'
                       f'{c["e"]} {e(c["n"])}<span>{len(grupos[c["id"]])}</span></button>' for c in cats if c["parte"] == p["id"])
        filas.append(f'<div class="v-tabs-parte"><small>Parte {i}</small><div class="v-tabs" role="tablist" aria-label="{e(p["n"])}">{tabs}</div></div>')
    paneles = []
    for c in cats:
        tarjetas = [f'<p class="v-panel-intro">{e(c["d"])}</p>']
        for n, g in enumerate(grupos[c["id"]], 1):
            cuerpo = (f'<span class="v-g-num">{n:02d}</span><h4>{e(g["t"])}</h4><p>{e(g["d"])}</p>'
                      f'<span class="v-g-pie"><b>{g["min"]} min</b>' + (f'<i>Reel · {e(g["post"])}</i>' if g.get("post") else "") + '</span>')
            tarjetas.append(f'<a class="v-g" href="guias/{g["slug"]}.html">{cuerpo}</a>' if en_biblioteca else f'<div class="v-g">{cuerpo}</div>')
        paneles.append(f'<div class="v-panel" role="tabpanel" data-tema="{c["id"]}"{"" if c is cats[0] else " hidden"}>' + "".join(tarjetas) + "</div>")
    script = ("<script>(function(){var c=document.currentScript.previousElementSibling;"
              "c.addEventListener('click',function(ev){var b=ev.target.closest('.v-tab');if(!b)return;"
              "c.querySelectorAll('.v-tab').forEach(function(x){x.setAttribute('aria-selected',x===b);});"
              "c.querySelectorAll('.v-panel').forEach(function(p){p.hidden=p.dataset.tema!==b.dataset.tema;});});})();</script>")
    return '<div class="v-catalogo">' + "".join(filas) + "".join(paneles) + "</div>" + script


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
    import copy
    originales = copy.deepcopy(guias)  # sin las mejoras: es lo que leen los revisores para comparar
    n_mejoras = mejorar(guias)
    guias, prompts, ORDEN_CATS = ordenar(guias, prompts)
    herrs = ordenar_herramientas(herrs)
    rutas = (WEB / "rutas.js").read_text()
    slugs = {g["slug"] for g in guias}
    faltan = [s for s in re.findall(r'"([a-z0-9-]{8,})"', rutas) if s not in slugs and s not in ("empezar", "conectar", "skills", "claude-code", "negocio", "contenido", "vender", "sistema-base", "agentes", "desarrollo")]
    assert not faltan, f"rutas.js nombra guías que no existen: {faltan}"
    orden_slugs = [g["slug"] for g in guias]
    por_slug = {g["slug"]: g for g in originales}
    (WEB / "guias-web.json").write_text(json.dumps([{**por_slug[s], **{k: g[k] for k in ("tema", "cat", "parte")}} for s, g in zip(orden_slugs, guias)], ensure_ascii=False, indent=1))
    datos_js(prompts, herrs)
    v = version()
    n = guias_web(v, guias)
    (RAIZ / "recursos.html").write_text((WEB / "recursos.html").read_text().replace("{{V}}", v)
                                        .replace("{{VITRINA}}", vitrina(guias, prompts, herrs, True)))
    inicio(v)
    if SKILLS_LARGAS:
        print(f"aviso: {len(SKILLS_LARGAS)} skills con description de más de 200 caracteres (la app no las acepta)")
    print(f"ok · {n} guías · {n_mejoras} elevadas · versión {v}")
