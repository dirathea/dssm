# DSSM Deployment Guide

This guide will help you deploy the Dead Simple Secret Manager to Cloudflare using a single Worker with Assets serving (frontend + backend).

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com) (free tier works!)
2. **Node.js**: Version 18 or higher
3. **Wrangler CLI**: Install globally with `npm install -g wrangler`
4. **Git**: For version control

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd dssm

# Install all dependencies
npm run install:all
```

## Step 2: Configure Cloudflare Worker

### Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate your Cloudflare account.

### Create D1 Database

```bash
cd worker
wrangler d1 create dssm-db
```

**Important**: Copy the `database_id` from the output. You'll need it in the next step.

### Update wrangler.toml

Edit `worker/wrangler.toml` and add your `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "dssm-db"
database_id = "your-database-id-here"  # Replace with your actual database_id
```

### Set Production Environment Variables

Update the following in `worker/wrangler.toml`:

```toml
[vars]
JWT_SECRET = "your-secure-random-string-here"  # Generate a secure random string
RP_ID = "your-domain.com"  # Your actual domain (or workers.dev subdomain)
RP_NAME = "Dead Simple Secret Manager"
```

**Important**: Generate a secure JWT_SECRET:

```bash
openssl rand -base64 32
```

### Run Database Migrations

```bash
npm run d1:migrate
```

This creates the necessary tables in your D1 database.

## Step 3: Build and Deploy Everything

Now comes the easy part - deploy everything with a single command!

```bash
# From the root directory
npm run deploy
```

This command will:
1. Build the frontend (React + Vite)
2. Copy the built files to `worker/public/`
3. Deploy the Worker with Assets to Cloudflare

Your application will be deployed to:
```
https://dssm-<your-subdomain>.workers.dev
```

**That's it!** Both your frontend and API are now live at the same URL.

- Frontend (SPA): `https://dssm-<your-subdomain>.workers.dev/`
- API endpoints: `https://dssm-<your-subdomain>.workers.dev/auth/*`, `/secrets/*`

### Why This Works

The Worker uses the `assets` configuration in `wrangler.toml`:
```toml
[assets]
directory = "./public"
not_found_handling = "single-page-application"
```

This tells Cloudflare to:
- Serve static files from `worker/public/`
- Route all non-API requests to `index.html` (SPA routing)
- Cache assets at the edge globally

## Step 4: Test Your Deployment

1. Visit your deployed URL: `https://dssm-<your-subdomain>.workers.dev`

2. Click "Create one" to register a new account

3. Enter a user ID and create a passkey

4. Add a test secret

5. Verify encryption by checking the D1 database:
   ```bash
   wrangler d1 execute dssm-db --command="SELECT * FROM secrets"
   ```

   You should see encrypted values, not plaintext!

## Optional: Custom Domain

Since frontend and backend are served from the same Worker, you only need **one custom domain**!

1. Go to Workers dashboard → Your worker (`dssm-worker`) → Triggers

2. Click "Add Custom Domain"

3. Add your domain (e.g., `vault.yourdomain.com`)

4. Follow DNS setup instructions (add CNAME record)

5. Update `RP_ID` in `wrangler.toml`:
   ```toml
   [vars]
   RP_ID = "vault.yourdomain.com"
   ```

6. Redeploy:
   ```bash
   npm run deploy
   ```

**That's it!** Both your frontend and API will be available at `https://vault.yourdomain.com`

No CORS configuration needed since everything is same-origin!

## Troubleshooting

### Passkeys Not Working

- Check that `RP_ID` in `wrangler.toml` matches your deployed domain
- Ensure HTTPS is enabled (automatic with Cloudflare)
- Verify you're using a modern browser with WebAuthn support

### Database Errors

- Ensure migrations ran successfully: `npm run d1:migrate`
- Check D1 binding name matches `wrangler.toml`: `binding = "DB"`
- Verify database_id is set in wrangler.toml

### Frontend Not Loading

- Ensure frontend was built: `npm run build`
- Check that `worker/public/` contains the built files
- Verify assets configuration in `wrangler.toml`

### Authentication Fails

- Generate a new secure JWT_SECRET
- Redeploy Worker after changing secrets
- Clear browser cookies and try again

## Monitoring

### View Logs

```bash
# Worker logs
wrangler tail

# D1 queries
wrangler d1 execute dssm-db --command="SELECT COUNT(*) FROM users"
```

### Analytics

View analytics in Cloudflare Dashboard:
- Workers → Your worker → Analytics
- Pages → Your project → Analytics

## Security Checklist

- [ ] Generated secure JWT_SECRET
- [ ] Updated CORS to only allow your domains
- [ ] Set RP_ID to your actual domain
- [ ] Enabled HTTPS (automatic with Cloudflare)
- [ ] Tested passkey registration and login
- [ ] Verified secrets are encrypted in database
- [ ] Set up rate limiting (optional, using Workers KV)

## Cost

On Cloudflare's free tier:
- **Workers**: 100,000 requests/day
- **D1**: 5 million reads, 100,000 writes per day
- **Pages**: Unlimited requests

This is more than enough for personal use!

## Updating

```bash
# Update Worker
cd worker
git pull
npm install
npm run deploy

# Update Frontend
cd ../frontend
git pull
npm install
npm run build
# If using direct upload:
wrangler pages deploy dist --project-name=dssm
# If using GitHub integration, just push to trigger rebuild
```

## Backup

### Backup D1 Database

```bash
# Export all data
wrangler d1 export dssm-db --output=backup.sql

# Backup to local file
wrangler d1 execute dssm-db --command="SELECT * FROM secrets" > secrets-backup.json
```

### Restore D1 Database

```bash
wrangler d1 execute dssm-db --file=backup.sql
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cloudflare Workers/Pages docs
3. Open an issue on GitHub

Enjoy your Dead Simple Secret Manager! 🔒
