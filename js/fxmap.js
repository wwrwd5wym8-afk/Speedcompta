/* ============================================================
   Déclarations fiscales : correspondances avec la comptabilité, contrôles de cohérence,
   DAS2 (une page par bénéficiaire), compte rendu de mission ECF (modèle reproduit).
   Toutes les formules restent modifiables dans Déclarations › Paramètres.
   ============================================================ */
const FX_MAP = {
  /* 2065 */ "2065|z97_192": "T:S.nom", "2065|z111_192": "T:S.adresse", "2065|z207_369": "T:S.naf || ''", "2065|z255_192": "BASE_N", "2065|z255_385": "BASE_R", "2065|z255_510": "NEG(ISR('rf'))", "2065|z597_192": "T:'Oui'", "2065|z597_369": "T:BRAND",
  /* 2058-A */ "2058A|WA": "POS(ISR('resAvIS'))", "2058A|WS": "NEG(ISR('resAvIS'))", "2058A|I7": "SOLDE('695','696','697','698','699')", "2058A|WJ": "SOLDE('6712','6582')", "2058A|WR": "POS(ISR('resAvIS')) + ISR('totR')", "2058A|XH": "NEG(ISR('resAvIS')) + ISR('totD')",
  "2058A|XI": "POS(ISR('avantDef'))", "2058A|XJ": "NEG(ISR('avantDef'))", "2058A|XL": "ISR('imputDef')", "2058A|XN": "POS(ISR('rf'))", "2058A|XO": "NEG(ISR('rf'))",
  /* 2058-B */ "2058B|KF": "ISR('imputDef')",
  /* 2572 */ "2572|I-A01": "BASE_N", "2572|139": "T:FISC.isNormal + ' %'", "2572|140": "ISR('isNormal')", "2572|I-A02": "BASE_R", "2572|103": "T:FISC.isReduit + ' %'", "2572|104": "ISR('isReduit')", "2572|I-A05.2": "ISR('is')", "2572|108": "ISR('is')", "2572|116": "ISR('is')", "2572|II-D01": "ISR('acomptes')", "2572|123": "ISR('is')", "2572|124": "ISR('cs')",
  /* CA3 */ "CA3|z75_184": "T:PER.lib || ''", "CA3|p2.0979": "TVA('ca')", "CA3|p2.0031": "TVA('baseAutoliq')", "CA3|08B": "TVA('b2000')", "CA3|08T": "TVA('c2000')", "CA3|09B": "TVA('b550')", "CA3|09T": "TVA('c550')", "CA3|9BB": "TVA('b1000')", "CA3|9BT": "TVA('c1000')", "CA3|11B": "TVA('b210')", "CA3|11T": "TVA('c210')",
  "CA3|16": "TVA('brute')", "CA3|0035": "TVA('autoliq')", "CA3|0703": "TVA('dImmo')", "CA3|0702": "TVA('dABS')", "CA3|8001": "TVA('credAnt')", "CA3|p3.z187_465": "TVA('ded')", "CA3|0705": "TVA('credit')", "CA3|8900": "TVA('due')", "CA3|8003": "TVA('credit')", "CA3|8901": "TVA('due')", "CA3|9992": "TVA('due')",
  "TIDENTIF|z303_203": "T:DATE(PER.from)", "TIDENTIF|z313_203": "T:DATE(PER.to)", "TIDENTIF|z303_538": "TVA('due')", "TIDENTIF|z334_538": "TVA('due')",
  "PIDENTIF|z263_190": "T:DATE(EX.debut)", "PIDENTIF|z285_190": "T:DATE(EX.fin)",
  /* 2035 (BNC) */ "2035A|AA": "-SOLDE('704','705','706','708')", "2035A|AE": "-SOLDE('76')", "2035A|AF": "-SOLDE('75','77')", "2035A|AD": "F('2035A|AA') - F('2035A|AB') - F('2035A|AC')", "2035A|AG": "F('2035A|AD') + F('2035A|AE') + F('2035A|AF')",
  "2035A|BA": "SOLDE('60')", "2035A|BB": "SOLDE('641','642','644')", "2035A|BC": "SOLDE('645','647')", "2035A|BS": "SOLDE('63')", "2035A|BF": "SOLDE('613')", "2035A|BH": "SOLDE('615')", "2035A|BJ": "SOLDE('624','6251')", "2035A|BK": "SOLDE('646')", "2035A|BM": "SOLDE('606','611','614','616','618','622','623','6256','6257','626','627','628')", "2035A|BN": "SOLDE('66')", "2035A|BP": "SOLDE('65','67')",
  "2035A|BR": "F('2035A|BA')+F('2035A|BB')+F('2035A|BC')+F('2035A|BD')+F('2035A|BS')+F('2035A|BV')+F('2035A|BF')+F('2035A|BG')+F('2035A|BH')+F('2035A|BJ')+F('2035A|BK')+F('2035A|BM')+F('2035A|BN')+F('2035A|BP')",
  "2035B|CA": "POS(F('2035A|AG') - F('2035A|BR'))", "2035B|CH": "SOLDE('681')", "2035B|CF": "NEG(F('2035A|AG') - F('2035A|BR'))", "2035B|CE": "F('2035B|CA')+F('2035B|CB')+F('2035B|CC')+F('2035B|CD')", "2035B|CN": "F('2035B|CF')+F('2035B|CG')+F('2035B|CH')+F('2035B|CK')+F('2035B|CL')+F('2035B|CM')",
  "2035B|CP": "POS(F('2035B|CE') - F('2035B|CN'))", "2035B|CR": "NEG(F('2035B|CE') - F('2035B|CN'))"
};
const FX_LAB = [ /* correspondances par libellé (tous formulaires) */
  [/^(Désignation (de la société|ou nom, prénom|de l'entreprise)|Raison sociale|Dénomination(?! et adresse)|Forme juridique \/ Dénomination|Nom, prénom ou dénomination)/i, "T:S.nom"],
  [/(Adresse du principal établissement|^- ?N°, [Tt]ype et nom de voie|^Adresse$|^Adresse :)/, "T:S.adresse || ''"], [/^- ?Code postal ?\/ ?Ville/, "T:[S.cp, S.ville].filter(Boolean).join(' ')"],
  [/SIREN/, "T:S.siren || ''"], [/SIRET/, "T:S.siret || ''"], [/(^NAF$|Code activité NAF|N° SIREN NAF|N° SIRET NAF)/, "T:S.naf || S.ape || ''"],
  [/(Exercice clos le|Date de clôture de l'exercice ou période N$)/, "T:DATE(EX.fin)"], [/Date de début de l'exercice ou période N$|Exercice ouvert le/, "T:DATE(EX.debut)"], [/Durée de l'exercice ou période N$/, "T:MOIS"],
  [/^(Activités? exercées?|Activité|Nature de l'activité)/, "T:S.naf || ''"], [/^Code monnaie/, "T:'EUR'"], [/Période de déclaration/, "T:PER.lib || ''"]
];
function FX_MAPF(id, f, C) {
  const l = (f.n || f.l || "").trim();
  if (id === "DAS2" && f.i === "ANNEE") return "T:FXY";
  if (id === "ECF") return null;
  if (/^z(1[5-9]|2[0-3])_(2\d|3\d|4[0-3])$/.test(f.i)) return "T:S.nom";
  if (/^(2050|2051|2052|2053|2054|2055|2056|2057|2058C)$/.test(id) && /^z(8[0-3]|60|61)_4(8\d)$/.test(f.i)) return "T:DATE(EX.fin)";
  if (id === "DAS2") { const r = fxDasMap(f, 0); if (r) return r; }
  const Ls = [f.n, f.l].filter(Boolean).map(x => x.trim()); const T = re => Ls.some(x => re.test(x));
  if (/^2072/.test(id)) { if (T(/^Revenus bruts/)) return "-SOLDE('706','708','752')"; if (T(/^Intérêts d'emprunts/)) return "SOLDE('661')"; if (T(/^Frais et charges autres/)) return "SOLDE('61','62','63')"; if (T(/^Revenu net ou déficit/)) return "-SOLDE('706','708','752') - SOLDE('61','62','63','661')"; if (T(/^Nombre d'associés/)) return "T:S.nbAssocies || ''"; }
  if (/^2035/.test(id) && T(/^Nom, prénom ou dénomination/)) return "T:[S.nom, S.adresse].filter(Boolean).join('\\n')";
  for (const [re, fm] of FX_LAB) if (re.test(l)) return fm;
  return null;
}
/* ---------- DAS2 : page 1 = entreprise, totaux et 1er bénéficiaire ; une page par bénéficiaire suivant ---------- */
const FX_DAS_F = [[/^NOM$/, "T:(B.nom||'').toUpperCase()"], [/^Raison Sociale$/, "T:B.nom||''"], [/^Complément d'adresse$/, "T:''"], [/^Voie$/, "T:B.adresse||''"], [/^Profession$/, "T:B.prof||''"], [/^N° SIRET$/, "T:B.siren||''"], [/^Honoraires, vacations$/, "B.honoraires"], [/^Commissions$/, "B.commissions"], [/^Droits d'auteur$/, "B.droits"], [/^Autres rémunérations$/, "B.autres"], [/TVA Net sur droit d'auteur/, "B.tva"]];
function fxDasMap(f, idx) { const l = (f.n || f.l || "").trim(); const y = f.y; const ben = idx > 0 || y > 395 || /^p2\./.test(f.i);
  if (!ben) { if (/^Honoraires, vacations$/.test(l)) return "DAS.reduce((a,g)=>a+g.honoraires,0)"; if (/^Commissions$/.test(l)) return "DAS.reduce((a,g)=>a+g.commissions,0)"; if (/^Droits d'auteur$/.test(l)) return "DAS.reduce((a,g)=>a+g.droits,0)"; if (/^Autres rémunérations$/.test(l)) return "DAS.reduce((a,g)=>a+g.autres,0)"; if (/TVA Net sur droit/.test(l)) return "DAS.reduce((a,g)=>a+g.tva,0)"; if (/^Raison sociale$/.test(l)) return "T:S.nom"; if (/^Adresse$/.test(l)) return "T:S.adresse||''"; if (/^Activité$/.test(l)) return "T:S.naf||''"; return null; }
  const m = FX_DAS_F.find(([re]) => re.test(l)); return m ? m[1].replace(/\bB\b/g, "DAS[" + idx + "]") + (m[1].startsWith("T:") ? "" : "") : null; }
function FX_REPEAT(id, F, I, C) { if (id !== "DAS2") return null; const n = Math.max(1, (C.das || []).length); const out = [{ p: F.p[0], pi: 0, sfx: "", lib: "Page 1 · entreprise, totaux et bénéficiaire 1" + (C.das[0] ? " (" + C.das[0].nom + ")" : "") }];
  for (let k = 1; k < n; k++) out.push({ p: F.p[1], pi: 1, sfx: "#" + k, lib: "Bénéficiaire " + (k + 1) + " · " + (C.das[k] || {}).nom });
  return out; }
function FX_REP_VAL(k, C, get) { const m = /^DAS2\|(.+)#(\d+)$/.exec(k); if (!m) return null; const f = fxFields("DAS2").find(x => x.i === m[1]); if (!f) return null; const fm = fxDasMap(f, +m[2]); if (!fm) return null; const v = fxEval(fm.replace(/DAS\[(\d+)\]/g, "DAS[$1]"), C, get); return v && typeof v === "object" ? null : v; }
/* ---------- contrôles de cohérence d'origine ---------- */
const FX_COH = [
  { lib: "Bilan : total actif net (2050) = total passif (2051)", forms: ["2050", "2051"], fn: (g, h) => (h("2050|CO.3") || h("2051|EE")) && Math.abs(g("2050|CO.3") - g("2051|EE")) > 100 ? "Actif " + fxFmt(g("2050|CO.3"), {}) + " / passif " + fxFmt(g("2051|EE"), {}) : null },
  { lib: "2050 : total général brut = total II + III + IV + V + VI", forms: ["2050"], fn: g => Math.abs(g("2050|CO") - (g("2050|BJ") + g("2050|CJ") + g("2050|CW") + g("2050|CM") + g("2050|CN"))) > 100 ? "Écart de " + fxFmt(g("2050|CO") - (g("2050|BJ") + g("2050|CJ") + g("2050|CW") + g("2050|CM") + g("2050|CN")), {}) : null },
  { lib: "2050 : total II (actif immobilisé brut) = somme des lignes", forms: ["2050"], fn: g => { const s = "AB CX AF AH AJ AL AN AP AR AT AV CS CU BB BD BF BH".split(" ").reduce((a, k) => a + g("2050|" + k), 0); return Math.abs(g("2050|BJ") - s) > 100 ? "BJ " + fxFmt(g("2050|BJ"), {}) + " / somme " + fxFmt(s, {}) : null; } },
  { lib: "2050 : total III (actif circulant brut) = somme des lignes", forms: ["2050"], fn: g => { const s = "BL BN BP BR BT BV BX BZ CB CD CF CH".split(" ").reduce((a, k) => a + g("2050|" + k), 0); return Math.abs(g("2050|CJ") - s) > 100 ? "CJ " + fxFmt(g("2050|CJ"), {}) + " / somme " + fxFmt(s, {}) : null; } },
  { lib: "2051 : résultat de l'exercice = résultat du compte de résultat", forms: ["2051"], fn: (g, h, C) => C.L["2053|HN"] != null && Math.abs(g("2051|DI") - C.L["2053|HN"]) > 100 ? "2051 DI " + fxFmt(g("2051|DI"), {}) + " / 2053 HN " + fxFmt(C.L["2053|HN"], {}) : null },
  { lib: "2058-A : résultat comptable (WA / WS) = résultat du bilan (2051 DI)", forms: ["2058A", "2051"], fn: g => Math.abs((g("2058A|WA") - g("2058A|WS")) - g("2051|DI")) > 100 ? "WA − WS = " + fxFmt(g("2058A|WA") - g("2058A|WS"), {}) + " / DI = " + fxFmt(g("2051|DI"), {}) : null },
  { lib: "2058-A : bénéfice ou déficit (XI/XJ) = total I − total II", forms: ["2058A"], fn: g => Math.abs((g("2058A|XI") - g("2058A|XJ")) - (g("2058A|WR") - g("2058A|XH"))) > 100 ? "XI − XJ = " + fxFmt(g("2058A|XI") - g("2058A|XJ"), {}) + " / WR − XH = " + fxFmt(g("2058A|WR") - g("2058A|XH"), {}) : null },
  { lib: "2065 : bénéfices imposables = résultat fiscal 2058-A (XN)", forms: ["2065", "2058A"], fn: g => Math.abs(g("2065|z255_192") + g("2065|z255_385") - g("2058A|XN")) > 100 ? "2065 : " + fxFmt(g("2065|z255_192") + g("2065|z255_385"), {}) + " / XN : " + fxFmt(g("2058A|XN"), {}) : null },
  { lib: "2065 : déficit = 2058-A (XO)", forms: ["2065", "2058A"], fn: g => Math.abs(g("2065|z255_510") - g("2058A|XO")) > 100 ? fxFmt(g("2065|z255_510"), {}) + " / " + fxFmt(g("2058A|XO"), {}) : null },
  { lib: "2065 : désignation et adresse de la société renseignées", forms: ["2065"], fn: (g, h, C, I, raw) => !raw("2065|z97_192") || !raw("2065|z111_192") ? "Complétez le cadre A (désignation, adresse)." : null },
  { lib: "CA3 : total TVA brute (ligne 16) = lignes 08 à 5B", forms: ["CA3"], fn: g => { const s = ["08T", "09T", "9BT", "10T", "11T", "0600", "0602"].reduce((a, k) => a + g("CA3|" + k), 0); return Math.abs(g("CA3|16") - s) > 100 ? "Ligne 16 : " + fxFmt(g("CA3|16"), {}) + " / somme : " + fxFmt(s, {}) : null; } },
  { lib: "CA3 : TVA due (TD) = ligne 16 − ligne 23", forms: ["CA3"], fn: g => { const d = Math.max(0, g("CA3|16") - g("CA3|p3.z187_465")); return Math.abs(g("CA3|8900") - d) > 100 ? "TD : " + fxFmt(g("CA3|8900"), {}) + " / calcul : " + fxFmt(d, {}) : null; } },
  { lib: "CA3 : crédit (ligne 25) = ligne 23 − ligne 16", forms: ["CA3"], fn: g => { const d = Math.max(0, g("CA3|p3.z187_465") - g("CA3|16")); return Math.abs(g("CA3|0705") - d) > 100 ? "25 : " + fxFmt(g("CA3|0705"), {}) + " / calcul : " + fxFmt(d, {}) : null; } },
  { lib: "2572 : IS au taux normal = base × taux", forms: ["2572"], fn: (g, h, C) => { const t = Math.round(g("2572|I-A01") * (C.Fc.isNormal || 25) / 100); return Math.abs(g("2572|140") - t) > 100 ? "140 : " + fxFmt(g("2572|140"), {}) + " / calcul : " + fxFmt(t, {}) : null; } },
  { lib: "2572 : IS au taux réduit = base × taux réduit", forms: ["2572"], fn: (g, h, C) => { const t = Math.round(g("2572|I-A02") * (C.Fc.isReduit || 15) / 100); return Math.abs(g("2572|104") - t) > 100 ? "104 : " + fxFmt(g("2572|104"), {}) + " / calcul : " + fxFmt(t, {}) : null; } },
  { lib: "2035 : total des recettes (AG) = AD + AE + AF", forms: ["2035A"], fn: g => Math.abs(g("2035A|AG") - (g("2035A|AD") + g("2035A|AE") + g("2035A|AF"))) > 100 ? "Écart " + fxFmt(g("2035A|AG") - (g("2035A|AD") + g("2035A|AE") + g("2035A|AF")), {}) : null },
  { lib: "DAS2 : bénéficiaires sans SIRET ni adresse", forms: ["DAS2"], fn: (g, h, C) => { const L = (C.das || []).filter(b => !b.siren || !b.adresse); return L.length ? L.map(b => b.nom).slice(0, 4).join(", ") + (L.length > 4 ? "…" : "") : null; } }
];
/* ---------- ECF : compte rendu de mission (modèle reproduit) ---------- */
const FX_ECF = (() => {
  const P = []; let p, y; const X = 30.5, W = 533.5, LW = 1;
  const page = () => { p = { w: 595.28, h: 841.89, R: [], L: [], T: [], I: [], F: [] }; P.push(p); y = 30; };
  const txt = (x, yy, s, sz, bold, col, anchor) => { const w = anchor === "c" ? 0 : 0; p.T.push([x, yy, sz, bold ? 6 : 5, s, 0].concat(col ? [col] : [])); return w; };
  const ctr = (s, yy, sz, bold, col, x0 = X, w = W) => { const tw = textW(s, sz, bold); txt(x0 + (w - tw) / 2, yy, s, sz, bold, col); };
  const box = (x, yy, w, h, fill) => p.R.push([x, yy, w, h, fill || "", "#000000", LW]);
  const bar = (s, h = 24) => { box(X, y, W, h, "#808080"); ctr(s, y + h / 2 + 3.5, 10, true, "#ffffff"); y += h; };
  const sub = (s, h = 24) => { box(X, y, W, h, "#dcdcdc"); const L = s.split("\n"); L.forEach((l, i) => ctr(l, y + h / 2 + 3.5 - (L.length - 1) * 5.5 + i * 11, 10, true)); y += h; };
  const fld = (id, x, yy, w, h, o = {}) => p.F.push(Object.assign({ i: id, x: x + 1, y: yy + 1, w: w - 2, h: h - 2, l: o.l || "" }, o.a ? { a: "l" } : { a: "l" }, o.n ? { a: undefined } : {}, o.k ? { k: "x" } : {}, { s: o.s || 8 }));
  const row = (lab, id, o = {}) => { const h = o.h || 14; const lw = o.lw || 213; box(X, y, lw, h); box(X + lw, y, W - lw, h); txt(X + 3, y + 10, lab, 8); fld(id, X + lw, y, W - lw, h, { l: lab, n: o.n }); y += h; };
  const ck = (id, x, yy, l) => { box(x, yy, 9, 9); fld(id, x, yy, 9, 9, { k: 1, l }); };
  const opt = (lab, id, cx = 452) => { box(X, y, W, 14); txt(X + 3, y + 10, lab, 8); ck(id, X + cx, y + 2.5, lab); y += 14; };
  const yn = (q, id, cx = 452) => { const h = 42; box(X, y, W, h); txt(X + 3, y + 9, q, 8); txt(X + 3, y + 22, "Oui", 7); ck(id + ".o", X + cx, y + 15, q + " · Oui"); txt(X + 3, y + 36, "Non", 7); ck(id + ".n", X + cx, y + 29, q + " · Non"); y += h; };
  const area = (lab, id, h = 82) => { box(X, y, W, h); txt(X + 3, y + 10, lab, 7); fld(id, X + 105, y + 2, W - 107, h - 4, { l: lab, a: 1 }); y += h; };
  const amt = (lab, id) => { box(X, y, 300, 14); box(X + 300, y, W - 300, 14); txt(X + 3, y + 10, lab, 8); fld(id, X + 300, y, W - 300, 14, { l: lab, n: 1 }); y += 14; };
  const stat = (n, t) => { box(X, y, W, 14); txt(X + 3, y + 10, n + " – " + t, 7); y += 14; opt("Point non-applicable", "p" + n + ".na"); opt("Conforme", "p" + n + ".ok"); opt("Non Conforme", "p" + n + ".ko"); };
  const need = h => { if (y + h > 800) page(); };
  page(); ctr("EXAMEN DE CONFORMITÉ FISCALE", 44, 14, true); ctr("COMPTE RENDU DE MISSION", 60, 10, true); y = 81;
  bar("RENSEIGNEMENTS RELATIFS À LA STRUCTURE PRESTATAIRE");
  [["Dénomination", "pre.nom"], ["Complément de dénomination", "pre.cpl"], ["SIREN", "pre.siren"], ["Forme juridique", "pre.forme"], ["Adresse", "pre.adr"], ["Identification / Référence", "pre.ref"]].forEach(([l, i]) => row(l, i));
  const y0 = y; box(X, y, 213, 70); txt(X + 3, y + 10, "Coordonnées de votre correspondant au sein de la structure", 8); txt(X + 3, y + 19, "prestataire:", 8);
  [["Nom et prénom", "pre.cor"], ["Téléphone", "pre.tel"], ["Courriel", "pre.mail"], ["Profession en charge de l'ECF", "pre.prof"], ["Département d'exercice", "pre.dep"]].forEach(([l, i], k) => { const yy = y0 + k * 14; box(X + 213, yy, 127, 14); box(X + 340, yy, W - 340, 14); txt(X + 216, yy + 10, l, 8); fld(i, X + 340, yy, W - 340, 14, { l }); });
  y = y0 + 70 + 16; bar("RENSEIGNEMENTS RELATIFS AU CLIENT");
  [["SIREN du client", "cli.siren"], ["Identification du client", "cli.id"], ["Nom et prénom / Raison sociale", "cli.nom"], ["Complément de désignation", "cli.cpl"], ["Adresse", "cli.adr"], ["Forme juridique", "cli.forme"]].forEach(([l, i]) => row(l, i));
  box(X, y, 92, 36); txt(X + 3, y + 10, "Mode d'exercice", 8); box(X + 92, y, 121, 36); txt(X + 96, y + 10, "Individuel", 8); ck("cli.ind", X + 136, y + 3, "Individuel"); txt(X + 168, y + 10, "Sociétal", 8); ck("cli.soc", X + 201, y + 3, "Sociétal");
  box(X + 213, y, 135, 14); txt(X + 216, y + 10, "Nombre d'associés", 8); box(X + 348, y, W - 348, 14); fld("cli.nba", X + 348, y, W - 348, 14, { l: "Nombre d'associés" });
  box(X + 213, y + 14, 135, 22); txt(X + 216, y + 23, "Date d'option pour l'assujettissement à", 7); txt(X + 216, y + 32, "l'impôt sur les sociétés", 7); box(X + 348, y + 14, W - 348, 22); fld("cli.optis", X + 348, y + 14, W - 348, 22, { l: "Date d'option IS" }); y += 36;
  row("N° du client", "cli.num"); y += 16; bar("RENSEIGNEMENTS RELATIFS AUX DÉCLARATIONS EXAMINÉES");
  row("Date de réception de la déclaration de résultats", "dec.rec"); box(X, y, 213, 14); txt(X + 3, y + 10, "Période d'imposition", 8); box(X + 213, y, W - 213, 14); txt(X + 216, y + 10, "Du:", 8); fld("dec.du", X + 230, y, 90, 14, { l: "Du" }); txt(X + 322, y + 10, "Au :", 8); fld("dec.au", X + 340, y, 100, 14, { l: "Au" }); y += 14;
  row("Résultat déclaré", "dec.res", { n: 1 }); row("Montant du chiffre d'affaires réalisé sur l'exercice (HT)", "dec.ca", { n: 1 });
  box(X, y, 75, 34); txt(X + 3, y + 10, "Comptabilité tenue", 8); box(X + 75, y, 138, 34); txt(X + 79, y + 10, "TTC", 7); ck("dec.ttc", X + 96, y + 3, "TTC"); txt(X + 130, y + 10, "HT", 7); ck("dec.ht", X + 142, y + 3, "HT");
  box(X + 213, y, W - 213, 17); txt(X + 216, y + 11, "Activité non soumise à la TVA", 8); ck("dec.nst", X + 400, y + 4, "Activité non soumise à la TVA"); box(X + 213, y + 17, W - 213, 17); txt(X + 216, y + 28, "Assujettissement partiel", 8); ck("dec.part", X + 400, y + 21, "Assujettissement partiel"); y += 34;
  box(X, y, 266, 32); txt(X + 3, y + 10, "Nom et prénom du signataire :", 8); fld("sig.nom", X + 112, y + 1, 152, 12, { l: "Signataire" }); box(X + 266, y, W - 266, 16); txt(X + 269, y + 11, "A :", 8); fld("sig.a", X + 282, y, 150, 16, { l: "Lieu" }); box(X + 266, y + 16, W - 266, 16); txt(X + 269, y + 27, "Le :", 8); fld("sig.le", X + 284, y + 16, 150, 16, { l: "Date" }); y += 32;
  box(X, y, 266, 14); txt(X + 3, y + 10, "Qualité du signataire :", 8); fld("sig.qual", X + 90, y, 174, 14, { l: "Qualité" }); box(X + 266, y, W - 266, 14); txt(X + 269, y + 10, "Signature :", 8); y += 14;
  page(); bar("EXAMEN DE CONFORMITÉ FISCALE"); sub("CONCLUSIONS GÉNÉRALES"); opt("Absence d'anomalie", "c.abs", 568 - X - 115 + 5); opt("Absence d'anomalie après régularisation", "c.reg", 458); opt("Transmission d'une ou des déclaration(s) rectificative(s) à notre demande", "c.rect", 458);
  sub("Déclaration de résultats\nDemande de régularisation avec incidence sur le résultat imposable", 35); amt("Montant de la rectification", "c.rres"); sub("Déclaration(s) de taxes sur le chiffre d'affaires");
  [["Demande de rectification avec incidence sur la TVA collectée", "c.rtc"], ["Demande de rectification avec incidence sur la TVA déductible", "c.rtd"]].forEach(([l, i]) => { box(X, y, 267, 9, "#dcdcdc"); txt(X + 2, y + 7, l, 7); box(X + 267, y, 135, 9); txt(X + 269, y + 7, "Montant de la rectification", 7); box(X + 402, y, W - 402, 9); fld(i, X + 402, y, W - 402, 9, { l, n: 1, s: 7 }); y += 9; });
  opt("Présence d'anomalies non régularisées", "c.nonreg", 458); opt("Présomption de fraude ou de dissimulation", "c.fraude", 458); y += 16;
  bar("EXAMEN DES POINTS DU CHEMIN D'AUDIT");
  const PTS = [[1, "Conformité du fichier des écritures comptables (FEC)", () => { yn("L'entreprise entre-t-elle dans le champ d'application l'article A47 A-1 du LPF", "p1.q1", 362); yn("Conformité structurelle (anomalies réelles relevées par TestComptaDemat) ?", "p1.q2", 362); area("Type d'anomalies relevées :", "p1.typ"); }],
    [2, "Qualité comptable du FEC au regard des normes comptables", () => { yn("Des anomalies ont-elles été relevées ?", "p2.q1", 362); area("Type d'anomalies relevées :", "p2.typ"); }],
    [3, "Logiciel ou système de caisse", () => { yn("L'entreprise entre-t-elle dans le champ d'application ?", "p3.q1"); box(X, y, W, 56); txt(X + 3, y + 9, "Si l'entreprise entre dans le champ d'application :", 7); [["Certification INFOCERT", "p3.inf"], ["Certification LNE", "p3.lne"], ["Attestation", "p3.att"]].forEach(([l, i], k) => { txt(X + 5, y + 21 + k * 14, l, 7); ck(i, X + 452, y + 14 + k * 14, l); }); y += 56; area("Type d'anomalies relevées :", "p3.typ"); }],
    [4, "Mode de conservation des documents", () => { yn("Les processus examinés sont-ils conformes à la législation ?", "p4.q1"); area("Type d'anomalies relevées :", "p4.typ"); }],
    [5, "Régime d'imposition", () => { box(X, y, W, 14); txt(X + 3, y + 10, "En matière d'imposition des résultats", 8); y += 14; row("Nature :", "p5.nat", { lw: 120 }); yn("Anomalies relevées ?", "p5.q1"); area("Type d'anomalies relevées :", "p5.typ1", 40); row("Régime :", "p5.reg", { lw: 120 }); yn("Anomalies relevées ?", "p5.q2"); area("Type d'anomalies relevées :", "p5.typ2", 40); box(X, y, W, 14); txt(X + 3, y + 10, "En matière de TVA", 8); y += 14; row("Régime :", "p5.tva", { lw: 120 }); yn("Anomalies relevées ?", "p5.q3"); area("Type d'anomalies relevées :", "p5.typ3", 40); }],
    ...[[6, "Règles de détermination des amortissements et leur traitement fiscal"], [7, "Règles de détermination des provisions et leur traitement fiscal"], [8, "Règles de détermination des charges à payer et leur traitement fiscal"], [9, "Qualification et déductibilité des charges exceptionnelles"]].map(([n, t]) => [n, t, () => { amt("Montant total déclaré", "p" + n + ".mt"); amt("Montant examiné dans le cadre de l'ECF", "p" + n + ".me"); yn("Des anomalies ont-elles été relevées ?", "p" + n + ".q1"); area("Présenter la méthode ou les critères retenus par l'entreprise :", "p" + n + ".meth", 40); area("Type d'anomalies relevées :", "p" + n + ".typ", 50); amt("Montant des anomalies", "p" + n + ".ma"); }]),
    [10, "Règles d'exigibilité en matière de TVA", () => { yn("Présence de secteurs d'activités distincts ?", "p10.q1"); area("Présenter la méthode ou les critères retenus par l'entreprise :", "p10.meth", 40); yn("Anomalies relevées en matière de TVA collectée ?", "p10.q2"); amt("Montant des anomalies", "p10.ma1"); yn("Anomalies relevées en matière de TVA déductible ?", "p10.q3"); amt("Montant des anomalies", "p10.ma2"); area("Type d'anomalies relevées :", "p10.typ", 90); }]];
  const H = { 1: 230, 2: 160, 3: 250, 4: 190, 5: 400, 6: 260, 7: 260, 8: 260, 9: 260, 10: 330 };
  PTS.forEach(([n, t, body]) => { need(H[n]); if (y > 40) y += 16; stat(n, t); body(); });
  page(); bar("APPRÉCIATION DES PIÈCES JUSTIFICATIVES EXAMINÉES"); sub("Doute sérieux sur pièces justificatives – Assiette imposable sur laquelle porte le doute");
  [["TVA", "pj.tva"], ["Déclaration de résultats", "pj.res"]].forEach(([l, i]) => { box(X, y, 120, 14); txt(X + 3, y + 10, l, 7); ck(i + ".c", X + 105, y + 2.5, l); box(X + 120, y, 110, 14); txt(X + 123, y + 10, "Montant", 7); box(X + 230, y, W - 230, 14); fld(i, X + 230, y, W - 230, 14, { l: l + " · montant", n: 1 }); y += 14; });
  box(X, y, W, 90); txt(X + 3, y + 9, "Précisions sur le(s) document(s) :", 7); txt(X + 3, y + 17, "Référence:", 7); txt(X + 3, y + 25, "Nature :", 7); txt(X + 3, y + 33, "Date :", 7); fld("pj.ref", X + 45, y + 11, W - 50, 8, { l: "Référence", s: 7 }); fld("pj.nat", X + 40, y + 19, W - 45, 8, { l: "Nature", s: 7 }); fld("pj.date", X + 30, y + 27, W - 35, 8, { l: "Date", s: 7 }); fld("pj.prec", X + 3, y + 37, W - 6, 50, { l: "Précisions", a: 1 }); y += 90;
  bar("RENSEIGNEMENTS COMPLÉMENTAIRES"); box(X, y, W, 74); fld("comp", X, y, W, 74, { l: "Renseignements complémentaires", a: 1 }); y += 74;
  P.forEach(q => q.F.forEach(f => { if (f.a === undefined) delete f.a; }));
  return { t: "Compte rendu de mission ECF (examen de conformité fiscale)", p: P };
})();
FXT.ECF = FX_ECF; FXT_PACKS.ecf = 1;
(function () { /* correspondances ECF (liées au module ECF et à la comptabilité) */
  const st = n => `(ECFD().pts[${n}]||{}).st`; const o = {};
  Object.assign(o, { "pre.nom": "T:ECFD().mission.prest||''", "pre.adr": "T:ECFD().mission.prestAdr||''", "pre.prof": "T:ECFD().mission.qualite||''", "cli.siren": "T:S.siren||''", "cli.nom": "T:S.nom", "cli.adr": "T:S.adresse||''", "cli.forme": "T:S.forme||''", "cli.soc": "!/^EI/.test(S.forme||'')", "cli.ind": "/^EI/.test(S.forme||'')",
    "dec.du": "T:DATE(EX.debut)", "dec.au": "T:DATE(EX.fin)", "dec.res": "TOT('RN')", "dec.ca": "TOT('CA')", "dec.ht": "true", "sig.nom": "T:ECFD().mission.sign||''", "sig.a": "T:ECFD().mission.ville||''", "sig.le": "T:ECFD().cr.envoye?DATE(ECFD().cr.envoye):''", "sig.qual": "T:ECFD().mission.qualite||''",
    "c.abs": "[1,2,3,4,5,6,7,8,9,10].every(n=>(ECFD().pts[n]||{}).st!=='ko')", "c.nonreg": "[1,2,3,4,5,6,7,8,9,10].some(n=>(ECFD().pts[n]||{}).st==='ko')",
    "p5.nat": "T:/IS/.test(S.forme||'')||S.regimeIS?'Impôt société (IS)':'Impôt sur le revenu'", "p5.reg": "T:S.regimeIS==='RN'?'Réel normal':'Réel simplifié'", "p5.tva": "T:({RN_M:'Réel normal mensuel',RN_T:'Réel normal trimestriel',RSI:'Réel simplifié',FR:'Franchise'})[S.regimeTVA]||''",
    "p6.mt": "SOLDE('681')", "p6.me": "SOLDE('681')", "p7.mt": "SOLDE('6815','6865','6875')", "p7.me": "SOLDE('6815','6865','6875')", "p8.mt": "SC('408','4286','4386','4486')", "p8.me": "SC('408','4286','4386','4486')", "p9.mt": "SOLDE('67')", "p9.me": "SOLDE('67')" });
  for (let n = 1; n <= 10; n++) { o["p" + n + ".na"] = st(n) + "==='na'"; o["p" + n + ".ok"] = st(n) + "==='ok'"; o["p" + n + ".ko"] = st(n) + "==='ko'"; o["p" + n + ".typ"] = `T:(ECFD().pts[${n}]||{}).obs||''`; }
  Object.entries(o).forEach(([k, v]) => { FX_MAP["ECF|" + k] = v; });
})();
function ECFD() { try { return ECF(); } catch (e) { return { mission: {}, pts: {}, cr: {} }; } }
/* noms supplémentaires du langage de formules */
(function () { const _ctx = fxCtx; fxCtx = function () { const C = _ctx.apply(this, arguments); if (!C._x) { C._x = 1; C.names = C.names.concat(["FISC", "BRAND", "MOIS", "ECFD", "FXY"]); } return C; };
  const _ev = fxEval; fxEval = function (expr, C, get) { if (!C._xv) { C._xv = 1; C.base = Object.assign({}, C.base, { FISC: C.Fc, BRAND: brNomSafeFx(), MOIS: String(typeof monthsBetween === "function" ? monthsBetween(C.ex.debut, C.ex.fin) : 12), ECFD, FXY: fxDasY() }); } return _ev(expr, C, get); };
  const _fv = fxValues; fxValues = function (id, I, C) { const o = _fv.apply(this, arguments); o._rep = k => FX_REP_VAL(k, C, o._get); return o; }; })();
