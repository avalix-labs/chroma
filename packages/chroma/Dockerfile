# Playwright test runner for Chroma
FROM mcr.microsoft.com/playwright:v1.57.0-noble

# Set working directory
WORKDIR /app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package files first for better caching
COPY package.json bun.lock ./
COPY packages/chroma/package.json ./packages/chroma/

# Install dependencies
RUN bun install

# Copy the rest of the source code
COPY . .

# Build the chroma package
RUN cd packages/chroma && bun run build

# Download wallet extensions
RUN cd packages/chroma && bun run download-extensions

# Set environment
ENV CI=true

# Default command runs Playwright tests
WORKDIR /app/packages/chroma
CMD ["npx", "playwright", "test", "--reporter=html"]

