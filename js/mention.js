/* ============================================================================
   Masquer la mention du logiciel et la date d'édition dans toutes les éditions PDF
   « Document établi avec Speedix le 17/11/2026 », « Prévisions réalisées avec Speedix »,
   « Établi avec SpeedCompta le … » : chaque partie peut être masquée séparément.
   Les dates comptables (« au 31/12/2026 », « du … au … ») et les dates de signature
   (« Fait à …, le … », « A …, le … ») ne sont jamais touchées.
   ========================================================================== */
function mentCfg() { let o = {}; try { o = JSON.parse(localStorage.getItem("sc:ment") || "{}") || {}; } catch (e) { } return { brand: o.brand !== "0", date: o.date !== "0" }; }
function mentSet(k, v) { const o = Object.assign({}, (() => { try { return JSON.parse(localStorage.getItem("sc:ment") || "{}") || {}; } catch (e) { return {}; } })(), { [k]: v }); try { localStorage.setItem("sc:ment", JSON.stringify(o)); } catch (e) { } }
function mentClean(s) { if (typeof s !== "string" || !s) return s; const c = mentCfg(); if (c.brand && c.date) return s;
  if (/^\s*(A|À|Fait à)\s/.test(s)) return s; /* date de signature */
  const names = ["Speedix", "SpeedCompta", "Speed ?X"]; try { const b = typeof brNom === "function" ? brNom() : ""; if (b) names.push(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); } catch (e) { }
  const BR = "(?:le logiciel\\s+)?(?:" + names.join("|") + ")"; let t = s;
  if (!/avec\s/i.test(t) && !/\ble\s+\d{2}\/\d{2}\/\d{4}/i.test(t)) return s;
  if (!c.brand) { t = t.replace(new RegExp("\\s*avec\\s+" + BR + "\\b", "gi"), ""); t = t.replace(/^Prévisions réalisées\s*(·|-)\s*/i, "").replace(/^Prévisions réalisées\.?$/i, ""); }
  if (!c.date) { t = t.replace(/,?\s*\b[Ll]e\s+\d{2}\/\d{2}\/\d{4}/g, ""); t = t.replace(/\s*(·|-)\s*(édité|imprimé|généré)\s*\.?$/i, ""); }
  t = t.replace(/\s*[-–,]?\s*(établi[es]{0,2}|réalisé[es]{0,2}|généré[es]{0,2}|édité[es]{0,2})\s*\.?\s*$/i, (m) => /^(Document|Dossier)/i.test(t) ? m : "");
  t = t.replace(/\s+\./g, ".").replace(/\s{2,}/g, " ").trim();
  if (/^(Document|Prévisions|Copie)?\s*(établi[es]{0,2}|réalisé[es]{0,2})?\.?$/i.test(t)) return "";
  if (/^Document établi\.?$/i.test(t)) return "";
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
(function () {
  if (typeof MiniPDF === "function") { const _t = MiniPDF.prototype.text; MiniPDF.prototype.text = function (x, y, s, o) { const c = typeof s === "string" ? mentClean(s) : s; if (c === "" && s) return this; return _t.call(this, x, y, c, o); }; }
  if (typeof finDOCX === "function") { const _d = finDOCX; finDOCX = function (title, blocks) { try { blocks = (blocks || []).map(b => b && b.t === "p" && typeof b.text === "string" ? Object.assign({}, b, { text: mentClean(b.text) }) : b).filter(b => !(b && b.t === "p" && b.text === "")); } catch (e) { } return _d.call(this, title, blocks); }; }
  CHG.mentCfg = el => { mentSet(el.dataset.k, el.value); toast("Réglage enregistré : il s'applique aux prochaines éditions"); render(); };
  const card = () => { const c = mentCfg(); const sel = (k, l, on, hint) => `<label class="f">${l}<select class="in" data-ch="mentCfg" data-k="${k}"><option value="1" ${on ? "selected" : ""}>Afficher</option><option value="0" ${on ? "" : "selected"}>Masquer</option></select><small class="muted">${hint}</small></label>`;
    return `<section class="panel ment-card" style="margin-bottom:14px"><div class="panel-h"><h2>🕶 Mentions sur les éditions</h2><span class="small muted">Rapports, plaquettes, business plan, déclarations : tous les PDF</span></div><div class="panel-b"><div class="grid g2">${sel("brand", "Mention « établi avec " + esc((typeof brNom === "function" && brNom()) || "Speedix") + " »", c.brand, "Masquer : « Document établi avec Speedix le … » devient « Document établi le … ».")}${sel("date", "Date d'édition", c.date, "Masquer : la date à laquelle le document a été imprimé n'apparaît plus. Les dates d'exercice, de situation et de signature restent.")}</div><p class="small muted" style="margin:8px 0 0">Aperçu du pied de page : <b>${esc(mentClean("Document établi avec " + ((typeof brNom === "function" && brNom()) || "Speedix") + " le " + frDate(todayISO()) + ".")) || "(vide : seul le numéro de page reste)"}</b> · Page 1 / 12</p></div></section>`; };
  window.mentCardHTML = card;
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card() : h.slice(0, i) + card() + h.slice(i); };
})();
