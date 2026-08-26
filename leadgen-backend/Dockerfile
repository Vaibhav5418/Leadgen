# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install dependencies needed for build (if any)
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
