#!/usr/bin/env bash
# =====================================================================================
#  Speedix – installation d'un hébergement autonome et sécurisé
#  Serveur visé : Ubuntu 24.04 / 22.04 ou Debian 12, neuf (VPS OVHcloud, Scaleway,
#  Infomaniak, Google Cloud Compute Engine, etc.).
#
#  Usage (en root ou avec sudo) :
#    bash install.sh --domaine compta.mondomaine.fr --email moi@mondomaine.fr [--mode app|complet]
#                    [--google-verification googleXXXXXXXX.html] [--source https://github.com/…]
#
#  --mode app      (recommandé) : le logiciel est servi par VOTRE serveur ; les données
#                  restent dans la base en ligne actuelle (Supabase, hébergée en Europe).
#  --mode complet  : le logiciel ET la base de données tournent sur votre serveur
#                  (Supabase auto-hébergé). Plus d'autonomie, plus de maintenance.
#
#  Ce script : met le système à jour, active le pare-feu (seuls SSH, HTTP et HTTPS sont
#  ouverts), Fail2ban (blocage des attaques par force brute et des robots), les mises à
#  jour de sécurité automatiques, durcit SSH et le noyau, installe Docker et Caddy
#  (HTTPS automatique Let's Encrypt, en-têtes de sécurité stricts), programme les
#  sauvegardes chiffrées quotidiennes et la mise à jour automatique du logiciel.
#  Il peut être relancé sans risque (idempotent).
# =====================================================================================
set -euo pipefail
DOMAINE=""; EMAIL=""; MODE="app"; SOURCE="https://github.com/wwrwd5wym8-afk/Speedcompta.git"; GVERIF=""; BRANCHE="main"
while [ $# -gt 0 ]; do case "$1" in
  --domaine) DOMAINE="$2"; shift 2;; --email) EMAIL="$2"; shift 2;; --mode) MODE="$2"; shift 2;;
  --source) SOURCE="$2"; shift 2;; --branche) BRANCHE="$2"; shift 2;; --google-verification) GVERIF="$2"; shift 2;;
  -h|--help) sed -n '2,25p' "$0"; exit 0;; *) echo "Option inconnue : $1"; exit 1;; esac; done
B="\033[1m"; V="\033[32m"; R="\033[31m"; J="\033[33m"; N="\033[0m"
etape() { echo -e "\n${B}▶ $*${N}"; }
ok() { echo -e "  ${V}✓${N} $*"; }
attention() { echo -e "  ${J}!${N} $*"; }
erreur() { echo -e "${R}✗ $*${N}"; exit 1; }
[ "$(id -u)" -eq 0 ] || erreur "Lancez ce script en root (sudo bash install.sh …)."
[ -n "$DOMAINE" ] || erreur "Indiquez le domaine : --domaine compta.mondomaine.fr"
[ -n "$EMAIL" ] || erreur "Indiquez un e-mail (certificats HTTPS) : --email vous@domaine.fr"
[[ "$MODE" =~ ^(app|complet)$ ]] || erreur "--mode doit valoir app ou complet"
. /etc/os-release || true
case "${ID:-}" in ubuntu|debian) ;; *) attention "Système non testé (${PRETTY_NAME:-inconnu}) : Ubuntu 24.04 ou Debian 12 recommandés.";; esac
D=/opt/speedix; mkdir -p $D/{bin,config/js,caddy/data,caddy/config,logs} /var/backups/speedix
chmod 700 /var/backups/speedix

etape "1/9 Mise à jour du système et outils"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get -y -qq upgrade
apt-get -y -qq install ca-certificates curl git ufw fail2ban unattended-upgrades apt-listchanges openssl jq gzip cron python3 >/dev/null
ok "Système à jour"

etape "2/9 Mises à jour de sécurité automatiques"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<C
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
C
sed -i 's|^//\s*Unattended-Upgrade::Automatic-Reboot "false";|Unattended-Upgrade::Automatic-Reboot "true";|; s|^//\s*Unattended-Upgrade::Automatic-Reboot-Time "02:00";|Unattended-Upgrade::Automatic-Reboot-Time "04:30";|' /etc/apt/apt.conf.d/50unattended-upgrades || true
ok "Correctifs de sécurité installés chaque nuit (redémarrage automatique à 4h30 si nécessaire)"

