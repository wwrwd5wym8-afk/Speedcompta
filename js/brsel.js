/* ============================================================
   Balance de révision : calcul automatique de la sélection et pagination.
   - cochez 1, 2 ou plusieurs comptes (ou cliquez-en un) : débit, crédit, solde,
     solde N-1 et variation, avec rappel des résultats N, N-1 et N-2 ;
   - numérotation des pages : 25 / 50 / 100 / 300 lignes ou infini, page « 1 / 4 ».
   ============================================================ */
function brsRes() { const ex = exCur(); const k = ex.id + "|" + E.length + "|" + (S.majE || ""); if (brsRes.k === k) return brsRes.v; brsRes.k = k; const r = e => e ? -sumPref(soldeMap(e.debut, e.fin), ["6", "7"]) : null; const p1 = prevEx(ex), p2 = p1 ? prevEx(p1) : null; brsRes.v = { n: r(ex), n1: r(p1), n2: r(p2) }; return brsRes.v; }
const brsPct = (a, b) => b ? Math.round((a - b) / Math.abs(b) * 10000) / 100 : null;
const brsPill = p => p == null ? "" : `<i class="brs-p ${p >= 0 ? "up" : "dn"}">${p >= 0 ? "+" : ""}${String(p).replace(".", ",")} %</i>`;
function brsBar() { const st = brState(); const { rows } = brRows(st); const keys = st.chk.length ? st.chk : st.sel ? [st.sel] : []; const L = rows.filter(r => keys.includes(r.k)); const R = brsRes();
  const s = L.reduce((a, r) => { a.d += r.d; a.c += r.c; a.sN += r.sN; a.s1 += r.s1; return a; }, { d: 0, c: 0, sN: 0, s1: 0 });
  return `<div class="brs-bar"><div class="brs-h"><b>Sélection</b><small>${L.length ? L.length + " compte" + (L.length > 1 ? "s" : "") + (L.length <= 3 ? " : " + L.map(r => esc(r.num)).join(", ") : "") : "cochez un ou plusieurs comptes"}</small></div>
    <div class="brs-c"><small>Débit</small><b class="mono">${eur(s.d)}</b></div><div class="brs-c"><small>Crédit</small><b class="mono">${eur(s.c)}</b></div><div class="brs-c"><small>Solde</small><b class="mono">${eur(s.sN)}</b></div>
    <div class="brs-c"><small>Solde N-1 ${brsPill(brsPct(s.sN, s.s1))}</small><b class="mono">${eur(s.s1)}</b></div><div class="brs-c"><small>Variation</small><b class="mono">${eur(s.sN - s.s1)}</b></div>
    <span class="brs-sep"></span><div class="brs-c"><small>Résultat N ${brsPill(brsPct(R.n, R.n1))}</small><b class="mono">${eur(R.n)}</b></div><div class="brs-c"><small>Résultat N-1 ${R.n2 != null ? brsPill(brsPct(R.n1, R.n2)) : ""}</small><b class="mono">${R.n1 == null ? "—" : eur(R.n1)}</b></div><div class="brs-c"><small>Résultat N-2</small><b class="mono">${R.n2 == null ? "—" : eur(R.n2)}</b></div></div>`; }
