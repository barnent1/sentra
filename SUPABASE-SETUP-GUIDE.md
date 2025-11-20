# Supabase Setup Guide for Sentra

Complete guide to set up Supabase database and run migrations.

---

## Step 1: Create Supabase Project

### Option A: Use Existing Project
If you already have a Supabase project, skip to Step 2.

### Option B: Create New Project

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in or create account

2. **Create New Project:**
   - Click "New Project"
   - **Organization:** Select or create your organization
   - **Project Name:** `sentra` or your preferred name
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
     - US East (North Virginia) - us-east-1
     - US West (Oregon) - us-west-2
     - EU West (Ireland) - eu-west-1
     - Asia Pacific (Singapore) - ap-southeast-1
   - **Pricing Plan:** Start with Free tier
   - Click **"Create new project"**

3. **Wait for Provisioning:**
   - Takes ~2 minutes
   - Project will show "● Active" when ready

---

## Step 2: Get Connection String

1. **Go to Database Settings:**
   - Click your project
   - Go to **Settings** (left sidebar)
   - Click **Database**

2. **Copy Connection String:**
   - Scroll to **Connection string**
   - Select **URI** tab
   - Copy the connection string (looks like):
     ```
     postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```
   - **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual database password

3. **Save Connection Details:**
   You'll need these for environment variables:
   - **Connection String:** Full URI from above
   - **Host:** `aws-0-us-east-1.pooler.supabase.com`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres.xxxxxxxxxxxxx`
   - **Password:** Your database password

---

## Step 3: Set Up Local Environment

1. **Create `.env.local` file:**
   ```bash
   cd /Users/barnent1/Projects/sentra
   touch .env.local
   ```

2. **Add Supabase credentials to `.env.local`:**
   ```bash
   # Supabase Database (replace with your actual values)
   DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

   # Supabase API (optional - for auth/storage features)
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

   # Other required variables
   OPENAI_API_KEY="sk-..."
   ANTHROPIC_API_KEY="sk-ant-..."
   GITHUB_TOKEN="ghp_..."
   JWT_SECRET="your-random-secret-here"
   JWT_REFRESH_SECRET="your-other-random-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Get Supabase API keys (optional):**
   - Go to **Settings** > **API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 4: Run Database Migration

### Automated Setup (Recommended)

Run the automated setup script:

```bash
# Export DATABASE_URL
export DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Run setup script
./scripts/setup-supabase.sh
```

This will:
- Install Drizzle Kit
- Generate migration files
- Push schema to Supabase
- Verify tables were created

### Manual Setup

If you prefer manual steps:

```bash
# 1. Install Drizzle Kit
npm install -D drizzle-kit

# 2. Generate migration files
npm run drizzle:generate

# 3. Push schema to database
npm run drizzle:push

# 4. Or run migrations manually
npm run drizzle:migrate
```

---

## Step 5: Verify Database Schema

1. **Check in Supabase Dashboard:**
   - Go to **Table Editor** (left sidebar)
   - You should see these tables:
     - `users`
     - `projects`
     - `agents`
     - `costs`
     - `activities`

2. **Check via CLI:**
   ```bash
   # Install psql if not installed
   brew install postgresql@16

   # Connect to database
   psql "$DATABASE_URL"

   # List tables
   \dt

   # Check users table
   \d users

   # Exit
   \q
   ```

3. **Expected Tables:**
   ```sql
   Schema |    Name     | Type  |     Owner
   --------+-------------+-------+----------------
   public | activities  | table | postgres
   public | agents      | table | postgres
   public | costs       | table | postgres
   public | projects    | table | postgres
   public | users       | table | postgres
   ```

---

## Step 6: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/barnhardt-enterprises-inc/sentra/settings/environment-variables

2. **Add Environment Variables:**

   Click **Add Variable** for each:

   **Database:**
   - Name: `DATABASE_URL`
   - Value: Your Supabase connection string
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Supabase API (optional):**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xxxxxxxxxxxxx.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Your anon key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key
   - Environments: ✅ Production

   **Other Required:**
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GITHUB_TOKEN`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NEXT_PUBLIC_APP_URL` = `https://sentra-b3h4t0zv6-barnhardt-enterprises-inc.vercel.app`

3. **Save Variables:**
   - Click **Save** after adding each

---

## Step 7: Redeploy to Vercel

Redeploy with new environment variables:

```bash
vercel --prod
```

Or trigger redeploy from Vercel dashboard:
- Go to **Deployments**
- Click **...** on latest deployment
- Click **Redeploy**
- Check **Use existing Build Cache**
- Click **Redeploy**

---

## Step 8: Test Database Connection

1. **Test locally:**
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000
   - Try to register a new user
   - Check if data appears in Supabase Table Editor

2. **Test production:**
   - Visit https://sentra-b3h4t0zv6-barnhardt-enterprises-inc.vercel.app
   - Register a new user
   - Verify in Supabase Dashboard

---

## Step 9: Seed Database (Optional)

Add initial test data:

```bash
# Run seed script
npm run db:seed
```

This will create:
- Test user
- Sample projects
- Example activities

---

## Troubleshooting

### Connection Failed

**Error:** `could not connect to server`

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database password (common mistake)
3. Ensure your IP is allowed (Supabase allows all by default)
4. Check Supabase project is "● Active"

### SSL Connection Error

**Error:** `no pg_hba.conf entry for host`

**Solution:** Add `?sslmode=require` to connection string:
```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

### Migration Failed

**Error:** `relation "users" already exists`

**Solutions:**
1. Tables already exist - skip migration
2. Or drop tables and re-run:
   ```sql
   DROP TABLE activities, costs, agents, projects, users CASCADE;
   ```

### Drizzle Kit Not Found

**Error:** `command not found: drizzle-kit`

**Solution:**
```bash
npm install -D drizzle-kit
npx drizzle-kit --version
```

---

## Success Checklist

- [ ] Supabase project created
- [ ] Connection string obtained
- [ ] Local `.env.local` configured
- [ ] Migration run successfully
- [ ] 5 tables visible in Supabase Table Editor
- [ ] Vercel environment variables configured
- [ ] Vercel redeployed
- [ ] Local test successful
- [ ] Production test successful

---

## Next Steps

Once database is set up:

1. **Enable Supabase Auth** (optional)
   - Replace JWT auth with Supabase Auth
   - Get built-in OAuth providers
   - Use Supabase Auth helpers

2. **Enable Real-time** (optional)
   - Subscribe to database changes
   - Live project updates
   - Collaborative features

3. **Add Row Level Security (RLS)**
   - Protect user data
   - Multi-tenant security
   - Fine-grained access control

4. **Use Supabase Storage** (optional)
   - File uploads
   - Avatar images
   - Project attachments

---

## Resources

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Supabase Docs:** https://supabase.com/docs
- **Drizzle ORM Docs:** https://orm.drizzle.team
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Generated:** 2025-11-19
**Project:** Sentra
**Migration:** Prisma → Drizzle + Supabase
