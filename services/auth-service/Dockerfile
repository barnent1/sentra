FROM node:18-alpine

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sentra -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=sentra:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=sentra:nodejs . .

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Security: Remove unnecessary packages
RUN apk del --no-network --no-cache npm

# Switch to non-root user
USER sentra

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]