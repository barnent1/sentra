FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/core/package*.json ./
RUN npm ci --only=production

# Copy built core code
COPY packages/core/dist ./dist
COPY packages/core/src ./src

# Copy shared types
COPY packages/types ./node_modules/@sentra/types

CMD ["node", "dist/agents/orchestrator-agent.js"]