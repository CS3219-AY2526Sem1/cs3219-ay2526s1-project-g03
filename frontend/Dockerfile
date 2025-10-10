FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the development server (--host 0.0.0.0 makes it accessible from outside container )
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]