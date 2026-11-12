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
const FX_PACK_OF = {};
[["is", "2065 2065B 2050 2051 2052 2053 2054 2054B 2055 2056 2057 2058A 2058AD 2058B 2058C 2059A 2059B 2059C 2059D 2059E 2059F 2059G 2069RCI FIDENTIF CA17 CA18 CA20 CA21 CALC219"],
 ["bnc", "2035 2035A 2035B 2035BD 2035E 2035F 2035G 2069RCI_B FIDENTIF_B"], ["sci", "2072 2072AN1 2072AN2 2072E 2069RCI_S FIDENTIF_S"], ["dec", "CA3 TIDENTIF 2572 PIDENTIF DAS2"]]
  .forEach(([p, l]) => l.split(" ").forEach(id => { FX_PACK_OF[id] = p; }));
const FX_MISSING = { "2031": "2031-SD · Bénéfices industriels et commerciaux", "2033A": "2033-A-SD · Bilan simplifié", "2033B": "2033-B-SD · Compte de résultat simplifié", "2033C": "2033-C-SD · Immobilisations, amortissements, plus-values", "2033D": "2033-D-SD · Provisions, amortissements dérogatoires, déficits", "2033E": "2033-E-SD · Effectifs et valeur ajoutée", "2033F": "2033-F-SD · Composition du capital", "2033G": "2033-G-SD · Filiales et participations", "CA12": "3517-S-SD · TVA régime simplifié (CA12)" };
const FX_L2050 = ["2050", "2051", "2052", "2053", "2054", "2054B", "2055", "2056", "2057", "2058A", "2058B", "2058C"];
const FX_L2059 = ["2059A", "2059B", "2059C", "2059D", "2059E", "2059F", "2059G"];
const FX_L2033 = ["2033A", "2033B", "2033C", "2033D", "2033E", "2033F", "2033G"];
const FX_TREE = {
  IS_RN: [["Déclaration", ["2065", "2065B"]], ["Liasse fiscale", FX_L2050.concat(FX_L2059)], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "2058AD", "CA17", "CA18", "CA20", "CA21", "CALC219"]]],
  IS_RS: [["Déclaration", ["2065", "2065B"]], ["Liasse fiscale", FX_L2033], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "CA17", "CA18", "CA20", "CA21", "CALC219"]]],
  BIC_RN: [["Déclaration", ["2031"]], ["Liasse fiscale", FX_L2050.concat(FX_L2059)], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF", "2058AD", "CA17", "CA18", "CA20", "CA21"]]],
  BIC_RS: [["Déclaration", ["2031"]], ["Liasse fiscale", FX_L2033], ["Crédits d'impôts", ["2069RCI"]], ["Annexes", ["FIDENTIF"]]],
  BNC: [["Déclaration", ["2035"]], ["Annexes", ["2035A", "2035B", "2035BD", "2035E", "2035F", "2035G"]], ["Crédits d'impôts", ["2069RCI_B"]], ["Identification", ["FIDENTIF_B"]]],
  SCI_IR: [["Déclaration", ["2072"]], ["Annexes", ["2072AN1", "2072AN2", "2072E"]], ["Crédits d'impôts", ["2069RCI_S"]], ["Identification", ["FIDENTIF_S"]]]
};
const FX_REG_LIB = { IS_RN: "Société à l'IS · réel normal (SARL, SAS, SA, SCI à l'IS)", IS_RS: "Société à l'IS · réel simplifié", BIC_RN: "BIC à l'IR · réel normal (EI, EURL, SNC)", BIC_RS: "BIC à l'IR · réel simplifié", BNC: "Professions libérales · BNC déclaration contrôlée", SCI_IR: "SCI à l'IR · revenus fonciers (2072)" };
const FX_TABS = [["liasse", "📑 Liasse et IS"], ["tva", "🧾 TVA"], ["s2572", "💶 Solde d'IS 2572"], ["das2", "🤝 DAS2"], ["ecf", "✅ ECF"], ["edi", "📡 Envoi EDI"], ["cfg", "⚙ Paramètres"]];
const FX_DEF = { zoom: 1.5, hl: true, hlColor: "#FFF3C4", focusColor: "#DCEBFF", valColor: "#0B1F5C", font: "", autoCoh: true, cohOnSave: true, autoGed: "ask", ediAuto: false, tolerance: 1, map: {}, coh: [], models: {}, showEmpty: true };
function fxCfg() { return Object.assign({}, FX_DEF, psRoot().fx || {}, S && S.fxCfg && S.fxCfg.on ? S.fxCfg.v || {} : {}); }
function fxCfgW() { if (S.fxCfg && S.fxCfg.on) { S.fxCfg.v ||= {}; return S.fxCfg.v; } const R = psRootW(); return R.fx ||= {}; }
function fxCfgSave() { if (S.fxCfg && S.fxCfg.on) Store.touch(); else if (typeof psAuto === "function") psAuto("fx", "Déclarations fiscales"); }
const fxSt = () => UI.sub.fx ||= { tab: "liasse", mode: "impot", form: null };
function fxReg() { const st = fxSt(); if (st.reg && FX_TREE[st.reg]) return st.reg; if (S.fxReg && FX_TREE[S.fxReg]) return S.fxReg; let d = typeof defaultLiasse === "function" ? defaultLiasse() : "IS_RS"; if (d === "SCI_IS") d = S.regimeIS === "RN" ? "IS_RN" : "IS_RS"; return FX_TREE[d] ? d : "IS_RN"; }
/* ---------- modèles : intégrés + importés ---------- */
function fxModels() { return fxCfg().models || {}; }
function fxForm(id) { const M = fxModels()[id]; if (M && M.p && M.p.length) return M; return FXT[id] || null; }
function fxTitle(id) { const M = fxModels()[id]; if (M && M.t) return M.t; if (FXT[id]) return FXT[id].t; if (FX_MISSING[id]) return FX_MISSING[id]; return id; }
function fxTree(reg) { const T = (FX_TREE[reg] || []).map(([g, L]) => [g, L.slice()]); const M = fxModels();
  Object.entries(M).forEach(([id, m]) => { if (!(m.reg || []).includes(reg)) return; if (T.some(([, L]) => L.includes(id))) return; let g = T.find(x => x[0] === (m.grp || "Annexes")); if (!g) { g = [m.grp || "Annexes", []]; T.push(g); } g[1].push(id); });
  return T; }
async function fxEnsure(ids) { const need = [...new Set(ids.filter(id => !fxModels()[id] && FX_PACK_OF[id] && !FXT_PACKS[FX_PACK_OF[id]]).map(id => FX_PACK_OF[id]))];
  for (const p of need) { try { await loadScript("js/fxt_" + p + ".js"); } catch (e) { UI.fxErr = "Modèles impôts indisponibles (" + p + ") : " + e.message; } }
  return need.length; }
/* ---------- instance de déclaration ---------- */
function fxInstKey() { const st = fxSt(); const ex = exCur(); if (st.tab === "tva") return "TVA:" + (st.per || (fxPers()[0] || {}).id); if (st.tab === "s2572") return "2572:" + ex.id; if (st.tab === "das2") return "DAS2:" + fxDasY(); if (st.tab === "ecf") return "ECF:" + ex.id; return "LIA:" + ex.id + ":" + fxReg(); }
function fxInst(k) { const D = S.fxd ||= {}; const I = D[k || fxInstKey()] ||= { v: {}, off: {}, hist: [] }; I.v ||= {}; I.off ||= {}; I.hist ||= []; return I; }
const fxPers = () => { try { return periodesTVA(exCur()); } catch (e) { return []; } };
const fxDasY = () => { const st = fxSt(); return st.y || (typeof f2Year === "function" ? f2Year() : exCur().fin.slice(0, 4)); };
function fxFormsOfTab() { const st = fxSt(); if (st.tab === "tva") { const p = fxPers().find(x => x.id === st.per) || fxPers()[0]; return [["Déclaration", [p && p.type === "CA12" ? "CA12" : "CA3"]], ["Paiement", ["TIDENTIF"]]]; }
  if (st.tab === "s2572") return [["Déclaration", ["2572"]], ["Paiement", ["PIDENTIF"]]]; if (st.tab === "das2") return [["Déclaration", ["DAS2"]]]; if (st.tab === "ecf") return [["Compte rendu", ["ECF"]]];
  return fxTree(fxReg()); }
