/* Formulario de bienvenida de /recursos.
   Lo ve quien entró con el registro gratis y todavía no lo completó: 7 preguntas de a una, con sonidos,
   barra de progreso por bloques, festejos y confeti. Al final le arma su ruta recomendada.
   Guarda en Supabase por /api/perfil al cerrar cada bloque y al terminar (quién es lo decide la cookie firmada).
   Las opciones tienen que coincidir con lib/perfil.js. Para verlo de nuevo: /recursos?bienvenida=1 */
(function () {
  "use strict";

  var BLOQUES = { 1: "Sobre ti", 2: "Tu meta", 3: "Para contactarte" };
  var PREGUNTAS = [
    { id: "situacion", b: 1, tipo: "lista", q: "¿En qué andas hoy?", ops: [
      ["Tengo un negocio", "🏢"], ["Trabajo en una empresa", "💼"], ["Freelancer o agencia", "🧾"],
      ["Quiero vender IA a empresas", "🚀"], ["Estudiante", "🎓"], ["Otro", "✨"]] },
    { id: "rubro", b: 1, tipo: "texto", q: "¿De qué rubro?", sub: "Así te muestro ejemplos que te sirvan.",
      ph: "Inmobiliaria, estética, contable, gastronomía…" },
    { id: "nivel", b: 1, tipo: "lista", q: "¿Cómo usas la IA hoy?", ops: [
      ["Nunca usé IA", "🌱"], ["Uso ChatGPT o Claude a veces", "💬"], ["La uso todos los días", "⚡"], ["Ya armo automatizaciones o agentes", "⚙️"]] },
    { id: "objetivo", b: 2, tipo: "lista", q: "¿Qué quieres lograr con la IA?", ops: [
      ["Ahorrar tiempo en mi negocio", "⏱️"], ["Vender servicios de IA", "💵"], ["Conseguir trabajo con IA", "🎯"],
      ["Aprender", "📚"], ["Que me lo instalen en mi negocio", "🛠️"]] },
    { id: "foco", b: 2, tipo: "lista", q: "¿Qué te gustaría resolver primero con IA?", sub: "Con esto te armo tu sección de recomendados.", ops: [
      ["Atención y WhatsApp", "💬"], ["Contenido y redes", "🎬"], ["Ventas y seguimiento", "🤝"], ["Administración y planillas", "📊"], ["Crear apps o webs", "💻"]] },
    { id: "inversion", b: 2, tipo: "lista", q: "¿Comprarías el acceso completo por US$ 24,90?", sub: "Ese precio es hasta el 30 de noviembre. Después pasa a US$ 44,90.", ops: [
      ["Sí, ahora", "✅"], ["Más adelante", "📅"], ["Por ahora solo lo gratis", "🎁"]] },
    { id: "pais", b: 3, tipo: "paises", q: "¿Desde dónde me escribes?", ops: [
      ["Argentina", "🇦🇷", "+54 9"], ["México", "🇲🇽", "+52"], ["Colombia", "🇨🇴", "+57"], ["Chile", "🇨🇱", "+56"],
      ["Perú", "🇵🇪", "+51"], ["Uruguay", "🇺🇾", "+598"], ["Ecuador", "🇪🇨", "+593"], ["Venezuela", "🇻🇪", "+58"],
      ["España", "🇪🇸", "+34"], ["Estados Unidos", "🇺🇸", "+1"], ["Otro", "🌎", "+"]] },
    { id: "whatsapp", b: 3, tipo: "whatsapp", q: "¿A qué WhatsApp te aviso cuando sumo recursos?",
      sub: "Te mando las guías nuevas y cosas que no publico en Instagram. Nada de spam." }
  ];
  var ANIMOS = ["¡Anotado!", "¡Perfecto!", "¡Vas muy bien!", "¡Ya casi!"];
  var AVANZAR_MS = 330;

  /* ---------- Utilidades ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cookie(n) { var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function guardado(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function sinMovimiento() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  var ICONO = {
    sonido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    mudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
  };

  /* ---------- Sonidos sintetizados (sin archivos) ---------- */
  var Sfx = (function () {
    var ctx = null, mudo = guardado("jpa_sonido") === "off";
    var GESTOS = ["touchend", "pointerup", "click", "keydown"];
    function asegurar() {
      if (ctx) return ctx;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { ctx = null; }
      return ctx;
    }
    // En celulares el audio se habilita recién con un toque; iOS además pide reproducir algo mudo en ese mismo gesto
    function desbloquear() {
      var a = asegurar();
      if (!a) return;
      try { var s = a.createBufferSource(); s.buffer = a.createBuffer(1, 1, 22050); s.connect(a.destination); s.start(0); } catch (e) { /* sin audio */ }
      var listo = function () { if (a.state === "running") GESTOS.forEach(function (g) { document.removeEventListener(g, desbloquear, true); }); };
      if (a.state === "suspended") a.resume().then(listo).catch(function () {}); else listo();
    }
    function tono(f, dur, tipo, vol, demora) {
      if (mudo) return;
      var a = asegurar();
      if (!a || a.state !== "running") return;
      try {
        var t = a.currentTime + (demora || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tipo || "sine";
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol || .12, t + .008);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g); g.connect(a.destination);
        o.start(t); o.stop(t + dur + .03);
      } catch (e) { /* un sonido nunca frena el formulario */ }
    }
    GESTOS.forEach(function (g) { document.addEventListener(g, desbloquear, true); });
    return {
      click: function () { tono(700, .06, "sine", .1); },
      elegir: function () { tono(540, .07, "triangle", .14); tono(900, .07, "sine", .12, .035); },
      avanzar: function () { tono(420, .09, "sine", .11); tono(640, .09, "sine", .11, .06); tono(860, .12, "sine", .12, .12); },
      error: function () { tono(220, .12, "square", .06); tono(180, .14, "square", .05, .08); },
      exito: function () { [523.25, 659.25, 784, 1046.5].forEach(function (f, i) { tono(f, .22, "sine", .14, i * .09); }); },
      gran: function () { [523.25, 659.25, 784, 1046.5, 1318.5, 1568].forEach(function (f, i) { tono(f, .3, i % 2 ? "triangle" : "sine", .13, i * .08); }); },
      mudo: function () { return mudo; },
      alternar: function () { mudo = !mudo; guardado("jpa_sonido", mudo ? "off" : "on"); if (!mudo) { desbloquear(); tono(700, .06, "sine", .1); } return mudo; }
    };
  })();

  function confeti(n) {
    if (sinMovimiento()) return;
    var colores = ["#ff5a1f", "#ff8a4c", "#ffb889", "#ffffff", "#ffd166"];
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i"), t = 6 + Math.random() * 8;
      p.className = "bv-confeti";
      p.style.cssText = "left:" + Math.random() * 100 + "vw;width:" + t + "px;height:" + t * .45 + "px;background:" + colores[i % colores.length] +
        ";animation-duration:" + (1.6 + Math.random() * 1.3) + "s;animation-delay:" + Math.random() * .3 + "s";
      p.addEventListener("animationend", function () { this.remove(); });
      document.body.appendChild(p);
    }
  }

  /* ---------- Envío a /api/perfil ---------- */
  var PENDIENTE = "jpa_perfil_pendiente";
  function enviar(datos) {
    guardado(PENDIENTE, JSON.stringify(datos));
    var intento = function (n) {
      return fetch("/api/perfil", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), credentials: "same-origin", keepalive: true })
        .then(function (r) {
          if (r.ok) { guardado(PENDIENTE, null); return; }
          if (r.status >= 500 && n < 3) return new Promise(function (ok) { setTimeout(ok, 800 * n); }).then(function () { return intento(n + 1); });
        })
        .catch(function () { if (n < 3) return new Promise(function (ok) { setTimeout(ok, 800 * n); }).then(function () { return intento(n + 1); }); });
    };
    return intento(1);
  }

  /* ---------- La ruta que le recomiendo según lo que respondió ---------- */
  function rutaPara(r) {
    if (r.objetivo !== "Que me lo instalen en mi negocio" && r.nivel === "Nunca usé IA") return "empezar";
    var porObjetivo = {
      "Ahorrar tiempo en mi negocio": "negocio", "Vender servicios de IA": "sistema-base", "Conseguir trabajo con IA": "claude-code",
      "Que me lo instalen en mi negocio": "negocio", "Aprender": r.nivel === "Ya armo automatizaciones o agentes" ? "agentes" : "empezar"
    };
    if (r.situacion === "Quiero vender IA a empresas" && r.objetivo !== "Que me lo instalen en mi negocio") return "sistema-base";
    return porObjetivo[r.objetivo] || "empezar";
  }

  /* ---------- El formulario ---------- */
  var nombre = cookie("jpa_nombre");
  var enGuia = /^\/guias\//.test(location.pathname);
  var st = { i: 0, resp: {}, etapa: "intro", timer: 0, pref: "" };
  var el = {};

  function rango(b) {
    var primero = -1, n = 0;
    PREGUNTAS.forEach(function (p, i) { if (p.b === b) { if (primero < 0) primero = i; n++; } });
    return { primero: primero, n: n };
  }
  function progreso() {
    var hechas = st.etapa === "fin" ? PREGUNTAS.length : st.i;
    $$(".bv-seg i", el.raiz).forEach(function (barra, i) {
      var r = rango(i + 1);
      barra.style.width = Math.min(Math.max(hechas - r.primero, 0), r.n) / r.n * 100 + "%";
    });
    el.atras.style.visibility = st.etapa === "preg" && st.i > 0 ? "visible" : "hidden";
  }
  function toast(t) {
    var v = $(".bv-toast"); if (v) v.remove();
    var n = document.createElement("div");
    n.className = "bv-toast"; n.textContent = t;
    n.addEventListener("animationend", function () { n.remove(); });
    document.body.appendChild(n);
  }
  function enfocar(sel) { var n = $(sel, el.cuerpo); if (n) n.focus({ preventScroll: true }); el.raiz.scrollTop = 0; }

  function pantallaEspera(v) {
    el.cuerpo.innerHTML = '<div class="bv-espera"><span class="bv-icono" aria-hidden="true">' + v.emoji + '</span>' +
      '<p class="bv-ceja">' + esc(v.ceja) + '</p><h2 class="bv-tit" tabindex="-1">' + esc(v.tit) + '</h2>' +
      (v.texto ? '<p class="bv-texto">' + esc(v.texto) + '</p>' : '') +
      '<span class="bv-barra" aria-hidden="true"><i style="animation-duration:' + v.ms + 'ms"></i></span></div>';
    progreso(); enfocar(".bv-tit");
  }

  function cabeza(p) {
    // Con la oferta por única vez activa (Panel), la pregunta del precio muestra el precio de la oferta
    var o = window.FJ && FJ.oferta && !FJ.ofertaMostrada ? FJ.oferta : null;
    if (p.id === "inversion" && o) p = { b: p.b, q: "¿Comprarías el acceso completo por US$ " + o.precio + "?", sub: "Es solo ahora, al registrarte. Después queda en US$ " + o.antes + " hasta el 30 de noviembre y luego pasa a US$ 44,90." };
    return '<div class="bv-meta"><span>Bloque ' + p.b + ' · <b>' + BLOQUES[p.b] + '</b></span><span>' + (st.i + 1) + ' / ' + PREGUNTAS.length + '</span></div>' +
      '<h2 class="bv-tit" id="bv-tit" tabindex="-1">' + esc(p.q) + '</h2>' + (p.sub ? '<p class="bv-sub">' + esc(p.sub) + '</p>' : '');
  }

  function pintar() {
    var p = PREGUNTAS[st.i], r = st.resp[p.id], html = '<div class="bv-paso">' + cabeza(p);
    if (p.ops) {
      var clase = { lista: "", grilla: " bv-ops--grilla", paises: " bv-ops--paises" }[p.tipo];
      html += '<div class="bv-ops' + clase + '">' + p.ops.map(function (o, k) {
        return '<button class="bv-op' + (r === o[0] ? ' si' : '') + '" type="button" aria-pressed="' + (r === o[0]) + '" data-v="' + esc(o[0]) + '">' +
          '<span class="e" aria-hidden="true">' + o[1] + '</span><span>' + esc(o[0]) + '</span>' + (k < 9 ? '<span class="k" aria-hidden="true">' + (k + 1) + '</span>' : '') + '</button>';
      }).join("") + '</div>';
    } else if (p.tipo === "texto") {
      html += '<form class="bv-campo" novalidate><input class="bv-in" id="bv-txt" maxlength="80" autocomplete="organization" enterkeyhint="next" placeholder="' + esc(p.ph) + '" value="' + esc(r || "") + '">' +
        '<button class="bv-ok" type="submit">Seguir →</button></form>' + (p.opcional ? '<button class="bv-saltar" type="button" data-saltar>Saltear esta</button>' : '');
    } else {
      var pais = PREGUNTAS.filter(function (x) { return x.id === "pais"; })[0].ops.filter(function (o) { return o[0] === st.resp.pais; })[0];
      if (!st.pref) st.pref = pais ? pais[2] : "+";
      html += '<form class="bv-campo" novalidate><div class="bv-fila">' +
        '<input class="bv-in bv-pref" id="bv-pref" inputmode="tel" maxlength="6" aria-label="Código de país" value="' + esc(st.pref) + '">' +
        '<input class="bv-in" id="bv-tel" type="tel" inputmode="tel" autocomplete="tel-national" enterkeyhint="done" maxlength="20" placeholder="' +
        (st.resp.pais === "Argentina" ? "11 2345 6789" : "Tu número") + '" value="' + esc(st.local || "") + '"></div>' +
        '<p class="bv-ayuda">' + (st.resp.pais === "Argentina" ? "Con código de área, sin el 0 y sin el 15." : "Con código de área, sin el 0 inicial.") + '</p>' +
        '<p class="bv-err" id="bv-err" role="alert"></p><button class="bv-ok" type="submit">Terminar y ver mi ruta →</button></form>';
    }
    el.cuerpo.innerHTML = html + '</div>';
    progreso();
    var foco = p.ops ? "#bv-tit" : (p.tipo === "texto" ? "#bv-txt" : "#bv-tel");
    if (p.ops || !window.matchMedia("(pointer: fine)").matches) enfocar("#bv-tit"); else enfocar(foco);
  }

  function datosHasta(i) {
    var d = {};
    PREGUNTAS.slice(0, i).forEach(function (p) { if (p.id in st.resp) d[p.id] = st.resp[p.id]; });
    return d;
  }

  function siguiente() {
    var antes = PREGUNTAS[st.i];
    if (st.i + 1 >= PREGUNTAS.length) return terminar();
    st.i++;
    if (PREGUNTAS[st.i].b !== antes.b) {
      Sfx.exito(); toast("✅ Bloque " + antes.b + " completo");
      enviar(datosHasta(st.i));
    } else {
      Sfx.avanzar();
      if (st.i % 3 === 0) toast(ANIMOS[(st.i / 3 - 1) % ANIMOS.length]);
    }
    pintar();
  }

  function elegir(v, boton) {
    if (st.timer) return;
    st.resp[PREGUNTAS[st.i].id] = v;
    if (PREGUNTAS[st.i].id === "pais") st.pref = "";
    $$(".bv-op", el.cuerpo).forEach(function (b) { b.classList.toggle("si", b === boton); b.setAttribute("aria-pressed", String(b === boton)); });
    Sfx.elegir();
    st.timer = setTimeout(function () { st.timer = 0; siguiente(); }, AVANZAR_MS);
  }

  function whatsapp() {
    var pref = $("#bv-pref").value.replace(/[^\d+]/g, ""), local = $("#bv-tel").value.trim(), dig = local.replace(/[^\d+]/g, "");
    st.pref = $("#bv-pref").value; st.local = local;
    var todo;
    if (dig.charAt(0) === "+") todo = dig;
    else if (dig.indexOf("00") === 0) todo = "+" + dig.slice(2);
    else {
      dig = dig.replace(/^0+/, "");
      var cod = pref.replace("+", "");
      if (cod && dig.indexOf(cod) === 0 && dig.length > 10) dig = dig.slice(cod.length);
      todo = (pref.charAt(0) === "+" ? pref : "+" + pref) + dig;
    }
    return /^\+[1-9]\d{7,14}$/.test(todo) ? todo : null;
  }

  function enviarCampo(e) {
    e.preventDefault();
    var p = PREGUNTAS[st.i];
    if (p.tipo === "texto") {
      st.resp[p.id] = $("#bv-txt").value.trim().replace(/\s+/g, " ").slice(0, 80);
      if (!st.resp[p.id] && !p.opcional) { Sfx.error(); return; }
      Sfx.elegir(); return siguiente();
    }
    var w = whatsapp();
    if (!w) {
      Sfx.error();
      $("#bv-tel").classList.remove("mal"); void $("#bv-tel").offsetWidth; $("#bv-tel").classList.add("mal");
      $("#bv-err").textContent = "Revisa el número: tiene que quedar como +54 9 11 2345 6789 (código de país + área + número).";
      $("#bv-tel").focus();
      return;
    }
    st.resp.whatsapp = w;
    siguiente();
  }

  function terminar() {
    st.etapa = "fin";
    clearTimeout(st.timer); st.timer = 0;
    var datos = datosHasta(PREGUNTAS.length); datos.completo = true;
    enviar(datos);
    guardado("jpa_perfil", "1");
    var copia = datosHasta(PREGUNTAS.length); delete copia.whatsapp; copia.ruta = rutaPara(st.resp);
    guardado("jpa_respuestas", JSON.stringify(copia));
    pantallaEspera({ emoji: "✨", ceja: "Armando tu ruta", tit: "Un segundo" + (nombre ? ", " + nombre : "") + "…", texto: "Estoy eligiendo por dónde te conviene empezar.", ms: 1300 });
    Sfx.avanzar();
    st.timer = setTimeout(resultado, 1300);
  }

  function resultado() {
    var id = rutaPara(st.resp), ruta = (window.RUTAS || []).filter(function (r) { return r.id === id; })[0];
    var instalar = st.resp.objetivo === "Que me lo instalen en mi negocio";
    // Oferta por única vez activa (Panel): se la ofrece a todos al terminar. Si no, solo a quien dijo «Sí, ahora», a 24,90.
    var oferta = window.FJ && FJ.gratis && FJ.oferta && !FJ.ofertaMostrada ? FJ.oferta : null;
    var compra = window.FJ && FJ.gratis && FJ.desbloquear && (oferta || st.resp.inversion === "Sí, ahora");
    var precio = oferta ? oferta.precio : "24,90";
    var dm = (window.REDES && REDES.dm) || "https://ig.me/m/juampiiacosta.ia";
    Sfx.gran(); confeti(70); progreso();
    el.cuerpo.innerHTML = '<div class="bv-espera"><span class="bv-icono" aria-hidden="true">🎉</span><p class="bv-ceja">Perfil completo</p>' +
      '<h2 class="bv-tit" tabindex="-1">¡Listo' + (nombre ? ", " + esc(nombre) : "") + '! Ya sé qué te sirve</h2>' +
      (ruta ? '<div class="bv-ruta"><small>Tu ruta recomendada · ' + ruta.pasos.length + ' pasos</small><b>' + esc(ruta.t) + '</b><span>' + esc(ruta.d) + '</span></div>' : '') +
      (instalar ? '<a class="bv-extra" href="' + dm + '" target="_blank" rel="noopener"><span class="e">🛠️</span><span><b>¿Quieres que te lo instale yo?</b><br>Escríbeme «INSTALAR» por Instagram y vemos tu caso.</span></a>' : '') +
      (enGuia ? '<p class="bv-texto">Con esto te armé tu sección <b>Recomendados para ti</b> en la biblioteca.</p>' : '<p class="bv-texto">Y te armé arriba de todo tu sección <b>Recomendados para ti</b>' + (window.recomendar ? ', con ' + recomendar(st.resp).length + ' guías elegidas para lo tuyo' : '') + '.</p>') +
      (compra ? '<div class="bv-oferta"><b>¿Te gustaría tener todo completo por US$ ' + esc(precio) + '?</b><span>' +
        (oferta ? 'Solo ahora, al registrarte. Después queda en US$ ' + esc(oferta.antes) + '.' : 'Las ' + FJ.total + ' guías, los sistemas y Maestro. Pago único: es tuyo para siempre.') +
        '</span></div><button class="bv-ok" type="button" id="bv-comprar">Sí, lo quiero · US$ ' + esc(precio) + '</button>' : '') +
      (enGuia ? '<button class="' + (compra ? 'bv-saltar' : 'bv-ok') + '" type="button" id="bv-ir">Seguir con la guía →</button>' + (compra ? '' : '<a class="bv-saltar" href="/recursos#inicio">Ver mis recomendados</a>') + '</div>'
        : '<button class="' + (compra ? 'bv-saltar' : 'bv-ok') + '" type="button" id="bv-ir">Ver mis recomendados →</button></div>');
    enfocar(".bv-tit");
    if (compra) {
      if (FJ.anotar) FJ.anotar("si", "formulario");
      $("#bv-comprar").addEventListener("click", function () { cerrar(); if (!(FJ.mostrarOferta && FJ.mostrarOferta())) FJ.desbloquear("formulario"); });
    }
    $("#bv-ir").addEventListener("click", function () {
      cerrar();
      if (enGuia) return;
      if (window.pintarRecomendados) pintarRecomendados();
      if (!window.verVista) { location.href = "/recursos#inicio"; return; }
      history.replaceState(null, "", "#inicio"); verVista("inicio");
      setTimeout(function () { var c = document.getElementById("para-vos"); if (c) c.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "start" }); }, 80);
    });
  }

  function abrirRuta(id) {
    var d = document.getElementById("ruta-" + id);
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "start" });
  }

  function cerrar() {
    el.raiz.hidden = true;
    document.documentElement.classList.remove("bv-lock");
    document.removeEventListener("keydown", teclas);
  }

  function teclas(e) {
    if (st.etapa !== "preg" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName)) return;
    var n = parseInt(e.key, 10), ops = $$(".bv-op", el.cuerpo);
    if (n >= 1 && n <= ops.length) elegir(ops[n - 1].getAttribute("data-v"), ops[n - 1]);
  }

  function pintarSonido() {
    el.sonido.innerHTML = Sfx.mudo() ? ICONO.mudo : ICONO.sonido;
    el.sonido.setAttribute("aria-label", Sfx.mudo() ? "Activar sonido" : "Silenciar sonido");
  }

  function abrir() {
    el.raiz = document.createElement("div");
    el.raiz.className = "bv";
    el.raiz.setAttribute("role", "dialog"); el.raiz.setAttribute("aria-modal", "true"); el.raiz.setAttribute("aria-label", "Cuéntame de ti");
    el.raiz.innerHTML = '<div class="bv-card"><div class="bv-top"><button class="bv-btn-ic" type="button" id="bv-atras" aria-label="Pregunta anterior">' + ICONO.atras + '</button>' +
      '<div class="bv-segs" aria-hidden="true"><span class="bv-seg"><i></i></span><span class="bv-seg"><i></i></span><span class="bv-seg"><i></i></span></div>' +
      '<button class="bv-btn-ic" type="button" id="bv-sonido"></button></div><div id="bv-cuerpo" aria-live="polite"></div></div>';
    document.body.appendChild(el.raiz);
    el.cuerpo = $("#bv-cuerpo", el.raiz); el.sonido = $("#bv-sonido", el.raiz); el.atras = $("#bv-atras", el.raiz);
    document.documentElement.classList.add("bv-lock");
    pintarSonido();

    el.sonido.addEventListener("click", function () { Sfx.alternar(); pintarSonido(); });
    el.atras.addEventListener("click", function () { if (st.etapa !== "preg" || st.i === 0 || st.timer) return; Sfx.click(); st.i--; pintar(); });
    el.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest(".bv-op"); if (b) return elegir(b.getAttribute("data-v"), b);
      if (e.target.closest("[data-saltar]")) { Sfx.click(); st.resp[PREGUNTAS[st.i].id] = ""; siguiente(); }
    });
    el.cuerpo.addEventListener("submit", enviarCampo);
    el.cuerpo.addEventListener("input", function (e) { if (e.target.id === "bv-tel") { e.target.classList.remove("mal"); $("#bv-err").textContent = ""; } });
    document.addEventListener("keydown", teclas);
    // Si se va a mitad, guarda lo que respondió hasta ahí
    window.addEventListener("pagehide", function () {
      if (st.etapa !== "preg" || !Object.keys(st.resp).length || !navigator.sendBeacon) return;
      navigator.sendBeacon("/api/perfil", new Blob([JSON.stringify(datosHasta(PREGUNTAS.length))], { type: "application/json" }));
    });

    pantallaEspera({ emoji: "🎁", ceja: "Biblioteca abierta", tit: "¡Entraste" + (nombre ? ", " + nombre : "") + "! Ahora cuéntame de ti",
      texto: "Son 8 preguntas rápidas y te armo tu sección de recomendados.", ms: 1600 });
    st.timer = setTimeout(function () { st.timer = 0; st.etapa = "preg"; Sfx.avanzar(); pintar(); }, 1600);
  }

  // Si quedó un envío sin confirmar de una visita anterior, lo reintenta en silencio
  var pendiente = guardado(PENDIENTE);
  if (pendiente) { try { enviar(JSON.parse(pendiente)); } catch (e) { guardado(PENDIENTE, null); } }

  var forzar = /[?&]bienvenida=1/.test(location.search);
  var gratis = /(?:^|;\s*)jpa_nivel=gratis/.test(document.cookie);
  var hecho = cookie("jpa_perfil") === "1" || guardado("jpa_perfil") === "1";
  function arrancar() { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", abrir); else abrir(); }
  if (forzar) arrancar();
  else if (gratis && !hecho) {
    // Antes de preguntar, confirma en la cuenta: si ya respondió en otro dispositivo o dominio, no se lo vuelve a pedir
    fetch("/api/cuenta", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.perfil) { guardado("jpa_perfil", "1"); document.cookie = "jpa_perfil=1; Path=/; Max-Age=31536000; Secure; SameSite=Lax"; return; }
      arrancar();
    }).catch(arrancar);
  }
})();
