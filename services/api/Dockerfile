FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/api/package*.json ./
RUN npm ci --only=production

# Copy built API code
COPY packages/api/dist ./dist
COPY packages/api/src ./src

# Copy shared types
COPY packages/types ./node_modules/@sentra/types

EXPOSE 8000

CMD ["npm", "start"]