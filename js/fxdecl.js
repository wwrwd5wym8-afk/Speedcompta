/* ============================================================
   Fiscalité › Déclarations fiscales : modèles impôts en copie intégrale
   (liasses 2065 / 2050-2059 / 2033 / 2031 / 2035 / 2072, 2069-RCI, F-IDENTIF, TVA CA3,
   relevé de solde 2572, DAS2, compte rendu ECF), pré-remplis depuis la comptabilité,
   modifiables case par case, contrôles de cohérence, formulaires cochés / décochés,
   validation, impression PDF identique, préparation de l'envoi EDI, import de nouveaux modèles.
   Deux présentations : « Modèle impôt » (identique à l'imprimé) et « Modèle Speedix ».
   Les gabarits (paquets fxt_*.js) sont chargés à la demande.
   ============================================================ */
const FXT = {}; const FXT_PACKS = {};
function FXT_REG(pack, forms) { Object.assign(FXT, forms); FXT_PACKS[pack] = 1; }
const FD_PACK_OF = {};
[["is", "2065 2065B 2050 2051 2052 2053 2054 2054B 2055 2056 2057 2058A 2058AD 2058B 2058C 2059A 2059B 2059C 2059D 2059E 2059F 2059G 2069RCI FIDENTIF CA17 CA18 CA20 CA21 CALC219"],
 ["bnc", "2035 2035A 2035B 2035BD 2035E 2035F 2035G 2069RCI_B FIDENTIF_B"], ["sci", "2072 2072AN1 2072AN2 2072E 2069RCI_S FIDENTIF_S"], ["dec", "CA3 TIDENTIF 2572 PIDENTIF DAS2"]]
  .forEach(([p, l]) => l.split(" ").forEach(id => { FD_PACK_OF[id] = p; }));
const FD_MISSING = { "2031": "2031-SD · Bénéfices industriels et commerciaux", "2033A": "2033-A-SD · Bilan simplifié", "2033B": "2033-B-SD · Compte de résultat simplifié", "2033C": "2033-C-SD · Immobilisations, amortissements, plus-values", "2033D": "2033-D-SD · Provisions, amortissements dérogatoires, déficits", "2033E": "2033-E-SD · Effectifs et valeur ajoutée", "2033F": "2033-F-SD · Composition du capital", "2033G": "2033-G-SD · Filiales et participations", "CA12": "3517-S-SD · TVA régime simplifié (CA12)" };
const FD_L2050 = ["2050", "2051", "2052", "2053", "2054", "2054B", "2055", "2056", "2057", "2058A", "2058B", "2058C"];
const FD_L2059 = ["2059A", "2059B", "2059C", "2059D", "2059E", "2059F", "2059G"];
const FD_L2033 = ["2033A", "2033B", "2033C", "2033D", "2033E", "2033F", "2033G"];
const FD_TREE = {
  IS_RN: [["Déclaration", ["2065", "2065B"]], ["Liasse fiscale", FD_L2050.concat(FD_L2059)], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "2058AD", "CA17", "CA18", "CA20", "CA21", "CALC219"]]],
  IS_RS: [["Déclaration", ["2065", "2065B"]], ["Liasse fiscale", FD_L2033], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "CA17", "CA18", "CA20", "CA21", "CALC219"]]],
  BIC_RN: [["Déclaration", ["2031"]], ["Liasse fiscale", FD_L2050.concat(FD_L2059)], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "2058AD", "CA17", "CA18", "CA20", "CA21"]]],
  BIC_RS: [["Déclaration", ["2031"]], ["Liasse fiscale", FD_L2033], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF"]]],
  BNC: [["Déclaration", ["2035"]], ["Annexes", ["2035A", "2035B", "2035BD", "2035E", "2035F", "2035G"]], ["Crédits d'impôts", ["2069RCI_B"]], ["Identification", ["FIDENTIF_B"]]],
  SCI_IR: [["Déclaration", ["2072"]], ["Annexes", ["2072AN1", "2072AN2", "2072E"]], ["Crédits d'impôts", ["2069RCI_S"]], ["Identification", ["FIDENTIF_S"]]]
};
const FD_REG_LIB = { IS_RN: "Société à l'IS · réel normal (SARL, SAS, SA, SCI à l'IS)", IS_RS: "Société à l'IS · réel simplifié", BIC_RN: "BIC à l'IR · réel normal (EI, EURL, SNC)", BIC_RS: "BIC à l'IR · réel simplifié", BNC: "Professions libérales · BNC déclaration contrôlée", SCI_IR: "SCI à l'IR · revenus fonciers (2072)" };
const FD_TABS = [["liasse", "📑 Liasse et IS"], ["tva", "🧾 TVA"], ["s2572", "💶 Solde d'IS 2572"], ["das2", "🤝 DAS2"], ["ecf", "✅ ECF"], ["edi", "📡 Envoi EDI"], ["cfg", "⚙ Paramètres"]];
const FD_DEF = { zoom: 1.5, hl: true, hlColor: "#FFF3C4", focusColor: "#DCEBFF", valColor: "#0B1F5C", font: "", autoCoh: true, cohOnSave: true, autoGed: "ask", ediAuto: false, tolerance: 1, map: {}, coh: [], models: {}, showEmpty: true };
function fdCfg() { return Object.assign({}, FD_DEF, psRoot().fd || {}, S && S.fdCfg && S.fdCfg.on ? S.fdCfg.v || {} : {}); }
function fdCfgW() { if (S.fdCfg && S.fdCfg.on) { S.fdCfg.v ||= {}; return S.fdCfg.v; } const R = psRootW(); return R.fd ||= {}; }
function fdCfgSave() { if (S.fdCfg && S.fdCfg.on) Store.touch(); else if (typeof psAuto === "function") psAuto("fd", "Déclarations fiscales"); }
const fdSt = () => UI.sub.fd ||= { tab: "liasse", mode: "impot", form: null };
function fdReg() { const st = fdSt(); if (st.reg && FD_TREE[st.reg]) return st.reg; if (S.fdReg && FD_TREE[S.fdReg]) return S.fdReg; let d = typeof defaultLiasse === "function" ? defaultLiasse() : "IS_RS"; if (d === "SCI_IS") d = S.regimeIS === "RN" ? "IS_RN" : "IS_RS"; return FD_TREE[d] ? d : "IS_RN"; }
/* ---------- modèles : intégrés + importés ---------- */
function fdModels() { return fdCfg().models || {}; }
function fdForm(id) { const M = fdModels()[id]; if (M && M.p && M.p.length) return M; return FXT[id] || null; }
function fdTitle(id) { const M = fdModels()[id]; if (M && M.t) return M.t; if (FXT[id]) return FXT[id].t; if (FD_MISSING[id]) return FD_MISSING[id]; return id; }
function fdTree(reg) { const T = (FD_TREE[reg] || []).map(([g, L]) => [g, L.slice()]); const M = fdModels();
  Object.entries(M).forEach(([id, m]) => { if (!(m.reg || []).includes(reg)) return; if (T.some(([, L]) => L.includes(id))) return; let g = T.find(x => x[0] === (m.grp || "Annexes")); if (!g) { g = [m.grp || "Annexes", []]; T.push(g); } g[1].push(id); });
  return T; }
async function fdEnsure(ids) { const need = [...new Set(ids.filter(id => !fdModels()[id] && FD_PACK_OF[id] && !FXT_PACKS[FD_PACK_OF[id]]).map(id => FD_PACK_OF[id]))];
  for (const p of need) { try { await loadScript("js/fxt_" + p + ".js"); } catch (e) { UI.fdErr = "Modèles impôts indisponibles (" + p + ") : " + e.message; } }
  return need.length; }
/* ---------- instance de déclaration ---------- */
function fdInstKey() { const st = fdSt(); const ex = exCur(); if (st.tab === "tva") return "TVA:" + (st.per || (fdPers()[0] || {}).id); if (st.tab === "s2572") return "2572:" + ex.id; if (st.tab === "das2") return "DAS2:" + fdDasY(); if (st.tab === "ecf") return "ECF:" + ex.id; return "LIA:" + ex.id + ":" + fdReg(); }
function fdInst(k) { const D = S.fxd ||= {}; const I = D[k || fdInstKey()] ||= { v: {}, off: {}, hist: [] }; I.v ||= {}; I.off ||= {}; I.hist ||= []; return I; }
const fdPers = () => { try { return periodesTVA(exCur()); } catch (e) { return []; } };
const fdDasY = () => { const st = fdSt(); return st.y || (typeof f2Year === "function" ? f2Year() : exCur().fin.slice(0, 4)); };
function fdFormsOfTab() { const st = fdSt(); if (st.tab === "tva") { const p = fdPers().find(x => x.id === st.per) || fdPers()[0]; return [["Déclaration", [p && p.type === "CA12" ? "CA12" : "CA3"]], ["Paiement", ["TIDENTIF"]]]; }
  if (st.tab === "s2572") return [["Déclaration", ["2572"]], ["Paiement", ["PIDENTIF"]]]; if (st.tab === "das2") return [["Déclaration", ["DAS2"]]]; if (st.tab === "ecf") return [["Compte rendu", ["ECF"]]];
  return fdTree(fdReg()); }
