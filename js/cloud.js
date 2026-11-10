/* ============================================================
   SpeedCompta en ligne (version autonome) : comptes, base de données Supabase,
   invitations des clients avec leur société et les accès de leur offre.
   Chargé uniquement dans la version autonome, quand window.SC_CLOUD est configuré.
   ============================================================ */
(function () {
  const CFG = window.SC_CLOUD; if (!CFG || !CFG.url || !CFG.key) return;
  const URL0 = CFG.url.replace(/\/+$/, ""), KEY = CFG.key; const LS = "sc:cloudAuth";
  window.SC_CLOUD_ON = true; document.documentElement.classList.add("sc-cloud");

  /* ---------------- authentification (Supabase Auth, API REST) ---------------- */
  const Auth = {
    s: (() => { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; } })(),
    save(s) { this.s = s; try { if (s) localStorage.setItem(LS, JSON.stringify(s)); else localStorage.removeItem(LS); } catch (e) { } },
    async call(path, body, method = "POST", token) { const r = await fetch(URL0 + "/auth/v1/" + path, { method, headers: Object.assign({ apikey: KEY, "Content-Type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}), body: body ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch (e) { } if (!r.ok) { const m = j.msg || j.error_description || j.message || j.error || ("Erreur " + r.status); const e = new Error(m); e.status = r.status; e.raw = j; throw e; } return j; },
    keep(j) { if (!j || !j.access_token) return null; const s = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, user: j.user ? { id: j.user.id, email: j.user.email } : (this.s && this.s.user) }; this.save(s); return s; },
    async login(email, password) { return this.keep(await this.call("token?grant_type=password", { email, password })); },
    async signup(email, password) { const j = await this.call("signup", { email, password }); if (j.access_token) return this.keep(j); if (j.session && j.session.access_token) return this.keep(j.session); return null; },
    async refresh() { if (!this.s || !this.s.rt) return null; try { return this.keep(await this.call("token?grant_type=refresh_token", { refresh_token: this.s.rt })); } catch (e) { if (e.status === 400 || e.status === 401) this.save(null); throw e; } },
    async token() { if (!this.s) return null; if (Date.now() > this.s.exp) { try { await this.refresh(); } catch (e) { return null; } } return this.s && this.s.at; },
    async recover(email) { return this.call("recover", { email, redirect_to: location.href.split("#")[0] }); },
    async setPassword(at, password) { return this.call("user", { password }, "PUT", at); },
    async logout() { try { const t = this.s && this.s.at; if (t) await this.call("logout", null, "POST", t); } catch (e) { } this.save(null); }
  };
  window.SC_AUTH = Auth;

  /* ---------------- base de données : documents (même interface que la base Claude) ---------------- */
  async function rest(path, opt = {}) { let t = await Auth.token(); if (!t) throw Object.assign(new Error("session expirée"), { code: "unauthenticated" });
    const go = async tk => fetch(URL0 + "/rest/v1/" + path, Object.assign({}, opt, { headers: Object.assign({ apikey: KEY, Authorization: "Bearer " + tk, "Content-Type": "application/json" }, opt.headers || {}) }));
    let r = await go(t); if (r.status === 401) { try { await Auth.refresh(); r = await go(Auth.s.at); } catch (e) { } }
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) { } throw Object.assign(new Error(j.message || ("Erreur " + r.status)), { code: r.status === 403 || r.status === 401 ? "permission_denied" : r.status === 413 ? "quota_exceeded" : "unavailable", status: r.status }); }
    if (r.status === 204) return null; const tx = await r.text(); return tx ? JSON.parse(tx) : null; }
  const enc = v => encodeURIComponent(v);
  const parentOf = p => p.split("/").slice(0, -1).join("/");
  const snap = (path, row) => ({ id: path.split("/").pop(), exists: !!row, data: () => row ? row.data : undefined, ref: docRef(path) });
  function docRef(path) { return {
    id: path.split("/").pop(), path,
    async get() { const r = await rest("sc_docs?select=data&path=eq." + enc(path)); return snap(path, r && r[0]); },
    async set(data) { await rest("sc_docs?on_conflict=path", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, parent: parentOf(path), data: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() }) }); },
    async update(patch) { const s = await this.get(); await this.set(Object.assign({}, s.exists ? s.data() : {}, patch)); },
    async delete() { await rest("sc_docs?path=eq." + enc(path), { method: "DELETE", headers: { Prefer: "return=minimal" } }); },
    collection(name) { return collRef(path + "/" + name); } }; }
  function collRef(path) { return {
    id: path.split("/").pop(), path, doc(id) { return docRef(path + "/" + id); },
    async get() { const out = []; let off = 0; for (;;) { const r = await rest("sc_docs?select=path,data&order=path&parent=eq." + enc(path) + "&limit=1000&offset=" + off) || []; out.push(...r); if (r.length < 1000) break; off += 1000; }
      const docs = out.map(x => snap(x.path, x)); return { docs, size: docs.length, empty: !docs.length }; } }; }
  const DB = { doc: p => docRef(p), collection: p => collRef(p) };
  window.SC_DB = DB;

  /* ---------------- écran de connexion ---------------- */
  const nom = () => (typeof CONFIG !== "undefined" && CONFIG && CONFIG.branding && CONFIG.branding.nom) || (() => { try { return (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "SpeedCompta"; } catch (e) { return "SpeedCompta"; } })();
  const ico = () => (window.SCLOGO ? SCLOGO.iconURL() : "");
  function errFr(e) { const m = String((e && e.message) || e || "");
    if (/SC_BAD_CODE/i.test(m)) return "E-mail ou code d'accès incorrect.";
    if (/SC_EXISTS/i.test(m)) return "Un compte existe déjà avec cette adresse e-mail (créé lors d'un essai précédent, ou c'est l'adresse du cabinet). Connectez-vous avec son mot de passe, ou demandez à votre cabinet de cliquer sur « Réinitialiser l'accès ».";
    if (/SC_NO_INVITE|Database error saving new user/i.test(m)) return "E-mail ou code d'accès incorrect. Utilisez l'adresse e-mail et le code envoyés par votre cabinet, ou contactez-le.";
    if (/Invalid login credentials/i.test(m)) return "E-mail, code d'accès ou mot de passe incorrect.";
    if (/Email not confirmed/i.test(m)) return "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail), puis reconnectez-vous.";
    if (/already registered|already been registered|User already exists/i.test(m)) return "Un compte existe déjà avec cette adresse : connectez-vous.";
    if (/Password should be|at least/i.test(m)) return "Mot de passe trop court : 8 caractères minimum.";
    if (/rate limit|too many/i.test(m)) return "Trop de tentatives : réessayez dans quelques minutes.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Connexion impossible : vérifiez votre accès à internet.";
    return m || "Une erreur est survenue."; }
  function screen(mode, msg, ok) { const app = document.getElementById("app"); if (!app) return;
    const T = { login: ["Connexion", "Se connecter"], signup: ["Première connexion", "Créer mon mot de passe"], recover: ["Mot de passe oublié", "Recevoir le lien"], reset: ["Nouveau mot de passe", "Enregistrer"] }[mode];
    app.innerHTML = `<div class="cl-wrap"><form class="cl-card" id="clForm" novalidate>
      <div class="cl-brand"><img src="${ico()}" alt="" width="56" height="56"><div><b>Speed<i>Compta</i></b><span>Simple · Rapide · Efficace</span></div></div>
      <h1>${T[0]}</h1>
      ${mode === "signup" ? `<p class="cl-sub">Utilisez l'adresse e-mail à laquelle votre cabinet vous a invité, puis choisissez votre mot de passe.</p>` : mode === "recover" ? `<p class="cl-sub">Indiquez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>` : ""}
      ${mode !== "reset" ? `<label>Adresse e-mail<input id="clEmail" type="email" autocomplete="email" inputmode="email" required value="${(screen._email || "").replace(/"/g, "&quot;")}"></label>` : ""}
      ${mode !== "recover" ? `<label>${mode === "login" ? "Code d'accès ou mot de passe" : "Mot de passe"}<input id="clPass" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" ${mode === "login" ? 'placeholder="SC-XXX-XXXX-XXXX"' : 'minlength="8"'} required></label>` : ""}
      ${mode === "signup" || mode === "reset" ? `<label>Confirmer le mot de passe<input id="clPass2" type="password" autocomplete="new-password" minlength="8" required></label>` : ""}
      ${msg ? `<div class="cl-msg ${ok ? "ok" : ""}">${msg}</div>` : ""}
      <button class="cl-btn" type="submit">${T[1]}</button>
      ${mode === "login" ? `<p class="cl-sub" style="margin-top:12px">Client : saisissez l'e-mail et le <b>code d'accès</b> reçus de votre cabinet.</p>` : ""}<div class="cl-links">${mode === "login" ? `<a data-cl="recover">Mot de passe oublié (cabinet)</a>` : mode === "reset" ? "" : `<a data-cl="login">← Retour à la connexion</a>`}</div>
    </form>${mode === "login" ? '<div id="clOffres"></div>' : ""}</div>`;
    if (mode === "login") offres();
    app.querySelectorAll("[data-cl]").forEach(a => a.addEventListener("click", () => { const e = document.getElementById("clEmail"); if (e) screen._email = e.value; screen(a.dataset.cl); }));
    const f = document.getElementById("clForm"); const first = f.querySelector("input"); if (first && !first.value) setTimeout(() => first.focus(), 50);
    f.addEventListener("submit", async ev => { ev.preventDefault(); const btn = f.querySelector(".cl-btn"); const em = (document.getElementById("clEmail") || {}).value; const pw = (document.getElementById("clPass") || {}).value; const pw2 = (document.getElementById("clPass2") || {}).value;
      if (em !== undefined) screen._email = em.trim();
      if ((mode === "signup" || mode === "reset") && pw !== pw2) return screen(mode, "Les deux mots de passe ne sont pas identiques.");
      if (mode !== "recover" && mode !== "reset" && (!em || !pw)) return screen(mode, "Renseignez votre e-mail et votre mot de passe.");
      btn.disabled = true; btn.textContent = "Patientez…";
      try {
        if (mode === "login") { const isCode = /^\s*sc-/i.test(pw); const p2 = isCode ? pw.trim().toUpperCase().replace(/\s+/g, "") : pw;
          try { await Auth.login(em.trim(), p2); }
          catch (e) { if (!isCode || !/Invalid login credentials/i.test(e.message || "")) throw e;
            /* première connexion d'un client : son compte est créé avec son code (vérifié par la base) */
            let s = null; try { s = await Auth.signup(em.trim(), p2); } catch (e2) { if (/already registered|already been registered|User already exists/i.test(e2.message || "")) throw new Error("SC_EXISTS"); throw e2; }
            if (!s) { try { await Auth.login(em.trim(), p2); } catch (e3) { if (/Email not confirmed/i.test(e3.message || "")) throw e3; throw new Error("SC_EXISTS"); } } }
          screen._done(); }
        else if (mode === "signup") { const s = await Auth.signup(em.trim(), pw); if (s) screen._done(); else screen("login", "Compte créé. Ouvrez l'e-mail de confirmation reçu, puis connectez-vous ici.", true); }
        else if (mode === "recover") { await Auth.recover(em.trim()); screen("login", "Si un compte existe pour cette adresse, un lien vient de vous être envoyé par e-mail.", true); }
        else if (mode === "reset") { await Auth.setPassword(screen._rat, pw); history.replaceState(null, "", location.pathname); screen("login", "Mot de passe modifié : connectez-vous.", true); }
      } catch (e) { screen(mode, errFr(e)); }
    }); }

  /* offres et tarifs, affichés sous la connexion (vitrine publique publiée par l'éditeur) */
  let OFF = null;
  window.SC_OFFRES = f => { if (f) OFF = null; return offres(); };
  async function offres() { const box = () => document.getElementById("clOffres"); try {
      if (!OFF) { const r = await fetch(URL0 + "/rest/v1/sc_docs?select=data&path=eq." + encodeURIComponent("public/offres"), { headers: { apikey: KEY } }); const j = r.ok ? await r.json() : []; OFF = (j[0] && j[0].data) || { offres: [] }; }
      const b = box(); if (!b || !OFF.actif || !(OFF.offres || []).length) return;
      if (!document.getElementById("clOffCss")) { const st = document.createElement("style"); st.id = "clOffCss"; st.textContent = `
        .cl-wrap{display:flex!important;flex-direction:column;align-items:center;gap:34px}
        #clOffres{width:min(1040px,100%);animation:clOffIn .6s ease-out both}@keyframes clOffIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .clo-h{text-align:center;margin-bottom:18px}.clo-h h2{margin:0;font-size:24px;color:#0F3D3E;letter-spacing:-.3px}.clo-h p{margin:6px 0 0;color:#4A5B5B;font-size:14px}
        .clo-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
        .clo-c{position:relative;background:#fff;border:1px solid #E3EBEA;border-radius:18px;padding:22px 20px;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 24px rgba(15,61,62,.06)}
        .clo-c.top{border:2px solid #0F3D3E;box-shadow:0 16px 40px rgba(15,61,62,.14)}
        .clo-b{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#0F3D3E;color:#fff;font-size:11px;font-weight:700;padding:3px 12px;border-radius:999px;white-space:nowrap}
        .clo-n{font-size:12px;font-weight:800;letter-spacing:.08em;color:#4A5B5B;text-transform:uppercase}.clo-p{font-size:34px;font-weight:800;color:#0F3D3E;line-height:1}.clo-p small{font-size:13px;font-weight:500;color:#6B7B7B}
        .clo-d{font-size:13px;color:#6B7B7B}.clo-c ul{list-style:none;margin:4px 0 6px;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14px;color:#1F2D2D;flex:1}.clo-c li::before{content:"✓";color:#13585A;font-weight:800;margin-right:8px}
        .clo-a{display:block;text-align:center;padding:11px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;background:#F2F7F7;color:#0F3D3E;border:1px solid #D8E4E3}.clo-c.top .clo-a{background:#0F3D3E;color:#fff;border-color:#0F3D3E}
        .clo-f{text-align:center;margin-top:16px;font-size:13px;color:#6B7B7B}.clo-f a{color:#13585A;font-weight:600}`; document.head.appendChild(st); }
      const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const per = p => p === "an" ? "HT / an" : p === "unique" ? "HT, une fois" : "HT / mois";
      const prix = c => { const v = (Number(c) || 0) / 100; return v.toLocaleString("fr-FR", { maximumFractionDigits: v % 1 ? 2 : 0 }) + " €"; };
      const act = o => o.lien ? `<a class="clo-a" href="${e(o.lien)}" target="_blank" rel="noopener">Souscrire</a>` : OFF.email ? `<a class="clo-a" href="mailto:${e(OFF.email)}?subject=${encodeURIComponent("Offre " + o.nom + " - " + (OFF.nom || "SpeedCompta"))}&body=${encodeURIComponent("Bonjour,\n\nJe souhaite souscrire à l'offre " + o.nom + ".\n\nNom / société :\nTéléphone :\n\nMerci.")}">Choisir cette offre</a>` : "";
      b.innerHTML = `<div class="clo-h"><h2>Nos offres</h2><p>Pas encore client ? Choisissez votre formule : nous créons votre espace et vous recevez votre code d'accès.</p></div>
        <div class="clo-g">${OFF.offres.map(o => `<div class="clo-c ${o.top ? "top" : ""}">${o.top ? '<span class="clo-b">Le plus choisi</span>' : ""}<div class="clo-n">${e(o.nom)}</div><div class="clo-p">${prix(o.prix)} <small>${per(o.periode)}</small></div>${o.desc ? `<div class="clo-d">${e(o.desc)}</div>` : ""}<ul>${(o.inclus || []).map(x => `<li>${e(x)}</li>`).join("")}</ul>${act(o)}</div>`).join("")}</div>
        ${OFF.email || OFF.tel ? `<div class="clo-f">Une question ? ${OFF.email ? `<a href="mailto:${e(OFF.email)}">${e(OFF.email)}</a>` : ""}${OFF.email && OFF.tel ? " · " : ""}${OFF.tel ? `<a href="tel:${e(OFF.tel)}">${e(OFF.tel)}</a>` : ""}</div>` : ""}`;
    } catch (x) { } }

  /* retour d'un lien e-mail (confirmation ou nouveau mot de passe) */
  function hashSession() { const h = new URLSearchParams((location.hash || "").replace(/^#/, "")); const at = h.get("access_token"); if (!at) return null;
    const ty = h.get("type"); if (ty === "recovery") { screen._rat = at; return "reset"; }
    Auth.keep({ access_token: at, refresh_token: h.get("refresh_token"), expires_in: Number(h.get("expires_in")) || 3600 }); history.replaceState(null, "", location.pathname); return "session"; }

  async function me() { const t = await Auth.token(); if (!t) return null; try { const u = await Auth.call("user", null, "GET", t); Auth.s.user = { id: u.id, email: u.email }; Auth.save(Auth.s); return Auth.s.user; } catch (e) { if (e.status === 401 || e.status === 403) Auth.save(null); return null; } }


  /* ---------------- message de bienvenue animé avant la connexion ---------------- */
  function intro() { return new Promise(res => { if (document.getElementById("scIntro")) return res();
    if (!document.getElementById("scIntroCss")) { const st = document.createElement("style"); st.id = "scIntroCss"; st.textContent = `
      #scIntro{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,#FFFFFF 0,#F4F7F6 55%,#E8EFEE 100%);transition:opacity .6s ease}
      #scIntro.out{opacity:0}#scIntro .sc-in{text-align:center;padding:24px;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
      #scIntro .ic{width:112px;height:112px;margin:0 auto 22px;border-radius:28px;background:#0F3D3E;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -12px rgba(15,61,62,.45);animation:scPop .7s cubic-bezier(.2,1.4,.4,1) both}
      #scIntro .ic svg{width:80px;height:80px;overflow:visible}
      #scIntro .arc{stroke-dasharray:190;stroke-dashoffset:190;animation:scDraw 1s .25s ease-out forwards}
      #scIntro .ndl{transform-origin:48px 48px;animation:scSpin 1.6s .35s cubic-bezier(.3,.1,.2,1) both}
      #scIntro h1{margin:0;font-size:30px;font-weight:800;color:#0F3D3E;letter-spacing:-.5px;opacity:0;animation:scUp .6s .7s ease-out forwards}
      #scIntro h1 i{font-style:normal;color:#13585A}#scIntro h1 b{color:#F5B700;font-weight:800}
      #scIntro p{margin:10px 0 0;color:#4A5B5B;font-size:16px;opacity:0;animation:scUp .6s .95s ease-out forwards}
      #scIntro .dots{margin-top:26px;display:flex;gap:7px;justify-content:center;opacity:0;animation:scUp .4s 1.2s forwards}
      #scIntro .dots span{width:8px;height:8px;border-radius:50%;background:#F5B700;animation:scDot 1s infinite ease-in-out}
      #scIntro .dots span:nth-child(2){animation-delay:.15s;background:#13585A}#scIntro .dots span:nth-child(3){animation-delay:.3s;background:#0F3D3E}
      @keyframes scPop{from{transform:scale(.4) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
      @keyframes scDraw{to{stroke-dashoffset:0}}
      @keyframes scSpin{0%{transform:rotate(-200deg)}70%{transform:rotate(25deg)}100%{transform:rotate(0)}}
      @keyframes scUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes scDot{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-6px);opacity:1}}
      @media (prefers-reduced-motion:reduce){#scIntro *{animation-duration:.01s!important;animation-delay:0s!important}}`; document.head.appendChild(st); }
    const d = document.createElement("div"); d.id = "scIntro"; d.setAttribute("role", "status");
    const h = new Date().getHours(); const salut = h >= 18 || h < 5 ? "Bonsoir" : "Bonjour";
    d.innerHTML = `<div class="sc-in"><div class="ic"><svg viewBox="0 0 96 96" aria-hidden="true"><path class="arc" d="M72 24 A34 34 0 1 0 72 72" fill="none" stroke="#FBF8F2" stroke-width="11" stroke-linecap="round"/><line class="ndl" x1="48" y1="48" x2="71" y2="35" stroke="#F5B700" stroke-width="7" stroke-linecap="round"/><circle cx="48" cy="48" r="7" fill="#FBF8F2"/></svg></div>
      <h1>${salut}, bienvenue sur <i>Speed</i><b>Compta</b></h1><p>Votre comptabilité en ligne · Simple, rapide, efficace</p><div class="dots"><span></span><span></span><span></span></div></div>`;
    document.body.appendChild(d); const end = () => { d.classList.add("out"); setTimeout(() => { d.remove(); res(); }, 600); };
    const t = setTimeout(end, 2600); d.addEventListener("click", () => { clearTimeout(t); end(); }); }); }
  window.SC_INTRO = intro;
  /* ---------------- branchement sur le démarrage du logiciel ---------------- */
  Store.gate = async function () {
    const hs = hashSession();
    let u = hs === "reset" ? null : await me();
    if (!u) { let om = ""; try { om = sessionStorage.getItem("sc:outMsg") || ""; sessionStorage.removeItem("sc:outMsg"); } catch (e) { }
      if (hs !== "reset") { const sp = document.getElementById("scSplash"); if (sp) sp.remove(); if (!om) await intro(); }
      await new Promise(res => { screen._done = res; screen(hs === "reset" ? "reset" : "login", om || undefined, !!om); }); u = await me(); }
    if (!u) { screen("login", "Connexion impossible, réessayez."); return new Promise(() => { }); }
    Store.db = DB; Store.uid = u.id; Store.mode = "db"; Store.cloud = true;
    let ed = null;
    Store.user = { id: async () => u.id, isOwner: async () => { if (ed === null) { try { ed = !!(await rest("rpc/sc_is_editor", { method: "POST", body: "{}" })); } catch (e) { ed = false; } } return ed; },
      me: async () => ({ id: u.id, name: (u.email || "").split("@")[0], email: u.email }), profiles: async () => ({}) };
    UI.userEmail = u.email;
    const app = document.getElementById("app"); if (app) app.innerHTML = `<div style="padding:40px;font-weight:800;font-size:22px">${(() => { try { return (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "SpeedCompta"; } catch (e) { return "SpeedCompta"; } })()}<div class="muted" style="font-weight:400;font-size:14px;margin-top:6px" id="bootStep">Ouverture de votre espace…</div></div>`;
  };
  /* compte sans invitation valide : en attente plutôt qu'accès libre */
  const _la = loadAccess;
  loadAccess = async function () { await _la.apply(this, arguments); if (!isAdmin() && UI.access && UI.access.auto) UI.access = { role: "client", statut: "attente", offres: [] }; };
  window.SC_LOGOUT = async () => { try { if (Store.flush) await Store.flush(); } catch (e) { } await Auth.logout(); try { ["sc:view", "sc:index"].forEach(k => localStorage.removeItem(k)); } catch (e) { } location.reload(); };
})();
