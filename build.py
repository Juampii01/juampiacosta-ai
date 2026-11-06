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
    n_prompts = js.count("{ t: ")
    n_herr = len(re.findall(r"^\s+cat: ", (WEB / "herramientas.js").read_text(), flags=re.M))
    n_packs = len(re.findall(r"^\s+tema: ", js, flags=re.M))
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
    v = version()
    n = guias_web(v)
    (RAIZ / "recursos.html").write_text((WEB / "recursos.html").read_text().replace("{{V}}", v))
    inicio(v)
    print(f"ok · {n} guías · versión {v}")
