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
import unicodedata
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
    """Para la construcción si falta algo que la web necesita: mejor fallar aquí que mostrar una guía rota."""
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
                assert largo <= 200, f"{f.name}: {k['archivo']} tiene description de {largo} caracteres (máximo 200)"
                n_nom = nom.group(1).strip().strip("\"'")
                assert len(n_nom) <= 64 and re.fullmatch(r"[a-z0-9-]+", n_nom), f"{f.name}: name inválido {n_nom!r}"
                assert "/" not in k["archivo"] or k["archivo"].split("/")[0] == n_nom, f"{f.name}: la carpeta {k['archivo']} no coincide con name {n_nom}"

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


# Módulo 1 y las 5 guías de «Gasta menos tokens» (las que se mandan por la palabra TOKEN)
GRATIS_EXTRA = ["sistema-base-modulo-1-la-oferta", "errores-que-agotan-tu-plan-de-claude", "por-que-claude-se-vuelve-torpe-en-chats-largos",
                "que-modelo-de-claude-uso", "markitdown-para-ahorrar-tokens", "ahorra-tokens-graphify-obsidian",
                "roadmap-de-cero-a-vender-ia"]


def quitar_tildes(t):
    """«GUÍA» → «GUIA» (deja la Ñ)."""
    return unicodedata.normalize("NFC", re.sub("[\u0301\u0300]", "", unicodedata.normalize("NFD", t)))


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
        "// Palabra del reel o anuncio (en mayúsculas, sin tildes) → guía. La usa el agente para mandar el link directo.\n"
        f"export const PALABRAS = {json.dumps({quitar_tildes(g['post']).upper(): g['slug'] for g in datos if g.get('post')}, ensure_ascii=False)};\n"
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


# ---------------------------------------------------------------- Camino (landing y biblioteca)
ORDEN_CATS = []  # lo llena ordenar() con el orden de contenido/orden.json


def puertas(guias, prompts, en_biblioteca):
    """El camino en 3 partes: una tarjeta por parte con 3 guías de muestra. En la biblioteca, cada tarjeta lleva a su parte y muestra el progreso."""
    o = json.loads((RAIZ / "contenido" / "orden.json").read_text())
    por = {g["slug"]: g for g in guias}
    e = html.escape
    out = []
    for i, p in enumerate(o["partes"], 1):
        gs = [g for g in guias if g["parte"] == p["id"]]
        n_packs = sum(1 for x in prompts if x.get("parte") == p["id"])
        cats = [c for c in o["categorias"] if c["parte"] == p["id"]]
        muestra = "".join(
            (f'<li><a href="guias/{s}.html">' if en_biblioteca else "<li><span>") + e(por[s]["t"]) + (f"</a></li>" if en_biblioteca else "</span></li>")
            for s in p["muestra"])
        temas = "".join(f"<span>{e(c['n'])}</span>" for c in cats)
        pie = f'<span>{len(gs)} guías</span><span>{n_packs} packs de prompts</span>'
        if en_biblioteca:
            pie += f'<span class="pt-prog" data-parte="{p["id"]}" data-total="{len(gs)}"></span>'
        ir = f'<a class="pt-ir" href="#guias-web" data-parte="{p["id"]}">Ver la parte {i} →</a>' if en_biblioteca else ""
        out.append(f'<article class="pt"><div class="pt-top"><b>{i}</b><span class="mono">Parte {i}</span></div>'
                   f'<h3>{e(p["n"].split(" · ", 1)[-1])}</h3><p>{e(p["d"])}</p>'
                   f'<div class="pt-temas">{temas}</div><small class="pt-ej">Por ejemplo</small><ul>{muestra}</ul>'
                   f'<div class="pt-pie">{pie}</div>{ir}</article>')
    return '<div class="camino">' + "".join(out) + "</div>"