/* pagination de la balance */
function brsPage() { const st = brState(); const box = document.querySelector(".br-bal"); if (!box) return; const tb = box.querySelector(".br-t tbody"); if (!tb) return; const trs = [...tb.querySelectorAll("tr.br-r")]; const ps = st.ps === "inf" ? Infinity : Number(st.ps || 50); const n = Math.max(1, Math.ceil(trs.length / ps)); if (!st.pg || st.pg > n) st.pg = 1;
  /* page de la ligne sélectionnée */ if (st.sel && st.pgSel !== st.sel) { st.pgSel = st.sel; const i = trs.findIndex(t => t.dataset.k === st.sel); if (i >= 0 && ps !== Infinity) st.pg = Math.floor(i / ps) + 1; }
  trs.forEach((t, i) => { t.style.display = ps === Infinity || (i >= (st.pg - 1) * ps && i < st.pg * ps) ? "" : "none"; });
  let bar = box.querySelector(".brs-pg"); if (!bar) { bar = document.createElement("div"); bar.className = "brs-pg"; const sc = box.querySelector(".br-scroll"); (sc || box).after(bar); }
  const p = st.pg; bar.innerHTML = `<select class="in" data-ch="brsPs" title="Lignes par page">${[["25", "25 / page"], ["50", "50 / page"], ["100", "100 / page"], ["300", "300 / page"], ["inf", "Infini"]].map(([v, l]) => `<option value="${v}" ${String(st.ps || "50") === v ? "selected" : ""}>${l}</option>`).join("")}</select><button class="brs-b" data-act="brsPg" data-v="1" ${p > 1 ? "" : "disabled"} title="Première page">⏮</button><button class="brs-b" data-act="brsPg" data-v="${p - 1}" ${p > 1 ? "" : "disabled"} title="Page précédente">‹</button><span class="brs-n">${p} / ${n}</span><button class="brs-b" data-act="brsPg" data-v="${p + 1}" ${p < n ? "" : "disabled"} title="Page suivante">›</button><button class="brs-b" data-act="brsPg" data-v="${n}" ${p < n ? "" : "disabled"} title="Dernière page">⏭</button><span class="small muted">${trs.length} compte(s) · lignes ${trs.length ? (ps === Infinity ? 1 : (p - 1) * ps + 1) : 0} à ${ps === Infinity ? trs.length : Math.min(trs.length, p * ps)}</span>`; }
Object.assign(F2ACT, { brsPg: el => { const st = brState(); st.pg = Math.max(1, Number(el.dataset.v) || 1); brsPage(); const sc = document.querySelector(".br-scroll"); if (sc) sc.scrollTop = 0; } });
Object.assign(F2CHG, { brsPs: el => { const st = brState(); st.ps = el.value; st.pg = 1; brsPage(); } });
const _marBrs = modAfterRender;
modAfterRender = function () { _marBrs.apply(this, arguments); try { if (UI.view !== "balrev" || brState().mode === "edit") return; const tot = document.querySelector(".br-tot"); if (tot && !document.querySelector(".brs-bar")) tot.insertAdjacentHTML("afterbegin", brsBar()); brfApply(); brsPage(); } catch (e) { logErr("sélection balance", e); } };
(function () { const st = document.createElement("style"); st.textContent = `
.brs-bar{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px;padding:8px 10px;background:#F3F1FB;border:1px solid #DCD6F5;border-radius:10px;margin-bottom:8px}
.brs-h{display:flex;flex-direction:column;justify-content:center;min-width:120px;padding-right:6px}.brs-h b{color:#3B2E8C}.brs-h small{color:#6B6390;font-size:11.5px}
.brs-c{display:flex;flex-direction:column;align-items:flex-end;background:#fff;border:1px solid #E6E2F7;border-radius:8px;padding:5px 10px;min-width:104px}.brs-c small{font-size:11px;color:#6B7B7B;display:flex;gap:5px;align-items:center}.brs-c b{font-size:13.5px;color:#2A2373}
.brs-p{font-style:normal;font-size:10.5px;font-weight:700;border-radius:999px;padding:1px 6px}.brs-p.up{background:#DDF5E8;color:#0E7A4F}.brs-p.dn{background:#FDE7DF;color:#B54708}.brs-sep{width:1px;background:#DCD6F5;margin:0 4px}
.brs-pg{display:flex;align-items:center;gap:6px;padding:6px 10px;border-top:1px solid #EEF2F2;background:#FBFCFC;flex-wrap:wrap}.brs-pg select{width:auto;height:30px;padding:2px 8px;font-size:12.5px}.brs-b{width:30px;height:30px;border:1px solid #DCE5E4;background:#fff;border-radius:7px;cursor:pointer}.brs-b:disabled{opacity:.35;cursor:default}.brs-n{display:inline-grid;place-items:center;min-width:54px;height:26px;border:1px solid #8E86D6;color:#3B2E8C;border-radius:6px;font-size:12.5px;font-weight:700}`; document.head.appendChild(st); })();

