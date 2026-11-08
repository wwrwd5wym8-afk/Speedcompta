/* ============================================================
   Menu de gauche : au survol d'un module, ses sous-modules s'affichent dans un panneau
   (sans clic) ; un clic ouvre le module sur le dernier sous-module utilisé et déplie la liste.
   ============================================================ */
(function () {
  const st = document.createElement("style"); st.textContent = `
  .nf-pop{position:fixed;z-index:8800;min-width:230px;max-width:300px;background:#fff;border:1px solid #E3EBEA;border-radius:14px;box-shadow:0 20px 50px -14px rgba(15,61,62,.35);padding:6px;animation:nfIn .12s ease-out}
  @keyframes nfIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
  .nf-h{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8A9999;padding:8px 10px 6px}
  .nf-pop a{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;font-size:13.5px;color:#13262A;cursor:pointer;text-decoration:none}
  .nf-pop a:hover{background:#F2F7F7}.nf-pop a.on{background:#0F3D3E;color:#fff}.nf-pop a .lk{margin-left:auto;font-size:11px;opacity:.6}`;
  document.head.appendChild(st);
  const hoverOK = () => matchMedia("(hover:hover) and (pointer:fine)").matches && !(document.querySelector(".mob-top") && getComputedStyle(document.querySelector(".mob-top")).display !== "none");
  let pop = null, tIn = null, tOut = null, cur = null;
  const close = () => { clearTimeout(tIn); if (pop) { pop.remove(); pop = null; cur = null; } };
  function show(a) { const k = a.dataset.k; const n = (typeof NAV2 !== "undefined" ? NAV2 : []).find(x => x[0] === k); const sub = n && Array.isArray(n[3]) ? n[3] : null; if (!sub || sub.length < 2) { close(); return; }
    if (a.classList.contains("on") && UI.navShut !== k) { close(); return; }
    close(); cur = k; pop = document.createElement("div"); pop.className = "nf-pop";
    pop.innerHTML = `<div class="nf-h">${esc(a.textContent.trim())}</div>` + sub.map(x => { const [v, l, tab] = x; const on = typeof navSubOn === "function" && navSubOn(x); return `<a data-act="go" data-v="${esc(v)}" ${tab ? `data-tab="${esc(tab)}"` : ""} class="${on ? "on" : ""}">${l}</a>`; }).join("");
    document.body.appendChild(pop); const r = a.getBoundingClientRect(); const ph = pop.offsetHeight; pop.style.left = (r.right + 8) + "px"; pop.style.top = Math.max(8, Math.min(r.top - 6, innerHeight - ph - 8)) + "px";
    pop.addEventListener("mouseenter", () => clearTimeout(tOut)); pop.addEventListener("mouseleave", () => { tOut = setTimeout(close, 220); }); pop.addEventListener("click", () => setTimeout(close, 0)); }
  document.addEventListener("mouseover", e => { if (!hoverOK()) return; const a = e.target.closest && e.target.closest('.nav2 > a[data-act="navGroup"]'); if (!a) return; clearTimeout(tOut); if (cur === a.dataset.k && pop) return; clearTimeout(tIn); tIn = setTimeout(() => show(a), 180); });
  document.addEventListener("mouseout", e => { const a = e.target.closest && e.target.closest('.nav2 > a[data-act="navGroup"]'); if (!a) return; if (e.relatedTarget && (a.contains(e.relatedTarget) || (pop && pop.contains(e.relatedTarget)))) return; clearTimeout(tIn); tOut = setTimeout(close, 220); });
  document.addEventListener("click", e => { if (pop && !pop.contains(e.target)) close(); }, true);
  window.addEventListener("scroll", close, true); window.addEventListener("resize", close);
})();
