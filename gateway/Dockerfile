FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and Nginx
RUN apt-get update && apt-get install -y curl nginx
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Setup Nginx
RUN rm -rf /var/www/html/*
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/index.html /var/www/html/
COPY frontend/styles.css /var/www/html/
COPY frontend/app.js     /var/www/html/

WORKDIR /app

# Install dependencies
COPY gateway/package.json ./
RUN npm install --omit=dev

# Copy app code
COPY gateway/src ./src
COPY gateway/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 80
CMD ["/start.sh"]
