# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

# Build frontend
COPY frontend/ ./
RUN npm run build

# =============================================================================
# Stage 2: Build Backend
# =============================================================================
FROM node:20-alpine AS backend-builder

WORKDIR /build/worker

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies (including better-sqlite3 compilation)
COPY worker/package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy backend source
COPY worker/ ./

# Build TypeScript for Node.js
RUN npm run build:node

# Cleanup build dependencies
RUN apk del python3 make g++

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:20-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini

WORKDIR /app

# Copy backend build & dependencies
COPY --from=backend-builder /build/worker/dist ./dist
COPY --from=backend-builder /build/worker/drizzle ./drizzle
COPY --from=backend-builder /build/worker/node_modules ./node_modules
COPY --from=backend-builder /build/worker/package.json ./package.json

# Copy frontend build
COPY --from=frontend-builder /build/frontend/dist ./public

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root user
USER node

# Environment defaults
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/dssm.db \
    PUBLIC_DIR=/app/public

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/node-server.js"]
