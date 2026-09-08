# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json ./
RUN npm install --omit=dev

# --- Production stage ---
FROM node:20-alpine
LABEL maintainer="university-noticeboard"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder /build/node_modules ./node_modules
COPY . .

USER appuser
EXPOSE 3001

CMD ["node", "src/index.js"]
