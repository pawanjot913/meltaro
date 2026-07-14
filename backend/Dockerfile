# ── Stage 1: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so Docker can cache the npm install layer
# separately from source changes
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S meltaro && adduser -S meltaro -G meltaro

WORKDIR /app

# Copy only what's needed to run (no devDependencies, no source files)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create logs directory owned by the app user
RUN mkdir -p logs && chown -R meltaro:meltaro /app

USER meltaro

EXPOSE 5000

# Graceful shutdown support: use exec form so signals reach Node directly
# (not wrapped by a shell that ignores them)
CMD ["node", "dist/server.js"]
