FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and MySQL Server
RUN apt-get update && apt-get install -y curl mysql-server
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy app code
COPY src ./src
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3001
CMD ["/start.sh"]
