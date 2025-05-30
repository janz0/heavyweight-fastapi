#!/usr/bin/env sh
set -e

alembic upgrade head

# fire up FastAPI on 8000
fastapi run --host 0.0.0.0 --port 8000 &

# start the frontend dev server on $PORT (3000)
cd /app/frontend
npm run dev -- --host 0.0.0.0 --port "$PORT"
