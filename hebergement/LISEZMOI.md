# Speedix – hébergement autonome et sécurisé

Ce kit installe Speedix sur **votre propre serveur** (VPS), avec votre nom de domaine, en
HTTPS, derrière un pare-feu, avec blocage automatique des attaques, sauvegardes chiffrées et
mises à jour automatiques.

## 1. Louer un serveur
Ubuntu 24.04 LTS (ou Debian 12), 2 vCPU, 4 Go de RAM, 40 Go de disque (mode « app »).
Mode « complet » (base de données sur votre serveur) : 4 vCPU, 8 Go, 80 Go.
Hébergeurs adaptés (données en Europe) : OVHcloud, Scaleway, Infomaniak, Google Cloud
(Compute Engine, région europe-west9 Paris), Hetzner.
Activez la double authentification sur le compte de l'hébergeur et ajoutez votre clé SSH.

## 2. Nom de domaine (DNS)
Chez votre registraire, créez :
- `A  compta.votredomaine.fr  → IP du serveur`
- `A  www.compta.votredomaine.fr → IP du serveur`
- mode complet : `A  api.compta.votredomaine.fr → IP du serveur`

## 3. Installer
Connectez-vous au serveur (`ssh root@IP`), puis :
```
curl -fsSL https://wwrwd5wym8-afk.github.io/Speedcompta/hebergement/install.sh -o install.sh
less install.sh        # relire le script avant de l'exécuter
sudo bash install.sh --domaine compta.votredomaine.fr --email vous@votredomaine.fr --mode app
```
Option Google Search Console (méthode « fichier HTML ») : `--google-verification googleXXXX.html`

## 4. Après l'installation
- Copiez **/root/.speedix-backup.key** hors du serveur (gestionnaire de mots de passe).
- `speedix etat` : état des services, pare-feu, bannissements, dernières sauvegardes.
- `speedix sauvegarde`, `speedix restaurer <fichier>`, `speedix maj`, `speedix journal`, `speedix bannis`.
- Mode complet : créez votre compte dans Speedix, puis `speedix editeur votre@email.fr` pour obtenir les droits d'éditeur. Configurez l'envoi d'e-mails (SMTP) dans /opt/speedix/supabase/.env pour les réinitialisations de mot de passe.
- Sauvegarde hors serveur : installez rclone et créez un « remote » nommé `speedix-externe`.

## Ce qui est mis en place
| Protection | Détail |
|---|---|
| Pare-feu UFW | seuls SSH (limité), HTTP et HTTPS ouverts ; la base n'est jamais exposée |
| Fail2ban | bannissement des attaques SSH et des robots (durée croissante jusqu'à 1 semaine) |
| SSH | connexion par clé uniquement (si une clé est présente), 3 essais maximum |
| Noyau | protections SYN flood, usurpation d'adresse, redirections ICMP |
| HTTPS | Caddy + Let's Encrypt, HTTP/2 et HTTP/3, HSTS 2 ans |
| En-têtes | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| Conteneurs | Caddy en lecture seule, sans privilèges, sans capacités inutiles |
| Mises à jour | correctifs système chaque nuit, logiciel toutes les 30 minutes |
| Sauvegardes | chaque nuit, chiffrées AES-256, conservées 30 jours |

Aucun système n'est invulnérable : gardez les comptes (hébergeur, registraire, GitHub,
Supabase) protégés par double authentification et testez une restauration chaque trimestre.
