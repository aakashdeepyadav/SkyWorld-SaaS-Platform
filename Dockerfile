# ── Build stage ──────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Production stage ─────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache dumb-init
ENV NODE_ENV=production

WORKDIR /app

# Server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Server source
COPY server/ ./

# Client build output (served statically or via CDN)
COPY --from=build /app/client/dist ./public

# Security: run as non-root
RUN addgroup -S skyworld && adduser -S skyworld -G skyworld
USER skyworld

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["dumb-init", "node", "index.js"]
