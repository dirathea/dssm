# TapLock - Passkey-powered secret manager
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Copy frontend and worker package files
COPY frontend/package*.json ./frontend/
COPY worker/package*.json ./worker/

# Install all dependencies (root, frontend, worker)
RUN npm install && cd frontend && npm install && cd ../worker && npm install

# Copy source code
COPY frontend/ ./frontend/
COPY worker/ ./worker/

# Build frontend (outputs to /app/public)
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy worker package files and install production dependencies
COPY worker/package*.json ./
RUN npm ci --omit=dev

# Install tsx for running TypeScript directly
RUN npm install tsx

# Copy built frontend from builder stage
COPY --from=builder /app/public ./public

# Copy worker source
COPY worker/src ./src
COPY worker/tsconfig.json ./

# Copy drizzle migrations
COPY worker/drizzle ./drizzle

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables (can be overridden)
# Environment variables are set via docker-compose.yml or .env

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/api/health || exit 1

# Run the server
CMD ["npx", "tsx", "src/server.ts"]
