# Stage 1: Build dependency and source
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source files
COPY . .

# Run production build
RUN npm run build

# Stage 2: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built resources and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
