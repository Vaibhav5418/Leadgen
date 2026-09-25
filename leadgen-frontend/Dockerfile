# syntax=docker/dockerfile:1
# ----------------------------------------------------
# Stage 1: Build Frontend Assets
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Set build argument for backend API URL (can be passed during docker build)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy source files and build
COPY . .
RUN npm run build

# ----------------------------------------------------
# Stage 2: Serve with Nginx
# ----------------------------------------------------
FROM nginx:alpine AS runner

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Touch pid file and configure permissions for non-root nginx user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /etc/nginx/conf.d /usr/share/nginx/html

USER nginx

# Expose HTTP port (non-root)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
