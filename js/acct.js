/* ============================================================
   Menu du compte (clic sur son nom en bas du menu, ou sur l'avatar mobile) :
   identité, rôle, offre, raccourcis utiles, mot de passe, déconnexion,
   déconnexion de tous les appareils, verrouillage automatique après inactivité.
   ============================================================ */
(function () {
  const cloud = () => !!window.SC_CLOUD_ON && !!window.SC_AUTH;
  const LK = "sc:autolock";
  const lockMin = () => { try { const v = localStorage.getItem(LK); if (v != null) return +v || 0; } catch (e) { } return cloud() ? (isAdmin() ? 0 : 60) : 0; };
  const roleLib = () => { const a = UI.access || {}; if (isAdmin()) return ["Éditeur", "ac-ed"]; if (a.role === "collab" || UI.asTeam) return ["Collaborateur", "ac-co"]; return ["Client", "ac-cl"]; };

  const st = document.createElement("style");
  st.textContent = `
  .ac-pop{position:fixed;z-index:9000;width:300px;max-height:calc(100vh - 16px);overflow:auto;height:auto!important;max-width:calc(100vw - 24px);background:#fff;border:1px solid #E3EBEA;border-radius:16px;box-shadow:0 24px 60px -12px rgba(15,61,62,.28);padding:8px;animation:acIn .16s ease-out}
  @keyframes acIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
  .ac-hd{display:flex;gap:12px;align-items:center;padding:10px 10px 12px;border-bottom:1px solid #EEF2F2;margin-bottom:6px}
  .ac-av{width:42px;height:42px;border-radius:50%;background:#0F3D3E;color:#fff;display:grid;place-items:center;font-weight:800;flex:none}
  .ac-hd b{display:block;font-size:14px;color:#13262A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ac-hd small{display:block;font-size:12px;color:#6B7B7B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ac-tg{display:inline-block;margin-top:4px;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:#E8F3F1;color:#13585A}
  .ac-tg.ac-ed{background:#FFF4CC;color:#7A5B00}.ac-tg.ac-co{background:#EEF0FF;color:#3A3F9A}
  .ac-it{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;background:none;border-radius:10px;font:inherit;font-size:13.5px;color:#13262A;cursor:pointer;text-align:left}
  .ac-it:hover,.ac-it:focus-visible{background:#F2F7F7;outline:none}.ac-it i{font-style:normal;width:20px;text-align:center}
  .ac-it small{margin-left:auto;color:#8A9999;font-size:11.5px}
  .ac-sep{height:1px;background:#EEF2F2;margin:6px 4px}
  .ac-it.ac-out{color:#B42318}.ac-it.ac-out:hover{background:#FEF3F2}
  .ac-sel{margin-left:auto;font:inherit;font-size:12px;border:1px solid #DCE5E4;border-radius:8px;padding:3px 6px;background:#fff}
  .who{cursor:pointer}.who::after{content:"⋯";margin-left:auto;color:#8A9999;font-weight:800;padding-left:6px}
  .ac-mob{border:0;background:#0F3D3E;color:#fff;width:32px;height:32px;border-radius:50%;font-weight:800;font-size:12px;margin-left:8px;flex:none;cursor:pointer}
  .ac-lockw{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9500;background:#13262A;color:#fff;padding:12px 16px;border-radius:12px;font-size:13.5px;display:flex;gap:12px;align-items:center;box-shadow:0 12px 30px rgba(0,0,0,.25)}
  .ac-lockw button{background:#F5B700;color:#13262A;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer}`;
  document.head.appendChild(st);

  function close() { const p = document.getElementById("acPop"); if (p) p.remove(); document.removeEventListener("keydown", onKey, true); }
  function onKey(e) { if (e.key === "Escape") { close(); } }
  function item(ic, lib, act, extra, cls) { return `<button class="ac-it ${cls || ""}" data-ac="${act}"><i>${ic}</i>${lib}${extra ? `<small>${extra}</small>` : ""}</button>`; }

  function open(anchor) {
    close(); const [rl, rc] = roleLib(); const a = UI.access || {}; const nm = UI.userName || "Mon compte"; const em = UI.userEmail || "";
    const nDos = ((window.INDEX && INDEX.dossiers) || []).filter(d => !d.demo).length;
    let off = ""; try { if (!isAdmin() && a.offre) { const o = (venteCfg().offres || []).find(x => x.id === a.offre); off = (o ? o.nom : a.offre) + (a.expire ? " · jusqu'au " + frDate(a.expire) : ""); } } catch (e) { }
    const has = v => typeof VIEWS !== "undefined" && VIEWS[v];
    const L = lockMin();
    const p = document.createElement("div"); p.id = "acPop"; p.className = "ac-pop"; 
    p.innerHTML = `<div class="ac-hd"><span class="ac-av">${esc(initials(nm))}</span><div style="min-width:0"><b>${esc(nm)}</b>${em ? `<small>${esc(em)}</small>` : ""}${S && S.nom ? `<small>🏢 ${esc(S.nom)}</small>` : ""}<span class="ac-tg ${rc}">${rl}</span>${off ? `<small style="margin-top:3px">${esc(off)}</small>` : ""}</div></div>
      ${(isAdmin() || nDos > 1) ? item("🏢", isAdmin() ? "Mes sociétés" : "Changer de société", "dos", nDos ? String(nDos) : "") : ""}
      ${has("params") ? item("⚙️", "Paramètres de la société", "params") : ""}
      ${!isAdmin() && has("abonnement") ? item("💳", "Mon abonnement", "abo") : ""}
      ${isAdmin() && has("licences") ? item("🔑", "Clients et accès", "lic") : ""}
      ${has("mobApp") ? item("📱", "Installer l'application", "mob") : ""}
      ${has("idees") ? item("💡", "Proposer une amélioration", "idees") : ""}
      ${cloud() ? `<div class="ac-sep"></div>${item("🔒", "Changer mon mot de passe", "pwd")}
        <div class="ac-it" style="cursor:default"><i>⏱</i>Déconnexion auto<select class="ac-sel" data-ac-lock>${[[0, "jamais"], [15, "15 min"], [30, "30 min"], [60, "1 h"], [240, "4 h"]].map(([v, l]) => `<option value="${v}" ${v === L ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="ac-sep"></div>${item("↪", "Se déconnecter", "out", "", "ac-out")}${item("⎋", "Se déconnecter de tous les appareils", "outAll", "", "ac-out")}` : ""}`;
    document.body.appendChild(p);
    const r = anchor.getBoundingClientRect(); const ph = p.offsetHeight, pw = p.offsetWidth;
    let top = r.top - ph - 8; if (top < 8) top = Math.min(r.bottom + 8, innerHeight - ph - 8);
    let left = Math.min(Math.max(8, r.left), innerWidth - pw - 8);
    p.style.top = Math.max(8, top) + "px"; p.style.left = left + "px";
    p.addEventListener("click", onAct); p.querySelector("[data-ac-lock]") && p.querySelector("[data-ac-lock]").addEventListener("change", e => { try { localStorage.setItem(LK, e.target.value); } catch (x) { } armLock(); toast(+e.target.value ? "Déconnexion automatique après " + e.target.selectedOptions[0].text + " d'inactivité." : "Déconnexion automatique désactivée."); });
    document.addEventListener("keydown", onKey, true);
    const f = p.querySelector(".ac-it"); if (f) f.focus();
  }

  async function onAct(e) {
    const b = e.target.closest("[data-ac]"); if (!b) return; const k = b.dataset.ac; close();
    if (k === "dos") go("dossiers"); else if (k === "params") go("params"); else if (k === "abo") go("abonnement"); else if (k === "lic") go("licences");
    else if (k === "mob") go("mobApp"); else if (k === "idees") go("idees");
    else if (k === "pwd") openModal({ type: "acPwd", d: {} });
    else if (k === "out") logout(false);
    else if (k === "outAll") logout(true);
  }

  async function logout(all, msg) {
    try { if (Store.flush) await Store.flush(); } catch (e) { }
    const A = window.SC_AUTH;
    if (all && A && A.s && A.s.at) { try { await fetch(A.s.at && (window.SC_CLOUD.url + "/auth/v1/logout?scope=global"), { method: "POST", headers: { apikey: window.SC_CLOUD.key, Authorization: "Bearer " + A.s.at } }); } catch (e) { } }
    try { if (msg) sessionStorage.setItem("sc:outMsg", msg); else sessionStorage.setItem("sc:outMsg", all ? "Vous êtes déconnecté de tous vos appareils." : "Vous êtes déconnecté. À bientôt !"); } catch (e) { }
    if (window.SC_LOGOUT) return SC_LOGOUT();
  }
  window.SC_ACCT_LOGOUT = logout;

  /* ---------- fenêtre « changer mon mot de passe » ---------- */
  const _rm = renderModal;
  renderModal = function () { const M = UI.modal; if (!M || M.type !== "acPwd") return _rm.apply(this, arguments);
    return `<div class="modal-bg"><div class="modal" style="max-width:440px"><div class="modal-h"><h3>Changer mon mot de passe</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div>
      <div class="modal-b"><p class="small muted" style="margin-top:0">Votre nouveau mot de passe remplace ${isAdmin() ? "l'actuel" : "votre code d'accès"} pour vous connecter avec <b>${esc(UI.userEmail || "")}</b>.</p>
      <label class="fld">Nouveau mot de passe<input class="in" type="password" id="acP1" autocomplete="new-password" minlength="8"></label>
      <label class="fld" style="margin-top:10px">Confirmer<input class="in" type="password" id="acP2" autocomplete="new-password" minlength="8"></label>
      <p class="small muted">8 caractères minimum. Conseil : mélangez lettres, chiffres et un signe.</p><div id="acPm" class="small" style="color:#B42318"></div></div>
      <div class="modal-f"><button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" id="acPgo">Enregistrer</button></div></div></div>`; };
  document.addEventListener("click", async e => {
    if (!e.target.closest || !e.target.closest("#acPgo")) return; const a = document.getElementById("acP1").value, b = document.getElementById("acP2").value, m = document.getElementById("acPm");
    if (a.length < 8) { m.textContent = "8 caractères minimum."; return; } if (a !== b) { m.textContent = "Les deux mots de passe ne correspondent pas."; return; }
    try { const A = window.SC_AUTH; const t = await A.token(); await A.setPassword(t, a); closeModal(); toast("Mot de passe modifié. Utilisez-le à votre prochaine connexion."); }
    catch (x) { m.textContent = /different from the old|same/i.test(x.message || "") ? "Choisissez un mot de passe différent de l'actuel." : /weak|short/i.test(x.message || "") ? "Mot de passe trop faible." : "Modification impossible : " + (x.message || x); }
  });

  /* ---------- ouverture du menu ---------- */
  document.addEventListener("click", e => {
    const w = e.target.closest && e.target.closest(".who, .ac-mob"); const p = document.getElementById("acPop");
    if (w) { e.preventDefault(); e.stopPropagation(); if (p) close(); else open(w); return; }
    if (p && !p.contains(e.target)) close();
  }, true);
  window.addEventListener("resize", close);

  /* avatar dans l'en-tête mobile */
  const _rn = renderNow;
  renderNow = function () { const r = _rn.apply(this, arguments); try { const t = document.querySelector(".mob-top"); if (t && !t.querySelector(".ac-mob")) { const b = document.createElement("button"); b.className = "ac-mob"; b.setAttribute("aria-label", "Mon compte"); b.textContent = initials(UI.userName || (S && S.nom) || "?"); t.appendChild(b); } } catch (e) { } return r; };

  /* ---------- déconnexion automatique après inactivité ---------- */
  let last = Date.now(), warned = false, tm = null;
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => document.addEventListener(ev, () => { last = Date.now(); if (warned) { warned = false; const w = document.getElementById("acLockW"); if (w) w.remove(); } }, { passive: true, capture: true }));
  function armLock() { clearInterval(tm); if (!cloud()) return; tm = setInterval(() => { const L = lockMin(); if (!L || !window.__SC_READY) return; const idle = Date.now() - last;
    if (idle > L * 60000) { clearInterval(tm); logout(false, "Déconnexion automatique après " + (L >= 60 ? (L / 60) + " h" : L + " min") + " d'inactivité, pour protéger vos données."); }
    else if (idle > L * 60000 - 60000 && !warned) { warned = true; const w = document.createElement("div"); w.id = "acLockW"; w.className = "ac-lockw"; w.innerHTML = `Vous allez être déconnecté dans 1 minute (inactivité). <button>Rester connecté</button>`; document.body.appendChild(w); w.querySelector("button").onclick = () => { last = Date.now(); warned = false; w.remove(); }; } }, 15000); }
  armLock();
})();
