# Deployment Checklist

## Pre-Deploy

### Code Cleanup
- [ ] Remove all Tauri code (packages, imports, API calls)
- [ ] Remove Tauri-specific dependencies from package.json
- [ ] Update settings to use localStorage instead of Tauri store
- [ ] Remove src-tauri directory
- [ ] Clean up .gitignore (remove Tauri entries)

### Testing
- [ ] Test in Chrome (latest version)
- [ ] Test in Safari (latest version)
- [ ] Test in Firefox (latest version)
- [ ] Verify voice recording works (microphone permissions)
- [ ] Verify voice playback works (no echo)
- [ ] Test all navigation routes
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify dark theme renders correctly
- [ ] Test settings persistence (localStorage)

### Build Verification
- [ ] Run `npm run build` successfully
- [ ] Verify output directory (out/) contains all files
- [ ] Check for any build warnings or errors
- [ ] Run `npm run type-check` (no TypeScript errors)
- [ ] Run `npm run lint` (no linting errors)
- [ ] Run `npm test -- --run` (all tests pass)

## Deploy to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`

### Deployment Steps
1. Deploy to preview: `vercel`
2. Test preview deployment
3. Deploy to production: `npm run deploy:vercel`
4. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_APP_URL`: Your production URL
   - `DATABASE_URL`: Production database (if using)
   - Add any other required env vars

### Vercel Configuration
- Build command: `npm run build`
- Output directory: `out`
- Framework: Next.js
- Node version: 20.x

## Deploy to Netlify

### Prerequisites
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`

### Deployment Steps
1. Initialize site: `netlify init`
2. Deploy to preview: `netlify deploy`
3. Test preview deployment
4. Deploy to production: `npm run deploy:netlify`
5. Set environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_APP_URL`: Your production URL
   - `DATABASE_URL`: Production database (if using)
   - Add any other required env vars

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `out`
- Node version: 20

## Post-Deploy Verification

### Functionality Tests
- [ ] Test production URL loads
- [ ] Verify all pages are accessible
- [ ] Test voice recording in production
- [ ] Test voice playback in production
- [ ] Verify settings save/load correctly
- [ ] Test navigation between pages
- [ ] Verify dark theme works
- [ ] Check console for errors (F12)

### Performance Tests
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Check page load times
- [ ] Verify images load correctly
- [ ] Test on slow 3G connection

### Mobile Testing
- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify responsive design
- [ ] Test touch interactions
- [ ] Test voice on mobile

### Security Checks
- [ ] Verify HTTPS is enabled
- [ ] Check Content Security Policy headers
- [ ] Verify no secrets in client bundle
- [ ] Test CORS settings (if using API)
- [ ] Verify authentication works (if implemented)

## Monitoring

### Setup Monitoring
- [ ] Configure error tracking (Sentry, LogRocket, etc.)
- [ ] Setup uptime monitoring
- [ ] Configure analytics (Vercel Analytics, Google Analytics, etc.)
- [ ] Setup alerts for critical errors

### Post-Launch
- [ ] Monitor error rates for first 24 hours
- [ ] Check user feedback/bug reports
- [ ] Monitor performance metrics
- [ ] Watch for any security issues

## Rollback Plan

If issues occur:
1. Revert to previous deployment in platform dashboard
2. Investigate issue locally
3. Fix and redeploy when ready

## Notes

- Always deploy to preview/staging first
- Test thoroughly before production deployment
- Keep deployment logs for debugging
- Document any deployment-specific configuration
- Maintain environment variable documentation
