/* ============================================================================
   Navigation : précédent / suivant dans tout le logiciel
   - ← → dans l'en-tête, avec menu déroulant des pages visitées (clic long ou ▾)
   - Alt+← / Alt+→, boutons « précédent / suivant » de la souris, retour du navigateur
   - chaque étape mémorise la page, l'espace, l'onglet, le journal, le mois, le compte…
     et la position de défilement ; « Récents » : 30 dernières pages, recherche, épingles
   - réglage Oui/Non dans Paramètres
   ========================================================================== */
const NH = { list: [], i: -1, lock: false };
const NH_SUB = ["consult", "grid", "br", "pz", "saisie", "tiers", "pc", "inbox", "sdm", "factu", "let", "prv", "ged", "jsy"];
function nhOn() { try { return localStorage.getItem("sc:nhOn") !== "0"; } catch (e) { return true; } }
function nhSnap() { const sub = {}; NH_SUB.forEach(k => { const v = UI.sub && UI.sub[k]; if (v && typeof v === "object") { try { sub[k] = JSON.parse(JSON.stringify(v, (key, val) => val instanceof Set ? [...val] : val)); } catch (e) { } } });
  let sp = UI.space || ""; try { sp = curSpace() || sp; } catch (e) { } return { view: UI.view, space: sp, spTab: Object.assign({}, UI.spTab || {}), sub, soc: S && S.id, at: Date.now(), y: window.scrollY }; }
function nhSig(s) { const u = s.sub || {}; const c = u.consult || {}, g = u.grid || {}, b = u.br || {}, p = u.pz || {}, sa = u.saisie || {}, t = u.tiers || {}, pc = u.pc || {};
  let sp = ""; try { const k = s.space; if (k && SPACES[k]) sp = k + ":" + (s.spTab || {})[k]; } catch (e) { }
  return [s.soc, s.view, sp, c.tab, c.tab === "gl" ? c.compte : "", g.j, g.m, b.type, b.mode, p.tab, sa.journal, sa.month, t.type, pc.tab].join("|"); }
function nhLabel(s) { let l = ""; try { l = typeof actView === "function" ? actView(s.view) : ""; } catch (e) { } const u = s.sub || {};
  if (s.space && typeof SPACES !== "undefined" && SPACES[s.space]) { const T = SPACES[s.space].tabs[(s.spTab || {})[s.space] || 0]; if (T && T[0] === s.view) l = SPACES[s.space].lib + " › " + T[1]; }
  if (!l) { try { const N = (typeof NAV2 !== "undefined" ? NAV2 : []).find(n => n[0] === s.view); l = N ? N[1] : s.view; } catch (e) { l = s.view; } }
  if (s.view === "grille" && u.grid) { const j = journalBy(u.grid.j) || {}; l = "Saisie · " + (j.code || "") + " " + (j.lib || ""); }
  if (s.view === "grille" && u.grid) l += (u.grid.m && u.grid.m !== "all" ? " · " + (typeof MOISL !== "undefined" ? MOISL[+u.grid.m.slice(5) - 1] : u.grid.m) : "");
  if (s.view === "consult" && u.consult && u.consult.tab === "gl" && u.consult.compte) l += " · " + u.consult.compte;
  if (s.view === "balrev" && u.br && u.br.type && u.br.type !== "gen") l += " · " + ({ cli: "clients", fou: "fournisseurs" }[u.br.type] || u.br.type);
  if (s.view === "pieces" && u.pz && u.pz.tab === "masse") l += " · saisie en masse";
  return String(l || "Page").replace(/<[^>]+>/g, ""); }
function nhRecord() { if (NH.lock || !nhOn() || !S || !UI.view || UI.view === "welcome") return; const s = nhSnap(); const sig = nhSig(s); const cur = NH.list[NH.i];
  if (cur && (cur.sig === sig || (cur.view === s.view && nhLabel(s) === cur.lab))) { cur.sub = s.sub; cur.sig = sig; cur.y = window.scrollY; return; }
  if (cur) cur.y = NH.lastY != null ? NH.lastY : cur.y;
  NH.list = NH.list.slice(0, NH.i + 1); s.sig = sig; s.lab = nhLabel(s); NH.list.push(s); if (NH.list.length > 80) NH.list.shift(); NH.i = NH.list.length - 1;
  try { history.pushState({ nh: NH.i }, "", location.href.split("#")[0] + "#" + encodeURIComponent(s.view)); } catch (e) { }
  nhRecent(s); }
