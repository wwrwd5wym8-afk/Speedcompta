/* ============================================================================
   Espaces dédiés : certains modules s'ouvrent sur une page entière qui leur est propre
   (Paie, Conseil, Juridique, Patrimoine, Audit, Contrôle de gestion…)
   - bandeau du module à ses couleurs, ses onglets, sa recherche
   - « ← Retour » ramène exactement à la page d'où l'on venait (onglet, journal, mois…)
   - ouverture possible dans un nouvel onglet du navigateur
   - choix des modules concernés dans Paramètres (Oui / Non par module)
   ========================================================================== */
const WS_DEF = { finance: 1, paie: 1, pp: 1, pat: 1, juridique: 1, audit: 1, cdg: 1, gem: 1, ecom: 1, mkg: 1, conso: 1, fus: 1, subv: 1, pa: 0, grp: 0, ohj: 1, contacts: 0, learn: 1 };
const WS_LOOK = { finance: ["🧭", "#1E3A8A", "#3B5BDB", "Analyses, alertes, budget, finance et conseil"], paie: ["👔", "#0E5A6B", "#14899E", "Salariés, variables, bulletins et DSN"], pp: ["🏡", "#7A3E12", "#C26A1F", "Accompagnement des particuliers"], pat: ["💎", "#4C1D95", "#7C3AED", "Bilan patrimonial, fiscalité, transmission"], juridique: ["⚖️", "#3F3F46", "#6B7280", "Approbation des comptes, actes, rapports"], audit: ["🔍", "#7F1D1D", "#B91C1C", "Missions, contrôles et rapports d'audit"], cdg: ["📈", "#064E3B", "#059669", "Reporting, budget, coûts et indicateurs"], gem: ["🧩", "#713F12", "#B45309", "Pilotage, organisation et équipes"], ecom: ["🛍", "#831843", "#DB2777", "Ventes en ligne, catalogue et TVA OSS"], mkg: ["📣", "#9A3412", "#EA580C", "Publications, campagnes et réseaux"], conso: ["🧮", "#1E3A5F", "#2563EB", "Périmètre, éliminations, normes"], fus: ["🔀", "#312E81", "#4F46E5", "Opérations de fusion"], subv: ["🎗", "#14532D", "#16A34A", "Conventions et fonds dédiés"], pa: ["📡", "#0F3D3E", "#13585A", "Plateforme agréée"], grp: ["🏢", "#1F2937", "#4B5563", "Comptes groupés"], ohj: ["📜", "#422006", "#A16207", "Juridique OHADA"], contacts: ["👥", "#0F3D3E", "#13585A", "Contacts et CRM"], learn: ["🎓", "#1E3A8A", "#2563EB", "Formations et présentation"] };
function wsCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:wsMods") || "{}") || {}; } catch (e) { } return Object.assign({}, WS_DEF, c); }
function wsOn() { try { return localStorage.getItem("sc:wsOn") !== "0"; } catch (e) { return true; } }
function wsGroupOf(v) { if (typeof NAV2 === "undefined") return ""; for (const n of NAV2) { const subs = Array.isArray(n[3]) ? n[3] : []; if ((n[2] || []).includes(v) || subs.some(s => s[0] === v)) return n[0]; } return ""; }
function wsActive() { if (!wsOn() || !S) return ""; const g = wsGroupOf(UI.view); return g && wsCfg()[g] ? g : ""; }
function wsLabel(snap) { try { return typeof nhLabel === "function" ? nhLabel(snap) : snap.view; } catch (e) { return snap.view; } }
function wsBar(g) { const n = NAV2.find(x => x[0] === g); if (!n) return ""; const L = WS_LOOK[g] || ["◼", "#0F3D3E", "#13585A", ""]; const subs = (Array.isArray(n[3]) ? n[3] : []).filter(s => typeof VIEWS === "undefined" || VIEWS[s[0]] || String(s[2] || "").startsWith("sp:"));
  const cur = UI.view; const back = UI.wsBack; const bl = back ? wsLabel(back) : "Accueil";
  const act = s => { if (String(s[2] || "").startsWith("sp:")) { try { const sp = s[2].slice(3); return SPACES[sp].tabs.some(t => t[0] === cur) && (curSpace() === sp); } catch (e) { return false; } } return s[0] === cur; };
  return `<div class="ws-bar" style="--wa:${L[1]};--wb:${L[2]}"><div class="ws-top"><button class="ws-back" data-act="wsBack" title="Revenir à : ${esc(bl)} (Alt+←)"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span><small>Retour</small>${esc(bl)}</span></button>
    <div class="ws-id"><span class="ws-ic">${L[0]}</span><div><b>${esc(n[1])}</b><small>${esc(L[3])} · ${esc(S.nom || "")}</small></div></div><span class="ws-sp"></span>
    <button class="ws-btn" data-act="wsSearch" title="Aller à une page (Ctrl+K)">🔎 Rechercher <kbd>Ctrl K</kbd></button><button class="ws-btn" data-act="wsNewTab" title="Ouvrir cet espace dans un nouvel onglet du navigateur">↗ Nouvel onglet</button><button class="ws-btn ws-x" data-act="wsBack" title="Fermer l'espace">✕</button></div>
    ${subs.length > 1 ? `<nav class="ws-tabs">${subs.map((s, i) => `<button class="${act(s) ? "on" : ""}" data-act="wsTab" data-g="${esc(g)}" data-i="${i}">${esc(String(s[1]).replace(/^[^\wÀ-ÿ]+\s*/, ""))}</button>`).join("")}</nav>` : ""}</div>`; }
