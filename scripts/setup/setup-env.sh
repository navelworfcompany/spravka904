#!/bin/bash

# Script for setting up environment variables

set -e

echo "🔧 Setting up environment variables..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate random string
generate_random_string() {
    local length=$1
    LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c $length
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Backend setup
echo -e "\n${YELLOW}📁 Backend Environment Setup${NC}"

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    
    # Generate secure secrets for production
    if [ "$NODE_ENV" = "production" ]; then
        echo "Generating secure secrets for production..."
        
        # Generate JWT secret
        JWT_SECRET=$(generate_random_string 64)
        sed -i.bak "s|dev-jwt-secret-key-2024-change-in-production|${JWT_SECRET}|g" backend/.env
        
        # Generate session secret
        SESSION_SECRET=$(generate_random_string 32)
        sed -i.bak "s|dev-session-secret-2024-change-in-production|${SESSION_SECRET}|g" backend/.env
        
        # Remove backup files
        rm -f backend/.env.bak
        
        echo -e "${GREEN}✅ Generated secure secrets for production${NC}"
    else
        echo -e "${YELLOW}⚠️  Using development secrets. Change them for production!${NC}"
    fi
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Frontend setup
echo -e "\n${YELLOW}📁 Frontend Environment Setup${NC}"

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from .env.example..."
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
fi

# Create necessary directories
echo -e "\n${YELLOW}📁 Creating necessary directories${NC}"

mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/backups
mkdir -p frontend/public/uploads

echo -e "${GREEN}✅ Created necessary directories${NC}"

# Set permissions
echo -e "\n${YELLOW}🔐 Setting file permissions${NC}"

chmod 644 backend/.env
chmod 644 frontend/.env
chmod 755 backend/logs
chmod 755 backend/uploads
chmod 755 backend/backups

echo -e "${GREEN}✅ Set file permissions${NC}"

# Display next steps
echo -e "\n${GREEN}🎉 Environment setup completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review the .env files and adjust values as needed"
echo "2. Run 'npm install' in both backend and frontend directories"
echo "3. Start the development servers with 'npm run dev'"
echo -e "\n${YELLOW}Important for production:${NC}"
echo "• Change all secrets in backend/.env"
echo "• Set NODE_ENV=production"
echo "• Configure real SMTP credentials for email"
echo "• Set up a proper database path"

echo -e "\n${GREEN}🚀 You're ready to go!${NC}"