function nhRecent(s) { try { const k = "sc:nhRecent"; let R = JSON.parse(localStorage.getItem(k) || "[]"); R = R.filter(x => x.sig !== s.sig && !(x.lab === s.lab && x.soc === s.soc)); R.unshift({ sig: s.sig, lab: s.lab, view: s.view, space: s.space, spTab: s.spTab, sub: s.sub, soc: s.soc, at: s.at }); localStorage.setItem(k, JSON.stringify(R.slice(0, 30))); } catch (e) { } }
function nhRecentList() { try { return JSON.parse(localStorage.getItem("sc:nhRecent") || "[]"); } catch (e) { return []; } }
function nhPins() { try { return JSON.parse(localStorage.getItem("sc:nhPins") || "[]"); } catch (e) { return []; } }
function nhApply(s) { if (!s) return; if (s.soc && S && s.soc !== S.id) { toast("Cette page appartient à un autre dossier."); return; }
  NH.lock = true; try { UI.modal = null; UI.space = s.space || UI.space; UI.spTab = Object.assign({}, UI.spTab || {}, s.spTab || {}); Object.keys(s.sub || {}).forEach(k => { try { UI.sub[k] = JSON.parse(JSON.stringify(s.sub[k])); } catch (e) { } }); UI.view = s.view; try { localStorage.setItem("sc:view", s.view); } catch (e) { } render(); } finally { NH.lock = false; }
  const y = s.y || 0; requestAnimationFrame(() => window.scrollTo(0, y)); }
function nhGo(d) { const n = NH.i + d; if (n < 0 || n >= NH.list.length) return; NH.lastY = window.scrollY; NH.list[NH.i].y = window.scrollY; NH.i = n; nhApply(NH.list[n]); NH.menu = null; render(); }
function nhJump(n) { if (n < 0 || n >= NH.list.length) return; NH.list[NH.i].y = window.scrollY; NH.i = n; nhApply(NH.list[n]); NH.menu = null; render(); }
const nhAgo = t => { const s = (Date.now() - t) / 1000; return s < 60 ? "à l'instant" : s < 3600 ? Math.round(s / 60) + " min" : s < 86400 ? Math.round(s / 3600) + " h" : Math.round(s / 86400) + " j"; };
function nhBar() { if (!nhOn() || !S) return ""; const can = d => NH.i + d >= 0 && NH.i + d < NH.list.length; const prev = NH.list[NH.i - 1], next = NH.list[NH.i + 1];
  return `<div class="nh"><button class="nh-b" data-act="nhBack" ${can(-1) ? "" : "disabled"} title="${prev ? "Revenir à : " + esc(prev.lab) : "Pas de page précédente"} (Alt+←)" aria-label="Page précédente"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><button class="nh-b" data-act="nhFwd" ${can(1) ? "" : "disabled"} title="${next ? "Aller à : " + esc(next.lab) : "Pas de page suivante"} (Alt+→)" aria-label="Page suivante"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button><button class="nh-b nh-m ${NH.menu ? "on" : ""}" data-act="nhMenu" title="Pages visitées et récentes" aria-label="Historique de navigation"><svg viewBox="0 0 24 24"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8.5"/></svg></button></div>`; }
function nhMenuHTML() { if (!NH.menu) return ""; const q = (NH.q || "").toLowerCase(); const pins = nhPins(); const rec = nhRecentList().filter(r => !S || r.soc === S.id);
  const ses = NH.list.map((s, i) => ({ s, i })).reverse().filter(o => !q || o.s.lab.toLowerCase().includes(q)); const R = rec.filter(r => !q || r.lab.toLowerCase().includes(q)); const P = pins.filter(r => (!S || r.soc === S.id) && (!q || r.lab.toLowerCase().includes(q)));
  const pinned = sig => pins.some(p => p.sig === sig);
  return `<div class="nh-bg" data-act="nhMenuX"></div><div class="nh-pop"><div class="nh-s"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><input id="nhQ" placeholder="Rechercher une page visitée…" value="${esc(NH.q || "")}" autocomplete="off"></div>
    ${P.length ? `<div class="nh-h">📌 Épinglées</div>${P.map((r, k) => `<div class="nh-i"><button class="nh-l" data-act="nhPinGo" data-k="${k}"><b>${esc(r.lab)}</b></button><button class="nh-pin on" data-act="nhPin" data-sig="${esc(r.sig)}" title="Retirer des épingles">📌</button></div>`).join("")}` : ""}
    <div class="nh-h">Cette session <span>Alt+← / Alt+→</span></div>${ses.slice(0, 15).map(({ s, i }) => `<div class="nh-i ${i === NH.i ? "cur" : ""}"><button class="nh-l" data-act="nhJump" data-i="${i}"><span class="nh-dot">${i === NH.i ? "●" : i < NH.i ? "‹" : "›"}</span><b>${esc(s.lab)}</b><small>${nhAgo(s.at)}</small></button><button class="nh-pin ${pinned(s.sig) ? "on" : ""}" data-act="nhPin" data-i="${i}" title="Épingler">📌</button></div>`).join("") || `<div class="nh-e">Aucune page.</div>`}
    ${R.length ? `<div class="nh-h">Récents <button class="lnk small" data-act="nhClear">Effacer</button></div>${R.slice(0, 12).map((r, k) => `<div class="nh-i"><button class="nh-l" data-act="nhRecGo" data-sig="${esc(r.sig)}"><span class="nh-dot">↺</span><b>${esc(r.lab)}</b><small>${nhAgo(r.at)}</small></button></div>`).join("")}` : ""}</div>`; }