function fdLog(I, act) { I.hist.unshift({ at: new Date().toISOString(), by: typeof xsMe === "function" ? xsMe() : "moi", act }); I.hist.length = Math.min(I.hist.length, 200); }
/* ---------- calcul des valeurs (liées à la comptabilité) ---------- */
const FD_FC = new Map();
function fdCompile(expr, names) { const k = names.join(",") + "§" + expr; let f = FD_FC.get(k); if (!f) { f = new Function(...names, '"use strict"; return (' + expr + ");"); FD_FC.set(k, f); } return f; }
function fdCtx() {
  if (UI._fdCtx && UI._fdCtx.k === fdInstKey() + "|" + E.length && Date.now() - UI._fdCtx.t < 4000) return UI._fdCtx;
  const st = fdSt(); const ex = exCur(); const reg = fdReg(); const ir = /^BIC|^BNC/.test(reg);
  let L = {}, base = {}; try { base = liasseCtx(ex, ir); L = liasseValues(ex, ir); } catch (e) { console.warn(e); }
  let isr = {}; try { isr = calcIS(ex); } catch (e) { }
  let per = null, tva = null; if (st.tab === "tva") { per = fdPers().find(x => x.id === st.per) || fdPers()[0]; try { tva = per ? calcTVA(per.from, per.to) : null; } catch (e) { } }
  let das = []; if (st.tab === "das2") { try { das = f2Das(fdDasY()).filter(g => g.incl); } catch (e) { } }
  const Fc = (() => { try { return cfgFiscal(); } catch (e) { return { isNormal: 25, isReduit: 15 }; } })();
  const C = { k: fdInstKey() + "|" + E.length, t: Date.now(), ex, reg, ir, base, L, isr, per, tva, das, Fc };
  C.names = Object.keys(base).filter(n => n !== "VALS").concat(["F", "L", "ISR", "TVA", "PER", "DAS", "EX", "S", "BASE_N", "BASE_R", "TXT", "DATE", "PCT"]);
  UI._fdCtx = C; return C;
}
const fdDate = d => d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "";
function fdEval(expr, C, Fget) {
  const txt = /^T:/.test(expr); const e = txt ? expr.slice(2) : expr;
  if (!txt && /^-?\d+([.,]\d+)?$/.test(e.trim())) return Math.round(parseFloat(e.replace(",", ".")) * 100);
  const b = C.base; const vals = C.names.map(n => n === "F" ? Fget : n === "L" ? (k => C.L[k] ?? 0) : n === "ISR" ? (k => C.isr[k] ?? 0) : n === "TVA" ? (k => { const t = C.tva || {}; if (/^c\d+$/.test(k)) return ((t.coll || {})[k.slice(1)] || {}).tva || 0; if (/^b\d+$/.test(k)) return ((t.coll || {})[k.slice(1)] || {}).base || 0; return t[k] ?? 0; }) : n === "PER" ? C.per || {} : n === "DAS" ? C.das : n === "EX" ? C.ex : n === "S" ? S
    : n === "BASE_N" ? Math.round((C.isr.isNormal || 0) * 100 / (C.Fc.isNormal || 25)) : n === "BASE_R" ? Math.round((C.isr.isReduit || 0) * 100 / (C.Fc.isReduit || 15)) : n === "TXT" ? (v => v == null ? "" : String(v)) : n === "DATE" ? fdDate : n === "PCT" ? (v => v + " %") : b[n]);
  try { const v = fdCompile(e, C.names)(...vals); if (txt) return v == null ? "" : String(v); if (typeof v === "boolean") return v; return v == null || isNaN(v) ? null : Math.round(v); } catch (err) { return { err: err.message }; }
}
function fdFields(id) { const f = fdForm(id); if (!f) return []; const out = []; f.p.forEach((p, pi) => p.F.forEach(x => out.push(Object.assign({ pg: pi }, x)))); return out; }
function fdAuto(id, f, C) { /* correspondances par défaut (codes de la liasse, identification) */
  const k = id + "|" + f.i; const m = (typeof FD_MAP !== "undefined" && FD_MAP[k]); if (m) return m;
  if (typeof FD_MAPF === "function") { const r = FD_MAPF(id, f, C); if (r) return r; }
  const L = C.L; const base = id.replace(/_[BS]$/, "");
  if (L[base + "|" + f.i] != null) return "L('" + base + "|" + f.i + "')";
  const mm = /^([A-Z0-9]{2})\.(\d)$/.exec(f.i); if (mm && L[base + "|" + mm[1] + "|c" + mm[2]] != null) return "L('" + base + "|" + mm[1] + "|c" + mm[2] + "')";
  return null;
}
function fdValues(id, I, C) { /* valeurs affichées : saisie > calcul */
  const fields = fdFields(id); const cfg = fdCfg(); const cache = {}; const stack = new Set(); const byK = {}; fields.forEach(f => { byK[id + "|" + f.i] = f; });
  const get = k => { if (k in cache) return cache[k]; if (k in I.v) return cache[k] = I.v[k]; if (stack.has(k)) return 0; stack.add(k);
    const fid = k.split("|")[0]; const f = byK[k] || (fid !== id ? fdFields(fid).find(x => fid + "|" + x.i === k) : null); let v = null;
    if (f) { const expr = cfg.map[k] || fdAuto(fid, f, C); if (expr) { v = fdEval(expr, C, get); if (v && typeof v === "object") v = null; } }
    stack.delete(k); return cache[k] = v; };
  const out = {}; fields.forEach(f => { const k = id + "|" + f.i; out[k] = get(k); }); out._get = get; return out;
}
/* ---------- formats ---------- */
const fdIsNum = f => f.a !== "l" && f.k !== "x";
function fdFmt(v, f) { if (v == null || v === "") return ""; if (f && f.k === "x") return v ? "X" : ""; if (typeof v === "number") { const e = Math.round(v / 100); if (!e && f && f.i && !fdCfg().zeros) return ""; return e.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " "); } return String(v); }
function fdParse(s, f) { s = String(s || "").trim(); if (!s) return null; if (!fdIsNum(f)) return s; const n = s.replace(/[\s\u202f\u00a0€]/g, "").replace(",", "."); if (/^-?\d+(\.\d+)?$/.test(n)) return Math.round(parseFloat(n) * 100); return s; }
/* ---------- rendu SVG du gabarit (identique à l'imprimé) ---------- */
const FD_FAM = ["'Times New Roman',Tinos,'Liberation Serif',Times,serif", "", "", "", "'DejaVu Sans',Arial,sans-serif", "Arial,Helvetica,'Liberation Sans',sans-serif"];
const FD_W = [400, 700, 400, 700, 400, 400, 700, 400, 700], FD_I = [0, 0, 1, 1, 0, 0, 0, 1, 1];
const fdFam = i => i < 4 ? FD_FAM[0] : i === 4 ? FD_FAM[4] : FD_FAM[5];
const FD_SVGC = new WeakMap();
function fdSvg(p) { let s = FD_SVGC.get(p); if (s) return s; const o = [];
  if (p.bg) o.push(`<image x="0" y="0" width="${p.w}" height="${p.h}" href="${p.bg}" preserveAspectRatio="none"/>`);
  for (const r of p.R || []) o.push(`<rect x="${r[0]}" y="${r[1]}" width="${Math.max(r[2], 0.3)}" height="${Math.max(r[3], 0.3)}" fill="${r[4] || "none"}"${r[5] ? ` stroke="${r[5]}" stroke-width="${r[6]}"` : ""}/>`);
  for (const l of p.L || []) o.push(l[0] === "p" ? `<polyline points="${l[1].map(q => q.join(",")).join(" ")}" fill="${l[3] || "none"}" stroke="${l[2] || "none"}" stroke-width="${l[4]}"/>` : `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${l[4]}" stroke-width="${l[5]}"/>`);
  for (const im of p.I || []) o.push(`<image x="${im[0]}" y="${im[1]}" width="${im[2]}" height="${im[3]}" href="${im[4]}"/>`);
  for (const e of p.T || []) { const [x, y, sz, f, tx, wd] = e; const c = e[6] || "#000"; const tl = wd && tx.length > 2 ? ` textLength="${wd}" lengthAdjust="spacingAndGlyphs"` : "";
    if (e[7]) { const m = e[7]; o.push(`<text transform="matrix(${m[0]},${-m[1]},${-m[2]},${m[3]},${x},${y})" font-size="${sz}" font-family="${fdFam(f)}" font-weight="${FD_W[f]}" fill="${c}">${esc(tx)}</text>`); }
    else o.push(`<text x="${x}" y="${y}" font-size="${sz}" font-family="${fdFam(f)}" font-weight="${FD_W[f]}"${FD_I[f] ? ' font-style="italic"' : ""} fill="${c}"${tl}>${esc(tx)}</text>`); }
  s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%">${o.join("")}</svg>`; FD_SVGC.set(p, s); return s; }
function fdValSvg(p, id, vals, pfx) { /* valeurs dessinées (impression) */
  const cfg = fdCfg(); const o = [];
  for (const f of p.F) { const v = vals[id + "|" + f.i + (pfx || "")]; const t = fdFmt(v, f); if (!t) continue; const fs = Math.min(f.s || 8.2, Math.max(5, f.h - 1.5));
    if (f.k === "x") { o.push(`<text x="${f.x + f.w / 2}" y="${f.y + f.h / 2 + fs * 0.35}" font-size="${fs}" text-anchor="middle" font-family="${FD_FAM[0]}" fill="#000">X</text>`); continue; }
    const r = typeof v === "number"; const lines = String(t).split("\n");
    lines.forEach((ln, i) => o.push(`<text x="${r ? f.x + f.w - 2 : f.x + 2}" y="${f.y + Math.min(f.h - 2, fs + 1) + i * (fs + 1)}" font-size="${fs}" text-anchor="${r ? "end" : "start"}" font-family="${cfg.font || FD_FAM[0]}" fill="#000">${esc(ln)}</text>`)); }
  return o.join(""); }
/* ---------- contrôles de cohérence ---------- */
function fdCoh(forms, I, C) {
  const out = []; const cfg = fdCfg(); const tol = (cfg.tolerance || 1) * 100; const V = {};
  forms.forEach(id => { if (fdForm(id)) Object.assign(V, fdValues(id, I, C)); });
  const g = k => { const v = V[k] !== undefined ? V[k] : (I.v[k] !== undefined ? I.v[k] : null); return typeof v === "number" ? v : 0; };
  const has = k => V[k] !== undefined;
  const eq = (a, b, lib, goto) => { if (!has(a) && !has(b)) return; const d = g(a) - g(b); if (Math.abs(d) > tol) out.push({ lib, det: fdFmt(g(a), {}) + " ≠ " + fdFmt(g(b), {}) + " (écart " + fdFmt(d, {}) + ")", goto: goto || a.split("|")[0] }); };
  (typeof FD_COH !== "undefined" ? FD_COH : []).forEach(r => { try { if (r.forms && !r.forms.every(f => forms.includes(f))) return; const m = r.fn(g, has, C, I, k => V[k] !== undefined ? V[k] : I.v[k]); if (m) out.push(Object.assign({ goto: r.forms ? r.forms[0] : forms[0], lib: r.lib }, typeof m === "object" ? m : { det: m })); } catch (e) { } });
  (cfg.coh || []).forEach(r => { if (!r.a || !r.b) return; const b = /^[\d.,-]+$/.test(r.b) ? null : r.b; if (b) eq(r.a, b, r.lib || "Contrôle personnalisé"); else { const d = g(r.a) - Math.round(parseFloat(String(r.b).replace(",", ".")) * 100); if (Math.abs(d) > tol) out.push({ lib: r.lib || "Contrôle personnalisé", det: r.a + " = " + fdFmt(g(r.a), {}), goto: r.a.split("|")[0] }); } });
  forms.forEach(id => fdFields(id).forEach(f => { const v = I.v[id + "|" + f.i]; if (fdIsNum(f) && v != null && typeof v !== "number") out.push({ lib: "Saisie non numérique", det: fdTitle(id) + " · case " + f.i + " : « " + v + " »", goto: id, key: id + "|" + f.i }); }));
  return out;
}
/* ---------- vue principale ---------- */
VIEWS.fdDecl = () => { const st = fdSt(); if (st.tab === "cfg") return fdHead() + fdCfgView(); if (st.tab === "edi") return fdHead() + fdEdiView(); return fdHead() + fdBody(); };
const FD_EMB = { tva: "tva", das2: "das2", ecf: "ecf", isSolde: "s2572" };
function fdBody(emb) {
  const st = fdSt(); const cfg = fdCfg(); const ex = exCur();
  const tree = fdFormsOfTab(); const ids = tree.flatMap(x => x[1]);
  const pending = ids.filter(id => !fdModels()[id] && FD_PACK_OF[id] && !FXT_PACKS[FD_PACK_OF[id]]);
  if (pending.length) { if (!UI._fdLoading) { UI._fdLoading = 1; fdEnsure(ids).then(() => { UI._fdLoading = 0; if (UI.view === "fdDecl" || FD_EMB[UI.view]) render(); }); } return `<div class="card empty">${UI.fdErr ? esc(UI.fdErr) : "Chargement des modèles des impôts…"}</div>`; }
  if (!st.form || !ids.includes(st.form)) st.form = ids.find(id => fdForm(id)) || ids[0];
  const I = fdInst(); const C = fdCtx(); const valid = I.valid;
  const coh = fdCoh(ids.filter(id => !I.off[id]), I, C); UI._fdCoh = coh;
  const fid = st.form; const F = fdForm(fid);
  const treeH = tree.map(([g, L]) => { const all = L.every(id => !I.off[id]); return `<div class="fd-tg"><label class="fd-tgh"><input type="checkbox" ${all ? "checked" : ""} data-ch="fdOffG" data-l="${esc(L.join(","))}" ${valid ? "disabled" : ""}><span>📁 ${esc(g)}</span></label>${L.map(id => { const miss = !fdForm(id); const n = coh.filter(c => c.goto === id).length; return `<div class="fd-ti ${id === fid ? "on" : ""} ${miss ? "miss" : ""}"><input type="checkbox" ${!I.off[id] ? "checked" : ""} data-ch="fdOff" data-id="${id}" ${valid ? "disabled" : ""} title="Inclure ce formulaire dans la déclaration"><button class="lnk" data-act="fdGo" data-id="${id}">${esc(fdTitle(id))}</button>${n ? `<span class="fd-badge" title="${n} anomalie(s)">${n}</span>` : ""}${miss ? '<span class="fd-miss" title="Modèle à importer">à importer</span>' : ""}</div>`; }).join("")}</div>`; }).join("");
  const regSel = st.tab === "liasse" ? `<label class="fd-sel">Type de société <select class="in sm" data-ch="fdReg">${Object.keys(FD_TREE).map(k => `<option value="${k}" ${k === fdReg() ? "selected" : ""}>${esc(FD_REG_LIB[k])}</option>`).join("")}</select></label>` : st.tab === "tva" ? `<label class="fd-sel">Période <select class="in sm" data-ch="fdPer">${fdPers().map(p => `<option value="${p.id}" ${p.id === (st.per || (fdPers()[0] || {}).id) ? "selected" : ""}>${esc(p.lib)}</option>`).join("")}</select></label>` : st.tab === "das2" ? `<label class="fd-sel">Année <input class="in sm" style="width:80px" data-ch="fdY" value="${esc(fdDasY())}"></label>` : `<span class="fd-sel">Exercice ${esc(fdDate(ex.debut))} – ${esc(fdDate(ex.fin))}</span>`;
  const bar = `<div class="fd-bar"><details class="fd-dd"><summary class="btn sm">Actions ▾</summary><div class="fd-ddm">
      <button data-act="fdResetForm">↺ Réinitialiser les saisies de ce formulaire</button><button data-act="fdResetAll">↺ Réinitialiser toute la déclaration</button><button data-act="fdN1">⤵ Reprendre les informations de l'exercice précédent</button>
      <button data-act="fdCsv">⇩ Exporter les données (CSV)</button><button data-act="fdJson">⇩ Exporter les données (fichier EDI préparatoire)</button><button data-act="fdImpModel">⇧ Importer un nouveau modèle (PDF)</button><button data-act="fdHist">🕘 Historique des actions</button></div></details>
    <button class="btn sm" data-act="fdSave">💾 Enregistrer</button><button class="btn sm" data-act="fdPrint">🖨 Impression</button>
    ${valid ? `<button class="btn sm" data-act="fdUnvalid" title="Validée le ${esc(fdDate(valid.at.slice(0, 10)))} par ${esc(valid.by)}">🔓 Dévalider</button>` : `<button class="btn sm pri" data-act="fdValid">✔ Valider</button>`}
    <button class="btn sm ${coh.length ? "fd-cohko" : "fd-cohok"}" data-act="fdCohOpen">Cohérences (${coh.length})</button><button class="btn sm" data-act="fdCalc">⟳ Calculer</button>
    <span class="fd-sp"></span>${regSel}
    ${emb ? "" : `<div class="fd-mode"><button class="${st.mode !== "speedix" ? "on" : ""}" data-act="fdMode" data-m="impot">Modèle impôt</button><button class="${st.mode === "speedix" ? "on" : ""}" data-act="fdMode" data-m="speedix">Modèle ${esc(brNomSafeFx())}</button></div>`}
    <span class="fd-zoom"><button class="btn sm ghost" data-act="fdZoom" data-d="-1">−</button>${Math.round((st.zoom || cfg.zoom) * 100 / 1.5)} %<button class="btn sm ghost" data-act="fdZoom" data-d="1">+</button></span></div>`;
  let body;
  if (!F) body = fdMissingCard(fid);
  else if (st.mode === "speedix") body = fdSpeedix(fid, F, I, C);
  else body = fdPages(fid, F, I, C);
  const banner = valid ? `<div class="fd-valid">✔ Déclaration validée le ${esc(fdDate(valid.at.slice(0, 10)))} par ${esc(valid.by)} — les cases sont verrouillées.${I.edi && I.edi.st ? " · Envoi EDI : " + esc(FD_EDI_ST[I.edi.st] || I.edi.st) : ""}</div>` : "";
  return banner + bar + `<div class="fd-wrap"><aside class="fd-tree"><div class="fd-th">📂 Documents</div>${treeH}<div class="fd-tf small muted">Cochez les formulaires à déposer ; décochez ceux qui ne concernent pas la société (ils ne sont ni imprimés ni envoyés).</div></aside><main class="fd-main" id="fdMain">${body}</main></div>`;
};
const brNomSafeFx = () => typeof brNom === "function" ? brNom() : "Speedix";
function fdHead() { const st = fdSt(); return `<div class="topbar"><div><div class="eyebrow">Fiscalité</div><h1>Déclarations fiscales</h1><p class="lead">Les imprimés des impôts reproduits à l'identique, pré-remplis depuis la comptabilité. Chaque case reste modifiable ; les contrôles de cohérence signalent les écarts avant l'envoi.</p></div></div>
  <div class="fd-tabs">${FD_TABS.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="fdTab" data-t="${k}">${l}</button>`).join("")}</div>`; }
function fdMissingCard(id) { return `<div class="card fd-missc"><h3>${esc(fdTitle(id))}</h3><p>Ce modèle n'est pas encore installé. Importez l'imprimé (PDF officiel vierge téléchargé sur impots.gouv.fr, ou une édition de votre logiciel fiscal) : il sera reproduit à l'identique et ses cases seront détectées automatiquement, puis reliées à la comptabilité.</p><button class="btn pri" data-act="fdImpModel" data-id="${esc(id)}">⇧ Importer le modèle ${esc(id)}</button></div>`; }
function fdPages(id, F, I, C) {
  const st = fdSt(); const cfg = fdCfg(); const z = st.zoom || cfg.zoom; const vals = fdValues(id, I, C); const lock = !!I.valid; const ed = st.edit && isAdmin();
  const pages = fdPageList(id, F, I, C);
  return pages.map(({ p, pi, sfx, lib }) => `<div class="fd-pgw" id="fdp-${id}-${pi}${sfx ? "-" + sfx.slice(1) : ""}">${lib ? `<div class="fd-pgl">${esc(lib)}</div>` : ""}<div class="fd-pg ${ed ? "fd-edit" : ""}" style="width:${p.w * z}px;height:${p.h * z}px;--fdz:${z};--fdhl:${cfg.hlColor};--fdfo:${cfg.focusColor};--fdval:${cfg.valColor}" data-pg="${pi}" data-id="${id}">${fdSvg(p)}${p.F.map(f => {
    const k = id + "|" + f.i + (sfx || ""); const v = sfx ? (k in I.v ? I.v[k] : (vals._rep ? vals._rep(k) : null)) : vals[id + "|" + f.i]; const ovr = k in I.v; const fs = Math.min(f.s || 8.2, Math.max(5, f.h - 1.5)) * z;
    const sty = `left:${f.x * z}px;top:${f.y * z}px;width:${f.w * z}px;height:${f.h * z}px;font-size:${fs}px;${cfg.font ? "font-family:" + cfg.font + ";" : ""}`;
    const tip = esc((f.l ? f.l + " · " : "") + "case " + f.i + (ovr ? " · saisie manuelle" : v != null && v !== "" ? " · calculée depuis la comptabilité" : ""));
    if (ed) return `<div class="fd-fe" style="${sty}" data-act="fdFieldEd" data-id="${id}" data-i="${esc(f.i)}" data-pg="${pi}" title="${tip}">${esc(f.i)}</div>`;
    if (f.k === "x") return `<button class="fd-in fd-ck ${ovr && cfg.hl ? "ovr" : ""}" style="${sty}" data-act="fdCk" data-k="${esc(k)}" ${lock ? "disabled" : ""} title="${tip}">${v ? "X" : ""}</button>`;
    const tag = f.h > 22 && !fdIsNum(f) ? "textarea" : "input";
    return `<${tag} class="fd-in ${ovr && cfg.hl ? "ovr" : ""} ${typeof v === "number" ? "num" : ""}" style="${sty}" data-ch="fdV" data-k="${esc(k)}" ${tag === "input" ? `value="${esc(fdFmt(v, f))}"` : ""} ${lock ? "readonly" : ""} title="${tip}" aria-label="${tip}">${tag === "textarea" ? esc(fdFmt(v, f)) + "</textarea>" : ""}`;
  }).join("")}</div></div>`).join("") + (isAdmin() ? `<div class="fd-edbar"><label class="small"><input type="checkbox" ${st.edit ? "checked" : ""} data-ch="fdEdit"> Mode édition des cases (déplacer, renommer, relier à la comptabilité, ajouter)</label>${st.edit ? '<span class="small muted"> · cliquez une case pour la modifier ; maintenez Maj et cliquez-glissez sur la page pour en dessiner une nouvelle.</span>' : ""}</div>` : "");
}
function fdPageList(id, F, I, C) { const out = F.p.map((p, pi) => ({ p, pi, sfx: "" }));
  if (typeof FD_REPEAT === "function") { const r = FD_REPEAT(id, F, I, C); if (r) return r; }
  return out; }
