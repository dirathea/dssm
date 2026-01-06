# TapLock

**Tap to Unlock Your Secrets**

TapLock is a minimalist secret manager that uses passkeys (WebAuthn) for authentication. No master passwords. Just tap your fingerprint or face to unlock your secrets. Dead simple.

## Features

- 🔑 **Passkey Authentication** - No passwords needed. Use your fingerprint or face ID.
- 🔐 **Client-Side Encryption** - Secrets are encrypted in your browser with AES-256-GCM before being sent to the server.
- 🎨 **Simple, Clean Design** - No clutter, just what you need.
- 🌐 **Public Instance or Self-Host** - Use the public instance at [TapLock.dev](https://taplock.dev) or host it yourself with Docker.

## Tech Stack

- **Backend**: Hono framework (runs on Cloudflare Workers or Node.js)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Cloudflare D1 (cloud) or SQLite (self-hosted)
- **Authentication**: WebAuthn / Passkeys
- **Encryption**: AES-256-GCM (client-side)

## Quick Start

### Self-Hosted with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/taplock.git
cd taplock

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

### Deploy to Cloudflare

```bash
# Set up D1 database
cd worker
wrangler login
wrangler d1 create taplock-db
# Copy the database_id to worker/wrangler.toml

# Run migrations
npm run d1:migrate:local

# Deploy
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
