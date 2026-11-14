/* ============================================================
   Conseil › Finance : un seul onglet par sujet
   - « Business plan » regroupe le business plan rapide (depuis les comptes)
     et le dossier prévisionnel complet (projet, banque) ;
   - « Évaluation d'entreprise » regroupe le calcul de la valeur et le rapport d'évaluation.
   Un sélecteur en haut de page passe de l'un à l'autre ; le dernier choix est retenu.
   ============================================================ */
const FMX = [{ k: "bp", tab: "finBP", lib: "Business plan", opts: [["finBP", "📊 Business plan rapide", "Construit à partir de vos comptes, en quelques minutes"], ["finPrev", "📘 Dossier prévisionnel complet", "Projet, investissements, emprunts, personnel, trésorerie mensuelle, dossier pour la banque"]] },
  { k: "ev", tab: "finEval", lib: "Évaluation d'entreprise", opts: [["finEval", "🧮 Calcul de la valeur", "Méthodes, multiples et fourchette de valeur"], ["rdxEval", "📘 Rapport d'évaluation", "Rapport rédigé par secteur et contexte, prêt à remettre"]] }];
function fmxLast(k) { try { return localStorage.getItem("sc_fmx_" + k) || ""; } catch (e) { return ""; } }
function fmxSet(k, v) { try { localStorage.setItem("sc_fmx_" + k, v); } catch (e) { } }
function fmxSwitch(G, cur) { return `<div class="fmx">${G.opts.map(([v, l, d]) => `<button class="fmx-b ${cur === v ? "on" : ""}" data-act="fmxGo" data-g="${G.k}" data-v="${v}"><b>${l}</b><small>${d}</small></button>`).join("")}</div>`; }
(function () {
  /* onglets : les vues secondaires deviennent des alias de l'onglet principal */
  try { const T = SPACES.fin && SPACES.fin.tabs; if (T) { FMX.forEach(G => { const alt = G.opts.map(o => o[0]).filter(v => v !== G.tab); for (let i = T.length - 1; i >= 0; i--) if (alt.includes(T[i][0])) T.splice(i, 1); const t = T.find(x => x[0] === G.tab); if (t) { while (t.length < 4) t.push(undefined); t[1] = G.lib; t[4] = [...new Set((t[4] || []).concat(alt))]; } }); } } catch (e) { logErr("onglets finance", e); }
  /* menu latéral : plus d'entrée séparée pour les vues regroupées */
  try { const n = NAV2.find(x => x[0] === "finance"); if (n) { const hide = new Set(["finPrev", "rdxEval"]); const d = Object.getOwnPropertyDescriptor(n, 3); if (d && d.get) { const g = d.get; Object.defineProperty(n, 3, { get() { return (g() || []).filter(x => !hide.has(x[0])); }, enumerable: true, configurable: true }); } else if (Array.isArray(n[3])) n[3] = n[3].filter(x => !hide.has(x[0])); } } catch (e) { logErr("menu finance", e); }
  /* vues : sélecteur en tête, retour au dernier choix depuis l'onglet */
  FMX.forEach(G => G.opts.forEach(([v]) => { const _v = VIEWS[v]; if (typeof _v !== "function") return; VIEWS[v] = function () {
    if (v === G.tab && !UI.fmxExplicit) { const last = fmxLast(G.k); if (last && last !== v && typeof VIEWS[last] === "function" && G.opts.some(o => o[0] === last)) { UI.view = last; return VIEWS[last](); } }
    UI.fmxExplicit = false; fmxSet(G.k, v);
    let h = _v.apply(this, arguments); if (v === "finBP") h = h.replace(/<div class="banner"[^>]*><span>📘 Besoin d'un dossier bancaire complet[\s\S]*?<\/div>/, "");
    return fmxSwitch(G, v) + h; }; }));
})();
(function () { const _cs = curSpace; curSpace = function () { const r = _cs.apply(this, arguments); if (r) return r; if (FMX.some(G => G.opts.some(o => o[0] === UI.view))) return "fin"; return r; }; })();
Object.assign(F2ACT, { fmxGo: el => { UI.fmxExplicit = true; fmxSet(el.dataset.g, el.dataset.v); go(el.dataset.v); } });
(function () { const st = document.createElement("style"); st.textContent = `.fmx{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 14px;padding:5px;background:#EEF4F3;border-radius:14px;border:1px solid #DCE8E6}.fmx-b{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;border:0;border-radius:10px;padding:9px 14px;background:transparent;cursor:pointer;color:#3E5352;font:inherit;transition:background .15s,box-shadow .15s}.fmx-b b{font-size:14px;color:#1E3B3B}.fmx-b small{font-size:12px;color:#6B7F7E}.fmx-b:hover{background:rgba(255,255,255,.6)}.fmx-b.on{background:#fff;box-shadow:0 2px 10px rgba(15,61,62,.1)}.fmx-b.on b{color:#0F3D3E}@media(max-width:640px){.fmx{grid-template-columns:1fr}}`; document.head.appendChild(st); })();
