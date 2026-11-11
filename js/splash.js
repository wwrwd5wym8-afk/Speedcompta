/* ============================================================
   Logo SpeedCompta (compteur) + animation d'ouverture façon application mobile :
   fond de la marque, ondes, le logo se dessine, l'aiguille monte, le nom s'écrit,
   puis le logiciel apparaît. Chargé tout de suite pour couvrir le démarrage.
   ============================================================ */
(function () {
  var TEAL = "#0F3D3E", GOLD = "#F5B700", CREAM = "#FBF8F2";
  function mark(stroke, needle, hub) {
    return '<path class="m-arc" d="M72 24 A34 34 0 1 0 72 72" fill="none" stroke="' + stroke + '" stroke-width="11" stroke-linecap="round"/>' +
      '<line class="m-ndl" x1="48" y1="48" x2="71" y2="35" stroke="' + needle + '" stroke-width="7" stroke-linecap="round"/>' +
      '<circle class="m-hub" cx="48" cy="48" r="7" fill="' + (hub || stroke) + '"/>';
  }
  function markSVG(stroke, needle, size) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"' + (size ? ' width="' + size + '" height="' + size + '"' : "") + ' aria-hidden="true">' + mark(stroke, needle) + "</svg>"; }
  function iconSVG() { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="' + TEAL + '"/><g transform="translate(14 14) scale(.7083)">' + mark(CREAM, GOLD) + "</g></svg>"; }
  var cache = {}; try { cache = JSON.parse(localStorage.getItem("sc:brandCache") || "{}") || {}; } catch (e) { cache = {}; }
  window.SCLOGO = { TEAL: TEAL, GOLD: GOLD, CREAM: CREAM, mark: mark, markSVG: markSVG, iconSVG: iconSVG, cache: cache,
    iconURL: function () { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconSVG()); } };

  var off = false; try { off = localStorage.getItem("sc:splashOff") === "1"; } catch (e) { }
  var reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { }

  var CSS = '#scSplash{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;background:var(--scs-bg);transition:opacity .45s ease,transform .45s ease;-webkit-tap-highlight-color:transparent}' +
    '#scSplash.out{opacity:0;transform:scale(1.04);pointer-events:none}' +
    '#scSplash .scs-w{position:absolute;left:50%;top:50%;border-radius:50%;border:3px solid transparent;border-top-color:var(--scs-wave);border-bottom-color:var(--scs-wave);transform:translate(-50%,-50%) scale(.55);opacity:0;animation:scsWave 2.6s cubic-bezier(.2,.7,.3,1) infinite;filter:blur(.4px)}' +
    '@keyframes scsWave{0%{opacity:0;transform:translate(-50%,-50%) scale(.55)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.08)}}' +
    '#scSplash .scs-c{position:relative;display:flex;align-items:center;justify-content:center}' +
    '#scSplash .scs-ic{position:relative;width:clamp(64px,17vw,92px);height:clamp(64px,17vw,92px);flex:none;display:grid;place-items:center}' +
    '#scSplash .scs-pill{position:absolute;left:50%;top:50%;width:150%;height:62%;border-radius:999px;background:' + CREAM + ';transform:translate(-50%,-50%) scale(0);animation:scsPill .75s cubic-bezier(.34,1.4,.64,1) forwards}' +
    '@keyframes scsPill{0%{transform:translate(-50%,-50%) scale(0)}45%{transform:translate(-50%,-50%) scale(1);width:150%;height:62%;opacity:1}100%{transform:translate(-50%,-50%) scale(1);width:40%;height:40%;opacity:0}}' +
    '#scSplash .scs-ic svg{position:relative;width:100%;height:100%;overflow:visible}' +
    '#scSplash .m-arc{stroke-dasharray:161;stroke-dashoffset:161;animation:scsDraw .55s cubic-bezier(.6,0,.3,1) .45s forwards}' +
    '@keyframes scsDraw{to{stroke-dashoffset:0}}' +
    '#scSplash .m-hub{transform-box:view-box;transform-origin:48px 48px;transform:scale(0);animation:scsPop .35s cubic-bezier(.34,1.8,.64,1) .7s forwards}' +
    '@keyframes scsPop{to{transform:scale(1)}}' +
    '#scSplash .m-ndl{transform-box:view-box;transform-origin:48px 48px;transform:rotate(-200deg);opacity:0;animation:scsNeedle .75s cubic-bezier(.34,1.56,.64,1) .8s forwards}' +
    '@keyframes scsNeedle{0%{opacity:1;transform:rotate(-200deg)}100%{opacity:1;transform:rotate(0)}}' +
    '#scSplash .scs-img{position:relative;max-width:100%;max-height:100%;border-radius:18px;background:#fff;padding:8px;box-sizing:border-box;transform:scale(0);animation:scsPop .55s cubic-bezier(.34,1.56,.64,1) .35s forwards}' +
    '#scSplash .scs-img.wide{max-width:none;width:auto;height:100%;padding:10px 16px}' +
    '#scSplash .scs-wm{overflow:hidden;white-space:nowrap;max-width:0;margin-left:0;font:800 clamp(28px,8vw,46px)/1 "Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.03em;color:#fff;animation:scsWm .7s cubic-bezier(.7,0,.2,1) 1.35s forwards}' +
    '#scSplash .scs-wm span{display:inline-block;transform:translateX(-30px);opacity:0;animation:scsWmIn .6s ease-out 1.5s forwards}' +
    '#scSplash .scs-wm i{font-style:normal;font-weight:500;color:var(--scs-acc)}' +
    '@keyframes scsWm{to{max-width:72vw;margin-left:clamp(12px,3.5vw,20px)}}' +
    '@keyframes scsWmIn{to{transform:none;opacity:1}}' +
    '#scSplash .scs-tag{position:absolute;left:0;right:0;bottom:max(36px,env(safe-area-inset-bottom,0px));text-align:center;font:500 13px system-ui,sans-serif;color:rgba(255,255,255,.62);letter-spacing:.14em;text-transform:uppercase;opacity:0;animation:scsWmIn .6s ease-out 1.9s forwards}' +
    '@media (prefers-reduced-motion:reduce){#scSplash *{animation-duration:.01s!important;animation-delay:0s!important}#scSplash .scs-w{display:none}}';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rgba(hex, a) { var h = String(hex || "").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); if (!/^[0-9a-f]{6}$/i.test(h)) return "rgba(245,183,0," + a + ")"; return "rgba(" + parseInt(h.slice(0, 2), 16) + "," + parseInt(h.slice(2, 4), 16) + "," + parseInt(h.slice(4, 6), 16) + "," + a + ")"; }
  function parts(n) { var m = String(n || "Speedix").match(/^([A-ZÀ-Ü]?[a-zà-ÿ]+)\s*([A-ZÀ-Ü].*)$/); return m ? [m[1], m[2]] : [n || "Speedix", ""]; }

  /* joue l'animation ; done() est appelé quand elle disparaît. waitReady : attendre que le logiciel soit affiché */
  window.SC_SPLASH = function (opt) {
    opt = opt || {}; var C = window.SCLOGO.cache || {};
    var old = document.getElementById("scSplash"); if (old) old.remove();
    var st = document.getElementById("scSplashCss"); if (!st) { st = document.createElement("style"); st.id = "scSplashCss"; st.textContent = CSS; document.head.appendChild(st); }
    var bg = C.bg || TEAL, acc = C.acc || GOLD; var P = parts(C.nom);
    var waves = ""; [150, 220, 300, 390, 490].forEach(function (s, i) { waves += '<i class="scs-w" style="width:' + s + 'px;height:' + s + 'px;animation-delay:' + (0.25 + i * 0.22).toFixed(2) + 's"></i>'; });
    var ic = C.img ? '<img class="scs-img' + (C.wide ? " wide" : "") + '" src="' + esc(C.img) + '" alt="">' : '<span class="scs-pill"></span>' + markSVG(CREAM, acc);
    var wm = C.img && C.wide ? "" : '<div class="scs-wm"><span>' + esc(P[0]) + (P[1] ? "<i>" + esc(P[1]) + "</i>" : "") + "</span></div>";
    var el = document.createElement("div"); el.id = "scSplash"; el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--scs-bg", bg); el.style.setProperty("--scs-acc", acc); el.style.setProperty("--scs-wave", rgba(acc, 0.34));
    el.innerHTML = waves + '<div class="scs-c' + (C.img && C.wide ? " wide" : "") + '"><div class="scs-ic"' + (C.img && C.wide ? ' style="width:auto"' : "") + ">" + ic + "</div>" + wm + "</div>" + (C.slogan ? '<div class="scs-tag">' + esc(C.slogan) + "</div>" : "");
    (document.body || document.documentElement).appendChild(el);
    var t0 = Date.now(), MIN = reduce ? 500 : 3000, MAX = 14000, gone = false;
    function ready() { if (!opt.waitReady) return true; if (window.__SC_READY) return true; var a = document.getElementById("app"); return !!(a && a.children.length && !document.getElementById("bootStep")); }
    function hide() { if (gone) return; gone = true; el.classList.add("out"); setTimeout(function () { el.remove(); if (opt.done) opt.done(); }, 480); }
    el.addEventListener("click", function () { if (Date.now() - t0 > 900 && ready()) hide(); });
    (function tick() { if (gone) return; var t = Date.now() - t0; if ((t >= MIN && ready()) || t >= MAX) hide(); else setTimeout(tick, 120); })();
  };
  if (!off) { try { window.SC_SPLASH({ waitReady: true }); } catch (e) { } }
})();
