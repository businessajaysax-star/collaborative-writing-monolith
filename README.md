# Collaborative Writing Platform - Monolithic Architecture

A comprehensive collaborative writing platform built with a simplified monolithic architecture for easy management and deployment.

## 🚀 Features

### Core Features
- **Multi-tenant Organization Management** - Support for multiple organizations
- **Content Creation & Collaborative Editing** - Rich text editor with real-time collaboration
- **Peer Review System** - Comprehensive review workflow with ratings and feedback
- **Automated Magazine Generation** - Monthly PDF magazine creation
- **Multi-language Support** - Hindi and English with language detection
- **Real-time Notifications** - Socket.IO powered real-time updates
- **File Management** - Secure file upload and management
- **Analytics & Reporting** - Comprehensive analytics dashboard

### User Roles
- **Admin** - Full system access and management
- **Teacher** - Content management and review capabilities
- **Student** - Content creation and submission
- **Reviewer** - Content review and feedback

### Technical Features
- **JWT Authentication** - Secure authentication with refresh tokens
- **Role-based Access Control** - Granular permissions system
- **Database Optimization** - Indexed queries and connection pooling
- **Caching Strategy** - Redis for sessions and performance
- **Security** - Input validation, XSS protection, rate limiting
- **Docker Support** - Complete containerization
- **Responsive Design** - Mobile-friendly interface

## 🏗️ Architecture

### Monolithic Benefits
- **Simplified Development** - Single codebase to manage
- **Easier Debugging** - All services in one place
- **Cost-effective** - Single server deployment
- **Faster Development** - No microservice complexity
- **Perfect for Small Teams** - Easy to understand and maintain

### Tech Stack
- **Frontend**: React 18, TypeScript, Material-UI, TinyMCE
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Redis caching
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO
- **File Storage**: Local/AWS S3
- **PDF Generation**: Puppeteer
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
collaborative-writing-monolith/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── database/            # Database migrations & seeds
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── utils/           # Utility functions
│   └── package.json
├── docker/                  # Docker configurations
├── database/                # Database scripts
├── docs/                    # Documentation
├── scripts/                 # Deployment scripts
├── docker-compose.yml       # Docker Compose configuration
└── package.json            # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd collaborative-writing-monolith
npm run setup
```

2. **Environment Configuration**
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the environment variables
nano backend/.env
nano frontend/.env
```

3. **Database Setup**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

4. **Development**
```bash
# Start development servers
npm run dev
```

5. **Production**
```bash
# Build and start
npm run build
npm start
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Configuration

### Backend Environment Variables
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writing_platform
DB_USER=postgres
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Content Endpoints
- `GET /api/content` - List content
- `POST /api/content` - Create content
- `GET /api/content/:id` - Get content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### Review Endpoints
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `GET /api/reviews/:id` - Get review

### Organization Endpoints
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization
- `PUT /api/organizations/:id` - Update organization

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** and sanitization
- **Rate Limiting** and request throttling
- **XSS Protection** and CSRF protection
- **SQL Injection Prevention**
- **Secure File Uploads**
- **Password Hashing** with bcrypt

## 📈 Performance Features

- **Database Indexing** for optimized queries
- **Redis Caching** for sessions and data
- **Connection Pooling** for database
- **Image Optimization** with Sharp
- **Lazy Loading** for frontend
- **CDN Integration** ready

## 🐳 Docker Support

The application is fully containerized with Docker Compose:

```yaml
services:
  - postgres: PostgreSQL database
  - redis: Redis cache
  - backend: Node.js API server
  - frontend: React application
  - nginx: Reverse proxy
```

## 📝 Development

### Code Style
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks

### Testing
- Jest for backend testing
- React Testing Library for frontend
- Supertest for API testing

### Database
- PostgreSQL with proper indexing
- Database migrations
- Seed data for development
- Connection pooling

## 🚀 Deployment

### Production Deployment
1. **Server Setup** (AWS EC2, DigitalOcean, etc.)
2. **Docker Deployment** with docker-compose
3. **Nginx Configuration** for reverse proxy
4. **SSL Certificate** setup
5. **Process Management** with PM2

### Environment Setup
- Production environment variables
- Database configuration
- Redis configuration
- File storage setup
- Email configuration

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

---

**Built with ❤️ using Monolithic Architecture for simplicity and ease of management.**


