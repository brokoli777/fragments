#File for dockerizing the fragments server
# Stage 1: Build
FROM node:20-alpine3.19 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy src to /app/src/
COPY ./src ./src
# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Stage 2: Production
FROM node:20-alpine3.19

LABEL maintainer="Bregwin Jogi <bjogi1@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production
# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

WORKDIR /app

# Copy built artifacts from the build stage
COPY --from=build /app ./

# Set user to node
USER node
COPY --chown=node:node . /usr/src/app

# Start the server
CMD ["node", "src/index.js"]

# We run our service on port 8080
EXPOSE 8080
