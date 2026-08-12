# Single-container packaging for the gemini-icon-gen browser demo.
#
# Stage 1 builds the Vite frontend (needs devDependencies); stage 2 is a
# slim runtime that serves the built assets and runs the Bun server, which
# executes the package's TypeScript source directly.

# ---- Build stage: install all deps and build the demo frontend ----
FROM oven/bun:1.3 AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the sources the build (and runtime) need, then build demo/dist.
COPY tsconfig.json tsup.config.ts ./
COPY src ./src
COPY assets ./assets
COPY demo ./demo
RUN bun run demo:build

# ---- Runtime stage: slim image that serves the built demo ----
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DEMO_PORT=3000

# Carry over installed deps and the built app from the build stage.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/src ./src
COPY --from=build /app/assets ./assets
COPY --from=build /app/demo ./demo

# GEMINI_API_KEY must be provided at run time (never bake it into the image):
#   docker run --rm -p 3000:3000 -e GEMINI_API_KEY=... gemini-icon-gen-demo
EXPOSE 3000
CMD ["bun", "run", "demo:start"]