def video_html(cfg, n_guias, n_prompts, n_skills):
    """Video de presentación (config.json: «video», un link de YouTube o un .mp4 en web/). Sin video, una línea con lo que hay adentro."""
    url = (cfg.get("video") or "").strip()
    m = re.search(r"(?:youtu\.be/|v=|shorts/|embed/)([\w-]{11})", url)
    if m:
        return (f'<div class="l-video"><iframe src="https://www.youtube-nocookie.com/embed/{m.group(1)}?rel=0" title="Presentación de la biblioteca" loading="lazy" '
                'allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>')
    if url.endswith(".mp4"):
        return f'<div class="l-video"><video src="{html.escape(url)}" controls playsinline preload="metadata"></video></div>'
    return f'<p class="l-linea"><b>{n_guias}</b> guías · <b>{n_prompts}</b> prompts · <b>{n_skills}</b> skills listas para subir · se actualiza cada semana</p>'


LOGO_FORJA = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#17110e"/><path d="M9 22h14l-2-5H11z" fill="#ff5a1f"/><path d="M16 6c3 3 4 5 2 8-1-1-2-1-3 0-2-2-1-5 1-8z" fill="#ffb27a"/></svg>'
PAGINAS = ["recursos", "biblioteca", "entrar", "cuenta", "comunidad", "sistemas", "panel", "maestro"]


def paginas(v):
    """Las páginas de la plataforma: Inicio, Classroom (/recursos), biblioteca, entrar, cuenta, comunidad, sistemas, panel y Maestro."""
    sistemas = json.loads((RAIZ / "contenido" / "sistemas.json").read_text())["sistemas"]
    for s in sistemas:
        for k in ("slug", "titulo", "categoria", "nivel", "plataforma", "tiempo", "resumen", "stack", "estado"):
            assert s.get(k), f"sistemas.json: a {s.get('slug')} le falta {k}"
    datos = json.dumps(sistemas, ensure_ascii=False).replace("</", "<\\/")
    for nombre in PAGINAS:
        t = (WEB / f"{nombre}.html").read_text().replace("{{V}}", v).replace("{{LOGO}}", LOGO_FORJA).replace("{{SISTEMAS}}", datos)
        assert "{{" not in t, f"{nombre}.html: quedó un {{{{…}}}} sin rellenar"
        (RAIZ / f"{nombre}.html").write_text(t)
    # /inicio (el resumen de cada uno). La plantilla se llama mi-inicio.html porque web/inicio.html es la página de venta.
    t = (WEB / "mi-inicio.html").read_text().replace("{{V}}", v)
    assert "{{" not in t, "mi-inicio.html: quedó un {{…}} sin rellenar"
    (RAIZ / "inicio.html").write_text(t)


