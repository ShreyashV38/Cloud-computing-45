FROM nginx:1.27-alpine
LABEL maintainer="university-noticeboard"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy our static files and nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js     /usr/share/nginx/html/

EXPOSE 80
