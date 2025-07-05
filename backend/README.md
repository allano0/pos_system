# Supermax Backend

This is the backend server for the Supermax POS system.

## Deployment on Render

### 1. Create a new Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `supermax-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

### 2. Environment Variables

Add these environment variables in Render:

- `NODE_ENV`: `production`
- `MONGODB_URI`: `mongodb+srv://allano2921:allano@cluster0.83ourjh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

### 3. Deploy

Click "Create Web Service" and wait for deployment to complete.

### 4. Update Frontend

Once deployed, update the frontend URL in `src/renderer/src/pages/SignIn.tsx`:

```javascript
const baseUrl = isDev ? 'http://localhost:5000' : 'https://your-app-name.onrender.com';
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

- `GET /api/test` - Health check
- `GET /api/cashiers` - Get all cashiers
- `GET /api/branches` - Get all branches
- `GET /api/owner` - Get owner data
- `POST /api/sync` - Sync data between client and server 