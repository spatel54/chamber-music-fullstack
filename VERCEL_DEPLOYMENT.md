# Vercel Deployment Guide for HarmonyForge

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Your code pushed to a GitHub repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure all changes are committed and pushed to GitHub:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import your `chamber-music` repository

### 3. Configure Project Settings

In the Vercel project setup:

**Framework Preset:** Other

**Root Directory:** Leave as `.` (root)

**Build Command:** `npm run vercel-build`

**Output Directory:** Leave empty (serverless functions)

**Install Command:** `npm install`

### 4. Environment Variables

Add these environment variables in Vercel dashboard (Settings → Environment Variables):

```
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Note:** Replace `your-app.vercel.app` with your actual Vercel deployment URL after first deploy.

### 5. Deploy

Click "Deploy" - Vercel will:
1. Clone your repository
2. Install dependencies (frontend & backend)
3. Build the frontend
4. Build the backend
5. Deploy as serverless functions

### 6. Update CORS Settings

After first deployment:
1. Note your deployment URL (e.g., `https://chamber-music.vercel.app`)
2. Go to Settings → Environment Variables
3. Update `ALLOWED_ORIGINS` to include your deployment URL
4. Redeploy (Deployments → Three dots → Redeploy)

## Important Notes

### File Uploads
- Vercel serverless functions use `/tmp` for temporary storage
- Files are automatically cleaned up after processing
- Maximum file size: 50MB (configured in middleware)

### Function Limits
- **Free tier:** 10s execution time
- **Pro tier:** 60s execution time
- Current configuration: 30s max duration (requires Pro tier)
- To use free tier, change in `vercel.json`:
  ```json
  "maxDuration": 10
  ```

### Build Process
The build process:
1. Installs root dependencies
2. Builds frontend (React + Vite)
3. Builds backend (TypeScript → JavaScript)
4. Packages everything for serverless deployment

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `cd backend && npm run build`

### Runtime Errors
- Check function logs in Vercel dashboard
- Ensure environment variables are set correctly
- Check that CORS origins include your Vercel URL

### File Upload Issues
- Verify file size is under 50MB
- Check supported formats: `.mid`, `.midi`, `.xml`, `.musicxml`
- Ensure multer is properly configured

## Local Testing

Test the production build locally:

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Build backend
cd backend
npm run build
cd ..

# Start production server
cd backend
npm start
```

Visit `http://localhost:3001` to test.

## Continuous Deployment

Once connected to Vercel:
- Every push to `main` branch automatically deploys to production
- Pull request branches get preview deployments
- Rollback to previous deployments from Vercel dashboard

## Monitoring

Monitor your deployment:
- **Analytics:** Vercel dashboard → Analytics
- **Function logs:** Dashboard → Functions → Select function → Logs
- **Performance:** Dashboard → Speed Insights

## Cost Considerations

**Free Tier Limits:**
- 100GB bandwidth/month
- 100 hours serverless function execution/month
- 10s max function duration

**Upgrade to Pro if you need:**
- More bandwidth
- Longer function execution (up to 60s)
- Priority support

## Support

For issues:
1. Check Vercel documentation: https://vercel.com/docs
2. Review function logs in dashboard
3. Test locally with production build
4. Check GitHub issues for similar problems
