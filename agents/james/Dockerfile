FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    docker-cli \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S james -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Change ownership to non-root user
RUN chown -R james:nodejs /app

# Switch to non-root user
USER james

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the agent
CMD ["node", "dist/index.js"]