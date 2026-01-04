# DSSM - Dead Simple Secret Manager

A minimalist, secure secret manager with passkey authentication. No passwords, just your biometrics or device PIN.

## Features

- **Passkey Authentication**: WebAuthn-based login using biometrics or device PIN
- **Client-Side Encryption**: Secrets are encrypted in your browser before being sent to the server
- **Zero-Knowledge Architecture**: The server cannot decrypt your secrets
- **Neobrutalism Design**: Bold, fun, and approachable UI
- **Edge Deployed**: Runs on Cloudflare's global network for low latency
- **Free Tier**: Deploy and run for free on Cloudflare

## Tech Stack

- **Backend**: Cloudflare Workers (Hono framework)
- **Frontend**: React + Vite + shadcn/ui
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Authentication**: WebAuthn / Passkeys
- **Encryption**: AES-256-GCM (client-side)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up D1 database
cd worker
wrangler login
npm run d1:create
# Copy the database_id from output and add to worker/wrangler.toml

# Run migrations
npm run d1:migrate
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:worker    # Worker runs on http://localhost:8787
npm run dev:frontend  # Frontend runs on http://localhost:5173
```

### Deployment

```bash
# Single command to build frontend and deploy everything
npm run deploy

# This will:
# 1. Build the frontend (React + Vite)
# 2. Copy built files to worker/public/
# 3. Deploy Worker with static assets to Cloudflare
```

The entire application (frontend + backend + D1) is deployed as a single Worker with Assets serving. Both UI and API are available at the same URL!

## Project Structure

```
dssm/
├── worker/          # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── db.ts         # D1 database queries
│   │   ├── auth.ts       # WebAuthn logic
│   │   └── handlers/     # API handlers
│   └── schema.sql        # Database schema
├── frontend/        # React frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── components/   # UI components
│       ├── api.ts        # API client
│       └── crypto.ts     # Encryption utilities
└── README.md
```

## How It Works

### Registration
1. Choose a user ID (e.g., "alice")
2. Create a passkey using your biometrics or device PIN
3. Your encryption key is derived from the passkey credential

### Login
1. Enter your user ID
2. Authenticate with your passkey
3. Your encryption key is re-derived to decrypt your secrets

### Security Model
- Secrets are encrypted client-side with AES-256-GCM
- Encryption key is derived from passkey credential ID using PBKDF2
- Server stores only encrypted secrets - zero knowledge
- If you lose your passkey, your secrets are unrecoverable (by design)

## License

MIT
