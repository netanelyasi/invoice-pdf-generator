# Use the official Node.js image as base
FROM node:18-bullseye-slim

# Install Google Chrome and necessary packages for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxext6 \
    libxfixes3 \
    libnss3 \
    libdrm2 \
    libxss1 \
    libgbm1 \
    libxrandr2 \
    libxss1 \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libatspi2.0-0 \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Chrome for Puppeteer (ensure it's available)
RUN npx puppeteer browsers install chrome

# Copy app source
COPY . .

# Create required directories
RUN mkdir -p public/uploads/logos
RUN mkdir -p database
RUN mkdir -p data
RUN mkdir -p .cache/puppeteer

# Create volumes for persistent data
VOLUME ["/usr/src/app/data", "/usr/src/app/public/uploads"]

# Expose port
EXPOSE 3000

# Add non-root user for Puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app \
    && chmod 755 /usr/src/app/data \
    && chmod 755 /usr/src/app/public/uploads

# Switch to non-root user
USER pptruser

# Start the application
CMD ["node", "server.js"]