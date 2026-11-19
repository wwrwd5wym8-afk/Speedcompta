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
    keep(j) { if (!j || !j.access_token) return null; const s = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, user: j.user ? { id: j.user.id, email: j.user.email } : (this.s && this.s.user) }; if (this.s && this.s.until) { s.until = this.s.until; s.slide = this.s.slide; } this.save(s); return s; },
    async login(email, password) { return this.keep(await this.call("token?grant_type=password", { email, password })); },
    async signup(email, password) { const j = await this.call("signup", { email, password }); if (j.access_token) return this.keep(j); if (j.session && j.session.access_token) return this.keep(j.session); return null; },
    async refresh() { if (!this.s || !this.s.rt) return null; try { return this.keep(await this.call("token?grant_type=refresh_token", { refresh_token: this.s.rt })); } catch (e) { if (e.status === 400 || e.status === 401) this.save(null); throw e; } },
    async token() { if (!this.s) return null; if (this.s.until && Date.now() > this.s.until) { this.save(null); return null; } if (this.s.slide && (!this.s._sl || Date.now() - this.s._sl > 6e4)) { this.s.until = Date.now() + 12 * 36e5; this.s._sl = Date.now(); this.save(this.s); } if (Date.now() > this.s.exp) { try { await this.refresh(); } catch (e) { return null; } } return this.s && this.s.at; },
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
  const nom = () => (typeof CONFIG !== "undefined" && CONFIG && CONFIG.branding && CONFIG.branding.nom) || (() => { try { return (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "Speedix"; } catch (e) { return "Speedix"; } })();
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
  /* ================= écran de connexion en étapes (e-mail › mot de passe › vérification) ================= */
  const LX = { email: "", keep: (() => { try { return localStorage.getItem("sc:keep30") === "1"; } catch (e) { return false; } })(), factor: null, enroll: null, tm: null, pol: null };
  const lxE = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lxRem = () => { try { return localStorage.getItem("sc:remember") === "1"; } catch (e) { return false; } };
  const lxPolC = () => LX.pol || {};
  const lxRec = () => { if (!lxRem()) return []; try { return (JSON.parse(localStorage.getItem("sc:recentEmails") || "[]") || []).filter(Boolean).slice(0, 3); } catch (e) { return []; } };
  const lxRecAdd = em => { if (!lxRem()) { try { localStorage.removeItem("sc:recentEmails"); } catch (e) { } return; } try { const l = lxRec().filter(x => x !== em); l.unshift(em); localStorage.setItem("sc:recentEmails", JSON.stringify(l.slice(0, 3))); } catch (e) { } };
  const lxRecDel = em => { try { localStorage.setItem("sc:recentEmails", JSON.stringify(lxRec().filter(x => x !== em))); } catch (e) { } };
  const lxBrand = () => { let n = "Speedix"; try { n = String((typeof nom === "function" ? nom() : "") || (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "Speedix"); } catch (e) { } n = lxE(n); const m = n.match(/^(Speed)(.+)$/i); return m ? m[1] + "<em>" + m[2] + "</em>" : n; };
  const lxCol = () => { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:brandCache") || "{}") || {}; } catch (e) { } const ok = v => /^#[0-9a-f]{6}$/i.test(v || "") ? v : ""; const t = ok(c.bg) || "#0F3D3E", g = ok(c.acc) || "#F5B700"; return `--t:${t};--t2:${t};--g:${g}`; };
  const lxMark = (big) => { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:brandCache") || "{}") || {}; } catch (e) { } if (c.img) return `<img src="${lxE(c.img)}" alt="" style="${c.wide ? "width:auto;max-width:220px;border-radius:10px;box-shadow:none" : ""}">`; return window.SCLOGO ? `<span class="lx-mk">${SCLOGO.markSVG("#FBF8F2", (c.acc && /^#[0-9a-f]{6}$/i.test(c.acc)) ? c.acc : "#F5B700")}</span>` : `<img src="${ico()}" alt="">`; };
  const lxTrustK = () => "sc:mfaTrust:" + ((Auth.s && Auth.s.user && Auth.s.user.id) || "");
  const lxTrusted = () => { if (lxPolC().trust !== "1") return false; try { return Number(localStorage.getItem(lxTrustK()) || 0) > Date.now(); } catch (e) { return false; } };
  const lxMeta = () => { if (!Auth.s) return; const k30 = LX.keep && lxPolC().keep === "1"; Auth.s.until = Date.now() + (k30 ? 30 * 864e5 : 12 * 36e5); Auth.s.slide = !k30; Auth.save(Auth.s); };
  async function lxPolicy() { if (LX.pol) return LX.pol; try { const r = await fetch(URL0 + "/rest/v1/sc_docs?select=data&path=eq." + encodeURIComponent("public/securite"), { headers: { apikey: KEY } }); const j = r.ok ? await r.json() : []; LX.pol = (j[0] && j[0].data) || {}; } catch (e) { LX.pol = {}; } return LX.pol; }
  async function lxFactors() { const t = await Auth.token(); if (!t) return []; try { const u = await Auth.call("user", null, "GET", t); return (u.factors || []).filter(f => (f.factor_type === "totp" || f.factor_type === "phone") && f.status === "verified"); } catch (e) { return []; } }
  /* après le mot de passe : double authentification si activée, sinon entrée dans le logiciel */
  async function lxAfter() {
    const pol = await lxPolicy(); const F = await lxFactors();
    if (F.length && !lxTrusted()) { let pref = ""; try { pref = localStorage.getItem("sc:mfaPref") || ""; } catch (e) { } const f = F.find(x => x.factor_type === pref) || F.find(x => x.factor_type === "phone") || F[0]; LX.factor = f.id; LX.ftype = f.factor_type; LX.fphone = f.phone || ""; LX.alt = F.length > 1; LX.chal = null; Auth.s.mfa = "mfa"; Auth.save(Auth.s); return screen("mfa"); }
    if (!F.length && pol.mfa === "1") { Auth.s.mfa = "enroll"; Auth.save(Auth.s); return screen("enroll"); }
    if (Auth.s) { delete Auth.s.mfa; Auth.save(Auth.s); } screen._done();
  }
  /* déconnexion : rien ne reste sur l'appareil (adresse, session longue, appareil de confiance, code en cours) */
  function lxWipe() { LX.factor = null; LX.enroll = null; LX.chal = null; LX.ftype = ""; LX.fphone = ""; LX.keep = false; if (!lxRem()) { LX.email = ""; try { screen._email = ""; } catch (e) { } }
    try { if (!lxRem()) localStorage.removeItem("sc:recentEmails"); localStorage.removeItem("sc:keep30"); Object.keys(localStorage).filter(k => /^sc:mfaTrust:/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { }
    try { document.querySelectorAll("input[type=password],#clEmail").forEach(i => { i.value = ""; }); } catch (e) { } }
  window.SC_MFA = { factors: lxFactors, policy: async f => { if (f) LX.pol = null; return lxPolicy(); }, trustForget: () => { try { localStorage.removeItem(lxTrustK()); } catch (e) { } } };

  function lxCss() { if (document.getElementById("lxCss")) return; const st = document.createElement("style"); st.id = "lxCss"; st.textContent = `
.lx{--t:#0F3D3E;--t2:#13585A;--g:#F5B700;--c:#FBF8F2;position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#0F1B33;padding:0 16px 48px;box-sizing:border-box}
.lx *{box-sizing:border-box}
.lx-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:var(--c)}
.lx-bg i{position:absolute;border-radius:50%;filter:blur(60px);opacity:.9;animation:lxDrift 24s ease-in-out infinite alternate}
.lx-bg i:nth-child(1){width:60vw;height:60vw;left:-18vw;top:-24vw;background:radial-gradient(circle,rgba(19,88,90,.22) 0,rgba(19,88,90,0) 65%)}
.lx-bg i:nth-child(2){width:46vw;height:46vw;left:28vw;top:-28vw;background:radial-gradient(circle,rgba(245,183,0,.24) 0,rgba(245,183,0,0) 65%);animation-duration:28s}
.lx-bg i:nth-child(3){width:62vw;height:62vw;right:-22vw;top:-8vw;background:radial-gradient(circle,rgba(15,61,62,.20) 0,rgba(15,61,62,0) 66%);animation-duration:32s}
.lx-bg::after{content:"";position:absolute;left:0;right:0;bottom:0;height:48%;background:linear-gradient(180deg,rgba(251,248,242,0),var(--c) 78%)}
@keyframes lxDrift{to{transform:translate(4vw,3vw) scale(1.08)}}
.lx>:not(.lx-bg):not(.lx-wm){position:relative;z-index:1}
.lx-top{width:100%;max-width:1240px;display:flex;justify-content:flex-end;gap:8px;padding:18px 4px;flex-wrap:wrap}
.lx-pill{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:#2F5E5A;background:rgba(255,255,255,.72);backdrop-filter:blur(8px);border:1px solid rgba(15,61,62,.1);padding:6px 12px;border-radius:999px;text-decoration:none}
.lx-pill svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lx-main{width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;margin-top:2vh;animation:lxIn .45s ease-out both}
.lx-logo{display:flex;align-items:center;gap:14px;font-weight:800;font-size:42px;letter-spacing:-.035em;color:var(--t);line-height:1}
.lx-mk{display:grid;place-items:center;width:62px;height:62px;border-radius:18px;background:var(--t);box-shadow:0 14px 28px -12px rgba(15,61,62,.6)}.lx-mk svg{width:44px;height:44px;overflow:visible}.lx-logo.sm .lx-mk{width:40px;height:40px;border-radius:12px}.lx-logo.sm .lx-mk svg{width:28px;height:28px}.lx-mk .m-ndl{transform-origin:48px 48px;animation:lxNdl 1.2s .2s cubic-bezier(.3,1.3,.4,1) both}@keyframes lxNdl{from{transform:rotate(-150deg)}to{transform:none}}
.lx-wm{position:fixed;right:-9vw;bottom:-14vw;width:52vw;max-width:760px;opacity:.07;z-index:0;pointer-events:none}.lx-wm svg{width:100%;height:auto}.lx-wm .m-ndl{transform-origin:48px 48px;animation:lxNdl 2.4s .3s cubic-bezier(.3,1.2,.4,1) both}
.lx-logo img{width:60px;height:60px;border-radius:17px;box-shadow:0 12px 26px -10px rgba(15,61,62,.5)}
.lx-logo em{font-style:normal;color:var(--g)}
.lx-logo.sm{font-size:26px;gap:10px}.lx-logo.sm img{width:38px;height:38px;border-radius:11px}
.lx-steps{display:flex;gap:6px;margin:24px 0 0}.lx-steps span{width:20px;height:4px;border-radius:4px;background:#D3E2DF;transition:all .3s}.lx-steps span.on{width:36px;background:var(--g)}.lx-steps span.ok{background:var(--t2)}
.lx h1{margin:22px 0 6px;font-size:31px;font-weight:800;letter-spacing:-.02em;color:var(--t2);text-align:center;line-height:1.2}
.lx-sub{margin:0;text-align:center;color:#3F5251;font-size:15.5px;line-height:1.55}
.lx-card{width:100%;display:flex;flex-direction:column;gap:15px;margin-top:26px}
.lx-f{display:flex;flex-direction:column;gap:8px;font-size:14.5px;font-weight:600;color:#1F2D2D}
.lx-f input{font:inherit;font-size:16px;font-weight:400;padding:13px 14px;border:1px solid #C3D1CF;border-radius:10px;background:rgba(255,255,255,.92);color:#0F1B33;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.lx-f input::placeholder{color:#9AA8A6}
.lx-f input:focus{border-color:var(--t);box-shadow:0 0 0 4px rgba(245,183,0,.28)}
.lx-f.bad input{border-color:#C2364B;box-shadow:0 0 0 4px rgba(194,54,75,.1)}
.lx-msg{display:flex;gap:9px;align-items:flex-start;font-size:14.5px;line-height:1.4;color:#8F1F31;animation:lxIn .25s ease-out}
.lx-msg::before{content:"!";width:21px;height:21px;border-radius:50%;background:#C2364B;color:#fff;font-weight:800;font-size:13px;display:grid;place-items:center;flex:none}
.lx-msg.ok{color:#145C3A}.lx-msg.ok::before{content:"✓";background:#1F8A55}
.lx-seg{display:flex;gap:6px;background:#F1F5F4;border-radius:12px;padding:4px;margin-bottom:12px}.lx-seg button{flex:1;border:0;background:none;border-radius:9px;padding:9px;font:inherit;font-weight:700;color:#3F5958;cursor:pointer}.lx-seg button.on{background:#fff;color:var(--t);box-shadow:0 1px 4px rgba(15,27,51,.12)}.lx-row-c{text-align:center;margin:4px 0}
.lx-chk{display:flex;align-items:center;gap:12px;font-size:15.5px;font-weight:500;cursor:pointer;color:#1F2D2D;user-select:none}
.lx-chk input{appearance:none;-webkit-appearance:none;width:23px;height:23px;border:1.5px solid #B5C6C3;border-radius:6px;background:#fff;display:grid;place-items:center;margin:0;cursor:pointer;flex:none;transition:background .15s,border-color .15s}
.lx-chk input:checked{background:var(--t2);border-color:var(--t2)}.lx-chk input:checked::after{content:"";width:6px;height:11px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:translate(0,-1px) rotate(45deg)}
.lx-chk input:focus-visible{box-shadow:0 0 0 4px rgba(19,88,90,.18)}
.lx-chk small{display:block;color:#6B7B7B;font-size:12.5px;font-weight:400}
.lx-btn{margin-top:10px;font:inherit;font-size:16.5px;font-weight:700;color:#fff;background:var(--t2);border:0;border-radius:10px;padding:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .15s,transform .1s,box-shadow .15s;box-shadow:0 10px 22px -12px rgba(15,61,62,.7)}
.lx-btn{position:relative;overflow:hidden}.lx-btn::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--g);transition:width .35s ease}.lx-btn:hover::after,.lx-btn:focus-visible::after{width:100%}.lx-btn:disabled::after{width:100%;animation:lxRun 1.1s ease-in-out infinite}.lx-btn:hover{background:var(--t)}.lx-btn:active{transform:scale(.99)}.lx-btn:disabled{opacity:.75;cursor:wait}
.lx-btn .sp{width:17px;height:17px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:lxSpin .7s linear infinite}
.lx-link{color:#2E7B76;font-weight:600;font-size:15px;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(46,123,118,.4);background:none;border:0;padding:0;font-family:inherit;align-self:flex-start}
.lx-link:hover{color:var(--t)}
.lx-who{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:22px}
.lx-who b{font-size:17.5px;font-weight:700;color:#14202B;word-break:break-all;text-align:center}
.lx-who .lx-link{align-self:center;text-decoration:none;font-size:15.5px}
.lx-av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--t2),#2E8F86);flex:none;font-size:16px}
.lx-pw{position:relative}.lx-pw input{padding-right:50px}
.lx-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;border-radius:8px;background:transparent;cursor:pointer;color:#5F7473;display:grid;place-items:center}
.lx-eye:hover{background:#EEF4F3;color:var(--t)}.lx-eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.lx-caps[hidden]{display:none!important}.lx-caps{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#8A5A00;background:#FFF4D6;border-radius:8px;padding:6px 10px;margin-top:-6px}
.lx-rec{display:flex;flex-direction:column;gap:8px}
.lx-rec>small{font-size:12.5px;color:#6B7B7B;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.lx-acc{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:1px solid #D5E1DF;border-radius:12px;background:rgba(255,255,255,.88);cursor:pointer;font:inherit;font-size:15px;color:#14202B;text-align:left;transition:border-color .15s,box-shadow .15s,transform .1s}
.lx-acc:hover{border-color:var(--t2);box-shadow:0 6px 16px -10px rgba(15,61,62,.5)}.lx-acc .lx-av{width:34px;height:34px;font-size:14px}
.lx-acc span.e{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lx-acc .x{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#8A9A98;font-size:18px;line-height:1}.lx-acc .x:hover{background:#F3E4E6;color:#A12A3B}
.lx-or{display:flex;align-items:center;gap:12px;color:#8A9A98;font-size:13px}.lx-or::before,.lx-or::after{content:"";flex:1;height:1px;background:#DCE5E3}
.lx-ill{margin-top:26px}.lx-ill svg{width:170px;height:auto;display:block}
.lx-otp{display:flex;gap:10px;justify-content:center;margin-top:10px}
.lx-otp input{width:54px;height:62px;text-align:center;font:inherit;font-size:27px;font-weight:700;color:#0F1B33;border:1px solid #C9D6D4;border-radius:10px;background:#fff;outline:none;caret-color:var(--t2);transition:border-color .15s,box-shadow .15s;padding:0}
.lx-otp input:focus{border-color:var(--t);box-shadow:0 0 0 4px rgba(245,183,0,.28)}
.lx-otp input.f{border-color:var(--t2);background:#F4FAF8}
.lx-otp input:nth-child(3){margin-right:12px}
.lx-otp.bad input{border-color:#C2364B;animation:lxShake .35s}
.lx-timer{display:flex;align-items:center;justify-content:center;gap:9px;font-size:15.5px;color:#2B3A39}
.lx-timer svg{width:22px;height:22px;transform:rotate(-90deg)}.lx-timer circle{fill:none;stroke-width:3}.lx-timer .bg{stroke:#DCE7E5}.lx-timer .fg{stroke:var(--t2);stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.lx-back{align-self:center;margin-top:18px;text-decoration:none;font-size:16px}
.lx-foot{margin-top:46px;text-align:center;font-size:15.5px;color:#33403F;display:flex;flex-direction:column;gap:14px}
.lx-foot a{color:var(--t2);font-weight:700;cursor:pointer;text-decoration:none;margin-left:5px}.lx-foot a:hover{text-decoration:underline}
.lx-hint{font-size:13.5px;color:#5A6B6A;text-align:center;margin:0;line-height:1.5}
.lx-meter{display:flex;align-items:center;gap:10px;font-size:12.5px;color:#5A6B6A;margin-top:-6px}.lx-meter div{flex:1;height:5px;border-radius:5px;background:#E3EBEA;overflow:hidden}.lx-meter i{display:block;height:100%;width:0;transition:width .25s,background .25s}
.lx-qr{display:flex;gap:16px;align-items:center;background:#fff;border:1px solid #E1EAE8;border-radius:14px;padding:14px}.lx-qr img{width:148px;height:148px;flex:none;image-rendering:pixelated}
.lx-qr ol{margin:0;padding-left:18px;font-size:13.5px;line-height:1.6;color:#33403F}
.lx-secret{display:block;margin-top:6px;font-family:"IBM Plex Mono",monospace;font-size:12.5px;word-break:break-all;background:#F2F7F6;padding:6px 8px;border-radius:6px;user-select:all}
#clOffres{width:min(1040px,100%);margin-top:40px}
@keyframes lxIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes lxRun{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes lxSpin{to{transform:rotate(360deg)}}
@keyframes lxShake{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
@media (max-width:540px){.lx-logo{font-size:32px}.lx-mk{display:grid;place-items:center;width:62px;height:62px;border-radius:18px;background:var(--t);box-shadow:0 14px 28px -12px rgba(15,61,62,.6)}.lx-mk svg{width:44px;height:44px;overflow:visible}.lx-logo.sm .lx-mk{width:40px;height:40px;border-radius:12px}.lx-logo.sm .lx-mk svg{width:28px;height:28px}.lx-mk .m-ndl{transform-origin:48px 48px;animation:lxNdl 1.2s .2s cubic-bezier(.3,1.3,.4,1) both}@keyframes lxNdl{from{transform:rotate(-150deg)}to{transform:none}}
.lx-wm{position:fixed;right:-9vw;bottom:-14vw;width:52vw;max-width:760px;opacity:.07;z-index:0;pointer-events:none}.lx-wm svg{width:100%;height:auto}.lx-wm .m-ndl{transform-origin:48px 48px;animation:lxNdl 2.4s .3s cubic-bezier(.3,1.2,.4,1) both}
.lx-logo img{width:46px;height:46px}.lx h1{font-size:25px}.lx-otp{gap:6px}.lx-otp input{width:44px;height:54px;font-size:23px}.lx-otp input:nth-child(3){margin-right:6px}.lx-qr{flex-direction:column}}
@media (prefers-reduced-motion:reduce){.lx-bg i,.lx-main,.lx-msg,.lx-mk .m-ndl,.lx-wm .m-ndl{animation:none}}`; document.head.appendChild(st); }

  const LX_EYE = ['<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'];
  const LX_LOCK = '<svg viewBox="0 0 200 170" aria-hidden="true"><g stroke="#0F3D3E" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><rect x="58" y="22" width="78" height="134" rx="14" fill="#fff"/><rect x="58" y="22" width="78" height="134" rx="14" fill="none"/><path d="M84 34h26" /><rect x="70" y="52" width="54" height="22" rx="6" fill="#E6F2EF"/><path d="M78 63h4M88 63h4M98 63h4M108 63h4" stroke-width="4"/></g><g transform="translate(92 92)"><path d="M28 0l26 10v20c0 18-12 30-26 36C14 60 2 48 2 30V10z" fill="#F5B700" stroke="#0F3D3E" stroke-width="5" stroke-linejoin="round"/><path d="M16 32l9 9 17-19" fill="none" stroke="#0F3D3E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g><g stroke="#13585A" stroke-width="6" stroke-linecap="round"><path d="M156 30v-14M168 44l10-10M172 62h14"/></g></svg>';
  function lxPwScore(p) { let s = 0; if (!p) return 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return Math.min(4, s); }

  function screen(mode, msg, ok) { const app = document.getElementById("app"); if (!app) return; lxCss();
    if (LX.tm) { clearInterval(LX.tm); LX.tm = null; }
    if (screen._email && !LX.email) LX.email = screen._email;
    if (!LX.email && Auth.s && Auth.s.user && Auth.s.user.email) LX.email = Auth.s.user.email;
    if (mode === "pass" && !LX.email) mode = "login";
    const em = LX.email, ini = (em || "?").charAt(0).toUpperCase();
    const flow = ["login", "pass"].concat(mode === "mfa" || mode === "enroll" ? [mode] : []);
    const si = flow.indexOf(mode);
    const steps = si >= 0 ? `<div class="lx-steps" aria-hidden="true">${flow.map((k, i) => `<span class="${i === si ? "on" : i < si ? "ok" : ""}"></span>`).join("")}</div>` : "";
    if (!msg && mode === "login") { try { const w = sessionStorage.getItem("sc:outWhy"); if (w) { msg = lxE(w); ok = true; sessionStorage.removeItem("sc:outWhy"); } } catch (e) { } }
    const M = msg ? `<div class="lx-msg ${ok ? "ok" : ""}" role="alert">${msg}</div>` : "";
    const keepChk = lxPolC().keep === "1" ? `<label class="lx-chk"><input type="checkbox" id="lxKeep" ${LX.keep ? "checked" : ""}><span>Maintenir ma connexion active pendant 30 jours</span></label>` : "";
    const remChk = `<label class="lx-chk"><input type="checkbox" id="lxRem" ${lxRem() ? "checked" : ""}><span>Se souvenir de mon adresse e-mail sur cet ordinateur</span></label>`;
    const acU = lxRem() ? "username" : "off", acP = lxRem() ? "current-password" : "new-password";
    const big = mode === "login" || mode === "pass";
    let body = "", foot = "";
    if (mode === "login") {
      const R = lxRec();
      body = `<h1>Connectez-vous</h1><p class="lx-sub">Votre espace comptable, en toute sécurité.</p><form class="lx-card" id="clForm" novalidate>
        ${R.length ? `<div class="lx-rec"><small>Continuer avec</small>${R.map(r => `<button type="button" class="lx-acc" data-acc="${lxE(r)}"><span class="lx-av">${lxE(r.charAt(0).toUpperCase())}</span><span class="e">${lxE(r)}</span><span class="x" data-accx="${lxE(r)}" title="Retirer ce compte de cet appareil" role="button" aria-label="Retirer">×</span></button>`).join("")}</div><div class="lx-or">ou avec une autre adresse</div>` : ""}
        <label class="lx-f ${msg && !ok ? "bad" : ""}"><span>E-mail</span><input id="clEmail" type="email" autocomplete="${acU}" data-lpignore="true" data-1p-ignore inputmode="email" placeholder="nom@societe.fr" value="${lxRem() ? lxE(em) : ""}"></label>${M}
        ${remChk}${keepChk}<button class="lx-btn" type="submit">Continuer</button></form>`;
      foot = `<div>Première connexion avec votre code ?<a data-go="signup">Créer mon mot de passe</a></div>`;
    } else if (mode === "pass") {
      body = `<h1>Connectez-vous</h1><div class="lx-who"><span class="lx-av">${lxE(ini)}</span><b>${lxE(em)}</b><button type="button" class="lx-link" data-go="login">Changer de compte</button></div><form class="lx-card" id="clForm" novalidate>
        ${lxRem() ? `<input type="email" autocomplete="username" value="${lxE(em)}" style="display:none" aria-hidden="true" tabindex="-1">` : ""}
        <label class="lx-f ${msg && !ok ? "bad" : ""}"><span>Mot de passe ou code d'accès</span><div class="lx-pw"><input id="clPass" type="password" autocomplete="${acP}" data-lpignore="true" data-1p-ignore placeholder="Entrez votre mot de passe"><button type="button" class="lx-eye" data-eye title="Afficher ou masquer" aria-label="Afficher le mot de passe">${LX_EYE[0]}</button></div></label>
        <div class="lx-caps" id="lxCaps" hidden>⇪ Majuscules activées</div>
        <button type="button" class="lx-link" data-go="recover">Mot de passe oublié ?</button>${M}
        <label class="lx-chk"><input type="checkbox" id="lxShow"><span>Afficher le mot de passe</span></label>${keepChk}
        <button class="lx-btn" type="submit">Continuer</button><p class="lx-hint">Client : saisissez le <b>code d'accès</b> reçu de votre cabinet (SC-…).</p></form>`;
    } else if (mode === "mfa") {
      const sms = LX.ftype === "phone"; const ph = String(LX.fphone || "").replace(/\D/g, ""); const phM = ph ? "+" + ph.slice(0, 2) + " •• •• •• " + ph.slice(-2) : "votre téléphone";
      body = `<div class="lx-ill">${LX_LOCK}</div><h1>Entrez votre code de vérification</h1><p class="lx-sub">${sms ? `Un code à 6 chiffres a été envoyé par SMS au <b>${lxE(phM)}</b>.` : `Ouvrez votre application d'authentification (Google Authenticator, Microsoft Authenticator, 1Password…) et saisissez le code à 6 chiffres de <b>${lxE(em)}</b>.`}</p>
        <form class="lx-card" id="clForm" novalidate><div class="lx-otp ${msg && !ok ? "bad" : ""}" id="lxOtp">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" pattern="[0-9]*" maxlength="6" aria-label="Chiffre ${i + 1}" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'}>`).join("")}</div>${M}
        ${sms ? `<div class="lx-row-c"><button type="button" class="lx-link" data-go="sms">Renvoyer le code par SMS</button></div>` : `<div class="lx-timer"><svg viewBox="0 0 24 24"><circle class="bg" cx="12" cy="12" r="9"/><circle class="fg" id="lxRing" cx="12" cy="12" r="9" stroke-dasharray="56.5" stroke-dashoffset="0"/></svg><span>Nouveau code dans <b id="lxT">30</b> s</span></div>`}
        ${LX.alt ? `<div class="lx-row-c"><button type="button" class="lx-link" data-go="alt">${sms ? "Utiliser plutôt l'application d'authentification" : "Recevoir plutôt un code par SMS"}</button></div>` : ""}
        ${lxPolC().trust === "1" ? `<label class="lx-chk" style="justify-content:center"><input type="checkbox" id="lxTrust"><span>Ne plus demander sur cet appareil pendant 30 jours</span></label>` : ""}
        <button class="lx-btn" type="submit">Vérifier</button><button type="button" class="lx-link lx-back" data-go="out">Retourner</button></form>`;
    } else if (mode === "enroll") {
      const E = LX.enroll;
      body = `<div class="lx-ill">${LX_LOCK}</div><h1>Activez la double authentification</h1><p class="lx-sub">Votre cabinet protège l'accès par un code temporaire en plus du mot de passe. Une minute suffit.</p>
        <form class="lx-card" id="clForm" novalidate><div class="lx-seg"><button type="button" class="${LX.enrollT !== "totp" ? "on" : ""}" data-go="ensms">📱 Par SMS</button><button type="button" class="${LX.enrollT === "totp" ? "on" : ""}" data-go="entotp">🔐 Application</button></div>
        ${LX.enrollT !== "totp" ? (E && E.type === "phone" ? `<p class="lx-hint">Code envoyé par SMS au <b>${lxE(E.phone)}</b>. <button type="button" class="lx-link" data-go="sms">Renvoyer</button> · <button type="button" class="lx-link" data-go="ensms">Changer de numéro</button></p>` : `<label class="lx-f"><span>Numéro de téléphone portable</span><input id="lxPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78 ou +33 6 12 34 56 78"></label><p class="lx-hint">Vous recevrez un code à chaque connexion.</p>`)
        : E && E.type !== "phone" ? `<div class="lx-qr"><img src="${lxE(E.qr)}" alt="QR code à scanner"><ol><li>Installez une application d'authentification (Google ou Microsoft Authenticator…)</li><li>Scannez ce QR code, ou saisissez la clé :<span class="lx-secret">${lxE(E.secret)}</span></li><li>Tapez le code à 6 chiffres affiché</li></ol></div>` : `<div class="lx-hint">Préparation du QR code…</div>`}
        ${LX.enrollT !== "totp" && !(E && E.type === "phone") ? "" : `<div class="lx-otp ${msg && !ok ? "bad" : ""}" id="lxOtp">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" pattern="[0-9]*" maxlength="6" aria-label="Chiffre ${i + 1}" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'}>`).join("")}</div>`}${M}
        <button class="lx-btn" type="submit" ${E || LX.enrollT !== "totp" ? "" : "disabled"}>${LX.enrollT !== "totp" && !(E && E.type === "phone") ? "Recevoir le code par SMS" : "Activer et continuer"}</button><button type="button" class="lx-link lx-back" data-go="out">Retourner</button></form>`;
    } else {
      const T = { signup: ["Première connexion", "Créer mon mot de passe", "Utilisez l'adresse e-mail à laquelle votre cabinet vous a invité, puis choisissez votre mot de passe."], recover: ["Mot de passe oublié", "Recevoir le lien", "Indiquez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe."], reset: ["Nouveau mot de passe", "Enregistrer", "Choisissez un mot de passe d'au moins 8 caractères."] }[mode] || ["Connexion", "Continuer", ""];
      const pw2 = mode === "signup" || mode === "reset";
      body = `<h1>${T[0]}</h1><p class="lx-sub">${T[2]}</p><form class="lx-card" id="clForm" novalidate>
        ${mode !== "reset" ? `<label class="lx-f"><span>E-mail</span><input id="clEmail" type="email" autocomplete="username" inputmode="email" placeholder="nom@societe.fr" value="${lxE(em)}"></label>` : ""}
        ${pw2 ? `<label class="lx-f"><span>Mot de passe</span><div class="lx-pw"><input id="clPass" type="password" autocomplete="new-password" minlength="8" placeholder="8 caractères minimum"><button type="button" class="lx-eye" data-eye title="Afficher ou masquer" aria-label="Afficher le mot de passe">${LX_EYE[0]}</button></div></label>
        <div class="lx-meter"><div><i id="lxMeter"></i></div><span id="lxMeterT">Robustesse</span></div>
        <label class="lx-f"><span>Confirmer le mot de passe</span><input id="clPass2" type="password" autocomplete="new-password" minlength="8"></label>` : ""}${M}
        <button class="lx-btn" type="submit">${T[1]}</button>${mode !== "reset" ? `<button type="button" class="lx-link lx-back" data-go="login">← Retour à la connexion</button>` : ""}</form>`;
    }
    const help = (OFF && (OFF.email || OFF.tel)) ? `<a class="lx-pill" href="${OFF.email ? "mailto:" + lxE(OFF.email) : "tel:" + lxE(OFF.tel)}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/></svg>Besoin d'aide ?</a>` : "";
    app.innerHTML = `<div class="lx" data-step="${mode}" style="${lxCol()}"><div class="lx-bg" aria-hidden="true"><i></i><i></i><i></i></div><div class="lx-wm" aria-hidden="true">${window.SCLOGO ? SCLOGO.markSVG("#0F3D3E", "#F5B700") : ""}</div>
      <header class="lx-top"><span class="lx-pill"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Connexion chiffrée</span>${help}</header>
      <main class="lx-main"><div class="lx-logo ${big ? "" : "sm"}">${lxMark()}<span>${lxBrand()}</span></div>${steps}${body}${foot ? `<div class="lx-foot">${foot}</div>` : ""}</main>
      ${mode === "login" ? '<div id="clOffres"></div>' : ""}</div>`;
    if (mode === "login") offres();
    lxWire(app, mode);
  }

  function lxWire(app, mode) {
    const f = document.getElementById("clForm"); if (!f) return;
    const go = m => { const e = document.getElementById("clEmail"); if (e) { LX.email = e.value.trim(); screen._email = LX.email; } screen(m); };
    app.querySelectorAll("[data-go]").forEach(a => a.addEventListener("click", async () => { const g = a.dataset.go; if (g === "out") { await Auth.logout(); lxWipe(); return screen("login"); }
      if (g === "sms") { if (LX.enroll && LX.enroll.type === "phone") return lxEnrollPhone(LX.enroll.phone); LX.chal = null; return lxSms(true); }
      if (g === "alt") { const F = await lxFactors(); const f = F.find(x => x.factor_type !== LX.ftype); if (f) { LX.factor = f.id; LX.ftype = f.factor_type; LX.fphone = f.phone || ""; LX.chal = null; try { localStorage.setItem("sc:mfaPref", f.factor_type); } catch (e) { } } return screen("mfa"); }
      if (g === "ensms" || g === "entotp") { LX.enrollT = g === "entotp" ? "totp" : "sms"; LX.enroll = null; return screen("enroll"); } go(g); }));
    app.querySelectorAll("[data-acc]").forEach(b => b.addEventListener("click", ev => { const x = ev.target.closest("[data-accx]"); if (x) { ev.stopPropagation(); lxRecDel(x.dataset.accx); return screen("login"); } LX.email = b.dataset.acc; screen._email = LX.email; screen("pass"); }));
    const rm = document.getElementById("lxRem"); if (rm) rm.addEventListener("change", () => { try { localStorage.setItem("sc:remember", rm.checked ? "1" : "0"); if (!rm.checked) localStorage.removeItem("sc:recentEmails"); } catch (e) { } });
    const kp = document.getElementById("lxKeep"); if (kp) kp.addEventListener("change", () => { LX.keep = kp.checked; try { localStorage.setItem("sc:keep30", kp.checked ? "1" : "0"); } catch (e) { } });
    const pw = document.getElementById("clPass");
    const eye = app.querySelector("[data-eye]"), show = document.getElementById("lxShow");
    const setShow = on => { if (!pw) return; pw.type = on ? "text" : "password"; if (eye) eye.innerHTML = LX_EYE[on ? 1 : 0]; if (show) show.checked = on; };
    if (eye) eye.addEventListener("click", () => setShow(pw.type === "password"));
    if (show) show.addEventListener("change", () => setShow(show.checked));
    const caps = document.getElementById("lxCaps"); if (pw && caps) ["keydown", "keyup"].forEach(t => pw.addEventListener(t, e => { if (e.getModifierState) caps.hidden = !e.getModifierState("CapsLock"); }));
    const mt = document.getElementById("lxMeter"); if (mt && pw) pw.addEventListener("input", () => { const s = lxPwScore(pw.value); const C = ["#C2364B", "#E0732B", "#E0A800", "#4FA36B", "#1F8A55"], L = ["Trop faible", "Faible", "Moyen", "Bon", "Excellent"]; mt.style.width = (pw.value ? 20 + s * 20 : 0) + "%"; mt.style.background = C[s]; document.getElementById("lxMeterT").textContent = pw.value ? L[s] : "Robustesse"; });
    /* cases du code : saisie, collage, retour arrière, envoi automatique */
    const otp = document.getElementById("lxOtp");
    if (otp) { const I = [...otp.querySelectorAll("input")];
      const val = () => I.map(i => i.value).join("");
      const fill = (start, digits) => { let k = start; for (const d of digits) { if (k >= I.length) break; I[k].value = d; I[k].classList.add("f"); k++; } (I[Math.min(k, I.length - 1)]).focus(); if (val().length === 6) setTimeout(() => f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })), 120); };
      I.forEach((inp, i) => {
        inp.addEventListener("input", () => { const d = inp.value.replace(/\D/g, ""); inp.value = ""; inp.classList.remove("f"); if (d) fill(i, d); });
        inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && i > 0) { I[i - 1].value = ""; I[i - 1].classList.remove("f"); I[i - 1].focus(); e.preventDefault(); } else if (e.key === "ArrowLeft" && i > 0) I[i - 1].focus(); else if (e.key === "ArrowRight" && i < 5) I[i + 1].focus(); });
        inp.addEventListener("paste", e => { const d = ((e.clipboardData || window.clipboardData).getData("text") || "").replace(/\D/g, ""); if (d) { e.preventDefault(); fill(i, d); } });
        inp.addEventListener("focus", () => inp.select()); });
      setTimeout(() => I[0].focus(), 60);
      const ring = document.getElementById("lxRing"), tt = document.getElementById("lxT");
      if (ring && tt) { const tick = () => { if (!document.body.contains(tt)) { clearInterval(LX.tm); LX.tm = null; return; } const r = 30 - Math.floor(Date.now() / 1000) % 30; tt.textContent = r; ring.style.strokeDashoffset = (56.5 * (1 - r / 30)).toFixed(1); }; tick(); LX.tm = setInterval(tick, 1000); }
      f._otp = val; }
    else { const first = f.querySelector("input:not([style*='display:none'])"); if (first) setTimeout(() => first.focus(), 60); }
    if (mode === "enroll" && !LX.enroll && LX.enrollT === "totp") lxEnrollStart();
    if (mode === "mfa" && LX.ftype === "phone" && !LX.chal) lxSms(false);
    f.addEventListener("submit", ev => { ev.preventDefault(); lxSubmit(mode, f); });
  }

  async function lxEnrollStart() { try { const t = await Auth.token(); const j = await Auth.call("factors", { factor_type: "totp", friendly_name: "Speedix " + new Date().toISOString().slice(0, 16) }, "POST", t); LX.enroll = { id: j.id, qr: (j.totp && j.totp.qr_code) || "", secret: (j.totp && j.totp.secret) || "" }; screen("enroll"); } catch (e) { screen("enroll", "Activation impossible pour le moment : " + errFr(e)); } }
  /* SMS : envoi du code (défi), à la connexion et à l'activation */
  async function lxSms(show) { try { const t = await Auth.token(); const ch = await Auth.call("factors/" + LX.factor + "/challenge", { channel: "sms" }, "POST", t); LX.chal = { id: ch.id, at: Date.now() }; if (show) screen("mfa", "Nouveau code envoyé par SMS.", true); } catch (e) { screen("mfa", "Envoi du SMS impossible : " + errFr(e) + (/sms|phone|provider|twilio/i.test(String(e && e.message)) ? " (l'envoi de SMS doit être activé par l'éditeur)" : "")); } }
  const lxE164 = v => { let d = String(v || "").replace(/[^\d+]/g, ""); if (/^0\d{9}$/.test(d)) d = "+33" + d.slice(1); if (/^00/.test(d)) d = "+" + d.slice(2); if (!/^\+/.test(d)) d = "+" + d; return /^\+\d{8,15}$/.test(d) ? d : ""; };
  async function lxEnrollPhone(raw) { const phone = lxE164(raw); if (!phone) return screen("enroll", "Numéro de téléphone invalide."); try { const t = await Auth.token(); let id = LX.enroll && LX.enroll.type === "phone" && LX.enroll.phone === phone ? LX.enroll.id : null;
      if (!id) { const j = await Auth.call("factors", { factor_type: "phone", phone, friendly_name: "SMS " + phone.slice(-4) + " " + new Date().toISOString().slice(0, 10) }, "POST", t); id = j.id; }
      const ch = await Auth.call("factors/" + id + "/challenge", { channel: "sms" }, "POST", t); LX.enroll = { id, type: "phone", phone, chal: ch.id }; screen("enroll", "Code envoyé par SMS.", true); } catch (e) { screen("enroll", "Activation par SMS impossible : " + errFr(e) + (/sms|phone|provider|twilio|not enabled/i.test(String(e && e.message)) ? " (l'envoi de SMS doit être activé par l'éditeur ; vous pouvez choisir « Application » en attendant)" : "")); } }
  async function lxVerify(factorId, code, chalId) { const t = await Auth.token(); const ch = chalId ? { id: chalId } : await Auth.call("factors/" + factorId + "/challenge", {}, "POST", t); const j = await Auth.call("factors/" + factorId + "/verify", { challenge_id: ch.id, code }, "POST", t); Auth.keep(j); lxMeta(); return j; }
  window.SC_MFA_VERIFY = lxVerify;

  async function lxSubmit(mode, f) {
    const btn = f.querySelector(".lx-btn"); const busy = t => { if (btn) { btn.disabled = true; btn.innerHTML = `<span class="sp"></span>${t || "Patientez…"}`; } };
    const emI = document.getElementById("clEmail"), pw = (document.getElementById("clPass") || {}).value || "", pw2 = (document.getElementById("clPass2") || {}).value || "";
    if (emI) { LX.email = emI.value.trim(); screen._email = LX.email; }
    const em = LX.email; const emOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    try {
      if (mode === "login") { if (!em) return screen("login", "Ce champ est obligatoire"); if (!emOk) return screen("login", "Adresse e-mail invalide"); return screen("pass"); }
      if (mode === "pass") { if (!pw) return screen("pass", "Ce champ est obligatoire"); busy("Connexion…");
        const isCode = /^\s*sc-/i.test(pw); const p2 = isCode ? pw.trim().toUpperCase().replace(/\s+/g, "") : pw;
        try { await Auth.login(em, p2); }
        catch (e) { if (!isCode || !/Invalid login credentials/i.test(e.message || "")) throw e;
          let s = null; try { s = await Auth.signup(em, p2); } catch (e2) { if (/already registered|already been registered|User already exists/i.test(e2.message || "")) throw new Error("SC_EXISTS"); throw e2; }
          if (!s) { try { await Auth.login(em, p2); } catch (e3) { if (/Email not confirmed/i.test(e3.message || "")) throw e3; throw new Error("SC_EXISTS"); } } }
        lxRecAdd(em); lxMeta(); return lxAfter(); }
      if (mode === "enroll" && LX.enrollT !== "totp" && !(LX.enroll && LX.enroll.type === "phone")) return lxEnrollPhone((document.getElementById("lxPhone") || {}).value);
      if (mode === "mfa" || mode === "enroll") { const code = f._otp ? f._otp() : ""; if (code.length !== 6) return screen(mode, "Saisissez les 6 chiffres du code.");
        busy("Vérification…");
        if (mode === "mfa") { if (!LX.factor) { const F = await lxFactors(); LX.factor = F[0] && F[0].id; } if (!LX.factor) return lxAfter(); await lxVerify(LX.factor, code, LX.ftype === "phone" && LX.chal ? LX.chal.id : null); try { localStorage.setItem("sc:mfaPref", LX.ftype || "totp"); } catch (e) { }
          if ((document.getElementById("lxTrust") || {}).checked) { try { localStorage.setItem(lxTrustK(), String(Date.now() + 30 * 864e5)); } catch (e) { } } }
        else { if (!LX.enroll) return LX.enrollT === "totp" ? lxEnrollStart() : screen("enroll"); await lxVerify(LX.enroll.id, code, LX.enroll.type === "phone" ? LX.enroll.chal : null); LX.enroll = null; }
        delete Auth.s.mfa; Auth.save(Auth.s); return screen._done(); }
      if ((mode === "signup" || mode === "reset") && pw !== pw2) return screen(mode, "Les deux mots de passe ne sont pas identiques.");
      if ((mode === "signup" || mode === "reset") && pw.length < 8) return screen(mode, "Mot de passe trop court : 8 caractères minimum.");
      if (mode !== "reset" && !emOk) return screen(mode, em ? "Adresse e-mail invalide" : "Ce champ est obligatoire");
      busy();
      if (mode === "signup") { const s = await Auth.signup(em, pw); if (s) { lxRecAdd(em); lxMeta(); return lxAfter(); } return screen("login", "Compte créé. Ouvrez l'e-mail de confirmation reçu, puis connectez-vous ici.", true); }
      if (mode === "recover") { await Auth.recover(em); return screen("login", "Si un compte existe pour cette adresse, un lien vient de vous être envoyé par e-mail.", true); }
      if (mode === "reset") { await Auth.setPassword(screen._rat, pw); history.replaceState(null, "", location.pathname); return screen("login", "Mot de passe modifié : connectez-vous.", true); }
    } catch (e) { const m = errFr(e); screen(mode, /invalid.*(code|totp)|Invalid TOTP|expired/i.test(String(e && e.message)) ? "Code incorrect ou expiré : réessayez avec le code affiché." : m); }
  }

  /* offres et tarifs, affichés sous la connexion (vitrine publique publiée par l'éditeur) */
  let OFF = null;
  window.SC_OFFRES = f => { if (f) OFF = null; return offres(); };
  async function offres() { const box = () => document.getElementById("clOffres"); try {
      if (!OFF) { const r = await fetch(URL0 + "/rest/v1/sc_docs?select=data&path=eq." + encodeURIComponent("public/offres"), { headers: { apikey: KEY } }); const j = r.ok ? await r.json() : []; OFF = (j[0] && j[0].data) || { offres: [] }; }
      const b = box(); if (!b || !OFF.actif || !(OFF.offres || []).length) return;
      const how = OFF.login || "lien"; if (how === "non") { b.innerHTML = ""; return; }
      const wanted = how === "auto" || offres.open || /[?&#]offres\b/.test(location.search + location.hash);
      if (!wanted) { b.innerHTML = `<button type="button" class="cl-offbtn" id="clOffBtn">Pas encore client ? <b>Découvrir nos offres</b> ›</button>`; const k = document.getElementById("clOffBtn"); if (k) k.addEventListener("click", () => { offres.open = true; offres(); }); return; }
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
      const act = o => o.lien ? `<a class="clo-a" href="${e(o.lien)}" target="_blank" rel="noopener">Souscrire</a>` : OFF.email ? `<a class="clo-a" href="mailto:${e(OFF.email)}?subject=${encodeURIComponent("Offre " + o.nom + " - " + (OFF.nom || "Speedix"))}&body=${encodeURIComponent("Bonjour,\n\nJe souhaite souscrire à l'offre " + o.nom + ".\n\nNom / société :\nTéléphone :\n\nMerci.")}">Choisir cette offre</a>` : "";
      b.innerHTML = `<div class="clo-h">${how !== "auto" ? `<button type="button" class="cl-offx" id="clOffX" title="Masquer les offres">✕</button>` : ""}<h2>Nos offres</h2><p>Pas encore client ? Choisissez votre formule : nous créons votre espace et vous recevez votre code d'accès.</p></div>
        <div class="clo-g">${OFF.offres.map(o => `<div class="clo-c ${o.top ? "top" : ""}">${o.top ? '<span class="clo-b">Le plus choisi</span>' : ""}<div class="clo-n">${e(o.nom)}</div><div class="clo-p">${prix(o.prix)} <small>${per(o.periode)}</small></div>${o.desc ? `<div class="clo-d">${e(o.desc)}</div>` : ""}<ul>${(o.inclus || []).map(x => `<li>${e(x)}</li>`).join("")}</ul>${act(o)}</div>`).join("")}</div>
        ${OFF.email || OFF.tel ? `<div class="clo-f">Une question ? ${OFF.email ? `<a href="mailto:${e(OFF.email)}">${e(OFF.email)}</a>` : ""}${OFF.email && OFF.tel ? " · " : ""}${OFF.tel ? `<a href="tel:${e(OFF.tel)}">${e(OFF.tel)}</a>` : ""}</div>` : ""}`;
      const x0 = document.getElementById("clOffX"); if (x0) x0.addEventListener("click", () => { offres.open = false; offres(); });
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
    const pend = u && Auth.s && Auth.s.mfa ? Auth.s.mfa : "";
    if (!u || pend) { let om = ""; try { om = sessionStorage.getItem("sc:outMsg") || ""; sessionStorage.removeItem("sc:outMsg"); } catch (e) { }
      if (hs !== "reset") { const sp = document.getElementById("scSplash"); if (sp) sp.remove(); if (!om) await intro(); }
      await new Promise(res => { screen._done = res; screen(hs === "reset" ? "reset" : pend ? (pend === "enroll" ? "enroll" : "mfa") : "login", om || undefined, !!om); }); u = await me(); }
    if (!u) { screen("login", "Connexion impossible, réessayez."); return new Promise(() => { }); }
    Store.db = DB; Store.uid = u.id; Store.mode = "db"; Store.cloud = true;
    let ed = null;
    Store.user = { id: async () => u.id, isOwner: async () => { if (ed === null) { try { ed = !!(await rest("rpc/sc_is_editor", { method: "POST", body: "{}" })); } catch (e) { ed = false; } } return ed; },
      me: async () => ({ id: u.id, name: (u.email || "").split("@")[0], email: u.email }), profiles: async () => ({}) };
    UI.userEmail = u.email;
    const app = document.getElementById("app"); if (app) app.innerHTML = `<div style="padding:40px;font-weight:800;font-size:22px">${(() => { try { return (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "Speedix"; } catch (e) { return "Speedix"; } })()}<div class="muted" style="font-weight:400;font-size:14px;margin-top:6px" id="bootStep">Ouverture de votre espace…</div></div>`;
  };
  /* compte sans invitation valide : en attente plutôt qu'accès libre */
  const _la = loadAccess;
  loadAccess = async function () { await _la.apply(this, arguments); if (!isAdmin() && UI.access && UI.access.auto) UI.access = { role: "client", statut: "attente", offres: [] }; };

  /* ---------------- Paramètres › Sécurité de connexion (double authentification, durée de session) ---------------- */
  function secCard() { const adm = typeof isAdmin === "function" && isAdmin(); const keep = LX.keep;
    return `<section class="panel" style="margin-bottom:14px" id="secCard"><div class="panel-h"><h2>🔐 Sécurité de connexion</h2></div><div class="panel-b">
      <div class="grid g2">
        <div><b>Double authentification</b><p class="small muted" style="margin:4px 0 8px">Après le mot de passe, un code à 6 chiffres est demandé : reçu par SMS sur votre téléphone portable, ou donné par une application d'authentification (Google ou Microsoft Authenticator…).</p><div id="secMfa" class="small muted">Vérification…</div></div>
        <div>${lxPolC().keep === "1" ? `<label class="f">Maintenir la connexion active pendant 30 jours<select class="in" id="secKeep"><option value="1" ${keep ? "selected" : ""}>Oui</option><option value="0" ${keep ? "" : "selected"}>Non</option></select></label>` : `<p class="small muted" style="margin:0 0 8px"><b>Session courte</b> : déconnexion automatique après ${(lxPolC().idle == null || lxPolC().idle === "" ? 30 : +lxPolC().idle) || "—"} minutes d'inactivité ; rien n'est retenu sur l'appareil après la déconnexion.</p>`}<label class="f">Se souvenir de mon adresse e-mail sur cet ordinateur<select class="in" id="secRem"><option value="0" ${lxRem() ? "" : "selected"}>Non (recommandé)</option><option value="1" ${lxRem() ? "selected" : ""}>Oui</option></select></label>
        <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap"><button class="btn sm" data-sec="trust">Oublier cet appareil de confiance</button><button class="btn sm" data-sec="out">Se déconnecter</button></div></div>
      </div>
      ${adm ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--rule,#E3EBEA)"><b>Règles de sécurité pour tous les utilisateurs (éditeur)</b><div class="grid g2" style="margin-top:8px"><label class="f">Exiger la double authentification<select class="in" id="secPol" data-k="mfa"><option value="0">Non</option><option value="1">Oui : activation obligatoire à la prochaine connexion</option></select></label>
        <label class="f">Déconnexion automatique après inactivité<select class="in secPolX" data-k="idle"><option value="15">15 minutes</option><option value="30">30 minutes (recommandé)</option><option value="60">1 heure</option><option value="240">4 heures</option><option value="0">Jamais</option></select></label>
        <label class="f">Autoriser « rester connecté 30 jours »<select class="in secPolX" data-k="keep"><option value="0">Non (recommandé)</option><option value="1">Oui</option></select></label>
        <label class="f">Autoriser les appareils de confiance (pas de code pendant 30 jours)<select class="in secPolX" data-k="trust"><option value="0">Non : code à chaque connexion (recommandé)</option><option value="1">Oui</option></select></label></div><div id="secPolInfo" class="small muted" style="margin-top:4px"></div></div>` : ""}
    </div></section>`; }
  async function secFill() { const box = document.getElementById("secMfa"); if (!box) return;
    const F = await lxFactors(); const at = (() => { try { return JSON.parse(atob(Auth.s.at.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch (e) { return {}; } })();
    const hasP = F.some(f => f.factor_type === "phone"), hasT = F.some(f => f.factor_type === "totp"); const lab = f => f.factor_type === "phone" ? "📱 SMS au " + (String(f.phone || "").replace(/^(\+?\d{2})\d+(\d{2})$/, "$1 •• •• •• $2") || "téléphone") : "🔐 Application d'authentification";
    box.innerHTML = (F.length ? `<span class="pill ok" style="background:#E3F4EA;color:#1F6B44;padding:3px 10px;border-radius:999px;font-weight:700">✓ Activée</span>${at.aal === "aal2" ? " <span>· session vérifiée</span>" : ""}<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${F.map(f => `<div style="display:flex;align-items:center;gap:8px;justify-content:space-between;border:1px solid var(--rule,#E3EBEA);border-radius:10px;padding:6px 10px"><span>${lab(f)} · depuis le ${new Date(f.created_at || Date.now()).toLocaleDateString("fr-FR")}</span><button class="btn sm danger" data-sec="off" data-id="${f.id}" data-t="${f.factor_type}">Retirer…</button></div>`).join("")}</div>`
      : `<span class="pill" style="background:#FFF4D6;color:#8A5A00;padding:3px 10px;border-radius:999px;font-weight:700">Désactivée</span>`) + `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${hasP ? "" : `<button class="btn sm pri" data-sec="sms">📱 Activer par SMS</button>`}${hasT ? "" : `<button class="btn sm ${hasP ? "pri" : ""}" data-sec="on">🔐 Activer par application</button>`}</div>`;
    const ps = document.getElementById("secPol"); if (ps) { const pol = await lxPolicy(); ps.value = pol.mfa === "1" ? "1" : "0"; document.querySelectorAll(".secPolX").forEach(x => { const k = x.dataset.k; x.value = k === "idle" ? String(pol.idle == null || pol.idle === "" ? 30 : pol.idle) : pol[k] === "1" ? "1" : "0"; }); const inf = document.getElementById("secPolInfo"); if (inf && pol.at) inf.textContent = "Dernière modification : " + new Date(pol.at).toLocaleString("fr-FR") + (pol.by ? " par " + pol.by : ""); } }
  function secModal(kind, factorId) { lxCss(); const old = document.getElementById("secMod"); if (old) old.remove();
    const d = document.createElement("div"); d.id = "secMod"; d.style.cssText = "position:fixed;inset:0;z-index:60;background:rgba(15,27,51,.45);display:grid;place-items:center;padding:16px";
    const isSms = kind === "sms" || (kind === "off" && secModal._t === "phone");
    d.innerHTML = `<div class="lx" style="min-height:auto;padding:0;width:min(480px,100%)"><div style="background:#fff;border-radius:18px;padding:24px;box-shadow:0 30px 80px rgba(15,27,51,.3);width:100%"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px;color:#13585A">${kind === "sms" ? "Activer la double authentification par SMS" : kind === "on" ? "Activer la double authentification" : "Retirer cette méthode"}</b><button class="lx-eye" style="position:static;transform:none" data-x>✕</button></div>
      <div id="secBody" style="margin-top:14px">${kind === "sms" ? '<label class="lx-f"><span>Numéro de téléphone portable</span><input id="secPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78"></label><button type="button" class="lx-btn" id="secSend" style="margin-top:8px">Recevoir le code par SMS</button>' : kind === "on" ? '<div class="lx-hint">Préparation du QR code…</div>' : isSms ? '<p class="lx-hint" style="text-align:left">Pour confirmer, saisissez le code reçu par SMS.</p>' : '<p class="lx-hint" style="text-align:left">Pour confirmer, saisissez le code actuel de votre application d\'authentification.</p>'}</div>
      <form id="secF" class="lx-card" style="margin-top:12px" novalidate><div class="lx-f"><input id="secCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="Code à 6 chiffres" style="text-align:center;font-size:22px;letter-spacing:.3em"></div><div id="secMsg"></div><button class="lx-btn" type="submit" style="margin-top:0">${kind === "on" ? "Activer" : "Désactiver"}</button></form></div></div>`;
    document.body.appendChild(d); const close = () => d.remove(); d.querySelector("[data-x]").onclick = close; d.addEventListener("click", e => { if (e.target === d) close(); });
    const msg = (t, ok) => { document.getElementById("secMsg").innerHTML = t ? `<div class="lx-msg ${ok ? "ok" : ""}">${t}</div>` : ""; };
    let enr = null;
    if (kind === "on") (async () => { try { const t = await Auth.token(); const j = await Auth.call("factors", { factor_type: "totp", friendly_name: "Speedix " + new Date().toISOString().slice(0, 16) }, "POST", t); enr = j;
      document.getElementById("secBody").innerHTML = `<div class="lx-qr"><img src="${lxE(j.totp.qr_code)}" alt="QR code"><ol><li>Ouvrez votre application d'authentification</li><li>Scannez le QR code ou saisissez la clé :<span class="lx-secret">${lxE(j.totp.secret)}</span></li><li>Tapez le code affiché</li></ol></div>`; } catch (e) { msg("Activation impossible : " + errFr(e)); } })();
    let smsChal = null;
    if (kind === "sms") document.getElementById("secSend").onclick = async () => { const phone = lxE164(document.getElementById("secPhone").value); if (!phone) return msg("Numéro de téléphone invalide."); try { const t = await Auth.token(); if (!enr || enr.phone !== phone) { const j = await Auth.call("factors", { factor_type: "phone", phone, friendly_name: "SMS " + phone.slice(-4) + " " + new Date().toISOString().slice(0, 10) }, "POST", t); enr = { id: j.id, phone }; } const ch = await Auth.call("factors/" + enr.id + "/challenge", { channel: "sms" }, "POST", t); smsChal = ch.id; msg("Code envoyé par SMS au " + phone + ".", true); document.getElementById("secCode").focus(); } catch (e) { msg("Envoi impossible : " + errFr(e) + (/sms|phone|provider|twilio|not enabled/i.test(String(e && e.message)) ? " (l'envoi de SMS doit être activé par l'éditeur dans Supabase)" : "")); } };
    if (kind === "off" && isSms) (async () => { try { const t = await Auth.token(); const ch = await Auth.call("factors/" + factorId + "/challenge", { channel: "sms" }, "POST", t); smsChal = ch.id; msg("Code envoyé par SMS.", true); } catch (e) { msg("Envoi du SMS impossible : " + errFr(e)); } })();
    setTimeout(() => { const c = document.getElementById(kind === "sms" ? "secPhone" : "secCode"); if (c) c.focus(); }, 50);
    document.getElementById("secF").addEventListener("submit", async ev => { ev.preventDefault(); const code = (document.getElementById("secCode").value || "").replace(/\D/g, ""); if (code.length !== 6) return msg("Saisissez les 6 chiffres du code.");
      try { if (kind === "sms") { if (!enr || !smsChal) return msg("Recevez d'abord le code par SMS."); await lxVerify(enr.id, code, smsChal); toast("Double authentification par SMS activée"); }
        else if (kind === "on") { if (!enr) return msg("QR code en préparation, patientez."); await lxVerify(enr.id, code); toast("Double authentification activée"); }
        else { await lxVerify(factorId, code, isSms ? smsChal : null); const t = await Auth.token(); await Auth.call("factors/" + factorId, null, "DELETE", t); toast("Double authentification désactivée"); }
        close(); secFill(); } catch (e) { msg(/totp|code|expired|invalid/i.test(String(e && e.message)) ? "Code incorrect ou expiré." : errFr(e)); } }); }
  document.addEventListener("click", async e => { const b = e.target.closest && e.target.closest("[data-sec]"); if (!b) return; const k = b.dataset.sec;
    if (k === "on" || k === "off" || k === "sms") { secModal._t = b.dataset.t || ""; secModal(k, b.dataset.id); }
    else if (k === "trust") { try { localStorage.removeItem(lxTrustK()); } catch (x) { } toast("Cet appareil n'est plus de confiance : le code sera demandé à la prochaine connexion"); }
    else if (k === "out") { if (window.SC_LOGOUT) SC_LOGOUT(); } });
  document.addEventListener("change", async e => { const t = e.target;
    if (t.id === "secRem") { try { localStorage.setItem("sc:remember", t.value); if (t.value !== "1") localStorage.removeItem("sc:recentEmails"); } catch (x) { } toast(t.value === "1" ? "Adresse e-mail retenue sur cet ordinateur" : "Plus aucune adresse retenue sur cet ordinateur"); }
    else if (t.id === "secKeep") { LX.keep = t.value === "1"; try { localStorage.setItem("sc:keep30", t.value); } catch (x) { } lxMeta(); toast("Durée de connexion enregistrée"); }
    else if (t.classList && t.classList.contains("secPolX")) { try { LX.pol = null; const pol = Object.assign({}, await lxPolicy(), { [t.dataset.k]: t.value, at: Date.now(), by: UI.userEmail || "" }); const raw = Store.rawDb || Store.db; await raw.doc("public/securite").set(pol); LX.pol = null; toast("Règle de sécurité enregistrée pour tous les utilisateurs"); secFill(); } catch (x) { toast("Enregistrement impossible : " + (x.message || x)); } }
    else if (t.id === "secPol") { try { const raw = Store.rawDb || Store.db; LX.pol = null; const cur = await lxPolicy(); await raw.doc("public/securite").set(Object.assign({}, cur, { mfa: t.value, at: Date.now(), by: UI.userEmail || "" })); LX.pol = null; toast(t.value === "1" ? "Double authentification obligatoire pour tous les utilisateurs" : "Double authentification facultative"); secFill(); } catch (x) { toast("Enregistrement impossible : " + (x.message || x)); } } });
  document.addEventListener("DOMContentLoaded", () => { if (typeof VIEWS === "undefined" || typeof VIEWS.params !== "function") return; const _p = VIEWS.params;
    VIEWS.params = function () { const h = _p.apply(this, arguments); setTimeout(secFill, 30); const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + secCard() : h.slice(0, i) + secCard() + h.slice(i); }; });
  window.SC_LX_PREVIEW = () => { lxCss(); return `<div class="lx" style="${lxCol()};min-height:auto;padding:0 16px 34px;margin:14px auto 18px;max-width:900px;border-radius:22px;overflow:hidden;border:1px solid #E3EBEA"><div class="lx-bg" aria-hidden="true" style="position:absolute"><i></i><i></i><i></i></div><header class="lx-top"><span class="lx-pill">🔒 Connexion chiffrée</span></header><main class="lx-main" style="margin-top:0"><div class="lx-logo">${lxMark()}<span>${lxBrand()}</span></div><div class="lx-steps"><span class="on"></span><span></span></div><h1>Connectez-vous</h1><p class="lx-sub">Votre espace comptable, en toute sécurité.</p><div class="lx-card"><label class="lx-f"><span>E-mail</span><input disabled placeholder="email-du-client@exemple.fr"></label><label class="lx-chk"><input type="checkbox" disabled><span>Maintenir ma connexion active pendant 30 jours</span></label><button class="lx-btn" type="button" disabled>Continuer</button></div><p class="lx-hint" style="margin-top:14px">Étape suivante : le <b>code d'accès</b> reçu de votre cabinet (SC-…), puis le code de vérification si la double authentification est activée.</p></main></div>`; };
  window.SC_LOGOUT = async (why) => { try { if (Store.flush) await Store.flush(); } catch (e) { } await Auth.logout(); lxWipe(); try { ["sc:view", "sc:index"].forEach(k => localStorage.removeItem(k)); if (why) sessionStorage.setItem("sc:outWhy", why); } catch (e) { } location.replace(location.pathname + location.search); };
  /* déconnexion automatique après inactivité (politique de l'éditeur, 30 minutes par défaut) */
  (function () { let last = Date.now(); const bump = () => { last = Date.now(); }; ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(ev => addEventListener(ev, bump, { passive: true, capture: true }));
    setInterval(async () => { try { if (!Auth.s || Auth.s.mfa) return; const pol = await lxPolicy(); const min = pol.idle == null || pol.idle === "" ? 30 : Number(pol.idle) || 0; if (min && Date.now() - last > min * 60000 && window.SC_LOGOUT) SC_LOGOUT("Déconnexion automatique après " + min + " minutes d'inactivité."); } catch (e) { } }, 30000); })();
})();
