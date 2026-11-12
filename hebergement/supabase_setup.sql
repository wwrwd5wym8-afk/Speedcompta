-- ============================================================
-- SpeedCompta en ligne : base de données Supabase
-- À coller une seule fois dans Supabase › SQL Editor › New query, puis « Run ».
-- Le PREMIER compte créé dans l'application devient le compte éditeur (vous).
-- Ensuite, seuls les clients invités depuis « Clients et accès » peuvent se connecter, avec leur e-mail + leur code d'accès.
-- Mise à jour : ce fichier peut être relancé sans risque (il ne supprime aucune donnée).
-- ============================================================

-- Documents du logiciel (configuration, accès, sociétés, écritures…)
create table if not exists public.sc_docs (
  path text primary key,
  parent text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists sc_docs_parent_idx on public.sc_docs (parent);

-- Comptes éditeurs (vous)
create table if not exists public.sc_editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.sc_is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sc_editors where user_id = auth.uid());
$$;

-- Ce qu'un utilisateur connecté peut lire ou écrire
create or replace function public.sc_can_read(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.sc_is_editor()
    or p = 'app/config'
    or p = 'access/' || auth.uid()::text
    or p = 'registry/' || auth.uid()::text
    or p = 'idees/' || auth.uid()::text
    or p = 'data/users/' || auth.uid()::text
    or left(p, length('data/users/' || auth.uid()::text || '/')) = 'data/users/' || auth.uid()::text || '/'
  );
$$;
create or replace function public.sc_can_write(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.sc_is_editor()
    or p = 'registry/' || auth.uid()::text
    or p = 'idees/' || auth.uid()::text
    or left(p, length('data/users/' || auth.uid()::text || '/')) = 'data/users/' || auth.uid()::text || '/'
  );
$$;

alter table public.sc_docs enable row level security;
alter table public.sc_editors enable row level security;

drop policy if exists sc_docs_select on public.sc_docs;
drop policy if exists sc_docs_insert on public.sc_docs;
drop policy if exists sc_docs_update on public.sc_docs;
drop policy if exists sc_docs_delete on public.sc_docs;
drop policy if exists sc_editors_self on public.sc_editors;
create policy sc_docs_select on public.sc_docs for select to authenticated using (public.sc_can_read(path));
create policy sc_docs_insert on public.sc_docs for insert to authenticated with check (public.sc_can_write(path) and parent = regexp_replace(path, '/[^/]*$', ''));
create policy sc_docs_update on public.sc_docs for update to authenticated using (public.sc_can_write(path)) with check (public.sc_can_write(path) and parent = regexp_replace(path, '/[^/]*$', ''));
create policy sc_docs_delete on public.sc_docs for delete to authenticated using (public.sc_can_write(path));
drop policy if exists sc_docs_public on public.sc_docs;
-- Vitrine publique (offres et tarifs affichés avant la connexion) : lecture libre, écriture par l'éditeur seulement
create policy sc_docs_public on public.sc_docs for select to anon, authenticated using (left(path, 7) = 'public/');
create policy sc_editors_self on public.sc_editors for select to authenticated using (user_id = auth.uid());

revoke all on public.sc_docs from anon;
revoke all on public.sc_editors from anon;
grant select, insert, update, delete on public.sc_docs to authenticated;
grant select on public.sc_docs to anon;
grant select on public.sc_editors to authenticated;
grant execute on function public.sc_is_editor() to authenticated;

-- Création d'un compte : le premier devient éditeur ; les suivants doivent avoir une invitation.
-- À l'inscription d'un client : accès de son offre + transfert de la ou des sociétés préparées.
create or replace function public.sc_on_signup() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv jsonb; ed text; d text; nm text; uidt text := new.id::text;
  lst jsonb := '[]'::jsonb; ids jsonb;
