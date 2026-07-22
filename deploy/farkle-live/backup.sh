#!/usr/bin/env bash
# Nightly SQLite backup: dated copy under /srv/farkle/backups, keep 14.
# SQLite is in WAL mode; a plain copy of a quiesced-enough hobby DB is fine,
# but go through the container's sqlite when available for a clean snapshot.
set -euo pipefail

DATA="/srv/farkle/data/farkle.db"
OUT_DIR="/srv/farkle/backups"
mkdir -p "$OUT_DIR"

STAMP=$(date +%F)
if docker exec farkle-score node -e "
  const db = require('better-sqlite3')('/data/farkle.db');
  db.backup('/data/backup-tmp.db').then(() => process.exit(0));
" 2>/dev/null; then
  mv /srv/farkle/data/backup-tmp.db "$OUT_DIR/farkle-$STAMP.db"
else
  cp "$DATA" "$OUT_DIR/farkle-$STAMP.db"
fi

find "$OUT_DIR" -name 'farkle-*.db' -mtime +14 -delete