(function () {
  const _mar = modAfterRender; modAfterRender = function () { const r = _mar.apply(this, arguments); try { nhRecord(); const h = document.querySelector(".hdr"); if (h && nhOn()) { let box = h.querySelector(".nh-host"); if (!box) { box = document.createElement("div"); box.className = "nh-host"; h.insertBefore(box, h.firstChild); } box.innerHTML = nhBar(); } let m = document.getElementById("nhMenu"); if (NH.menu) { if (!m) { m = document.createElement("div"); m.id = "nhMenu"; document.body.appendChild(m); } m.innerHTML = nhMenuHTML(); } else if (m) m.remove(); } catch (e) { console.warn("nh", e); } return r; };
  window.addEventListener("scroll", () => { NH.lastY = window.scrollY; }, { passive: true });
  window.addEventListener("popstate", ev => { if (!nhOn()) return; const n = ev.state && ev.state.nh; if (typeof n === "number" && n !== NH.i) { NH.i = Math.max(0, Math.min(n, NH.list.length - 1)); nhApply(NH.list[NH.i]); } else if (n == null && NH.i > 0) { nhGo(-1); } });
  document.addEventListener("keydown", ev => { if (!nhOn()) return; if (ev.altKey && !ev.ctrlKey && !ev.metaKey && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) { const t = ev.target; if (t && t.closest && t.closest("textarea")) return; ev.preventDefault(); nhGo(ev.key === "ArrowLeft" ? -1 : 1); } else if (ev.key === "Escape" && NH.menu) { NH.menu = null; render(); } });
  document.addEventListener("mouseup", ev => { if (!nhOn()) return; if (ev.button === 3) { ev.preventDefault(); nhGo(-1); } else if (ev.button === 4) { ev.preventDefault(); nhGo(1); } });
  document.addEventListener("input", ev => { if (ev.target && ev.target.id === "nhQ") { NH.q = ev.target.value; const m = document.getElementById("nhMenu"); if (m) { m.innerHTML = nhMenuHTML(); const q = document.getElementById("nhQ"); q.focus(); q.setSelectionRange(q.value.length, q.value.length); } } });
  /* appui long sur ← ou → : ouvre la liste */
  let lp; document.addEventListener("pointerdown", ev => { const b = ev.target.closest && ev.target.closest(".nh-b[data-act=nhBack],.nh-b[data-act=nhFwd]"); if (!b) return; lp = setTimeout(() => { NH.menu = true; NH.lp = true; render(); }, 450); });
  document.addEventListener("pointerup", () => clearTimeout(lp)); document.addEventListener("contextmenu", ev => { const b = ev.target.closest && ev.target.closest(".nh-b"); if (b) { ev.preventDefault(); NH.menu = true; render(); } });
})();
Object.assign(ACT, {
  nhBack: () => { if (NH.lp) { NH.lp = false; return; } nhGo(-1); }, nhFwd: () => { if (NH.lp) { NH.lp = false; return; } nhGo(1); },
  nhMenu: () => { NH.menu = !NH.menu; NH.q = ""; render(); setTimeout(() => { const q = document.getElementById("nhQ"); q && q.focus(); }, 20); },
  nhMenuX: () => { NH.menu = null; render(); },
  nhJump: el => nhJump(+el.dataset.i),
  nhRecGo: el => { const r = nhRecentList().find(x => x.sig === el.dataset.sig); NH.menu = null; if (r) nhApply(r); },
  nhPinGo: el => { const P = nhPins().filter(r => !S || r.soc === S.id); const r = P[+el.dataset.k]; NH.menu = null; if (r) nhApply(r); },
  nhPin: el => { let P = nhPins(); if (el.dataset.sig) P = P.filter(p => p.sig !== el.dataset.sig); else { const s = NH.list[+el.dataset.i]; if (!s) return; if (P.some(p => p.sig === s.sig)) P = P.filter(p => p.sig !== s.sig); else P.unshift({ sig: s.sig, lab: s.lab, view: s.view, space: s.space, spTab: s.spTab, sub: s.sub, soc: s.soc }); } try { localStorage.setItem("sc:nhPins", JSON.stringify(P.slice(0, 20))); } catch (e) { } render(); },
  nhClear: () => { try { localStorage.removeItem("sc:nhRecent"); } catch (e) { } render(); }
});
CHG.nhOn = el => { try { localStorage.setItem("sc:nhOn", el.value); } catch (e) { } toast(el.value === "1" ? "Navigation précédent / suivant activée" : "Navigation précédent / suivant désactivée"); render(); };
(function () { const _p = VIEWS.params; if (typeof _p !== "function") return; VIEWS.params = function () { const h = _p.apply(this, arguments); const v = nhOn() ? "1" : "0";
  const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>↔ Navigation précédent / suivant</h2></div><div class="panel-b"><label class="f">Afficher ← → et l'historique des pages dans l'en-tête<select class="in" data-ch="nhOn"><option value="1" ${v === "1" ? "selected" : ""}>Oui</option><option value="0" ${v === "0" ? "selected" : ""}>Non</option></select><small class="muted">Alt+← / Alt+→, boutons précédent / suivant de la souris et du navigateur. Appui long ou clic droit sur une flèche : liste des pages visitées, récentes et épinglées. L'onglet, le journal, le mois, le compte et la position dans la page sont restitués.</small></label></div></section>`;
  const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); }; })();
