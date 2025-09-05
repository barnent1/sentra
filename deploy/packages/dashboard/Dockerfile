# Enhanced Sentra Dashboard with Disler-style Observability
FROM nginx:alpine

# Copy the built Vue.js dashboard
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]