function fxLog(I, act) { I.hist.unshift({ at: new Date().toISOString(), by: typeof xsMe === "function" ? xsMe() : "moi", act }); I.hist.length = Math.min(I.hist.length, 200); }
/* ---------- calcul des valeurs (liées à la comptabilité) ---------- */
const FX_FC = new Map();
function fxCompile(expr, names) { const k = names.join(",") + "§" + expr; let f = FX_FC.get(k); if (!f) { f = new Function(...names, '"use strict"; return (' + expr + ");"); FX_FC.set(k, f); } return f; }
function fxCtx() {
  if (UI._fxCtx && UI._fxCtx.k === fxInstKey() + "|" + E.length && Date.now() - UI._fxCtx.t < 4000) return UI._fxCtx;
  const st = fxSt(); const ex = exCur(); const reg = fxReg(); const ir = /^BIC|^BNC/.test(reg);
  let L = {}, base = {}; try { base = liasseCtx(ex, ir); L = liasseValues(ex, ir); } catch (e) { console.warn(e); }
  let isr = {}; try { isr = calcIS(ex); } catch (e) { }
  let per = null, tva = null; if (st.tab === "tva") { per = fxPers().find(x => x.id === st.per) || fxPers()[0]; try { tva = per ? calcTVA(per.from, per.to) : null; } catch (e) { } }
  let das = []; if (st.tab === "das2") { try { das = f2Das(fxDasY()).filter(g => g.incl); } catch (e) { } }
  const Fc = (() => { try { return cfgFiscal(); } catch (e) { return { isNormal: 25, isReduit: 15 }; } })();
  const C = { k: fxInstKey() + "|" + E.length, t: Date.now(), ex, reg, ir, base, L, isr, per, tva, das, Fc };
  C.names = Object.keys(base).filter(n => n !== "VALS").concat(["F", "L", "ISR", "TVA", "PER", "DAS", "EX", "S", "BASE_N", "BASE_R", "TXT", "DATE", "PCT"]);
  UI._fxCtx = C; return C;
}
const fxDate = d => d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "";
function fxEval(expr, C, Fget) {
  const txt = /^T:/.test(expr); const e = txt ? expr.slice(2) : expr;
  if (!txt && /^-?\d+([.,]\d+)?$/.test(e.trim())) return Math.round(parseFloat(e.replace(",", ".")) * 100);
  const b = C.base; const vals = C.names.map(n => n === "F" ? Fget : n === "L" ? (k => C.L[k] ?? 0) : n === "ISR" ? (k => C.isr[k] ?? 0) : n === "TVA" ? (k => { const t = C.tva || {}; if (/^c\d+$/.test(k)) return ((t.coll || {})[k.slice(1)] || {}).tva || 0; if (/^b\d+$/.test(k)) return ((t.coll || {})[k.slice(1)] || {}).base || 0; return t[k] ?? 0; }) : n === "PER" ? C.per || {} : n === "DAS" ? C.das : n === "EX" ? C.ex : n === "S" ? S
    : n === "BASE_N" ? Math.round((C.isr.isNormal || 0) * 100 / (C.Fc.isNormal || 25)) : n === "BASE_R" ? Math.round((C.isr.isReduit || 0) * 100 / (C.Fc.isReduit || 15)) : n === "TXT" ? (v => v == null ? "" : String(v)) : n === "DATE" ? fxDate : n === "PCT" ? (v => v + " %") : b[n]);
  try { const v = fxCompile(e, C.names)(...vals); if (txt) return v == null ? "" : String(v); if (typeof v === "boolean") return v; return v == null || isNaN(v) ? null : Math.round(v); } catch (err) { return { err: err.message }; }
}
function fxFields(id) { const f = fxForm(id); if (!f) return []; const out = []; f.p.forEach((p, pi) => p.F.forEach(x => out.push(Object.assign({ pg: pi }, x)))); return out; }
function fxAuto(id, f, C) { /* correspondances par défaut (codes de la liasse, identification) */
  const k = id + "|" + f.i; const m = (typeof FX_MAP !== "undefined" && FX_MAP[k]); if (m) return m;
  if (typeof FX_MAPF === "function") { const r = FX_MAPF(id, f, C); if (r) return r; }
  const L = C.L; const base = id.replace(/_[BS]$/, "");
  if (L[base + "|" + f.i] != null) return "L('" + base + "|" + f.i + "')";
  const mm = /^([A-Z0-9]{2})\.(\d)$/.exec(f.i); if (mm && L[base + "|" + mm[1] + "|c" + mm[2]] != null) return "L('" + base + "|" + mm[1] + "|c" + mm[2] + "')";
  return null;
}
function fxValues(id, I, C) { /* valeurs affichées : saisie > calcul */
  const fields = fxFields(id); const cfg = fxCfg(); const cache = {}; const stack = new Set(); const byK = {}; fields.forEach(f => { byK[id + "|" + f.i] = f; });
  const get = k => { if (k in cache) return cache[k]; if (k in I.v) return cache[k] = I.v[k]; if (stack.has(k)) return 0; stack.add(k);
    const fid = k.split("|")[0]; const f = byK[k] || (fid !== id ? fxFields(fid).find(x => fid + "|" + x.i === k) : null); let v = null;
    if (f) { const expr = cfg.map[k] || fxAuto(fid, f, C); if (expr) { v = fxEval(expr, C, get); if (v && typeof v === "object") v = null; } }
    stack.delete(k); return cache[k] = v; };
  const out = {}; fields.forEach(f => { const k = id + "|" + f.i; out[k] = get(k); }); out._get = get; return out;
}
/* ---------- formats ---------- */
const fxIsNum = f => f.a !== "l" && f.k !== "x";
function fxFmt(v, f) { if (v == null || v === "") return ""; if (f && f.k === "x") return v ? "X" : ""; if (typeof v === "number") { const e = Math.round(v / 100); if (!e && f && f.i && !fxCfg().zeros) return ""; return e.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " "); } return String(v); }
function fxParse(s, f) { s = String(s || "").trim(); if (!s) return null; if (!fxIsNum(f)) return s; const n = s.replace(/[\s\u202f\u00a0€]/g, "").replace(",", "."); if (/^-?\d+(\.\d+)?$/.test(n)) return Math.round(parseFloat(n) * 100); return s; }
/* ---------- rendu SVG du gabarit (identique à l'imprimé) ---------- */
const FX_FAM = ["'Times New Roman',Tinos,'Liberation Serif',Times,serif", "", "", "", "'DejaVu Sans',Arial,sans-serif", "Arial,Helvetica,'Liberation Sans',sans-serif"];
const FX_W = [400, 700, 400, 700, 400, 400, 700, 400, 700], FX_I = [0, 0, 1, 1, 0, 0, 0, 1, 1];
const fxFam = i => i < 4 ? FX_FAM[0] : i === 4 ? FX_FAM[4] : FX_FAM[5];
const FX_SVGC = new WeakMap();
function fxSvg(p) { let s = FX_SVGC.get(p); if (s) return s; const o = [];
  if (p.bg) o.push(`<image x="0" y="0" width="${p.w}" height="${p.h}" href="${p.bg}" preserveAspectRatio="none"/>`);
  for (const r of p.R || []) o.push(`<rect x="${r[0]}" y="${r[1]}" width="${Math.max(r[2], 0.3)}" height="${Math.max(r[3], 0.3)}" fill="${r[4] || "none"}"${r[5] ? ` stroke="${r[5]}" stroke-width="${r[6]}"` : ""}/>`);
  for (const l of p.L || []) o.push(l[0] === "p" ? `<polyline points="${l[1].map(q => q.join(",")).join(" ")}" fill="${l[3] || "none"}" stroke="${l[2] || "none"}" stroke-width="${l[4]}"/>` : `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${l[4]}" stroke-width="${l[5]}"/>`);
  for (const im of p.I || []) o.push(`<image x="${im[0]}" y="${im[1]}" width="${im[2]}" height="${im[3]}" href="${im[4]}"/>`);
  for (const e of p.T || []) { const [x, y, sz, f, tx, wd] = e; const c = e[6] || "#000"; const tl = wd && tx.length > 2 ? ` textLength="${wd}" lengthAdjust="spacingAndGlyphs"` : "";
    if (e[7]) { const m = e[7]; o.push(`<text transform="matrix(${m[0]},${-m[1]},${-m[2]},${m[3]},${x},${y})" font-size="${sz}" font-family="${fxFam(f)}" font-weight="${FX_W[f]}" fill="${c}">${esc(tx)}</text>`); }
    else o.push(`<text x="${x}" y="${y}" font-size="${sz}" font-family="${fxFam(f)}" font-weight="${FX_W[f]}"${FX_I[f] ? ' font-style="italic"' : ""} fill="${c}"${tl}>${esc(tx)}</text>`); }
  s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%">${o.join("")}</svg>`; FX_SVGC.set(p, s); return s; }
function fxValSvg(p, id, vals, pfx) { /* valeurs dessinées (impression) */
  const cfg = fxCfg(); const o = [];
  for (const f of p.F) { const v = vals[id + "|" + f.i + (pfx || "")]; const t = fxFmt(v, f); if (!t) continue; const fs = Math.min(f.s || 8.2, Math.max(5, f.h - 1.5));
    if (f.k === "x") { o.push(`<text x="${f.x + f.w / 2}" y="${f.y + f.h / 2 + fs * 0.35}" font-size="${fs}" text-anchor="middle" font-family="${FX_FAM[0]}" fill="#000">X</text>`); continue; }
    const r = typeof v === "number"; const lines = String(t).split("\n");
    lines.forEach((ln, i) => o.push(`<text x="${r ? f.x + f.w - 2 : f.x + 2}" y="${f.y + Math.min(f.h - 2, fs + 1) + i * (fs + 1)}" font-size="${fs}" text-anchor="${r ? "end" : "start"}" font-family="${cfg.font || FX_FAM[0]}" fill="#000">${esc(ln)}</text>`)); }
  return o.join(""); }
/* ---------- contrôles de cohérence ---------- */
function fxCoh(forms, I, C) {
  const out = []; const cfg = fxCfg(); const tol = (cfg.tolerance || 1) * 100; const V = {};
  forms.forEach(id => { if (fxForm(id)) Object.assign(V, fxValues(id, I, C)); });
  const g = k => { const v = V[k] !== undefined ? V[k] : (I.v[k] !== undefined ? I.v[k] : null); return typeof v === "number" ? v : 0; };
  const has = k => V[k] !== undefined;
  const eq = (a, b, lib, goto) => { if (!has(a) && !has(b)) return; const d = g(a) - g(b); if (Math.abs(d) > tol) out.push({ lib, det: fxFmt(g(a), {}) + " ≠ " + fxFmt(g(b), {}) + " (écart " + fxFmt(d, {}) + ")", goto: goto || a.split("|")[0] }); };
  (typeof FX_COH !== "undefined" ? FX_COH : []).forEach(r => { try { if (r.forms && !r.forms.every(f => forms.includes(f))) return; const m = r.fn(g, has, C, I, k => V[k] !== undefined ? V[k] : I.v[k]); if (m) out.push(Object.assign({ goto: r.forms ? r.forms[0] : forms[0], lib: r.lib }, typeof m === "object" ? m : { det: m })); } catch (e) { } });
  (cfg.coh || []).forEach(r => { if (!r.a || !r.b) return; const b = /^[\d.,-]+$/.test(r.b) ? null : r.b; if (b) eq(r.a, b, r.lib || "Contrôle personnalisé"); else { const d = g(r.a) - Math.round(parseFloat(String(r.b).replace(",", ".")) * 100); if (Math.abs(d) > tol) out.push({ lib: r.lib || "Contrôle personnalisé", det: r.a + " = " + fxFmt(g(r.a), {}), goto: r.a.split("|")[0] }); } });
  forms.forEach(id => fxFields(id).forEach(f => { const v = I.v[id + "|" + f.i]; if (fxIsNum(f) && v != null && typeof v !== "number") out.push({ lib: "Saisie non numérique", det: fxTitle(id) + " · case " + f.i + " : « " + v + " »", goto: id, key: id + "|" + f.i }); }));
  return out;
}
/* ---------- vue principale ---------- */
VIEWS.fxDecl = () => {
  const st = fxSt(); const cfg = fxCfg(); const ex = exCur();
  if (st.tab === "cfg") return fxHead() + fxCfgView();
  if (st.tab === "edi") return fxHead() + fxEdiView();
  const tree = fxFormsOfTab(); const ids = tree.flatMap(x => x[1]);
  const pending = ids.filter(id => !fxModels()[id] && FX_PACK_OF[id] && !FXT_PACKS[FX_PACK_OF[id]]);
  if (pending.length) { if (!UI._fxLoading) { UI._fxLoading = 1; fxEnsure(ids).then(() => { UI._fxLoading = 0; if (UI.view === "fxDecl") render(); }); } return fxHead() + `<div class="card empty">${UI.fxErr ? esc(UI.fxErr) : "Chargement des modèles des impôts…"}</div>`; }
  if (!st.form || !ids.includes(st.form)) st.form = ids.find(id => fxForm(id)) || ids[0];
  const I = fxInst(); const C = fxCtx(); const valid = I.valid;
  const coh = fxCoh(ids.filter(id => !I.off[id]), I, C); UI._fxCoh = coh;
  const fid = st.form; const F = fxForm(fid);
  const treeH = tree.map(([g, L]) => { const all = L.every(id => !I.off[id]); return `<div class="fx-tg"><label class="fx-tgh"><input type="checkbox" ${all ? "checked" : ""} data-ch="fxOffG" data-l="${esc(L.join(","))}" ${valid ? "disabled" : ""}><span>📁 ${esc(g)}</span></label>${L.map(id => { const miss = !fxForm(id); const n = coh.filter(c => c.goto === id).length; return `<div class="fx-ti ${id === fid ? "on" : ""} ${miss ? "miss" : ""}"><input type="checkbox" ${!I.off[id] ? "checked" : ""} data-ch="fxOff" data-id="${id}" ${valid ? "disabled" : ""} title="Inclure ce formulaire dans la déclaration"><button class="lnk" data-act="fxGo" data-id="${id}">${esc(fxTitle(id))}</button>${n ? `<span class="fx-badge" title="${n} anomalie(s)">${n}</span>` : ""}${miss ? '<span class="fx-miss" title="Modèle à importer">à importer</span>' : ""}</div>`; }).join("")}</div>`; }).join("");
  const regSel = st.tab === "liasse" ? `<label class="fx-sel">Type de société <select class="in sm" data-ch="fxReg">${Object.keys(FX_TREE).map(k => `<option value="${k}" ${k === fxReg() ? "selected" : ""}>${esc(FX_REG_LIB[k])}</option>`).join("")}</select></label>` : st.tab === "tva" ? `<label class="fx-sel">Période <select class="in sm" data-ch="fxPer">${fxPers().map(p => `<option value="${p.id}" ${p.id === (st.per || (fxPers()[0] || {}).id) ? "selected" : ""}>${esc(p.lib)}</option>`).join("")}</select></label>` : st.tab === "das2" ? `<label class="fx-sel">Année <input class="in sm" style="width:80px" data-ch="fxY" value="${esc(fxDasY())}"></label>` : `<span class="fx-sel">Exercice ${esc(fxDate(ex.debut))} – ${esc(fxDate(ex.fin))}</span>`;
  const bar = `<div class="fx-bar"><details class="fx-dd"><summary class="btn sm">Actions ▾</summary><div class="fx-ddm">
      <button data-act="fxResetForm">↺ Réinitialiser les saisies de ce formulaire</button><button data-act="fxResetAll">↺ Réinitialiser toute la déclaration</button><button data-act="fxN1">⤵ Reprendre les informations de l'exercice précédent</button>
      <button data-act="fxCsv">⇩ Exporter les données (CSV)</button><button data-act="fxJson">⇩ Exporter les données (fichier EDI préparatoire)</button><button data-act="fxImpModel">⇧ Importer un nouveau modèle (PDF)</button><button data-act="fxHist">🕘 Historique des actions</button></div></details>
    <button class="btn sm" data-act="fxSave">💾 Enregistrer</button><button class="btn sm" data-act="fxPrint">🖨 Impression</button>
    ${valid ? `<button class="btn sm" data-act="fxUnvalid" title="Validée le ${esc(fxDate(valid.at.slice(0, 10)))} par ${esc(valid.by)}">🔓 Dévalider</button>` : `<button class="btn sm pri" data-act="fxValid">✔ Valider</button>`}
    <button class="btn sm ${coh.length ? "fx-cohko" : "fx-cohok"}" data-act="fxCohOpen">Cohérences (${coh.length})</button><button class="btn sm" data-act="fxCalc">⟳ Calculer</button>
    <span class="fx-sp"></span>${regSel}
    <div class="fx-mode"><button class="${st.mode !== "speedix" ? "on" : ""}" data-act="fxMode" data-m="impot">Modèle impôt</button><button class="${st.mode === "speedix" ? "on" : ""}" data-act="fxMode" data-m="speedix">Modèle ${esc(brNomSafeFx())}</button></div>
    <span class="fx-zoom"><button class="btn sm ghost" data-act="fxZoom" data-d="-1">−</button>${Math.round((st.zoom || cfg.zoom) * 100 / 1.5)} %<button class="btn sm ghost" data-act="fxZoom" data-d="1">+</button></span></div>`;
  let body;
  if (!F) body = fxMissingCard(fid);
  else if (st.mode === "speedix") body = fxSpeedix(fid, F, I, C);
  else body = fxPages(fid, F, I, C);
  const banner = valid ? `<div class="fx-valid">✔ Déclaration validée le ${esc(fxDate(valid.at.slice(0, 10)))} par ${esc(valid.by)} — les cases sont verrouillées.${I.edi && I.edi.st ? " · Envoi EDI : " + esc(FX_EDI_ST[I.edi.st] || I.edi.st) : ""}</div>` : "";
  return fxHead() + banner + bar + `<div class="fx-wrap"><aside class="fx-tree"><div class="fx-th">📂 Documents</div>${treeH}<div class="fx-tf small muted">Cochez les formulaires à déposer ; décochez ceux qui ne concernent pas la société (ils ne sont ni imprimés ni envoyés).</div></aside><main class="fx-main" id="fxMain">${body}</main></div>`;
};
const brNomSafeFx = () => typeof brNom === "function" ? brNom() : "Speedix";
function fxHead() { const st = fxSt(); return `<div class="topbar"><div><div class="eyebrow">Fiscalité</div><h1>Déclarations fiscales</h1><p class="lead">Les imprimés des impôts reproduits à l'identique, pré-remplis depuis la comptabilité. Chaque case reste modifiable ; les contrôles de cohérence signalent les écarts avant l'envoi.</p></div></div>
  <div class="fx-tabs">${FX_TABS.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="fxTab" data-t="${k}">${l}</button>`).join("")}</div>`; }
function fxMissingCard(id) { return `<div class="card fx-missc"><h3>${esc(fxTitle(id))}</h3><p>Ce modèle n'est pas encore installé. Importez l'imprimé (PDF officiel vierge téléchargé sur impots.gouv.fr, ou une édition de votre logiciel fiscal) : il sera reproduit à l'identique et ses cases seront détectées automatiquement, puis reliées à la comptabilité.</p><button class="btn pri" data-act="fxImpModel" data-id="${esc(id)}">⇧ Importer le modèle ${esc(id)}</button></div>`; }
function fxPages(id, F, I, C) {
  const st = fxSt(); const cfg = fxCfg(); const z = st.zoom || cfg.zoom; const vals = fxValues(id, I, C); const lock = !!I.valid; const ed = st.edit && isAdmin();
  const pages = fxPageList(id, F, I, C);
  return pages.map(({ p, pi, sfx, lib }) => `<div class="fx-pgw" id="fxp-${id}-${pi}${sfx ? "-" + sfx.slice(1) : ""}">${lib ? `<div class="fx-pgl">${esc(lib)}</div>` : ""}<div class="fx-pg ${ed ? "fx-edit" : ""}" style="width:${p.w * z}px;height:${p.h * z}px;--fxz:${z};--fxhl:${cfg.hlColor};--fxfo:${cfg.focusColor};--fxval:${cfg.valColor}" data-pg="${pi}" data-id="${id}">${fxSvg(p)}${p.F.map(f => {
    const k = id + "|" + f.i + (sfx || ""); const v = sfx ? (k in I.v ? I.v[k] : (vals._rep ? vals._rep(k) : null)) : vals[id + "|" + f.i]; const ovr = k in I.v; const fs = Math.min(f.s || 8.2, Math.max(5, f.h - 1.5)) * z;
    const sty = `left:${f.x * z}px;top:${f.y * z}px;width:${f.w * z}px;height:${f.h * z}px;font-size:${fs}px;${cfg.font ? "font-family:" + cfg.font + ";" : ""}`;
    const tip = esc((f.l ? f.l + " · " : "") + "case " + f.i + (ovr ? " · saisie manuelle" : v != null && v !== "" ? " · calculée depuis la comptabilité" : ""));
    if (ed) return `<div class="fx-fe" style="${sty}" data-act="fxFieldEd" data-id="${id}" data-i="${esc(f.i)}" data-pg="${pi}" title="${tip}">${esc(f.i)}</div>`;
    if (f.k === "x") return `<button class="fx-in fx-ck ${ovr && cfg.hl ? "ovr" : ""}" style="${sty}" data-act="fxCk" data-k="${esc(k)}" ${lock ? "disabled" : ""} title="${tip}">${v ? "X" : ""}</button>`;
    const tag = f.h > 22 && !fxIsNum(f) ? "textarea" : "input";
    return `<${tag} class="fx-in ${ovr && cfg.hl ? "ovr" : ""} ${typeof v === "number" ? "num" : ""}" style="${sty}" data-ch="fxV" data-k="${esc(k)}" ${tag === "input" ? `value="${esc(fxFmt(v, f))}"` : ""} ${lock ? "readonly" : ""} title="${tip}" aria-label="${tip}">${tag === "textarea" ? esc(fxFmt(v, f)) + "</textarea>" : ""}`;
  }).join("")}</div></div>`).join("") + (isAdmin() ? `<div class="fx-edbar"><label class="small"><input type="checkbox" ${st.edit ? "checked" : ""} data-ch="fxEdit"> Mode édition des cases (déplacer, renommer, relier à la comptabilité, ajouter)</label>${st.edit ? '<span class="small muted"> · cliquez une case pour la modifier ; maintenez Maj et cliquez-glissez sur la page pour en dessiner une nouvelle.</span>' : ""}</div>` : "");
}
function fxPageList(id, F, I, C) { const out = F.p.map((p, pi) => ({ p, pi, sfx: "" }));
  if (typeof FX_REPEAT === "function") { const r = FX_REPEAT(id, F, I, C); if (r) return r; }
  return out; }
