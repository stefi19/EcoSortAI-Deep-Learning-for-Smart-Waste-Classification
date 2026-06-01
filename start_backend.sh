#!/bin/bash
# EcoSortAI — pornește backend-ul FastAPI
# Dublu-click pe acest fișier sau rulează: ./start_backend.sh

PROJECT="$(cd "$(dirname "$0")" && pwd)"
VENV="$PROJECT/.venv/bin/python"
BACKEND="$PROJECT/backend"
LOG="$PROJECT/backend_server.log"

# Verifică dacă există modelul
if [ ! -f "$BACKEND/saved_model/best_model.pth" ]; then
  echo ""
  echo "  ⚠️  ATENȚIE: best_model.pth lipsește."
  echo "  Rulează notebook-ul (Section 18) ca să-l generezi."
  echo "  Calea necesară: backend/saved_model/best_model.pth"
  echo ""
  # Nu oprire — backend-ul returnează JSON de eroare fără model
fi

# Detectează IP-ul curent
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -n "$IP" ]; then
  echo ""
  echo "  📱 IP-ul tău local: $IP"
  echo "  Asigură-te că în mobile_app/src/utils/api.js ai:"
  echo "  const API_URL = \"http://$IP:8000/predict\";"
  echo ""
fi

echo "  🚀 Pornire EcoSortAI backend pe portul 8000..."
echo "  Log: $LOG"
echo "  Stop: Ctrl+C"
echo ""

# Pornește uvicorn
cd "$BACKEND" && "$VENV" -m uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  2>&1 | tee "$LOG"
