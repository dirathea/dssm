# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY worker/package*.json ./worker/

# Install all dependencies
RUN npm run install:all

# Copy source code
COPY frontend/ ./frontend/
COPY worker/ ./worker/

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only for worker
COPY worker/package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/worker/public ./public

# Copy worker source (will be run with tsx)
COPY worker/src ./src
COPY worker/tsconfig.json ./

# Copy drizzle migrations
COPY worker/drizzle ./drizzle

# Create data directory for SQLite
RUN mkdir -p /app/data

# Install tsx for running TypeScript directly
RUN npm install tsx

# Environment variables (can be overridden)
ENV PORT=8787
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/dssm.db
ENV JWT_SECRET=change-this-in-production
ENV RP_ID=localhost
ENV RP_NAME="Dead Simple Secret Manager"

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/api/health || exit 1

# Run the server
CMD ["npx", "tsx", "src/server.ts"]
