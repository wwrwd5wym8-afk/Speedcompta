/* ============================================================================
   Business plan : saisie et suppression des montants à la main sans perdre la main
   Avant : chaque modification redessinait l'écran immédiatement ; la touche Tab / un clic sur
   la case suivante tombait dans le vide (le curseur disparaissait, la saisie suivante était perdue).
   Désormais : l'écran est redessiné juste après le déplacement, et le curseur est replacé dans la
   case visée (texte sélectionné, prêt à être remplacé). Entrée passe à la case de dessous,
   Échap annule la saisie en cours, Suppr / Retour arrière sur une case vide la remet au calcul.
   ========================================================================== */
(function () {
  const key = el => el && el.dataset ? ["ch", "k", "i", "f", "y", "t"].map(a => el.dataset[a] ?? "").join("|") + "|" + (el.id || "") : "";
  const find = k => { if (!k) return null; const [ch, kk, i, f, y, t, id] = k.split("|"); if (id) return document.getElementById(id); return [...document.querySelectorAll(`[data-ch="${ch}"]`)].find(e => (e.dataset.k ?? "") === kk && (e.dataset.i ?? "") === i && (e.dataset.f ?? "") === f && (e.dataset.y ?? "") === y && (e.dataset.t ?? "") === t) || null; };
  let pend = null;
  const wrap = (obj, name) => { const f = obj[name]; if (typeof f !== "function" || f._bpxFix) return; const g = function (el) { const R = render; let want = false; render = function () { want = true; };
      try { return f.apply(this, arguments); } finally { render = R; if (want) { clearTimeout(pend); pend = setTimeout(() => { const ae = document.activeElement; const k = ae && ae !== document.body && ae.closest && ae.closest(".main-in") ? key(ae) : ""; const caret = ae && ae.select && ae.tagName === "INPUT"; const sy = scrollY; render(); const n = find(k); if (n) { try { n.focus({ preventScroll: true }); if (caret && n.select && /^(text|search|)$/.test(n.type || "")) n.select(); } catch (e) { } } if (Math.abs(scrollY - sy) > 2) scrollTo(0, sy); }, 0); } } };
    g._bpxFix = 1; obj[name] = g; };
  const all = () => { [typeof F2CHG !== "undefined" ? F2CHG : null, CHG].forEach(o => o && Object.keys(o).filter(k => /^bpx/.test(k)).forEach(k => wrap(o, k))); };
  all(); setTimeout(all, 0);
  /* Entrée : case de la ligne suivante, même année ; Échap : annule ; case vidée = retour au calcul */
  document.addEventListener("keydown", e => { const el = e.target; if (!el || el.tagName !== "INPUT" || !/^bpx/.test(el.dataset.ch || "") || !el.closest(".main-in")) return;
    if (e.key === "Escape") { if (el.dataset.orig != null) { el.value = el.dataset.orig; } el.blur(); e.preventDefault(); return; }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); const k = key(el); const parts = k.split("|"); const ni = String((+parts[2] || 0) + 1); const target = [...document.querySelectorAll(`[data-ch="${el.dataset.ch}"]`)].find(x => (x.dataset.k ?? "") === parts[1] && (x.dataset.i ?? "") === ni && (x.dataset.f ?? "") === parts[3] && (x.dataset.y ?? "") === parts[4]); if (target) target.focus(); else el.blur(); } }, true);
  /* effacer un montant = le mettre à 0 (le calcul automatique se rétablit avec ↺) */
  document.addEventListener("change", e => { const el = e.target; if (!el || el.tagName !== "INPUT" || !el.closest || !el.closest(".main-in")) return; const ch = el.dataset.ch || ""; if (!((ch === "bpxF" && el.dataset.f === "v") || ch === "bpxPV")) return; if (String(el.value).trim() === "") { el.value = "0"; toast("Montant mis à 0 pour cette année · ↺ pour revenir au calcul automatique"); } }, true);
  document.addEventListener("focusin", e => { const el = e.target; if (el && el.tagName === "INPUT" && /^bpx/.test(el.dataset.ch || "")) { el.dataset.orig = el.value; if (el.classList.contains("num") || el.classList.contains("bpx-auto") || /^(eur|num)$/.test(el.dataset.t || "")) { try { el.select(); } catch (x) { } el._bpxJF = 1; } } });
  document.addEventListener("mouseup", e => { const el = e.target; if (el && el._bpxJF) { el._bpxJF = 0; if (el.value === el.dataset.orig) e.preventDefault(); } }, true);
})();
/* plan de trésorerie mensuel : montants arrondis à l'euro, soldes et trésorerie recalculés à partir des montants affichés */
(function () { if (typeof bpxMonthly !== "function") return; const _m = bpxMonthly; bpxMonthly = function (p, C) { const L = _m.apply(this, arguments); if (!Array.isArray(L) || !L.length) return L; const R = v => Math.round((v || 0) / 100) * 100; let t = Number((p.h || {}).treso0) || 0;
  return L.map(x => { const o = Object.assign({}, x); ["ca", "enc", "apports", "dec", "pers", "ech", "inv", "tax", "tva", "stk"].forEach(k => { if (typeof o[k] === "number") o[k] = R(o[k]); }); o.solde = (o.enc + o.apports) - (o.dec + o.pers + o.ech + o.inv + o.tax + o.tva + (o.stk || 0)); t += o.solde; o.treso = t; return o; }); }; })();