(function () { const st = document.createElement("style"); st.textContent = `
.nh-host{display:flex;align-items:center;flex:none}
.nh{display:inline-flex;align-items:center;gap:2px;background:#F2F5F4;border:1px solid #E1E8E6;border-radius:12px;padding:3px}
.nh-b{width:34px;height:32px;border:0;border-radius:9px;background:transparent;display:grid;place-items:center;cursor:pointer;color:#0F3D3E;transition:background .12s,color .12s,transform .08s}
.nh-b svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.nh-b:hover:not([disabled]){background:#fff;box-shadow:0 1px 4px rgba(15,61,62,.15)}.nh-b:active:not([disabled]){transform:scale(.94)}
.nh-b[disabled]{color:#B4C0BE;cursor:default}.nh-m{width:30px}.nh-m.on{background:#0F3D3E;color:#fff}
.nh-bg{position:fixed;inset:0;z-index:70}
.nh-pop{position:fixed;z-index:71;top:64px;left:max(250px,14vw);width:380px;max-height:70vh;overflow:auto;background:#fff;border:1px solid #DCE3EF;border-radius:14px;box-shadow:0 22px 56px rgba(15,27,51,.25);padding:8px;animation:nhIn .14s ease-out}
@keyframes nhIn{from{opacity:0;transform:translateY(-6px)}}
.nh-s{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #E1E8E6;border-radius:10px;margin-bottom:6px}.nh-s svg{width:16px;height:16px;fill:none;stroke:#8590A8;stroke-width:2}.nh-s input{border:0;outline:none;flex:1;font:inherit;font-size:14px}
.nh-h{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#8590A8;padding:8px 8px 4px}.nh-h span{text-transform:none;letter-spacing:0;font-weight:600}
.nh-i{display:flex;align-items:center;border-radius:9px}.nh-i:hover{background:#F4F7F6}.nh-i.cur{background:#EEF6F5}
.nh-l{flex:1;display:flex;align-items:center;gap:8px;border:0;background:none;padding:7px 8px;font:inherit;font-size:13px;cursor:pointer;text-align:left;min-width:0;color:#14202B}.nh-l b{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nh-l small{color:#8590A8;font-size:11px;flex:none}
.nh-dot{width:14px;color:#13585A;flex:none;text-align:center}
.nh-pin{border:0;background:none;cursor:pointer;opacity:.25;font-size:12px;padding:4px 8px}.nh-i:hover .nh-pin,.nh-pin.on{opacity:1}
.nh-e{padding:10px;color:#8590A8;font-size:13px}
@media (max-width:760px){.nh-pop{left:8px;right:8px;width:auto}.nh-m{display:none}}`; document.head.appendChild(st); })();
