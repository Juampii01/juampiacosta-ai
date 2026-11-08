/* «Recomendados para vos»: con las respuestas del formulario de bienvenida arma una selección de guías,
   una ruta y packs de prompts para esa persona, y la muestra arriba de todo en /recursos.
   Las respuestas las guarda web/bienvenida.js en el navegador (localStorage «jpa_respuestas»). */
(function () {
  "use strict";

  var RUBROS = [
    [/inmobil|propiedad|bienes ra/i, "sistema-ia-para-inmobiliarias"],
    [/cl[ií]nic|est[eé]tic|salud|odont|m[eé]dic|consultorio|spa|belleza|peluquer/i, "sistema-ia-para-clinicas-y-centros-de-estetica"],
    [/restau|gastro|bar\b|caf[eé]|comida|cocina|pizz|hamburg|delivery/i, "sistema-ia-para-restaurantes-y-gastronomia"],
    [/contab|contador|impuest|estudio contable|finanz/i, "sistema-ia-para-estudios-contables"],
    [/tienda|e-?commerce|ecommerce|online|shop|ropa|venta de productos|comercio/i, "sistema-ia-para-tiendas-online"],
    [/gimnas|gym|entrenad|fitness|crossfit|deport/i, "sistema-ia-para-gimnasios-y-entrenadores"],
    [/abogad|jur[ií]dic|legal|escriban|derecho/i, "sistema-ia-para-estudios-juridicos"],
    [/agencia|marketing|publicidad|redes sociales|community/i, "sistema-ia-para-agencias-de-marketing"],
    [/profe|academ|educa|curso|escuela|ense[nñ]/i, "sistema-ia-para-profesores-y-academias"]
  ];
  var POR = {
    foco: {
      "Atención y WhatsApp": ["agente-de-whatsapp-que-atiende-y-agenda", "agente-de-atencion-con-base-de-conocimiento", "skill-para-responder-clientes"],
      "Contenido y redes": ["guiones-de-reels-con-tu-voz", "carruseles-con-claude-paso-a-paso", "treinta-dias-de-ideas-de-contenido"],
      "Ventas y seguimiento": ["responder-dms-y-calificar-prospectos", "seguimiento-de-prospectos-sin-ser-pesado", "agente-que-califica-prospectos"],
      "Administración y planillas": ["analizar-planillas-con-claude", "panel-de-metricas-de-tu-negocio-con-claude", "resumir-reuniones-y-mails"],
      "Crear apps o webs": ["de-idea-a-app-publicada-con-claude-code", "webs-con-ia-3-skills-2-conectores", "base-de-datos-con-supabase-y-claude-code"]
    },
    objetivo: {
      "Ahorrar tiempo en mi negocio": ["cinco-preguntas-antes-de-meter-ia-en-tu-negocio", "proyectos-de-claude-para-tu-negocio", "resumir-reuniones-y-mails"],
      "Vender servicios de IA": ["sistema-base-modulo-1-la-oferta", "sistema-base-modulo-2-elegir-a-quien-venderle", "cuanto-cobrar-por-automatizar-con-ia"],
      "Conseguir trabajo con IA": ["claude-code-de-cero-sin-miedo", "de-idea-a-app-publicada-con-claude-code", "git-y-github-para-no-perder-nada"],
      "Aprender": ["las-formas-de-usar-claude", "formula-para-pedirle-bien-a-claude", "que-es-una-skill-y-como-crear-la-tuya"],
      "Que me lo instalen en mi negocio": ["cinco-preguntas-antes-de-meter-ia-en-tu-negocio", "el-plano-de-un-negocio-con-ia", "agente-de-whatsapp-que-atiende-y-agenda"]
    },
    situacion: {
      "Tengo un negocio": ["el-plano-de-un-negocio-con-ia", "de-donde-vienen-tus-clientes"],
      "Trabajo en una empresa": ["analizar-planillas-con-claude", "proyectos-de-claude-para-tu-negocio"],
      "Freelancer o agencia": ["propuesta-comercial-con-claude", "responder-dms-y-calificar-prospectos"],
      "Quiero vender IA a empresas": ["sistema-base-modulo-1-la-oferta", "sistema-base-modulo-3-el-primer-mensaje"],
      "Estudiante": ["claude-code-de-cero-sin-miedo", "que-modelo-de-claude-uso"],
      "Otro": ["5-cosas-para-montar-con-claude-el-finde"]
    },
    nivel: {
      "Nunca usé IA": ["configura-claude-en-10-minutos", "las-formas-de-usar-claude", "formula-para-pedirle-bien-a-claude"],
      "Uso ChatGPT o Claude a veces": ["configura-claude-en-10-minutos", "pasate-de-chatgpt-a-claude"],
      "La uso todos los días": ["que-es-una-skill-y-como-crear-la-tuya", "conectores-claude-dentro-de-tus-apps"],
      "Ya armo automatizaciones o agentes": ["que-es-un-agente-de-ia-de-verdad", "claude-code-de-cero-sin-miedo"]
    }
  };
  var MOTIVO = { rubro: "Por tu rubro", foco: "Lo que querés resolver", objetivo: "Por tu objetivo", situacion: "Por lo que hacés", nivel: "Para tu nivel", ahorro: "Que no se te corte el plan" };
  var PACKS = {
    "Atención y WhatsApp": ["agentes", "negocio"], "Contenido y redes": ["contenido"], "Ventas y seguimiento": ["clientes"],
    "Administración y planillas": ["negocio"], "Crear apps o webs": ["desarrollo", "claude-code"]
  };
  var MAX = 6;

  function rubroDe(texto) {
    for (var i = 0; i < RUBROS.length; i++) if (RUBROS[i][0].test(texto || "")) return RUBROS[i][1];
    return null;
  }

  /** [{ g: guía, motivo }] sin repetidos, en orden de importancia */
  function recomendar(r) {
    var por = {}, out = [], vistos = {};
    GUIAS_WEB.forEach(function (g) { por[g.slug] = g; });
    function sumar(slug, motivo) {
      if (!slug || vistos[slug] || !por[slug] || out.length >= MAX) return;
      vistos[slug] = 1; out.push({ g: por[slug], motivo: motivo });
    }
    var interesRubros = r.situacion === "Quiero vender IA a empresas" || r.objetivo === "Vender servicios de IA";
    var rubro = rubroDe(r.rubro);
    if (rubro && (r.situacion !== "Estudiante")) sumar(rubro, interesRubros ? "Para venderle a ese rubro" : MOTIVO.rubro);
    // Primera pasada: lo más importante de cada respuesta, con lugar fijo para ahorrar tokens. Segunda: completa hasta MAX.
    var f = POR.foco[r.foco] || [], o = POR.objetivo[r.objetivo] || [], si = POR.situacion[r.situacion] || [], n = POR.nivel[r.nivel] || [];
    f.slice(0, 2).forEach(function (x) { sumar(x, MOTIVO.foco); });
    o.slice(0, 2).forEach(function (x) { sumar(x, MOTIVO.objetivo); });
    sumar(si[0], MOTIVO.situacion);
    sumar(n[0], MOTIVO.nivel);
    sumar("errores-que-agotan-tu-plan-de-claude", MOTIVO.ahorro);
    o.slice(2).forEach(function (x) { sumar(x, MOTIVO.objetivo); });
    si.slice(1).forEach(function (x) { sumar(x, MOTIVO.situacion); });
    n.slice(1).forEach(function (x) { sumar(x, MOTIVO.nivel); });
    f.slice(2).forEach(function (x) { sumar(x, MOTIVO.foco); });
    return out;
  }

  function resumen(r) {
    var quien = { "Tengo un negocio": "tenés un negocio", "Trabajo en una empresa": "trabajás en una empresa", "Freelancer o agencia": "sos freelancer o tenés una agencia",
      "Quiero vender IA a empresas": "querés vender IA a empresas", "Estudiante": "estás estudiando", "Otro": "querés sacarle jugo a la IA" }[r.situacion] || "";
    var rubro = r.rubro ? " (" + r.rubro.toLowerCase() + ")" : "";
    var meta = { "Ahorrar tiempo en mi negocio": "ahorrar tiempo", "Vender servicios de IA": "vender servicios de IA", "Conseguir trabajo con IA": "conseguir trabajo con IA",
      "Aprender": "aprender", "Que me lo instalen en mi negocio": "que la IA trabaje en tu negocio" }[r.objetivo] || "";
    return "Como " + quien + rubro + " y querés " + meta + (r.foco ? ", empezando por " + r.foco.charAt(0).toLowerCase() + r.foco.slice(1) : "") + ", esto es lo que más te va a servir.";
  }

  function leer() { try { return JSON.parse(localStorage.getItem("jpa_respuestas") || "null"); } catch (e) { return null; } }

  function pintar() {
    var caja = document.getElementById("para-vos"), r = leer();
    if (!caja || !r || !r.objetivo) return;
    var nombre = (document.cookie.match(/(?:^|;\s*)jpa_nombre=([^;]*)/) || [])[1];
    nombre = nombre ? decodeURIComponent(nombre) : "";
    var gratis = /(?:^|;\s*)jpa_nivel=gratis/.test(document.cookie);
    var lista = recomendar(r);
    var abiertas = lista.filter(function (x) { return !gratis || x.g.gratis; }).length;
    var ruta = (window.RUTAS || []).filter(function (x) { return x.id === r.ruta; })[0];
    var cats = (PACKS[r.foco] || []).concat(r.objetivo === "Vender servicios de IA" ? ["sistema-base"] : []);
    var packs = (window.PROMPTS || []).filter(function (p) { return cats.indexOf(p.cat) > -1; }).slice(0, 4);

    var tarjetas = lista.map(function (x) {
      var cerrada = gratis && !x.g.gratis;
      return '<a class="pv-card' + (cerrada ? ' cerrada' : '') + '" href="' + (cerrada ? '/#precio' : 'guias/' + x.g.slug + '.html') + '">' +
        '<span class="pv-motivo">' + x.motivo + '</span><h4>' + x.g.t + '</h4><p>' + x.g.d + '</p>' +
        '<span class="pv-pie"><b>' + x.g.min + ' min</b><i>' + x.g.tema + '</i><em>' + (cerrada ? '🔒 Desbloquear' : 'Leer →') + '</em></span></a>';
    }).join("");

    caja.innerHTML = '<div class="pv glass">' +
      '<div class="pv-cab"><div><span class="mono">Recomendados para vos</span><h2>' + (nombre ? nombre + ", esto" : "Esto") + ' es lo tuyo</h2><p>' + resumen(r) + '</p></div>' +
      '<a class="pv-cambiar" href="?bienvenida=1">Cambiar mis respuestas</a></div>' +
      (ruta ? '<a class="pv-ruta" href="#ruta-' + ruta.id + '" data-ruta="' + ruta.id + '"><span>🧭</span><div><small>Tu ruta</small><b>' + ruta.t + '</b></div><em>' + ruta.pasos.length + ' pasos →</em></a>' : '') +
      '<div class="pv-grid">' + tarjetas + '</div>' +
      (packs.length ? '<div class="pv-packs"><small>Prompts para lo tuyo</small>' + packs.map(function (p) {
        return '<a href="#p-' + p.cat + '" data-ir="prompts">' + p.t + ' <b>' + p.prompts.length + '</b></a>'; }).join("") + '</div>' : '') +
      (gratis && abiertas < lista.length ? '<a class="pv-cta" href="/#precio"><b>' + (lista.length - abiertas) + ' de tus ' + lista.length + ' recomendados</b> son del acceso completo. Desbloquealos →</a>' : '') +
      (r.objetivo === "Que me lo instalen en mi negocio" ? '<a class="pv-cta pv-cta--dm" href="' + ((window.REDES && REDES.dm) || "#") + '" target="_blank" rel="noopener">🛠️ <b>¿Querés que te lo instale yo?</b> Escribime «INSTALAR» por Instagram →</a>' : '') +
      '</div>';

    caja.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ruta]");
      if (a) {
        e.preventDefault();
        history.replaceState(null, "", "#rutas"); verVista("rutas");
        setTimeout(function () { var d = document.getElementById("ruta-" + a.dataset.ruta); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 80);
        return;
      }
      var p = e.target.closest("[data-ir]");
      if (p) {
        e.preventDefault();
        history.replaceState(null, "", "#prompts"); verVista("prompts");
        var destino = p.getAttribute("href");
        setTimeout(function () { var d = document.querySelector(destino); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
      }
    });
  }

  window.recomendar = recomendar;
  window.pintarRecomendados = pintar;
  pintar();
})();
