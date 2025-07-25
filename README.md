# Admin Dashboard

A comprehensive admin dashboard with MongoDB integration and role-based authentication.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd admin-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:8080`
   - You will be redirected to the login page

## 🔐 Default Login Credentials

**Admin Login:**

- Email: `admin@example.com`
- Password: `Admin123!`

**Sub-Admin Login:**

- Email: `subadmin@example.com`
- Password: `SubAdmin123!`

## 📂 Project Structure

```
├── client/           # Frontend React application
├── server/           # Backend Express server
├── shared/           # Shared types and utilities
└── package.json      # Project dependencies
```

## 🛠 Development

- Frontend: Vite + React + TypeScript
- Backend: Express.js + Node.js
- Database: MongoDB (with in-memory fallback)
- Authentication: JWT tokens

## 🗄️ Database

The application automatically falls back to in-memory storage if MongoDB is not available.

To use MongoDB:

```bash
# Using Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or install MongoDB locally and ensure it's running on localhost:27017
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/admin-dashboard
JWT_SECRET=your-secret-key
PORT=3000
```

## 📱 Features

- Role-based authentication (Admin, Sub-Admin, User)
- Real-time notifications
- Analytics dashboard
- User management
- Audit logs
- Dark/Light theme support

## ❗ Troubleshooting

### "Invalid email or password" error

If you get this error when logging in:

1. **Check the console logs** - Open browser dev tools (F12) and check for errors
2. **Verify server is running** - Ensure both frontend (port 8080) and backend (port 3000) are running
3. **Use exact credentials** - Copy/paste the credentials exactly:
   - Email: `admin@example.com`
   - Password: `Admin123!`
4. **Clear browser cache** - Try in incognito mode or clear cache
5. **Restart the dev server** - Stop (Ctrl+C) and run `npm run dev` again

### Server not starting

1. **Check Node.js version** - Ensure you have Node.js v18+
2. **Install dependencies** - Run `npm install` again
3. **Check port availability** - Ensure ports 3000 and 8080 are available

### MongoDB connection issues

The app works without MongoDB (uses in-memory storage), but if you want to use MongoDB:

1. **Install MongoDB** or use Docker
2. **Start MongoDB service**
3. **Set MONGODB_URI** in environment variables

## 🆘 Need Help?

If you're still experiencing issues:

1. Check the browser console for JavaScript errors
2. Check the terminal where you ran `npm run dev` for server errors
3. Try the exact default credentials provided above
4. Ensure you're accessing `http://localhost:8080` not `http://localhost:3000`
