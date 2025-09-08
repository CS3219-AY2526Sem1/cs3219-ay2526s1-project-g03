# Dockerfile for backend services (user-service, question-service, matching-service, collaboration-service)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port (will be overridden by docker-compose for each service)
EXPOSE 8082

# Start the application
CMD ["npm", "run", "dev"]