/* ---------- modèle Speedix (présentation moderne, mêmes données) ---------- */
function fxSpeedix(id, F, I, C) {
  const st = fxSt(); const vals = fxValues(id, I, C); const q = (st.q || "").toLowerCase(); const lock = !!I.valid;
  const pages = fxPageList(id, F, I, C);
  const rows = pages.map(({ p, pi, sfx, lib }) => { const R = p.F.filter(f => !q || (f.l || "").toLowerCase().includes(q) || (f.n || "").toLowerCase().includes(q) || f.i.toLowerCase().includes(q));
    const G = []; R.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(f => { const g = G.find(x => Math.abs(x.y - f.y) < 3); if (g) g.F.push(f); else G.push({ y: f.y, F: [f] }); });
    const list = G.map(g => { let any = false; const cells = g.F.sort((a, b) => a.x - b.x).map(f => { const k = id + "|" + f.i + (sfx || ""); const v = sfx ? (k in I.v ? I.v[k] : (vals._rep ? vals._rep(k) : null)) : vals[id + "|" + f.i]; const ovr = k in I.v; if (v != null && v !== "") any = true;
        const code = /^z|^p\d+\.z|^N[a-z0-9]{4}$/.test(f.i) ? "" : f.i.replace(/^p\d+\./, "");
        const inp = f.k === "x" ? `<button class="fx-sck ${v ? "on" : ""}" data-act="fxCk" data-k="${esc(k)}" ${lock ? "disabled" : ""}>${v ? "✔ Oui" : "Non"}</button>` : `<input class="in sm ${typeof v === "number" || (fxIsNum(f) && !/[a-z]/i.test(f.n || "")) ? "num" : ""}" data-ch="fxV" data-k="${esc(k)}" value="${esc(fxFmt(v, f))}" ${lock ? "readonly" : ""} title="${esc(f.n || f.l || "")}">`;
        return `<div class="fx-sc ${ovr ? "ovr" : ""}">${code ? `<span class="fx-code">${esc(code)}</span>` : ""}${inp}${ovr ? `<button class="btn sm ghost" data-act="fxUnset" data-k="${esc(k)}" title="Revenir au calcul">↺</button>` : ""}</div>`; }).join("");
      if (st.only && !any) return ""; const lab = (g.F.find(f => f.l) || {}).l || (g.F[0].n || "—");
      return `<tr><td class="fx-sl">${esc(lab)}</td><td><div class="fx-scs">${cells}</div></td></tr>`; }).join("");
    return list ? `<section class="panel"><div class="panel-h"><h2>${esc(lib || (F.p.length > 1 ? fxTitle(id) + " · page " + (pi + 1) : fxTitle(id)))}</h2></div><div class="panel-b"><table class="t fx-st"><tbody>${list}</tbody></table></div></section>` : ""; }).join("");
  return `<div class="fx-sx"><div class="fx-sxh"><div><h2>${esc(fxTitle(id))}</h2><p class="small muted">Présentation ${esc(brNomSafeFx())} du même formulaire : les montants saisis ici et sur le modèle impôt sont les mêmes.</p></div><div class="row"><input class="in sm" placeholder="Rechercher une rubrique ou une case…" data-ch="fxQ" value="${esc(st.q || "")}"><label class="small"><input type="checkbox" ${st.only ? "checked" : ""} data-ch="fxOnly"> Cases remplies uniquement</label></div></div>${rows || '<div class="card empty">Aucune rubrique.</div>'}</div>`;
}
/* ---------- impression (PDF identique) ---------- */
async function fxPagePng(p, valSvg, scale) {
  const svg = fxSvg(p).replace("</svg>", valSvg + "</svg>").replace('style="display:block;width:100%;height:100%"', `width="${p.w * scale}" height="${p.h * scale}"`);
  const img = new Image(); const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await new Promise((ok, ko) => { img.onload = ok; img.onerror = () => ko(new Error("Rendu de la page impossible")); img.src = url; });
  const cv = document.createElement("canvas"); cv.width = Math.round(p.w * scale); cv.height = Math.round(p.h * scale); const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}