def sistemas_paginas(v):
    """Una página por sistema con guía (estado «listo»): sistemas/<slug>.html desde contenido/sistemas/<slug>.md
    y el ZIP del código en descargas/<slug>.zip (los dos solo para el acceso completo, ver middleware.js)."""
    import markdown
    sistemas = json.loads((RAIZ / "contenido" / "sistemas.json").read_text())["sistemas"]
    plantilla = (WEB / "sistema.html").read_text()
    salida = RAIZ / "sistemas"
    salida.mkdir(exist_ok=True)
    hechos = set()
    for s in sistemas:
        if s["estado"] != "listo":
            continue
        md = RAIZ / "contenido" / "sistemas" / f"{s['slug']}.md"
        zip_ = RAIZ / "descargas" / f"{s['slug']}.zip"
        assert md.exists(), f"sistemas.json: {s['slug']} está «listo» pero falta {md.relative_to(RAIZ)}"
        assert zip_.exists(), f"sistemas.json: {s['slug']} está «listo» pero falta {zip_.relative_to(RAIZ)}"
        assert s.get("requisitos"), f"sistemas.json: a {s['slug']} le faltan los requisitos"
        texto = md.read_text()
        assert not re.search(r"MaestrIA|maestria|TU-REPO-PRIVADO", texto), f"{md.name}: quedó una referencia a la marca original"
        texto = re.sub(r"(?m)^ {2,3}(?=[-*] |\d+\. )", "    ", texto)  # listas anidadas: markdown pide 4 espacios
        cuerpo = markdown.markdown(texto, extensions=["tables", "fenced_code"], output_format="html")
        cuerpo = cuerpo.replace("<table>", '<div class="fj-sis-tabla"><table>').replace("</table>", "</table></div>")
        cuerpo = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', cuerpo)
        mb = zip_.stat().st_size / 1e6
        ficha = "".join(f"<span>{html.escape(t)}</span>" for t in [s["plataforma"].upper(), s["tiempo"]] + s["stack"])
        ficha = f'<span class="nivel">{html.escape(s["nivel"].upper())}</span>' + ficha
        t = (plantilla.replace("{{V}}", v).replace("{{TITULO}}", html.escape(s["titulo"])).replace("{{RESUMEN}}", html.escape(s["resumen"]))
             .replace("{{FICHA}}", ficha).replace("{{REQUISITOS}}", "".join(f"<li>{html.escape(r)}</li>" for r in s["requisitos"]))
             .replace("{{SLUG}}", s["slug"]).replace("{{ZIP}}", f"{mb:.1f} MB".replace(".", ",") if mb >= 0.1 else "menos de 0,1 MB"))
        assert "{{" not in t.replace("{{GUIA}}", ""), f"sistema {s['slug']}: quedó un {{{{…}}}} sin rellenar"
        t = t.replace("{{GUIA}}", cuerpo)
        (salida / f"{s['slug']}.html").write_text(t)
        hechos.add(f"{s['slug']}.html")
    for viejo in salida.glob("*.html"):
        if viejo.name not in hechos:
            viejo.unlink()
    return len(hechos)


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
    n_skills = sum(1 for f in (RAIZ / "contenido" / "mejoras").glob("*.json") for k in json.loads(f.read_text()).get("kit", []) if k["archivo"].endswith("SKILL.md"))
    if cfg.get("pago_url"):
        url, target, nota = cfg["pago_url"], 'target="_blank" rel="noopener"', 'Pago seguro con Hotmart, en la moneda de tu país. Después de pagar entras con el mismo email (te llega un código) y se abre todo. ¿Estás en Argentina? <a href="https://mpago.la/1Q8PbXK" target="_blank" rel="noopener">Paga $ 39.000 con Mercado Pago</a> y escríbeme por Instagram para activarte.'
    else:
        url, target, nota = "https://ig.me/m/juampiiacosta.ia", 'target="_blank" rel="noopener"', "Escríbeme «ACCESO» por Instagram y te paso el link de pago y tu clave."
    reemplazos = {"{{V}}": v, "{{PRECIO}}": cfg["precio"], "{{PRECIO_DESPUES}}": cfg["precio_despues"], "{{PAGO_URL}}": html.escape(url),
                  "{{PAGO_TARGET}}": target, "{{PAGO_NOTA}}": nota, "{{PUERTAS}}": puertas(guias, prompts, False), "{{VIDEO}}": video_html(cfg, len(guias), n_prompts, n_skills),
                  "{{N_GUIAS}}": str(len(guias)), "{{LOGO}}": LOGO_FORJA, "{{N_PROMPTS}}": str(n_prompts), "{{N_RECURSOS}}": str(len(guias) + n_packs + n_herr)}
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
    paginas(v)
    n_sis = sistemas_paginas(v)
    inicio(v)
    if SKILLS_LARGAS:
        print(f"aviso: {len(SKILLS_LARGAS)} skills con description de más de 200 caracteres (la app no las acepta)")
    print(f"ok · {n} guías · {n_mejoras} elevadas · {n_sis} sistemas · versión {v}")
