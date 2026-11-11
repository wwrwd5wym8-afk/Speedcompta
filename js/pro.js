/* ============================================================
   Confort moderne :
   - palette de commandes (Ctrl+K / ⌘K ou « / ») : pages, sociétés, actions, récents
   - aide des raccourcis clavier (« ? »)
   - « Quoi de neuf » après chaque mise à jour
   - taille d'affichage (90 % à 125 %) mémorisée
   - titre d'onglet dynamique, transition douce entre écrans, bouton « haut de page »
   - bandeau hors connexion
   ============================================================ */
(function () {
  const LSG = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const LSS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const KB = isMac ? "⌘K" : "Ctrl K";
  const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const st = document.createElement("style");
  st.textContent = `
  .pk-bg{position:fixed;inset:0;z-index:9600;background:rgba(15,30,32,.38);backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;padding:12vh 16px 16px;animation:pkF .12s ease-out}
  @keyframes pkF{from{opacity:0}to{opacity:1}}
  .pk{width:min(640px,100%);background:#fff;border-radius:18px;box-shadow:0 30px 80px -20px rgba(0,0,0,.45);overflow:hidden;display:flex;flex-direction:column;max-height:70vh;animation:pkU .16s ease-out}
  @keyframes pkU{from{transform:translateY(8px) scale(.985);opacity:0}to{transform:none;opacity:1}}
  .pk-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #EEF2F2}
  .pk-in input{flex:1;border:0;outline:0;font:inherit;font-size:17px;color:#13262A;background:none}
  .pk-in kbd,.pk-ft kbd,.kb-t kbd{font:600 11px/1 ui-monospace,monospace;background:#F2F5F5;border:1px solid #DCE4E3;border-bottom-width:2px;border-radius:6px;padding:3px 6px;color:#4A5B5B}
  .pk-ls{overflow:auto;padding:6px}
  .pk-g{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8A9999;padding:10px 10px 4px}
  .pk-it{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;font-size:14px;color:#13262A}
  .pk-it i{font-style:normal;width:22px;text-align:center;flex:none}.pk-it small{margin-left:auto;color:#8A9999;font-size:12px;white-space:nowrap;padding-left:10px}
  .pk-it.on{background:#0F3D3E;color:#fff}.pk-it.on small{color:#CFE3E1}
  .pk-it mark{background:none;color:inherit;font-weight:800;text-decoration:underline;text-decoration-color:#F5B700;text-decoration-thickness:2px}
  .pk-it .lk{margin-left:6px;font-size:11px;opacity:.7}
  .pk-no{padding:28px;text-align:center;color:#6B7B7B;font-size:14px}
  .pk-ft{display:flex;gap:14px;padding:9px 14px;border-top:1px solid #EEF2F2;font-size:12px;color:#6B7B7B;background:#FAFCFC;flex-wrap:wrap}
  .pk-hint{display:inline-flex;align-items:center;gap:6px;border:1px solid #DCE5E4;background:#fff;border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px;color:#4A5B5B;cursor:pointer;white-space:nowrap}
  .pk-hint:hover{border-color:#13585A;color:#0F3D3E}.pk-hint kbd{font:600 10.5px/1 ui-monospace,monospace;background:#F2F5F5;border:1px solid #DCE4E3;border-radius:5px;padding:2px 5px}
  .kb-t{width:100%;border-collapse:collapse;font-size:14px}.kb-t td{padding:8px 4px;border-bottom:1px solid #EEF2F2}.kb-t td:last-child{text-align:right;white-space:nowrap}
  .nw-it{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #EEF2F2}.nw-it:last-child{border:0}.nw-it i{font-style:normal;font-size:22px;flex:none}.nw-it b{display:block;color:#0F3D3E}.nw-it span{font-size:13.5px;color:#4A5B5B;line-height:1.5}
  .nw-pill{position:fixed;left:16px;bottom:16px;z-index:8500;display:flex;align-items:center;gap:8px;background:#0F3D3E;color:#fff;border:0;border-radius:999px;padding:10px 16px;font:inherit;font-size:13.5px;font-weight:700;box-shadow:0 12px 30px -8px rgba(15,61,62,.5);cursor:pointer;animation:pkU .3s ease-out}
  .nw-pill b{color:#F5B700}.nw-pill .x{margin-left:6px;opacity:.7;font-weight:400}
  .tt-top{position:fixed;right:22px;bottom:84px;z-index:8400;width:42px;height:42px;border-radius:50%;border:1px solid #DCE5E4;background:#fff;color:#0F3D3E;font-size:18px;box-shadow:0 8px 20px rgba(15,61,62,.15);cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;transform:translateY(8px)}
  .tt-top.on{opacity:1;pointer-events:auto;transform:none}
  @media (min-width:900px){.nw-pill{left:290px}}
  .off-bar{position:fixed;top:0;left:0;right:0;z-index:9700;background:#B42318;color:#fff;text-align:center;font-size:13.5px;padding:8px 12px;font-weight:600}
  .off-bar.ok{background:#0E7A4F}
  .pv-in{animation:pvIn .22s ease-out}@keyframes pvIn{from{opacity:.0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){.pv-in,.pk,.pk-bg,.nw-pill{animation:none!important}}
  @media (max-width:760px){.pk-hint{display:none}.pk-bg{padding-top:8vh}}`;
  document.head.appendChild(st);

  /* ---------- catalogue ---------- */
  const SPMOD = {}; try { for (const m in ABO_SPMAP) (ABO_SPMAP[m] || []).forEach(sp => SPMOD[sp] = m); } catch (e) { }
  const spOK = (sp, i) => { try { if (SPMOD[sp] && typeof aboOK === "function" && !aboOK(SPMOD[sp])) return false; if (typeof aboSpIdxOK === "function" && !aboSpIdxOK(sp, i)) return false; } catch (e) { } return true; };
  const clean = s => String(s || "").replace(/^[^\wÀ-ÿ0-9]+\s*/, "").trim();
  const ADMIN_SP = /^(adm|studio|vente|lic)/;
  function pages() { const out = [], seen = new Set();
    if (typeof SPACES !== "undefined") for (const sp in SPACES) { const S0 = SPACES[sp]; if (!S0 || !S0.tabs) continue; if (!isAdmin() && ADMIN_SP.test(sp)) continue;
      S0.tabs.forEach((t, i) => { let lib = clean(t[1] || (typeof cnsLabel === "function" ? cnsLabel(t[0]) : "") || S0.lib); const k = sp + ":" + lib; if (seen.has(k)) return; seen.add(k);
        out.push({ g: "Pages", ic: "📄", lib, sub: clean(S0.lib), ok: spOK(sp, i), run: () => spGo(sp, i), key: "sp:" + sp + ":" + i }); }); }
    const extra = [["dossiers", "Dossiers", "🗂"], ["dashboard", "Tableau de bord", "🏠"], ["params", "Paramètres de la société", "⚙️"], ["idees", "Proposer une amélioration", "💡"], ["mobApp", "Installer l'application", "📱"], ["abonnement", isAdmin() ? "Offres et tarifs" : "Mon abonnement", "💳"]];
    if (isAdmin()) extra.push(["licences", "Clients et accès", "🔑"], ["admin", "Administration", "🛡"], ["studio", "Studio créateur", "🎨"], ["venteAdm", "Paramètres de vente", "🧾"]);
    extra.forEach(([v, l, ic]) => { if (typeof VIEWS === "undefined" || !VIEWS[v]) return; out.unshift({ g: "Pages", ic, lib: l, sub: "", ok: true, run: () => go(v), key: "v:" + v }); });
    return out; }
  function societes() { return ((window.INDEX && INDEX.dossiers) || []).filter(d => !d.demo).map(d => ({ g: "Sociétés", ic: "🏢", lib: d.nom || "Société", sub: S && S.id === d.id ? "ouverte" : "ouvrir", ok: true, key: "d:" + d.id,
    run: () => { if (S && S.id === d.id) { go("dashboard"); return; } fire("openDossier", { id: d.id }); } })); }
  function actions() { const A = [];
    A.push({ g: "Actions", ic: "✨", lib: "Quoi de neuf ?", run: news, key: "a:news" });
    A.push({ g: "Actions", ic: "⌨️", lib: "Raccourcis clavier", sub: "?", run: keys, key: "a:keys" });
    A.push({ g: "Actions", ic: "🔍", lib: "Agrandir l'affichage", sub: "Ctrl +", run: () => zoomBy(1), key: "a:z+" });
    A.push({ g: "Actions", ic: "🔎", lib: "Réduire l'affichage", sub: "Ctrl −", run: () => zoomBy(-1), key: "a:z-" });
    A.push({ g: "Actions", ic: "↺", lib: "Taille d'affichage normale", run: () => setZoom(1), key: "a:z0" });
    if (window.SC_ACCT_LOGOUT) { A.push({ g: "Actions", ic: "↪", lib: "Se déconnecter", run: () => SC_ACCT_LOGOUT(false), key: "a:out" }); }
    return A; }
  function fire(act, data) { const b = document.createElement("button"); b.dataset.act = act; Object.assign(b.dataset, data || {}); b.style.display = "none"; (document.getElementById("app") || document.body).appendChild(b); b.click(); b.remove(); }

  /* récents */
  const REC = "sc:recent";
  function remember(it) { if (!it || !it.key || /^a:/.test(it.key)) return; const r = LSG(REC, []).filter(x => x.key !== it.key); r.unshift({ key: it.key, lib: it.lib, sub: it.sub || "", ic: it.ic }); LSS(REC, r.slice(0, 6)); }

  /* ---------- recherche floue ---------- */
  function score(q, it) { const t = norm(it.lib), s = norm(it.sub || ""); if (!q) return 1; if (t.startsWith(q)) return 100 - t.length / 100; const w = t.indexOf(" " + q); if (w >= 0) return 80; const i = t.indexOf(q); if (i >= 0) return 60;
    if (s.includes(q)) return 30; let j = 0; for (const c of t) if (c === q[j]) j++; return j === q.length ? 10 : 0; }
  function hi(lib, q) { if (!q) return esc(lib); const n = norm(lib), i = n.indexOf(q); if (i < 0) return esc(lib); return esc(lib.slice(0, i)) + "<mark>" + esc(lib.slice(i, i + q.length)) + "</mark>" + esc(lib.slice(i + q.length)); }

  let P = null;
  function palette(init) { if (P) return; const all = () => societes().concat(pages(), actions());
    const bg = document.createElement("div"); bg.className = "pk-bg"; bg.innerHTML = `<div class="pk" role="dialog" aria-label="Recherche rapide"><div class="pk-in"><span style="font-size:18px">🔍</span><input id="pkQ" placeholder="Aller à une page, une société, une action…" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div><div class="pk-ls" id="pkL"></div>
      <div class="pk-ft"><span><kbd>↑</kbd> <kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>${KB}</kbd> ouvrir / fermer</span></div></div>`;
    document.body.appendChild(bg); P = { bg, sel: 0, list: [] }; const inp = bg.querySelector("#pkQ"); inp.value = init || "";
    const draw = () => { const q = norm(inp.value.trim()); let L;
      if (!q) { const rec = LSG(REC, []); const by = {}; all().forEach(x => by[x.key] = x); const R = rec.map(r => by[r.key]).filter(Boolean).map(x => Object.assign({}, x, { g: "Récents" }));
        L = R.concat(societes().slice(0, 6), actions().slice(0, 2), pages().filter(x => x.ok).slice(0, 8)); }
      else L = all().map(x => [score(q, x) - (x.ok === false ? 5 : 0), x]).filter(a => a[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 40).map(a => a[1]);
      if (q && inp.value.trim().length > 1) L.push({ g: "Rechercher dans les données", ic: "🗂", lib: "Rechercher « " + inp.value.trim() + " » dans les factures, écritures, comptes…", key: "a:q", run: () => { const s = document.querySelector(".srch input"); if (s) { s.focus(); s.value = inp.value.trim(); s.dispatchEvent(new Event("input", { bubbles: true })); } } });
      P.list = L; P.sel = Math.min(P.sel, Math.max(0, L.length - 1)); let g = "", h = "";
      L.forEach((x, i) => { if (x.g !== g) { g = x.g; h += `<div class="pk-g">${esc(g)}</div>`; } h += `<div class="pk-it ${i === P.sel ? "on" : ""}" data-i="${i}"><i>${x.ic || "•"}</i><span>${hi(x.lib, q)}${x.ok === false ? '<span class="lk">🔒</span>' : ""}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</div>`; });
      const ls = bg.querySelector("#pkL"); ls.innerHTML = h || `<div class="pk-no">Aucun résultat pour « ${esc(inp.value)} »</div>`; const on = ls.querySelector(".pk-it.on"); if (on) on.scrollIntoView({ block: "nearest" }); };
    const run = i => { const x = P.list[i]; if (!x) return; closeP(); remember(x); try { x.run(); } catch (e) { console.warn(e); } };
    inp.addEventListener("input", () => { P.sel = 0; draw(); });
    inp.addEventListener("keydown", e => { if (e.key === "ArrowDown") { e.preventDefault(); P.sel = Math.min(P.sel + 1, P.list.length - 1); draw(); } else if (e.key === "ArrowUp") { e.preventDefault(); P.sel = Math.max(P.sel - 1, 0); draw(); } else if (e.key === "Enter") { e.preventDefault(); run(P.sel); } else if (e.key === "Escape") { e.preventDefault(); closeP(); } });
    bg.addEventListener("mousemove", e => { const it = e.target.closest(".pk-it"); if (it && +it.dataset.i !== P.sel) { P.sel = +it.dataset.i; bg.querySelectorAll(".pk-it").forEach(n => n.classList.toggle("on", +n.dataset.i === P.sel)); } });
    bg.addEventListener("click", e => { const it = e.target.closest(".pk-it"); if (it) run(+it.dataset.i); else if (!e.target.closest(".pk")) closeP(); });
    draw(); inp.focus(); setTimeout(() => inp.focus(), 0); }
  function closeP() { if (P) { P.bg.remove(); P = null; } }
  window.SC_PALETTE = palette;

  /* ---------- fenêtres : raccourcis, nouveautés ---------- */
  function sheet(title, body) { closeP(); const bg = document.createElement("div"); bg.className = "pk-bg"; bg.innerHTML = `<div class="pk" style="max-width:560px"><div class="pk-in" style="justify-content:space-between"><b style="font-size:17px;color:#0F3D3E">${title}</b><button class="btn sm" data-x>Fermer</button></div><div class="pk-ls" style="padding:6px 18px 16px">${body}</div></div>`;
    document.body.appendChild(bg); const x = () => { bg.remove(); document.removeEventListener("keydown", k, true); }; const k = e => { if (e.key === "Escape") { e.preventDefault(); x(); } };
    bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-x]")) x(); }); document.addEventListener("keydown", k, true); }
  function keys() { const r = [[KB + " ou /", "Recherche rapide : pages, sociétés, actions"], ["?", "Afficher cette aide"], ["Échap", "Fermer une fenêtre ou un menu"], [(isMac ? "⌘" : "Ctrl") + " +  /  −  /  0", "Agrandir, réduire ou rétablir l'affichage"],
      ["Alt ←  /  Alt →", "Écran précédent / suivant"], [(isMac ? "⌘" : "Ctrl") + " Entrée", "Valider l'écriture (saisie guidée)"], [(isMac ? "⌘" : "Ctrl") + " Q", "Joindre une pièce (saisie des écritures)"], [(isMac ? "⌘" : "Ctrl") + " M", "Commentaire sur une ligne (saisie des écritures)"], ["↑ ↓ ← →", "Se déplacer dans la balance"]];
    sheet("⌨️ Raccourcis clavier", `<table class="kb-t">${r.map(([a, b]) => `<tr><td>${b}</td><td>${a.split("  ").map(z => z.trim() === "/" ? " ou " : `<kbd>${esc(z.trim())}</kbd>`).join(" ")}</td></tr>`).join("")}</table>`); }
  const NEWS_V = 7;
  const NEWS = [
    ["⚡", "Recherche rapide " + KB, "Tapez quelques lettres pour aller à n'importe quelle page, changer de société ou lancer une action, sans la souris."],
    ["👤", "Menu du compte", "Cliquez sur votre nom : mot de passe, déconnexion, déconnexion de tous les appareils, déconnexion automatique."],
    ["🔑", "Accès clients par e-mail + code", "Créez l'accès et la société du client en un seul formulaire ; il se connecte avec son e-mail et son code."],
    ["🏷", "Offres et tarifs à l'accueil", "Vos offres s'affichent sur l'écran de connexion, reprises automatiquement de vos paramètres de vente."],
    ["🔍", "Audit complet", "Comptabilité, RH, fiscal, juridique, contrôle interne et SI : programmes, échantillonnage, confirmations, opinion."],
    ["🧾", "ECF et Conseil commercial", "Examen de conformité fiscale avec modèles, et plan d'actions commercial avec projections."],
    ["🔠", "Taille d'affichage", "Agrandissez ou réduisez l'écran (Ctrl + / Ctrl −), le réglage est mémorisé."]];
  function news() { LSS("sc:newsSeen", NEWS_V); const p = document.querySelector(".nw-pill"); if (p) p.remove();
    sheet("✨ Quoi de neuf dans SpeedCompta", NEWS.map(([i, t, d]) => `<div class="nw-it"><i>${i}</i><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")); }
  window.SC_NEWS = news; window.SC_KEYS = keys;

  /* ---------- taille d'affichage ---------- */
  const Z = [0.9, 1, 1.1, 1.25];
  function setZoom(z) { z = Math.max(0.9, Math.min(1.25, z)); LSS("sc:zoom", z); document.documentElement.style.zoom = z === 1 ? "" : String(z); if (z !== 1) toast("Affichage : " + Math.round(z * 100) + " %"); }
  function zoomBy(d) { const z = LSG("sc:zoom", 1); let i = Z.findIndex(x => Math.abs(x - z) < .01); if (i < 0) i = 1; setZoom(Z[Math.max(0, Math.min(Z.length - 1, i + d))]); }
  { const z = LSG("sc:zoom", 1); if (z !== 1) document.documentElement.style.zoom = String(z); }

  /* ---------- clavier global ---------- */
  const typing = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  document.addEventListener("keydown", e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && !e.altKey && (e.key === "k" || e.key === "K")) { e.preventDefault(); P ? closeP() : palette(); return; }
    if (P) return;
    if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); zoomBy(1); return; }
    if (mod && (e.key === "-" || e.key === "_")) { e.preventDefault(); zoomBy(-1); return; }
    if (mod && e.key === "0") { e.preventDefault(); setZoom(1); return; }
    if (typing(e.target) || mod || e.altKey && !/Arrow/.test(e.key)) return;
    if (UI.modal || document.querySelector(".pk-bg,#acPop")) return;
    if (e.key === "/" ) { e.preventDefault(); palette(); }
    else if (e.key === "?") { e.preventDefault(); keys(); }
    else if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); hist(-1); }
    else if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); hist(1); }
  }, true);

  /* ---------- affichage : bouton de recherche, titre d'onglet, transition, récents ---------- */
  const viewLib = () => { try { const sp = curSpace(); if (sp && SPACES[sp]) { const i = (UI.spTab || {})[sp] ?? 0; const t = SPACES[sp].tabs[i]; if (t && (t[0] === UI.view || (t[4] || []).includes(UI.view))) return clean(t[1] || SPACES[sp].lib); return clean(SPACES[sp].lib); } } catch (e) { }
    const m = { dossiers: "Dossiers", dashboard: "Tableau de bord", params: "Paramètres", licences: "Clients et accès", admin: "Administration", studio: "Studio créateur", abonnement: "Abonnement", idees: "Propositions d'amélioration", mobApp: "Application" }; return m[UI.view] || ""; };
  let lastV = null; const H = { list: [], i: -1, moving: false };
  function hist(d) { const j = H.i + d; const x = H.list[j]; if (!x) { toast(d < 0 ? "Pas d'écran précédent." : "Pas d'écran suivant."); return; } if (S && x.sid !== S.id) { toast("Écran d'une autre société."); return; }
    H.i = j; H.moving = true; UI.spTab = Object.assign(UI.spTab || {}, x.sp); go(x.v); }
  const _rn = renderNow;
  renderNow = function () { const r = _rn.apply(this, arguments);
    try { const h = document.querySelector(".hdr-r"); if (h && !h.querySelector(".pk-hint")) { const b = document.createElement("button"); b.className = "pk-hint"; b.type = "button"; b.title = "Recherche rapide"; b.innerHTML = `⚡ Aller à… <kbd>${KB}</kbd>`; b.onclick = () => palette(); h.insertBefore(b, h.firstChild); } } catch (e) { }
    try { const nm = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const vl = viewLib(); document.title = [vl, S && S.nom, nm].filter(Boolean).join(" · "); } catch (e) { }
    try { const k = UI.view + "|" + (S && S.id); if (lastV !== null && k !== lastV) { const m = document.querySelector("#app .main, #app main"); if (m) { m.classList.remove("pv-in"); void m.offsetWidth; m.classList.add("pv-in"); } const vl = viewLib(); if (vl && UI.view !== "dashboard") remember({ key: "v:" + UI.view + ":" + vl, lib: vl, ic: "🕘", sub: S && S.nom }); } lastV = k;
      if (k !== (H.list[H.i] || {}).k) { if (H.moving) H.moving = false; else { H.list = H.list.slice(0, H.i + 1); H.list.push({ k, v: UI.view, sid: S && S.id, sp: Object.assign({}, UI.spTab || {}) }); if (H.list.length > 40) H.list.shift(); H.i = H.list.length - 1; } } else H.moving = false; } catch (e) { }
    return r; };
  /* les récents mémorisés depuis l'affichage rouvrent la vue */
  const _all = pages; pages = function () { const L = _all(); LSG(REC, []).forEach(r => { if (/^v:/.test(r.key) && !L.some(x => x.key === r.key)) { const v = r.key.split(":")[1]; L.push({ g: "Pages", ic: "🕘", lib: r.lib, sub: r.sub, ok: true, key: r.key, run: () => go(v) }); } }); return L; };

  /* haut de page */
  const tt = document.createElement("button"); tt.className = "tt-top"; tt.type = "button"; tt.setAttribute("aria-label", "Revenir en haut"); tt.textContent = "↑"; document.body.appendChild(tt);
  const sc = () => { const y = window.scrollY || document.documentElement.scrollTop; tt.classList.toggle("on", y > 700); };
  window.addEventListener("scroll", sc, { passive: true }); tt.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* hors connexion */
  function net(on) { let b = document.getElementById("offBar"); if (on) { if (b) { b.className = "off-bar ok"; b.textContent = "Connexion rétablie ✓"; setTimeout(() => b && b.remove(), 2500); } return; }
    if (!b) { b = document.createElement("div"); b.id = "offBar"; document.body.appendChild(b); } b.className = "off-bar"; b.textContent = "Hors connexion : gardez la page ouverte, vos dernières modifications seront enregistrées au retour du réseau."; }
  window.addEventListener("offline", () => net(false)); window.addEventListener("online", () => { net(true); try { if (Store.flush) Store.flush(); } catch (e) { } });

  /* pastille « Nouveautés » après une mise à jour (pas à la toute première utilisation) */
  (function w() { if (!window.__SC_READY) return setTimeout(w, 700); const seen = LSG("sc:newsSeen", null);
    if (seen === null) { LSS("sc:newsSeen", NEWS_V); return; } if (seen >= NEWS_V) return;
    setTimeout(() => { if (document.querySelector(".nw-pill")) return; const b = document.createElement("button"); b.className = "nw-pill"; b.innerHTML = `✨ <span><b>Nouveautés</b> dans SpeedCompta</span><span class="x" data-x>✕</span>`; document.body.appendChild(b);
      b.onclick = e => { if (e.target.closest("[data-x]")) { LSS("sc:newsSeen", NEWS_V); b.remove(); return; } news(); }; }, 1800); })();

  /* menu du compte : entrées recherche, nouveautés, raccourcis, taille */
  new MutationObserver(() => { const p = document.getElementById("acPop"); if (!p || p.dataset.pro) return; p.dataset.pro = "1";
    const first = p.querySelector(".ac-it"); if (!first) return; const add = (ic, lib, sm, fn) => { const b = document.createElement("button"); b.className = "ac-it"; b.innerHTML = `<i>${ic}</i>${lib}${sm ? `<small>${sm}</small>` : ""}`; b.onclick = () => { p.remove(); fn(); }; return b; };
    const sep = document.createElement("div"); sep.className = "ac-sep";
    const anchor = p.querySelector("[data-ac=pwd]"); const frag = [add("⚡", "Recherche rapide", KB, () => palette()), add("✨", "Quoi de neuf ?", "", news), add("⌨️", "Raccourcis clavier", "?", keys),
      (() => { const d = document.createElement("div"); d.className = "ac-it"; d.style.cursor = "default"; d.innerHTML = `<i>🔠</i>Taille d'affichage<span style="margin-left:auto;display:flex;gap:4px"><button class="btn sm" data-z="-1" aria-label="Réduire">A−</button><button class="btn sm" data-z="0">${Math.round(LSG("sc:zoom", 1) * 100)} %</button><button class="btn sm" data-z="1" aria-label="Agrandir">A+</button></span>`;
        d.addEventListener("click", ev => { const z = ev.target.closest("[data-z]"); if (!z) return; ev.stopPropagation(); +z.dataset.z ? zoomBy(+z.dataset.z) : setZoom(1); d.querySelector('[data-z="0"]').textContent = Math.round(LSG("sc:zoom", 1) * 100) + " %"; }); return d; })()];
    if (anchor) { const s0 = anchor.previousElementSibling; frag.forEach(n => p.insertBefore(n, s0 && s0.classList.contains("ac-sep") ? s0 : anchor)); }
    else { p.appendChild(sep); frag.forEach(n => p.appendChild(n)); }
  }).observe(document.body, { childList: true });
})();
