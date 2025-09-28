#!/bin/bash

# Collaborative Writing Platform Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Collaborative Writing Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "📝 Creating environment files..."

# Backend environment
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "⚠️  backend/.env already exists"
fi

# Frontend environment
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
EOF
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p backend/pdfs
mkdir -p backend/logs
mkdir -p docker/nginx/ssl

# Set permissions
chmod +x scripts/*.sh

echo "✅ Setup completed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Update environment variables in backend/.env and frontend/.env"
echo "2. Start the development environment:"
echo "   - For Docker: docker-compose up -d"
echo "   - For local development: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- API Documentation: http://localhost:3001/api/docs"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo ""
echo "🎉 Happy coding!"


