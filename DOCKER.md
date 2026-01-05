# DSSM Docker Self-Hosting Guide

Complete guide for self-hosting Dead Simple Secret Manager using Docker.

## Quick Start

### Prerequisites

- Docker 20.10+ installed
- Docker Compose (included with Docker Desktop)
- 100MB disk space for image
- Port 3000 available (or customize)

### 1-Minute Setup

```bash
# Clone repository
git clone https://github.com/yourusername/dssm.git
cd dssm

# Start server
docker-compose up -d

# Visit http://localhost:3000
```

That's it! DSSM is now running with:
- ✅ SQLite database (persisted in Docker volume)
- ✅ Automatic schema migrations
- ✅ Production-ready configuration

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

**Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT token signing | Generate with `openssl rand -base64 32` |
| `RP_ID` | WebAuthn Relying Party ID (your domain) | `localhost` or `vault.yourdomain.com` |
| `RP_NAME` | Display name for passkeys | `My Secret Vault` |

**Optional Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to expose |
| `NODE_ENV` | `production` | Environment mode |
| `DB_PATH` | `/app/data/dssm.db` | Database file location |

### Example .env for Production

```bash
# Security (REQUIRED!)
JWT_SECRET=your-super-secure-random-secret-generated-with-openssl

# WebAuthn
RP_ID=vault.yourdomain.com
RP_NAME=My Company Secrets

# Server
PORT=3000
NODE_ENV=production
```

## Deployment Options

### Option 1: Using Pre-built Image (Recommended)

Pull from GitHub Container Registry:

```bash
docker pull ghcr.io/dirathea/dssm:latest

docker run -d \
  --name dssm \
  -p 3000:3000 \
  -e JWT_SECRET="your-secret-here" \
  -e RP_ID="localhost" \
  -v dssm-data:/app/data \
  ghcr.io/dirathea/dssm:latest
```

### Option 2: Build from Source

```bash
# Build image
docker build -t dssm:local .

# Run container
docker run -d \
  --name dssm \
  -p 3000:3000 \
  -e JWT_SECRET="your-secret-here" \
  -e RP_ID="localhost" \
  -v dssm-data:/app/data \
  dssm:local
```

### Option 3: Docker Compose (Best for local development)

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes (deletes database!)
docker-compose down -v
```

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Generate secure `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Set `RP_ID` to your actual domain (e.g., `vault.company.com`)
- [ ] Enable HTTPS (required for WebAuthn)
- [ ] Configure firewall to allow only necessary ports
- [ ] Set up automatic backups (see below)
- [ ] Enable monitoring and health checks
- [ ] Review Docker security options in docker-compose.yml

### HTTPS Setup with Caddy

Caddy provides automatic SSL certificates from Let's Encrypt.

**docker-compose.caddy.yml:**

```yaml
version: '3.8'

services:
  dssm:
    image: ghcr.io/dirathea/dssm:latest
    restart: unless-stopped
    environment:
      JWT_SECRET: ${JWT_SECRET}
      RP_ID: ${DOMAIN}
      RP_NAME: ${RP_NAME:-DSSM}
    volumes:
      - dssm-data:/app/data
    networks:
      - dssm-net

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - dssm-net
    environment:
      DOMAIN: ${DOMAIN}

volumes:
  dssm-data:
  caddy-data:
  caddy-config:

networks:
  dssm-net:
```

**Caddyfile:**

```caddyfile
{$DOMAIN} {
    reverse_proxy dssm:3000
    
    encode gzip zstd
    
    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
    }
}
```

**Start with HTTPS:**

```bash
export DOMAIN=vault.yourdomain.com
export JWT_SECRET=$(openssl rand -base64 32)
export RP_NAME="My Secret Vault"

docker-compose -f docker-compose.caddy.yml up -d
```

## Database Management

### Backup

**Method 1: Volume Backup (Recommended)**

```bash
# Create backup
docker run --rm \
  -v dssm-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/dssm-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# List backups
ls -lh backups/
```

**Method 2: Direct Database Copy**

```bash
# Copy database file
docker cp dssm:/app/data/dssm.db ./backups/dssm-$(date +%Y%m%d).db

# Verify backup
sqlite3 ./backups/dssm-$(date +%Y%m%d).db "SELECT COUNT(*) FROM users;"
```

### Restore

**From volume backup:**

```bash
# Stop container
docker-compose down

# Restore backup
docker run --rm \
  -v dssm-data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/dssm-backup-YYYYMMDD-HHMMSS.tar.gz -C /data"

# Start container
docker-compose up -d
```

