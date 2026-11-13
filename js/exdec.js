/* ============================================================
   Nouvelle société : exercices calendaires, décalés ou à dates libres.
   - clôture au 31/12, à une fin de mois au choix (exercice décalé) ou dates libres ;
   - premier exercice court (prochaine clôture) ou long (clôture suivante, 24 mois max) ;
   - création en même temps des exercices précédents (reprise d'historique) et suivants ;
   - chaque date reste modifiable à la main ; réglage par défaut mémorisable (Oui/Non).
   ============================================================ */
const EXD_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const EXD_K = "sc_exdDef";
function exdDef() { let c = {}; try { c = JSON.parse(localStorage.getItem(EXD_K) || "{}") || {}; } catch (e) { } return Object.assign({ mode: "cal", cm: 12, long: "0", prev: 0, next: 0 }, c); }
const exdEom = (y, m) => new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
function exdNextClose(debut, cm, long) { const y = +debut.slice(0, 4); let c = exdEom(y, cm); if (c < debut) c = exdEom(y + 1, cm); if (long === "1") { const c2 = exdEom(+c.slice(0, 4) + 1, cm); if (exdMonths(debut, c2) <= 24) c = c2; } return c; }
function exdMonths(a, b) { if (!a || !b || b < a) return 0; const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number); return Math.round(((y2 - y1) * 12 + (m2 - m1) + (d2 - d1 + 1) / 30.44) * 10) / 10; }
function exdInit(d) { if (d.exd) return d.exd; const f = exdDef(); d.exd = { mode: f.mode, cm: +f.cm || 12, long: f.long, prev: +f.prev || 0, next: +f.next || 0, ov: {}, mem: "0" }; let saved = false; try { saved = !!localStorage.getItem(EXD_K); } catch (e) { } if (d.debut && saved) exdFirst(d); else if (d.debut && d.fin && d.exd.mode === "cal" && d.fin > exdNextClose(d.debut, 12, "0")) d.exd.long = "1"; return d.exd; }
function exdFirst(d) { const x = d.exd; if (x.mode === "libre") return; const cm = x.mode === "cal" ? 12 : x.cm; if (!d.debut) return; d.fin = exdNextClose(d.debut, cm, x.long); }
/* liste complète : précédents, premier, suivants (avec dates modifiées à la main) */
function exdList(d) { const x = exdInit(d); const L = []; if (!d.debut || !d.fin) return L;
  let deb = d.debut; for (let i = 0; i < x.prev; i++) { const fin = addDays(deb, -1); const db = addDays(addMonths(addDays(fin, 1), -12), 0); L.unshift({ k: "p" + (i + 1), debut: db, fin, lib: "Exercice précédent N-" + (i + 1) }); deb = db; }
  L.push({ k: "f", debut: d.debut, fin: d.fin, lib: "Premier exercice dans " + CONFIG.branding.nom });
  let fin = d.fin; for (let i = 0; i < x.next; i++) { const db = addDays(fin, 1); const f = addDays(addMonths(db, 12), -1); L.push({ k: "n" + (i + 1), debut: db, fin: f, lib: "Exercice suivant N+" + (i + 1) }); fin = f; }
  L.forEach(r => { const o = x.ov[r.k]; if (o && r.k !== "f") { if (o.debut) r.debut = o.debut; if (o.fin) r.fin = o.fin; } r.m = exdMonths(r.debut, r.fin); });
  return L; }