/* ---------- modèle Speedix (présentation moderne, mêmes données) ---------- */
function fdSpeedix(id, F, I, C) {
  const st = fdSt(); const vals = fdValues(id, I, C); const q = (st.q || "").toLowerCase(); const lock = !!I.valid;
  const pages = fdPageList(id, F, I, C);
  const rows = pages.map(({ p, pi, sfx, lib }) => { const R = p.F.filter(f => !q || (f.l || "").toLowerCase().includes(q) || (f.n || "").toLowerCase().includes(q) || f.i.toLowerCase().includes(q));
    const G = []; R.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(f => { const g = G.find(x => Math.abs(x.y - f.y) < 3); if (g) g.F.push(f); else G.push({ y: f.y, F: [f] }); });
    const list = G.map(g => { let any = false; const cells = g.F.sort((a, b) => a.x - b.x).map(f => { const k = id + "|" + f.i + (sfx || ""); const v = sfx ? (k in I.v ? I.v[k] : (vals._rep ? vals._rep(k) : null)) : vals[id + "|" + f.i]; const ovr = k in I.v; if (v != null && v !== "") any = true;
        const code = /^z|^p\d+\.z|^N[a-z0-9]{4}$/.test(f.i) ? "" : f.i.replace(/^p\d+\./, "");
        const inp = f.k === "x" ? `<button class="fd-sck ${v ? "on" : ""}" data-act="fdCk" data-k="${esc(k)}" ${lock ? "disabled" : ""}>${v ? "✔ Oui" : "Non"}</button>` : `<input class="in sm ${typeof v === "number" || (fdIsNum(f) && !/[a-z]/i.test(f.n || "")) ? "num" : ""}" data-ch="fdV" data-k="${esc(k)}" value="${esc(fdFmt(v, f))}" ${lock ? "readonly" : ""} title="${esc(f.n || f.l || "")}">`;
        return `<div class="fd-sc ${ovr ? "ovr" : ""}">${code ? `<span class="fd-code">${esc(code)}</span>` : ""}${inp}${ovr ? `<button class="btn sm ghost" data-act="fdUnset" data-k="${esc(k)}" title="Revenir au calcul">↺</button>` : ""}</div>`; }).join("");
      if (st.only && !any) return ""; const lab = (g.F.find(f => f.l) || {}).l || (g.F[0].n || "—");
      return `<tr><td class="fd-sl">${esc(lab)}</td><td><div class="fd-scs">${cells}</div></td></tr>`; }).join("");
    return list ? `<section class="panel"><div class="panel-h"><h2>${esc(lib || (F.p.length > 1 ? fdTitle(id) + " · page " + (pi + 1) : fdTitle(id)))}</h2></div><div class="panel-b"><table class="t fd-st"><tbody>${list}</tbody></table></div></section>` : ""; }).join("");
  return `<div class="fd-sx"><div class="fd-sxh"><div><h2>${esc(fdTitle(id))}</h2><p class="small muted">Présentation ${esc(brNomSafeFx())} du même formulaire : les montants saisis ici et sur le modèle impôt sont les mêmes.</p></div><div class="row"><input class="in sm" placeholder="Rechercher une rubrique ou une case…" data-ch="fdQ" value="${esc(st.q || "")}"><label class="small"><input type="checkbox" ${st.only ? "checked" : ""} data-ch="fdOnly"> Cases remplies uniquement</label></div></div>${rows || '<div class="card empty">Aucune rubrique.</div>'}</div>`;
}
/* ---------- impression (PDF identique) ---------- */
async function fdPagePng(p, valSvg, scale) {
  const svg = fdSvg(p).replace("</svg>", valSvg + "</svg>").replace('style="display:block;width:100%;height:100%"', `width="${p.w * scale}" height="${p.h * scale}"`);
  const img = new Image(); const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await new Promise((ok, ko) => { img.onload = ok; img.onerror = () => ko(new Error("Rendu de la page impossible")); img.src = url; });
  const cv = document.createElement("canvas"); cv.width = Math.round(p.w * scale); cv.height = Math.round(p.h * scale); const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}
