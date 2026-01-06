# Multi-stage build for Pluto React Frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --silent && npm cache clean --force

# Copy source code and build files
COPY . .

# Build the React application
RUN npm run build

# Production stage with nginx for Pluto Frontend
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling and wget for health checks
RUN apk add --no-cache dumb-init wget

# Copy custom nginx configuration for React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create nginx user for security
RUN addgroup -g 1001 -S nginx-group && adduser -S nginx-user -u 1001 -G nginx-group

# Set permissions
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
