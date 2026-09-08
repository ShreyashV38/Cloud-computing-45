FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and PostgreSQL
RUN apt-get update && apt-get install -y python3 python3-pip postgresql postgresql-contrib sudo

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Allow local connections without password for simplicity inside the container
RUN echo "local all all trust" > /etc/postgresql/14/main/pg_hba.conf
RUN echo "host all all 127.0.0.1/32 trust" >> /etc/postgresql/14/main/pg_hba.conf

EXPOSE 5000
CMD ["/start.sh"]