begin
  if not exists (select 1 from public.sc_editors) then
    insert into public.sc_editors (user_id, email) values (new.id, new.email);
    return new;
  end if;

  select data into inv from public.sc_docs where path = 'invites/' || lower(new.email);
  if inv is null or coalesce(inv ->> 'statut', '') = 'suspendu'
     or (inv ? 'uid' and inv ->> 'uid' <> uidt and exists (select 1 from auth.users u where u.id::text = inv ->> 'uid')) then
    raise exception 'SC_NO_INVITE';
  end if;
  -- le client se connecte avec son e-mail + le code d'accès donné par le cabinet
  if coalesce(inv ->> 'code', '') = '' or new.encrypted_password is null
     or extensions.crypt(inv ->> 'code', new.encrypted_password) <> new.encrypted_password then
    raise exception 'SC_BAD_CODE';
  end if;

  -- accès selon l'offre
  insert into public.sc_docs (path, parent, data)
  values ('access/' || uidt, 'access', coalesce(inv -> 'access', '{}'::jsonb) || jsonb_build_object('maj', now()))
  on conflict (path) do update set data = excluded.data, updated_at = now();

  -- sociétés préparées par l'éditeur : elles passent dans l'espace du client
  ed := inv ->> 'editor';
  ids := coalesce(inv -> 'dossiers', '[]'::jsonb);
  if ed is not null then
    for d in select jsonb_array_elements_text(ids) loop
      if exists (select 1 from public.sc_docs where path = 'data/users/' || ed || '/d_' || d) then
        update public.sc_docs
           set path = 'data/users/' || uidt || substr(path, length('data/users/' || ed) + 1),
               parent = 'data/users/' || uidt || substr(parent, length('data/users/' || ed) + 1),
               updated_at = now()
         where path = 'data/users/' || ed || '/d_' || d
            or left(path, length('data/users/' || ed || '/d_' || d || '/')) = 'data/users/' || ed || '/d_' || d || '/';
        select data ->> 'nom' into nm from public.sc_docs where path = 'data/users/' || uidt || '/d_' || d;
        lst := lst || jsonb_build_array(jsonb_build_object('id', d, 'nom', coalesce(nm, 'Société')));
      end if;
    end loop;
    if jsonb_array_length(lst) > 0 then
      update public.sc_docs
         set data = jsonb_set(data, '{dossiers}', coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(data -> 'dossiers', '[]'::jsonb)) x
                                                           where not ((x ->> 'id') in (select jsonb_array_elements_text(ids)))), '[]'::jsonb)),
             updated_at = now()
       where path = 'data/users/' || ed || '/index';
      insert into public.sc_docs (path, parent, data)
      values ('data/users/' || uidt || '/index', 'data/users/' || uidt, jsonb_build_object('current', lst -> 0 ->> 'id', 'dossiers', lst))
      on conflict (path) do update set data = jsonb_set(public.sc_docs.data, '{dossiers}', coalesce(public.sc_docs.data -> 'dossiers', '[]'::jsonb) || lst), updated_at = now();
    end if;
  end if;

  -- invitation utilisée, compte relié à l'accès client
  update public.sc_docs set data = data || jsonb_build_object('uid', uidt, 'claimed', now(), 'dossiers', ids), updated_at = now()
   where path = 'invites/' || lower(new.email);
  update public.sc_docs
     set data = jsonb_set(data, '{licences}', (select coalesce(jsonb_agg(case when l ->> 'id' = inv ->> 'licence' then l || jsonb_build_object('uid', uidt, 'nomCompte', new.email) else l end), '[]'::jsonb)
                                              from jsonb_array_elements(data -> 'licences') l)),
         updated_at = now()
   where path = 'app/config' and jsonb_typeof(data -> 'licences') = 'array';
  insert into public.sc_docs (path, parent, data)
  values ('registry/' || uidt, 'registry', jsonb_build_object('id', uidt, 'email', new.email, 'name', split_part(new.email, '@', 1), 'premier', now(), 'licence', jsonb_build_object('id', inv ->> 'licence', 'invite', true)))
  on conflict (path) do nothing;
  return new;
end $$;

-- Compte d'un client invité (e-mail + bon code) : adresse validée d'office, pas d'e-mail de confirmation à attendre
create or replace function public.sc_before_signup() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv jsonb;
begin
  if exists (select 1 from public.sc_editors) then
    select data into inv from public.sc_docs where path = 'invites/' || lower(new.email);
    if inv is not null and coalesce(inv ->> 'code', '') <> '' and new.encrypted_password is not null
       and extensions.crypt(inv ->> 'code', new.encrypted_password) = new.encrypted_password then
      new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sc_signup_before on auth.users;
create trigger sc_signup_before before insert on auth.users for each row execute function public.sc_before_signup();

drop trigger if exists sc_signup on auth.users;
create trigger sc_signup after insert on auth.users for each row execute function public.sc_on_signup();

