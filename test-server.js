const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const users = [
  { id: 1, email: 'admin@test.com', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { id: 2, email: 'teacher@test.com', first_name: 'Teacher', last_name: 'User', role: 'teacher' },
  { id: 3, email: 'student@test.com', first_name: 'Student', last_name: 'User', role: 'student' }
];

const content = [
  { id: 1, title: 'Sample Article 1', content: 'This is a sample article content...', author: 'Student User', status: 'draft' },
  { id: 2, title: 'Sample Article 2', content: 'This is another sample article...', author: 'Student User', status: 'published' }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Test server is running!' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ 
    success: true, 
    data: users[0] 
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@test.com' && password === 'password') {
    res.json({
      success: true,
      data: {
        user: users[0],
        access_token: 'mock-token-123',
        refresh_token: 'mock-refresh-token-456'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/content', (req, res) => {
  res.json({
    success: true,
    data: content,
    pagination: {
      page: 1,
      limit: 10,
      total: content.length,
      total_pages: 1
    }
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    pagination: {
      page: 1,
      limit: 10,
      total: users.length,
      total_pages: 1
    }
  });
});

app.get('/api/organizations', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Test Organization', description: 'A test organization' }
    ]
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: 'Welcome!', message: 'Welcome to the platform', is_read: false },
      { id: 2, title: 'New Content', message: 'New content has been published', is_read: false }
    ]
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch all handler for React app
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Content endpoint: http://localhost:${PORT}/api/content`);
});
