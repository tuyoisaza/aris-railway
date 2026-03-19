# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build Client
WORKDIR /app/client
RUN npm run build

# Build Server
WORKDIR /app/server
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm install --production

# Copy built server artifacts
COPY --from=builder /app/server/dist ./dist

# Copy built client artifacts to public/dist (or where server serves them)
# Assuming server serves static files from ../client/dist or public
COPY --from=builder /app/client/dist ./public

# Setup Environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose Port
EXPOSE 8080

# Start Command
CMD ["node", "dist/index.js"]
