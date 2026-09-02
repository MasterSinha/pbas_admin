# Stage 1: Build the static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The app is served under /panel/ (see nginx.conf), matching the same URL
# convention used when this UI is embedded behind FastAPI. Override at build
# time only if you truly want a root-hosted standalone deploy.
ARG VITE_APP_BASE_PATH=/panel/
ARG VITE_ROUTER_BASENAME=/panel
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH
ENV VITE_ROUTER_BASENAME=$VITE_ROUTER_BASENAME
RUN npm run build

# Stage 2: Serve the built static assets with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/panel
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