/* ---- Chiffre d'affaires compté deux fois : lignes saisies + locations calculées ----
   Les revenus de location (Investissements › Locations) s'ajoutent automatiquement au chiffre
   d'affaires. Si les mêmes véhicules ont aussi été saisis en lignes de CA, le CA est doublé.
   Détection (montants voisins), alerte, et choix en un clic : ne garder que les locations, ou
   que les lignes saisies ; chaque ligne peut être exclue / réintégrée. */
(function () {
  const _lc = bpxLocCa; bpxLocCa = function (p, all) { const L = _lc.apply(this, arguments); const src = (p.loc || []).filter(l => all || !l.opt || bpxLocOptIn(p)); return L.filter((x, i) => !(src[i] && src[i].off)); };
  const _c = bpxCalc; bpxCalc = function (p, f) { if (!p || !(p.ca || []).some(l => l.off)) return _c.apply(this, arguments); const q = Object.assign({}, p, { ca: p.ca.map(l => l.off ? Object.assign({}, l, { v: [0], g: 0, pct: "", vo: null }) : l) }); const C = _c.call(this, q, f); (C.ca || []).forEach((x, i) => { if (p.ca[i]) x.l = p.ca[i]; }); return C; };
  function dupInfo(p) { const n = 3; const loc = _lc(p, true); const ca = (p.ca || []).map((l, i) => ({ l, i, v0: Number((l.v || [])[0]) || 0 })).filter(x => !x.l.off && x.v0 > 0); const locs = (p.loc || []).map((l, i) => ({ l, i, v0: (loc.find(z => z.lib.startsWith(l.lib || "Location")) || { v: [0] }).v.find(v => v) || 0 })).filter(x => !x.l.off);
    const pairs = []; ca.forEach(c => { const m = locs.find(L => L.v0 && Math.abs(L.v0 - c.v0) / L.v0 < 0.25); if (m) pairs.push([c, m]); }); return { ca, locs, pairs, sCa: ca.reduce((a, x) => a + x.v0, 0), sLoc: locs.reduce((a, x) => a + x.v0, 0) }; }
  const _v = VIEWS.finPrev; VIEWS.finPrev = function () { let h = _v.apply(this, arguments); try { const st = UI.sub.bpx || {}; const p = bpxCur(); if (!p || st.tab !== "ca") return h; const D = dupInfo(p); const offCa = (p.ca || []).map((l, i) => [l, i]).filter(x => x[0].off), offLoc = (p.loc || []).map((l, i) => [l, i]).filter(x => x[0].off);
      let box = "";
      if (D.ca.length && D.locs.length) box = `<div class="bpd-al"><b>⚠ Chiffre d'affaires peut-être compté deux fois</b><span>Vous avez <b>${D.ca.length} ligne(s) saisie(s)</b> (${eur0(D.sCa)} la 1re année) <u>et</u> <b>${D.locs.length} revenu(s) de location</b> calculé(s) dans la partie Locations ci-dessous (${eur0(D.sLoc)}). Les deux s'additionnent dans le total.${D.pairs.length ? ` ${D.pairs.length} ligne(s) saisie(s) ont un montant proche d'une location : doublon probable.` : ""}</span><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm pri" data-act="bpdKeep" data-v="loc">Ne compter que les locations</button><button class="btn sm" data-act="bpdKeep" data-v="ca">Ne compter que les lignes saisies</button><span class="small muted">Rien n'est supprimé : une ligne exclue se réintègre en un clic.</span></div></div>`;
      if (offCa.length || offLoc.length) box += `<div class="bpd-off"><b>Exclu du chiffre d'affaires :</b> ${offCa.map(([l, i]) => `<span>${esc(l.lib || "Ligne")} <a href="#" data-act="bpdIn" data-k="ca" data-i="${i}">réintégrer</a></span>`).join("")}${offLoc.map(([l, i]) => `<span>🔑 ${esc(l.lib || "Location")} <a href="#" data-act="bpdIn" data-k="loc" data-i="${i}">réintégrer</a></span>`).join("")}</div>`;
      if (box) { const k = h.indexOf("<h2>Chiffre d'affaires HT</h2>"); const j = k >= 0 ? h.indexOf('<div class="panel-b">', k) : -1; if (j >= 0) h = h.slice(0, j + 21) + box + h.slice(j + 21); }
      /* lignes exclues : barrées ; doublons probables signalés */
      (p.ca || []).forEach((l, i) => { const re = new RegExp(`(<tr)(><td><input[^>]*data-k="ca" data-i="${i}" data-f="lib")`); if (l.off) h = h.replace(re, `$1 class="bpd-x" title="Exclu du chiffre d'affaires"$2`); else if (D.pairs.some(([c]) => c.i === i)) h = h.replace(re, `$1 class="bpd-dup" title="Montant proche d'un revenu de location : doublon probable"$2`); });
    } catch (e) { console.warn("bpd", e); } return h; };
  Object.assign(ACT, {
    bpdKeep: el => { const p = bpxCur(); if (!p) return; if (el.dataset.v === "loc") (p.ca || []).forEach(l => { if ((Number((l.v || [])[0]) || 0) > 0 || l.pct) l.off = 1; }); else (p.loc || []).forEach(l => l.off = 1); Store.touch(); render(); toast(el.dataset.v === "loc" ? "Seules les locations sont comptées dans le chiffre d'affaires" : "Seules les lignes saisies sont comptées dans le chiffre d'affaires"); },
    bpdIn: el => { const p = bpxCur(); const L = (p || {})[el.dataset.k]; if (!L || !L[+el.dataset.i]) return; delete L[+el.dataset.i].off; Store.touch(); render(); } });
  const st = document.createElement("style"); st.textContent = `.bpd-al{display:flex;flex-direction:column;gap:6px;border:1px solid #F1C27D;background:linear-gradient(135deg,#FFF7E6,#fff);border-radius:12px;padding:10px 12px;margin:0 0 10px;font-size:13px}.bpd-al b{color:#8A5A00}.bpd-off{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:12.5px;margin:0 0 10px;color:#5B6E6D}.bpd-off span{background:#EEF3F2;border-radius:999px;padding:2px 10px}
tr.bpd-x td{opacity:.45;text-decoration:line-through}tr.bpd-dup td:first-child{box-shadow:inset 3px 0 0 #E8A33D}`; document.head.appendChild(st);
})();
