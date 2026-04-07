# Vercel Deployment Guide

## Frontend Deployment

This project is configured for Vercel deployment with a monorepo structure.

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel

### Configuration

The project includes:
- ✅ `vercel.json` - Vercel configuration for monorepo
- ✅ `Frontend/package.json` - Build scripts and Node.js version
- ✅ `Frontend/.env.example` - Environment variable template

### Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

```
VITE_API_URL=https://your-backend-api.com
```

### Deployment Steps

1. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

2. **Configure Environment Variables**
   - Add `VITE_API_URL` in Vercel dashboard
   - Point it to your production backend URL

3. **Deploy**
   - Click "Deploy"
   - Vercel will:
     - Install dependencies in `Frontend/`
     - Run `npm run build`
     - Deploy the `Frontend/dist/` folder

### Local Testing

```bash
# Install dependencies
cd Frontend
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

### Troubleshooting

**Build fails with "vite: Permission denied"**
- Fixed: `vercel.json` now correctly specifies `Frontend/` as root directory

**Dependencies not found**
- Fixed: `installCommand` in `vercel.json` installs in correct directory

**API calls fail**
- Set `VITE_API_URL` environment variable in Vercel dashboard
- Default fallback is `http://localhost:8000` for local development

### Project Structure

```
smarttracker/
├── Frontend/          # React + Vite app (deployed to Vercel)
│   ├── dist/         # Build output (auto-generated)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/          # FastAPI (deploy separately)
├── vercel.json       # Vercel configuration
└── README.md
```

### Backend Deployment

The backend (FastAPI) should be deployed separately to:
- Railway
- Render
- Heroku
- AWS/GCP/Azure

Update `VITE_API_URL` to point to your deployed backend.
