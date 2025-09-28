# Deployment Guide

This guide covers deploying the Collaborative Writing Platform in production environments.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (for HTTPS)
- Server with at least 2GB RAM and 20GB storage

## Production Deployment

### 1. Environment Configuration

Create production environment files:

```bash
# Backend environment
cp backend/env.example backend/.env.production

# Frontend environment
cp frontend/.env frontend/.env.production
```

Update the production environment variables:

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=writing_platform
DB_USER=postgres
DB_PASSWORD=your-secure-password
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SOCKET_URL=https://yourdomain.com
```

### 2. SSL Certificate Setup

For HTTPS deployment, obtain an SSL certificate:

```bash
# Using Let's Encrypt (recommended)
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/
```

### 3. Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Database Migration

```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

### 5. Nginx Configuration

Update `docker/nginx/nginx.conf` for production:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Your existing configuration...
}
```

## AWS Deployment

### 1. EC2 Instance Setup

```bash
# Launch EC2 instance (t3.medium or larger)
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. RDS Database Setup

Create RDS PostgreSQL instance:

```bash
# Update backend/.env.production
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=writing_platform
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=true
```

### 3. ElastiCache Redis Setup

Create ElastiCache Redis cluster:

```bash
# Update backend/.env.production
REDIS_HOST=your-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379
```

### 4. S3 File Storage (Optional)

For file storage in S3:

```bash
# Update backend/.env.production
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

## DigitalOcean Deployment

### 1. Droplet Setup

```bash
# Create Ubuntu 20.04 droplet
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Managed Database

Create managed PostgreSQL database:

```bash
# Update connection details in backend/.env.production
DB_HOST=your-db-host
DB_PORT=25060
DB_NAME=writing_platform
DB_USER=your-username
DB_PASSWORD=your-password
```

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Check service health
curl http://localhost/health

# Check database connection
docker-compose exec backend npm run migrate

# Check logs
docker-compose logs -f
```

### 2. Backup Strategy

```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres writing_platform > backup.sql

# File backup
tar -czf uploads-backup.tar.gz backend/uploads/
tar -czf pdfs-backup.tar.gz backend/pdfs/
```

### 3. Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_content_status_created ON content(status, created_at);
CREATE INDEX CONCURRENTLY idx_reviews_status ON reviews(status);
CREATE INDEX CONCURRENTLY idx_notifications_user_read ON notifications(user_id, is_read);
```

### 2. Redis Configuration

```bash
# Update Redis configuration for production
# In docker-compose.yml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 3. Nginx Optimization

```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **SSL/TLS**: Always use HTTPS in production
3. **Database Security**: Use strong passwords and restrict access
4. **Firewall**: Configure firewall rules appropriately
5. **Updates**: Keep all dependencies updated
6. **Monitoring**: Set up monitoring and alerting

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec backend npm run migrate
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart services
   docker-compose restart
   ```

3. **File Upload Issues**
   ```bash
   # Check file permissions
   ls -la backend/uploads/
   
   # Fix permissions
   sudo chown -R 1001:1001 backend/uploads/
   ```

### Log Analysis

```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

## Support

For deployment issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check database connectivity
4. Review nginx configuration
5. Check SSL certificate validity

For additional support, refer to the main documentation or create an issue in the repository.