**From database file:**

```bash
docker cp ./backups/dssm-20260105.db dssm:/app/data/dssm.db
docker restart dssm
```

### Automated Backups

Add to crontab for daily backups:

```bash
# Edit crontab
crontab -e

# Add line (runs daily at 2 AM)
0 2 * * * cd /path/to/dssm && docker run --rm -v dssm-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/dssm-backup-$(date +\%Y\%m\%d).tar.gz -C /data . && find ./backups -name "dssm-backup-*.tar.gz" -mtime +30 -delete
```

## Monitoring & Debugging

### Health Check

```bash
# Check if server is healthy
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","runtime":"node","timestamp":1704499200000}
```

### View Logs

```bash
# Real-time logs
docker logs -f dssm

# Last 100 lines
docker logs --tail 100 dssm

# Logs with timestamps
docker logs -t dssm
```

### Container Stats

```bash
# Resource usage
docker stats dssm

# Disk usage
docker system df
```

### Database Inspection

```bash
# Interactive SQLite shell
docker exec -it dssm sh -c "sqlite3 /app/data/dssm.db"

# Run query
docker exec dssm sqlite3 /app/data/dssm.db "SELECT COUNT(*) FROM secrets;"
```

## Upgrading

### Update to Latest Version

```bash
# Pull latest image
docker pull ghcr.io/dirathea/dssm:latest

# Backup first!
docker cp dssm:/app/data/dssm.db ./backups/pre-upgrade-backup.db

# Restart with new image
docker-compose down
docker-compose up -d

# Verify health
curl http://localhost:3000/api/health
```

### Rollback

If upgrade fails:

```bash
# Use specific version
docker pull ghcr.io/dirathea/dssm:v1.0.0

# Update docker-compose.yml
image: ghcr.io/dirathea/dssm:v1.0.0

# Restart
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env or docker-compose.yml
PORT=8080

# Or use different host port
docker run -p 8080:3000 ...
```

### Permission Errors

```bash
# Fix volume permissions
docker exec -u root dssm chown -R node:node /app/data
```

### Passkeys Not Working

**Check RP_ID matches your domain:**
- For localhost: `RP_ID=localhost`
- For production: `RP_ID=vault.yourdomain.com` (no http://, no port)

**Ensure HTTPS is enabled:**
- WebAuthn requires HTTPS in production
- localhost works with HTTP for testing

**Clear browser data:**
- Changing RP_ID requires clearing existing passkeys

### Database Locked

```bash
# Check for WAL files
docker exec dssm ls -la /app/data/

# If corrupted, restore from backup
docker cp ./backups/dssm-backup.db dssm:/app/data/dssm.db
docker restart dssm
```

### Container Won't Start

```bash
# Check logs
docker logs dssm

# Common issues:
# - Missing JWT_SECRET: Set environment variable
# - Port conflict: Change PORT in .env
# - Volume permission: Run as root to fix permissions
```

## Performance Tuning

### Resource Limits

Add to docker-compose.yml:

```yaml
services:
  dssm:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### SQLite Optimization

Database is automatically configured with WAL mode for better concurrency. No tuning needed for most use cases.

For high-traffic scenarios, consider:
- Increasing container resources
- Using SSD storage for volumes
- Regular VACUUM operations

## Migration from Docker to Cloudflare

Future feature - export database and import to D1:

```bash
# Export secrets (future tool)
docker exec dssm node dist/export.js > secrets.json

# Import to Cloudflare D1 (future tool)
wrangler d1 execute dssm-db --file=secrets.sql
```

## Support

### Useful Commands

```bash
# Restart container
docker restart dssm

# View environment variables
docker exec dssm env | grep -E 'JWT|RP_'

# Shell access
docker exec -it dssm sh

# Remove everything (including data!)
docker-compose down -v
docker volume rm dssm-data
```

### Getting Help

1. Check logs: `docker logs dssm`
2. Verify health: `curl http://localhost:3000/api/health`
3. Review environment variables
4. Check GitHub issues
5. Ensure HTTPS for production

## Security Best Practices

1. **Never expose port 3000 directly to internet** - Use reverse proxy (Caddy/Nginx)
2. **Rotate JWT_SECRET periodically** - Users will need to re-login
3. **Enable automatic security updates** on host system
4. **Use Docker secrets** for sensitive environment variables in production
5. **Enable firewall** on host machine
6. **Monitor logs** for suspicious activity
7. **Backup regularly** and test restores

## License

MIT - See LICENSE file for details
