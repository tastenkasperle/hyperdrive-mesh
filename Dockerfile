FROM node:20-slim

# Arbeitsverzeichnis setzen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci --omit=dev

# Quellcode kopieren
COPY . .

# Unprivileged User nutzen
USER node

# Stdio-Kommunikation unbuffered
ENV NODE_ENV=production

ENTRYPOINT ["node", "src/index.mjs"]