async function fdBuildPdf(ids, I, C) {
  const pdf = new MiniPDF(); let first = true;
  for (const id of ids) { const F = fdForm(id); if (!F) continue; const vals = fdValues(id, I, C);
    for (const { p, sfx } of fdPageList(id, F, I, C)) {
      const vv = sfx ? new Proxy(vals, { get: (o, k) => (typeof k === "string" && k.endsWith(sfx) ? (k in I.v ? I.v[k] : (o._rep ? o._rep(k) : null)) : o[k]) }) : vals;
      const cv = await fdPagePng(p, fdValSvg(p, id, vv, sfx), 1.9); const b64 = cv.toDataURL("image/jpeg", 0.8).split(",")[1]; const bin = atob(b64);
      if (!first) pdf.addPage(); first = false; pdf.image(0, 0, pdf.W, pdf.H, { bin, w: cv.width, h: cv.height }); } }
  return pdf.output();
}
/* ---------- envoi EDI (préparation, suivi) ---------- */
const FD_EDI_ST = { prep: "Préparé", sent: "Transmis au partenaire EDI", ok: "Accepté (accusé de réception)", ko: "Rejeté — à corriger" };
function fdEdiView() { const D = S.fxd || {}; const rows = Object.entries(D).filter(([k, I]) => I.valid || I.edi).map(([k, I]) => { const [t, a, b] = k.split(":"); const lib = t === "LIA" ? "Liasse " + (FD_REG_LIB[b] || b).split("·")[0] + " · " + a.replace("EX", "") : t === "TVA" ? "TVA " + a : t === "2572" ? "Relevé de solde 2572 · " + a.replace("EX", "") : t === "DAS2" ? "DAS2 " + a : "ECF " + a.replace("EX", "");
    const e = I.edi || {}; return `<tr><td>${esc(lib)}</td><td>${I.valid ? "✔ " + esc(fdDate(I.valid.at.slice(0, 10))) : "—"}</td><td><select class="in sm" data-ch="fdEdiSt" data-k="${esc(k)}"><option value="">Non envoyé</option>${Object.entries(FD_EDI_ST).map(([v, l]) => `<option value="${v}" ${e.st === v ? "selected" : ""}>${l}</option>`).join("")}</select></td><td class="small">${e.at ? esc(fdDate(e.at.slice(0, 10))) : ""}</td><td><input class="in sm" placeholder="N° de dépôt / référence" data-ch="fdEdiRef" data-k="${esc(k)}" value="${esc(e.ref || "")}"></td></tr>`; }).join("");
  const cfg = fdCfg();
  return `<section class="panel"><div class="panel-h"><h2>📡 Envoi automatique des déclarations (EDI)</h2></div><div class="panel-b"><p class="small" style="margin-top:0">Le dépôt dématérialisé des liasses (EDI-TDFC), de la TVA (EDI-TVA) et des paiements passe par un <b>partenaire EDI agréé</b> par la DGFiP (portail déclaratif de l'expert-comptable, OGA, éditeur agréé). ${esc(brNomSafeFx())} prépare et contrôle les données, produit les imprimés identiques et le fichier préparatoire ; la transmission se fait par votre partenaire, puis vous suivez ici le statut et l'accusé de réception.</p>
  <div class="grid g3"><label class="f">Préparer automatiquement le fichier à la validation<select class="in" data-ch="fdCfgB" data-k="ediAuto"><option value="1" ${cfg.ediAuto ? "selected" : ""}>Oui</option><option value="" ${!cfg.ediAuto ? "selected" : ""}>Non</option></select></label><label class="f">Partenaire EDI<input class="in" data-ch="fdCfgT" data-k="ediPart" value="${esc(cfg.ediPart || "")}" placeholder="Nom du partenaire / portail"></label><label class="f">Lien du portail de dépôt<input class="in" data-ch="fdCfgT" data-k="ediUrl" value="${esc(cfg.ediUrl || "")}" placeholder="https://…"></label></div>${cfg.ediUrl ? `<a class="btn" href="${esc(cfg.ediUrl)}" target="_blank" rel="noopener">Ouvrir le portail de dépôt ↗</a>` : ""}</div></section>
  <section class="panel"><div class="panel-h"><h2>Suivi des déclarations validées</h2></div><div class="panel-b">${rows ? `<table class="t"><thead><tr><th>Déclaration</th><th>Validée</th><th>Statut d'envoi</th><th>Date</th><th>Référence</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="small muted">Aucune déclaration validée pour l\'instant. Validez une déclaration pour la préparer à l\'envoi.</div>'}</div></section>`; }
/* ---------- paramètres ---------- */
function fdCfgView() { const cfg = fdCfg(); const sc = S.fdCfg && S.fdCfg.on; const M = fdModels();
  const yn = (k, l) => `<label class="f">${l}<select class="in" data-ch="fdCfgB" data-k="${k}"><option value="1" ${cfg[k] ? "selected" : ""}>Oui</option><option value="" ${!cfg[k] ? "selected" : ""}>Non</option></select></label>`;
  const col = (k, l) => `<label class="f">${l}<input type="color" class="in" data-ch="fdCfgT" data-k="${k}" value="${esc(cfg[k])}"></label>`;
  const maps = Object.entries(cfg.map || {}); const cohs = cfg.coh || [];
  return `<section class="panel"><div class="panel-h"><h2>⚙ Paramètres des déclarations</h2><div class="row"><label class="small"><input type="radio" name="fxsc" ${!sc ? "checked" : ""} data-ch="fdScope" value=""> Tous les dossiers</label><label class="small"><input type="radio" name="fxsc" ${sc ? "checked" : ""} data-ch="fdScope" value="1"> Ce dossier uniquement</label></div></div><div class="panel-b"><div class="grid g4">
    <label class="f">Zoom par défaut<select class="in" data-ch="fdCfgN" data-k="zoom">${[1, 1.25, 1.5, 1.75, 2].map(z => `<option value="${z}" ${cfg.zoom == z ? "selected" : ""}>${Math.round(z * 100 / 1.5)} %</option>`).join("")}</select></label>
    ${col("hlColor", "Couleur des cases saisies à la main")}${col("focusColor", "Couleur de la case active")}${col("valColor", "Couleur des montants à l'écran")}
    <label class="f">Police des montants<select class="in" data-ch="fdCfgT" data-k="font"><option value="">Identique à l'imprimé (Times)</option>${["Arial", "Helvetica", "Courier New", "Verdana"].map(f => `<option ${cfg.font === f ? "selected" : ""}>${f}</option>`).join("")}</select></label>
    ${yn("hl", "Surligner les cases modifiées à la main")}${yn("zeros", "Afficher les montants nuls (0)")}${yn("cohOnSave", "Contrôler les cohérences à l'enregistrement")}${yn("autoCoh", "Bloquer la validation s'il reste des anomalies")}
    <label class="f">Après l'impression, enregistrer dans la GED<select class="in" data-ch="fdCfgT" data-k="autoGed">${[["ask", "Demander"], ["auto", "Oui, automatiquement"], ["never", "Non"]].map(([v, l]) => `<option value="${v}" ${cfg.autoGed === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Tolérance des contrôles (€)<input class="in" type="number" min="0" data-ch="fdCfgN" data-k="tolerance" value="${cfg.tolerance}"></label></div></div></section>
  <section class="panel"><div class="panel-h"><h2>🔗 Correspondances avec la comptabilité</h2><button class="btn sm" data-act="fdMapAdd">＋ Ajouter</button></div><div class="panel-b"><p class="small muted" style="margin-top:0">Chaque case peut recevoir sa propre formule. Exemple : <span class="mono">SOLDE('706')</span>, <span class="mono">-SOLDE('70')</span>, <span class="mono">F('2050|BJ') + F('2050|CJ')</span>, <span class="mono">T:S.nom</span> pour un texte. Fonctions : ${FORMULA_HELP.map(h => `<span class="mono">${esc(h[0])}</span>`).join(", ")}, <span class="mono">F('formulaire|case')</span>, <span class="mono">ISR('rf')</span>, <span class="mono">TVA('due')</span>.</p>
    ${maps.length ? `<table class="t"><thead><tr><th>Case (formulaire|case)</th><th>Formule</th><th></th></tr></thead><tbody>${maps.map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td><input class="in sm mono" data-ch="fdMapV" data-k="${esc(k)}" value="${esc(v)}"></td><td><button class="btn sm ghost" data-act="fdMapDel" data-k="${esc(k)}">✕</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Aucune formule personnalisée : les correspondances d\'origine s\'appliquent. En mode édition des cases, cliquez une case pour lui donner une formule.</div>'}</div></section>
  <section class="panel"><div class="panel-h"><h2>✓ Contrôles de cohérence personnalisés</h2><button class="btn sm" data-act="fdCohAdd">＋ Ajouter</button></div><div class="panel-b">${cohs.length ? `<table class="t"><thead><tr><th>Libellé</th><th>Case A</th><th>doit être égale à (case ou montant)</th><th></th></tr></thead><tbody>${cohs.map((r, i) => `<tr><td><input class="in sm" data-ch="fdCohV" data-i="${i}" data-f="lib" value="${esc(r.lib || "")}"></td><td><input class="in sm mono" data-ch="fdCohV" data-i="${i}" data-f="a" value="${esc(r.a || "")}" placeholder="2050|CO"></td><td><input class="in sm mono" data-ch="fdCohV" data-i="${i}" data-f="b" value="${esc(r.b || "")}" placeholder="2051|EE"></td><td><button class="btn sm ghost" data-act="fdCohDel" data-i="${i}">✕</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Les contrôles d\'origine (totaux, équilibre bilan, résultat, IS, TVA) sont toujours actifs. Ajoutez ici vos propres contrôles.</div>'}</div></section>
  <section class="panel"><div class="panel-h"><h2>📥 Modèles importés (nouveaux millésimes, autres imprimés)</h2><button class="btn sm pri" data-act="fdImpModel">⇧ Importer un modèle</button></div><div class="panel-b">${Object.keys(M).length ? `<table class="t"><thead><tr><th>Code</th><th>Titre</th><th>Types de société</th><th>Rubrique</th><th>Pages</th><th></th></tr></thead><tbody>${Object.entries(M).map(([id, m]) => `<tr><td class="mono">${esc(id)}</td><td><input class="in sm" data-ch="fdModT" data-id="${esc(id)}" value="${esc(m.t || "")}"></td><td class="small">${(m.reg || []).join(", ") || "—"}</td><td class="small">${esc(m.grp || "Annexes")}</td><td>${(m.p || []).length}</td><td><button class="btn sm ghost" data-act="fdModDel" data-id="${esc(id)}">🗑</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Aucun modèle importé. Un modèle importé avec le même code qu\'un modèle d\'origine (ex. 2050) le remplace : c\'est ainsi que l\'on passe au millésime suivant.</div>'}
  <div class="row" style="margin-top:10px"><button class="btn sm" data-act="fdCfgExp">⇩ Exporter les paramètres</button><label class="btn sm">⇧ Importer des paramètres<input type="file" accept=".json" hidden data-ch="fdCfgImp"></label></div></div></section>`; }
/* ---------- import d'un nouveau modèle (PDF) ---------- */
async function fdImportPdf(file, d) {
  const bytes = new Uint8Array(await file.arrayBuffer()); let acro = { fields: [], pages: [] }; try { acro = await readPdfFields(bytes); } catch (e) { }
  const pdfjs = await ensurePdfJs(); const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise; const P = [];
  for (let i = 1; i <= Math.min(doc.numPages, 30); i++) { const page = await doc.getPage(i); const vp1 = page.getViewport({ scale: 1 }); const vp = page.getViewport({ scale: 2 });
    const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; const g = cv.getContext("2d"); await page.render({ canvasContext: g, viewport: vp }).promise;
    const W = vp1.width, H = vp1.height; const F = [];
    acro.fields.filter(f => f.page === i - 1 && f.rect).forEach(f => F.push({ i: f.name.replace(/[^\w.-]/g, "_").slice(0, 40), x: f.rect.x, y: H - f.rect.y - f.rect.h, w: f.rect.w, h: f.rect.h, l: f.name, k: f.type === "CheckBox" ? "x" : undefined, a: f.type === "Text" ? undefined : undefined }));
    if (!F.length) { const tc = await page.getTextContent(); tc.items.forEach(it => { const s = (it.str || "").trim(); const sz = Math.hypot(it.transform[0], it.transform[1]); if (/^([A-Z]{2}|[0-9]{3,4}|[A-Z][0-9])$/.test(s) && sz < 8) { const x = it.transform[4] + (it.width || sz * 1.4) + 3, y = H - it.transform[5] - sz - 1.5; if (!F.some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 3)) F.push({ i: s, x, y, w: Math.min(90, W - x - 30), h: sz + 4 }); } }); }
    if (d.erase) { g.fillStyle = "#fff"; F.forEach(f => g.fillRect((f.x + 1) * 2, (f.y + 1) * 2, (f.w - 2) * 2, (f.h - 2) * 2)); }
    P.push({ w: W, h: H, bg: cv.toDataURL("image/jpeg", 0.82), R: [], L: [], T: [], I: [], F }); }
  return P;
}
/* ---------- actions ---------- */
function fdSetVal(k, v) { const I = fdInst(); if (I.valid) return toast("Déclaration validée : dévalidez-la pour modifier."); if (v == null || v === "") { if (k in I.v) I.v[k] = null; else I.v[k] = null; } else I.v[k] = v; Store.touch(); }
Object.assign(F2ACT, {
  fdTab: el => { fdSt().tab = el.dataset.t; fdSt().form = null; render(); },
  fdGo: el => { fdSt().form = el.dataset.id; render(); const m = $("#fdMain"); if (m) m.scrollTop = 0; },
  fdMode: el => { fdSt().mode = el.dataset.m; render(); },
  fdZoom: el => { const st = fdSt(); const z = st.zoom || fdCfg().zoom; st.zoom = Math.max(0.75, Math.min(3, Math.round((z + 0.25 * +el.dataset.d) * 100) / 100)); render(); },
  fdCk: el => { const k = el.dataset.k; const I = fdInst(); if (I.valid) return; const cur = el.textContent.trim() === "X" || /Oui/.test(el.textContent); fdSetVal(k, !cur); render(); },
  fdUnset: el => { const I = fdInst(); delete I.v[el.dataset.k]; Store.touch(); render(); },
  fdSave: () => { const I = fdInst(); fdLog(I, "Enregistrement"); Store.touch(); const n = (UI._fdCoh || []).length; toast(fdCfg().cohOnSave && n ? "Enregistré · " + n + " anomalie(s) de cohérence à vérifier." : "Déclaration enregistrée."); render(); },
  fdCalc: () => { UI._fdCtx = null; const I = fdInst(); fdLog(I, "Calcul depuis la comptabilité"); toast("Montants recalculés depuis la comptabilité (vos saisies manuelles sont conservées)."); render(); },
  fdResetForm: () => { const st = fdSt(); confirmBox("Réinitialiser le formulaire", "Les saisies manuelles de « " + fdTitle(st.form) + " » seront supprimées et les montants recalculés depuis la comptabilité.", "Réinitialiser", () => { const I = fdInst(); Object.keys(I.v).filter(k => k.startsWith(st.form + "|")).forEach(k => delete I.v[k]); fdLog(I, "Réinitialisation " + st.form); Store.touch(); closeModal(); }, true); },
  fdResetAll: () => confirmBox("Réinitialiser la déclaration", "Toutes les saisies manuelles de cette déclaration seront supprimées.", "Réinitialiser", () => { const I = fdInst(); I.v = {}; I.off = {}; fdLog(I, "Réinitialisation complète"); Store.touch(); closeModal(); }, true),
  fdN1: () => { const ex = exCur(); const pv = prevEx(ex); if (!pv) return toast("Aucun exercice précédent."); const k0 = fdInstKey().replace(ex.id, pv.id); const P = (S.fxd || {})[k0]; if (!P) return toast("Aucune déclaration sur l'exercice précédent."); const I = fdInst(); let n = 0; Object.entries(P.v).forEach(([k, v]) => { if (typeof v === "string" && !(k in I.v)) { I.v[k] = v; n++; } }); fdLog(I, "Reprise N-1 (" + n + " textes)"); Store.touch(); toast(n + " information(s) reprise(s) de l'exercice précédent (textes, identification)."); render(); },
  fdValid: () => { const coh = UI._fdCoh || []; const I = fdInst(); if (coh.length && fdCfg().autoCoh) return openModal({ type: "fdCoh", block: true }); I.valid = { at: new Date().toISOString(), by: typeof xsMe === "function" ? xsMe() : "moi" }; fdLog(I, "Validation"); if (fdCfg().ediAuto) { I.edi = { st: "prep", at: new Date().toISOString() }; fdLog(I, "Fichier EDI préparé"); } Store.touch(); toast("Déclaration validée."); render(); },
  fdUnvalid: () => confirmBox("Dévalider la déclaration", "Les cases redeviennent modifiables. L'historique conserve la trace de cette action.", "Dévalider", () => { const I = fdInst(); delete I.valid; fdLog(I, "Dévalidation"); Store.touch(); closeModal(); }),
  fdCohOpen: () => openModal({ type: "fdCoh" }),
  fdCohGo: el => { fdSt().form = el.dataset.id; closeModal(); },
  fdHist: () => openModal({ type: "fdHist" }),
  fdPrint: () => openModal({ type: "fdPrint", d: { what: "checked" } }),
  fdPrintGo: async () => { const M = UI.modal; const what = (M.d || {}).what; const st = fdSt(); const I = fdInst(); const C = fdCtx(); const tree = fdFormsOfTab().flatMap(x => x[1]);
    const ids = what === "one" ? [st.form] : tree.filter(id => !I.off[id] && fdForm(id)); closeModal(); toast("Préparation du PDF…");
    try { const bytes = await fdBuildPdf(ids, I, C); const ex = exCur(); const nm = (S.nom || "dossier").replace(/[^\w-]+/g, "_") + "_" + (st.tab === "liasse" ? "Liasse_" + fdReg() : st.tab.toUpperCase()) + "_" + ex.id.replace("EX", "") + ".pdf";
      fdLog(I, "Impression PDF (" + ids.length + " formulaire(s))"); Store.touch(); deliverFile(nm, bytes, "pdf", null, { cat: "Déclarations fiscales", lib: "Déclaration " + (st.tab === "liasse" ? "liasse fiscale" : st.tab) + " (modèle impôt)" }); } catch (e) { console.error(e); toast("Impression impossible : " + e.message); } },
  fdCsv: () => { const st = fdSt(); const I = fdInst(); const C = fdCtx(); const L = [["Formulaire", "Case", "Rubrique", "Valeur", "Origine"]]; fdFormsOfTab().flatMap(x => x[1]).filter(id => !I.off[id] && fdForm(id)).forEach(id => { const V = fdValues(id, I, C); fdFields(id).forEach(f => { const k = id + "|" + f.i; const v = V[k]; if (v == null || v === "") return; L.push([id, f.i, f.l || "", typeof v === "number" ? (v / 100).toFixed(2).replace(".", ",") : String(v), k in I.v ? "Saisie" : "Comptabilité"]); }); });
    const csv = "\ufeff" + L.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(";")).join("\r\n"); deliverFile("declaration_" + st.tab + ".csv", new TextEncoder().encode(csv), "csv"); },
  fdJson: () => { const st = fdSt(); const I = fdInst(); const C = fdCtx(); const out = { emetteur: brNomSafeFx(), dossier: { nom: S.nom, siren: S.siren, siret: S.siret }, declaration: fdInstKey(), exercice: { debut: exCur().debut, fin: exCur().fin }, genere: new Date().toISOString(), formulaires: {} };
    fdFormsOfTab().flatMap(x => x[1]).filter(id => !I.off[id] && fdForm(id)).forEach(id => { const V = fdValues(id, I, C); const o = out.formulaires[id] = {}; fdFields(id).forEach(f => { const v = V[id + "|" + f.i]; if (v == null || v === "" || /^z|\.z/.test(f.i)) return; o[f.i] = typeof v === "number" ? Math.round(v / 100) : v; }); });
    I.edi = Object.assign(I.edi || {}, { st: (I.edi || {}).st || "prep", at: new Date().toISOString() }); fdLog(I, "Fichier EDI préparatoire exporté"); Store.touch(); deliverFile("EDI_" + fdInstKey().replace(/[:]/g, "_") + ".json", new TextEncoder().encode(JSON.stringify(out, null, 2)), "json"); },
  fdImpModel: el => openModal({ type: "fdImp", d: { id: (el && el.dataset.id) || "", t: el && el.dataset.id ? fdTitle(el.dataset.id) : "", grp: "Liasse fiscale", reg: [fdReg()], erase: true } }),
  fdImpGo: async () => { const M = UI.modal; const d = M.d || {}; const inp = $("#fdImpFile"); const file = inp && inp.files[0]; if (!file) return toast("Choisissez le fichier PDF du modèle."); if (!d.id) return toast("Indiquez le code du formulaire (ex. 2033A)."); toast("Analyse du modèle…");
    try { const P = await fdImportPdf(file, d); const W = fdCfgW(); W.models ||= {}; W.models[d.id] = { t: d.t || d.id, grp: d.grp || "Annexes", reg: d.reg || [], p: P, at: new Date().toISOString() }; fdCfgSave(); closeModal(); fdSt().form = d.id; fdSt().edit = true; toast("Modèle importé : " + P.reduce((a, p) => a + p.F.length, 0) + " case(s) détectée(s). Vérifiez-les en mode édition."); render(); } catch (e) { console.error(e); toast("Import impossible : " + e.message); } },
  fdModDel: el => confirmBox("Supprimer le modèle importé", "Le modèle « " + el.dataset.id + " » sera retiré (les montants saisis sont conservés).", "Supprimer", () => { const W = fdCfgW(); delete (W.models || {})[el.dataset.id]; fdCfgSave(); closeModal(); }, true),
  fdFieldEd: el => { const f = fdFields(el.dataset.id).find(x => x.i === el.dataset.i) || {}; const k = el.dataset.id + "|" + el.dataset.i; openModal({ type: "fdField", d: { id: el.dataset.id, i: f.i, l: f.l || "", f: fdCfg().map[k] || "", w: f.w, h: f.h, x: f.x, y: f.y, a: f.a || "r", k: f.k || "", pg: +el.dataset.pg } }); },
  fdFieldGo: () => { const d = UI.modal.d; const k = d.id + "|" + d.i; const W = fdCfgW(); W.map ||= {}; if (d.f) W.map[k] = d.f; else delete W.map[k];
    const M = fdModelW(d.id); if (M) { const p = M.p[d.pg]; const f = p.F.find(x => x.i === d.i); if (f) { if (d.del) p.F.splice(p.F.indexOf(f), 1); else Object.assign(f, { i: d.ni || f.i, l: d.l, x: +d.x, y: +d.y, w: +d.w, h: +d.h, a: d.a === "l" ? "l" : undefined, k: d.k || undefined }); } }
    fdCfgSave(); closeModal(); },
  fdFieldDel: () => { UI.modal.d.del = 1; F2ACT.fdFieldGo(); },
  fdMapAdd: () => { const k = prompt("Case (formulaire|case), ex. 2058A|WG"); if (!k) return; const W = fdCfgW(); W.map ||= {}; W.map[k.trim()] = "0"; fdCfgSave(); render(); },
  fdMapDel: el => { const W = fdCfgW(); delete (W.map || {})[el.dataset.k]; fdCfgSave(); render(); },
  fdCohAdd: () => { const W = fdCfgW(); W.coh = (fdCfg().coh || []).concat([{ lib: "Nouveau contrôle", a: "", b: "" }]); fdCfgSave(); render(); },
  fdCohDel: el => { const W = fdCfgW(); W.coh = (fdCfg().coh || []).filter((x, i) => i !== +el.dataset.i); fdCfgSave(); render(); },
  fdCfgExp: () => deliverFile("parametres_declarations.json", new TextEncoder().encode(JSON.stringify(fdCfg(), null, 2)), "json")
});
function fdModelW(id) { /* copie modifiable d'un modèle (d'origine ou importé) */ const W = fdCfgW(); W.models ||= {}; if (!W.models[id]) { const F = FXT[id]; if (!F) return null; W.models[id] = { t: F.t, grp: "", reg: [], p: deep(F.p), base: 1 }; } return W.models[id]; }
Object.assign(F2CHG, {
  fdV: el => { const k = el.dataset.k; const [id, ...r] = k.split("|"); const fi = r.join("|").replace(/#\d+$/, ""); const f = fdFields(id).find(x => x.i === fi) || {}; fdSetVal(k, fdParse(el.value, f)); render(); },
  fdOff: el => { const I = fdInst(); if (el.checked) delete I.off[el.dataset.id]; else I.off[el.dataset.id] = 1; Store.touch(); render(); },
  fdOffG: el => { const I = fdInst(); el.dataset.l.split(",").forEach(id => { if (el.checked) delete I.off[id]; else I.off[id] = 1; }); Store.touch(); render(); },
  fdReg: el => { fdSt().reg = el.value; S.fdReg = el.value; fdSt().form = null; UI._fdCtx = null; Store.touch(); render(); },
  fdPer: el => { fdSt().per = el.value; (UI.sub.tva ||= {}).p = el.value; UI._fdCtx = null; render(); },
  fdY: el => { fdSt().y = el.value.trim(); UI._fdCtx = null; render(); },
  fdQ: el => { fdSt().q = el.value; render(); }, fdOnly: el => { fdSt().only = el.checked; render(); }, fdEdit: el => { fdSt().edit = el.checked; render(); },
  fdEdiSt: el => { const I = (S.fxd || {})[el.dataset.k]; if (!I) return; I.edi = Object.assign(I.edi || {}, { st: el.value, at: new Date().toISOString() }); fdLog(I, "Statut EDI : " + (FD_EDI_ST[el.value] || "non envoyé")); Store.touch(); render(); },
  fdEdiRef: el => { const I = (S.fxd || {})[el.dataset.k]; if (!I) return; I.edi = Object.assign(I.edi || {}, { ref: el.value }); Store.touch(); },
  fdScope: el => { S.fdCfg ||= {}; S.fdCfg.on = !!el.value; if (S.fdCfg.on && !S.fdCfg.v) S.fdCfg.v = deep(psRoot().fd || {}); Store.touch(); render(); },
  fdCfgB: el => { const W = fdCfgW(); W[el.dataset.k] = !!el.value; fdCfgSave(); render(); },
  fdCfgT: el => { const W = fdCfgW(); W[el.dataset.k] = el.value; fdCfgSave(); render(); },
  fdCfgN: el => { const W = fdCfgW(); W[el.dataset.k] = +el.value; fdCfgSave(); render(); },
  fdMapV: el => { const W = fdCfgW(); W.map ||= {}; W.map[el.dataset.k] = el.value; fdCfgSave(); UI._fdCtx = null; },
  fdCohV: el => { const W = fdCfgW(); W.coh = deep(fdCfg().coh || []); W.coh[+el.dataset.i][el.dataset.f] = el.value; fdCfgSave(); },
  fdModT: el => { const W = fdCfgW(); if ((W.models || {})[el.dataset.id]) W.models[el.dataset.id].t = el.value; fdCfgSave(); },
  fdCfgImp: async el => { const f = el.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); const W = fdCfgW(); Object.assign(W, o); fdCfgSave(); toast("Paramètres importés."); render(); } catch (e) { toast("Fichier invalide."); } },
  fdImpReg: el => { const d = UI.modal.d; d.reg = [...document.querySelectorAll("[data-ch=fdImpReg]:checked")].map(x => x.value); }
});
/* nouvelles cases dessinées à la souris (mode édition, Maj + glisser) */
document.addEventListener("mousedown", ev => { const pg = ev.target.closest && ev.target.closest(".fd-pg.fd-edit"); if (!pg || !ev.shiftKey) return; ev.preventDefault(); const r = pg.getBoundingClientRect(); const z = +getComputedStyle(pg).getPropertyValue("--fdz") || 1.5; const x0 = (ev.clientX - r.left) / z, y0 = (ev.clientY - r.top) / z;
  const box = document.createElement("div"); box.className = "fd-draw"; pg.appendChild(box);
  const mv = e => { const x1 = (e.clientX - r.left) / z, y1 = (e.clientY - r.top) / z; Object.assign(box.style, { left: Math.min(x0, x1) * z + "px", top: Math.min(y0, y1) * z + "px", width: Math.abs(x1 - x0) * z + "px", height: Math.abs(y1 - y0) * z + "px" }); };
  const up = e => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); box.remove(); const x1 = (e.clientX - r.left) / z, y1 = (e.clientY - r.top) / z; if (Math.abs(x1 - x0) < 4 || Math.abs(y1 - y0) < 4) return;
    const id = pg.dataset.id, pi = +pg.dataset.pg; const M = fdModelW(id); if (!M) return; const n = "N" + Date.now().toString(36).slice(-4); M.p[pi].F.push({ i: n, x: Math.round(Math.min(x0, x1) * 10) / 10, y: Math.round(Math.min(y0, y1) * 10) / 10, w: Math.round(Math.abs(x1 - x0) * 10) / 10, h: Math.round(Math.abs(y1 - y0) * 10) / 10, l: "Nouvelle case" }); fdCfgSave(); render(); };
  document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up); });
