# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows:
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service: `net start MongoDB`
4. Default connection: `mongodb://localhost:27017`

### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## Option 2: MongoDB Docker

```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or with persistent data
docker run -d --name mongodb -p 27017:27017 -v mongodb-data:/data/db mongo:latest
```

## Option 3: MongoDB Atlas (Cloud)

1. Sign up at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string like: `mongodb+srv://username:password@cluster.mongodb.net/admin-dashboard`

## Environment Setup

Create `.env` file in project root:

```bash
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/admin-dashboard

# For MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/admin-dashboard

JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
NODE_ENV=development
```

## Verify Connection

Run the server to test MongoDB connection:
```bash
npm run dev
```

Check health endpoint: http://localhost:3000/health
