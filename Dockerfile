# ============================
# Build stage (frontend)
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache optimization)
COPY package*.json ./
RUN npm install

# Copy ONLY frontend source files (explicit paths for performance)
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./

# Pass build arguments for frontend environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ARG VITE_STRIPE_PRICE_PLUS

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV VITE_STRIPE_PRICE_PLUS=$VITE_STRIPE_PRICE_PLUS

RUN npm run build


# ============================
# Runtime stage (server)
# ============================
FROM node:20-alpine

WORKDIR /app/server

# Install server dependencies only
COPY server/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy ALL server source files (safer than explicit picking)
# server/node_modules is excluded via .dockerignore
COPY server/ .

# Copy built frontend into server public folder
COPY --from=builder /app/dist ./public

# Environment
ENV NODE_ENV=production

# Cloud Run provides PORT — do NOT set it here
EXPOSE 3000

# Start the server entrypoint
CMD ["node", "index.js"]
