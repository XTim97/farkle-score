# farkle.live deployment

Public hosting for Farkle Score on one small VM (a $6 DigitalOcean basic droplet is
plenty). DNS lives at the registrar (GoDaddy) pointing straight at the droplet;
Caddy terminates TLS with Let's Encrypt. There is no release process: deploys build
whatever the latest commit of `feature/big-updates` is.

```
browser -> Caddy (Let's Encrypt, on the droplet) -> app container -> SQLite
```

Optional later upgrade: move the domain's nameservers to Cloudflare's free tier for
WAF/rate limiting and origin-IP hiding. Nothing here needs to change for that
beyond setting Cloudflare SSL to Full (strict).

## One-time setup

1. **Droplet**: Ubuntu 24.04, 1GB. Note its public IP.
2. **DNS (GoDaddy)**: `A` record for `@` and for `www` pointing at the droplet IP,
   low TTL (600).
3. **On the droplet** (as root):

   ```bash
   ACME_EMAIL=<your email> bash <(curl -fsSL https://raw.githubusercontent.com/XTim97/farkle-score/feature/big-updates/deploy/farkle-live/setup-droplet.sh)
   ```

   This installs Docker, ufw (22 rate-limited, 80/443 open), unattended-upgrades,
   clones the branch to `/srv/farkle/repo`, sets up the nightly SQLite backup cron,
   and starts the stack.
4. **Optional hardening** once Tailscale is on the droplet: close public SSH
   (`ufw delete limit 22/tcp; ufw allow in on tailscale0 to any port 22`) and
   restrict 80/443 to Cloudflare's published IP ranges so nobody can bypass the proxy.

## Deploying updates

Push to `feature/big-updates`, then:

```bash
ssh root@<droplet> /srv/farkle/repo/deploy/farkle-live/deploy.sh
```

The script fetches the branch, hard-resets to origin, rebuilds the image, and
restarts the stack. Viewers' PWAs pick up the new build automatically (autoUpdate
service worker).

## Backups

`backup.sh` runs nightly via cron, writing dated copies to `/srv/farkle/backups`
(14-day retention). To also keep an off-VM copy, pull that directory from another
machine on whatever schedule you like, e.g. a nightly `rsync` job from a box that is
already part of your backup rotation.

Restore: stop the stack, copy a backup over `/srv/farkle/data/farkle.db`, start.

## Security posture, honestly

- No auth by design. Anyone can hit the app and create players/games; live-session
  codes are unguessable and expire after 24h idle. Worst case is junk rows in
  SQLite; the nightly backups make that recoverable, Cloudflare rate limits make it
  boring to automate.
- If it ever matters, the lean next step is a single shared PIN checked by the
  server for state-changing routes. Do not build accounts for this.
