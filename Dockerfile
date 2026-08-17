# Stage 1: Build the static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Pass build-time environment variables
ARG VITE_APP_BASE_PATH
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH

ARG VITE_ROUTER_BASENAME
ENV VITE_ROUTER_BASENAME=$VITE_ROUTER_BASENAME

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve the built static assets with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
