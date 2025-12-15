# Dockerfile for Chroma E2E Testing
# This image is optimized for running Playwright tests with wallet extensions

FROM mcr.microsoft.com/playwright:v1.57.0-noble

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

# Install dependencies (ignore scripts as chroma isn't built yet)
RUN bun install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the Chroma package
RUN cd packages/chroma && bun run build

# Download wallet extensions
RUN cd packages/chroma && bun run download-extensions

# Set working directory to chroma package
WORKDIR /app/packages/chroma

# Default command to run tests
CMD ["sh", "-c", "xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' -- npx playwright test --reporter=html"]