/* ===== Repli « ^ » du bloc Sélection / Cumuls / Bilan-Gestion pour laisser la place à la balance ===== */
const BRF_K = "sc_brFold";
function brfCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem(BRF_K) || "{}") || {}; } catch (e) { } return Object.assign({ def: "1", mini: "1", help: "1" }, c); }
function brfSave(c) { try { localStorage.setItem(BRF_K, JSON.stringify(c)); } catch (e) { } }
function brfOn() { const c = brfCfg(); return c.fold == null ? c.def === "1" : c.fold === "1"; }
function brfMini() { const tot = document.querySelector(".br-tot"); if (!tot) return ""; const g = t => { const sp = [...tot.querySelectorAll(".br-tot-l > span, .brs-c")].find(x => (x.querySelector("small") || {}).textContent && x.querySelector("small").textContent.trim().startsWith(t)); return sp && sp.querySelector("b") ? sp.querySelector("b").outerHTML : "—"; };
  const st = brState(); const n = (st.chk || []).length || (st.sel ? 1 : 0);
  return `<span class="brf-m"><small>Sélection${n ? " (" + n + ")" : ""}</small>${n ? g("Solde") : "—"}</span><span class="brf-m"><small>Résultat N</small>${g("Résultat N")}</span><span class="brf-m"><small>Total débit</small>${g("Total débit")}</span><span class="brf-m"><small>Total crédit</small>${g("Total crédit")}</span><span class="brf-m"><small>Écart</small>${g("Écart")}</span>`; }
function brfApply() { const tot = document.querySelector(".br-tot"); if (!tot) return; const c = brfCfg(), on = brfOn();
  let h = tot.querySelector(".brf-h"); if (!h) { h = document.createElement("div"); h.className = "brf-h"; tot.prepend(h); }
  h.innerHTML = `<button class="brf-b" data-act="brfT" title="${on ? "Déplier le récapitulatif" : "Replier le récapitulatif pour agrandir la balance"}" aria-expanded="${!on}">${on ? "˅" : "^"}</button><b>Récapitulatif</b>${on && c.mini === "1" ? `<span class="brf-ms">${brfMini()}</span>` : `<span class="brf-ms small muted">${on ? "replié" : "Sélection, cumuls, bilan et gestion"}</span>`}<button class="brf-g" data-act="brfG" title="Réglages du récapitulatif">⚙</button>${UI.brfG ? `<div class="brf-pop">${[["def", "Replié à l'ouverture"], ["mini", "Résumé sur une ligne quand replié"], ["help", "Replier aussi la ligne d'aide"]].map(([k, l]) => `<div class="brf-o"><span>${l}</span><span class="seg">${[["1", "Oui"], ["0", "Non"]].map(([v, t]) => `<button class="${c[k] === v ? "on" : ""}" data-act="brfS" data-k="${k}" data-v="${v}">${t}</button>`).join("")}</span></div>`).join("")}</div>` : ""}`;
  tot.classList.toggle("brf-on", on); const hp = document.querySelector(".br-help"); if (hp) hp.style.display = on && c.help === "1" ? "none" : ""; }
Object.assign(F2ACT, {
  brfT: () => { const c = brfCfg(); c.fold = brfOn() ? "0" : "1"; brfSave(c); brfApply(); },
  brfG: () => { UI.brfG = !UI.brfG; brfApply(); },
  brfS: el => { const c = brfCfg(); c[el.dataset.k] = el.dataset.v; if (el.dataset.k === "def") delete c.fold; brfSave(c); brfApply(); }
});
(function () { const st = document.createElement("style"); st.textContent = `
.br-tot .brf-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;padding:2px 2px 6px}
.brf-b{width:28px;height:24px;border-radius:7px;border:1px solid #DCD6F5;background:#F3F1FB;color:#3B2E8C;font-weight:800;cursor:pointer;line-height:1}.brf-b:hover{background:#E6E1FA}
.brf-h>b{color:#3B2E8C;font-size:12.5px}.brf-ms{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.brf-m{display:inline-flex;gap:6px;align-items:baseline;background:#fff;border:1px solid #E6E2F7;border-radius:7px;padding:2px 8px}.brf-m small{font-size:11px;color:#6B7B7B}.brf-m b{font-size:12.5px;color:#2A2373}
.brf-g{margin-left:auto;border:0;background:none;cursor:pointer;font-size:14px;opacity:.7}.brf-g:hover{opacity:1}
.brf-pop{position:absolute;right:0;bottom:32px;z-index:30;background:#fff;border:1px solid #DCD6F5;border-radius:10px;box-shadow:0 10px 30px rgba(40,30,110,.15);padding:8px 10px;min-width:330px}
.brf-o{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:4px 0;font-size:12.5px}
.br-tot.brf-on>:not(.brf-h){display:none!important}.br-tot.brf-on .brf-h{padding-bottom:2px}`; document.head.appendChild(st); })();
