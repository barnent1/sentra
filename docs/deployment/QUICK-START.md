# Quick Start: Deploy Sentra to Web

This guide gets you deployed in under 5 minutes.

## Prerequisites

- Node.js 20+ installed
- Git repository pushed to GitHub
- Tauri code removed (see cleanup checklist)

## Option 1: Deploy to Vercel (Recommended)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
# Login to Vercel
vercel login

# Deploy to preview (test first)
vercel

# Deploy to production
npm run deploy:vercel
```

### 3. Set Environment Variables
In Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add:
   - `NEXT_PUBLIC_APP_URL`: Your Vercel URL (e.g., https://sentra.vercel.app)

### 4. Done!
Your app is live at: `https://your-project.vercel.app`

## Option 2: Deploy to Netlify

### 1. Install Netlify CLI
```bash
npm i -g netlify-cli
```

### 2. Deploy
```bash
# Login to Netlify
netlify login

# Initialize site (first time only)
netlify init

# Deploy to preview (test first)
netlify deploy

# Deploy to production
npm run deploy:netlify
```

### 3. Set Environment Variables
In Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add:
   - `NEXT_PUBLIC_APP_URL`: Your Netlify URL (e.g., https://sentra.netlify.app)

### 4. Done!
Your app is live at: `https://your-project.netlify.app`

## Option 3: GitHub Integration (No CLI)

### Vercel
1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Output directory: `out`
5. Add environment variables
6. Deploy!

### Netlify
1. Go to https://netlify.com
2. Click "Add new site" > "Import an existing project"
3. Select your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `out`
5. Add environment variables
6. Deploy!

## Testing Your Deployment

After deploying, test these critical features:

1. **Homepage loads**: Visit your production URL
2. **Voice recording works**: Test microphone permissions
3. **Voice playback works**: Verify no echo issues
4. **Navigation works**: Click through all pages
5. **Mobile works**: Test on your phone
6. **Settings persist**: Change settings, reload page

## Troubleshooting

### Build fails
- Run `npm run build` locally first
- Check for TypeScript errors: `npm run type-check`
- Check for lint errors: `npm run lint`

### Voice doesn't work
- Check browser console for errors (F12)
- Verify HTTPS is enabled (required for microphone access)
- Check microphone permissions in browser

### 404 errors
- Verify `vercel.json` or `netlify.toml` redirects are configured
- Check that `out` directory was generated correctly

### Settings don't save
- Verify localStorage is enabled in browser
- Check browser console for storage errors

## Next Steps

1. Setup custom domain (optional)
2. Configure monitoring/analytics
3. Setup error tracking
4. Review security headers
5. Enable CORS if using external API

## Support

- Vercel docs: https://vercel.com/docs
- Netlify docs: https://docs.netlify.com
- Next.js docs: https://nextjs.org/docs

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server

# Build and test locally
npm run build            # Build for production
npm run start            # Test production build locally

# Deploy
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:netlify   # Deploy to Netlify

# Quality checks
npm run type-check       # TypeScript check
npm run lint             # Lint code
npm test -- --run        # Run tests
```

That's it! You're deployed.
