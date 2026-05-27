# Use a lightweight Node Alpine image
FROM node:18-alpine

# Install traceroute (required for the backend to trace hops)
RUN apk update && apk add --no-cache traceroute

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend source code
COPY . .

# Expose the application port
EXPOSE 3001

# Start the Express server
CMD ["node", "index.js"]
