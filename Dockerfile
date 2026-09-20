FROM node:20-alpine AS base
WORKDIR /app

# Install deps only (layer cached unless package*.json changes)
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build/runtime stage
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY src ./src
COPY server.js ./

# Generate Prisma Client
RUN npx prisma generate && npm prune --omit=dev

EXPOSE 5000

# Graceful startup: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