/* ---------- fenêtres ---------- */
const _rmFX = renderModal;
renderModal = function () { const M = UI.modal;
  if (M && M.type === "fdCoh") { const coh = UI._fdCoh || []; return modalFrame("Cohérences (" + coh.length + ")", (M.block ? `<div class="banner" style="margin:0 0 10px">La validation est bloquée tant que des anomalies subsistent (réglable dans Paramètres).</div>` : "") + (coh.length ? `<table class="t"><thead><tr><th>Contrôle</th><th>Détail</th><th></th></tr></thead><tbody>${coh.map(c => `<tr><td><b>${esc(c.lib)}</b></td><td class="small">${esc(c.det || "")}</td><td><button class="btn sm" data-act="fdCohGo" data-id="${esc(c.goto || "")}">Voir ${esc(c.goto || "")}</button></td></tr>`).join("")}</tbody></table>` : '<div class="card empty">✔ Aucune anomalie : la déclaration est cohérente.</div>'), `<button class="btn" data-act="closeModal">Fermer</button>`, true); }
  if (M && M.type === "fdHist") { const I = fdInst(); return modalFrame("Historique de la déclaration", I.hist.length ? `<table class="t"><thead><tr><th>Date</th><th>Intervenant</th><th>Action</th></tr></thead><tbody>${I.hist.map(h => `<tr><td class="small">${esc(new Date(h.at).toLocaleString("fr-FR"))}</td><td>${esc(h.by)}</td><td>${esc(h.act)}</td></tr>`).join("")}</tbody></table>` : '<div class="card empty">Aucune action enregistrée.</div>', `<button class="btn" data-act="closeModal">Fermer</button>`); }
  if (M && M.type === "fdPrint") { const d = M.d; return modalFrame("🖨 Impression", `<label class="f"><span><input type="radio" name="fxpw" data-m="what" value="checked" ${d.what !== "one" ? "checked" : ""}> Tous les formulaires cochés (déclaration complète)</span></label><label class="f"><span><input type="radio" name="fxpw" data-m="what" value="one" ${d.what === "one" ? "checked" : ""}> Le formulaire affiché uniquement</span></label><p class="small muted">Le PDF reproduit les imprimés à l'identique avec vos montants.</p>`, cancelBtn + `<button class="btn pri" data-act="fdPrintGo">Générer le PDF</button>`); }
  if (M && M.type === "fdImp") { const d = M.d; return modalFrame("⇧ Importer un modèle des impôts", `<p class="small" style="margin-top:0">Importez l'imprimé officiel vierge (PDF impots.gouv.fr, éventuellement remplissable) ou l'édition de votre logiciel fiscal. Les cases remplissables sont reprises telles quelles ; sinon elles sont détectées à partir des numéros de cases. Les montants présents dans le PDF peuvent être effacés.</p>
    <div class="grid g2"><label class="f">Code du formulaire<input class="in" data-m="id" value="${esc(d.id)}" placeholder="2033A, 2031, CA12…"></label><label class="f">Titre<input class="in" data-m="t" value="${esc(d.t)}" placeholder="2033-A-SD · Bilan simplifié"></label>
    <label class="f">Rubrique<select class="in" data-m="grp">${["Déclaration", "Liasse fiscale", "Crédits d'impôts", "Annexes", "Identification"].map(g => `<option ${d.grp === g ? "selected" : ""}>${g}</option>`).join("")}</select></label><label class="f">Fichier PDF<input type="file" accept="application/pdf" class="in" id="fdImpFile"></label></div>
    <div class="f">Types de société concernés<div class="row" style="flex-wrap:wrap;gap:10px">${Object.keys(FD_TREE).map(k => `<label class="small"><input type="checkbox" value="${k}" data-ch="fdImpReg" ${(d.reg || []).includes(k) ? "checked" : ""}> ${esc(FD_REG_LIB[k].split("·")[0])}${esc(FD_REG_LIB[k].split("·")[1] || "")}</label>`).join("")}</div></div>
    <label class="small"><input type="checkbox" data-m="erase" ${d.erase ? "checked" : ""}> Effacer les montants présents sous les cases détectées</label>`, cancelBtn + `<button class="btn pri" data-act="fdImpGo">Importer</button>`, true); }
  if (M && M.type === "fdField") { const d = M.d; return modalFrame("Case " + esc(d.i) + " · " + esc(fdTitle(d.id)), `<div class="grid g2"><label class="f">Code de la case<input class="in" data-m="ni" value="${esc(d.ni || d.i)}"></label><label class="f">Libellé<input class="in" data-m="l" value="${esc(d.l)}"></label></div>
    <label class="f">Formule de calcul (liée à la comptabilité)<input class="in mono" data-m="f" value="${esc(d.f)}" placeholder="${esc(fdAuto(d.id, { i: d.i, l: d.l }, fdCtx()) || "ex. SOLDE('706') ou T:S.nom")}"></label><p class="small muted" style="margin-top:-4px">Vide = correspondance d'origine. Exemples : <span class="mono">-SOLDE('70')</span>, <span class="mono">F('2050|BJ')+F('2050|CJ')</span>, <span class="mono">T:S.siren</span>.</p>
    <div class="grid g4"><label class="f">Gauche<input class="in" type="number" step="0.5" data-m="x" value="${d.x}"></label><label class="f">Haut<input class="in" type="number" step="0.5" data-m="y" value="${d.y}"></label><label class="f">Largeur<input class="in" type="number" step="0.5" data-m="w" value="${d.w}"></label><label class="f">Hauteur<input class="in" type="number" step="0.5" data-m="h" value="${d.h}"></label></div>
    <div class="grid g2"><label class="f">Alignement<select class="in" data-m="a"><option value="r" ${d.a !== "l" ? "selected" : ""}>Montant (à droite)</option><option value="l" ${d.a === "l" ? "selected" : ""}>Texte (à gauche)</option></select></label><label class="f">Type<select class="in" data-m="k"><option value="" ${!d.k ? "selected" : ""}>Saisie</option><option value="x" ${d.k === "x" ? "selected" : ""}>Case à cocher</option></select></label></div>`,
    `<button class="btn ghost" data-act="fdFieldDel" style="margin-right:auto">🗑 Supprimer la case</button>` + cancelBtn + `<button class="btn pri" data-act="fdFieldGo">Enregistrer</button>`, true); }
  return _rmFX.apply(this, arguments); };