async function fxBuildPdf(ids, I, C) {
  const pdf = new MiniPDF(); let first = true;
  for (const id of ids) { const F = fxForm(id); if (!F) continue; const vals = fxValues(id, I, C);
    for (const { p, sfx } of fxPageList(id, F, I, C)) {
      const vv = sfx ? new Proxy(vals, { get: (o, k) => (typeof k === "string" && k.endsWith(sfx) ? (k in I.v ? I.v[k] : (o._rep ? o._rep(k) : null)) : o[k]) }) : vals;
      const cv = await fxPagePng(p, fxValSvg(p, id, vv, sfx), 1.9); const b64 = cv.toDataURL("image/jpeg", 0.8).split(",")[1]; const bin = atob(b64);
      if (!first) pdf.addPage(); first = false; pdf.image(0, 0, pdf.W, pdf.H, { bin, w: cv.width, h: cv.height }); } }
  return pdf.output();
}
/* ---------- envoi EDI (préparation, suivi) ---------- */
const FX_EDI_ST = { prep: "Préparé", sent: "Transmis au partenaire EDI", ok: "Accepté (accusé de réception)", ko: "Rejeté — à corriger" };
function fxEdiView() { const D = S.fxd || {}; const rows = Object.entries(D).filter(([k, I]) => I.valid || I.edi).map(([k, I]) => { const [t, a, b] = k.split(":"); const lib = t === "LIA" ? "Liasse " + (FX_REG_LIB[b] || b).split("·")[0] + " · " + a.replace("EX", "") : t === "TVA" ? "TVA " + a : t === "2572" ? "Relevé de solde 2572 · " + a.replace("EX", "") : t === "DAS2" ? "DAS2 " + a : "ECF " + a.replace("EX", "");
    const e = I.edi || {}; return `<tr><td>${esc(lib)}</td><td>${I.valid ? "✔ " + esc(fxDate(I.valid.at.slice(0, 10))) : "—"}</td><td><select class="in sm" data-ch="fxEdiSt" data-k="${esc(k)}"><option value="">Non envoyé</option>${Object.entries(FX_EDI_ST).map(([v, l]) => `<option value="${v}" ${e.st === v ? "selected" : ""}>${l}</option>`).join("")}</select></td><td class="small">${e.at ? esc(fxDate(e.at.slice(0, 10))) : ""}</td><td><input class="in sm" placeholder="N° de dépôt / référence" data-ch="fxEdiRef" data-k="${esc(k)}" value="${esc(e.ref || "")}"></td></tr>`; }).join("");
  const cfg = fxCfg();
  return `<section class="panel"><div class="panel-h"><h2>📡 Envoi automatique des déclarations (EDI)</h2></div><div class="panel-b"><p class="small" style="margin-top:0">Le dépôt dématérialisé des liasses (EDI-TDFC), de la TVA (EDI-TVA) et des paiements passe par un <b>partenaire EDI agréé</b> par la DGFiP (portail déclaratif de l'expert-comptable, OGA, éditeur agréé). ${esc(brNomSafeFx())} prépare et contrôle les données, produit les imprimés identiques et le fichier préparatoire ; la transmission se fait par votre partenaire, puis vous suivez ici le statut et l'accusé de réception.</p>
  <div class="grid g3"><label class="f">Préparer automatiquement le fichier à la validation<select class="in" data-ch="fxCfgB" data-k="ediAuto"><option value="1" ${cfg.ediAuto ? "selected" : ""}>Oui</option><option value="" ${!cfg.ediAuto ? "selected" : ""}>Non</option></select></label><label class="f">Partenaire EDI<input class="in" data-ch="fxCfgT" data-k="ediPart" value="${esc(cfg.ediPart || "")}" placeholder="Nom du partenaire / portail"></label><label class="f">Lien du portail de dépôt<input class="in" data-ch="fxCfgT" data-k="ediUrl" value="${esc(cfg.ediUrl || "")}" placeholder="https://…"></label></div>${cfg.ediUrl ? `<a class="btn" href="${esc(cfg.ediUrl)}" target="_blank" rel="noopener">Ouvrir le portail de dépôt ↗</a>` : ""}</div></section>
  <section class="panel"><div class="panel-h"><h2>Suivi des déclarations validées</h2></div><div class="panel-b">${rows ? `<table class="t"><thead><tr><th>Déclaration</th><th>Validée</th><th>Statut d'envoi</th><th>Date</th><th>Référence</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="small muted">Aucune déclaration validée pour l\'instant. Validez une déclaration pour la préparer à l\'envoi.</div>'}</div></section>`; }
/* ---------- paramètres ---------- */
function fxCfgView() { const cfg = fxCfg(); const sc = S.fxCfg && S.fxCfg.on; const M = fxModels();
  const yn = (k, l) => `<label class="f">${l}<select class="in" data-ch="fxCfgB" data-k="${k}"><option value="1" ${cfg[k] ? "selected" : ""}>Oui</option><option value="" ${!cfg[k] ? "selected" : ""}>Non</option></select></label>`;
  const col = (k, l) => `<label class="f">${l}<input type="color" class="in" data-ch="fxCfgT" data-k="${k}" value="${esc(cfg[k])}"></label>`;
  const maps = Object.entries(cfg.map || {}); const cohs = cfg.coh || [];
  return `<section class="panel"><div class="panel-h"><h2>⚙ Paramètres des déclarations</h2><div class="row"><label class="small"><input type="radio" name="fxsc" ${!sc ? "checked" : ""} data-ch="fxScope" value=""> Tous les dossiers</label><label class="small"><input type="radio" name="fxsc" ${sc ? "checked" : ""} data-ch="fxScope" value="1"> Ce dossier uniquement</label></div></div><div class="panel-b"><div class="grid g4">
    <label class="f">Zoom par défaut<select class="in" data-ch="fxCfgN" data-k="zoom">${[1, 1.25, 1.5, 1.75, 2].map(z => `<option value="${z}" ${cfg.zoom == z ? "selected" : ""}>${Math.round(z * 100 / 1.5)} %</option>`).join("")}</select></label>
    ${col("hlColor", "Couleur des cases saisies à la main")}${col("focusColor", "Couleur de la case active")}${col("valColor", "Couleur des montants à l'écran")}
    <label class="f">Police des montants<select class="in" data-ch="fxCfgT" data-k="font"><option value="">Identique à l'imprimé (Times)</option>${["Arial", "Helvetica", "Courier New", "Verdana"].map(f => `<option ${cfg.font === f ? "selected" : ""}>${f}</option>`).join("")}</select></label>
    ${yn("hl", "Surligner les cases modifiées à la main")}${yn("zeros", "Afficher les montants nuls (0)")}${yn("cohOnSave", "Contrôler les cohérences à l'enregistrement")}${yn("autoCoh", "Bloquer la validation s'il reste des anomalies")}
    <label class="f">Après l'impression, enregistrer dans la GED<select class="in" data-ch="fxCfgT" data-k="autoGed">${[["ask", "Demander"], ["auto", "Oui, automatiquement"], ["never", "Non"]].map(([v, l]) => `<option value="${v}" ${cfg.autoGed === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Tolérance des contrôles (€)<input class="in" type="number" min="0" data-ch="fxCfgN" data-k="tolerance" value="${cfg.tolerance}"></label></div></div></section>
  <section class="panel"><div class="panel-h"><h2>🔗 Correspondances avec la comptabilité</h2><button class="btn sm" data-act="fxMapAdd">＋ Ajouter</button></div><div class="panel-b"><p class="small muted" style="margin-top:0">Chaque case peut recevoir sa propre formule. Exemple : <span class="mono">SOLDE('706')</span>, <span class="mono">-SOLDE('70')</span>, <span class="mono">F('2050|BJ') + F('2050|CJ')</span>, <span class="mono">T:S.nom</span> pour un texte. Fonctions : ${FORMULA_HELP.map(h => `<span class="mono">${esc(h[0])}</span>`).join(", ")}, <span class="mono">F('formulaire|case')</span>, <span class="mono">ISR('rf')</span>, <span class="mono">TVA('due')</span>.</p>
    ${maps.length ? `<table class="t"><thead><tr><th>Case (formulaire|case)</th><th>Formule</th><th></th></tr></thead><tbody>${maps.map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td><input class="in sm mono" data-ch="fxMapV" data-k="${esc(k)}" value="${esc(v)}"></td><td><button class="btn sm ghost" data-act="fxMapDel" data-k="${esc(k)}">✕</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Aucune formule personnalisée : les correspondances d\'origine s\'appliquent. En mode édition des cases, cliquez une case pour lui donner une formule.</div>'}</div></section>
  <section class="panel"><div class="panel-h"><h2>✓ Contrôles de cohérence personnalisés</h2><button class="btn sm" data-act="fxCohAdd">＋ Ajouter</button></div><div class="panel-b">${cohs.length ? `<table class="t"><thead><tr><th>Libellé</th><th>Case A</th><th>doit être égale à (case ou montant)</th><th></th></tr></thead><tbody>${cohs.map((r, i) => `<tr><td><input class="in sm" data-ch="fxCohV" data-i="${i}" data-f="lib" value="${esc(r.lib || "")}"></td><td><input class="in sm mono" data-ch="fxCohV" data-i="${i}" data-f="a" value="${esc(r.a || "")}" placeholder="2050|CO"></td><td><input class="in sm mono" data-ch="fxCohV" data-i="${i}" data-f="b" value="${esc(r.b || "")}" placeholder="2051|EE"></td><td><button class="btn sm ghost" data-act="fxCohDel" data-i="${i}">✕</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Les contrôles d\'origine (totaux, équilibre bilan, résultat, IS, TVA) sont toujours actifs. Ajoutez ici vos propres contrôles.</div>'}</div></section>
  <section class="panel"><div class="panel-h"><h2>📥 Modèles importés (nouveaux millésimes, autres imprimés)</h2><button class="btn sm pri" data-act="fxImpModel">⇧ Importer un modèle</button></div><div class="panel-b">${Object.keys(M).length ? `<table class="t"><thead><tr><th>Code</th><th>Titre</th><th>Types de société</th><th>Rubrique</th><th>Pages</th><th></th></tr></thead><tbody>${Object.entries(M).map(([id, m]) => `<tr><td class="mono">${esc(id)}</td><td><input class="in sm" data-ch="fxModT" data-id="${esc(id)}" value="${esc(m.t || "")}"></td><td class="small">${(m.reg || []).join(", ") || "—"}</td><td class="small">${esc(m.grp || "Annexes")}</td><td>${(m.p || []).length}</td><td><button class="btn sm ghost" data-act="fxModDel" data-id="${esc(id)}">🗑</button></td></tr>`).join("")}</tbody></table>` : '<div class="small muted">Aucun modèle importé. Un modèle importé avec le même code qu\'un modèle d\'origine (ex. 2050) le remplace : c\'est ainsi que l\'on passe au millésime suivant.</div>'}
  <div class="row" style="margin-top:10px"><button class="btn sm" data-act="fxCfgExp">⇩ Exporter les paramètres</button><label class="btn sm">⇧ Importer des paramètres<input type="file" accept=".json" hidden data-ch="fxCfgImp"></label></div></div></section>`; }
/* ---------- import d'un nouveau modèle (PDF) ---------- */
async function fxImportPdf(file, d) {
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
function fxSetVal(k, v) { const I = fxInst(); if (I.valid) return toast("Déclaration validée : dévalidez-la pour modifier."); if (v == null || v === "") { if (k in I.v) I.v[k] = null; else I.v[k] = null; } else I.v[k] = v; Store.touch(); }
Object.assign(F2ACT, {
  fxTab: el => { fxSt().tab = el.dataset.t; fxSt().form = null; render(); },
  fxGo: el => { fxSt().form = el.dataset.id; render(); const m = $("#fxMain"); if (m) m.scrollTop = 0; },
  fxMode: el => { fxSt().mode = el.dataset.m; render(); },
  fxZoom: el => { const st = fxSt(); const z = st.zoom || fxCfg().zoom; st.zoom = Math.max(0.75, Math.min(3, Math.round((z + 0.25 * +el.dataset.d) * 100) / 100)); render(); },
  fxCk: el => { const k = el.dataset.k; const I = fxInst(); if (I.valid) return; const cur = el.textContent.trim() === "X" || /Oui/.test(el.textContent); fxSetVal(k, !cur); render(); },
  fxUnset: el => { const I = fxInst(); delete I.v[el.dataset.k]; Store.touch(); render(); },
  fxSave: () => { const I = fxInst(); fxLog(I, "Enregistrement"); Store.touch(); const n = (UI._fxCoh || []).length; toast(fxCfg().cohOnSave && n ? "Enregistré · " + n + " anomalie(s) de cohérence à vérifier." : "Déclaration enregistrée."); render(); },
  fxCalc: () => { UI._fxCtx = null; const I = fxInst(); fxLog(I, "Calcul depuis la comptabilité"); toast("Montants recalculés depuis la comptabilité (vos saisies manuelles sont conservées)."); render(); },
  fxResetForm: () => { const st = fxSt(); confirmBox("Réinitialiser le formulaire", "Les saisies manuelles de « " + fxTitle(st.form) + " » seront supprimées et les montants recalculés depuis la comptabilité.", "Réinitialiser", () => { const I = fxInst(); Object.keys(I.v).filter(k => k.startsWith(st.form + "|")).forEach(k => delete I.v[k]); fxLog(I, "Réinitialisation " + st.form); Store.touch(); closeModal(); }, true); },
  fxResetAll: () => confirmBox("Réinitialiser la déclaration", "Toutes les saisies manuelles de cette déclaration seront supprimées.", "Réinitialiser", () => { const I = fxInst(); I.v = {}; I.off = {}; fxLog(I, "Réinitialisation complète"); Store.touch(); closeModal(); }, true),
  fxN1: () => { const ex = exCur(); const pv = prevEx(ex); if (!pv) return toast("Aucun exercice précédent."); const k0 = fxInstKey().replace(ex.id, pv.id); const P = (S.fxd || {})[k0]; if (!P) return toast("Aucune déclaration sur l'exercice précédent."); const I = fxInst(); let n = 0; Object.entries(P.v).forEach(([k, v]) => { if (typeof v === "string" && !(k in I.v)) { I.v[k] = v; n++; } }); fxLog(I, "Reprise N-1 (" + n + " textes)"); Store.touch(); toast(n + " information(s) reprise(s) de l'exercice précédent (textes, identification)."); render(); },
  fxValid: () => { const coh = UI._fxCoh || []; const I = fxInst(); if (coh.length && fxCfg().autoCoh) return openModal({ type: "fxCoh", block: true }); I.valid = { at: new Date().toISOString(), by: typeof xsMe === "function" ? xsMe() : "moi" }; fxLog(I, "Validation"); if (fxCfg().ediAuto) { I.edi = { st: "prep", at: new Date().toISOString() }; fxLog(I, "Fichier EDI préparé"); } Store.touch(); toast("Déclaration validée."); render(); },
  fxUnvalid: () => confirmBox("Dévalider la déclaration", "Les cases redeviennent modifiables. L'historique conserve la trace de cette action.", "Dévalider", () => { const I = fxInst(); delete I.valid; fxLog(I, "Dévalidation"); Store.touch(); closeModal(); }),
  fxCohOpen: () => openModal({ type: "fxCoh" }),
  fxCohGo: el => { fxSt().form = el.dataset.id; closeModal(); },
  fxHist: () => openModal({ type: "fxHist" }),
  fxPrint: () => openModal({ type: "fxPrint", d: { what: "checked" } }),
  fxPrintGo: async () => { const M = UI.modal; const what = (M.d || {}).what; const st = fxSt(); const I = fxInst(); const C = fxCtx(); const tree = fxFormsOfTab().flatMap(x => x[1]);
    const ids = what === "one" ? [st.form] : tree.filter(id => !I.off[id] && fxForm(id)); closeModal(); toast("Préparation du PDF…");
    try { const bytes = await fxBuildPdf(ids, I, C); const ex = exCur(); const nm = (S.nom || "dossier").replace(/[^\w-]+/g, "_") + "_" + (st.tab === "liasse" ? "Liasse_" + fxReg() : st.tab.toUpperCase()) + "_" + ex.id.replace("EX", "") + ".pdf";
      fxLog(I, "Impression PDF (" + ids.length + " formulaire(s))"); Store.touch(); deliverFile(nm, bytes, "pdf", null, { cat: "Déclarations fiscales", lib: "Déclaration " + (st.tab === "liasse" ? "liasse fiscale" : st.tab) + " (modèle impôt)" }); } catch (e) { console.error(e); toast("Impression impossible : " + e.message); } },
  fxCsv: () => { const st = fxSt(); const I = fxInst(); const C = fxCtx(); const L = [["Formulaire", "Case", "Rubrique", "Valeur", "Origine"]]; fxFormsOfTab().flatMap(x => x[1]).filter(id => !I.off[id] && fxForm(id)).forEach(id => { const V = fxValues(id, I, C); fxFields(id).forEach(f => { const k = id + "|" + f.i; const v = V[k]; if (v == null || v === "") return; L.push([id, f.i, f.l || "", typeof v === "number" ? (v / 100).toFixed(2).replace(".", ",") : String(v), k in I.v ? "Saisie" : "Comptabilité"]); }); });
    const csv = "\ufeff" + L.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(";")).join("\r\n"); deliverFile("declaration_" + st.tab + ".csv", new TextEncoder().encode(csv), "csv"); },
  fxJson: () => { const st = fxSt(); const I = fxInst(); const C = fxCtx(); const out = { emetteur: brNomSafeFx(), dossier: { nom: S.nom, siren: S.siren, siret: S.siret }, declaration: fxInstKey(), exercice: { debut: exCur().debut, fin: exCur().fin }, genere: new Date().toISOString(), formulaires: {} };
    fxFormsOfTab().flatMap(x => x[1]).filter(id => !I.off[id] && fxForm(id)).forEach(id => { const V = fxValues(id, I, C); const o = out.formulaires[id] = {}; fxFields(id).forEach(f => { const v = V[id + "|" + f.i]; if (v == null || v === "" || /^z|\.z/.test(f.i)) return; o[f.i] = typeof v === "number" ? Math.round(v / 100) : v; }); });
    I.edi = Object.assign(I.edi || {}, { st: (I.edi || {}).st || "prep", at: new Date().toISOString() }); fxLog(I, "Fichier EDI préparatoire exporté"); Store.touch(); deliverFile("EDI_" + fxInstKey().replace(/[:]/g, "_") + ".json", new TextEncoder().encode(JSON.stringify(out, null, 2)), "json"); },
  fxImpModel: el => openModal({ type: "fxImp", d: { id: (el && el.dataset.id) || "", t: el && el.dataset.id ? fxTitle(el.dataset.id) : "", grp: "Liasse fiscale", reg: [fxReg()], erase: true } }),
  fxImpGo: async () => { const M = UI.modal; const d = M.d || {}; const inp = $("#fxImpFile"); const file = inp && inp.files[0]; if (!file) return toast("Choisissez le fichier PDF du modèle."); if (!d.id) return toast("Indiquez le code du formulaire (ex. 2033A)."); toast("Analyse du modèle…");
    try { const P = await fxImportPdf(file, d); const W = fxCfgW(); W.models ||= {}; W.models[d.id] = { t: d.t || d.id, grp: d.grp || "Annexes", reg: d.reg || [], p: P, at: new Date().toISOString() }; fxCfgSave(); closeModal(); fxSt().form = d.id; fxSt().edit = true; toast("Modèle importé : " + P.reduce((a, p) => a + p.F.length, 0) + " case(s) détectée(s). Vérifiez-les en mode édition."); render(); } catch (e) { console.error(e); toast("Import impossible : " + e.message); } },
  fxModDel: el => confirmBox("Supprimer le modèle importé", "Le modèle « " + el.dataset.id + " » sera retiré (les montants saisis sont conservés).", "Supprimer", () => { const W = fxCfgW(); delete (W.models || {})[el.dataset.id]; fxCfgSave(); closeModal(); }, true),
  fxFieldEd: el => { const f = fxFields(el.dataset.id).find(x => x.i === el.dataset.i) || {}; const k = el.dataset.id + "|" + el.dataset.i; openModal({ type: "fxField", d: { id: el.dataset.id, i: f.i, l: f.l || "", f: fxCfg().map[k] || "", w: f.w, h: f.h, x: f.x, y: f.y, a: f.a || "r", k: f.k || "", pg: +el.dataset.pg } }); },
  fxFieldGo: () => { const d = UI.modal.d; const k = d.id + "|" + d.i; const W = fxCfgW(); W.map ||= {}; if (d.f) W.map[k] = d.f; else delete W.map[k];
    const M = fxModelW(d.id); if (M) { const p = M.p[d.pg]; const f = p.F.find(x => x.i === d.i); if (f) { if (d.del) p.F.splice(p.F.indexOf(f), 1); else Object.assign(f, { i: d.ni || f.i, l: d.l, x: +d.x, y: +d.y, w: +d.w, h: +d.h, a: d.a === "l" ? "l" : undefined, k: d.k || undefined }); } }
    fxCfgSave(); closeModal(); },
  fxFieldDel: () => { UI.modal.d.del = 1; F2ACT.fxFieldGo(); },
  fxMapAdd: () => { const k = prompt("Case (formulaire|case), ex. 2058A|WG"); if (!k) return; const W = fxCfgW(); W.map ||= {}; W.map[k.trim()] = "0"; fxCfgSave(); render(); },
  fxMapDel: el => { const W = fxCfgW(); delete (W.map || {})[el.dataset.k]; fxCfgSave(); render(); },
  fxCohAdd: () => { const W = fxCfgW(); W.coh = (fxCfg().coh || []).concat([{ lib: "Nouveau contrôle", a: "", b: "" }]); fxCfgSave(); render(); },
  fxCohDel: el => { const W = fxCfgW(); W.coh = (fxCfg().coh || []).filter((x, i) => i !== +el.dataset.i); fxCfgSave(); render(); },
  fxCfgExp: () => deliverFile("parametres_declarations.json", new TextEncoder().encode(JSON.stringify(fxCfg(), null, 2)), "json")
});
function fxModelW(id) { /* copie modifiable d'un modèle (d'origine ou importé) */ const W = fxCfgW(); W.models ||= {}; if (!W.models[id]) { const F = FXT[id]; if (!F) return null; W.models[id] = { t: F.t, grp: "", reg: [], p: deep(F.p), base: 1 }; } return W.models[id]; }
Object.assign(F2CHG, {
  fxV: el => { const k = el.dataset.k; const [id, ...r] = k.split("|"); const fi = r.join("|").replace(/#\d+$/, ""); const f = fxFields(id).find(x => x.i === fi) || {}; fxSetVal(k, fxParse(el.value, f)); render(); },
  fxOff: el => { const I = fxInst(); if (el.checked) delete I.off[el.dataset.id]; else I.off[el.dataset.id] = 1; Store.touch(); render(); },
  fxOffG: el => { const I = fxInst(); el.dataset.l.split(",").forEach(id => { if (el.checked) delete I.off[id]; else I.off[id] = 1; }); Store.touch(); render(); },
  fxReg: el => { fxSt().reg = el.value; S.fxReg = el.value; fxSt().form = null; UI._fxCtx = null; Store.touch(); render(); },
  fxPer: el => { fxSt().per = el.value; UI._fxCtx = null; render(); },
  fxY: el => { fxSt().y = el.value.trim(); UI._fxCtx = null; render(); },
  fxQ: el => { fxSt().q = el.value; render(); }, fxOnly: el => { fxSt().only = el.checked; render(); }, fxEdit: el => { fxSt().edit = el.checked; render(); },
  fxEdiSt: el => { const I = (S.fxd || {})[el.dataset.k]; if (!I) return; I.edi = Object.assign(I.edi || {}, { st: el.value, at: new Date().toISOString() }); fxLog(I, "Statut EDI : " + (FX_EDI_ST[el.value] || "non envoyé")); Store.touch(); render(); },
  fxEdiRef: el => { const I = (S.fxd || {})[el.dataset.k]; if (!I) return; I.edi = Object.assign(I.edi || {}, { ref: el.value }); Store.touch(); },
  fxScope: el => { S.fxCfg ||= {}; S.fxCfg.on = !!el.value; if (S.fxCfg.on && !S.fxCfg.v) S.fxCfg.v = deep(psRoot().fx || {}); Store.touch(); render(); },
  fxCfgB: el => { const W = fxCfgW(); W[el.dataset.k] = !!el.value; fxCfgSave(); render(); },
  fxCfgT: el => { const W = fxCfgW(); W[el.dataset.k] = el.value; fxCfgSave(); render(); },
  fxCfgN: el => { const W = fxCfgW(); W[el.dataset.k] = +el.value; fxCfgSave(); render(); },
  fxMapV: el => { const W = fxCfgW(); W.map ||= {}; W.map[el.dataset.k] = el.value; fxCfgSave(); UI._fxCtx = null; },
  fxCohV: el => { const W = fxCfgW(); W.coh = deep(fxCfg().coh || []); W.coh[+el.dataset.i][el.dataset.f] = el.value; fxCfgSave(); },
  fxModT: el => { const W = fxCfgW(); if ((W.models || {})[el.dataset.id]) W.models[el.dataset.id].t = el.value; fxCfgSave(); },
  fxCfgImp: async el => { const f = el.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); const W = fxCfgW(); Object.assign(W, o); fxCfgSave(); toast("Paramètres importés."); render(); } catch (e) { toast("Fichier invalide."); } },
  fxImpReg: el => { const d = UI.modal.d; d.reg = [...document.querySelectorAll("[data-ch=fxImpReg]:checked")].map(x => x.value); }
});
/* nouvelles cases dessinées à la souris (mode édition, Maj + glisser) */
document.addEventListener("mousedown", ev => { const pg = ev.target.closest && ev.target.closest(".fx-pg.fx-edit"); if (!pg || !ev.shiftKey) return; ev.preventDefault(); const r = pg.getBoundingClientRect(); const z = +getComputedStyle(pg).getPropertyValue("--fxz") || 1.5; const x0 = (ev.clientX - r.left) / z, y0 = (ev.clientY - r.top) / z;
  const box = document.createElement("div"); box.className = "fx-draw"; pg.appendChild(box);
  const mv = e => { const x1 = (e.clientX - r.left) / z, y1 = (e.clientY - r.top) / z; Object.assign(box.style, { left: Math.min(x0, x1) * z + "px", top: Math.min(y0, y1) * z + "px", width: Math.abs(x1 - x0) * z + "px", height: Math.abs(y1 - y0) * z + "px" }); };
  const up = e => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); box.remove(); const x1 = (e.clientX - r.left) / z, y1 = (e.clientY - r.top) / z; if (Math.abs(x1 - x0) < 4 || Math.abs(y1 - y0) < 4) return;
    const id = pg.dataset.id, pi = +pg.dataset.pg; const M = fxModelW(id); if (!M) return; const n = "N" + Date.now().toString(36).slice(-4); M.p[pi].F.push({ i: n, x: Math.round(Math.min(x0, x1) * 10) / 10, y: Math.round(Math.min(y0, y1) * 10) / 10, w: Math.round(Math.abs(x1 - x0) * 10) / 10, h: Math.round(Math.abs(y1 - y0) * 10) / 10, l: "Nouvelle case" }); fxCfgSave(); render(); };
  document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up); });
