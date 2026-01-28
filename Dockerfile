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
COPY packages/examples/package.json ./packages/examples/
COPY tests/e2e-polkadot-js/package.json ./tests/e2e-polkadot-js/

# Install dependencies (ignore scripts as chroma isn't built yet)
RUN bun install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the Chroma package
RUN cd packages/chroma && bun run build

# Re-run install to link the chroma CLI bin after build
RUN bun install

# Download wallet extensions for e2e tests
RUN cd tests/e2e-polkadot-js && bun run test:prepare

# Set working directory to e2e-polkadot-js test folder
WORKDIR /app/tests/e2e-polkadot-js

# Default command to run tests with xvfb for headless browser
CMD ["sh", "-c", "xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' -- npx playwright test --reporter=html"]
