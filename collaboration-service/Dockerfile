# Dockerfile for backend services (user-service, question-service, matching-service, collaboration-service)
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the ports
EXPOSE 8082

# Start the application
CMD sh -c 'echo "SUPABASE_URL=$SUPABASE_URL" > .env && echo "SUPABASE_KEY=$SUPABASE_KEY" >> .env && echo "JWT_SECRET=$JWT_SECRET" >> .env && echo "USER_SERVICE_URL=$USER_SERVICE_URL" >> .env && npm run dev'