/* ---------- modèles impôts intégrés aux modules TVA, 2572, DAS2 et ECF ---------- */
Object.entries(FD_EMB).forEach(([v, tab]) => { const _v = VIEWS[v]; if (!_v) return; VIEWS[v] = function () { if (UI.view !== v) return _v.apply(this, arguments); const E2 = UI.sub.fdEmb ||= {}; const m = E2[v] || "impot";
  const lib = { tva: "TVA · déclaration 3310-CA3", das2: "DAS2 · honoraires versés", ecf: "ECF · compte rendu de mission", s2572: "IS · relevé de solde 2572" }[tab];
  const sw = `<div class="fd-sw"><button class="${m === "impot" ? "on" : ""}" data-act="fdEmb" data-v="${v}" data-m="impot">📄 Modèle impôt (identique)</button><button class="${m !== "impot" ? "on" : ""}" data-act="fdEmb" data-v="${v}" data-m="speedix">✨ Modèle ${esc(brNomSafeFx())}</button></div>`;
  if (m !== "impot") { const h = _v.apply(this, arguments); return sw + h; }
  const st = fdSt(); if (st.tab !== tab) { st.tab = tab; st.form = null; } st.mode = "impot"; if (tab === "tva" && typeof fxPid === "function") { try { const p = fxPid(); if (p && p !== st.per) { st.per = p; UI._fdCtx = null; } } catch (e) { } }
  return `<div class="topbar"><div><div class="eyebrow">Fiscalité</div><h1>${esc(lib)}</h1><p class="lead">L'imprimé des impôts à l'identique, pré-rempli depuis la comptabilité ; chaque case reste modifiable. Le modèle ${esc(brNomSafeFx())} présente les mêmes informations avec les outils de travail habituels.</p></div></div>` + sw + fdBody(true); }; });
