FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S mike && \
    adduser -S mike -u 1001

# Create workspace directory
RUN mkdir -p /workspace && chown -R mike:mike /workspace

# Switch to non-root user
USER mike

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]