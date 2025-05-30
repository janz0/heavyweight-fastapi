# ─── build frontend ─────────────────────
FROM node:24.1.0-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .

# ─── runtime ───────────────────────────
FROM node:24.1.0-slim
WORKDIR /app

# 1) Install Python & pip
RUN apt-get update && apt-get install -y python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# 2) Install Python deps
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# 3) Copy in app code
COPY --from=frontend /app/frontend /app/frontend
COPY . .

EXPOSE 8000 3000
ENV PORT=3000

CMD ["/bin/sh", "/app/start.sh"]
