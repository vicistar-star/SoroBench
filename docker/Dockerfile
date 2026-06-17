# Stage 1: Rust Builder
FROM rust:1.75-slim as rust-builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev
RUN rustup target add wasm32-unknown-unknown
COPY packages/rust-harness ./packages/rust-harness
RUN cd packages/rust-harness && cargo build --release

# Stage 2: Node Runner
FROM node:20-slim
WORKDIR /app

# Install system dependencies for better-sqlite3 and other potential native modules
RUN apt-get update && apt-get install -y python3 make g++ 

# Copy workspace configuration
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig*.json ./

# Copy package manifests
COPY packages/cli/package.json ./packages/cli/
COPY packages/runner/package.json ./packages/runner/
COPY packages/storage/package.json ./packages/storage/
COPY packages/flamegraph/package.json ./packages/flamegraph/
COPY packages/dashboard/package.json ./packages/dashboard/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages ./packages
COPY --from=rust-builder /app/packages/rust-harness/target ./packages/rust-harness/target

# Build all packages
RUN npm run build

# Link CLI
RUN npm link packages/cli

# Default environment
ENV NODE_ENV=production
ENV SOROBENCH_CONFIG=/app/sorobench.config.json

ENTRYPOINT ["sorobench"]
CMD ["run"]
