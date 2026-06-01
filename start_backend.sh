#!/bin/bash
# EcoSortAI — start backend + PWA server
# Usage: ./start_backend.sh          (HTTP — desktop/Android Chrome)
#        ./start_backend.sh --ssl    (HTTPS — required for iPhone camera)

PROJECT="$(cd "$(dirname "$0")" && pwd)"
VENV="$PROJECT/.venv/bin/python"
APP="$PROJECT/app"
LOG="$PROJECT/backend_server.log"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║        EcoSortAI Backend             ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── Check model ──────────────────────────────────────────────────────────────
if [ ! -f "$APP/saved_model/best_model.pth" ]; then
  echo "  ⚠️  Model not found: app/saved_model/best_model.pth"
  echo "  Run notebook Section 18 to train and export the model."
  echo "  Backend will start but /predict will return an error until model is placed."
  echo ""
fi

# ── SSL mode ──────────────────────────────────────────────────────────────────
SSL_FLAGS=""
if [ "$1" = "--ssl" ]; then
  CERT="$APP/cert/cert.pem"
  KEY="$APP/cert/key.pem"
  if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
    echo "  🔐 Generating self-signed certificate for $IP ..."
    cd "$APP" && "$VENV" gen_cert.py "$IP"
    echo ""
  fi
  SSL_FLAGS="--ssl-keyfile cert/key.pem --ssl-certfile cert/cert.pem"
  PROTO="https"
else
  PROTO="http"
fi

# ── Print access URLs ──────────────────────────────────────────────────────────
echo "  🌐 Open in browser:"
echo "     $PROTO://localhost:8000"
if [ -n "$IP" ] && [ "$IP" != "unknown" ]; then
  echo "     $PROTO://$IP:8000  ← use this on your phone"
fi
if [ "$1" != "--ssl" ]; then
  echo ""
  echo "  📱 For iPhone (camera requires HTTPS):"
  echo "     ./start_backend.sh --ssl"
fi
echo ""
echo "  Stop: Ctrl+C   |   Log: backend_server.log"
echo ""

# ── Start uvicorn ──────────────────────────────────────────────────────────────
cd "$APP" && "$VENV" -m uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  $SSL_FLAGS \
  2>&1 | tee "$LOG"
