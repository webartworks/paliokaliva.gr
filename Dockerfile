# Build for Coolify (Build Pack: Dockerfile).
# The generated photos are kept on the server between builds, so only new or
# changed photos are generated again.

FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=paliokaliva-pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --package-import-method copy

COPY . .
# Astro keeps its image cache in node_modules/.astro. This folder lives outside
# the image and survives from one build to the next.
RUN --mount=type=cache,id=paliokaliva-astro,target=/app/node_modules/.astro \
    pnpm build


FROM node:22-slim
WORKDIR /app
# curl is used by the Coolify health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server/entry.mjs"]
