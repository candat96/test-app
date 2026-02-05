FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install --production
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Expose port
EXPOSE 3001

# Set timezone to Vietnam
ENV TZ=Asia/Ho_Chi_Minh

# Start server
CMD ["node", "server/index.js"]
