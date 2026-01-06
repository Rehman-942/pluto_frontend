# Docker Setup Guide for PhotoShare MERN Stack

This guide explains how to run the PhotoShare application using Docker containers.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB+ RAM recommended
- 10GB+ free disk space

### 1. Environment Setup
```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit .env with your Cloudinary credentials (required)
# Get free account at: https://cloudinary.com
```

### 2. Run the Application
```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │────│   Backend   │────│   MongoDB   │
│  React+Nginx│    │  Node.js    │    │   Database  │
│   Port 3000 │    │  Port 5000  │    │  Port 27017 │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                    
                   ┌─────────────┐              
                   │    Redis    │              
                   │    Cache    │              
                   │  Port 6379  │              
                   └─────────────┘              
```

## 📦 Container Services

### Frontend Container
- **Base**: nginx:alpine
- **Build**: Multi-stage (Node.js build → Nginx serve)
- **Features**: 
  - Gzip compression
  - Security headers
  - SPA routing support
  - API proxy to backend

### Backend Container
- **Base**: node:18-alpine
- **Features**:
  - Non-root user execution
  - Health checks
  - Signal handling with dumb-init
  - Hot reload in development

### MongoDB Container
- **Version**: 7.0
- **Features**:
  - Authentication enabled
  - Auto-initialization with demo data
  - Persistent data volumes
  - Optimized indexes

### Redis Container
- **Version**: 7.2-alpine
- **Features**:
  - Password protection
  - Persistent storage
  - Optimized for caching

## 🔧 Development Commands

```bash
# Development with hot reload
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Access container shell
docker-compose exec backend sh
docker-compose exec mongodb mongosh

# Reset all data
docker-compose down -v
docker-compose up --build
```

## 🏭 Production Deployment

### 1. Production Configuration
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# With custom environment
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 2. Environment Variables (Production)
```bash
# Required production variables
MONGODB_URI=mongodb://username:password@host:port/database
REDIS_URL=redis://:password@host:port
JWT_SECRET=secure-random-string-256-bits
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://yourdomain.com
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
```

### 3. Production Features
- **Resource limits** for containers
- **Logging configuration** with rotation
- **Health checks** for all services
- **Nginx reverse proxy** with SSL support
- **Security hardening** and non-root users

## 🗄️ Database Initialization

The MongoDB container automatically:
1. Creates the `photoshare` database
2. Sets up collections with validation
3. Creates optimized indexes
4. Inserts demo users:
   - **Admin**: admin@photoshare.com / password123
   - **Creator**: demo.creator@photoshare.com / password123
   - **Consumer**: demo.consumer@photoshare.com / password123

## 🔍 Health Monitoring

### Health Check Endpoints
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health (nginx)
curl http://localhost:3000/health

# Container health status
docker-compose ps
```

### View Container Stats
```bash
# Resource usage
docker stats

# Container inspection
docker-compose exec backend node healthcheck.js
```

## 🛠️ Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check if ports are in use
lsof -i :3000 -i :5000 -i :27017 -i :6379

# Use different ports
export FRONTEND_PORT=3001
docker-compose up -d
```

**Memory Issues**
```bash
# Check Docker memory allocation
docker system df
docker system prune -f

# Increase Docker memory (Docker Desktop)
# Settings → Resources → Memory → 8GB+
```

**Database Connection**
```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh -u root -p rootpassword123

# Check backend logs
docker-compose logs backend | grep -i mongodb
```

**Redis Connection**
```bash
# Test Redis connection
docker-compose exec redis redis-cli -a redispassword123 ping

# Check cache status
docker-compose exec redis redis-cli -a redispassword123 info memory
```

### Reset Everything
```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v --remove-orphans
docker system prune -f
docker volume prune -f

# Start fresh
docker-compose up --build
```

## 📊 Monitoring & Logs

### Log Management
```bash
# Follow logs for all services
docker-compose logs -f

# Service-specific logs
docker-compose logs -f backend
docker-compose logs -f mongodb

# Log rotation (production)
# Configured in docker-compose.prod.yml
```

### Performance Monitoring
```bash
# Container resource usage
docker stats photoshare-backend-dev photoshare-frontend-dev

# Database performance
docker-compose exec mongodb mongosh --eval "db.runCommand({serverStatus: 1})"

# Redis performance
docker-compose exec redis redis-cli -a redispassword123 --latency
```

## 🔒 Security Considerations

### Development Security
- Default passwords (change in production)
- No SSL termination (add nginx proxy for production)
- Permissive CORS (restrict in production)

### Production Security
- Strong passwords and secrets
- SSL/TLS termination at nginx
- Network isolation
- Non-root container execution
- Resource limits
- Log monitoring

## 🚀 Deployment Options

### Option 1: Single Server
```bash
# Direct docker-compose on VPS
scp -r . user@server:/opt/photoshare/
ssh user@server "cd /opt/photoshare && docker-compose -f docker-compose.prod.yml up -d"
```

### Option 2: Container Registry
```bash
# Build and push images
docker build -t photoshare/backend ./backend
docker build -t photoshare/frontend ./frontend
docker push photoshare/backend
docker push photoshare/frontend
```

### Option 3: Orchestration
- **Docker Swarm**: Multi-node deployment
- **Kubernetes**: Full orchestration with helm charts
- **Cloud Services**: AWS ECS, Azure Container Instances, GCP Cloud Run

This Docker setup provides a complete, production-ready deployment solution for the PhotoShare MERN stack application.