(function () {
  let last = ""; let intro = 0;
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try {
      const g = wsActive();
      if (!g) { if (S && UI.view && typeof nhSnap === "function") UI.wsPrev = nhSnap(); if (last) { last = ""; UI.wsBack = null; } document.body.classList.remove("ws-on"); document.body.removeAttribute("data-ws"); return; }
      if (g !== last) { if (!last) UI.wsBack = UI.wsPrev || null; last = g; intro = Date.now(); }
      document.body.classList.add("ws-on"); document.body.dataset.ws = g;
      const mi = document.querySelector(".main-in"); if (!mi) return; let b = mi.querySelector(":scope > .ws-bar"); const html = wsBar(g); const tmp = document.createElement("div"); tmp.innerHTML = html; const nb = tmp.firstElementChild; if (!nb) return;
      if (b) b.replaceWith(nb); else mi.insertBefore(nb, mi.firstChild); if (Date.now() - intro < 120) { nb.classList.add("ws-in"); document.querySelector(".main") && document.querySelector(".main").classList.add("ws-anim"); setTimeout(() => { const m = document.querySelector(".main"); m && m.classList.remove("ws-anim"); }, 450); }
    } catch (e) { console.warn("ws", e); } };
  Object.assign(ACT, {
    wsBack: () => { const b = UI.wsBack; UI.wsBack = null; if (b && typeof nhApply === "function" && b.view) { nhApply(b); return; } go("dashboard"); },
    wsTab: el => { const n = NAV2.find(x => x[0] === el.dataset.g); const s = n && n[3][+el.dataset.i]; if (!s) return; if (String(s[2] || "").startsWith("sp:")) spGo(s[2].slice(3)); else go(s[0]); },
    wsSearch: () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })); },
    wsNewTab: () => { const u = location.href.split("#")[0] + "#ws=" + encodeURIComponent(UI.view); let w = null; try { w = window.open(u, "_blank", "noopener"); } catch (e) { } if (!w) toast("Votre navigateur bloque l'ouverture : autorisez les fenêtres pour ce site, ou utilisez « Retour » pour revenir."); }
  });
  /* ouverture directe d'un espace depuis un nouvel onglet (#ws=vue) */
  const tryHash = () => { const m = (location.hash || "").match(/ws=([\w-]+)/); if (!m || !S || typeof VIEWS === "undefined" || !VIEWS[m[1]]) return false; history.replaceState(null, "", location.href.split("#")[0]); go(m[1]); return true; };
  let k = 0; const t = setInterval(() => { k++; if (tryHash() || k > 60) clearInterval(t); }, 500);
  CHG.wsOn = el => { try { localStorage.setItem("sc:wsOn", el.value); } catch (e) { } toast(el.value === "1" ? "Espaces dédiés activés" : "Espaces dédiés désactivés"); render(); };
  CHG.wsMod = el => { const c = wsCfg(); c[el.dataset.g] = el.value === "1" ? 1 : 0; try { localStorage.setItem("sc:wsMods", JSON.stringify(c)); } catch (e) { } render(); };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); if (typeof NAV2 === "undefined") return h; const c = wsCfg();
    const rows = NAV2.filter(n => WS_LOOK[n[0]]).map(n => `<label class="ws-pr"><span>${(WS_LOOK[n[0]] || [""])[0]} ${esc(n[1])}</span><select class="in" data-ch="wsMod" data-g="${esc(n[0])}"><option value="1" ${c[n[0]] ? "selected" : ""}>Oui</option><option value="0" ${c[n[0]] ? "" : "selected"}>Non</option></select></label>`).join("");
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>🪟 Espaces dédiés</h2></div><div class="panel-b"><label class="f" style="max-width:520px">Ouvrir certains modules sur une page entière à part<select class="in" data-ch="wsOn"><option value="1" ${wsOn() ? "selected" : ""}>Oui</option><option value="0" ${wsOn() ? "" : "selected"}>Non</option></select><small class="muted">Le module s'ouvre à ses couleurs, avec ses onglets ; « ← Retour » ramène à la page d'où vous veniez. Choisissez les modules concernés :</small></label><div class="ws-pg">${rows}</div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();
(function () { const st = document.createElement("style"); st.textContent = `
body.ws-on .rail,body.ws-on .mob-top{display:none!important}
body.ws-on .app{grid-template-columns:minmax(0,1fr)!important}
body.ws-on .main-in{max-width:1500px!important;margin:0 auto!important}
body.ws-on .hdr{background:color-mix(in oklab,#fff 92%,transparent)}
.ws-bar{position:relative;border-radius:18px;overflow:hidden;margin:4px 0 18px;color:#fff;background:linear-gradient(120deg,var(--wa),var(--wb));box-shadow:0 18px 40px -22px var(--wa)}
.ws-bar::after{content:"";position:absolute;right:-60px;top:-80px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.18),transparent 65%);pointer-events:none}
.ws-top{position:relative;z-index:1;display:flex;align-items:center;gap:14px;padding:16px 18px 12px;flex-wrap:wrap}
.ws-back{display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12);color:#fff;border-radius:12px;padding:7px 12px 7px 9px;cursor:pointer;font:inherit;text-align:left;max-width:300px;transition:background .15s,transform .1s}
.ws-back:hover{background:rgba(255,255,255,.22)}.ws-back:active{transform:scale(.98)}.ws-back svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ws-back span{display:flex;flex-direction:column;line-height:1.15;min-width:0;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ws-back small{font-weight:500;font-size:10.5px;opacity:.75;text-transform:uppercase;letter-spacing:.06em}
.ws-id{display:flex;align-items:center;gap:12px}.ws-ic{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:24px}.ws-id b{font-size:22px;letter-spacing:-.02em;display:block}.ws-id small{font-size:12.5px;opacity:.8}
.ws-sp{flex:1}
.ws-btn{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:7px 11px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}.ws-btn:hover{background:rgba(255,255,255,.2)}.ws-btn kbd{font:10px "IBM Plex Mono",monospace;background:rgba(255,255,255,.2);border-radius:4px;padding:1px 4px;margin-left:4px}.ws-x{padding:7px 10px}
.ws-tabs{position:relative;z-index:1;display:flex;gap:2px;padding:0 12px;overflow-x:auto;scrollbar-width:none}.ws-tabs::-webkit-scrollbar{display:none}
.ws-tabs button{border:0;background:none;color:rgba(255,255,255,.78);font:inherit;font-size:13.5px;font-weight:600;padding:10px 12px 12px;cursor:pointer;white-space:nowrap;border-bottom:3px solid transparent;transition:color .12s,border-color .12s}
.ws-tabs button:hover{color:#fff}.ws-tabs button.on{color:#fff;border-color:#F5B700}
.ws-in{animation:wsIn .38s cubic-bezier(.2,.9,.3,1)}@keyframes wsIn{from{opacity:0;transform:translateY(-10px) scale(.985)}to{opacity:1;transform:none}}
.main.ws-anim .main-in>*:not(.ws-bar){animation:wsFade .35s ease-out}@keyframes wsFade{from{opacity:0;transform:translateY(8px)}}

.ws-pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin-top:10px}.ws-pr{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--rule,#E3EBEA);border-radius:10px;padding:6px 10px;font-size:13px}.ws-pr select{width:auto}
@media (max-width:760px){.ws-top{padding:12px}.ws-id b{font-size:18px}.ws-btn{display:none}.ws-back{max-width:none}}
@media (prefers-reduced-motion:reduce){.ws-in,.main.ws-anim .main-in>*{animation:none}}`; document.head.appendChild(st); })();
