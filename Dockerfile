# TapLock - Passkey-powered secret manager
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./

# Copy workspace package files
COPY frontend/package*.json ./frontend/
COPY worker/package*.json ./worker/

# Install all workspace dependencies
RUN npm install

# Copy source code
COPY frontend/ ./frontend/
COPY worker/ ./worker/

# Build frontend using workspace syntax (outputs to /app/public)
RUN npm run build -w frontend

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install build dependencies for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Copy only worker package files (no workspace structure)
COPY worker/package*.json ./

# Install production dependencies directly at /app/node_modules
# Don't use --ignore-scripts because better-sqlite3 needs to compile
RUN npm install --omit=dev

# Install tsx globally for running TypeScript directly
RUN npm install -g tsx

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
