# 🧪 Collaborative Writing Platform - Testing Guide

## 🚀 Quick Start Testing

### Option 1: HTML Test Application (Recommended for UI Testing)

1. **Open the test application:**
   ```bash
   open test-app.html
   ```
   Or navigate to: `file:///Users/ajay/MacData/collaborative-writing-monolith/test-app.html`

2. **Login with demo credentials:**
   - Email: `admin@test.com`
   - Password: `password`

3. **Explore the features:**
   - Click on different navigation tabs
   - Test the responsive design
   - Check the UI components

### Option 2: Full Development Environment

1. **Start the test server:**
   ```bash
   node test-server.js
   ```

2. **Access the application:**
   - Frontend: http://localhost:3001
   - API Health: http://localhost:3001/health

## 🎯 Testing Features

### 🔐 Authentication System
- **Login functionality** with demo credentials
- **Role-based access control** (Admin, Teacher, Student, Reviewer)
- **Session management** with JWT tokens
- **Password validation** and security

### 📝 Content Management
- **Create content** with rich text editor
- **Collaborative editing** with real-time updates
- **Version control** for content changes
- **Content status** (Draft, Submitted, Under Review, Approved, Published)
- **Multi-language support** (Hindi/English)

### ⭐ Peer Review System
- **Review assignments** for content
- **Rating system** (1-5 stars)
- **Detailed feedback** and suggestions
- **Review criteria** (Grammar, Creativity, Relevance)
- **Review workflow** (Pending → In Progress → Completed)

### 🏢 Organization Management
- **Multi-tenant support** for organizations
- **Member management** with roles
- **Organization settings** and configuration
- **Role-based permissions** within organizations

### 📚 Magazine Generation
- **Automated PDF creation** with Puppeteer
- **Magazine layouts** and templates
- **Content compilation** from approved articles
- **PDF download** and sharing

### 🔔 Real-time Notifications
- **Socket.IO integration** for real-time updates
- **Notification types** (Content submitted, Review assigned, etc.)
- **Real-time collaboration** indicators
- **Live updates** for content changes

### 📁 File Management
- **Secure file uploads** with validation
- **Image optimization** with Sharp
- **File organization** by content and organization
- **Public/private file access**

## 🎨 UI/UX Testing

### 📱 Responsive Design
- **Mobile-friendly** interface
- **Tablet optimization** for different screen sizes
- **Desktop experience** with full features
- **Touch-friendly** navigation

### 🌐 Multi-language Support
- **Hindi language** support with proper fonts
- **English language** with standard fonts
- **Language detection** for content
- **RTL support** for Hindi text

### 🎨 Material-UI Components
- **Consistent design** system
- **Accessible components** with proper ARIA labels
- **Theme customization** and dark mode support
- **Interactive elements** with hover states

## 🔧 Technical Testing

### 🗄️ Database Operations
- **User management** (CRUD operations)
- **Content storage** with relationships
- **Review tracking** and analytics
- **Organization data** management

### 🔒 Security Features
- **JWT authentication** with refresh tokens
- **Input validation** and sanitization
- **Rate limiting** and request throttling
- **XSS protection** and CSRF prevention
- **SQL injection** prevention

### ⚡ Performance Testing
- **Database indexing** for optimized queries
- **Redis caching** for improved performance
- **Image optimization** for faster loading
- **Lazy loading** for better user experience

## 🐳 Docker Testing

### 🚀 Container Deployment
```bash
# Build and start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 🔍 Service Verification
- **PostgreSQL** database connectivity
- **Redis** cache functionality
- **Backend API** health checks
- **Frontend** static file serving
- **Nginx** reverse proxy configuration

## 📊 API Testing

### 🔗 Endpoints to Test

#### Authentication
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'

# Get current user
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer mock-token-123"
```

#### Content Management
```bash
# Get content list
curl http://localhost:3001/api/content

# Get users
curl http://localhost:3001/api/users

# Get organizations
curl http://localhost:3001/api/organizations

# Get notifications
curl http://localhost:3001/api/notifications
```

## 🎯 Feature Testing Scenarios

### 📝 Content Creation Workflow
1. **Login** as a student
2. **Create new content** with title and body
3. **Submit for review** to change status
4. **Assign reviewer** (teacher role)
5. **Complete review** with feedback
6. **Approve content** for publication

### ⭐ Review Process Testing
1. **Login** as a teacher/reviewer
2. **View assigned reviews** in dashboard
3. **Open review** and provide feedback
4. **Rate content** on different criteria
5. **Submit review** to complete process

### 🏢 Organization Management
1. **Login** as admin
2. **Create organization** with details
3. **Add members** with different roles
4. **Manage permissions** and access
5. **Configure organization** settings

### 📚 Magazine Generation
1. **Select approved content** for magazine
2. **Configure magazine** layout and design
3. **Generate PDF** with Puppeteer
4. **Download magazine** for distribution
5. **Share magazine** with organization

## 🐛 Troubleshooting

### Common Issues

#### Server Not Starting
```bash
# Check if port is in use
lsof -i :3001

# Kill process if needed
kill -9 $(lsof -t -i:3001)

# Restart server
node test-server.js
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Build frontend
npm run build
```

### 🔍 Debug Mode
```bash
# Enable debug logging
DEBUG=* node test-server.js

# Check environment variables
echo $NODE_ENV
echo $PORT
```

## 📈 Performance Testing

### 🚀 Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 10 --num 5 http://localhost:3001/health
```

### 📊 Monitoring
- **Database performance** with query analysis
- **Memory usage** monitoring
- **Response times** for API endpoints
- **Error rates** and logging

## 🎉 Success Criteria

### ✅ Functional Testing
- [ ] User authentication works correctly
- [ ] Content creation and editing functions
- [ ] Review system operates properly
- [ ] Organization management works
- [ ] File uploads and downloads function
- [ ] Real-time notifications work
- [ ] PDF generation succeeds

### ✅ UI/UX Testing
- [ ] Responsive design works on all devices
- [ ] Navigation is intuitive and accessible
- [ ] Multi-language support functions
- [ ] Material-UI components render correctly
- [ ] Loading states and error handling work

### ✅ Security Testing
- [ ] Authentication is secure
- [ ] Input validation prevents attacks
- [ ] File uploads are safe
- [ ] API endpoints are protected
- [ ] Data is properly sanitized

### ✅ Performance Testing
- [ ] Page load times are acceptable
- [ ] Database queries are optimized
- [ ] Caching improves performance
- [ ] File operations are efficient
- [ ] Real-time updates are responsive

## 🚀 Next Steps

After successful testing:

1. **Deploy to production** using Docker
2. **Configure SSL certificates** for HTTPS
3. **Set up monitoring** and logging
4. **Implement backup strategies**
5. **Scale the application** as needed

---

**Happy Testing! 🎉**

The collaborative writing platform is ready for comprehensive testing and deployment!
