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
         "Asistentes", "Conectores", "Video"}


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


def datos_js(prompts, herrs):
    (WEB / "prompts.js").write_text("// Generado por build.py desde contenido/base-prompts.json y contenido/lotes/. No editar a mano.\n"
                                    f"var PROMPTS = {json.dumps(prompts, ensure_ascii=False)};\n")
    (WEB / "herramientas.js").write_text("// Generado por build.py desde contenido/base-herramientas.json y contenido/lotes/. No editar a mano.\n"
                                         f"var HERRAMIENTAS = {json.dumps(herrs, ensure_ascii=False)};\n")


def guias_web(v):
    datos = json.loads((WEB / "guias-web.json").read_text())
    (WEB / "guias-web.js").write_text(
        "// Generado por build.py desde web/guias-web.json. No editar a mano.\n"
        f"var GUIAS_WEB = {json.dumps(datos, ensure_ascii=False)};\n"
    )
    carpeta = RAIZ / "guias"
    carpeta.mkdir(exist_ok=True)
    for viejo in carpeta.glob("*.html"):
        viejo.unlink()
    plantilla = (WEB / "guia.html").read_text()
    for g in datos:
        pagina = (plantilla.replace("{{SLUG}}", g["slug"]).replace("{{V}}", v)
                  .replace("{{TITULO}}", html.escape(g["t"])).replace("{{DESC}}", html.escape(g["d"])))
        (carpeta / f"{g['slug']}.html").write_text(pagina)
    return len(datos)


def inicio(v):
    """Página de inicio: cifras y títulos de las guías desde los datos, precio y link de pago desde contenido/config.json.
    Sin pago_url, el botón lleva al DM de Instagram para comprar a mano."""
    cfg = json.loads((RAIZ / "contenido" / "config.json").read_text())
    guias = json.loads((WEB / "guias-web.json").read_text())
    js = (WEB / "prompts.js").read_text()
    n_prompts = js.count('"c":')
    n_herr = (WEB / "herramientas.js").read_text().count('"cat":')
    n_packs = js.count('"tema":')
    lista = "".join(f'<li class="glass"><i>✓</i><div>{html.escape(g["t"])}<small>{html.escape(g["tema"])} · {g["min"]} min</small></div></li>' for g in guias)
    if cfg.get("pago_url"):
        url, target, nota = cfg["pago_url"], 'target="_blank" rel="noopener"', "Pago seguro. Después del pago te llega tu clave de acceso."
    else:
        url, target, nota = "https://ig.me/m/juampiiacosta.ia", 'target="_blank" rel="noopener"', "Escribime «ACCESO» por Instagram y te paso el link de pago y tu clave."
    reemplazos = {"{{V}}": v, "{{PRECIO}}": cfg["precio"], "{{PRECIO_DESPUES}}": cfg["precio_despues"], "{{PAGO_URL}}": html.escape(url),
                  "{{PAGO_TARGET}}": target, "{{PAGO_NOTA}}": nota, "{{LISTA_GUIAS}}": lista,
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
    faltan = [s for s in re.findall(r'"([a-z0-9-]{8,})"', rutas) if s not in slugs and s not in ("empezar", "conectar", "skills", "claude-code", "negocio", "contenido", "vender")]
    assert not faltan, f"rutas.js nombra guías que no existen: {faltan}"
    (WEB / "guias-web.json").write_text(json.dumps(guias, ensure_ascii=False, indent=1))
    datos_js(prompts, herrs)
    v = version()
    n = guias_web(v)
    (RAIZ / "recursos.html").write_text((WEB / "recursos.html").read_text().replace("{{V}}", v))
    inicio(v)
    print(f"ok · {n} guías · versión {v}")
