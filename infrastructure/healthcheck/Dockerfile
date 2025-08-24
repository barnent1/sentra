FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S healthcheck -u 1001

# Change ownership
RUN chown -R healthcheck:nodejs /app
USER healthcheck

EXPOSE 8080

CMD ["node", "index.js"]