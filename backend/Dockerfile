FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Run the server
CMD ["node", "dist/server.js"] 