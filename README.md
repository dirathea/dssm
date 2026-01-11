# TapLock

**Tap to Unlock Your Secrets**

TapLock is a minimalist secret manager that uses passkeys (WebAuthn) for authentication. No master passwords. Just tap your fingerprint or face to unlock your secrets. Dead simple.

<a href="https://www.buymeacoffee.com/dirathea" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Features

- 🔑 **Passkey Authentication** - No passwords needed. Use your fingerprint or face ID.
- 🔐 **Client-Side Encryption** - Secrets are encrypted in your browser with AES-256-GCM before being sent to the server.
- 🎨 **Simple, Clean Design** - No clutter, just what you need.
- 🌐 **Public Instance or Self-Host** - Use the public instance at [app.TapLock.dev](https://app.taplock.dev) or host it yourself with Docker.

## Tech Stack

- **Backend**: Hono framework (runs on Cloudflare Workers or Node.js)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Cloudflare D1 (cloud) or SQLite (self-hosted)
- **Authentication**: WebAuthn / Passkeys
- **Encryption**: AES-256-GCM (client-side)

## Quick Start

## Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dirathea/taplockdev)

**One-click deployment** that automatically:
- ✅ Creates a D1 database and runs migrations
- ✅ Deploys the Worker and frontend to Cloudflare's edge network
- ✅ Prompts you to configure JWT_SECRET, RP_ID, and RP_NAME

### After Deployment

Once deployed, your app will be available at:
```
https://taplock-worker.<YOUR_ACCOUNT>.workers.dev
```

**Important Configuration Steps**:

1. **Verify JWT_SECRET**:
   - Ensure you used a secure random value during deployment
   - Generate with: `openssl rand -base64 32`
   - Never share this secret or commit it to version control

2. **Test WebAuthn**:
   - HTTPS is required (automatic with Cloudflare)
   - Register a new passkey to verify authentication works
   - If you change domains later, users need to re-register passkeys

3. **Add Custom Domain** (optional):
   - Go to **Cloudflare Dashboard** → **Workers & Pages** → `taplock-worker`
   - Navigate to **Settings** → **Domains & Routes** → **Add** → **Custom Domain**
   - Enter your domain (e.g., `app.yourdomain.com`)
   - **Important**: After adding custom domain, update `RP_ID`:
     - Go to **Settings** → **Variables and Secrets**
     - Edit `RP_ID` to match your custom domain exactly
     - Click **Save and Deploy**

**Why update RP_ID?** WebAuthn requires the Relying Party ID to match your domain exactly for passkeys to work.

---

### Self-Hosted with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/taplock.git
cd taplock

# Set up environment variables
cp .env.example .env
# Generate a secure JWT_SECRET
openssl rand -base64 32 >> .env

# Start with Docker Compose
docker compose up -d

# Access at http://localhost:8787
```

### Development

```bash
# Install all dependencies
npm run install:all

# Run development server
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:8787
```

### Manual Deployment to Cloudflare

**Note**: If you used the "Deploy to Cloudflare" button above, skip this section. The manual steps below are for advanced users who prefer complete control over the deployment process.

```bash
# Set up D1 database
cd worker
wrangler login
wrangler d1 create taplock-db
# Copy the database_id to wrangler.toml

# Run migrations
npx wrangler d1 migrations apply DB --remote

# Set JWT secret
npx wrangler secret put JWT_SECRET
# (paste your generated secret when prompted)

# Deploy
cd ..
npm run deploy
```

## How It Works

### Registration
1. Choose a user ID (e.g., "alice")
2. Create a passkey using your fingerprint or face ID
3. Your encryption key is derived from the passkey credential

### Login
1. Enter your user ID
2. Tap to authenticate with your passkey
3. Your encryption key is re-derived to decrypt your secrets

### Security Model
- Secrets are encrypted client-side with AES-256-GCM
- Encryption key is derived from passkey credential ID using PBKDF2
- Server stores only encrypted secrets - zero knowledge
- Recovery codes provided for account recovery

## Project Structure

```
taplock/
├── worker/          # Backend (Hono + Drizzle ORM)
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── schema.ts     # Database schema
│   │   ├── auth.ts       # WebAuthn logic
│   │   ├── repositories/ # Data access layer
│   │   └── handlers/     # API handlers
│   └── drizzle/          # Database migrations
├── frontend/        # React frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── components/   # UI components
│       ├── api.ts        # API client
│       └── crypto.ts     # Encryption utilities
├── Dockerfile       # Docker build
└── docker-compose.yml
```

## License

MIT
