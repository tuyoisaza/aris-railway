# ============================
# Build stage (frontend)
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./

ARG VITE_STRIPE_PRICE_PLUS
ENV VITE_STRIPE_PRICE_PLUS=$VITE_STRIPE_PRICE_PLUS

RUN npm run build


# ============================
# Prisma generate stage
# ============================
FROM node:20-alpine AS prisma

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY server/prisma ./prisma/

RUN npx prisma generate


# ============================
# Runtime stage (server)
# ============================
FROM node:20-alpine

WORKDIR /app/server

RUN apk add --no-cache openssl

COPY server/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY server/ ./

COPY --from=builder /app/dist ./public
COPY --from=prisma /app/server/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/server/data/aris.db"

RUN mkdir -p /app/server/data && \
    touch /app/server/data/aris.db && \
    chmod 777 /app/server/data/aris.db

EXPOSE 3000

CMD ["node", "index.js"]