etape "3/9 Pare-feu (UFW)"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null; ufw default allow outgoing >/dev/null
SSHP=$(ss -tlnp 2>/dev/null | awk '/sshd/ {split($4,a,":"); print a[length(a)]; exit}'); SSHP=${SSHP:-22}
ufw limit "${SSHP}/tcp" >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null
ok "Seuls SSH (port $SSHP, limité), HTTP et HTTPS sont ouverts"

etape "4/9 Durcissement SSH et noyau"
KEYS=0; for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do [ -s "$f" ] && KEYS=1; done
mkdir -p /etc/ssh/sshd_config.d
if [ "$KEYS" = 1 ]; then
  cat > /etc/ssh/sshd_config.d/90-speedix.conf <<C
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowAgentForwarding no
C
  (systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true)
  ok "Connexion SSH par clé uniquement (mots de passe désactivés)"
else
  attention "Aucune clé SSH trouvée : les mots de passe SSH restent autorisés. Ajoutez une clé puis relancez le script pour les désactiver."
fi
cat > /etc/sysctl.d/90-speedix.conf <<C
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
fs.protected_symlinks = 1
fs.protected_hardlinks = 1
C
sysctl -q --system || true
ok "Protections réseau du noyau activées (SYN flood, usurpation d'adresse…)"

etape "5/9 Docker"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh >/dev/null; fi
systemctl enable --now docker >/dev/null
mkdir -p /etc/docker; [ -f /etc/docker/daemon.json ] || echo '{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"},"no-new-privileges":true}' > /etc/docker/daemon.json
systemctl restart docker
ok "Docker $(docker --version | awk '{print $3}' | tr -d ,) installé"

