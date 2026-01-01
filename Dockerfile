# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build:backend

# Stage 3: Runtime (slim image with Node + Python + yt-dlp + ffmpeg)
FROM node:20-alpine

# Install Python, pip, ffmpeg, and other essentials
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp via pip (latest version)
RUN pip3 install --no-cache-dir yt-dlp

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist-frontend ./dist-frontend

# Expose port (Railway uses $PORT)
EXPOSE 3000

# Start command
CMD ["npm", "start"]

