# ─── build frontend ─────────────────────
FROM node:24.1.0-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .

# ─── build + run backend ─────────────────
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# bring in the already-installed frontend
COPY --from=frontend /app/frontend /app/frontend
COPY . .

EXPOSE 8000 3000
ENV PORT=3000

CMD ["/bin/sh", "/app/start.sh"]
