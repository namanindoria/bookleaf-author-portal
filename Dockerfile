# Multi-stage Dockerfile for BookLeaf Author Support Portal
# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Runtime Server
FROM node:22-alpine
WORKDIR /app

# Copy server package and install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy built frontend assets to server public directory for single-container serving if needed
COPY --from=client-builder /app/client/dist /app/server/public

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
