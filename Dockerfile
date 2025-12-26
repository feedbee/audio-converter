FROM node:18-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory for code
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Make the CLI executable
RUN chmod +x cli.js && ln -s /app/cli.js /usr/local/bin/audio-converter

# Data directory for mounting
WORKDIR /data

# Default command
ENTRYPOINT ["node", "/app/cli.js"]