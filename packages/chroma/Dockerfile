# Playwright test runner for Chroma
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Set working directory
WORKDIR /app

# Install unzip (required for Bun installer) and xvfb (for headed browser tests)
RUN apt-get update && apt-get install -y unzip xvfb && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package files first for better caching (all workspaces)
COPY package.json bun.lock ./
COPY packages/chroma/package.json ./packages/chroma/
COPY examples/package.json ./examples/

# Install dependencies (skip prepare scripts to avoid circular dependency)
RUN bun install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the chroma package
RUN cd packages/chroma && bun run build

# Download wallet extensions
RUN cd packages/chroma && bun run download-extensions

# Set environment
ENV CI=true

# Default command runs Playwright tests with xvfb for headed browser support
WORKDIR /app/packages/chroma
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x960x24", "npx", "playwright", "test", "--reporter=html"]

