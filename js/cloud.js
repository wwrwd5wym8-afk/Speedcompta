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
  const nom = () => "SpeedCompta";
  const ico = () => (window.SCLOGO ? SCLOGO.iconURL() : "");
  function errFr(e) { const m = String((e && e.message) || e || "");
    if (/SC_NO_INVITE|Database error saving new user/i.test(m)) return "Aucune invitation n'existe pour cette adresse e-mail. Utilisez l'adresse à laquelle votre cabinet vous a invité, ou contactez-le.";
    if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
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
      ${mode !== "recover" ? `<label>Mot de passe<input id="clPass" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="8" required></label>` : ""}
      ${mode === "signup" || mode === "reset" ? `<label>Confirmer le mot de passe<input id="clPass2" type="password" autocomplete="new-password" minlength="8" required></label>` : ""}
      ${msg ? `<div class="cl-msg ${ok ? "ok" : ""}">${msg}</div>` : ""}
      <button class="cl-btn" type="submit">${T[1]}</button>
      <div class="cl-links">${mode === "login" ? `<a data-cl="signup">Première connexion ?</a><a data-cl="recover">Mot de passe oublié</a>` : mode === "reset" ? "" : `<a data-cl="login">← Retour à la connexion</a>`}</div>
    </form></div>`;
    app.querySelectorAll("[data-cl]").forEach(a => a.addEventListener("click", () => { const e = document.getElementById("clEmail"); if (e) screen._email = e.value; screen(a.dataset.cl); }));
    const f = document.getElementById("clForm"); const first = f.querySelector("input"); if (first && !first.value) setTimeout(() => first.focus(), 50);
    f.addEventListener("submit", async ev => { ev.preventDefault(); const btn = f.querySelector(".cl-btn"); const em = (document.getElementById("clEmail") || {}).value; const pw = (document.getElementById("clPass") || {}).value; const pw2 = (document.getElementById("clPass2") || {}).value;
      if (em !== undefined) screen._email = em.trim();
      if ((mode === "signup" || mode === "reset") && pw !== pw2) return screen(mode, "Les deux mots de passe ne sont pas identiques.");
      if (mode !== "recover" && mode !== "reset" && (!em || !pw)) return screen(mode, "Renseignez votre e-mail et votre mot de passe.");
      btn.disabled = true; btn.textContent = "Patientez…";
      try {
        if (mode === "login") { await Auth.login(em.trim(), pw); screen._done(); }
        else if (mode === "signup") { const s = await Auth.signup(em.trim(), pw); if (s) screen._done(); else screen("login", "Compte créé. Ouvrez l'e-mail de confirmation reçu, puis connectez-vous ici.", true); }
        else if (mode === "recover") { await Auth.recover(em.trim()); screen("login", "Si un compte existe pour cette adresse, un lien vient de vous être envoyé par e-mail.", true); }
        else if (mode === "reset") { await Auth.setPassword(screen._rat, pw); history.replaceState(null, "", location.pathname); screen("login", "Mot de passe modifié : connectez-vous.", true); }
      } catch (e) { screen(mode, errFr(e)); }
    }); }

  /* retour d'un lien e-mail (confirmation ou nouveau mot de passe) */
  function hashSession() { const h = new URLSearchParams((location.hash || "").replace(/^#/, "")); const at = h.get("access_token"); if (!at) return null;
    const ty = h.get("type"); if (ty === "recovery") { screen._rat = at; return "reset"; }
    Auth.keep({ access_token: at, refresh_token: h.get("refresh_token"), expires_in: Number(h.get("expires_in")) || 3600 }); history.replaceState(null, "", location.pathname); return "session"; }

  async function me() { const t = await Auth.token(); if (!t) return null; try { const u = await Auth.call("user", null, "GET", t); Auth.s.user = { id: u.id, email: u.email }; Auth.save(Auth.s); return Auth.s.user; } catch (e) { if (e.status === 401 || e.status === 403) Auth.save(null); return null; } }

  /* ---------------- branchement sur le démarrage du logiciel ---------------- */
  Store.gate = async function () {
    const hs = hashSession();
    let u = hs === "reset" ? null : await me();
    if (!u) { await new Promise(res => { screen._done = res; screen(hs === "reset" ? "reset" : "login"); }); u = await me(); }
    if (!u) { screen("login", "Connexion impossible, réessayez."); return new Promise(() => { }); }
    Store.db = DB; Store.uid = u.id; Store.mode = "db"; Store.cloud = true;
    let ed = null;
    Store.user = { id: async () => u.id, isOwner: async () => { if (ed === null) { try { ed = !!(await rest("rpc/sc_is_editor", { method: "POST", body: "{}" })); } catch (e) { ed = false; } } return ed; },
      me: async () => ({ id: u.id, name: (u.email || "").split("@")[0], email: u.email }), profiles: async () => ({}) };
    UI.userEmail = u.email;
    const app = document.getElementById("app"); if (app) app.innerHTML = `<div style="padding:40px;font-weight:800;font-size:22px">SpeedCompta<div class="muted" style="font-weight:400;font-size:14px;margin-top:6px" id="bootStep">Ouverture de votre espace…</div></div>`;
  };
  /* compte sans invitation valide : en attente plutôt qu'accès libre */
  const _la = loadAccess;
  loadAccess = async function () { await _la.apply(this, arguments); if (!isAdmin() && UI.access && UI.access.auto) UI.access = { role: "client", statut: "attente", offres: [] }; };
  window.SC_LOGOUT = async () => { try { if (Store.flush) await Store.flush(); } catch (e) { } await Auth.logout(); try { ["sc:view", "sc:index"].forEach(k => localStorage.removeItem(k)); } catch (e) { } location.reload(); };
})();