/* ---------- fenêtres ---------- */
const _rmFX = renderModal;
renderModal = function () { const M = UI.modal;
  if (M && M.type === "fxCoh") { const coh = UI._fxCoh || []; return modalFrame("Cohérences (" + coh.length + ")", (M.block ? `<div class="banner" style="margin:0 0 10px">La validation est bloquée tant que des anomalies subsistent (réglable dans Paramètres).</div>` : "") + (coh.length ? `<table class="t"><thead><tr><th>Contrôle</th><th>Détail</th><th></th></tr></thead><tbody>${coh.map(c => `<tr><td><b>${esc(c.lib)}</b></td><td class="small">${esc(c.det || "")}</td><td><button class="btn sm" data-act="fxCohGo" data-id="${esc(c.goto || "")}">Voir ${esc(c.goto || "")}</button></td></tr>`).join("")}</tbody></table>` : '<div class="card empty">✔ Aucune anomalie : la déclaration est cohérente.</div>'), `<button class="btn" data-act="closeModal">Fermer</button>`, true); }
  if (M && M.type === "fxHist") { const I = fxInst(); return modalFrame("Historique de la déclaration", I.hist.length ? `<table class="t"><thead><tr><th>Date</th><th>Intervenant</th><th>Action</th></tr></thead><tbody>${I.hist.map(h => `<tr><td class="small">${esc(new Date(h.at).toLocaleString("fr-FR"))}</td><td>${esc(h.by)}</td><td>${esc(h.act)}</td></tr>`).join("")}</tbody></table>` : '<div class="card empty">Aucune action enregistrée.</div>', `<button class="btn" data-act="closeModal">Fermer</button>`); }
  if (M && M.type === "fxPrint") { const d = M.d; return modalFrame("🖨 Impression", `<label class="f"><span><input type="radio" name="fxpw" data-m="what" value="checked" ${d.what !== "one" ? "checked" : ""}> Tous les formulaires cochés (déclaration complète)</span></label><label class="f"><span><input type="radio" name="fxpw" data-m="what" value="one" ${d.what === "one" ? "checked" : ""}> Le formulaire affiché uniquement</span></label><p class="small muted">Le PDF reproduit les imprimés à l'identique avec vos montants.</p>`, cancelBtn + `<button class="btn pri" data-act="fxPrintGo">Générer le PDF</button>`); }
  if (M && M.type === "fxImp") { const d = M.d; return modalFrame("⇧ Importer un modèle des impôts", `<p class="small" style="margin-top:0">Importez l'imprimé officiel vierge (PDF impots.gouv.fr, éventuellement remplissable) ou l'édition de votre logiciel fiscal. Les cases remplissables sont reprises telles quelles ; sinon elles sont détectées à partir des numéros de cases. Les montants présents dans le PDF peuvent être effacés.</p>
    <div class="grid g2"><label class="f">Code du formulaire<input class="in" data-m="id" value="${esc(d.id)}" placeholder="2033A, 2031, CA12…"></label><label class="f">Titre<input class="in" data-m="t" value="${esc(d.t)}" placeholder="2033-A-SD · Bilan simplifié"></label>
    <label class="f">Rubrique<select class="in" data-m="grp">${["Déclaration", "Liasse fiscale", "Crédits d'impôts", "Annexes", "Identification"].map(g => `<option ${d.grp === g ? "selected" : ""}>${g}</option>`).join("")}</select></label><label class="f">Fichier PDF<input type="file" accept="application/pdf" class="in" id="fxImpFile"></label></div>
    <div class="f">Types de société concernés<div class="row" style="flex-wrap:wrap;gap:10px">${Object.keys(FX_TREE).map(k => `<label class="small"><input type="checkbox" value="${k}" data-ch="fxImpReg" ${(d.reg || []).includes(k) ? "checked" : ""}> ${esc(FX_REG_LIB[k].split("·")[0])}${esc(FX_REG_LIB[k].split("·")[1] || "")}</label>`).join("")}</div></div>
    <label class="small"><input type="checkbox" data-m="erase" ${d.erase ? "checked" : ""}> Effacer les montants présents sous les cases détectées</label>`, cancelBtn + `<button class="btn pri" data-act="fxImpGo">Importer</button>`, true); }
  if (M && M.type === "fxField") { const d = M.d; return modalFrame("Case " + esc(d.i) + " · " + esc(fxTitle(d.id)), `<div class="grid g2"><label class="f">Code de la case<input class="in" data-m="ni" value="${esc(d.ni || d.i)}"></label><label class="f">Libellé<input class="in" data-m="l" value="${esc(d.l)}"></label></div>
    <label class="f">Formule de calcul (liée à la comptabilité)<input class="in mono" data-m="f" value="${esc(d.f)}" placeholder="${esc(fxAuto(d.id, { i: d.i, l: d.l }, fxCtx()) || "ex. SOLDE('706') ou T:S.nom")}"></label><p class="small muted" style="margin-top:-4px">Vide = correspondance d'origine. Exemples : <span class="mono">-SOLDE('70')</span>, <span class="mono">F('2050|BJ')+F('2050|CJ')</span>, <span class="mono">T:S.siren</span>.</p>
    <div class="grid g4"><label class="f">Gauche<input class="in" type="number" step="0.5" data-m="x" value="${d.x}"></label><label class="f">Haut<input class="in" type="number" step="0.5" data-m="y" value="${d.y}"></label><label class="f">Largeur<input class="in" type="number" step="0.5" data-m="w" value="${d.w}"></label><label class="f">Hauteur<input class="in" type="number" step="0.5" data-m="h" value="${d.h}"></label></div>
    <div class="grid g2"><label class="f">Alignement<select class="in" data-m="a"><option value="r" ${d.a !== "l" ? "selected" : ""}>Montant (à droite)</option><option value="l" ${d.a === "l" ? "selected" : ""}>Texte (à gauche)</option></select></label><label class="f">Type<select class="in" data-m="k"><option value="" ${!d.k ? "selected" : ""}>Saisie</option><option value="x" ${d.k === "x" ? "selected" : ""}>Case à cocher</option></select></label></div>`,
    `<button class="btn ghost" data-act="fxFieldDel" style="margin-right:auto">🗑 Supprimer la case</button>` + cancelBtn + `<button class="btn pri" data-act="fxFieldGo">Enregistrer</button>`, true); }
  return _rmFX.apply(this, arguments); };