etape "6/9 Logiciel Speedix"
if [ -d $D/app/.git ]; then git -C $D/app fetch -q --depth 1 origin "$BRANCHE" && git -C $D/app reset -q --hard "origin/$BRANCHE"; else git clone -q --depth 1 -b "$BRANCHE" "$SOURCE" $D/app; fi
rm -rf $D/app/.git/hooks/* || true
ok "Version $(cat $D/app/version.txt 2>/dev/null || echo ?) téléchargée depuis $SOURCE"
cp $D/app/hebergement/sauvegarde.sh $D/app/hebergement/restaurer.sh $D/app/hebergement/maj.sh $D/bin/ 2>/dev/null || true
cp $D/app/hebergement/speedix /usr/local/bin/speedix 2>/dev/null || true
chmod +x $D/bin/*.sh /usr/local/bin/speedix 2>/dev/null || true
echo "MODE=$MODE
DOMAINE=$DOMAINE
EMAIL=$EMAIL
SOURCE=$SOURCE
BRANCHE=$BRANCHE" > $D/speedix.conf; chmod 600 $D/speedix.conf

API_LINE=""
if [ "$MODE" = "complet" ]; then
  etape "6b/9 Base de données autonome (Supabase auto-hébergé)"
  [ -d $D/supabase ] || { git clone -q --depth 1 https://github.com/supabase/supabase /tmp/supabase-src && cp -r /tmp/supabase-src/docker $D/supabase && rm -rf /tmp/supabase-src; }
  cd $D/supabase; [ -f .env ] || cp .env.example .env
  b64u() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
  rnd() { openssl rand -hex "${1:-24}"; }
  setenv() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }
  if ! grep -q "^# speedix-genere" .env; then
    JWT=$(rnd 32); NOW=$(date +%s); EXP=$((NOW + 315360000)); H=$(printf '{"alg":"HS256","typ":"JWT"}' | b64u)
    jwt() { local P; P=$(printf '{"role":"%s","iss":"supabase","iat":%s,"exp":%s}' "$1" "$NOW" "$EXP" | b64u); printf '%s.%s.%s' "$H" "$P" "$(printf '%s.%s' "$H" "$P" | openssl dgst -sha256 -hmac "$JWT" -binary | b64u)"; }
    setenv POSTGRES_PASSWORD "$(rnd 24)"; setenv JWT_SECRET "$JWT"; setenv ANON_KEY "$(jwt anon)"; setenv SERVICE_ROLE_KEY "$(jwt service_role)"
    setenv DASHBOARD_USERNAME "speedix"; setenv DASHBOARD_PASSWORD "$(rnd 16)"; setenv SECRET_KEY_BASE "$(rnd 32)"; setenv VAULT_ENC_KEY "$(rnd 16)"; setenv PG_META_CRYPTO_KEY "$(rnd 16)"
    setenv LOGFLARE_PUBLIC_ACCESS_TOKEN "$(rnd 24)"; setenv LOGFLARE_PRIVATE_ACCESS_TOKEN "$(rnd 24)"; setenv POOLER_TENANT_ID "speedix"
    echo "# speedix-genere $(date -I)" >> .env
  fi
  setenv SITE_URL "https://$DOMAINE"; setenv API_EXTERNAL_URL "https://api.$DOMAINE"; setenv SUPABASE_PUBLIC_URL "https://api.$DOMAINE"; setenv ADDITIONAL_REDIRECT_URLS "https://$DOMAINE"
  setenv KONG_HTTP_PORT "127.0.0.1:8000"; setenv KONG_HTTPS_PORT "127.0.0.1:8443"; setenv POSTGRES_PORT "127.0.0.1:5432"; setenv POOLER_PROXY_PORT_TRANSACTION "127.0.0.1:6543"
  chmod 600 .env
  docker compose pull -q && docker compose up -d
  echo -n "  Démarrage de la base"; for i in $(seq 1 60); do docker exec supabase-db pg_isready -U postgres >/dev/null 2>&1 && break; echo -n "."; sleep 3; done; echo
  if [ -f $D/app/hebergement/supabase_setup.sql ] && [ ! -f $D/.schema-ok ]; then docker exec -i supabase-db psql -q -U postgres -d postgres < $D/app/hebergement/supabase_setup.sql && touch $D/.schema-ok && ok "Tables et règles de sécurité (RLS) de Speedix créées"; fi
  ANON=$(grep ^ANON_KEY= .env | cut -d= -f2-)
  echo "window.SC_CLOUD = {\"url\":\"https://api.$DOMAINE\",\"key\":\"$ANON\"};" > $D/config/js/sc_config.js
  API_LINE="api.$DOMAINE {
	encode zstd gzip
	reverse_proxy 127.0.0.1:8000
	header {
		Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\"
		X-Content-Type-Options nosniff
		-Server
	}
	log {
		output file /logs/api.log {
			roll_size 20mb
			roll_keep 10
		}
		format json
	}
}"
  ok "Base de données démarrée (ports internes uniquement, non exposés sur Internet)"
  attention "Identifiants du tableau de bord de la base : $D/supabase/.env (DASHBOARD_USERNAME / DASHBOARD_PASSWORD) – à conserver en lieu sûr"
  cd /
fi

etape "7/9 Serveur web Caddy (HTTPS automatique et en-têtes de sécurité)"
CSP="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' blob: data: https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com; worker-src 'self' blob: https://cdnjs.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self' https:; frame-ancestors 'none'; upgrade-insecure-requests"
GLINE=""; if [ -n "$GVERIF" ]; then GLINE="	handle /$GVERIF {
		respond \"google-site-verification: $GVERIF\" 200
	}"; fi
cat > $D/Caddyfile <<C
{
	email $EMAIL
	servers {
		protocols h1 h2 h3
	}
}
www.$DOMAINE {
	redir https://$DOMAINE{uri} permanent
}
$DOMAINE {
	encode zstd gzip
	log {
		output file /logs/access.log {
			roll_size 20mb
			roll_keep 10
		}
		format json
	}
	header {
		Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
		Permissions-Policy "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()"
		Cross-Origin-Opener-Policy same-origin
		Content-Security-Policy "$CSP"
		-Server
	}
	@caches path /index.html / /version.txt /sw.js /manifest.webmanifest
	header @caches Cache-Control "no-cache"
	@cachejs path /js/* /styles.css /*.png
	header @cachejs Cache-Control "public, max-age=3600"
	@interdit path /.git* /.git/* /hebergement/*.conf /*.env /.env* /.ht* /*.sql /hebergement/*.sql
	handle @interdit {
		respond 404
	}
$GLINE
	handle /robots.txt {
		respond <<TXT
			User-agent: *
			Allow: /\$
			Disallow: /js/
			Disallow: /hebergement/
			TXT 200
	}
	@cfg file {
		root /speedixcfg
		try_files {path}
	}
	handle @cfg {
		root * /speedixcfg
		file_server
	}
	handle {
		root * /srv/app
		try_files {path} /index.html
		file_server
	}
}
$API_LINE
C
cat > $D/docker-compose.yml <<C
services:
  caddy:
    image: caddy:2
    container_name: speedix-web
    restart: unless-stopped
    network_mode: host
    cap_drop: [ALL]
    cap_add: [NET_BIND_SERVICE]
    security_opt: ["no-new-privileges:true"]
    read_only: true
    tmpfs: [/tmp]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./app:/srv/app:ro
      - ./config:/speedixcfg:ro
      - ./caddy/data:/data
      - ./caddy/config:/config
      - ./logs:/logs
C
cd $D && docker compose run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/caddy-validate.log 2>&1 || { cat /tmp/caddy-validate.log | tail -5; erreur "Configuration Caddy invalide ($D/Caddyfile)"; }; cd /
cd $D && docker compose up -d --remove-orphans >/dev/null && cd /
ok "Site servi en HTTPS sur https://$DOMAINE (certificat Let's Encrypt renouvelé automatiquement)"

etape "8/9 Fail2ban (blocage automatique des attaques)"
cat > /etc/fail2ban/filter.d/speedix-web.conf <<'C'
[Definition]
failregex = ^.*"remote_ip":"<HOST>".*"status":(400|401|403|404|405|444)\b
ignoreregex =
datepattern = "ts":{EPOCH}
C
cat > /etc/fail2ban/jail.d/speedix.conf <<C
[DEFAULT]
bantime = 1h
bantime.increment = true
bantime.maxtime = 1w
findtime = 10m
backend = auto
banaction = ufw

[sshd]
enabled = true
port = $SSHP
maxretry = 4

[speedix-web]
enabled = true
port = http,https
filter = speedix-web
logpath = $D/logs/access.log
maxretry = 80
findtime = 2m
C
touch $D/logs/access.log
systemctl enable --now fail2ban >/dev/null; systemctl restart fail2ban
ok "Force brute SSH et robots d'analyse bannis automatiquement (durée croissante jusqu'à 1 semaine)"

etape "9/9 Sauvegardes chiffrées et mises à jour automatiques"
[ -f /root/.speedix-backup.key ] || { openssl rand -base64 48 > /root/.speedix-backup.key; chmod 400 /root/.speedix-backup.key; }
cat > /etc/cron.d/speedix <<C
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 3 * * * root $D/bin/sauvegarde.sh >> /var/log/speedix-sauvegarde.log 2>&1
*/30 * * * * root $D/bin/maj.sh >> /var/log/speedix-maj.log 2>&1
C
chmod 644 /etc/cron.d/speedix
ok "Sauvegarde chiffrée (AES-256) chaque nuit à 3h15, conservée 30 jours dans /var/backups/speedix"
ok "Logiciel mis à jour automatiquement toutes les 30 minutes"
attention "CLÉ DE SAUVEGARDE : /root/.speedix-backup.key – copiez-la hors du serveur (sans elle, les sauvegardes sont illisibles)"

IP=$(curl -fsS4 --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "\n${V}${B}Installation terminée.${N}"
echo -e "  Adresse du logiciel : ${B}https://$DOMAINE${N}"
echo -e "  Adresse IP du serveur : $IP  → enregistrements DNS : A  $DOMAINE  → $IP   (et www.$DOMAINE)${MODE:+}"
[ "$MODE" = "complet" ] && echo -e "                                          A  api.$DOMAINE → $IP"
echo -e "  Commandes utiles : ${B}speedix etat${N} · speedix sauvegarde · speedix maj · speedix journal · speedix bannis"
echo -e "  Si le certificat HTTPS n'est pas encore obtenu, vérifiez le DNS puis : speedix redemarrer"
