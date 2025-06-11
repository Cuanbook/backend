# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN bun install

# install openssl
RUN apk update && apk upgrade
RUN apk add --no-cache openssl

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "bun", "dev" ] 