F2ACT.fdEmb = el => { (UI.sub.fdEmb ||= {})[el.dataset.v] = el.dataset.m; render(); };
/* ---------- menu Fiscalité ---------- */
(function () { const n = NAV2.find(x => x[0] === "tva"); if (!n) return; if (!n[2].includes("fdDecl")) n[2].unshift("fdDecl"); const d = Object.getOwnPropertyDescriptor(n, 3); if (d && d.get) { const g = d.get; Object.defineProperty(n, 3, { get() { const s = g() || []; return [["fdDecl", "Déclarations (modèles impôts)"]].concat(s.filter(x => x[0] !== "fdDecl")); }, enumerable: true, configurable: true }); } else { n[3] = (n[3] || []).filter(x => x[0] !== "fdDecl"); n[3].unshift(["fdDecl", "Déclarations (modèles impôts)"]); } })();
(function () { const st = document.createElement("style"); st.textContent = `
.fd-sw{display:inline-flex;border:1px solid var(--line,#E1EAE9);border-radius:12px;overflow:hidden;margin:0 0 12px;background:#fff}.fd-sw button{border:0;background:none;padding:9px 16px;font-weight:600;cursor:pointer;font-size:13.5px}.fd-sw button.on{background:#0F3D3E;color:#fff}.fd-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.fd-tabs button{border:1px solid var(--line,#E1EAE9);background:#fff;border-radius:99px;padding:7px 14px;font-weight:600;cursor:pointer}.fd-tabs button.on{background:#0F3D3E;color:#fff;border-color:#0F3D3E}
.fd-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#F4F7F7;border:1px solid var(--line,#E1EAE9);border-radius:12px;padding:8px 10px;margin-bottom:10px;position:sticky;top:0;z-index:5}.fd-sp{flex:1}.fd-sel{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#3A4A4A}
.fd-cohko{border-color:#D93025!important;color:#B3261E!important;background:#FDECEA!important}.fd-cohok{border-color:#1B7F5B!important;color:#0F5B3E!important;background:#E2F1EB!important}
.fd-mode{display:inline-flex;border:1px solid var(--line,#E1EAE9);border-radius:9px;overflow:hidden}.fd-mode button{border:0;background:#fff;padding:6px 11px;font-size:12.5px;cursor:pointer}.fd-mode button.on{background:#0F3D3E;color:#fff}.fd-zoom{display:inline-flex;align-items:center;gap:2px;font-size:12px}
.fd-dd{position:relative}.fd-dd>summary{list-style:none}.fd-dd>summary::-webkit-details-marker{display:none}.fd-ddm{position:absolute;z-index:20;top:110%;left:0;background:#fff;border:1px solid var(--line,#E1EAE9);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:6px;min-width:330px;display:flex;flex-direction:column}.fd-ddm button{border:0;background:none;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer}.fd-ddm button:hover{background:#F0F5F5}
.fd-wrap{display:grid;grid-template-columns:290px 1fr;gap:12px;align-items:start}.fd-tree{background:#fff;border:1px solid var(--line,#E1EAE9);border-radius:12px;padding:8px;position:sticky;top:60px;max-height:calc(100vh - 90px);overflow:auto}.fd-th{font-weight:700;padding:4px 6px 8px}
.fd-tg{margin-bottom:6px}.fd-tgh{display:flex;gap:6px;align-items:center;font-weight:600;font-size:13px;padding:3px 4px}.fd-ti{display:flex;gap:6px;align-items:center;padding:3px 4px 3px 22px;border-radius:7px;font-size:12.5px}.fd-ti.on{background:#E2F1EB}.fd-ti .lnk{text-align:left;flex:1;background:none;border:0;cursor:pointer;color:inherit;padding:0}.fd-ti.miss .lnk{color:#8A9696}
.fd-badge{background:#D93025;color:#fff;border-radius:99px;font-size:10.5px;padding:0 6px}.fd-miss{font-size:10px;background:#FFF4D6;color:#8A6100;border-radius:6px;padding:1px 5px}.fd-tf{padding:6px}
.fd-main{overflow:auto;max-height:calc(100vh - 90px);padding:4px 4px 30px;background:#E9EEEE;border-radius:12px}.fd-pgw{margin:10px auto 18px;width:max-content}.fd-pgl{font-size:12px;font-weight:600;color:#3A4A4A;margin:0 0 4px}
.fd-pg{position:relative;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.14)}.fd-pg>svg{position:absolute;inset:0}
.fd-in{position:absolute;box-sizing:border-box;border:0;background:transparent;padding:0 2px;margin:0;font-family:'Times New Roman',Tinos,'Liberation Serif',Times,serif;color:var(--fdval);text-align:left;outline:none;resize:none;line-height:1.1;overflow:hidden}.fd-in.num{text-align:right}.fd-in:hover{background:rgba(31,111,107,.08)}.fd-in:focus{background:var(--fdfo);box-shadow:inset 0 0 0 1px #2B6CB0}.fd-in.ovr{background:var(--fdhl)}.fd-in[readonly]{cursor:default}
.fd-ck{cursor:pointer;text-align:center!important;font-weight:700;padding:0}.fd-fe{position:absolute;box-sizing:border-box;border:1px dashed #2B6CB0;background:rgba(43,108,176,.12);font:9px ui-monospace,monospace;color:#1A4F8B;overflow:hidden;cursor:pointer}.fd-draw{position:absolute;border:1.5px solid #D93025;background:rgba(217,48,37,.1)}
.fd-edbar{margin:6px auto;width:max-content;background:#fff;border-radius:8px;padding:6px 10px}.fd-valid{background:#E2F1EB;color:#0F5B3E;border:1px solid #BFE0D1;border-radius:10px;padding:8px 12px;margin-bottom:8px;font-size:13px}
.fd-sx{padding:12px}.fd-sxh{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px;flex-wrap:wrap}.fd-sxh h2{margin:0}.fd-st td{vertical-align:middle}.fd-st input.num{text-align:right}.fd-st tr.ovr td{background:#FFFBEA}
.fd-sl{width:38%;font-size:13px}.fd-scs{display:flex;flex-wrap:nowrap;gap:8px;justify-content:flex-end}.fd-sc{display:flex;align-items:center;gap:4px}.fd-sc input{width:118px}.fd-sc.ovr input{background:#FFFBEA;border-color:#E8C55A}.fd-code{font:11px ui-monospace,monospace;background:#0F3D3E;color:#fff;border-radius:5px;padding:2px 5px}.fd-src{font-size:11px;border-radius:99px;padding:1px 8px}.fd-src.c{background:#E2F1EB;color:#0F5B3E}.fd-src.s{background:#FFF4D6;color:#8A6100}.fd-src.e{background:#EEF1F1;color:#6B7A7A}.fd-sck{border:1px solid var(--line,#E1EAE9);background:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}.fd-sck.on{background:#E2F1EB;border-color:#1B7F5B}
.fd-missc{padding:24px;max-width:640px;margin:20px auto}
@media(max-width:900px){.fd-wrap{grid-template-columns:1fr}.fd-tree{position:static;max-height:none}.fd-main{max-height:none}}
@media print{.fd-tree,.fd-bar,.fd-tabs,.topbar{display:none}}`; document.head.appendChild(st); })();
