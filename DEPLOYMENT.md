# TapLock Deployment Guide

This guide covers deploying TapLock to Cloudflare Workers with D1 database, including automatic preview deployments for PRs via GitHub integration.

## Quick Deploy (Recommended)

The fastest way to deploy TapLock is using the **Deploy to Cloudflare** button:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dirathea/taplockdev)

This automates:
- ✅ D1 database creation and migrations
- ✅ Worker deployment with asset serving
- ✅ Configuration prompts for secrets and environment variables

**After deployment**, you'll receive a URL like:
```
https://taplock-worker.<YOUR_ACCOUNT>.workers.dev
```

**Next Steps**:
1. Visit your deployed URL and test passkey registration
2. (Optional) Add a custom domain via Cloudflare Dashboard
3. (Optional) Set up GitHub integration for automatic deployments

See the [post-deployment configuration steps in README.md](./README.md#after-deployment) for detailed setup instructions.

---

## Manual Setup (Advanced)

If you prefer manual control over the deployment process or need to set up preview environments, follow the detailed steps below.

## Architecture Overview

```
GitHub Repository
       |
       v
Cloudflare Workers Builds (GitHub Integration)
       |
       +---> main branch ---> taplock-worker (app.taplock.dev)
       |                            |
       |                            v
       |                      taplock-db (production)
       |
       +---> PR branches ---> taplock-worker-preview (*.workers.dev)
                                    |
                                    v
                              taplock-db-preview (shared)
```

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18 or higher
3. **Domain**: Optional but recommended (e.g., `taplock.dev` on Cloudflare)

## Initial Setup (One-Time)

### Step 1: Install Dependencies

```bash
git clone <your-repo-url>
cd taplock
npm run install:all
```

### Step 2: Authenticate with Cloudflare

```bash
npx wrangler login
```

### Step 3: Create D1 Databases

```bash
# Production database
npx wrangler d1 create taplock-db

# Preview database (for PR deployments)
npx wrangler d1 create taplock-db-preview
```

**Important**: Copy both `database_id` values from the output.

### Step 4: Update wrangler.toml

Edit `wrangler.toml` at the project root and add your database IDs:

```toml
# Production database
[[d1_databases]]
binding = "DB"
database_name = "taplock-db"
database_id = "your-production-database-id"  # <-- Add this
migrations_dir = "worker/drizzle"

# Preview database (in [env.preview] section)
[[env.preview.d1_databases]]
binding = "DB"
database_name = "taplock-db-preview"
database_id = "your-preview-database-id"  # <-- Add this
migrations_dir = "worker/drizzle"
```

### Step 5: Run Database Migrations

```bash
# Production database
npx wrangler d1 migrations apply taplock-db --remote

# Preview database
npx wrangler d1 migrations apply taplock-db-preview --remote --env preview
```

### Step 6: Set Secrets

Secrets are stored securely in Cloudflare, not in config files.

```bash
# Generate a secure secret
openssl rand -base64 32

# Set for production
npx wrangler secret put JWT_SECRET
# (paste your generated secret when prompted)

# Set for preview environment
npx wrangler secret put JWT_SECRET --env preview
# (can use the same or different secret)
```

### Step 7: Initial Deployment

Deploy both environments to create the Workers:

```bash
# Deploy production
npm run deploy

# Deploy preview
npm run deploy:preview
```

### Step 8: Add Custom Domain (Production)

1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Select `taplock-worker`
3. Go to **Settings** > **Domains & Routes**
4. Click **Add** > **Custom Domain**
5. Enter `app.taplock.dev` (or your domain)
6. Cloudflare auto-configures DNS if the domain is on Cloudflare

**Important**: After adding custom domain, update RP_ID:
1. Go to **Settings** > **Variables and Secrets**
2. Edit `RP_ID` environment variable to match your custom domain
3. Click **Save and Deploy**
4. Users will need to re-register their passkeys after domain change

### Step 9: Add Preview Domain

1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Select `taplock-worker-preview`
3. Go to **Settings** > **Domains & Routes**
4. Click **Add** > **Custom Domain**
5. Enter `preview.taplock.dev`

## GitHub Integration (Automatic Deployments)

### Connect Repository

1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Select `taplock-worker`
3. Go to **Settings** > **Builds** > **Build configuration**
4. Click **Connect** and select your GitHub repository

### Configure Build Settings

| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Root directory | *(leave empty)* |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

### Enable Preview Deployments

1. In the same **Build configuration** section
2. Enable **Builds on non-production branches**
3. Set **Non-production deploy command**: `npx wrangler deploy --env preview`

### How It Works After Setup

| Action | Result |
|--------|--------|
| Push to `main` | Auto-deploys to `app.taplock.dev` |
| Open PR | Auto-deploys preview to `*.workers.dev` URL |
| Merge PR | Auto-deploys to `app.taplock.dev` |

## Local Development

### Setup Local Environment

```bash
# Copy the example env file
cp .dev.vars.example .dev.vars

# Edit .dev.vars and set your local JWT_SECRET
```

### Run Development Server

```bash
npm run dev
```

This will:
- Build the frontend with watch mode
- Start wrangler dev server at `http://localhost:8787`
- Use local SQLite database (persisted to `.wrangler/state`)

## Project Structure

```
taplock/
├── wrangler.toml          # Cloudflare Worker config (environments)
├── .dev.vars              # Local dev secrets (gitignored)
├── .dev.vars.example      # Template for local secrets
├── public/                # Frontend build output (gitignored)
├── frontend/              # React + Vite frontend
├── worker/                # Cloudflare Worker backend
│   ├── src/               # Worker source code
│   └── drizzle/           # Database migrations
└── package.json           # Root scripts
```

## Available Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build frontend only |
| `npm run deploy` | Build + deploy to production |
| `npm run deploy:preview` | Build + deploy to preview |
| `npm run install:all` | Install all dependencies |

### Worker Level (from `worker/` directory)

| Command | Description |
|---------|-------------|
| `npm run d1:create` | Create production D1 database |
| `npm run d1:create:preview` | Create preview D1 database |
| `npm run d1:migrate:local` | Run migrations locally |
| `npm run d1:migrate:remote` | Run migrations on production |
| `npm run d1:migrate:preview` | Run migrations on preview |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run start` | Run self-hosted Node.js server |

## Environment Configuration

### Production (`app.taplock.dev`)

| Variable | Value |
|----------|-------|
| `RP_ID` | `app.taplock.dev` |
| `RP_NAME` | `TapLock` |
| `JWT_SECRET` | Set via `wrangler secret put` |
| Database | `taplock-db` |

### Preview (`preview.taplock.dev`)

| Variable | Value |
|----------|-------|
| `RP_ID` | `preview.taplock.dev` |
| `RP_NAME` | `TapLock Preview` |
| `JWT_SECRET` | Set via `wrangler secret put --env preview` |
| Database | `taplock-db-preview` |

### Local Development

| Variable | Value |
|----------|-------|
| `RP_ID` | `localhost` (auto-set by wrangler) |
| `JWT_SECRET` | Set in `.dev.vars` |
| Database | Local SQLite |

## Troubleshooting

### Passkeys Not Working

- Ensure `RP_ID` matches your deployed domain exactly
- HTTPS is required (automatic with Cloudflare)
- Clear browser data and re-register if domain changed

### Database Errors

```bash
# Check migrations status
npx wrangler d1 migrations list taplock-db --remote

# Re-run migrations
npx wrangler d1 migrations apply taplock-db --remote
```

### Preview Deployments Not Working

- Ensure preview database has migrations applied
- Check that `JWT_SECRET` is set for preview env
- Verify GitHub integration is connected

### Build Failures

```bash
# Clean and rebuild
rm -rf public/ node_modules/
npm run install:all
npm run build
```

## Backup & Restore

### Export Database

```bash
npx wrangler d1 export taplock-db --remote --output=backup.sql
```

### Restore Database

```bash
npx wrangler d1 execute taplock-db --remote --file=backup.sql
```

## Security Checklist

- [ ] JWT_SECRET set via `wrangler secret put` (not in config files)
- [ ] RP_ID matches your actual domain
- [ ] HTTPS enabled (automatic with Cloudflare)
- [ ] Preview environment uses separate database
- [ ] `.dev.vars` is gitignored

## Cost (Cloudflare Free Tier)

- **Workers**: 100,000 requests/day
- **D1**: 5 million reads, 100,000 writes per day
- **Custom domains**: Free with Cloudflare DNS

More than enough for personal use!
