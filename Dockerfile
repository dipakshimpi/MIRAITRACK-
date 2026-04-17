# Use a multi-stage build for a smaller final image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Build Arguments (Vite needs these at build time to bake them into the JS)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

# Make them available as ENV for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

# Copy source code and build the project
COPY . .
RUN npm run build

# Runner Stage
FROM node:20-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built assets and server file
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package*.json ./

# Install only production dependencies
# Note: tsx is needed to run the .ts server, so we keep it in the build or install it
RUN npm install --omit=dev && npm install -g tsx

# Expose the application port
EXPOSE 3000

# Start the server
CMD ["tsx", "server.ts"]
