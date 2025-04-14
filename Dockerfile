FROM node:22.12-alpine AS builder

# Copy project files
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

# Copy build artifacts and package files
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

# Install production dependencies only
RUN npm install --omit=dev

EXPOSE 8080

# Use the appropriate entrypoint
ENTRYPOINT ["npx", "mcp-proxy", "node", "dist/index.js"]