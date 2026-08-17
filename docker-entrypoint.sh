#!/bin/sh
set -e

# Set defaults if not provided in environment
VITE_API_BASE_URL=${VITE_API_BASE_URL:-"/api/v1"}
VITE_ROUTER_BASENAME=${VITE_ROUTER_BASENAME:-"/panel"}

# Find any config.js in Nginx webroot and replace it with environment values
CONFIG_PATH="/usr/share/nginx/html/config.js"

echo "Injecting runtime configuration to $CONFIG_PATH..."
cat <<EOF > "$CONFIG_PATH"
window.APP_CONFIG = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_ROUTER_BASENAME: "${VITE_ROUTER_BASENAME}"
};
EOF

# Print final injected configuration for debugging
echo "Injected Configuration:"
cat "$CONFIG_PATH"

# Execute Nginx (the original command passed to docker run)
exec "$@"
