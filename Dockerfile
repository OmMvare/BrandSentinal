# Brand Sentinel Production Dockerfile
# Multi-stage build for optimal image size and security

# Stage 1: Build & Compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install native build tools required for better-sqlite3 compilation on Alpine
RUN apk add --no-cache python3 make g++

# Copy package manifests across root and workspaces for layer caching
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all workspace dependencies (includes typescript, tsx, vite, etc.)
RUN npm ci

# Copy full project source
COPY . .

# Build both server and client (compiles TypeScript to JavaScript)
RUN npm run build

# Seed baseline enterprise truth database
RUN npm run seed

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root manifests and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy server artifacts and compiled JavaScript
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/db/schema.sql ./server/src/db/schema.sql
COPY --from=builder /app/schema.sql ./schema.sql

# Copy built frontend SPA assets for production static serving
COPY --from=builder /app/client/package*.json ./client/
COPY --from=builder /app/client/dist ./client/dist

# Copy pre-seeded enterprise database for persistent volume initialization
COPY --from=builder /app/server/brand_sentinel.db* ./server/
COPY --from=builder /app/server/brand_sentinel.db* ./

# Ensure upload directory exists
RUN mkdir -p /app/uploads

EXPOSE 5000

# Run compiled JavaScript entrypoint
CMD ["node", "server/dist/index.js"]
