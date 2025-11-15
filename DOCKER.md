# Docker Setup Guide

This guide explains how to build and run the Hamsfun project using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://admin:hamster1234@82.26.104.178:27017/hamsfun?authSource=admin
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_guild_id
```

**Note:** For production, update `DISCORD_REDIRECT_URI` to your production domain.

## Building and Running

### Option 1: Using Docker Compose (Recommended)

1. Create a `.env` file with your environment variables (see above)

2. Build and run the container:
   ```bash
   docker-compose up --build
   ```

3. The app will be available at `http://localhost:3000`

4. To run in detached mode (background):
   ```bash
   docker-compose up -d --build
   ```

5. To stop the container:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker directly

1. Build the Docker image:
   ```bash
   docker build -t hamsfun-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e MONGODB_URI="your_mongodb_uri" \
     -e DISCORD_CLIENT_ID="your_client_id" \
     -e DISCORD_CLIENT_SECRET="your_client_secret" \
     -e DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback" \
     -e DISCORD_BOT_TOKEN="your_bot_token" \
     -e DISCORD_GUILD_ID="your_guild_id" \
     hamsfun-app
   ```

   Or use an `.env` file:
   ```bash
   docker run -p 3000:3000 --env-file .env hamsfun-app
   ```

## Production Deployment

For production deployment:

1. Update `DISCORD_REDIRECT_URI` in your `.env` file to match your production domain
2. Use a reverse proxy (nginx, traefik, etc.) in front of the container
3. Consider using Docker secrets or a secrets management service for sensitive data
4. Set up proper logging and monitoring

## Troubleshooting

### Port already in use
If port 3000 is already in use, change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Build fails
- Make sure all dependencies are properly listed in `package.json`
- Check that `next.config.js` has `output: 'standalone'` enabled
- Clear Docker cache: `docker system prune -a`

### Container exits immediately
- Check logs: `docker-compose logs` or `docker logs <container-id>`
- Verify all required environment variables are set
- Check MongoDB connection string is correct

## Viewing Logs

```bash
# Using docker-compose
docker-compose logs -f

# Using docker directly
docker logs -f <container-id>
```

