# Pre-Deployment Checklist

Before deploying to Vercel, ensure you've completed these steps:

## ✅ Code Preparation

- [ ] All code changes committed to Git
- [ ] Code builds successfully locally
  ```bash
  npm run build
  ```
- [ ] Tests pass (if applicable)
- [ ] No console errors in browser
- [ ] API endpoints work correctly
- [ ] File uploads function properly

## ✅ Configuration Files

- [ ] `vercel.json` exists in root directory
- [ ] `package.json` exists in root with `vercel-build` script
- [ ] `.vercelignore` configured to exclude unnecessary files
- [ ] `.env.example` documents all required environment variables

## ✅ Environment Variables

Create these in Vercel dashboard before deploying:

- [ ] `NODE_ENV` = `production`
- [ ] `ALLOWED_ORIGINS` = your deployment URLs (comma-separated)
- [ ] Any other custom environment variables your app needs

## ✅ Frontend Configuration

- [ ] Frontend builds successfully
  ```bash
  cd frontend && npm run build
  ```
- [ ] API calls use relative URLs (not hardcoded localhost)
- [ ] Assets are properly referenced
- [ ] No hardcoded development URLs

## ✅ Backend Configuration

- [ ] Backend compiles successfully
  ```bash
  cd backend && npm run build
  ```
- [ ] All imports use `.js` extensions (for ESM)
- [ ] File upload handling works with `/tmp` directory
- [ ] CORS properly configured
- [ ] Error handling in place

## ✅ Git & GitHub

- [ ] Repository is public or Vercel has access
- [ ] All files pushed to GitHub
  ```bash
  git add .
  git commit -m "Prepare for Vercel deployment"
  git push origin main
  ```
- [ ] No sensitive data in repository (API keys, secrets)
- [ ] `.gitignore` excludes node_modules, .env, etc.

## ✅ Dependencies

- [ ] All dependencies listed in `package.json`
- [ ] No missing or deprecated packages
- [ ] Development dependencies separated from production
- [ ] Package versions compatible with Node.js 18+

## ✅ Testing

Test these scenarios locally with production build:

- [ ] Homepage loads correctly
- [ ] File upload works
- [ ] Harmonization process completes
- [ ] Results page displays correctly
- [ ] Download functionality works
- [ ] Error handling works (try invalid files)

## ✅ Performance

- [ ] Images optimized
- [ ] Bundle size reasonable (< 2MB ideal)
- [ ] No unnecessary console.logs in production code
- [ ] Lazy loading implemented where appropriate

## ✅ Documentation

- [ ] README.md updated with deployment info
- [ ] VERCEL_DEPLOYMENT.md created
- [ ] Environment variables documented
- [ ] Known issues documented

## 🚀 Ready to Deploy!

Once all items are checked:

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`
6. Add environment variables
7. Click "Deploy"

## 📊 Post-Deployment

After deployment:

- [ ] Test deployed application thoroughly
- [ ] Update `ALLOWED_ORIGINS` with actual Vercel URL
- [ ] Redeploy with updated environment variables
- [ ] Check function logs for errors
- [ ] Monitor performance in Vercel dashboard
- [ ] Test from different devices/browsers
- [ ] Share URL and gather feedback

## 🔧 If Something Goes Wrong

1. Check build logs in Vercel dashboard
2. Check function logs for runtime errors
3. Verify environment variables are set correctly
4. Test production build locally
5. Review recent code changes
6. Rollback to previous deployment if needed
7. Consult [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) troubleshooting section

---

**Pro Tip:** Test your production build locally before deploying:
```bash
npm run build
cd backend && npm start
# Visit http://localhost:3001
```