-- Réinitialiser l'accès d'un client (bouton « Réinitialiser l'accès » de l'éditeur) :
-- supprime son compte de connexion, rend ses sociétés au cabinet, et il peut se reconnecter avec son e-mail + code.
create or replace function public.sc_reset_client(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid; old text; ed text := auth.uid()::text; lst jsonb; em text := lower(trim(p_email));
begin
  if not public.sc_is_editor() then raise exception 'SC_FORBIDDEN'; end if;
  select id into u from auth.users where lower(email) = em;
  if u is null then
    update public.sc_docs set data = data - 'uid' - 'claimed', updated_at = now() where path = 'invites/' || em;
    return 'none';
  end if;
  if exists (select 1 from public.sc_editors where user_id = u) then raise exception 'SC_IS_EDITOR'; end if;
  old := u::text;
  -- sociétés du client : retour dans l'espace du cabinet
  select coalesce(data -> 'dossiers', '[]'::jsonb) into lst from public.sc_docs where path = 'data/users/' || old || '/index';
  lst := coalesce(lst, '[]'::jsonb);
  update public.sc_docs
     set path = 'data/users/' || ed || substr(path, length('data/users/' || old) + 1),
         parent = 'data/users/' || ed || substr(parent, length('data/users/' || old) + 1), updated_at = now()
   where left(path, length('data/users/' || old || '/d_')) = 'data/users/' || old || '/d_'
     and not exists (select 1 from public.sc_docs x where x.path = 'data/users/' || ed || substr(public.sc_docs.path, length('data/users/' || old) + 1));
  if jsonb_array_length(lst) > 0 then
    insert into public.sc_docs (path, parent, data) values ('data/users/' || ed || '/index', 'data/users/' || ed, jsonb_build_object('dossiers', lst))
    on conflict (path) do update set data = jsonb_set(public.sc_docs.data, '{dossiers}',
      coalesce(public.sc_docs.data -> 'dossiers', '[]'::jsonb) || coalesce((select jsonb_agg(y) from jsonb_array_elements(lst) y
        where not exists (select 1 from jsonb_array_elements(coalesce(public.sc_docs.data -> 'dossiers', '[]'::jsonb)) z where z ->> 'id' = y ->> 'id')), '[]'::jsonb)), updated_at = now();
  end if;
  delete from public.sc_docs where path = 'data/users/' || old or left(path, length('data/users/' || old || '/')) = 'data/users/' || old || '/';
  delete from public.sc_docs where path in ('access/' || old, 'registry/' || old, 'idees/' || old);
  update public.sc_docs set data = (data - 'uid' - 'claimed') || jsonb_build_object('editor', ed,
      'dossiers', coalesce((select jsonb_agg(y ->> 'id') from jsonb_array_elements(lst) y), coalesce(data -> 'dossiers', '[]'::jsonb))), updated_at = now()
   where path = 'invites/' || em;
  update public.sc_docs
     set data = jsonb_set(data, '{licences}', (select coalesce(jsonb_agg(case when l ->> 'uid' = old then l - 'uid' - 'nomCompte' else l end), '[]'::jsonb) from jsonb_array_elements(data -> 'licences') l)), updated_at = now()
   where path = 'app/config' and jsonb_typeof(data -> 'licences') = 'array';
  delete from auth.users where id = u;
  return 'ok';
end $$;
revoke all on function public.sc_reset_client(text) from public, anon;
grant execute on function public.sc_reset_client(text) to authenticated;

-- ============================================================
-- PA · réseau de facturation électronique SpeedCompta (annuaire des SIREN + boîtes de réception)
-- ============================================================
create or replace function public.sc_pa_exists(p_siren text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sc_docs where path = 'public/pa_annuaire/' || p_siren);
$$;
create or replace function public.sc_pa_owner(p_siren text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (public.sc_is_editor() or exists (
    select 1 from public.sc_docs a where a.path = 'public/pa_annuaire/' || p_siren and (a.data -> 'owners') ? auth.uid()::text));
$$;
grant execute on function public.sc_pa_exists(text) to anon, authenticated;
grant execute on function public.sc_pa_owner(text) to authenticated;
-- annuaire : chaque société inscrit son propre SIREN (lecture publique déjà ouverte sur public/)
drop policy if exists sc_pa_ann_ins on public.sc_docs;
drop policy if exists sc_pa_ann_upd on public.sc_docs;
drop policy if exists sc_pa_ann_del on public.sc_docs;
create policy sc_pa_ann_ins on public.sc_docs for insert to authenticated with check (
  path ~ '^public/pa_annuaire/[0-9]{9}$' and parent = 'public/pa_annuaire' and (data -> 'owners') ? auth.uid()::text);
create policy sc_pa_ann_upd on public.sc_docs for update to authenticated using (
  path ~ '^public/pa_annuaire/[0-9]{9}$' and public.sc_pa_owner(split_part(path, '/', 3)))
  with check (path ~ '^public/pa_annuaire/[0-9]{9}$' and parent = 'public/pa_annuaire' and (data -> 'owners') ? auth.uid()::text);
create policy sc_pa_ann_del on public.sc_docs for delete to authenticated using (
  path ~ '^public/pa_annuaire/[0-9]{9}$' and public.sc_pa_owner(split_part(path, '/', 3)));
-- boîtes de réception : tout le monde peut déposer une facture à un SIREN inscrit, seul le destinataire la lit
drop policy if exists sc_pa_box_ins on public.sc_docs;
drop policy if exists sc_pa_box_sel on public.sc_docs;
drop policy if exists sc_pa_box_del on public.sc_docs;
create policy sc_pa_box_ins on public.sc_docs for insert to anon, authenticated with check (
  path ~ '^pa/box/[0-9]{9}/[A-Za-z0-9_-]{6,80}$' and parent = regexp_replace(path, '/[^/]*$', '')
  and public.sc_pa_exists(split_part(path, '/', 3)) and octet_length(data::text) < 12000000);
create policy sc_pa_box_sel on public.sc_docs for select to authenticated using (
  path like 'pa/box/%' and public.sc_pa_owner(split_part(path, '/', 3)));
create policy sc_pa_box_del on public.sc_docs for delete to authenticated using (
  path like 'pa/box/%' and public.sc_pa_owner(split_part(path, '/', 3)));
grant insert on public.sc_docs to anon;
