#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Smart Shopping Platform Setup${NC}"
echo "=============================="

# Check requirements
check_requirement() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

echo -e "\n${YELLOW}Checking requirements...${NC}"
check_requirement node
check_requirement npm
check_requirement mongod
check_requirement redis-cli

# Create necessary directories
echo -e "\n${YELLOW}Creating directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/uploads/{products,bills,shelves}
mkdir -p frontend/public/images

# Install dependencies
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install

echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
cd ../frontend
npm install

# Copy environment files
echo -e "\n${YELLOW}Setting up environment files...${NC}"
cd ..
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please update backend/.env with your configuration${NC}"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${YELLOW}Please update frontend/.env with your configuration${NC}"
fi

# Seed database
echo -e "\n${YELLOW}Would you like to seed the database? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    cd backend
    npm run seed
    cd ..
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "\nTo start the application:"
echo -e "1. Start MongoDB: ${YELLOW}mongod${NC}"
echo -e "2. Start Redis: ${YELLOW}redis-server${NC}"
echo -e "3. Backend: ${YELLOW}cd backend && npm run dev${NC}"
echo -e "4. Frontend: ${YELLOW}cd frontend && npm start${NC}"