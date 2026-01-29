# Dockerfile for Chroma E2E Testing
# This image is optimized for running Playwright tests with wallet extensions

FROM mcr.microsoft.com/playwright:v1.58.0-noble

# Set environment variables
ENV CI=true
ENV DEBIAN_FRONTEND=noninteractive

# Install unzip (required for Bun installation)
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./
COPY packages/chroma/package.json ./packages/chroma/
COPY packages/e2e-polkadot-js/package.json ./packages/e2e-polkadot-js/
COPY packages/e2e-evm/package.json ./packages/e2e-evm/

# Install dependencies (ignore scripts as chroma isn't built yet)
RUN bun install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the Chroma package
RUN cd packages/chroma && bun run build

# Re-run install to link the chroma CLI bin after build
RUN bun install

# Set working directory back to app root
WORKDIR /app

# E2E_TARGET env var to specify which e2e package to test (required)
# Examples: polkadot-js, evm, solana (will prepend e2e- automatically)
ENV E2E_TARGET=""

# Default command: prepare and run tests for specified E2E_TARGET
CMD ["sh", "-c", "xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' -- sh -c 'cd /app/packages/e2e-$E2E_TARGET && bun run test:prepare && npx playwright test --reporter=html'"]