function exdIssues(L) { const w = []; L.forEach((r, i) => { if (!r.debut || !r.fin || r.fin < r.debut) w.push(r.lib + " : la fin doit être après le début."); else if (r.m > 24) w.push(r.lib + " : " + String(r.m).replace(".", ",") + " mois (24 mois maximum)."); if (i && L[i - 1].fin >= r.debut) w.push(r.lib + " chevauche l'exercice précédent."); else if (i && addDays(L[i - 1].fin, 1) !== r.debut) w.push("Trou de dates avant « " + r.lib + " »."); }); return w; }
const exdSeg = (act, cur, opts, k) => `<span class="seg">${opts.map(([v, t]) => `<button class="${String(cur) === String(v) ? "on" : ""}" data-act="${act}" ${k ? `data-k="${k}"` : ""} data-v="${v}">${t}</button>`).join("")}</span>`;
function exdBlock(d) { const x = exdInit(d); const L = exdList(d); const W = exdIssues(L); const f = L.find(r => r.k === "f") || {};
  return `<div class="exd"><div class="exd-h"><b>📅 Exercice comptable</b>${exdSeg("exdMode", x.mode, [["cal", "Calendaire (31/12)"], ["dec", "Décalé"], ["libre", "Dates libres"]])}</div>
    <div class="exd-g">
      ${x.mode === "dec" ? `<label class="f">Mois de clôture<select class="in" data-ch="exdCm">${EXD_MOIS.map((m, i) => `<option value="${i + 1}" ${x.cm === i + 1 ? "selected" : ""}>Fin ${m} (${exdEom(2027, i + 1).slice(8)}/${String(i + 1).padStart(2, "0")})</option>`).join("")}</select></label>` : ""}
      <label class="f">Début du premier exercice<input type="date" class="in" value="${esc(d.debut || "")}" data-ch="exdDeb"></label>
      <label class="f">Fin du premier exercice${x.mode !== "libre" ? ` <small class="muted">(calculée, modifiable)</small>` : ""}<input type="date" class="in" value="${esc(d.fin || "")}" data-ch="exdFin"></label>
      ${x.mode !== "libre" ? `<div class="f"><span>Premier exercice</span>${exdSeg("exdLong", x.long, [["0", "Court"], ["1", "Long (≤ 24 mois)"]])}</div>` : ""}
    </div>
    <div class="exd-dur">Durée du premier exercice : <b>${String(f.m || 0).replace(".", ",")} mois</b>${f.m && f.m < 12 ? " · exercice court" : f.m > 12 ? " · exercice long" : ""}</div>
    <div class="exd-g exd-g2"><div class="f"><span>Exercices précédents à créer <small class="muted">(reprise d'historique)</small></span>${exdSeg("exdN", x.prev, [[0, "Aucun"], [1, "1"], [2, "2"], [3, "3"]], "prev")}</div><div class="f"><span>Exercices suivants à créer</span>${exdSeg("exdN", x.next, [[0, "Aucun"], [1, "1"], [2, "2"]], "next")}</div></div>
    ${L.length > 1 ? `<table class="t exd-t"><thead><tr><th>Exercice</th><th>Début</th><th>Fin</th><th class="r">Durée</th></tr></thead><tbody>${L.map(r => `<tr class="${r.k === "f" ? "cur" : ""}"><td>${esc(r.lib)}</td><td>${r.k === "f" ? frDate(r.debut) : `<input type="date" class="in" value="${r.debut}" data-ch="exdOv" data-k="${r.k}" data-f="debut">`}</td><td>${r.k === "f" ? frDate(r.fin) : `<input type="date" class="in" value="${r.fin}" data-ch="exdOv" data-k="${r.k}" data-f="fin">`}</td><td class="r mono">${String(r.m).replace(".", ",")} mois</td></tr>`).join("")}</tbody></table>` : ""}
    ${W.length ? `<div class="exd-w">${W.map(w => "⚠ " + esc(w)).join("<br>")}</div>` : ""}
    <div class="exd-o"><span>Mémoriser ces choix pour les prochaines sociétés</span>${exdSeg("exdMem", x.mem, [["1", "Oui"], ["0", "Non"]])}</div></div>`; }

const _rmExd = renderModal;
renderModal = function () { const M = UI.modal; const h = _rmExd.apply(this, arguments);
  try { if (!M || M.type !== "dossiers" || !M.d || !M.d.activite || typeof h !== "string" || !h.includes('data-m="fin"')) return h; const d = M.d; exdInit(d);
    let out = h.replace(/<label class="f">[^<]*<input[^>]*data-m="debut"[^>]*><\/label>/, "").replace(/<label class="f">[^<]*<input[^>]*data-m="fin"[^>]*><\/label>/, "");
    const i = out.indexOf("</div>", out.indexOf('<div class="grid g2">')); /* fin de la première grille */
    const g = out.indexOf('<div class="grid g2">'); if (g < 0) return h;
    /* insère le bloc juste après la grille principale du formulaire */
    let depth = 0, j = g; const re = /<div\b|<\/div>/g; re.lastIndex = g; let m; while ((m = re.exec(out))) { depth += m[0] === "</div>" ? -1 : 1; if (!depth) { j = m.index + 6; break; } }
    void i; out = out.slice(0, j) + exdBlock(d) + out.slice(j);
    const ok = d.nom && d.debut && d.fin && d.fin > d.debut && !exdIssues(exdList(d)).length;
    out = out.replace(/(<button class="btn pri" data-act="createDossier")[^>]*>/, `$1 ${ok ? "" : "disabled"}>`);
    return out; } catch (e) { logErr("exercices décalés", e); return h; } };