/* ---------- menu Fiscalité ---------- */
(function () { const n = NAV2.find(x => x[0] === "tva"); if (!n) return; if (!n[2].includes("fxDecl")) n[2].unshift("fxDecl"); const d = Object.getOwnPropertyDescriptor(n, 3); if (d && d.get) { const g = d.get; Object.defineProperty(n, 3, { get() { const s = g() || []; return [["fxDecl", "Déclarations (modèles impôts)"]].concat(s.filter(x => x[0] !== "fxDecl")); }, enumerable: true, configurable: true }); } else { n[3] = (n[3] || []).filter(x => x[0] !== "fxDecl"); n[3].unshift(["fxDecl", "Déclarations (modèles impôts)"]); } })();
(function () { const st = document.createElement("style"); st.textContent = `
.fx-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.fx-tabs button{border:1px solid var(--line,#E1EAE9);background:#fff;border-radius:99px;padding:7px 14px;font-weight:600;cursor:pointer}.fx-tabs button.on{background:#0F3D3E;color:#fff;border-color:#0F3D3E}
.fx-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#F4F7F7;border:1px solid var(--line,#E1EAE9);border-radius:12px;padding:8px 10px;margin-bottom:10px;position:sticky;top:0;z-index:5}.fx-sp{flex:1}.fx-sel{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#3A4A4A}
.fx-cohko{border-color:#D93025!important;color:#B3261E!important;background:#FDECEA!important}.fx-cohok{border-color:#1B7F5B!important;color:#0F5B3E!important;background:#E2F1EB!important}
.fx-mode{display:inline-flex;border:1px solid var(--line,#E1EAE9);border-radius:9px;overflow:hidden}.fx-mode button{border:0;background:#fff;padding:6px 11px;font-size:12.5px;cursor:pointer}.fx-mode button.on{background:#0F3D3E;color:#fff}.fx-zoom{display:inline-flex;align-items:center;gap:2px;font-size:12px}
.fx-dd{position:relative}.fx-dd>summary{list-style:none}.fx-dd>summary::-webkit-details-marker{display:none}.fx-ddm{position:absolute;z-index:20;top:110%;left:0;background:#fff;border:1px solid var(--line,#E1EAE9);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:6px;min-width:330px;display:flex;flex-direction:column}.fx-ddm button{border:0;background:none;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer}.fx-ddm button:hover{background:#F0F5F5}
.fx-wrap{display:grid;grid-template-columns:290px 1fr;gap:12px;align-items:start}.fx-tree{background:#fff;border:1px solid var(--line,#E1EAE9);border-radius:12px;padding:8px;position:sticky;top:60px;max-height:calc(100vh - 90px);overflow:auto}.fx-th{font-weight:700;padding:4px 6px 8px}
.fx-tg{margin-bottom:6px}.fx-tgh{display:flex;gap:6px;align-items:center;font-weight:600;font-size:13px;padding:3px 4px}.fx-ti{display:flex;gap:6px;align-items:center;padding:3px 4px 3px 22px;border-radius:7px;font-size:12.5px}.fx-ti.on{background:#E2F1EB}.fx-ti .lnk{text-align:left;flex:1;background:none;border:0;cursor:pointer;color:inherit;padding:0}.fx-ti.miss .lnk{color:#8A9696}
.fx-badge{background:#D93025;color:#fff;border-radius:99px;font-size:10.5px;padding:0 6px}.fx-miss{font-size:10px;background:#FFF4D6;color:#8A6100;border-radius:6px;padding:1px 5px}.fx-tf{padding:6px}
.fx-main{overflow:auto;max-height:calc(100vh - 90px);padding:4px 4px 30px;background:#E9EEEE;border-radius:12px}.fx-pgw{margin:10px auto 18px;width:max-content}.fx-pgl{font-size:12px;font-weight:600;color:#3A4A4A;margin:0 0 4px}
.fx-pg{position:relative;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.14)}.fx-pg>svg{position:absolute;inset:0}
.fx-in{position:absolute;box-sizing:border-box;border:0;background:transparent;padding:0 2px;margin:0;font-family:'Times New Roman',Tinos,'Liberation Serif',Times,serif;color:var(--fxval);text-align:left;outline:none;resize:none;line-height:1.1;overflow:hidden}.fx-in.num{text-align:right}.fx-in:hover{background:rgba(31,111,107,.08)}.fx-in:focus{background:var(--fxfo);box-shadow:inset 0 0 0 1px #2B6CB0}.fx-in.ovr{background:var(--fxhl)}.fx-in[readonly]{cursor:default}
.fx-ck{cursor:pointer;text-align:center!important;font-weight:700;padding:0}.fx-fe{position:absolute;box-sizing:border-box;border:1px dashed #2B6CB0;background:rgba(43,108,176,.12);font:9px ui-monospace,monospace;color:#1A4F8B;overflow:hidden;cursor:pointer}.fx-draw{position:absolute;border:1.5px solid #D93025;background:rgba(217,48,37,.1)}
.fx-edbar{margin:6px auto;width:max-content;background:#fff;border-radius:8px;padding:6px 10px}.fx-valid{background:#E2F1EB;color:#0F5B3E;border:1px solid #BFE0D1;border-radius:10px;padding:8px 12px;margin-bottom:8px;font-size:13px}
.fx-sx{padding:12px}.fx-sxh{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px;flex-wrap:wrap}.fx-sxh h2{margin:0}.fx-st td{vertical-align:middle}.fx-st input.num{text-align:right}.fx-st tr.ovr td{background:#FFFBEA}
.fx-sl{width:38%;font-size:13px}.fx-scs{display:flex;flex-wrap:nowrap;gap:8px;justify-content:flex-end}.fx-sc{display:flex;align-items:center;gap:4px}.fx-sc input{width:118px}.fx-sc.ovr input{background:#FFFBEA;border-color:#E8C55A}.fx-code{font:11px ui-monospace,monospace;background:#0F3D3E;color:#fff;border-radius:5px;padding:2px 5px}.fx-src{font-size:11px;border-radius:99px;padding:1px 8px}.fx-src.c{background:#E2F1EB;color:#0F5B3E}.fx-src.s{background:#FFF4D6;color:#8A6100}.fx-src.e{background:#EEF1F1;color:#6B7A7A}.fx-sck{border:1px solid var(--line,#E1EAE9);background:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}.fx-sck.on{background:#E2F1EB;border-color:#1B7F5B}
.fx-missc{padding:24px;max-width:640px;margin:20px auto}
@media(max-width:900px){.fx-wrap{grid-template-columns:1fr}.fx-tree{position:static;max-height:none}.fx-main{max-height:none}}
@media print{.fx-tree,.fx-bar,.fx-tabs,.topbar{display:none}}`; document.head.appendChild(st); })();
