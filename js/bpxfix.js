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
  document.addEventListener("focusin", e => { const el = e.target; if (el && el.tagName === "INPUT" && /^bpx/.test(el.dataset.ch || "")) { el.dataset.orig = el.value; if (el.classList.contains("num") || el.classList.contains("bpx-auto") || /^(eur|num)$/.test(el.dataset.t || "")) { try { el.select(); } catch (x) { } el._bpxJF = 1; } } });
  document.addEventListener("mouseup", e => { const el = e.target; if (el && el._bpxJF) { el._bpxJF = 0; if (el.value === el.dataset.orig) e.preventDefault(); } }, true);
})();