const EXDACT = {
  exdMode: el => { const d = UI.modal.d; const x = exdInit(d); x.mode = el.dataset.v; if (x.mode === "cal") x.cm = 12; if (x.mode === "dec" && x.cm === 12) x.cm = 6; exdFirst(d); render(); },
  exdLong: el => { const d = UI.modal.d; exdInit(d).long = el.dataset.v; exdFirst(d); render(); },
  exdN: el => { const d = UI.modal.d; const x = exdInit(d); x[el.dataset.k] = +el.dataset.v; x.ov = {}; render(); },
  exdMem: el => { const d = UI.modal.d; exdInit(d).mem = el.dataset.v; render(); }
};
const EXDCHG = {
  exdCm: el => { const d = UI.modal.d; exdInit(d).cm = +el.value; exdFirst(d); render(); },
  exdDeb: el => { const d = UI.modal.d; d.debut = el.value; exdFirst(d); exdInit(d).ov = {}; render(); },
  exdFin: el => { const d = UI.modal.d; d.fin = el.value; exdInit(d).ov = {}; render(); },
  exdOv: el => { const x = exdInit(UI.modal.d); (x.ov[el.dataset.k] ||= {})[el.dataset.f] = el.value; render(); }
};
Object.assign(F2ACT, EXDACT); Object.assign(F2CHG, EXDCHG);

/* création : ajoute les exercices précédents / suivants choisis */
(function () { const _c = SACT.createDossier; SACT.createDossier = async function () { const d = UI.modal && UI.modal.d; const x = d && d.exd; const L = x ? exdList(d) : [];
  if (x && x.mem === "1") { try { localStorage.setItem(EXD_K, JSON.stringify({ mode: x.mode, cm: x.cm, long: x.long, prev: x.prev, next: x.next })); } catch (e) { } }
  const r = await _c.apply(this, arguments);
  try { if (L.length > 1 && S) { const used = new Set(S.exercices.map(e => e.id));
      L.filter(e => e.k !== "f").forEach(e => { let id = "EX" + e.fin.slice(0, 4); while (used.has(id)) id += "b"; used.add(id); if (!S.exercices.some(z => !(e.fin < z.debut || e.debut > z.fin))) S.exercices.push({ id, debut: e.debut, fin: e.fin, cloture: false }); });
      S.exercices.sort((a, b) => a.debut.localeCompare(b.debut)); Store.touch(); saveAll(); toast(S.exercices.length + " exercices créés" + (x.mode === "dec" ? " (clôture fin " + EXD_MOIS[x.cm - 1] + ")" : "") + "."); }
    if (x && S) { S.exClot = x.mode === "libre" ? null : (x.mode === "cal" ? 12 : x.cm); Store.touch(); } } catch (e) { logErr("exercices décalés", e); }
  return r; }; })();

(function () { const st = document.createElement("style"); st.textContent = `
.exd{margin-top:12px;border:1px solid #DCE5E4;border-radius:12px;padding:12px 14px;background:linear-gradient(180deg,#F7FBFA,#fff)}
.exd-h{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.exd-h b{color:#0F3D3E}
.exd-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end}.exd-g .f>span{display:block;font-size:12.5px;margin-bottom:4px}
.exd-g2{margin-top:10px}.exd-dur{margin-top:8px;font-size:12.5px;color:#4B5D5D}
.exd-t{margin-top:10px}.exd-t td{padding:4px 8px}.exd-t input{height:30px;padding:2px 6px;font-size:12.5px}.exd-t tr.cur td{background:#EEF7F4;font-weight:600}
.exd-w{margin-top:8px;padding:8px 10px;border-radius:8px;background:#FFF4E5;color:#9A4B00;font-size:12.5px}
.exd-o{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12.5px;gap:10px}`; document.head.appendChild(st); })();
