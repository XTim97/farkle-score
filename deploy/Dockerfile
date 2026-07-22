# Build stage: install everything, build the client bundle.
FROM node:22-slim AS build
# Toolchain for better-sqlite3 when no prebuilt binary is available.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime stage: pruned deps, server source, built client.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 FARKLE_DATA_DIR=/data
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/engine packages/engine
COPY --from=build /app/server server
COPY --from=build /app/client/dist server/client-dist
WORKDIR /app/server
EXPOSE 8787
VOLUME /data
CMD ["npx", "tsx", "src/index.ts"]
